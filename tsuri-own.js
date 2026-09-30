/* まるふわ つりびより：じぶんの こ（外付け・ジョブズ2・総司令部 GO 2026-10-01）
   ・「いろ・あじ × いきもの」の くみあわせで じぶんの こを つくる。自由入力は ない。ほぞんは 数字だけ（save.own＝{c, a, ear, item}）。
   ・この ファイルが もつ もの：名前の表（日本語・English）／すがたの 合成／「つくる」がめん。本体（index.html）は「つなぐ」だけ。
   ・書く もの：なし（保存も 通信も しない）。よむ もの：本体が わたす save.own・レベルだけ。
   ・いまの え は「かりの もの」：既存の なかまの え（img/friend-<id>-s.webp）に 色を かさねて 出す。本番の え（天の「白ベース＋服マスク」）が 届いたら ANIMALS の え を さしかえ、PROVISIONAL を false に する。
   ・使い方：<script defer src="tsuri-own.js"></script>  →  window.TsuriOwn（valid・name・en・label・pal・src・url・openMaker…）
   ・仕様：素材引き渡し\まるふわ釣り\【ジョブズ2】独立レビュー_直近コミット_20261001\01_じぶんの子_仕様_…md */
(() => {
  'use strict';
  if (window.TsuriOwn) return;
  const EN = () => !!(window.TsuriEn && window.TsuriEn.lang === 'en');
  const T = (ja, en) => EN() ? en : ja;
  const BASE = (() => { try { return new URL('.', document.currentScript.src).href; } catch (e) { return ''; } })();   // ひろば・おへやからも よめる ように、この ファイルの 場所から

  // ---- 名前の表 ----------------------------------------------------------------
  // [ja, English, 色あい(度), こさ(×), あかるさ(×), 見本の色]   こさ・あかるさ は 「かりの え」に 色を のせる ときだけ つかう
  const COLORS = [
    ['もも', 'Peach', 14, .62, 1.05, '#ffb59e'], ['レモン', 'Lemon', 52, .85, 1.08, '#ffe566'], ['わたあめ', 'Cotton Candy', 300, .42, 1.1, '#f3c6ff'],
    ['はちみつ', 'Honey', 40, .92, 1.0, '#f2b233'], ['ラテ', 'Latte', 30, .36, .95, '#c9a27e'], ['みかん', 'Mandarin', 28, 1, 1.05, '#ff9a2e'],
    ['ミント', 'Mint', 160, .6, 1.0, '#8fe0c0'], ['さくら', 'Sakura', 340, .42, 1.08, '#ffc2d6'], ['いちご', 'Strawberry', 352, .8, 1.0, '#ff6b82'],
    ['チョコ', 'Chocolate', 20, .55, .62, '#7a4a36'], ['クローバー', 'Clover', 135, .75, .9, '#5fc27a'], ['おほしさま', 'Little Star', 46, .42, 1.12, '#ffe9a0'],
    ['ゆき', 'Snow', 210, .1, 1.12, '#eef4fb'], ['そら', 'Sky', 200, .65, 1.05, '#7cc8f2'], ['ラベンダー', 'Lavender', 265, .5, 1.0, '#c4b0ea'],
    ['きなこ', 'Kinako', 40, .28, 1.05, '#e8d3a8'], ['まっちゃ', 'Matcha', 88, .6, .92, '#a9c97a'], ['カラメル', 'Caramel', 28, .8, .78, '#b9722d'],
    ['ぶどう', 'Grape', 280, .7, .8, '#8e5cc6'], ['しお', 'Salt', 215, .07, .92, '#c9ced4']
  ];
  // [本番のID, ja, English, かりの え（既存の なかまの ID・無ければ null＝えらべない）, 耳が あるか]
  const ANIMALS = [
    ['neko', 'ねこ', 'Cat', 'neko', true], ['usagi', 'うさぎ', 'Bunny', 'usagi', true], ['hiyoko', 'ひよこ', 'Chick', 'hiyoko', false], ['kawauso', 'かわうそ', 'Otter', 'kawauso', false],
    ['koinu', 'こいぬ', 'Puppy', 'koinu', true], ['alpaca', 'アルパカ', 'Alpaca', 'alpaca', true], ['panda', 'パンダ', 'Panda', 'panda', true], ['kojika', 'こじか', 'Fawn', 'kojika', true],
    ['tanuki', 'たぬき', 'Tanuki', 'tanuki', true], ['risu', 'りす', 'Squirrel', 'risu', true], ['hamster', 'ハムスター', 'Hamster', 'hamster', true], ['azarashi', 'あざらし', 'Seal', 'azarashi', false],
    ['kuma', 'くま', 'Bear', 'gantai', true], ['penguin', 'ペンギン', 'Penguin', 'penguin', false], ['kitsune', 'きつね', 'Fox', 'kogitsune', true], ['momonga', 'モモンガ', 'Flying Squirrel', 'komugi', true],
    ['hashibiroko', 'ハシビロコウ', 'Shoebill', 'shirotama', false], ['fukurou', 'ふくろう', 'Owl', null, true], ['yagi', 'やぎ', 'Goat', null, true], ['kame', 'かめ', 'Turtle', null, false]
  ];
  const EARS = [['ピンク', 'Pink', null, '#ffb8c8'], ['ラベンダー', 'Lavender', [270, .3], '#c9b8e8'], ['ミント', 'Mint', [158, .32], '#a8dcc8']];
  const ITEMS = [['なし', 'None'], ['リボン', 'Ribbon'], ['ぼうし', 'Hat'], ['かばん', 'Bag']];
  const ITEM_LV = [0, 3, 6, 10];   // レベルが あがると 1つずつ ふえる（さがらない）
  const api = { PROVISIONAL: true, COLORS, ANIMALS, EARS, ITEMS, ITEM_LV };

  const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const valid = o => !!o && typeof o === 'object' && isInt(o.c, 0, COLORS.length - 1) && isInt(o.a, 0, ANIMALS.length - 1) && isInt(o.ear, 0, 2) && isInt(o.item, 0, 3) && !!ANIMALS[o.a][3];
  const name = o => COLORS[o.c][0] + 'の ' + ANIMALS[o.a][1];
  const en = o => COLORS[o.c][1] + ' ' + ANIMALS[o.a][2];
  const hasEars = a => !!(ANIMALS[a] && ANIMALS[a][4]);
  const itemOpen = (item, lv) => isInt(item, 0, 3) && ITEM_LV[item] <= (Number(lv) || 1);
  const eff = (o, lv) => ({c: o.c, a: o.a, ear: hasEars(o.a) ? o.ear : 0, item: itemOpen(o.item, lv) ? o.item : 0});   // ひらいて いない こもの・耳の ない こは 0 に して 出す（ほぞんは けさない）
  const keyOf = (o, lv) => { const e = eff(o, lv); return [e.c, e.a, e.ear, e.item].join('.'); };
  const pals = new Map();
  const pal = o => { if (!valid(o)) return null; const k = [o.c, o.a].join('.'); let p = pals.get(k); if (!p) { p = {id: 'own', name: name(o), en: en(o), own: true, home: 'L', word: ''}; pals.set(k, p); } return p; };
  Object.assign(api, {
    valid, hasEars, itemOpen, pal,
    name: o => valid(o) ? name(o) : '', en: o => valid(o) ? en(o) : '',
    label: o => valid(o) ? T('じぶんの こ、' + name(o), 'Your own friend, ' + en(o)) : '',
    available: () => ANIMALS.some(x => x[3]),
    faceUrl: o => valid(o) ? BASE + 'img/friend-' + ANIMALS[o.a][3] + '-s.webp' : ''
  });

  // ---- すがたの 合成（かりの え：既存の なかまの え ＋ 色 ＋ 耳の なか ＋ こもの）-------------------
  const loadImg = url => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
  function rgb2hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; }
  function hsv2rgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; let r = 0, g = 0, b = 0; if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; } return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
  function recolor(ctx, w, h, pad, e) {
    const img = ctx.getImageData(0, pad, w, h), d = img.data, orig = Uint8ClampedArray.from(d);
    let top = h, bot = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24) { if (y < top) top = y; if (y > bot) bot = y; }
    const bh = Math.max(1, bot - top), col = COLORS[e.c], ear = EARS[e.ear][2];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (d[i + 3] < 8) continue;
      const [H, S, V] = rgb2hsv(orig[i], orig[i + 1], orig[i + 2]), rel = (y - top) / bh;
      const pinkish = (H >= 325 || H <= 22) && S >= .1 && S <= .8 && V >= .55;
      if (ear && rel < .34 && pinkish) { const [r, g, b] = hsv2rgb(ear[0], ear[1], Math.min(1, V + .03)); d[i] = r; d[i + 1] = g; d[i + 2] = b; continue; }   // 耳の なか（あたまの うえの ほうの ピンク）
      if (V < .4) continue;                                   // 輪郭・目の くろ・こい ちゃいろは かえない
      if (rel < .56 ? S < .5 : S < .16) continue;              // あたまは あざやかな ところだけ（ほっぺを さける）・からだ（ふく）は うすい 色も かえる
      const ns = Math.min(1, col[3] * Math.min(1, S * 1.4 + .15)), nv = Math.min(1, V * col[4]), [r, g, b] = hsv2rgb(col[2], ns, nv);
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    ctx.putImageData(img, 0, pad);
    return {top: top + pad, bot: bot + pad};
  }
  function drawItem(ctx, item, w, bb) {   // こものは コードで かく（え の 発注は いらない）
    const bh = bb.bot - bb.top, cx = w / 2, lw = Math.max(2, Math.round(bh * .012)), ink = '#7a4a2b';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = ink;
    if (item === 1) {   // リボン：あたまの ひだりうえ
      const x = cx - w * .2, y = bb.top + bh * .1, s = bh * .13; ctx.fillStyle = '#ff7aa8';
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sg * s * 1.5, y - s * .9); ctx.lineTo(x + sg * s * 1.5, y + s * .9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, s * .45, 0, Math.PI * 2); ctx.fillStyle = '#ffb3c8'; ctx.fill(); ctx.stroke();
    } else if (item === 2) {   // ぼうし：あたまの てっぺん
      const y = bb.top + bh * .06, rw = w * .2, rh = bh * .12; ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.ellipse(cx, y, rw * 1.25, rh * .34, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, y - rh * .15, rw * .82, rh * .9, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff7a59'; ctx.fillRect(cx - rw * .8, y - rh * .34, rw * 1.6, rh * .26); ctx.strokeRect(cx - rw * .8, y - rh * .34, rw * 1.6, rh * .26);
    } else if (item === 3) {   // かばん：ななめがけ
      const x1 = cx - w * .24, y1 = bb.top + bh * .52, x2 = cx + w * .26, y2 = bb.top + bh * .8; ctx.lineWidth = Math.max(3, lw * 1.6); ctx.strokeStyle = '#9b6b3c';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineWidth = lw; ctx.strokeStyle = ink;
      const bw = w * .2, bh2 = bh * .15; ctx.fillStyle = '#c98a4d'; ctx.beginPath(); ctx.rect(x2 - bw / 2, y2, bw, bh2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(x2, y2 + bh2 * .35, bh2 * .16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  const cache = new Map(), building = new Map();
  async function compose(o, lv) {
    const e = eff(o, lv), im = await loadImg(api.faceUrl(o)); if (!im) return '';
    const w = im.naturalWidth, h = im.naturalHeight, pad = Math.round(h * .07), cv = document.createElement('canvas'); cv.width = w; cv.height = h + pad;
    const ctx = cv.getContext('2d', {willReadFrequently: true}); ctx.drawImage(im, 0, pad);
    try { const bb = recolor(ctx, w, h, pad, e); if (e.item) drawItem(ctx, e.item, w, bb); return cv.toDataURL('image/png'); }
    catch (err) { return api.faceUrl(o); }   // 読めない 時（file:// など）は 色なしの まま
  }
  function build(o, lv) {
    const k = keyOf(o, lv); if (cache.has(k)) return Promise.resolve(cache.get(k));
    if (!building.has(k)) building.set(k, compose(o, lv).then(u => { building.delete(k); if (u) cache.set(k, u); return u; }));
    return building.get(k);
  }
  api.url = (o, lv) => valid(o) ? build(o, lv) : Promise.resolve('');
  api.src = (o, lv, cb) => {   // すぐ 返す：できて いれば 合成ずみ／まだなら かりの 顔（できたら cb に わたす）
    if (!valid(o)) return ''; const k = keyOf(o, lv); if (cache.has(k)) return cache.get(k);
    build(o, lv).then(u => { if (u && typeof cb === 'function') cb(u); }); return api.faceUrl(o);
  };

  // ---- 「つくる」がめん --------------------------------------------------------
  const css = `
#nakama[data-own=true] :is(#nakama-lead,#nakama-me,#nakama-party,#nakama-card,#nakama-grid){display:none}
#nakama-own{margin:0 0 12px}
.own-root h3{margin:0 0 6px;font-size:1.05rem;text-align:center}
.own-root h3:focus{outline:none}
.own-lead{margin:0 0 10px;font-size:.9rem;line-height:1.6;text-align:center}
.own-preview{display:flex;flex-direction:column;align-items:center;gap:4px;margin:0 0 10px}
.own-preview img{width:96px;height:96px;object-fit:contain;filter:drop-shadow(0 3px 2px #0003)}
.own-name{font-weight:900;font-size:1rem;margin:0;text-align:center}
.own-group{margin:0 0 10px}
.own-group h4{margin:0 0 6px;font-size:.92rem}
.own-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:6px}
#nakama-own .own-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:52px;min-width:44px;padding:4px 4px;font:inherit;font-size:.82rem;font-weight:800;line-height:1.25;border:3px solid #b9cbd4;border-radius:14px;background:#fff;color:#244653;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;word-break:keep-all;text-wrap:balance;cursor:pointer}
#nakama-own .own-opt::before{display:none}
#nakama-own .own-opt[aria-pressed=true]{border-color:#c9557f;background:#ffe3ee;color:#5a0f2a}
#nakama-own .own-opt[aria-disabled=true]{opacity:1;background:#eef4f7;color:#506874;border-style:dashed}
#nakama-own .own-opt small{display:block;font-size:.78rem;font-weight:700;line-height:1.2;color:inherit}
#nakama-own .own-opt img{width:40px;height:40px;object-fit:contain}
#nakama-own .own-sw{display:block;width:26px;height:26px;border-radius:50%;border:2px solid #7a4a2b}
.own-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px 0 4px}
.own-actions button{min-height:48px;padding:4px 18px;font-size:.92rem}
.own-note{margin:8px 0 0;font-size:.82rem;line-height:1.5;text-align:center;color:#506874}
:root[data-night=true] #nakama-own .own-opt{background:#1a3250;color:#e8f1f8;border-color:#4a6b8c}
:root[data-night=true] #nakama-own .own-opt[aria-pressed=true]{background:#3a2a44;color:#ffe3ee;border-color:#ff9fc4}
:root[data-night=true] #nakama-own .own-opt[aria-disabled=true]{background:#16283f;color:#9db3c6;border-color:#3b5470}
:root[data-night=true] .own-note{color:#a9bfd2}
`;
  function mountCss() { if (document.getElementById('own-style')) return; const st = document.createElement('style'); st.id = 'own-style'; st.textContent = css; document.head.append(st); }
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  let active = null;
  api.openMaker = (host, opt) => {
    mountCss(); opt = opt || {};
    const lv = Number.isFinite(opt.level) ? opt.level : 1, firstOk = ANIMALS.findIndex(x => x[3]);
    const d = valid(opt.own) ? {c: opt.own.c, a: opt.own.a, ear: opt.own.ear, item: opt.own.item} : {c: 0, a: firstOk, ear: 0, item: 0};
    host.hidden = false; host.setAttribute('data-en-skip', '1'); host.replaceChildren();
    const root = el('div', 'own-root'), title = el('h3'), lead = el('p', 'own-lead'), prev = el('div', 'own-preview'), pimg = el('img'), pname = el('p', 'own-name'), said = el('span', 'sr-only');
    title.tabIndex = -1; pimg.alt = ''; pimg.width = pimg.height = 96; pname.setAttribute('role', 'status'); pname.setAttribute('aria-live', 'polite'); pname.append(el('span'), said); prev.append(pimg, pname);
    const groups = {}, opts = [];
    const group = (k, hOf) => { const g = el('div', 'own-group'), h = el('h4'), grid = el('div', 'own-grid'); const hid = 'own-h-' + k; h.id = hid; g.setAttribute('role', 'group'); g.setAttribute('aria-labelledby', hid); g.append(h, grid); groups[k] = {g, h, grid, hOf}; return g; };
    const option = (k, v, build) => { const b = el('button', 'own-opt'); b.type = 'button'; b.dataset.k = k; b.dataset.v = String(v); build(b); b.addEventListener('click', () => pick(k, v, b)); groups[k].grid.append(b); opts.push(b); return b; };
    root.append(title, lead, prev, group('c'), group('a'), group('ear'), group('item'));
    groups.c.hOf = () => T('いろ・あじ', 'Color · flavor'); groups.a.hOf = () => T('いきもの', 'Animal'); groups.ear.hOf = () => T('みみの なか', 'Inside the ears'); groups.item.hOf = () => T('こもの', 'Accessory');
    COLORS.forEach((c, i) => option('c', i, b => { const sw = el('i', 'own-sw'); sw.style.background = c[5]; sw.setAttribute('aria-hidden', 'true'); b.append(sw, el('span')); b._t = () => T(c[0], c[1]); }));
    ANIMALS.forEach((a, i) => { if (!a[3]) return; option('a', i, b => { const im = el('img'); im.alt = ''; im.loading = 'lazy'; im.src = BASE + 'img/friend-' + a[3] + '-s.webp'; im.setAttribute('aria-hidden', 'true'); b.append(im, el('span')); b._t = () => T(a[1], a[2]); }); });
    EARS.forEach((e, i) => option('ear', i, b => { const sw = el('i', 'own-sw'); sw.style.background = e[3]; sw.setAttribute('aria-hidden', 'true'); b.append(sw, el('span')); b._t = () => T(e[0], e[1]); }));
    ITEMS.forEach((it, i) => option('item', i, b => { b.append(el('span'), el('small')); b._t = () => T(it[0], it[1]); b._lock = () => ITEM_LV[i] > lv ? T('レベル ' + ITEM_LV[i] + ' で ひらくよ', 'Unlocks at level ' + ITEM_LV[i]) : ''; }));
    const actions = el('div', 'own-actions'), go = el('button'), cancel = el('button'); go.type = cancel.type = 'button'; actions.append(go, cancel);
    const note = el('p', 'own-note'); root.append(actions, note); host.append(root);
    const speak = t => { said.textContent = ''; setTimeout(() => { said.textContent = t; }, 30); };
    function paint() {
      title.textContent = T('じぶんの こを つくる', 'Make your own friend'); lead.textContent = T('いろと いきものを えらんでね。えらんだ あとも、なんども かえられるよ。', 'Pick a color and an animal. You can change it again any time.');
      for (const k of Object.keys(groups)) groups[k].h.textContent = groups[k].hOf();
      groups.ear.g.hidden = !hasEars(d.a);
      for (const b of opts) {
        const k = b.dataset.k, v = +b.dataset.v, sp = b.querySelector('span'); sp.textContent = b._t();
        const on = d[k] === v; b.setAttribute('aria-pressed', String(on));
        if (k === 'item') { const lock = b._lock(); b.querySelector('small').textContent = lock; if (lock) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); b.setAttribute('aria-label', b._t() + (lock ? '。' + lock : '')); }
        else b.setAttribute('aria-label', b._t());
      }
      const nm = T(name(d), en(d)); pname.firstChild.textContent = nm; pimg.alt = '';
      const s = api.src(d, lv, u => { if (host.isConnected && root.isConnected) pimg.src = u; }); if (s) pimg.src = s;
      go.textContent = T('これに きめる', 'Choose this'); cancel.textContent = T('やめる', 'Cancel');
      note.textContent = api.PROVISIONAL ? T('いまの え は かりの もの。もうすぐ ほんものに かわるよ。', 'The picture is a stand-in for now. A finished one is coming.') : ''; note.hidden = !api.PROVISIONAL;
    }
    function pick(k, v, b) {
      if (k === 'item' && ITEM_LV[v] > lv) { speak(T('こもの「' + ITEMS[v][0] + '」は レベル ' + ITEM_LV[v] + ' で ひらくよ。', 'The accessory “' + ITEMS[v][1] + '” unlocks at level ' + ITEM_LV[v] + '.')); return; }
      d[k] = v; if (k === 'a' && !hasEars(v)) d.ear = 0; paint();
      speak(T('いろは ' + COLORS[d.c][0] + '。いきものは ' + ANIMALS[d.a][1] + '。' + name(d), 'Color: ' + COLORS[d.c][1] + '. Animal: ' + ANIMALS[d.a][2] + '. ' + en(d) + '.') + (k === 'item' ? T('　こもの：' + ITEMS[d.item][0], ' Accessory: ' + ITEMS[d.item][1]) : ''));
    }
    go.addEventListener('click', () => { const o = {c: d.c, a: d.a, ear: hasEars(d.a) ? d.ear : 0, item: d.item}; if (valid(o) && typeof opt.onDone === 'function') opt.onDone(o); });
    cancel.addEventListener('click', () => { if (typeof opt.onCancel === 'function') opt.onCancel(); });
    paint();
    active = {refresh: paint, host};
    return {focus: () => title.focus({preventScroll: true}), refresh: paint, state: () => ({...d})};
  };
  api.refresh = () => { if (active && active.host.isConnected) active.refresh(); };
  window.TsuriOwn = api;
})();
