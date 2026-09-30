/* まるふわ つりびより：とおくから みる（そとづけ）
   ・マスター 9/30「米粒くらい小さいまるふわ、周りは広々、いろんな人が周りにいて、釣りだけに集中できる場所。今の版と両方」
   ・ボタン「とおく：OFF/ON」を 1つ足す。ON のあいだ、いつもの ちかくの けしきを かくして、ひろい みずうみを だす
   ・つりの しくみは ほんたいの まま（おなじ ボタン・おなじ きろく・おなじ ずかん）。よむのは data-phase／data-time／data-area／data-rain と、なかまの え（img）だけ
   ・なまえは かえない。ほぞんは じぶんの かぎ（marufuwa-tooku-v1）だけ。そとへは なにも おくらない */
(() => {
  'use strict';
  const scene = document.getElementById('scene'), sub = document.querySelector('.sub-actions');
  if (!scene || window.TsuriTooku) return;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'marufuwa-tooku-v1';
  let on = false; try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}

  const style = document.createElement('style'); style.id = 'tooku-style';
  style.textContent = `
#scene[data-tooku=true] > .who,#scene[data-tooku=true] > .spot,#scene[data-tooku=true] > #keeper,#scene[data-tooku=true] > .held,#scene[data-tooku=true] > #shadow,#scene[data-tooku=true] > .ambient-fish,#scene[data-tooku=true] > #float,#scene[data-tooku=true] > #equip,#scene[data-tooku=true] > svg.land,#scene[data-tooku=true] > #soil,#scene[data-tooku=true] > #pond,#scene[data-tooku=true] > #bubble,#scene[data-tooku=true] > #held-friend,#scene[data-tooku=true] > #bang{visibility:hidden!important}
#scene[data-tooku=true] > #sky{height:46%}
#scene[data-tooku=true] > #ikimono{display:none}   /* とおくは しずかに：とんぼ・ちょうちょ・おちば は ださない */
#tooku{position:absolute;inset:0;z-index:1;pointer-events:none;display:none;container-type:size;overflow:hidden}
#scene[data-tooku=true] #tooku{display:block}
#tooku .far{position:absolute;left:-2%;right:-2%;top:36%;height:14%;background:var(--hill,#a9d89a);border-radius:50% 50% 0 0/100% 100% 0 0;filter:brightness(.9) saturate(.8);opacity:.9}
#tooku .far2{position:absolute;left:30%;right:-10%;top:40%;height:12%;background:var(--tree,#6fbf6a);border-radius:60% 40% 0 0/100% 100% 0 0;opacity:.7}
#tooku canvas.water{position:absolute;left:0;right:0;top:46%;width:100%;height:54%;display:block;image-rendering:auto}
#tooku .shore{position:absolute;left:-4%;width:46%;top:84%;height:22%;background:radial-gradient(ellipse at 40% 20%,#f6ecd4,var(--ground,#efe3c6) 60%);border-radius:50% 50% 0 0/100% 100% 0 0;box-shadow:inset 0 3px 0 var(--edge,#cdb98f)}
#tooku .grass{position:absolute;width:.5cqw;height:2.2cqw;background:#5aa85a;border-radius:50% 50% 0 0;transform-origin:50% 100%;translate:-50% -100%;animation:sway 4.6s ease-in-out infinite alternate}
#tooku .stone{position:absolute;width:1.4cqw;height:.9cqw;border-radius:50%;background:#bfb6a6;box-shadow:inset -2px -2px 0 #9a9284;translate:-50% -50%}
#tooku .boat::after{content:'';position:absolute;left:8%;right:8%;bottom:-.6cqw;height:1cqw;border-radius:50%;background:#0b2a4a40;filter:blur(1px)}
#tooku .dock{position:absolute;left:62%;width:20%;top:78%;height:2.2cqw;background:#b08a5a;border-radius:2px;box-shadow:0 2px 0 #7a5a38}
#tooku .me{position:absolute;left:14%;top:83%;width:5.6cqw;translate:-50% -100%}
#tooku .me img{scale:-1 1}
#tooku .me img{width:100%;height:auto;display:block}
#tooku .pal{position:absolute;width:4.6cqw;translate:-50% -100%}
#tooku .pal img{width:100%;height:auto;display:block}
#tooku .pal.flip img{scale:-1 1}
#tooku .boat{position:absolute;width:11cqw;translate:-50% -60%;animation:tooku-bob 3.2s ease-in-out infinite alternate}
#tooku .boat svg{display:block;width:100%;height:auto;overflow:visible}
#tooku .boat .pal{left:46%;top:38%;width:3.6cqw}
#tooku svg.lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
#tooku svg.lines path{fill:none;stroke:#ffffff90;stroke-width:.9px;vector-effect:non-scaling-stroke}
#tooku .bobber{position:absolute;width:.9cqw;height:1.1cqw;border-radius:50% 50% 45% 45%;background:linear-gradient(#ff6a4a 55%,#fff7e0 55%);translate:-50% -60%;animation:tooku-bob 2.4s ease-in-out infinite alternate;animation-delay:var(--d,0s);box-shadow:0 1px 1px #0003}
#tooku .mine{width:1.4cqw;height:1.7cqw;box-shadow:0 0 0 1.5px #fff8,0 0 6px #fff}
#scene[data-phase=bite] #tooku .mine,#scene[data-phase=reel] #tooku .mine{animation:tooku-dip .45s ease-in-out infinite}
#tooku .ring{position:absolute;width:4cqw;height:1.6cqw;translate:-50% -50%;border:1.5px solid #ffffffa0;border-radius:50%;opacity:0}
#scene[data-phase=waiting] #tooku .ring,#scene[data-phase=bite] #tooku .ring,#scene[data-phase=reel] #tooku .ring{animation:tooku-ring 2.2s ease-out infinite}
#tooku .fish{position:absolute;width:5cqw;height:1.6cqw;translate:-50% -50%;border-radius:50%;background:#0b2a4a3a;filter:blur(1.2px);mix-blend-mode:multiply;opacity:0;animation:tooku-fish 5s ease-in-out infinite alternate;animation-delay:var(--d,0s)}
#tooku .name{position:absolute;translate:-50% 0;font-size:.62rem;font-weight:800;color:#fff;text-shadow:0 1px 2px #0008;white-space:nowrap}
#tooku-toggle{--c1:#e8f0ff;--c2:#9fb8ee;--side:#5d7fcc;--ink:#1f3a6e;flex:1 1 40%;min-height:54px;font-size:.95rem}
#tooku-toggle[aria-pressed=true]{--c1:#cfe0ff;--c2:#6f95e6;--side:#3e63bd}
#scene[data-tooku=true] #nushi-fx,#scene[data-tooku=true] #ame{z-index:5}
@keyframes tooku-glint{from{background-position:0 0}to{background-position:0 9cqh}}
@keyframes tooku-bob{from{transform:translateY(-6%)}to{transform:translateY(6%)}}
@keyframes tooku-dip{0%,100%{transform:translateY(0)}50%{transform:translateY(40%)}}
@keyframes tooku-ring{0%{transform:scale(.3);opacity:.8}100%{transform:scale(2.4);opacity:0}}
@keyframes tooku-fish{0%{opacity:0;translate:-50% -50%}30%,70%{opacity:.8}100%{opacity:0;translate:calc(-50% + 14cqw) -50%}}
@media(prefers-reduced-motion:reduce){#tooku *{animation:none!important}#tooku .fish{opacity:.5}}
`;
  document.head.append(style);
  const layer = document.createElement('div'); layer.id = 'tooku'; layer.setAttribute('aria-hidden', 'true');
  const sky = scene.querySelector('#sky'); sky ? sky.after(layer) : scene.prepend(layer);

  const PALS = ['neko', 'usagi', 'tanuki', 'hiyoko', 'kawauso', 'kojika', 'risu', 'panda', 'hamster', 'koinu', 'azarashi', 'alpaca', 'ribbon', 'hoho', 'gantai'];
  const day = new Date(); let seed = (day.getFullYear() * 400 + day.getMonth() * 31 + day.getDate()) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const between = (a, b) => a + rnd() * (b - a);
  const html = (cls, styles, inner) => { const e = document.createElement('span'); e.className = cls; Object.assign(e.style, styles); if (inner) e.innerHTML = inner; layer.append(e); return e; };
  const img = id => '<img src="img/' + (id === 'me' ? 'game-blue' : 'friend-' + id + '-s') + '.webp" alt="" draggable="false">';
  let lines = null;
  // いと：さおの さきから ウキへ、じゅうりょくで すこし たれる まがった せん（SVG）
  const line = (x1, y1, x2, y2) => { if (!lines) { lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lines.setAttribute('class', 'lines'); lines.setAttribute('viewBox', '0 0 100 100'); lines.setAttribute('preserveAspectRatio', 'none'); layer.append(lines); } const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + Math.abs(x2 - x1) * .35; p.setAttribute('d', 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2); lines.append(p); return p; };
  // ふね：きの こぶね（へさきが すこし あがる）
  const BOAT = '<svg viewBox="0 0 110 40"><path d="M4 12 Q2 30 22 34 L88 34 Q106 30 106 10 L98 14 Q92 26 86 26 L24 26 Q14 26 10 14 Z" fill="#c98d5a" stroke="#8a5a34" stroke-width="2"/><path d="M12 22 H96" stroke="#8a5a34" stroke-width="1.5"/><path d="M30 26 v-9 M64 26 v-9" stroke="#8a5a34" stroke-width="2"/><ellipse cx="55" cy="36" rx="46" ry="3" fill="#0b2a4a30"/></svg>';


  // みず：けいさんで かく（なみ・きらめき・そらと たいようの うつりこみ・とおくほど こまかい）。ほんものの みずうみの ように、ゆっくり うごく
  let cv = null, raf = 0, poll = 0, tickFn = null;
  const cssVar = (name, fb) => getComputedStyle(scene).getPropertyValue(name).trim() || fb;
  const stopWater = () => { if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(poll); poll = 0; };
  const hex = c => { const m = /^#([0-9a-f]{6})/i.exec(c); if (!m) return [80, 160, 210]; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const noise = (() => { const P = new Uint8Array(512); for (let i = 0; i < 256; i++) P[i] = P[i + 256] = (i * 131 + 7) % 256 ^ (i * 29 & 255); const g = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y); const f = t => t * t * (3 - 2 * t); return (x, y) => { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); const u = f(x), v = f(y); const a = P[P[X] + Y], b = P[P[X + 1] + Y], c = P[P[X] + Y + 1], d = P[P[X + 1] + Y + 1]; return (g(a, x, y) * (1 - u) + g(b, x - 1, y) * u) * (1 - v) + (g(c, x, y - 1) * (1 - u) + g(d, x - 1, y - 1) * u) * v; }; })();
  function water() {
    cv = document.createElement('canvas'); cv.className = 'water'; cv.width = 240; cv.height = 96; layer.append(cv);
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, im = ctx.createImageData(W, H), d = im.data;
    let t0 = performance.now(), last = 0, key = '', w1, w2, sky, night, rain;
    // 軽く する（でんち・古い スマホ）：①色は 時間・雨が かわった 時だけ 読む（毎回 CSS を 読むと スタイルの 再計算を 毎コマ ひきおこす）②20コマ/びょう（ながめる 12・なにも しない 6）③窓が ひらいて いる 間・画面が かくれて いる 間は 描かない ④「動きを へらす」の 人は 1まいだけ 描いて 止める
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gap = () => document.body.classList.contains('quiet') ? 170 : document.body.classList.contains('gazing') ? 84 : 50;
    const later = (fn, ms) => { poll = setTimeout(() => { poll = 0; if (on && !document.hidden) raf = requestAnimationFrame(fn); }, ms); };
    const tick = now => {
      raf = 0; if (!on || document.hidden) return;
      if (document.querySelector('dialog[open]')) { later(tick, 400); return; }
      const k = scene.dataset.time + '|' + scene.dataset.rain, still = reduced();
      if (last && k === key) { if (still) { later(tick, 600); return; } if (now - last < gap()) { raf = requestAnimationFrame(tick); return; } }
      last = now;
      if (k !== key) { key = k; w1 = hex(cssVar('--water1', '#7fd0f2')); w2 = hex(cssVar('--water2', '#3b9bd0')); sky = hex(cssVar('--sky2', '#eaf8ff')); night = scene.dataset.time === 'yoru'; rain = scene.dataset.rain === 'true'; }
      const t = still ? 3 : (now - t0) / 1000;
      const sunX = night ? .62 : .78, glitter = night ? .35 : rain ? .15 : .8;
      for (let y = 0; y < H; y++) {
        const fy = y / H, depth = Math.pow(fy, .6);                          // てまえほど ふかい いろ
        const scale = 1 / (.35 + fy * 1.6);                                    // とおくほど なみが こまかい（えんきんかん）
        for (let x = 0; x < W; x++) {
          const fx = x / W;
          const n = noise(fx * 18 * scale + t * .22, fy * 26 * scale - t * .35) * .6 + noise(fx * 46 * scale - t * .3, fy * 60 * scale + t * .5) * .4;
          const mix = Math.min(1, Math.max(0, depth + n * .18));
          let r = w1[0] + (w2[0] - w1[0]) * mix, g = w1[1] + (w2[1] - w1[1]) * mix, b = w1[2] + (w2[2] - w1[2]) * mix;
          const refl = Math.max(0, (1 - fy) * .55 - .1) * (1 + n * .5);       // とおくは そらを うつす
          r += (sky[0] - r) * refl; g += (sky[1] - g) * refl; b += (sky[2] - b) * refl;
          const dsun = Math.abs(fx - sunX) * (1.6 + fy * 3), spark = Math.max(0, n - .32) * 3.2 * glitter * Math.max(0, 1 - dsun) * (1 - fy * .55);   // たいよう／つきの みちの きらめき
          r += (255 - r) * spark; g += (250 - g) * spark; b += (215 - b) * spark;
          const i = (y * W + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        }
      }
      ctx.putImageData(im, 0, 0);
      if (still) later(tick, 600); else raf = requestAnimationFrame(tick);
    };
    tickFn = tick; raf = requestAnimationFrame(tick);
  }
  // 画面が もどって きた 時：あたらしい canvas を ふやさず、とまって いた ループだけ 再開（前は もどる たびに canvas と ループが ふえて いた）
  document.addEventListener('visibilitychange', () => { if (!document.hidden && on && tickFn && !raf && !poll) raf = requestAnimationFrame(tickFn); });
  function build() {
    stopWater();
    layer.textContent = '';
    seed = (day.getFullYear() * 400 + day.getMonth() * 31 + day.getDate()) >>> 0;
    html('far', {}); html('far2', {}); water(); html('dock', {}); html('shore', {});
    // わたし：ひだりした の きしに、こめつぶ くらい
    html('me', {}, img('me'));
    line(17, 72, 30, 68); const mine = html('bobber mine', {left: '30%', top: '68%'}); html('ring', {left: '30%', top: '68%'});
    // なかまが てんてんと：むこうぎし・さんばし・ふね
    const shuffled = [...PALS].sort(() => rnd() - .5).slice(0, 9);
    const spots = [[26, 52], [40, 50], [54, 51], [68, 49], [86, 51], [72, 78, 'dock'], [80, 78, 'dock'], [48, 63, 'boat'], [88, 66, 'boat']];
    spots.forEach(([x, y, kind], i) => {
      const id = shuffled[i], flip = x > 50 && kind !== 'boat';
      if (kind === 'boat') { const b = html('boat', {left: x + '%', top: y + '%'}, BOAT); const p = document.createElement('span'); p.className = 'pal'; p.innerHTML = img(id); b.append(p); line(x + 1.5, y - 3.5, x + 8, y + 3); html('bobber', {left: (x + 8) + '%', top: (y + 3) + '%', '--d': '-' + between(0, 2).toFixed(1) + 's'}); return; }
      html('pal' + (flip ? ' flip' : ''), {left: x + '%', top: y + '%', width: kind === 'dock' ? '5cqw' : '3.6cqw'}, img(id));
      const fx = flip ? x - 4 : x + 4, fy = y + (kind === 'dock' ? 6 : 5);
      line(flip ? x - 1.2 : x + 1.2, y - 3.6, fx, fy); html('bobber', {left: fx + '%', top: fy + '%', '--d': '-' + between(0, 2).toFixed(1) + 's'});
    });
    for (let i = 0; i < 7; i++) html('grass', {left: between(2, 38) + '%', top: between(87, 96) + '%', rotate: between(-14, 14) + 'deg'});
    for (let i = 0; i < 4; i++) html('stone', {left: between(3, 36) + '%', top: between(88, 97) + '%'});
    for (let i = 0; i < 4; i++) html('fish', {left: between(20, 80) + '%', top: between(56, 92) + '%', '--d': '-' + between(0, 5).toFixed(1) + 's'});
  }

  const toggle = document.createElement('button'); toggle.id = 'tooku-toggle'; toggle.type = 'button';
  function draw() { scene.dataset.tooku = String(on); if (!on) stopWater(); toggle.textContent = on ? 'とおく：ON' : 'とおく：OFF'; toggle.setAttribute('aria-pressed', String(on)); if (on) build(); }
  toggle.addEventListener('click', () => { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} draw(); const s = document.getElementById('status'); if (s) s.textContent = on ? 'とおくから みて いるよ。ひろい みずうみで、のんびり。' : 'ちかくに もどったよ。'; });
  if (sub) { const gaze = document.getElementById('gaze'); gaze ? gaze.before(toggle) : sub.append(toggle); }
  draw();
  addEventListener('resize', () => { if (on) build(); });
  window.TsuriTooku = {on: () => on, count: () => layer.children.length, rebuild: build};
})();
