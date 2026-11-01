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
            const wide = [...root.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).position !== 'absolute'; }).map(e => e.className);
            if (document.documentElement.scrollWidth > innerWidth + 1) wide.push('document');
            return { english, wide };
          });
          if (lang === 'ar') result.english.filter(t => /[a-z]{3}/i.test(t.replace(/Anki|Quran\.com|EveryAyah\.com|DM Sans|DM Mono|SIL Open Font License/g, ''))).forEach(t => untranslated.add(t));
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
          assert.ok(!/Show answer|Listen|Correct!|Which|What is|Lesson:/.test(answer), answer);
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
    assert.deepEqual(errors, []);
    fs.mkdirSync(path.resolve(__dirname, '../build/audit'), { recursive: true });
    fs.writeFileSync(path.resolve(__dirname, '../build/audit/results.json'), JSON.stringify({ pagesChecked, untranslated: [...untranslated], overflow, errors }, null, 2));
    console.log(JSON.stringify({ pagesChecked, untranslated: [...untranslated], overflow, errors }, null, 2));
    assert.equal(overflow.length, 0, 'Horizontal overflow');
    assert.equal(untranslated.size, 0, 'Untranslated Arabic interface text');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
