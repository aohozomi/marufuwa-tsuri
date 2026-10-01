/* まるふわ つりびより：オフライン用（service worker・外付け・総司令部）
   ・ネットが ある 時は、いつも いちばん あたらしい ものを とる（ふるい 版が のこらない）。ネットが ない 時だけ、ほぞんした ものを 出す
   ・おなじ サイトの GET だけ あつかう。そとへは 何も 出ない・送らない。ほぞん先は この ブラウザの なかだけ
   ・?nosw=1 で ひらくと、この しくみを 外す（register 側）
   ・ばんごうを かえると、ふるい ほぞんは 消える（VER） */
'use strict';
const VER = 'marufuwa-tsuri-sw-v21';   // 9/30 夕方：魚06〜11・28 の 本物の 絵（14ファイル）と、ひろばの 新しい 動き（パレード・ベンチ・おとしもの）・おへや・ひみつの 更新を まとめて 出す ため 上げた（v2＝9/30 昼の 40本）
const CORE = ['./', 'index.html', 'links/', 'links/stream/', 'tsuri-pagesound.js', 'img/pose/marufuwa_nage.png', 'img/pose/marufuwa_mate.png', 'img/pose/marufuwa_hiki.png', 'img/pose/marufuwa_age.png', 'manifest.webmanifest', 'manifest-en.webmanifest', 'og.png', 'hiroba/', 'hiroba/osusume/', 'data/osusume.json', 'hiroba/bijutsukan/', 'data/gallery.json', 'data/shop.json', 'maruiro/', 'hiroba/cafe/', 'renshu/', 'anshin/', 'tsuri-ame.js', 'tsuri-art.js', 'tsuri-art-real.js', 'tsuri-wear.js', 'tsuri-mame.js', 'tsuri-art-season.js', 'tsuri-art-ext.js', 'tsuri-daily.js', 'tsuri-bgm.js', 'tsuri-en.js', 'tsuri-en-hiroba.js', 'tsuri-en-anshin.js', 'tsuri-sw-register.js', 'tsuri-himitsu.js', 'tsuri-ikimono.js', 'tsuri-nushi.js', 'tsuri-oshaberi.js', 'tsuri-tank.js', 'tsuri-tegami.js', 'tsuri-note.js', 'tsuri-own.js', 'tsuri-world.js', 'tsuri-ruby.js', 'tsuri-ruby-dict.js', 'tsuri-tooku.js', 'tsuri-town.js', 'tsuri-koe.js', 'img/favicon-32.png', 'img/favicon-48.png', 'img/friend-alpaca-s.webp', 'img/friend-azarashi-s.webp', 'img/friend-gantai-s.webp', 'img/friend-hamster-s.webp', 'img/friend-hiyoko-s.webp', 'img/friend-hoho-s.webp', 'img/friend-kawauso-s.webp', 'img/friend-kogitsune-s.webp', 'img/friend-koinu-s.webp', 'img/friend-kojika-s.webp', 'img/friend-neko-s.webp', 'img/friend-panda-s.webp', 'img/friend-penguin-s.webp', 'img/friend-ribbon-s.webp', 'img/friend-risu-s.webp', 'img/friend-tanuki-s.webp', 'img/friend-usagi-s.webp', 'img/friend-shirotama-s.webp', 'img/friend-komugi-s.webp', 'img/game-apricot.webp', 'img/game-blue.webp', 'img/game-mint.webp', 'img/game-smile.webp', 'img/game-sparkle.webp', 'img/icon-180.png', 'img/icon-192.png', 'img/icon-512.png', 'img/fish/00.webp', 'img/fish/01.webp', 'img/fish/02.webp', 'img/fish/03.webp', 'img/fish/04.webp', 'img/fish/05.webp', 'img/fish/00_s.png', 'img/fish/01_s.png', 'img/fish/02_s.png', 'img/fish/03_s.png', 'img/fish/04_s.png', 'img/fish/05_s.png', 'img/fish/06.webp', 'img/fish/07.webp', 'img/fish/08.webp', 'img/fish/09.webp', 'img/fish/10.webp', 'img/fish/11.webp', 'img/fish/28.webp', 'img/fish/06_s.png', 'img/fish/07_s.png', 'img/fish/08_s.png', 'img/fish/09_s.png', 'img/fish/10_s.png', 'img/fish/11_s.png', 'img/fish/28_s.png'];   // ぜんぶ さきに 取っておく（ないものは とばす）。あとから ふえた ものは つかった ときに 取る
const TIMEOUT = 4000;   // ネットが おそい とき、4びょうで ほぞんした ものに きりかえる

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VER).then(cache => Promise.all(CORE.map(u => cache.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('marufuwa-tsuri-sw-') && k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isImage = url => /\.(webp|png|jpe?g|gif|svg|ico|mp3)$/i.test(url.pathname);
// ほぞんは「コピーを さきに とる」（ページが なかみを よみはじめる まえに）。あとから コピーすると しっぱいする
function keep(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return;
  const copy = response.clone();
  caches.open(VER).then(cache => cache.put(request, copy)).catch(() => {});
}
async function fallback(request) {
  const cache = await caches.open(VER);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  if (request.mode === 'navigate') {
    // ひろば・おうちの かたへ など、ほぞんが なければ ほんたいの ページを 出す
    return (await cache.match('index.html', { ignoreSearch: true })) || (await cache.match('./', { ignoreSearch: true })) || Response.error();
  }
  return Response.error();
}
function networkFirst(request) {
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(async () => { if (done) return; const hit = await (await caches.open(VER)).match(request, { ignoreSearch: true }); if (hit) { done = true; resolve(hit); } }, TIMEOUT);
    // cache:'no-cache' ＝ ブラウザの ちょっとした ほぞん（GitHub Pages は 10ぷん）に たよらず、かならず 確かめる（かわって いなければ すぐ 終わる）
    fetch(request.mode === 'navigate' ? request.url : request, { cache: 'no-cache' }).then(res => { clearTimeout(timer); keep(request, res); if (!done) { done = true; resolve(res); } })
      .catch(async () => { clearTimeout(timer); if (!done) { done = true; resolve(await fallback(request)); } });
  });
}
async function cacheFirst(request) {
  const cache = await caches.open(VER);
  const hit = await cache.match(request);
  if (hit) { fetch(request).then(res => keep(request, res)).catch(() => {}); return hit; }   // つかいながら あたらしく しておく
  try { const res = await fetch(request); keep(request, res); return res; } catch (e) { return Response.error(); }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // そとの ものは さわらない
  event.respondWith(isImage(url) ? cacheFirst(request) : networkFirst(request));
});
