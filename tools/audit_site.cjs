/* Run after: npm install --prefix build/browser-check playwright
 * npx --prefix build/browser-check playwright install chromium
 * node tools/audit_site.cjs
 * Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE points to an existing Chromium. */
const { chromium } = require('../build/browser-check/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const site = path.resolve(__dirname, '../site');
const data = {};
vm.runInNewContext(fs.readFileSync(path.join(site, 'data/content.js'), 'utf8'), { window: data });
vm.runInNewContext(fs.readFileSync(path.join(site, 'data/ar.js'), 'utf8'), { window: data });
const en = JSON.parse(JSON.stringify(data.TARTEEL)), ar = JSON.parse(JSON.stringify(data.TARTEEL_AR));
assert.deepEqual(ar.cards.map(c => c.id), en.cards.map(c => c.id));
assert.deepEqual(ar.decks.map(c => c.cards), en.decks.map(c => c.cards));
for (const [id, frag] of Object.entries(en.frags)) {
  for (const field of ['html', 'plain', 'audio', 'surah', 'ayah', 'page']) assert.equal(ar.frags[id][field], frag[field]);
  assert.ok(fs.existsSync(path.join(site, frag.audio)), `Missing audio: ${frag.audio}`);
}
for (const lesson of Object.values(ar.lessons)) {
  for (const value of [lesson.title, lesson.summary, ...lesson.explain, ...lesson.how]) assert.ok(/[\u0600-\u06ff]/.test(value));
}
for (const card of ar.cards.filter(c => c.t === 'c')) {
  assert.ok(/[\u0600-\u06ff]/.test(card.q));
  assert.ok(/[\u0600-\u06ff]/.test(card.a));
}
for (const deck of en.decks) for (const id of deck.cards) assert.ok(en.cards.some(c => c.id === id));
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html');
  if (!file.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404).end(); return; }
    const mime = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(body);
  });
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
  const errors = [], untranslated = new Set(), overflow = [];
  let pagesChecked = 0;
  try {
    for (const lang of ['en', 'ar']) {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(base + '?lang=' + lang);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
      const routes = ['/', '/path', '/practice', '/symbols', '/colors', '/about', ...en.levels.map(l => '/level/' + l.level), ...Object.keys(en.lessons).flatMap(id => ['learn', 'see', 'try'].map(s => `/lesson/${id}/${s}`))];
      for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
        for (const route of routes) {
          await page.evaluate(hash => { location.hash = hash; }, '#' + route);
          await page.waitForFunction(hash => location.hash === hash, '#' + route);
          await page.waitForTimeout(8);
          assert.ok(!await page.locator('#app').innerText().then(t => /Something went wrong|حدث خطأ/.test(t)), route);
          const result = await page.evaluate(() => {
            const root = document.querySelector('#app'), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), english = []; let n;
            while ((n = walker.nextNode())) if (/[a-z]{3}/i.test(n.textContent) && n.parentElement.getClientRects().length && !n.parentElement.closest('script,style')) english.push(n.textContent.trim());
            const wide = [...root.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > document.documentElement.clientWidth + 1 || r.left < -1) && getComputedStyle(e).position !== 'absolute'; }).map(e => e.className);
            if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 || window.scrollX !== 0) wide.push('document');
            return { english, wide };
          });
          if (lang === 'ar') result.english.filter(t => /[a-z]{3}/i.test(t.replace(/Anki|Quran\.com|EveryAyah\.com|IBM Plex Sans Arabic|DM Sans|DM Mono|SIL Open Font License/g, ''))).forEach(t => untranslated.add(t));
          if (result.wide.length) overflow.push({ lang, width, theme, route, elements: result.wide });
          pagesChecked++;
        }
      }
      // Completing a session disables grading keys; restart still works.
      await page.evaluate(() => { localStorage.setItem('tarteel.v1', JSON.stringify({ cards: {}, lessons: {}, days: {}, settings: { newPerDay: 1, types: { c: true } } })); location.hash = '/practice/lesson-welcome-colors'; });
      await page.reload();
      await page.locator('button[data-act="flip"]').click();
      await page.locator('[data-grade="2"]').click();
      await page.locator('[data-act="again-session"]').waitFor();
      const completedState = await page.evaluate(() => localStorage.getItem('tarteel.v1'));
      await page.keyboard.press('1'); await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => localStorage.getItem('tarteel.v1')), completedState);
      await page.locator('[data-act="again-session"]').click();
      await page.locator('button[data-act="flip"]').waitFor();
      // Every flashcard type: front, answer, grade, and subsequent card.
      for (const [type, deck] of [['r', 'lesson-surah-112'], ['i', 'lesson-idhhar'], ['c', 'lesson-welcome-colors'], ['s', 'symbols'], ['k', 'colors']]) {
        await page.evaluate(({ type, deck }) => {
          const state = { cards: {}, lessons: {}, days: {}, settings: { mode: 'free', types: { r: false, i: false, c: false, s: false, k: false } } };
          state.settings.types[type] = true; localStorage.setItem('tarteel.v1', JSON.stringify(state)); location.hash = '/practice/' + deck;
        }, { type, deck });
        await page.reload();
        if (type === 'i') await page.locator('[data-opt]').first().click(); else await page.locator('button[data-act="flip"]').click();
        if (lang === 'ar') {
          const answer = await page.locator('#app').innerText();
          assert.ok(!/Show answer|Listen|Correct!|Not quite|This is|Which|What is|Lesson:/.test(answer), answer);
        }
        const audio = page.locator('[data-audio]').first();
        if (await audio.count()) { await audio.click(); await page.waitForTimeout(30); assert.ok(await page.locator('#player').evaluate(p => !!p.currentSrc)); }
        if (type === 'i') await page.locator('[data-act="continue"]').click(); else await page.locator('[data-grade="2"]').click();
      }
      // Filtered cards must never complete a lesson.
      await page.evaluate(() => { localStorage.setItem('tarteel.v1', JSON.stringify({ settings: { types: { c: false, r: false, i: false, s: false, k: false } } })); location.hash = '/lesson/harakat/try'; });
      await page.reload();
      assert.ok(await page.locator('#app').innerText().then(t => /No cards match|لا تطابق/.test(t)));
      assert.ok(!await page.evaluate(() => JSON.parse(localStorage.getItem('tarteel.v1')).lessons.harakat.done));
      // Completed-course action returns to the path, and switching language retains route and progress.
      await page.evaluate(ids => { const s = { cards: {}, lessons: {}, days: {}, settings: {} }; ids.forEach(id => s.lessons[id] = { done: true }); localStorage.setItem('tarteel.v1', JSON.stringify(s)); location.hash = '/'; }, Object.keys(en.lessons));
      await page.reload();
      assert.equal(await page.locator('.hero .btn').first().getAttribute('href'), '#/path');
      await page.locator('#btn-language').click();
      await page.waitForLoadState('load');
      assert.equal(await page.locator('html').getAttribute('lang'), lang === 'ar' ? 'en' : 'ar');
      assert.equal(await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('tarteel.v1')).lessons).filter(l => l.done).length), 52);
      if (lang === 'en') {
        fs.mkdirSync(path.resolve(__dirname, '../build/audit'), { recursive: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
        await page.screenshot({ path: path.resolve(__dirname, '../build/audit/arabic-mobile.png'), fullPage: true });
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; location.hash = '/lesson/idhhar/learn'; });
        await page.waitForTimeout(80);
        await page.screenshot({ path: path.resolve(__dirname, '../build/audit/arabic-lesson.png'), fullPage: true });
      }
      await context.close();
    }
    // Language switch: in place, no reload, and nothing the learner was doing is lost.
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      // Every settings click must act exactly once, however often the page was visited.
      const checkSettings = async () => {
        for (let visit = 0; visit < 3; visit++) {
          await page.evaluate(() => { location.hash = '/path'; });
          await page.locator('#lesson-search').waitFor();
          await page.evaluate(() => { location.hash = '/practice'; });
          await page.locator('#practice-settings').waitFor();
        }
        const toggle = page.locator('.toggle[data-type="c"]');
        await page.locator('details.more summary').click();
        const counts = await page.locator('.deck .counts').first().innerText();
        for (const expected of ['false', 'true', 'false', 'true', 'false', 'true']) {
          await toggle.click();
          assert.equal(await toggle.getAttribute('aria-pressed'), expected, 'A settings click must flip exactly once');
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('tarteel.v1')).settings.types.c), expected === 'true');
        }
        assert.equal(await page.locator('.deck .counts').first().innerText(), counts);
        assert.ok(await toggle.evaluate(b => b === document.activeElement), 'Focus stays on the setting');
        assert.ok(await page.locator('details.more').evaluate(d => d.open), 'An open section stays open');
        await toggle.click();
        assert.notEqual(await page.locator('.deck .counts').first().innerText(), counts, 'Turning off a card type updates the counts');
        await toggle.click();
        const mode = page.locator('.toggle[data-mode="free"]'), smart = page.locator('.toggle[data-mode="smart"]');
        await mode.click();
        assert.equal(await mode.getAttribute('aria-pressed'), 'true');
        assert.equal(await smart.getAttribute('aria-pressed'), 'false');
        await smart.click();
        assert.equal(await smart.getAttribute('aria-pressed'), 'true');
        const autoplay = page.locator('.toggle[data-autoplay]');
        for (const expected of ['true', 'false', 'true', 'false']) {
          await autoplay.click();
          assert.equal(await autoplay.getAttribute('aria-pressed'), expected);
        }
        const elapsed = await toggle.evaluate(b => { const t = performance.now(); for (let i = 0; i < 20; i++) b.click(); return performance.now() - t; });
        assert.ok(elapsed < 2000, `20 settings clicks took ${Math.round(elapsed)}ms`);
      };
      await page.goto(base + '#/practice/lesson-idhhar');
      const unversioned = await page.evaluate(() => [...document.querySelectorAll('script[src], link[rel="stylesheet"]')].map(e => e.getAttribute('src') || e.getAttribute('href')).filter(u => !/\?v=[0-9a-f]{10}$/.test(u)));
      assert.deepEqual(unversioned, [], 'Every script and stylesheet must carry a content hash');
      await page.evaluate(() => { window.__sameDocument = true; });
      const historyBefore = await page.evaluate(() => history.length);
      await page.locator('button[data-act="flip"]').click();
      await page.locator('[data-grade="2"]').click();
      await page.locator('button[data-act="flip"]').click();
      const progressBefore = await page.locator('.session-top .count').innerText();
      await page.locator('#btn-language').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'ar');
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
      assert.ok(await page.evaluate(() => window.__sameDocument), 'Switching must not reload the page');
      assert.equal(await page.evaluate(() => history.length), historyBefore, 'Switching must not add history entries');
      assert.ok(page.url().includes('lang=ar') && page.url().endsWith('#/practice/lesson-idhhar'));
      assert.equal(await page.locator('.nav a').first().innerText(), 'الرئيسية');
      assert.equal(await page.locator('#btn-language').innerText(), 'English');
      assert.equal(await page.locator('.session-top .count').innerText(), progressBefore, 'Session position must survive');
      assert.ok(await page.locator('.grades').isVisible(), 'The revealed answer must stay revealed');
      assert.ok(await page.locator('#btn-language').evaluate(b => b === document.activeElement), 'Focus stays on the switch');
      await page.locator('#btn-language').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      assert.equal((await page.locator('.nav a').first().innerText()).toLowerCase(), 'home');
      assert.ok(/Madinah Mushaf/.test(await page.locator('.foot').innerText()), 'Footer returns to English');
      assert.equal(await page.locator('.session-top .count').innerText(), progressBefore);
      assert.ok(await page.title().then(t => /Tarteel/.test(t)));
      // The choice persists, and a shared link wins and is remembered.
      await page.locator('#btn-language').click();
      await page.goto(base);
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
      assert.equal(await page.locator('html').getAttribute('data-booting'), null);
      await page.goto(base + '?lang=en');
      await page.goto(base);
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      // Lesson search spans both editions.
      await page.evaluate(() => { location.hash = '/path'; });
      await page.locator('#lesson-search').fill('ikhfa');
      assert.ok(await page.locator('.lesson-link:visible').count() >= 2);
      await page.locator('#lesson-search').fill('إخفاء');
      assert.ok(await page.locator('.lesson-link:visible').count() >= 2);
      await page.locator('#lesson-search').fill('zzzz');
      assert.equal(await page.locator('.lesson-link:visible').count(), 0);
      assert.ok(await page.locator('#search-empty').isVisible());
      await checkSettings();
      // Button text stays readable through the glass, in both themes, on every kind of surface.
      const contrast = await (async () => {
        const failures = {};
        let checked = 0;
        for (const theme of ['light', 'dark']) {
          await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
          for (const route of ['/', '/practice', '/lesson/iqlab', '/lesson/iqlab/see', '/lesson/iqlab/try', '/symbols']) {
            await page.evaluate(h => { location.hash = h; }, route);
            await page.waitForTimeout(60);
            for (let side = 0; side < 2; side++) {
              const result = await page.evaluate(() => {
                const parse = c => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] === undefined ? 1 : m[3] }; };
                const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
                const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
                const backdrop = e => {
                  const layers = [];
                  for (let x = e; x; x = x.parentElement) {
                    if (x.matches('.hero, .lesson-head, .due-card')) { layers.push({ r: 61, g: 36, b: 102, a: 1 }); break; }
                    const c = parse(getComputedStyle(x).backgroundColor);
                    if (c.a > 0) { layers.push(c); if (c.a === 1) break; }
                  }
                  return layers.reverse().reduce((b, t) => over(t, b), { r: 255, g: 255, b: 255, a: 1 });
                };
                const out = [];
                document.querySelectorAll('.btn, .play, .speed, .toggle, .step, .grade, .grade small, .opt, .sym .n, .icon-btn, .language-btn').forEach(e => {
                  if (!e.getClientRects().length || !e.textContent.trim()) return;
                  const bg = backdrop(e), fg = over(parse(getComputedStyle(e).color), bg);
                  const a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
                  out.push({ name: e.className || e.tagName, text: e.textContent.trim().slice(0, 18), ratio: Math.round(ratio * 100) / 100 });
                });
                return out;
              });
              checked += result.length;
              result.filter(r => r.ratio < 4.5).forEach(r => { failures[theme + ' ' + route + ' .' + r.name] = r; });
              const flip = page.locator('button[data-act="flip"]');
              if (route.endsWith('/try') && await flip.count()) await flip.first().click(); else break;
            }
          }
        }
        return { checked, failures };
      })();
      assert.deepEqual(contrast.failures, {}, 'Button text must reach 4.5:1 through the glass');
      assert.ok(contrast.checked > 100, 'Contrast check saw too few buttons');
      console.log(`Button contrast: ${contrast.checked} checks passed`);
      await page.evaluate(() => { delete document.documentElement.dataset.theme; });
      // Slow playback applies to the clip and survives a language switch.
      await page.evaluate(() => { location.hash = '/lesson/iqlab/see'; });
      await page.locator('[data-speed]').first().click();
      await page.locator('[data-audio]').first().click();
      assert.equal(await page.locator('#player').evaluate(p => p.playbackRate), 0.75);
      await page.locator('#btn-language').click();
      assert.equal(await page.locator('[data-speed]').first().innerText(), '0.75×');
      assert.ok(/سرعة/.test(await page.locator('[data-speed]').first().getAttribute('aria-label')));
      await checkSettings();
      await context.close();
      // A stale page paired with this script must degrade, not crash.
      const stale = await browser.newContext();
      const stalePage = await stale.newPage();
      const staleErrors = [];
      stalePage.on('pageerror', error => staleErrors.push(error.message));
      await stalePage.route(base, async route => {
        const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace(/<button class="language-btn"[\s\S]*?<\/button>/, '').replace(/<script src="js\/i18n[^>]*><\/script>/, '').replace(/<script src="data\/ar[^>]*><\/script>/, '');
        await route.fulfill({ contentType: 'text/html', body: html });
      });
      await stalePage.goto(base);
      assert.ok(await stalePage.locator('.hero h1').isVisible());
      assert.deepEqual(staleErrors, []);
      await stale.close();
    }
    assert.deepEqual(errors, []);
    fs.mkdirSync(path.resolve(__dirname, '../build/audit'), { recursive: true });
    fs.writeFileSync(path.resolve(__dirname, '../build/audit/results.json'), JSON.stringify({ pagesChecked, untranslated: [...untranslated], overflow, errors }, null, 2));
    console.log(JSON.stringify({ pagesChecked, untranslated: [...untranslated], overflow, errors }, null, 2));
    assert.equal(overflow.length, 0, 'Horizontal overflow');
    assert.equal(untranslated.size, 0, 'Untranslated Arabic interface text');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
