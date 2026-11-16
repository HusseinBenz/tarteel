/* Tarteel audio: one player, and everything that must stay in step with it.
 *
 *   words(html, n)      wrap each word of a fragment in <span class="w">, so it can be lit
 *   play(btn)           play a clip; the word being recited is highlighted as it sounds
 *   playWord(verse, i)  play one word of a clip
 *   echo(btn)           listen-and-repeat: the clip, then a silent turn for the learner, x3
 *   playAll(btn, list)  play several verses in order, following along on the page
 *   recorder            record the learner, so they can compare with the reciter
 *
 * Word timings come from the build (frag.timing), measured against the same
 * window the clip was cut with, so the highlight follows the sound itself:
 * it is driven by the player's clock on every frame, at any playback speed.
 */
(function () {
  'use strict';

  var player = document.getElementById('player');
  var T = function (s) { return window.TarteelI18n ? window.TarteelI18n.text(s) : s; };
  var frags = function () { return (window.TARTEEL || {}).frags || {}; };

  // A highlight that lands exactly on the sound reads as late: lead it by a frame or two.
  var LEAD_MS = 40;
  var SIGN_ONLY = /^[۝۞۩\s]+$/;

  // ------------------------------------------------------------ word markup
  // Split a fragment's HTML at the spaces between words (never inside a tag),
  // keeping hizb and sajdah signs with their neighbour as the build does.
  function splitWords(html) {
    var out = [], cur = '', inTag = false;
    for (var i = 0; i < html.length; i++) {
      var ch = html[i];
      if (ch === '<') inTag = true; else if (ch === '>') inTag = false;
      if (ch === ' ' && !inTag) { if (cur) out.push(cur); cur = ''; } else cur += ch;
    }
    if (cur) out.push(cur);
    var merged = [], lead = '';
    out.forEach(function (w) {
      if (SIGN_ONLY.test(w.replace(/<[^>]+>/g, ''))) { if (merged.length) merged[merged.length - 1] += ' ' + w; else lead += w + ' '; }
      else { merged.push(lead + w); lead = ''; }
    });
    return merged;
  }
  function words(html, n) {
    var list = splitWords(html);
    if (n != null && list.length !== n) return html; // unexpected shape: play without highlighting
    return list.map(function (w, i) { return '<span class="w" data-w="' + i + '">' + w + '</span>'; }).join(' ');
  }

  // ------------------------------------------------------------ state
  var cur = null;      // { btn, verse, timing, from, to, mode }
  var raf = 0, chain = null, gapTimer = 0;
  var listeners = [];
  function emit(name, detail) { listeners.forEach(function (fn) { fn(name, detail); }); }

  function verseFor(btn) {
    var fid = btn.getAttribute('data-frag');
    var own = btn.closest('.verse');
    if (own) return own;
    var scope = btn.closest('.flash, .example, .sym-detail, .card') || document;
    return fid ? scope.querySelector('.verse[data-frag="' + fid + '"]') : null;
  }
  function label(btn, text) { var t = btn && btn.querySelector('.t'); if (t) t.textContent = T(text); }
  function mark(verse, index) {
    if (!verse) return;
    var ws = verse.querySelectorAll('.w');
    for (var i = 0; i < ws.length; i++) {
      ws[i].classList.toggle('now', i === index);
      ws[i].classList.toggle('said', index >= 0 && i < index);
    }
  }
  function clearMarks(verse) {
    if (!verse) return;
    verse.classList.remove('is-playing', 'is-turn');
    verse.style.removeProperty('--turn');
    var ws = verse.querySelectorAll('.w.now, .w.said');
    for (var i = 0; i < ws.length; i++) ws[i].classList.remove('now', 'said');
  }
  function wordAt(timing, ms) {
    var w = timing.words, at = -1;
    for (var i = 0; i < w.length; i++) { if (w[i][0] <= ms) at = i; else break; }
    return at;
  }
  function frame() {
    if (!cur) return;
    var ms = player.currentTime * 1000;
    if (cur.to != null && ms >= cur.to) { finish(); return; }
    if (cur.timing) {
      var at = wordAt(cur.timing, ms + LEAD_MS);
      if (at !== cur.at) { cur.at = at; mark(cur.verse, at); }
    }
    if (cur.btn && player.duration) cur.btn.style.setProperty('--p', Math.min(1, player.currentTime / player.duration).toFixed(3));
    raf = requestAnimationFrame(frame);
  }
  function release() {
    cancelAnimationFrame(raf); raf = 0;
    if (!cur) return;
    if (cur.btn) { cur.btn.setAttribute('aria-pressed', 'false'); cur.btn.style.removeProperty('--p'); label(cur.btn, cur.idle || 'Listen'); }
    clearMarks(cur.verse);
    cur = null;
  }
  function finish() {
    var done = cur && cur.onend;
    try { player.pause(); } catch (e) { /* ignore */ }
    release();
    if (done) done(); else emit('idle');
  }
  function stop() {
    chain = null; clearTimeout(gapTimer); gapTimer = 0;
    try { player.pause(); } catch (e) { /* ignore */ }
    var turn = document.querySelector('.verse.is-turn'); if (turn) clearMarks(turn);
    var held = document.querySelectorAll('[data-echo][aria-pressed="true"], [data-playall][aria-pressed="true"]');
    for (var i = 0; i < held.length; i++) { held[i].setAttribute('aria-pressed', 'false'); label(held[i], held[i].getAttribute('data-idle')); }
    release();
    emit('idle');
  }

  // ------------------------------------------------------------ clips in memory
  // A clip held as a blob can be sought to any word on any host (plain static
  // servers often cannot serve byte ranges) and replays without the network.
  var blobs = {}, ready = {}, recent = [], loaded = null;
  function blobFor(src) {
    if (blobs[src]) return blobs[src];
    if (!window.fetch || location.protocol === 'file:') return Promise.resolve(null);
    var p = fetch(src).then(function (r) { return r.ok ? r.blob() : null; })
      .then(function (b) { return b ? (ready[src] = URL.createObjectURL(b)) : null; })
      .catch(function () { delete blobs[src]; return null; });
    blobs[src] = p; recent.push(src);
    if (recent.length > 48) {
      var old = recent.shift(), url = ready[old];
      delete blobs[old]; delete ready[old];
      if (url && url !== loaded) URL.revokeObjectURL(url);
    }
    return p;
  }

  // ------------------------------------------------------------ playing
  function start(opts) {
    // opts: { src, btn, verse, timing, from, to, onend, busy, idle, rate }
    cancelAnimationFrame(raf);
    if (cur) release();
    var mine = cur = { btn: opts.btn || null, verse: opts.verse || null, timing: opts.timing || null, to: opts.to, onend: opts.onend, idle: opts.idle, at: -2 };
    if (cur.btn) { cur.btn.setAttribute('aria-pressed', 'true'); label(cur.btn, opts.busy || 'Playing…'); }
    if (cur.verse) cur.verse.classList.add('is-playing');
    var rate = opts.rate || 1, from = (opts.from || 0) / 1000;
    var go = function () {
      if (cur !== mine) return;
      try { player.currentTime = from; } catch (e) { /* not seekable yet */ }
      player.defaultPlaybackRate = player.playbackRate = rate;
      var p = player.play();
      if (p && p.catch) p.catch(function (err) { if (cur !== mine || (err && err.name === 'AbortError')) return; stop(); emit('error'); });
      raf = requestAnimationFrame(frame);
    };
    var begin = function (url) {
      if (cur !== mine) return;
      if (loaded === url && player.readyState > 0) { go(); return; }
      player.preload = 'auto';
      player.src = loaded = url;
      if (from) player.addEventListener('loadedmetadata', go, { once: true }); else go();
    };
    if (ready[opts.src]) begin(ready[opts.src]);
    // Starting mid-clip needs a seekable source: wait the few milliseconds the blob takes.
    else if (from) blobFor(opts.src).then(function (url) { begin(url || opts.src); });
    else { begin(opts.src); blobFor(opts.src); }
  }
  player.addEventListener('ended', function () { if (cur) finish(); });
  // A hidden tab gets no animation frames: still stop a single word where it ends.
  player.addEventListener('timeupdate', function () { if (cur && cur.to != null && player.currentTime * 1000 >= cur.to) finish(); });
  player.addEventListener('error', function () { if (cur) { stop(); emit('error'); } });

  var rate = 1;
  function setRate(r) { rate = r; player.defaultPlaybackRate = player.playbackRate = r; }

  function describe(btn) {
    var fid = btn.getAttribute('data-frag'), f = frags()[fid];
    return { src: btn.getAttribute('data-audio') || (f && f.audio), verse: verseFor(btn), timing: f && f.timing, frag: f };
  }
  function play(btn, onend) {
    if (cur && cur.btn === btn && !chain) { stop(); return; }
    var d = describe(btn);
    if (!d.src) return;
    if (!onend) stop();
    start({ src: d.src, btn: btn, verse: d.verse, timing: d.timing, rate: rate, onend: onend });
  }
  function playWord(verse, index) {
    var f = frags()[verse.getAttribute('data-frag')];
    if (!f || !f.timing || !f.timing.words[index]) return;
    stop();
    var span = f.timing.words[index];
    start({ src: f.audio, verse: verse, timing: f.timing, rate: rate, from: Math.max(0, span[0] - 30), to: Math.min(f.timing.dur, span[1] + 30) });
  }

  // Listen and repeat: hear the clip, then recite it in the silence that follows.
  var ECHO_ROUNDS = 3;
  function echo(btn) {
    if (btn.getAttribute('aria-pressed') === 'true') { stop(); return; }
    stop();
    var d = describe(btn); if (!d.src) return;
    var token = chain = {}, round = 0;
    btn.setAttribute('aria-pressed', 'true');
    var say = function (text) { label(btn, T(text) + ' ' + (round + 1) + '/' + ECHO_ROUNDS); };
    var listen = function () {
      if (chain !== token) return;
      say('Listen');
      start({ src: d.src, verse: d.verse, timing: d.timing, rate: rate, onend: turn });
    };
    var turn = function () {
      if (chain !== token) return;
      say('Your turn');
      var ms = Math.max(1500, ((d.timing ? d.timing.dur : 2500) / rate) * 1.15);
      if (d.verse) { d.verse.style.setProperty('--turn', ms + 'ms'); d.verse.classList.add('is-turn'); }
      gapTimer = setTimeout(function () {
        if (d.verse) clearMarks(d.verse);
        if (chain !== token) return;
        round++;
        if (round < ECHO_ROUNDS) listen(); else stop();
      }, ms);
    };
    listen();
  }

  // Play a run of verses in order, keeping the one being recited in view.
  function playAll(btn, buttons) {
    if (btn.getAttribute('aria-pressed') === 'true') { stop(); return; }
    stop();
    var token = chain = {}, i = 0;
    btn.setAttribute('aria-pressed', 'true'); label(btn, 'Stop');
    var next = function () {
      if (chain !== token) return;
      var b = buttons[i++];
      if (!b || !document.contains(b)) { stop(); return; }
      var v = verseFor(b);
      if (v && v.scrollIntoView) v.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      play(b, function () { gapTimer = setTimeout(next, 450); });
    };
    next();
  }

  // Fetch clips the learner is about to need, so play starts at once.
  function preload(src) { if (src) blobFor(src); }

  // ------------------------------------------------------------ recording the learner
  var own = new Audio(), take = null, media = null, stream = null, chunks = [], recTimer = 0, recBtn = null, recStart = 0, tick = 0;
  var recorder = {
    supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    has: function () { return !!take; },
    recording: function () { return !!media; },
    clear: function () { recorder.stop(true); try { own.pause(); } catch (e) { /* ignore */ } if (take) URL.revokeObjectURL(take); take = null; },
    start: function (btn) {
      if (media) return;
      stop();
      recBtn = btn;
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s; chunks = [];
        media = new MediaRecorder(s);
        media.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        media.onstop = function () {
          var discard = media && media.discard;
          if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
          var type = (media && media.mimeType) || 'audio/webm';
          media = null; stream = null; clearTimeout(recTimer); clearInterval(tick);
          if (!discard && chunks.length) { if (take) URL.revokeObjectURL(take); take = URL.createObjectURL(new Blob(chunks, { type: type })); }
          emit('recorded', { ok: !discard && !!take });
        };
        media.start();
        recStart = Date.now();
        emit('recording', { seconds: 0 });
        tick = setInterval(function () { emit('recording', { seconds: Math.round((Date.now() - recStart) / 1000) }); }, 500);
        recTimer = setTimeout(function () { recorder.stop(); }, 45000);
      }).catch(function () { emit('mic-denied'); });
    },
    stop: function (discard) { if (media && media.state !== 'inactive') { media.discard = !!discard; media.stop(); } },
    play: function (btn) {
      if (!take) return;
      if (!own.paused) { own.pause(); return; }
      stop();
      own.src = take;
      btn.setAttribute('aria-pressed', 'true');
      var off = function () { btn.setAttribute('aria-pressed', 'false'); };
      own.onended = off; own.onpause = off;
      var p = own.play(); if (p && p.catch) p.catch(off);
    }
  };

  window.TarteelAudio = {
    words: words, splitWords: splitWords, play: play, playWord: playWord, echo: echo, playAll: playAll,
    stop: function () { stop(); try { own.pause(); } catch (e) { /* ignore */ } },
    setRate: setRate, preload: preload, recorder: recorder,
    on: function (fn) { listeners.push(fn); },
    playing: function () { return !!cur; }
  };
})();
