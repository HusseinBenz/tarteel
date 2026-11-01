/* Tarteel: a static, dependency-free tajweed learning app.
 *
 *   data    window.TARTEEL (data/content.js, generated)
 *   state   localStorage "tarteel.v1" (progress + spaced repetition), all optional
 *   views   hash router: home, path, level, lesson, practice (hub + session),
 *           symbols, colors, about
 */
(function () {
  'use strict';

  var I18n = window.TarteelI18n;
  var language = new URLSearchParams(location.search).get('lang');
  if (language !== 'ar' && language !== 'en') {
    try { language = localStorage.getItem('tarteel.language'); } catch (e) { /* optional storage */ }
  }
  language = language === 'ar' ? 'ar' : 'en';
  I18n.use(language);
  var D = language === 'ar' ? window.TARTEEL_AR : window.TARTEEL;
  if (D && language === 'ar') {
    D.downloads = (window.TARTEEL.downloads || []).map(function (item) {
      var level = item.file.match(/Level-(\d+)/);
      return Object.assign({}, item, { title: level ? 'المستوى ' + level[1] + ' · ' + D.levels[+level[1]].title + ' (Anki بالإنجليزية)' : I18n.text(item.title) });
    });
  }
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  if (!D) { document.getElementById('app').textContent = I18n.text(language === 'ar' ? 'Could not load Arabic content.' : 'Could not load the course data.'); return; }

  // ---------------------------------------------------------------- helpers
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var AR_RUN = /(?:[؀-ۿݐ-ݿ‌]+(?:\s+(?=[؀-ۿݐ-ݿ]))?)+/g;
  // escape plain text, and give Arabic runs the Mushaf font
  function rich(s) { return language === 'ar' ? esc(s) : esc(s).replace(AR_RUN, function (m) { return '<span class="ar-inline" lang="ar">' + m + '</span>'; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : w === 'miss' ? 'es' : 's'); }

  var legend = {}; D.legend.forEach(function (c) { legend[c.id] = c; });
  var cardById = {}; D.cards.forEach(function (c) { cardById[c.id] = c; });
  var deckById = {}; D.decks.forEach(function (d) { deckById[d.id] = d; });
  var symById = {}; D.symbols.forEach(function (g) { g.items.forEach(function (i) { symById[i.id] = i; }); });
  var lessonOrder = []; D.levels.forEach(function (l) { l.lessons.forEach(function (id) { lessonOrder.push(id); }); });
  function two(n) { return String(n).padStart(2, '0'); }

  // ---------------------------------------------------------------- storage
  var KEY = 'tarteel.v1';
  var S = { cards: {}, lessons: {}, days: {}, settings: {} };
  function loadState() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) S = parsed; } } catch (e) { /* private mode: run without saving */ }
    S.cards = S.cards || {}; S.lessons = S.lessons || {}; S.days = S.days || {};
    S.settings = Object.assign({ autoplay: false, newPerDay: 12, mode: 'smart', types: { r: true, i: true, c: true, s: true, k: true }, theme: 'auto' }, S.settings || {});
  }
  function saveState() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function today() { return (S.days[dayKey()] = S.days[dayKey()] || { reviews: 0, fresh: 0 }); }
  function streak() {
    var n = 0, d = new Date();
    if (!(S.days[dayKey(d)] && S.days[dayKey(d)].reviews)) d.setDate(d.getDate() - 1);
    while (S.days[dayKey(d)] && S.days[dayKey(d)].reviews) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ---------------------------------------------------------------- spaced repetition (simplified SM-2)
  var DAY = 86400000;
  function state(id) { var c = S.cards[id]; return !c ? 'new' : (c.due <= Date.now() ? 'due' : 'later'); }
  function nextInterval(c, g) {
    if (g === 0) return 0;
    if (!c || !c.reps) return g === 3 ? 3 : 1;
    var ef = c.ef || 2.5;
    var iv = c.iv * (g === 1 ? 1.2 : g === 2 ? ef : ef * 1.3);
    return Math.max(c.iv + 1, Math.round(iv));
  }
  function fmtInterval(days) { return days === 0 ? '<10m' : days < 7 ? days + 'd' : days < 30 ? Math.round(days / 7) + 'w' : Math.round(days / 30) + 'mo'; }
  function grade(id, g) {
    var c = S.cards[id], fresh = !c;
    c = c || { ef: 2.5, iv: 0, reps: 0, lapses: 0 };
    var iv = nextInterval(c, g);
    if (g === 0) { c.lapses++; c.reps = 0; c.iv = 0; c.due = Date.now() + 10 * 60000; }
    else { c.reps++; c.iv = iv; c.ef = Math.max(1.3, c.ef + (g === 1 ? -0.15 : g === 3 ? 0.15 : 0)); c.due = Date.now() + iv * DAY; }
    S.cards[id] = c;
    var t = today(); t.reviews++; if (fresh) t.fresh++;
    saveState();
  }
  function countStates(ids) {
    var r = { new: 0, due: 0, later: 0 };
    ids.forEach(function (id) { r[state(id)]++; });
    return r;
  }
  function allowedIds(deck) { var T = S.settings.types; return deck.cards.filter(function (id) { return T[cardById[id].t]; }); }
  function buildQueue(deck, opts) {
    var ids = allowedIds(deck);
    if (opts.all) return ids;
    if (S.settings.mode === 'free') return shuffle(ids);
    var due = ids.filter(function (id) { return state(id) === 'due'; }).sort(function (a, b) { return S.cards[a].due - S.cards[b].due; });
    var fresh = ids.filter(function (id) { return state(id) === 'new'; });
    var left = Math.max(0, S.settings.newPerDay - today().fresh);
    return due.concat(fresh.slice(0, left));
  }

  // ---------------------------------------------------------------- audio
  var player = $('#player'), playing = null;
  function setPlaying(btn) {
    if (playing) { playing.setAttribute('aria-pressed', 'false'); var t = $('.t', playing); if (t) t.textContent = I18n.text('Listen'); }
    playing = btn;
    if (btn) { btn.setAttribute('aria-pressed', 'true'); var t2 = $('.t', btn); if (t2) t2.textContent = I18n.text('Playing…'); }
  }
  function playClip(src, btn) {
    if (btn && playing === btn && !player.paused) { player.pause(); setPlaying(null); return; }
    player.src = src; player.currentTime = 0;
    setPlaying(btn || null);
    var p = player.play();
    if (p && p.catch) p.catch(function () { setPlaying(null); toast('Could not play the audio'); });
  }
  player.addEventListener('ended', function () { setPlaying(null); });
  function stopAudio() { try { player.pause(); } catch (e) { /* ignore */ } setPlaying(null); }
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>';
  function playBtn(f, big) { return '<button type="button" class="play' + (big ? ' big' : '') + '" data-audio="' + esc(f.audio) + '" aria-pressed="false" aria-label="Listen to ' + esc(f.label) + '">' + ICON_PLAY + '<span class="t">Listen</span></button>'; }

  var toastTimer;
  function toast(msg) {
    var t = $('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = I18n.text(msg); document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.remove(); }, 2200);
  }

  // ---------------------------------------------------------------- shared renderers
  function labelHTML(f) {
    return '<span class="label"><span>Surah ' + esc(f.surah_name) + '</span><span class="surah-ar" lang="ar">' + esc(f.surah_arabic) + '</span>' +
      '<span>· Verse ' + f.ayah + '</span><span class="tag">' + f.surah + ':' + f.ayah + '</span>' +
      (f.whole_verse ? '' : '<span class="tag">part of the verse</span>') +
      (f.page ? '<span class="tag">Mushaf p. ' + f.page + '</span>' : '') + '</span>';
  }
  function verseBox(f, html, opts) {
    opts = opts || {};
    return '<div class="verse"' + (opts.attrs || '') + '><div class="ar ' + (opts.size || '') + '" lang="ar" dir="rtl">' + (html || f.html) + '</div>' +
      '<div class="verse-foot">' + labelHTML(f) + (opts.play ? playBtn(f, false) : '') + '</div>' +
      (opts.gloss && f.gloss ? '<div class="gloss">' + esc(f.gloss) + '</div>' : '') + '</div>';
  }
  function chipFor(id) {
    var c = legend[id]; if (!c) return '';
    return '<a class="chip" href="#/lesson/' + c.lesson + '"><span class="dot bg-' + id + '"></span>' + esc(c.name) + '</a>';
  }
  function chips(ids) { return ids && ids.length ? '<div class="legend-strip">' + ids.map(chipFor).join('') + '</div>' : ''; }
  function lessonLink(id, text) { var l = D.lessons[id]; return '<a href="#/lesson/' + id + '">' + esc(text || l.title) + '</a>'; }
  function exampleNote(card) {
    var l = D.lessons[card.lesson]; if (!l) return '';
    var e = l.examples.filter(function (x) { return x.f === card.f; })[0];
    return e && e.note ? '<div class="note">' + rich(e.note) + '</div>' : '';
  }
  function progressBar(p) { return '<div class="progress" role="progressbar" aria-label="Review progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(p * 100) + '"><i style="width:' + Math.round(p * 100) + '%"></i></div>'; }
  function mascot(label, small) {
    return '<svg class="mascot' + (small ? ' sm' : '') + '" viewBox="0 0 240 240" role="img" aria-label="' + esc(label || 'Noor, the Tarteel mascot') + '">' +
      '<ellipse cx="120" cy="222" rx="70" ry="9" fill="#a355ff" opacity=".3"/>' +
      '<path d="M120 28c-30 0-50 22-50 50 0 7 1 13 4 19 8-10 22-17 46-17s38 7 46 17c3-6 4-12 4-19 0-28-20-50-50-50z" fill="#a355ff"/>' +
      '<path d="M141 10a23 23 0 1 0 5 42 18 18 0 1 1-5-42z" fill="#e3f26c" stroke="#111113" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="120" cy="136" r="78" fill="#f1e6ff" stroke="#111113" stroke-width="5"/>' +
      '<circle cx="86" cy="150" r="13" fill="#d6b3ff" opacity=".9"/><circle cx="154" cy="150" r="13" fill="#d6b3ff" opacity=".9"/>' +
      '<ellipse cx="92" cy="125" rx="9" ry="12" fill="#111113"/><ellipse cx="148" cy="125" rx="9" ry="12" fill="#111113"/>' +
      '<circle cx="95" cy="120" r="3.5" fill="#fff"/><circle cx="151" cy="120" r="3.5" fill="#fff"/>' +
      '<path d="M101 152c6 12 32 12 38 0" fill="#fff" stroke="#111113" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="62" y="186" width="116" height="34" rx="9" fill="#fff" stroke="#111113" stroke-width="5"/>' +
      '<path d="M120 186v34" stroke="#111113" stroke-width="4"/>' +
      '<path d="M76 198h32M76 207h26M132 198h32M132 207h26" stroke="#b7b7bf" stroke-width="3" stroke-linecap="round"/>' +
      '<g class="spark" fill="#e3f26c" stroke="#111113" stroke-width="3" stroke-linejoin="round"><path d="M200 64l5 12 12 5-12 5-5 12-5-12-12-5 12-5z"/><path d="M34 110l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/></g></svg>';
  }

  // ---------------------------------------------------------------- views
  var app = $('#app');
  var cleanup = null;

  function setNav(name) { $$('.nav a').forEach(function (a) { if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
  function setTitle(t) { document.title = (t ? I18n.text(t) + ' · ' : '') + I18n.text('Tarteel'); }

  function lessonDone(id) { return !!(S.lessons[id] && S.lessons[id].done); }
  function nextLesson() { for (var i = 0; i < lessonOrder.length; i++) if (!lessonDone(lessonOrder[i])) return lessonOrder[i]; return null; }

  // ----- home
  function viewHome() {
    setNav('home'); setTitle('');
    var all = deckById.all.cards, st = countStates(all);
    var learned = all.filter(function (id) { return S.cards[id] && S.cards[id].reps > 0; }).length;
    var done = lessonOrder.filter(lessonDone).length, nl = nextLesson();
    var strip = D.legend.slice(0, 12).map(function (c) { return '<span class="chip"><span class="dot bg-' + c.id + '"></span>' + esc(c.name) + '</span>'; }).join('');
    app.innerHTML =
      '<section class="hero on-dark"><div class="hero-in"><div><div class="eyebrow">Levels 0 to ' + (D.levels.length - 1) + ' · Madinah Mushaf</div><h1>Learn tajweed,<br>one friendly step at a time</h1>' +
      '<p class="lead">Read the Madinah Mushaf in color, hear each rule recited, then practice with flashcards until it feels natural.</p>' +
      '<div class="row"><a class="btn big" href="#/' + (nl && done ? 'lesson/' + nl : 'path') + '">' + (nl ? (done ? 'Continue learning' : 'Start at Level 0') : 'Course complete — revisit the path') + ' ↗</a><a class="btn soft big" href="#/practice">Flashcards</a></div></div>' +
      '<div>' + mascot('Noor, the Tarteel mascot, holding an open book') + '</div></div></section>' +
      '<div class="section-head"><div class="eyebrow">Two ways to learn</div><h2>Choose how you like to learn</h2></div><div class="paths">' +
      '<a class="path-card" href="#/path"><span class="index">01</span><h3>Guided path</h3><p>Levels 0 to ' + (D.levels.length - 1) + ', in order. Each lesson shows the rule, what it means, examples, then flashcards.</p><span class="go">Follow the path ↗</span></a>' +
      '<a class="path-card" href="#/practice"><span class="index">02</span><h3>Repetitive practice</h3><p>Jump straight into flashcards. A fragment of a verse appears: recite it, flip, press play, and compare.</p><span class="go">Open the decks ↗</span></a></div>' +
      '<div class="stats"><div class="stat"><b>' + done + '/' + lessonOrder.length + '</b><span>Lessons done</span></div><div class="stat"><b>' + learned + '</b><span>Cards learned</span></div><div class="stat"><b>' + st.due + '</b><span>Due now</span></div><div class="stat"><b>' + streak() + '</b><span>Day streak</span></div></div>' +
      '<div class="section-head"><div class="eyebrow">Color key</div><h2>The colors you will learn</h2></div><div class="legend-strip">' + strip + '</div><p class="small muted" style="margin-top:var(--s-3)"><a href="#/colors">See the whole color key</a></p>' +
      '<div class="section-head"><div class="eyebrow">Anki</div><h2>Take it with you</h2></div><div class="card stack"><p>The same course is available as Anki decks: ' + (D.meta.counts.cards + D.meta.counts.symbol + D.meta.counts.color) + ' cards with audio, organized into one deck per rule.</p><div class="row" id="dl-row"></div></div>';
    fillDownloads($('#dl-row'));
  }
  function fillDownloads(el) {
    var items = (D.downloads || []);
    if (!items.length) { el.innerHTML = '<span class="muted small">Anki decks are in the project’s <code>dist/anki</code> folder.</span>'; return; }
    el.innerHTML = items.map(function (d, i) { return '<a class="btn ' + (i ? 'soft' : '') + '" href="downloads/' + esc(d.file) + '" download>↓ ' + esc(d.title) + ' <small>(' + esc(d.size) + ')</small></a>'; }).join('');
  }

  // ----- path
  function viewPath() {
    setNav('path'); setTitle('Guided path');
    var nl = nextLesson();
    var html = '<h1>Guided path</h1><p class="muted">Eight levels, from the very first marks to reading whole surahs. Follow them in order, or jump to whatever you need.</p><div class="map">';
    D.levels.forEach(function (lv) {
      var done = lv.lessons.filter(lessonDone).length, hasNext = lv.lessons.indexOf(nl) >= 0;
      html += '<section class="level-card" id="level-' + lv.level + '">' + (hasNext ? '<span class="here">You are here</span>' : '') +
        '<header><span class="level-badge" aria-hidden="true">' + two(lv.level) + '</span><div><div class="num">Level ' + lv.level + '</div><h2>' + esc(lv.title) + '</h2></div></header>' +
        '<p>' + rich(lv.tagline) + '</p>' + progressBar(done / lv.lessons.length) +
        '<div class="small"><b>' + done + '/' + lv.lessons.length + '</b> lessons · <a href="#/level/' + lv.level + '">Level overview</a> · <a href="#/practice/level-' + lv.level + '">Practice this level</a></div>' +
        '<ul class="lesson-list">' + lv.lessons.map(function (id) {
          var l = D.lessons[id];
          return '<li><a class="lesson-link ' + (lessonDone(id) ? 'done' : '') + (id === nl ? ' next' : '') + '" href="#/lesson/' + id + '"><span class="dot" aria-hidden="true">' + (lessonDone(id) ? '✓' : l.n) + '</span><span>' + esc(l.title) + '</span><span class="ar-inline" lang="ar">' + esc(l.arabic) + '</span></a></li>';
        }).join('') + '</ul></section>';
    });
    app.innerHTML = html + '</div>';
  }

  function viewLevel(n) {
    var lv = D.levels[+n]; if (!lv) return viewPath();
    setNav('path'); setTitle('Level ' + lv.level);
    var done = lv.lessons.filter(lessonDone).length, nl = nextLesson();
    app.innerHTML = '<div class="crumbs"><a href="#/path">Guided path</a> › Level ' + lv.level + '</div>' +
      '<div class="lesson-head on-dark"><h1>Level ' + lv.level + ': ' + esc(lv.title) + '</h1><p>' + rich(lv.intro) + '</p></div>' +
      progressBar(done / lv.lessons.length) +
      '<ul class="lesson-list" style="margin-top:1rem">' + lv.lessons.map(function (id) {
        var l = D.lessons[id];
        return '<li><a class="lesson-link ' + (lessonDone(id) ? 'done' : '') + (id === nl ? ' next' : '') + '" href="#/lesson/' + id + '"><span class="dot" aria-hidden="true">' + (lessonDone(id) ? '✓' : l.n) + '</span><span><b>' + esc(l.title) + '</b><br><small class="muted">' + esc(l.meaning) + '</small></span><span class="ar-inline" lang="ar">' + esc(l.arabic) + '</span></a></li>';
      }).join('') + '</ul>' +
      '<div class="nextbar"><a class="btn soft" href="#/path">← All levels</a><a class="btn" href="#/practice/level-' + lv.level + '">Practice this level</a></div>';
  }

  // ----- lesson
  var STEPS = [['learn', '1 · Meet the rule'], ['see', '2 · See examples'], ['try', '3 · Try it']];
  function viewLesson(id, step) {
    var l = D.lessons[id]; if (!l) return viewPath();
    step = STEPS.some(function (s) { return s[0] === step; }) ? step : 'learn';
    var lv = D.levels[l.level], idx = lessonOrder.indexOf(id), prev = lessonOrder[idx - 1], next = lessonOrder[idx + 1];
    setNav('path'); setTitle(l.title);
    var rec = S.lessons[id] = S.lessons[id] || {};
    rec.seen = rec.seen || {}; rec.seen[step] = true; saveState();

    var head = '<div class="crumbs"><a href="#/path">Guided path</a> › <a href="#/level/' + lv.level + '">Level ' + lv.level + '</a> › ' + esc(l.title) + '</div>' +
      '<div class="lesson-head on-dark"><div class="ar" lang="ar" dir="rtl">' + esc(l.arabic) + '</div><h1>' + esc(l.title) + '</h1><div class="muted"><b>' + esc(l.meaning) + '</b></div></div>' +
      '<nav class="steps" aria-label="Lesson steps">' + STEPS.map(function (s) { return '<a class="step ' + (rec.seen[s[0]] && s[0] !== step ? 'done' : '') + '" href="#/lesson/' + id + '/' + s[0] + '"' + (s[0] === step ? ' aria-current="step"' : '') + '>' + s[1] + '</a>'; }).join('') + '</nav>';

    var body = '';
    if (step === 'learn') {
      body += '<div class="card stack"><p style="font-size:1.2rem;margin:0"><b>' + rich(l.summary) + '</b></p>' + chips(l.colors) +
        (l.colors && l.colors.length === 0 && l.level > 0 && l.level < 6 && l.id !== 'ra-rules' ? '<p class="small muted" style="margin:0">This rule has no color in the Mushaf: you spot it by its letters.</p>' : '') + '</div>';
      body += '<div class="card stack" style="margin-top:1rem"><h2>How it works</h2>' + l.explain.map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('') + '</div>';
      var facts = '';
      if (l.letters) facts += '<div class="fact"><h3>' + esc(l.letters_label || 'Letters') + '</h3><div class="letters" lang="ar">' + esc(l.letters) + '</div></div>';
      if (l.counts && l.counts !== '—') facts += '<div class="fact"><h3>Length</h3><b>' + rich(l.counts) + '</b></div>';
      if (l.spot) facts += '<div class="fact"><h3>How to spot it</h3>' + rich(l.spot) + '</div>';
      if (facts) body += '<div class="facts" style="margin-top:1rem">' + facts + '</div>';
      var lists = '';
      if (l.how.length) lists += '<div class="fact"><h3>How to do it</h3><ol class="list">' + l.how.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ol></div>';
      if (l.tips.length) lists += '<div class="fact"><h3>Tips</h3><ul class="list">' + l.tips.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ul></div>';
      if (l.mistakes.length) lists += '<div class="fact"><h3>Common slips</h3><ul class="list">' + l.mistakes.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ul></div>';
      if (lists) body += '<div class="facts" style="margin-top:1rem">' + lists + '</div>';
    } else if (step === 'see') {
      var exs = l.examples.concat(l.showcase);
      body += '<p class="muted">Read each fragment aloud first. Then press Listen to hear the reciter.</p>';
      if (!exs.length) body += '<div class="card">No examples for this lesson. Head to the next step.</div>';
      body += '<div class="examples">' + exs.map(function (e) {
        var f = D.frags[e.f];
        return '<div class="example">' + verseBox(f, null, { play: true, gloss: true }) + (e.note ? '<div class="note">' + rich(e.note) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
      if (l.practice_link) body += '<p style="margin-top:1rem"><a class="btn" href="#/symbols">Open the Symbols page</a></p>';
    } else {
      body += '<div id="lesson-session"></div>';
    }

    var order = STEPS.map(function (s) { return s[0]; }), si = order.indexOf(step);
    var nav = '<div class="nextbar">' +
      (si > 0 ? '<a class="btn soft" href="#/lesson/' + id + '/' + order[si - 1] + '">← Back</a>' : (prev ? '<a class="btn soft" href="#/lesson/' + prev + '">← ' + esc(D.lessons[prev].title) + '</a>' : '<span></span>')) +
      (si < order.length - 1 ? '<a class="btn" href="#/lesson/' + id + '/' + order[si + 1] + '">Next →</a>' : '<span></span>') + '</div>';
    app.innerHTML = head + body + (step === 'try' ? '' : nav);

    if (step === 'try') {
      var ids = l.cards.filter(function (cid) { return S.settings.types[cardById[cid].t]; });
      var root = $('#lesson-session');
      if (!ids.length) {
        if (l.cards.length) {
          root.innerHTML = '<div class="card"><p>No cards match your filters. Enable card types to practice this lesson.</p><a class="btn" href="#/practice">Settings</a></div>';
          return;
        }
        root.innerHTML = '<div class="card center stack"><p>This lesson has no flashcards' + (l.practice_link ? ', but the Symbols deck covers it.' : '.') + '</p>' + (l.practice_link ? '<a class="btn" href="#/practice/symbols-stop-signs">Practice stop signs</a>' : '') + '</div>';
        finishLesson(id, root, next);
      } else {
        cleanup = startSession(root, ids, {
          title: l.title, onFinish: function () { markDone(id); finishLesson(id, root, next); }, exitHref: '#/lesson/' + id + '/see'
        });
      }
    }
  }
  function markDone(id) { S.lessons[id] = S.lessons[id] || {}; S.lessons[id].done = true; S.lessons[id].at = Date.now(); saveState(); }
  function finishLesson(id, root, next) {
    markDone(id);
    var box = document.createElement('div'); box.className = 'done-screen card'; box.style.marginTop = '1rem';
    box.innerHTML = '' + mascot('Noor', true) + '<h2>Lesson complete!</h2>' +
      '<p>' + esc(D.lessons[id].title) + ' is marked as done.</p><div class="row" style="justify-content:center">' +
      (next ? '<a class="btn big" href="#/lesson/' + next + '">Next: ' + esc(D.lessons[next].title) + ' →</a>' : '<a class="btn big" href="#/path">Back to the path</a>') +
      '<a class="btn soft" href="#/path">All levels</a></div>';
    root.appendChild(box);
    I18n.localize(box);
  }

  // ----- practice hub
  function deckCard(d) {
    var ids = allowedIds(d), st = countStates(ids);
    if (!ids.length) return '';
    return '<a class="deck" href="#/practice/' + d.id + '"><h3>' + esc(d.title) + '</h3><span class="counts">' + plural(ids.length, 'card') + (st.due ? ' · ' + st.due + ' due' : '') + (st.new ? ' · ' + st.new + ' new' : '') + '</span></a>';
  }
  function viewPractice() {
    setNav('practice'); setTitle('Flashcards');
    var all = deckById.all, st = countStates(allowedIds(all)), T = S.settings.types;
    var names = { r: 'Recite', i: 'Identify the rule', c: 'Concepts', s: 'Symbols', k: 'Colors' };
    var html = '<h1>Flashcards</h1><p class="muted">The repetitive path. Each card shows a fragment of a verse: say it aloud, flip, press play, and compare. The cards you find hard come back sooner.</p>' +
      '<div class="due-card on-dark"><div><b>' + st.due + '</b> due now · <b>' + Math.min(st.new, Math.max(0, S.settings.newPerDay - today().fresh)) + '</b> new for today<br><span class="small muted">' + plural(D.cards.length, 'card') + ' in the whole course</span></div>' +
      '<a class="btn big" href="#/practice/all">Review now</a></div>' +
      '<h2 style="margin-top:1.5rem">Settings</h2><div class="toggles" id="toggles">' +
      Object.keys(names).map(function (k) { return '<button class="toggle" type="button" data-type="' + k + '" aria-pressed="' + (!!T[k]) + '">' + names[k] + '</button>'; }).join('') + '</div>' +
      '<div class="toggles"><button class="toggle" type="button" data-mode="smart" aria-pressed="' + (S.settings.mode === 'smart') + '">Smart review</button>' +
      '<button class="toggle" type="button" data-mode="free" aria-pressed="' + (S.settings.mode === 'free') + '">Free practice (shuffle)</button>' +
      '<button class="toggle" type="button" data-autoplay aria-pressed="' + S.settings.autoplay + '">Autoplay audio after flipping</button></div>' +
      '<h2>By level</h2><div class="grid">' + D.decks.filter(function (d) { return d.kind === 'level'; }).map(function (d) { return deckCard(d); }).join('') + '</div>' +
      '<h2 style="margin-top:1.5rem">Rule symbols and colors</h2><div class="grid">' + D.decks.filter(function (d) { return d.kind === 'symbols'; }).map(function (d) { return deckCard(d); }).join('') + '</div>' +
      '<details class="more"><summary>One deck per lesson</summary>' + D.levels.map(function (lv) {
        return '<h3 style="margin-top:1rem">Level ' + lv.level + ': ' + esc(lv.title) + '</h3><div class="grid">' + lv.lessons.map(function (id) { var d = deckById['lesson-' + id]; return d ? deckCard(d) : ''; }).join('') + '</div>';
      }).join('') + '</details>';
    app.innerHTML = html;
    I18n.localize(app);
    $('#toggles').parentNode.addEventListener('click', function (e) {
      var b = e.target.closest('.toggle'); if (!b) return;
      if (b.dataset.type) S.settings.types[b.dataset.type] = !S.settings.types[b.dataset.type];
      else if (b.dataset.mode) S.settings.mode = b.dataset.mode;
      else if ('autoplay' in b.dataset) S.settings.autoplay = !S.settings.autoplay;
      saveState(); viewPractice();
    });
  }
  function viewDeck(id) {
    var d = deckById[id]; if (!d) return viewPractice();
    setNav('practice'); setTitle(d.title);
    var ids = buildQueue(d, {});
    app.innerHTML = '<div class="crumbs"><a href="#/practice">Flashcards</a> › ' + esc(d.title) + '</div><div id="deck-session"></div>';
    var root = $('#deck-session');
    if (!ids.length) {
      var total = allowedIds(d).length;
      root.innerHTML = '<div class="done-screen card">' + mascot('Noor', true) + '<h2>' + (total ? 'All caught up!' : 'No cards selected') + '</h2><p>' + (total ? 'Nothing is due in this deck right now. You can practice everything anyway.' : 'Turn some card types back on in the settings.') + '</p><div class="row" style="justify-content:center">' +
        (total ? '<button class="btn" id="practice-all" type="button">Practice all ' + total + ' cards</button>' : '') + '<a class="btn soft" href="#/practice">Back to decks</a></div></div>';
      var b = $('#practice-all'); if (b) b.onclick = function () { cleanup = startSession(root, shuffle(allowedIds(d)), { title: d.title, exitHref: '#/practice' }); };
      return;
    }
    cleanup = startSession(root, ids, { title: d.title, exitHref: '#/practice' });
  }

  // ----- the flashcard session
  function startSession(root, ids, opts) {
    var queue = ids.slice(), total = ids.length, done = 0, again = 0, cur = null, revealed = false, answered = false, order = null;
    var counts = [0, 0, 0, 0];

    function next() {
      stopAudio();
      cur = queue.shift();
      if (!cur) return finish();
      revealed = false; answered = false; order = null;
      render();
    }
    function finish() {
      cur = null;
      root.innerHTML = '<div class="done-screen card">' + mascot('Noor', true) + '<h2>Session complete</h2>' +
        '<p>You reviewed <b>' + plural(total, 'card') + '</b>' + (again ? ' (' + plural(again, 'miss') + ' came back and were practiced again)' : '') + '. Nice recitation!</p>' +
        '<div class="row" style="justify-content:center">' + (opts.onFinish ? '' : '<a class="btn big" href="#/practice">More decks</a>') +
        '<button class="btn soft" type="button" data-act="again-session">Practice again</button></div></div>';
      if (opts.onFinish) opts.onFinish();
      I18n.localize(root);
    }
    function top() {
      var p = total ? done / total : 1;
      return '<div class="session-top">' + progressBar(p) + '<span class="count">' + done + '/' + total + '</span></div>';
    }
    function gradesHTML() {
      var c = S.cards[cur];
      return '<div class="grades">' + [['Again', 0], ['Hard', 1], ['Good', 2], ['Easy', 3]].map(function (g) {
        return '<button type="button" class="grade g' + g[1] + '" data-grade="' + g[1] + '">' + g[0] + '<small>' + fmtInterval(nextInterval(c, g[1])) + ' · ' + (g[1] + 1) + '</small></button>';
      }).join('') + '</div>';
    }
    function kindLabel(c) {
      var grp = c.t === 's' ? D.symbols.filter(function (g) { return g.id === c.group; })[0] : null;
      var l = c.lesson ? D.lessons[c.lesson].title : (grp ? grp.title : 'Color key');
      return '<div class="kind"><span>' + ({ r: 'Recite', i: 'Identify the rule', c: 'Concept', s: 'Symbol', k: 'Color key' }[c.t]) + '</span><span>' + esc(l) + '</span></div>';
    }
    function render() {
      var c = cardById[cur], h = top() + '<div class="flash" id="flash">' + kindLabel(c);
      var f = c.f ? D.frags[c.f] : null;
      if (c.t === 'r') {
        if (!revealed) {
          h += '<div class="center-col" data-act="flip"><div class="prompt">Say it out loud, then flip the card.</div>' + verseBox(f) + '</div>' +
            '<button class="btn big" type="button" data-act="flip">Show answer <kbd>Space</kbd></button>';
        } else {
          h += '<div class="center-col">' + verseBox(f, null, { gloss: true }) + '</div><div class="answer"><div class="row">' + playBtn(f, true) + '<span class="small muted">Compare your recitation with the reciter’s.</span></div>' +
            chips(f.classes) + exampleNote(c) + '<div class="small">Lesson: ' + lessonLink(c.lesson) + '</div></div>' + gradesHTML();
        }
      } else if (c.t === 'i') {
        var L = D.lessons[c.lesson];
        if (!order) order = shuffle(c.opts);
        if (!answered) {
          h += '<div class="center-col"><div class="prompt">' + esc(c.prompt) + ' <span class="small">(highlighted letters)</span></div>' + verseBox(f, c.m) + '</div><div class="options">' +
            order.map(function (id) { return '<button class="opt" type="button" data-opt="' + id + '">' + esc(D.lessons[id].title) + '</button>'; }).join('') + '</div>';
        } else {
          var ok = answered === c.lesson;
          h += '<div class="center-col">' + verseBox(f, null, { gloss: true }) + '</div><div class="options">' + order.map(function (id) {
            return '<button class="opt ' + (id === c.lesson ? 'right' : (id === answered ? 'wrong' : '')) + '" type="button" disabled>' + esc(D.lessons[id].title) + '</button>';
          }).join('') + '</div><div class="answer"><div class="verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Correct! ' : 'Not quite. ') + 'This is <b>' + esc(L.title) + '</b>.</div>' +
            '<div class="row">' + playBtn(f, true) + '</div><div>' + rich(L.summary) + '</div>' + chips(f.classes) + exampleNote(c) + '</div>' +
            '<button class="btn big" type="button" data-act="continue">Continue <kbd>Space</kbd></button>';
        }
      } else if (c.t === 'c') {
        if (!revealed) h += '<div class="center-col" data-act="flip"><h2 class="center">' + rich(c.q) + '</h2></div><button class="btn big" type="button" data-act="flip">Show answer <kbd>Space</kbd></button>';
        else h += '<div class="center-col"><h3 class="center muted">' + rich(c.q) + '</h3></div><div class="answer"><p style="font-size:1.15rem;margin:0">' + rich(c.a) + '</p><div class="small">Lesson: ' + lessonLink(c.lesson) + '</div></div>' + gradesHTML();
      } else if (c.t === 's') {
        var s = symById[c.sym];
        if (!revealed) h += '<div class="center-col" data-act="flip"><div class="prompt">What is this sign called, and what does it tell you to do?</div><div class="big-sign" lang="ar">' + esc(s.glyph) + '</div></div><button class="btn big" type="button" data-act="flip">Show answer <kbd>Space</kbd></button>';
        else {
          var sf = s.f ? D.frags[s.f] : null;
          h += '<div class="big-sign" lang="ar" style="font-size:4rem">' + esc(s.glyph) + '</div><div class="answer"><h2 style="margin:0">' + esc(s.name) + ' <span class="ar-inline" lang="ar">' + esc(s.arabic) + '</span></h2><p style="margin:0">' + rich(s.meaning) + '</p><p style="margin:0"><b>' + rich(s.action) + '</b></p>' +
            (sf ? verseBox(sf, null, { play: true, size: 'sm' }) + (s.note ? '<div class="note">' + rich(s.note) + '</div>' : '') : '') + '</div>' + gradesHTML();
        }
      } else if (c.t === 'k') {
        var k = legend[c.cls];
        if (!revealed) h += '<div class="center-col" data-act="flip"><div class="prompt">Which tajweed rule uses this color?</div><div class="swatch bg-' + k.id + '" lang="ar">' + esc(k.sample) + '</div></div><button class="btn big" type="button" data-act="flip">Show answer <kbd>Space</kbd></button>';
        else h += '<div class="center-col"><div class="swatch bg-' + k.id + '" lang="ar">' + esc(k.sample) + '</div></div><div class="answer"><h2 style="margin:0" class="center">' + esc(k.name) + '</h2><p class="center" style="margin:0"><span class="ar-inline" lang="ar">' + esc(k.arabic) + '</span></p><p class="center" style="margin:0"><b>' + esc(k.short) + '</b></p><p class="center small">Lesson: ' + lessonLink(k.lesson) + '</p></div>' + gradesHTML();
      }
      h += '</div><div class="hint-keys">Keys: <kbd>Space</kbd> flip · <kbd>1</kbd>–<kbd>4</kbd> grade · <kbd>P</kbd> play</div>';
      root.innerHTML = h;
      I18n.localize(root);
    }
    function reveal() {
      revealed = true; render();
      var c = cardById[cur];
      if (S.settings.autoplay && (c.t === 'r' || (c.t === 's' && symById[c.sym].f))) {
        var b = $('[data-audio]', root); if (b) playClip(b.dataset.audio, b);
      }
    }
    function doGrade(g) {
      if (!revealed && !(cardById[cur].t === 'i' && answered)) return;
      grade(cur, g); counts[g]++;
      if (g === 0) { again++; queue.splice(Math.min(3, queue.length), 0, cur); } else done++;
      next();
    }
    function onClick(e) {
      var t = e.target.closest('[data-act],[data-grade],[data-opt]');
      if (!t || !root.contains(t)) return;
      if (t.dataset.grade != null) return doGrade(+t.dataset.grade);
      if (t.dataset.opt) { answered = t.dataset.opt; revealed = true; render(); var b = $('[data-audio]', root); if (b && S.settings.autoplay) playClip(b.dataset.audio, b); return; }
      var a = t.dataset.act;
      if (a === 'flip' && !revealed) reveal();
      else if (a === 'continue') doGrade(answered === cardById[cur].lesson ? 2 : 0);
      else if (a === 'again-session') { queue = shuffle(ids); total = queue.length; done = 0; again = 0; counts = [0, 0, 0, 0]; next(); }
    }
    function onKey(e) {
      if (e.target.closest && e.target.closest('dialog')) return;
      if ($('#colors-dialog').open) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var c = cur && cardById[cur]; if (!c) return;
      if (e.key === ' ' || e.key === 'Enter') {
        var tag = e.target.tagName;
        if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || tag === 'SELECT' || tag === 'INPUT') return; // native activation
        e.preventDefault();
        if (c.t === 'i') { if (answered) doGrade(answered === c.lesson ? 2 : 0); }
        else if (!revealed) reveal();
      } else if (/^[1-4]$/.test(e.key)) {
        if (c.t === 'i' && !answered) { var o = $$('.opt', root)[+e.key - 1]; if (o) o.click(); }
        else doGrade(+e.key - 1);
      } else if (e.key.toLowerCase() === 'p') {
        var b = $('[data-audio]', root); if (b) playClip(b.dataset.audio, b);
      }
    }
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    next();
    return function () { root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); stopAudio(); };
  }

  // ----- symbols & colors
  function viewSymbols(sel) {
    setNav('symbols'); setTitle('Symbols');
    var html = '<h1>Symbols of the Mushaf</h1><p class="muted">Every small mark has a job. Tap a sign to see its name, what it means and an example from the Quran.</p>' +
      '<div class="row" style="margin-bottom:1rem"><a class="btn" href="#/practice/symbols">Practice these as flashcards</a><a class="btn soft" href="#/colors">Color key</a></div>';
    D.symbols.forEach(function (g) {
      html += '<h2 style="margin-top:1.5rem">' + esc(g.title) + '</h2><p class="muted">' + esc(g.blurb) + '</p><div class="sym-grid">' +
        g.items.map(function (i) { return '<button type="button" class="sym" data-sym="' + i.id + '" aria-pressed="' + (sel === i.id) + '"><span class="g" lang="ar">' + esc(i.glyph) + '</span><span class="n">' + esc(i.name) + '</span></button>'; }).join('') + '</div>';
    });
    html += '<div class="sym-detail" id="sym-detail" aria-live="polite"></div>';
    app.innerHTML = html;
    function show(id) {
      var s = symById[id]; if (!s) return;
      var f = s.f ? D.frags[s.f] : null;
      $('#sym-detail').innerHTML = '<div class="card stack"><div class="row"><span class="big-sign" style="font-size:3.4rem" lang="ar">' + esc(s.glyph) + '</span><div><h2 style="margin:0">' + esc(s.name) + '</h2><span class="ar-inline" lang="ar">' + esc(s.arabic) + '</span></div></div>' +
        '<p style="margin:0">' + rich(s.meaning) + '</p><p style="margin:0"><b>' + rich(s.action) + '</b></p>' + (f ? verseBox(f, null, { play: true, gloss: true }) + (s.note ? '<div class="note">' + rich(s.note) + '</div>' : '') : '') + '</div>';
      $$('.sym', app).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sym === id)); });
      $('#sym-detail').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      I18n.localize($('#sym-detail'));
    }
    app.onclick = function (e) { var b = e.target.closest('.sym'); if (b) show(b.dataset.sym); };
    if (sel) show(sel);
  }
  function colorRows(closeOnClick) {
    return '<div class="color-list">' + D.legend.map(function (c) {
      return '<a class="color-row" href="#/lesson/' + c.lesson + '"' + (closeOnClick ? ' data-close' : '') + '><span class="sw bg-' + c.id + '" lang="ar">' + esc(c.sample) + '</span><span><b>' + esc(c.name) + '</b> <span class="ar-inline" lang="ar">' + esc(c.arabic) + '</span><span class="small muted" style="display:block">' + esc(c.short) + '</span></span></a>';
    }).join('') + '</div>';
  }
  function viewColors() {
    setNav('symbols'); setTitle('Color key');
    app.innerHTML = '<h1>Tajweed color key</h1><p class="muted">Tap a color to open its lesson. Longer madd means a deeper blue. Grays are quiet or hidden letters.</p><div class="row" style="margin-bottom:1rem"><a class="btn" href="#/practice/colors">Practice the colors</a></div>' + colorRows(false);
  }

  function viewAbout() {
    setNav(''); setTitle('About');
    app.innerHTML = '<h1>About Tarteel</h1><div class="card stack"><p>Tarteel (<span class="ar-inline" lang="ar">ترتيل</span>) means reciting the Quran slowly, clearly and in order. This project is a free study aid for learning tajweed: a step-by-step course, flashcards with audio, and the same content as Anki decks.</p>' +
      '<p><b>Please learn with a teacher.</b> Tajweed is learned by listening and reciting back to someone qualified. Use this as practice between lessons, not as a replacement.</p>' +
      '<h2>Counts and lengths</h2><p>Lengths of madd follow the common teaching for Hafs ʿan ʿĀṣim (Shāṭibiyyah): natural 2, connected and separated 4 to 5, necessary 6, and 2, 4 or 6 on stopping. If your teacher uses a different length, follow your teacher.</p>' +
      '<h2>Credits</h2><ul class="list"><li>Quran text, KFGQPC Uthmanic Hafs font © King Fahd Glorious Quran Printing Complex, used unmodified under its free-use license.</li><li>Tajweed annotation, word timings and word-by-word meanings via the Quran.com API.</li><li>Recitation: Mahmoud Khalil Al-Husary (Murattal), via EveryAyah.com.</li><li>Interface fonts: DM Sans and DM Mono (SIL Open Font License).</li><li>Natural-madd coloring on unmarked letters is added by this project.</li></ul>' +
      '<h2>Anki decks</h2><div class="row" id="dl-row"></div></div>';
    fillDownloads($('#dl-row'));
  }

  // ---------------------------------------------------------------- router
  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
    stopAudio(); app.onclick = null;
    var h = (location.hash || '#/').replace(/^#\/?/, '').split('?')[0].split('/');
    var a = h[0] || '', b = h[1], c = h[2];
    try {
      if (a === '') viewHome();
      else if (a === 'path') viewPath();
      else if (a === 'level') viewLevel(b);
      else if (a === 'lesson') viewLesson(b, c);
      else if (a === 'practice') b ? viewDeck(b) : viewPractice();
      else if (a === 'symbols') viewSymbols(b);
      else if (a === 'colors') viewColors();
      else if (a === 'about') viewAbout();
      else viewHome();
    } catch (err) {
      console.error(err);
      app.innerHTML = '<div class="card"><h2>Something went wrong</h2><p>' + esc(err.message) + '</p><a class="btn" href="#/">Home</a></div>';
    }
    window.scrollTo(0, 0);
    I18n.localize(app);
    app.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- chrome
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-audio]');
    if (a) { e.preventDefault(); playClip(a.dataset.audio, a); }
    if (e.target.closest('[data-close]')) $('#colors-dialog').close();
  });
  function applyTheme() {
    var t = S.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  }
  $('#btn-theme').addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    S.settings.theme = dark ? 'light' : 'dark'; saveState(); applyTheme();
  });
  $('#btn-colors').addEventListener('click', function () { $('#colors-body').innerHTML = colorRows(true); I18n.localize($('#colors-body')); $('#colors-dialog').showModal(); });
  $('#colors-dialog').addEventListener('click', function (e) { if (e.target === this) this.close(); });

  loadState(); applyTheme();
  I18n.localize(document.body);
  var languageButton = $('#btn-language');
  languageButton.textContent = language === 'ar' ? 'English' : 'العربية';
  languageButton.lang = language === 'ar' ? 'en' : 'ar';
  languageButton.dir = language === 'ar' ? 'ltr' : 'rtl';
  languageButton.setAttribute('aria-label', languageButton.textContent);
  languageButton.addEventListener('click', function () {
    var nextLanguage = language === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('tarteel.language', nextLanguage); } catch (e) { /* optional storage */ }
    var url = new URL(location.href); url.searchParams.set('lang', nextLanguage);
    location.href = url.href;
  });
  if (language === 'ar') $('meta[name="description"]').content = 'تعلم التجويد خطوة بخطوة مع مصحف المدينة والأمثلة المسموعة والبطاقات التعليمية.';
  window.addEventListener('hashchange', route);
  route();
})();
