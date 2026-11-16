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
// Word timings: one span per word, in order, inside the clip, and the same in both editions.
for (const [id, frag] of Object.entries(en.frags)) {
  const t = frag.timing;
  assert.ok(t && t.dur > 0, `No timing: ${id}`);
  assert.equal(t.words.length, frag.words[1] - frag.words[0] + 1, `Timing count: ${id}`);
  t.words.forEach((w, i) => assert.ok(w[0] >= 0 && w[0] <= w[1] && w[1] <= t.dur && (!i || t.words[i - 1][0] <= w[0]), `Timing order: ${id}`));
  assert.deepEqual(ar.frags[id].timing, t);
}
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
  // Audio may start without a click, and the microphone is a generated tone: both only for these checks.
  const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
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
        const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace(/<button class="language-btn"[\s\S]*?<\/button>/, '').replace(/<script src="js\/i18n[^>]*><\/script>/, '').replace(/<script src="js\/audio[^>]*><\/script>/, '').replace(/<script src="data\/ar[^>]*><\/script>/, '');
        await route.fulfill({ contentType: 'text/html', body: html });
      });
      await stalePage.goto(base);
      assert.ok(await stalePage.locator('.hero h1').isVisible());
      await stalePage.locator('.hero .play').click();
      assert.ok(await stalePage.locator('#player').evaluate(p => !!p.currentSrc), 'Without audio.js a clip still plays');
      assert.deepEqual(staleErrors, []);
      await stale.close();
    }
    // Sound and text stay together: the highlight is read against the player's own clock.
    {
      const context = await browser.newContext({ permissions: ['microphone'] });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '?lang=en#/lesson/surah-1/see');
      // The page splits every fragment into exactly the words the timings describe.
      const shape = await page.evaluate(() => Object.values(window.TARTEEL.frags).filter(f => window.TarteelAudio.splitWords(f.html).length !== f.timing.words.length).map(f => f.id));
      assert.deepEqual(shape, [], 'Every fragment must split into its timed words');
      const marks = await page.evaluate(() => window.TARTEEL.cards.filter(c => c.t === 'i' && window.TarteelAudio.splitWords(c.m).length !== window.TARTEEL.frags[c.f].timing.words.length).map(c => c.id));
      assert.deepEqual(marks, [], 'Identify cards must split the same way');
      // Every clip is as long as its timings say (within an MP3 frame or two).
      const lengths = await page.evaluate(async () => {
        const bad = [];
        for (const f of Object.values(window.TARTEEL.frags)) {
          const a = new Audio(); a.preload = 'metadata'; a.src = f.audio;
          await new Promise(r => { a.onloadedmetadata = r; a.onerror = r; });
          if (!(Math.abs(a.duration * 1000 - f.timing.dur) < 80)) bad.push([f.id, a.duration, f.timing.dur]);
        }
        return bad;
      });
      assert.deepEqual(lengths, [], 'Clip length must match its word timings');
      for (const speed of ['1×', '0.5×']) {
        const result = await page.evaluate(async speed => {
          const sp = document.querySelector('[data-speed]');
          for (let i = 0; i < 3 && sp.textContent !== speed; i++) sp.click();
          const verse = document.querySelectorAll('.example .verse')[2], btn = verse.querySelector('.play'), p = document.getElementById('player');
          const f = window.TARTEEL.frags[verse.dataset.frag];
          btn.click();
          let frames = 0, wrong = 0, progress = 0;
          const lit = new Set(), t0 = performance.now();
          // right for this instant, or for the frame just drawn (the clock runs on between the two)
          const want = t => { let e = -1; f.timing.words.forEach((w, i) => { if (w[0] <= t + 40) e = i; }); return e; };
          while (performance.now() - t0 < 20000) {
            await new Promise(r => requestAnimationFrame(r));
            if (p.ended || (frames > 10 && p.paused)) break;
            if (p.paused) continue;
            const now = verse.querySelector('.w.now'), at = now ? +now.dataset.w : -1, ms = p.currentTime * 1000;
            if (at !== want(ms) && at !== want(ms - 34)) wrong++;
            if (at >= 0) lit.add(at);
            progress = Math.max(progress, +btn.style.getPropertyValue('--p') || 0);
            frames++;
          }
          await new Promise(r => setTimeout(r, 50));
          return { frames, wrong, lit: lit.size, words: f.timing.words.length, progress, rate: p.playbackRate, clean: !verse.querySelector('.w.now') && btn.getAttribute('aria-pressed') === 'false' };
        }, speed);
        assert.ok(result.frames > 30, 'The clip must actually play');
        assert.equal(result.wrong, 0, 'Highlight out of step at ' + speed + ': ' + JSON.stringify(result));
        assert.equal(result.lit, result.words, 'Every word lights up in turn');
        assert.ok(result.progress > 0.9 && result.clean, 'The button shows progress and resets: ' + JSON.stringify(result));
        assert.equal(result.rate, speed === '1×' ? 1 : 0.5);
        console.log('Word highlight at ' + speed + ': ' + result.frames + ' frames, none out of step');
      }
      // One word alone: starts at the word and stops after it, though this server cannot serve byte ranges.
      const word = await page.evaluate(async () => {
        const verse = document.querySelectorAll('.example .verse')[2], p = document.getElementById('player'), f = window.TARTEEL.frags[verse.dataset.frag];
        const sp = document.querySelector('[data-speed]');
        for (let i = 0; i < 3 && sp.textContent !== '1×'; i++) sp.click();
        verse.querySelectorAll('.w')[1].click();
        const seen = [], t0 = performance.now();
        while (performance.now() - t0 < 8000) { await new Promise(r => requestAnimationFrame(r)); if (!p.paused) seen.push(p.currentTime * 1000); else if (seen.length) break; }
        return { span: f.timing.words[1], from: seen[0], to: seen[seen.length - 1] };
      });
      assert.ok(Math.abs(word.from - (word.span[0] - 30)) < 120 && word.to >= word.span[1] - 60 && word.to < word.span[1] + 200, 'A tapped word plays alone: ' + JSON.stringify(word));
      // Listen and repeat: the reciter, then a silent turn for the learner; a second click ends it.
      const echo = page.locator('.example [data-echo]').nth(2);
      await echo.click();
      assert.ok(/1\/3/.test(await echo.innerText()));
      await page.locator('.verse.is-turn').waitFor({ timeout: 15000 });
      assert.ok(await page.locator('#player').evaluate(p => p.paused), 'The learner recites into silence');
      await echo.click();
      assert.equal(await echo.getAttribute('aria-pressed'), 'false');
      assert.equal(await page.locator('.verse.is-turn').count(), 0);
      // Play all moves through the verses in order.
      await page.locator('#play-all').click();
      await page.locator('.example:nth-child(1) .verse.is-playing').waitFor();
      await page.locator('.example:nth-child(2) .verse.is-playing').waitFor({ timeout: 15000 });
      await page.locator('#play-all').click();
      assert.equal(await page.locator('.verse.is-playing').count(), 0);
      // A question side never gives the answer away: its words cannot be tapped.
      await page.evaluate(() => { localStorage.setItem('tarteel.v1', JSON.stringify({ settings: { mode: 'free', types: { r: true, i: false, c: false, s: false, k: false } } })); location.hash = '/practice/lesson-surah-112'; });
      await page.reload();
      assert.equal(await page.locator('.flash .verse.can-tap').count(), 0);
      // Recording: start, flip (which ends the take), then the learner's own recitation is on offer.
      await page.locator('[data-act="rec-start"]').click();
      await page.locator('[data-act="rec-stop"]').waitFor();
      await page.waitForTimeout(700);
      await page.locator('button[data-act="flip"]').click();
      await page.locator('[data-act="rec-play"]').waitFor();
      assert.equal(await page.locator('.flash .verse.can-tap').count(), 1);
      await page.locator('[data-act="rec-play"]').click();
      await page.locator('[data-grade="2"]').click();
      assert.equal(await page.locator('[data-act="rec-play"]').count(), 0, 'A take belongs to one card');
      // Sittings are capped, and the rest of the queue is offered afterwards.
      await page.evaluate(() => { localStorage.setItem('tarteel.v1', JSON.stringify({ settings: { newPerDay: 20, sessionSize: 2, types: { c: true, r: false, i: false, s: false, k: false } } })); location.hash = '/practice/level-0'; });
      await page.reload();
      assert.equal(await page.locator('.session-top .count').innerText(), '0/2');
      for (let i = 0; i < 2; i++) { await page.locator('button[data-act="flip"]').click(); await page.locator('[data-grade="2"]').click(); }
      assert.ok(/100%/.test(await page.locator('.summary').innerText()));
      await page.locator('[data-act="more"]').click();
      assert.equal(await page.locator('.session-top .count').innerText(), '0/2');
      // Daily settings, and the backup round trip.
      await page.evaluate(() => { location.hash = '/practice'; });
      await page.locator('.toggle[data-goal="40"]').click();
      await page.locator('.toggle[data-new="5"]').click();
      assert.deepEqual(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tarteel.v1')).settings; return [s.goal, s.newPerDay]; }), [40, 5]);
      assert.ok(/\/40/.test(await page.locator('#practice-due').innerText()));
      await page.evaluate(() => { location.hash = '/about'; });
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#backup-export').click()]);
      const backup = path.resolve(__dirname, '../build/audit/backup.json');
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      await download.saveAs(backup);
      await page.evaluate(() => localStorage.removeItem('tarteel.v1'));
      await page.locator('#backup-file').setInputFiles(backup);
      await page.waitForFunction(() => { const s = JSON.parse(localStorage.getItem('tarteel.v1') || '{}'); return s.settings && s.settings.goal === 40 && Object.keys(s.cards).length === 2; });
      fs.writeFileSync(backup, '{"not":"a backup"}');
      await page.locator('#backup-file').setInputFiles(backup);
      await page.locator('.toast').waitFor();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('tarteel.v1')).settings.goal), 40, 'A bad file changes nothing');
      await context.close();
    }
    // Offline: once the worker has the course, it runs with no network at all.
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.evaluate(() => localStorage.setItem('tarteel.sw', '1'));
      await page.reload();
      await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
      await page.evaluate(() => { location.hash = '/about'; });
      await page.locator('#offline-save').click();
      await page.waitForFunction(() => localStorage.getItem('tarteel.offline') === '1', null, { timeout: 60000 });
      await page.evaluate(() => { location.hash = '/'; });
      await context.setOffline(true);
      await page.reload();
      assert.ok(await page.locator('.hero h1').isVisible(), 'The page opens offline');
      await page.evaluate(() => { location.hash = '/lesson/madd-lazim/see'; });
      await page.locator('.example .play').first().click();
      await page.locator('.verse.is-playing .w.now').first().waitFor({ timeout: 10000 });
      assert.ok(await page.evaluate(() => document.fonts.check('2rem "KFGQPC Hafs"')), 'The Mushaf font is available offline');
      await context.close();
    }
    assert.deepEqual(errors, []);
    fs.mkdirSync(path.resolve(__dirname, '../build/audit'), { recursive: true });
    fs.writeFileSync(path.resolve(__dirname, '../build/audit/results.json'), JSON.stringify({ pagesChecked, untranslated: [...untranslated], overflow, errors }, null, 2));
    console.log(JSON.stringify({ pagesChecked, untranslated: [...untranslated], overflow, errors }, null, 2));
    assert.equal(overflow.length, 0, 'Horizontal overflow');
    assert.equal(untranslated.size, 0, 'Untranslated Arabic interface text');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
