/* Tarteel offline support.
 *
 *   page       network first, so a new release is seen at once; the saved copy when offline
 *   ?v= assets saved on first use and then served from the device: the hash in
 *              the address changes whenever the file does, so they never go stale
 *   audio, fonts, images   saved on first use; "Save audio for offline use" fetches them all
 *
 * Both versions are stamped by tools/build_site.py. A new one retires the old caches.
 */
const VERSION = '74aa030697';
const MEDIA_VERSION = '5da3e446f5';
const SHELL = 'tarteel-shell-' + VERSION;
const MEDIA = 'tarteel-media-' + MEDIA_VERSION;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const response = await fetch('index.html', { cache: 'reload' });
    const html = await response.clone().text();
    await cache.put('index.html', response);
    // Everything the page itself asks for, at exactly the versions it names ...
    const assets = [...new Set([...html.matchAll(/(?:href|src)="((?:css|js|data|img|fonts)\/[^"]+|manifest\.webmanifest)"/g)].map(m => m[1]))];
    const isMedia = url => /^(img|fonts)\//.test(url);
    await Promise.all(assets.filter(url => !isMedia(url)).map(url => cache.add(url).catch(() => {})));
    // ... and the fonts its stylesheets ask for, which the page never names.
    const media = new Set(assets.filter(isMedia));
    for (const sheet of assets.filter(url => url.startsWith('css/'))) {
      const css = await (await cache.match(sheet) || await fetch(sheet)).text();
      for (const m of css.matchAll(/url\(["']?\.\.\/(fonts\/[^"')]+\.woff2)["']?\)/g)) media.add(m[1]);
    }
    const store = await caches.open(MEDIA);
    await Promise.all([...media].map(async url => { if (!await store.match(url)) await store.add(url).catch(() => {}); }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('tarteel-') && name !== SHELL && name !== MEDIA) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

// Players ask for a byte range; answer it from the whole saved file.
async function ranged(request, response) {
  const header = request.headers.get('range');
  const match = header && /bytes=(\d*)-(\d*)/.exec(header);
  if (!match || response.status !== 200) return response;
  const body = await response.arrayBuffer();
  const start = match[1] ? +match[1] : Math.max(0, body.byteLength - +match[2]);
  const end = match[1] && match[2] ? Math.min(+match[2], body.byteLength - 1) : body.byteLength - 1;
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + body.byteLength } });
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${body.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

async function saved(request, cacheName) {
  const cache = await caches.open(cacheName);
  const key = request.url;
  let hit = await cache.match(key);
  if (!hit) {
    const fresh = await fetch(key);          // the whole file, even when a range was asked for
    if (!fresh.ok) return fresh;
    await cache.put(key, fresh.clone());
    hit = fresh;
  }
  return ranged(request, hit);
}

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  const path = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh.ok) (await caches.open(SHELL)).put('index.html', fresh.clone());
        return fresh;
      } catch (error) {
        return (await caches.match('index.html')) || Response.error();
      }
    })());
  } else if (/^(audio|fonts|img)\//.test(path)) {
    event.respondWith(saved(request, MEDIA).catch(() => fetch(request)));
  } else if (url.searchParams.has('v') || path === 'manifest.webmanifest') {
    event.respondWith(saved(request, SHELL).catch(() => fetch(request)));
  }
});
