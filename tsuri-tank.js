// まるふわ つりびより「まるふわの おへや」（かべの すいそう）
// 釣った魚を、部屋の壁の水槽に集めて、まるふわと一緒に眺める。何もしなくていい時間のための、外付け1ファイル。
//   ・本体（index.html）は書き換えない。読むのは localStorage['marufuwa-tsuri-v1']（fish・decor）と #scene（data-time・色）と #open-book の隣だけ。
//   ・置くだけで動く：<script defer src="tsuri-tank.js"></script> を本体の末尾に1行。外すには、その1行を消す。
//   ・罰なし：魚は死なない・おなかもすかない・世話はいらない。ごはんは何度あげてもいい。かざりは、いつでも置きかえられる。
//   ・記録は自分の最大サイズだけ（魚の大きさに出る）。他の人とは比べない。
//   ・魚の絵は今は仮の絵文字。絵が来たら window.TsuriArt = {魚の番号: 'img/fish-3.webp', ...}（発注書どおり、頭は左向き）を先に置くと差し替わる。右へ泳ぐ時は こちらで反転する。
//   ・自分の記録は localStorage['marufuwa-tsuri-tank-v1'] = {seen, placed, sound?, soundMain?} に別に持つ（本体の記録は書き換えない）。
//   ・おと：本体の save.sound を読む。むかしの ゲームき ふう（square・triangle・みじかい ざつおん だけ）。OFFの間は AudioContext も作らない。
//   ・めずらしさ・ぬし：本体と おなじ いみ。★は しゅるいの めずらしさ（スペシャル＝★4）、その子の ぬしを つった ことが あれば（save.fish[番号].nushi）＋1 で ★5。
//   ・ほかの ページ（ひろば など）から ひらく時：window.TsuriTank.open()。このファイルより先に window.TsuriTankConfig = {base:'../', noButton:true} を置く
//     （base：img/ の場所の まえに つける／noButton：「すいそう」ボタンを ページに 足さない）。#scene（data-time・色）と #friend-a・#friend-b の絵が ページに あること。
(() => {
  'use strict';
  const scene = document.getElementById('scene');
  if (!scene) return;
  // ほかの ページ（ひろば など）から つかう ときの せってい。window.TsuriTankConfig = {base:'../', noButton:true} を、このファイルより先に置く
  //   base：img/ の まえに つける ばしょ　／　noButton：「すいそう」ボタンを ページに 足さない（ひらくのは TsuriTank.open()）
  const CFG = window.TsuriTankConfig || {};
  const BASE = typeof CFG.base === 'string' ? CFG.base : '';
  const $ = (root, sel) => root.querySelector(sel);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 魚の一覧（本体の FISH と同じ並び＝番号）。本体が window.Tsuri.all を出したら、そちらを使う ───
  // [名前, 絵文字, 最小cm, 最大cm, 珍しさ(1〜4)]
  const FISH_COPY = [
    ['まるあじ','🐟',10,25,1],['ふわふぐ','🐡',8,20,1],['もちだい','🐠',15,40,1],['ころいわし','🐟',5,15,1],['ぽてかれい','🐟',20,45,1],
    ['しらたまえび','🦐',3,12,1],['ぷかくらげ','🪼',5,30,1],['こつぶがに','🦀',3,10,1],['わたあめきんぎょ','🐠',5,18,2],['まんまるいか','🦑',10,35,2],
    ['ふくふくたこ','🐙',15,50,2],['にじいろべら','🐠',10,30,2],['あさやけだい','🐠',25,60,2],['ゆうやけさば','🐟',20,45,2],['ほしぞらあなご','🐟',30,80,2],
    ['おもちひらめ','🐟',25,70,2],['さくらます','🐟',30,60,2],['ぽんぽんはりせんぼん','🐡',10,35,2],['ころころかめ','🐢',15,40,3],['ねむりいるか','🐬',100,180,3],
    ['つきみまんぼう','🐟',80,200,3],['ひだまりえい','🐟',40,120,3],['みかづきたちうお','🐟',60,130,3],['しゃぼんだまうお','🐠',5,15,3],['みずいろのこ','🐟',12,30,3],
    ['みんとのこ','🐟',12,30,3],['あぷりこっとのこ','🐟',12,30,3],['らべんだーのこ','🐟',12,30,3],['きんのまるごい','🐟',40,90,4],['まるくじら','🐳',200,400,4]
  ].map(([name, icon, min, max, rare], id) => ({ id, name, icon, min, max, rare }));
  const fishList = () => { const t = window.Tsuri && window.Tsuri.all; const l = typeof t === 'function' ? t() : t; return Array.isArray(l) && l.length ? l : FISH_COPY; };
  const STAR = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };   // めずらしさ（本体と おなじ：スペシャル＝★4。その子の「ぬし」を つった ことが あれば ＋1 で ★5）
  const starCount = (f, nushi) => Math.min(5, (STAR[f.rare] || 1) + (nushi ? 1 : 0));
  const starsOf = (f, nushi) => '★'.repeat(starCount(f, nushi)) + '☆'.repeat(5 - starCount(f, nushi));

  // ─── 記録の読み書き ───
  const KEY = 'marufuwa-tsuri-v1', TANK_KEY = 'marufuwa-tsuri-tank-v1';
  const readSave = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && typeof d.fish === 'object' && d.fish) return d; } catch {} return { fish: {}, total: 0 }; };
  const okPlaced = p => p && typeof p.n === 'string' && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
  // sound / soundMain：すいそうの中で「おと」を切りかえた時の選択と、その時の本体の「おと」の値（本体が あとから かわったら、本体に合わせる）
  const readTank = () => { try { const d = JSON.parse(localStorage.getItem(TANK_KEY)); if (d && typeof d === 'object') return { seen: d.seen && typeof d.seen === 'object' ? d.seen : {}, placed: Array.isArray(d.placed) ? d.placed.filter(okPlaced) : [], sound: typeof d.sound === 'boolean' ? d.sound : undefined, soundMain: typeof d.soundMain === 'boolean' ? d.soundMain : undefined }; } catch {} return { seen: {}, placed: [] }; };
  let tank = readTank();
  const saveTank = () => { try { localStorage.setItem(TANK_KEY, JSON.stringify(tank)); } catch {} };
  const residents = () => { const s = readSave(); return fishList().filter(f => s.fish[f.id] && s.fish[f.id].count > 0).map(f => ({ fish: f, count: s.fish[f.id].count, best: Number(s.fish[f.id].best) || f.min, nushi: !!s.fish[f.id].nushi })); };
  const newArrivals = () => {
    tank = readTank();   // 別のタブや、記録のリセットで かわっていても、いつも いまの記録から数える
    const res = residents();
    // すいそうを はじめて ひらく人で、もう 4しゅるい以上 いる時は、ぜんぶ「もう みた」ことにする（ようこそ の ラッシュを しない）
    if (!Object.keys(tank.seen).length && res.length >= 4) { tank.seen = Object.fromEntries(res.map(r => [r.fish.id, r.count])); saveTank(); return []; }
    const out = []; for (const r of res) { const n = r.count - (tank.seen[r.fish.id] || 0); if (n > 0) out.push({ ...r, n }); } return out;
  };
  const owned = () => { const s = readSave(); return s.decor && typeof s.decor === 'object' ? s.decor : {}; };
  const available = name => Math.max(0, (Number(owned()[name]) || 0) - tank.placed.filter(p => p.n === name).length);

  // ─── 小道具 ───
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hex = c => { c = String(c).trim(); if (/^#[0-9a-f]{3}$/i.test(c)) c = '#' + [...c.slice(1)].map(x => x + x).join(''); const m = /^#([0-9a-f]{6})$/i.exec(c); return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) : null; };
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); if (!x || !y) return a; return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
  const TIME_PAL = { asa: ['#8fd3ee', '#4aa3cf'], hiru: ['#7fd0f2', '#3b9bd0'], yuu: ['#7aa9d6', '#44779f'], yoru: ['#3f6fa6', '#1d365f'] };
  function palette() {
    const time = scene.dataset.time || 'hiru', cs = getComputedStyle(scene), base = TIME_PAL[time] || TIME_PAL.hiru;
    const w1 = hex(cs.getPropertyValue('--water1')) ? cs.getPropertyValue('--water1').trim() : base[0];
    const w2 = hex(cs.getPropertyValue('--water2')) ? cs.getPropertyValue('--water2').trim() : base[1];
    const night = time === 'yoru', dusk = time === 'yuu';
    let sand = '#f7ecd2', sand2 = '#ecd9b2', rock = '#7fb7cf';
    if (dusk) { sand = mix(sand, '#ffd2a0', .3); sand2 = mix(sand2, '#f0b47c', .3); }
    if (night) { sand = mix(sand, '#20406b', .5); sand2 = mix(sand2, '#183256', .55); rock = mix(rock, '#1d365f', .5); }
    return { time, night, dusk, a: w1, b: w2, sand, sand2, rock };
  }

  // ─── ことば：やさしく、せかさず、比べない ───
  const SAY = {
    any: ['ゆっくり していってね。', 'なにも しなくて だいじょうぶ。', 'ぷかぷか、いい きもち。', 'みずの おと、きこえる？', 'ぼーっと して いいんだよ。', 'ここは ずっと、おだやかだよ。', 'いっしょに ながめよう。', 'すいそうの ひかり、やさしいね。'],
    asa: ['おはよう。きょうも ゆっくり いこうね。', 'あさの ひかりが きれい。'],
    hiru: ['ひなたぼっこ みたい。', 'ぽかぽか して きたね。'],
    yuu: ['ゆうやけの いろが うつってる。', 'きょうも おつかれさま。'],
    yoru: ['しずかな よるだね。', 'おやすみ まえの おへや。'],
    empty: ['まだ だれも いないよ。つりを すると ここで およぐよ。'],
    feed: ['ぱくぱく。おいしいって。', 'みんな うれしそう。', 'ごはんの じかん、たのしいね。'],
    deco: ['すてきな かざり。', 'ここ、いい ばしょだね。', 'ちょっと にぎやかに なったね。'],
    touch: name => [name + '、げんきそう。', name + 'が こっちを みたよ。', name + '、ゆうゆう およいでるね。']
  };

  // ─── かざり：魚がときどき持ってくる物。水槽に置ける（本体の save.decor の名前） ───
  //   sand=砂の上に置く／float=水の中にうかぶ
  const DECOR = {
    'かいがら': { kind: 'sand', svg: (c = {}) => `<path d="M8 32 Q4 14 20 8 Q36 14 32 32 Z" fill="${c.a || '#ffd9c4'}" stroke="#f0a98a" stroke-width="2" stroke-linejoin="round"/><path d="M20 32 V10 M13 32 L11 14 M27 32 L29 14" stroke="#f0a98a" stroke-width="1.6" stroke-linecap="round" fill="none"/>` },
    'きれいな いし': { kind: 'sand', svg: () => `<ellipse cx="20" cy="26" rx="15" ry="10" fill="#8fd6d0" stroke="#5fb9b2" stroke-width="2"/><ellipse cx="15" cy="22" rx="5" ry="2.6" fill="#ffffffaa"/><path d="M29 12 l1.6 3.6 l3.6 1.6 l-3.6 1.6 l-1.6 3.6 l-1.6 -3.6 l-3.6 -1.6 l3.6 -1.6z" fill="#fff8c9"/>` },
    'ながれぎ': { kind: 'sand', svg: () => `<path d="M4 32 Q12 14 24 20 Q30 22 36 10" fill="none" stroke="#b58c5e" stroke-width="7" stroke-linecap="round"/><path d="M22 20 Q26 28 32 30" fill="none" stroke="#b58c5e" stroke-width="4.5" stroke-linecap="round"/><circle cx="12" cy="24" r="1.8" fill="#8f6a42"/>` },
    'みずくさ': { kind: 'sand', sway: true, svg: () => `<g fill="none" stroke-linecap="round" stroke-width="5"><path d="M20 36 Q10 24 16 6" stroke="#6cc796"/><path d="M20 36 Q22 20 28 8" stroke="#7fd6a4"/><path d="M20 36 Q30 26 34 16" stroke="#59b98a"/></g>` },
    'ちいさな びん': { kind: 'sand', svg: () => `<g transform="rotate(-24 20 22)"><rect x="9" y="14" width="22" height="16" rx="7" fill="#cfeff1cc" stroke="#8cc9cf" stroke-width="2"/><rect x="29" y="18" width="7" height="8" rx="2" fill="#cfeff1cc" stroke="#8cc9cf" stroke-width="2"/><rect x="35" y="19" width="4" height="6" rx="1.5" fill="#c99a62"/><path d="M14 20 h10 M14 24 h7" stroke="#e9c98a" stroke-width="2.4" stroke-linecap="round"/></g>` },
    'ほしの かけら': { kind: 'float', twinkle: true, svg: () => `<circle cx="20" cy="20" r="15" fill="#ffe27a33"/><path d="M20 4 l4.4 10.6 l11.6 1 l-8.8 7.6 l2.8 11.2 l-10 -6.2 l-10 6.2 l2.8 -11.2 l-8.8 -7.6 l11.6 -1z" fill="#ffe27a" stroke="#f5b93a" stroke-width="1.6" stroke-linejoin="round"/>` }
  };
  const decorMarkup = (name, size, c) => { const d = DECOR[name] || DECOR['きれいな いし']; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">${d.svg(c)}</svg>`; };

  // ─── 部屋（かべ・ゆか・たな・ラグ）。360×640 のせかい。色は文字のまま（しゃしんにも使う） ───
  const ROOM = { w: 360, h: 640, tank: { x: 16, y: 56, w: 328, h: 180 }, mascot: { cx: 140, foot: 574, w: 100, h: 133 }, friend: { w: 66, foot: [572, 582] }, friendX: [60, 296], bubble: { x: 204, y: 430, w: 148 } };
  function roomSvg() {
    const planks = [430, 452, 478, 508, 542, 580, 622].map(y => `<line x1="0" y1="${y}" x2="360" y2="${y}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" width="360" height="640">
      <defs><pattern id="tk-dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.7" fill="#f3dcb8"/><circle cx="19" cy="19" r="1.7" fill="#f3dcb8"/></pattern></defs>
      <rect width="360" height="404" fill="#fdf1e0"/><rect width="360" height="404" fill="url(#tk-dots)"/>
      <rect y="316" width="360" height="92" fill="#d8efe8"/><rect y="310" width="360" height="8" rx="3" fill="#fffaf0"/>
      <rect y="404" width="360" height="14" fill="#fffaf0"/><rect y="416" width="360" height="3" fill="#e9dcc6"/>
      <rect y="418" width="360" height="222" fill="#ebcb9d"/><g stroke="#d9b07c" stroke-opacity=".55" stroke-width="2">${planks}</g>
      <ellipse cx="180" cy="536" rx="146" ry="47" fill="#ffcfc4"/><ellipse cx="180" cy="536" rx="122" ry="36" fill="#fff1ea"/>
      <ellipse cx="180" cy="536" rx="134" ry="42" fill="none" stroke="#ffb3a3" stroke-width="5" stroke-dasharray="1 11" stroke-linecap="round"/>
      <rect x="8" y="242" width="344" height="12" rx="6" fill="#f6dcae"/><rect x="14" y="254" width="332" height="92" rx="8" fill="#e5bf8c"/>
      <rect x="22" y="264" width="152" height="72" rx="8" fill="none" stroke="#c99a62" stroke-width="3"/><rect x="186" y="264" width="152" height="72" rx="8" fill="none" stroke="#c99a62" stroke-width="3"/>
      <circle cx="164" cy="300" r="4" fill="#b9894f"/><circle cx="196" cy="300" r="4" fill="#b9894f"/>
      <rect x="26" y="346" width="10" height="28" fill="#c99a62"/><rect x="324" y="346" width="10" height="28" fill="#c99a62"/>
      <g transform="translate(9.4 -147.2) scale(.8)"><path d="M34 244 h26 l-3 -22 h-20z" fill="#ffb18f"/><path d="M47 222 Q34 208 38 190 Q48 200 47 222z" fill="#7fd6a4"/><path d="M47 222 Q60 210 58 192 Q48 202 47 222z" fill="#5cc39a"/><path d="M47 222 Q47 200 47 186 Q52 204 47 222z" fill="#8bdcb0"/></g>
      <g transform="translate(298 22)"><path d="M0 26 L14 -2 L28 26 Z" fill="#ffffff" stroke="#e8d6c2" stroke-width="2.4" stroke-linejoin="round"/><rect x="7" y="12" width="14" height="14" rx="3" fill="#4b6a5a"/></g>
    </svg>`;
  }
  const RICE = { x: 204, y: 526, w: 30, h: 26 };   // ラグの上の おにぎり（3かい さわると はんぶんこ）
  const riceSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 26" width="30" height="26"><g transform="translate(3 4)"><path d="M0 18 L12 -4 L24 18 Z" fill="#ffffff" stroke="#f0d9cf" stroke-width="2" stroke-linejoin="round"/><rect x="6" y="8" width="12" height="10" rx="2" fill="#4b6a5a"/></g></svg>`;
  function lampSvg(off) { // ランプ（よるは ひかる）。部屋の暗さより上に置く
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" width="360" height="640"><defs><radialGradient id="tk-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3b8" stop-opacity=".95"/><stop offset="1" stop-color="#fff3b8" stop-opacity="0"/></radialGradient></defs>
      <circle class="tk-halo" cx="180" cy="40" r="60" fill="url(#tk-halo)"${off ? ' opacity="0"' : ''}/><line x1="180" y1="0" x2="180" y2="16" stroke="#b58c5e" stroke-width="3"/><path d="M156 40 Q156 20 180 18 Q204 20 204 40 Z" fill="#ffd76a" stroke="#e5b542" stroke-width="2"/><ellipse cx="180" cy="42" rx="17" ry="4" fill="#fff6c9"/></svg>`;
  }
  function frameSvg() {
    const t = ROOM.tank;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" width="360" height="640"><rect x="${t.x - 8}" y="${t.y - 8}" width="${t.w + 16}" height="${t.h + 16}" rx="22" fill="none" stroke="#d6b07a" stroke-width="12"/><rect x="${t.x - 2.5}" y="${t.y - 2.5}" width="${t.w + 5}" height="${t.h + 5}" rx="16" fill="none" stroke="#fff6e4" stroke-width="3"/><rect x="${t.x - 13.5}" y="${t.y - 13.5}" width="${t.w + 27}" height="${t.h + 27}" rx="26" fill="none" stroke="#b98d55" stroke-width="2" stroke-opacity=".7"/></svg>`;
  }
  // 水槽のなか：砂・水草・流木・小石・エアストーン（328×180）
  function tankBaseSvg(pal, withClass = true) {
    const sway = (d, x, w, col, delay) => `<g${withClass ? ` class="tk-sway" style="animation-delay:${delay}s"` : ''}><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/></g>`;
    const peb = [[52, 164, 9, 5, '#b9c9d2'], [88, 168, 6, 4, '#d9d2c4'], [150, 166, 10, 5.5, '#aebfc9'], [214, 169, 7, 4.5, '#d6cfc0'], [270, 165, 9, 5, '#b4c4ce'], [304, 170, 6, 4, '#cfd8dc']]
      .map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="#ffffff70" stroke-width="1"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 328 180" width="328" height="180" preserveAspectRatio="xMidYMax slice">
      <g opacity=".4" fill="${pal.rock}"><ellipse cx="50" cy="150" rx="60" ry="20"/><ellipse cx="290" cy="152" rx="66" ry="22"/></g>
      <path d="M0 148 Q60 138 130 146 T262 142 T328 148 V180 H0Z" fill="${pal.sand}"/><path d="M0 164 Q90 156 180 164 T328 160 V180 H0Z" fill="${pal.sand2}"/>
      ${peb}
      <path d="M196 156 Q210 132 234 138 Q246 140 254 126" fill="none" stroke="#b58c5e" stroke-width="9" stroke-linecap="round"/><path d="M226 138 Q232 150 242 152" fill="none" stroke="#b58c5e" stroke-width="5.5" stroke-linecap="round"/><circle cx="208" cy="146" r="2.2" fill="#8f6a42"/>
      ${sway('M40 156 Q28 122 36 88', 40, 7, '#6cc796', 0)}${sway('M40 156 Q46 128 56 96', 40, 7, '#7fd6a4', -1.3)}${sway('M40 156 Q56 134 62 118', 40, 6, '#59b98a', -2.4)}
      ${sway('M112 158 Q100 132 108 104', 112, 6, '#7fd6a4', -.7)}${sway('M112 158 Q122 138 130 118', 112, 6, '#6cc796', -1.9)}
      ${sway('M288 156 Q276 122 284 84', 288, 7, '#59b98a', -1.1)}${sway('M288 156 Q296 130 306 98', 288, 7, '#7fd6a4', -2.2)}${sway('M288 156 Q304 138 312 122', 288, 6, '#6cc796', -.4)}
      <ellipse cx="22" cy="166" rx="7" ry="4" fill="#9fb3bd"/>
    </svg>`;
  }
  function raysSvg() {
    const poly = (pts, o1, o2, d) => `<polygon class="tk-ray" points="${pts}" fill="url(#tk-rayg)" style="--o1:${o1};--o2:${o2};animation-delay:${d}s"/>`;
    return `<defs><linearGradient id="tk-rayg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`
      + poly('30,0 80,0 170,180 110,180', .35, .8, 0) + poly('150,0 196,0 262,180 206,180', .25, .7, -3) + poly('236,0 282,0 350,180 300,180', .3, .6, -6);
  }

  // ─── 見た目（CSS）───
  const css = document.createElement('style');
  css.textContent = `
#tk-open{position:relative;flex:1;white-space:nowrap}
#tk-open .tk-badge{position:absolute;right:-4px;top:-8px;min-width:24px;height:24px;padding:0 6px;border-radius:12px;background:#e8543f;color:#fff;font-size:.8rem;line-height:20px;text-align:center;border:2px solid #fff}
#tk-open .tk-badge[hidden]{display:none}
#tk{padding:0;border:2px solid #bfdce8;border-radius:24px;width:min(560px,calc(100vw - 12px));max-width:none;height:min(96dvh,900px);max-height:calc(100dvh - 12px);overflow:hidden;background:#f3fafd;color:#244653}
#tk[open]{display:flex;flex-direction:column}
:root[data-inapp=x] #tk{max-height:calc(100dvh - 64px);height:min(96dvh,900px,calc(100dvh - 64px));margin:8px auto auto}   /* Xの アプリ：下 47px の おびに ボタンが かくれない ように、おびの うえで おわる */
#tk::backdrop{background:#0d2a3acc}
#tk .tk-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px 6px}
#tk .tk-head h2{margin:0;font-size:1.1rem;text-align:left;white-space:nowrap}
#tk .tk-headbtns{display:flex;gap:6px;flex:none}
#tk .tk-headbtns button{min-height:44px;min-width:44px;padding:6px 12px;white-space:nowrap}
#tk .tk-snd{font-size:1.15rem;line-height:1}
@media(max-width:450px){#tk .tk-head h2{font-size:1rem}#tk .tk-headbtns button{padding:6px 10px}#tk .tk-cam span{display:none}#tk .tk-cam{min-width:46px}}
/* へやの はばが せまい（400px より 小さい）時：ゆびで おす ボタンが 枠から はみ出さない ように 小さく まとめる（パソコンでも 背の高さで へやが 細く なる ので、画面の はばでは なく へやの はばで きめる） */
#tk .tk-head h2{min-width:0;overflow:hidden;text-overflow:ellipsis}
#tk.tk-narrow .tk-head{padding:8px 8px 4px;gap:4px}
#tk.tk-narrow .tk-head h2{font-size:.95rem}
#tk.tk-narrow .tk-headbtns{gap:4px}
#tk.tk-narrow .tk-headbtns button{padding:6px 8px}
#tk.tk-narrow .tk-cam span{display:none}
#tk.tk-narrow .tk-cam{min-width:46px}
#tk .tk-chrome{transition:opacity 1.4s ease}
#tk.tk-zen .tk-chrome{opacity:.12}
.tk-stage{position:relative;flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;background:#fff8ea}
.tk-room{position:relative;flex:none;overflow:hidden;--s:1}
.tk-room>svg,.tk-room>img,.tk-room>div,.tk-room>p{position:absolute;display:block}
.tk-roomsvg,.tk-lamp,.tk-frame,.tk-dim,.tk-shelf{left:0;top:0;width:100%;height:100%;pointer-events:none}
.tk-dim{background:#0c2048;opacity:0;transition:opacity 1.2s;-webkit-mask:linear-gradient(#000,#000);mask:linear-gradient(#000,#000)}
.tk-room[data-time=yoru] .tk-dim{opacity:.5}
.tk-room[data-time=yuu] .tk-dim{opacity:.12;background:#ff8a3c}
.tk-room[data-time=yoru] .tk-mascot,.tk-room[data-time=yoru] .tk-friend{filter:brightness(.88) saturate(.95)}
.tk-halo{opacity:.25}
.tk-room[data-time=yoru] .tk-halo{opacity:1}
.tk-room[data-time=yuu] .tk-halo{opacity:.55}
.tk-water{overflow:hidden;background:linear-gradient(var(--tk-a),var(--tk-b));touch-action:manipulation;user-select:none;-webkit-user-select:none;transition:background .6s,filter 1s}
.tk-water::after{content:"";position:absolute;inset:0;background:linear-gradient(#ffffff59,#ffffff00 12%),linear-gradient(115deg,#ffffff1f 0,#ffffff00 22%);pointer-events:none;z-index:9}
.tk-water.tk-decorating{cursor:crosshair;box-shadow:inset 0 0 0 3px #ffffffcc}
.tk-rays,.tk-base,.tk-placed,.tk-layer{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.tk-rays{z-index:0;mix-blend-mode:soft-light}
.tk-base{z-index:1}
.tk-placed{z-index:2}
.tk-deco{position:absolute;pointer-events:none;line-height:0}
.tk-decorating .tk-deco{pointer-events:auto;cursor:pointer;outline:2px dashed #ffffffb3;outline-offset:2px;border-radius:6px}
.tk-layer{z-index:3;overflow:hidden}
.tk-sway{transform-origin:50% 100%;transform-box:fill-box;animation:tk-sway 4.6s ease-in-out infinite alternate}
.tk-float{animation:tk-float 4.2s ease-in-out infinite alternate}
.tk-twinkle{animation:tk-twinkle 2.6s ease-in-out infinite}
@keyframes tk-sway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes tk-float{from{transform:translateY(-4px)}to{transform:translateY(5px)}}
@keyframes tk-twinkle{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes tk-ray{from{opacity:var(--o1,.5);transform:translateX(-14px)}to{opacity:var(--o2,.9);transform:translateX(14px)}}
@keyframes tk-rise{0%{transform:translate(0,0);opacity:0}10%{opacity:.85}88%{opacity:.55}100%{transform:translate(var(--dx,4px),calc(var(--h,180px) * -.9));opacity:0}}
@keyframes tk-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,1.02)}}
.tk-ray{animation:tk-ray 9s ease-in-out infinite alternate}
.tk-bub{position:absolute;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff 0,#ffffffb0 35%,#ffffff40 72%);border:1px solid #ffffff99;pointer-events:none;z-index:4;animation:tk-rise var(--d,6s) ease-in var(--dl,0s) infinite}
.tk-fish{position:absolute;left:0;top:0;display:block;line-height:1;text-align:center;padding:8px;margin:-8px;cursor:pointer;will-change:transform;user-select:none;-webkit-user-select:none;pointer-events:auto}
.tk-decorating .tk-fish{pointer-events:none}
.tk-fish img{display:block;width:100%;height:100%;pointer-events:none}
.tk-fish[data-layer="0"]{opacity:.82}
.tk-flake{position:absolute;z-index:5;width:6px;height:6px;margin:-3px;border-radius:50%;background:#ffe2b8;box-shadow:0 0 0 1px #d99a5b66;pointer-events:none}
.tk-heart{position:absolute;z-index:7;color:#ff7fa4;font:700 14px/1 system-ui,sans-serif;text-shadow:0 0 3px #fff,0 0 5px #fff;pointer-events:none}
.tk-ripple{position:absolute;z-index:6;top:3%;width:40px;height:10px;margin-left:-20px;border-radius:50%;border:2px solid #ffffffcc;pointer-events:none}
.tk-card{left:4%;right:4%;bottom:3%;z-index:15;background:#fffdf6;border:2px solid #b9d1db;border-radius:18px;padding:8px 12px 10px;box-shadow:0 6px 18px #0003}
.tk-card .tk-cardsay{display:flex;gap:8px;align-items:center;background:#e4f5fb;border-radius:14px;padding:5px 10px;font-size:.82rem;font-weight:800;margin-bottom:6px;line-height:1.5}
.tk-card .tk-cardbody{display:flex;gap:10px;align-items:center}
.tk-card .tk-cardl{flex:1;min-width:0}
.tk-card .tk-cardname{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:1.1rem;font-weight:900;line-height:1.4}
.tk-card .tk-tag{background:#3aa0d8;color:#fff;font-size:.7rem;border-radius:9px;padding:0 8px;line-height:1.7}
.tk-card .tk-newburst{background:#ffd34d;color:#8a4b00;font-size:.7rem;font-weight:900;padding:1px 8px;border-radius:10px;transform:rotate(-8deg);border:2px solid #fff;box-shadow:0 0 0 2px #f0b400}
.tk-card dl{margin:4px 0 0;display:grid;grid-template-columns:auto 1fr;gap:1px 10px;align-items:baseline;font-size:.82rem}
.tk-card dt{color:#506874}.tk-card dd{margin:0;font-weight:800}
.tk-card .tk-big{font-size:1.3rem;color:#e0407c;line-height:1.3}.tk-card .tk-stars{color:#e0a61c;letter-spacing:.08em}
.tk-card .tk-cardart{flex:none;font-size:3rem;line-height:1;text-align:center;width:3.6rem}
.tk-card .tk-cardclose{margin-top:6px;min-height:40px;width:100%;padding:2px 12px;font-size:.9rem}
.tk-card[hidden],.tk-empty[hidden],.tk-tray[hidden],.tk-photo[hidden]{display:none}
.tk-empty{z-index:8;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:#fff;font-weight:800;line-height:1.7;text-shadow:0 1px 4px #0a3a5599;padding:12px;pointer-events:none;white-space:pre-line;font-size:.9rem}
.tk-empty button{pointer-events:auto;text-shadow:none;min-height:44px;padding:4px 14px}
.tk-mascot{transform-origin:50% 100%;animation:tk-breathe 4.4s ease-in-out infinite;object-fit:contain;pointer-events:none}
.tk-friend{object-fit:contain;pointer-events:none;transform-origin:50% 100%}
.tk-says{background:#fff;border:2px solid #b9d1db;border-radius:16px;padding:6px 10px;line-height:1.55;transition:opacity .5s;pointer-events:none;box-shadow:0 2px 0 #b9d1db66}
.tk-says::before{content:"";position:absolute;left:-7px;bottom:14px;width:11px;height:11px;background:#fff;border-left:2px solid #b9d1db;border-bottom:2px solid #b9d1db;transform:rotate(45deg)}
.tk-says[data-fade=true]{opacity:0}
.tk-tray{left:0;right:0;bottom:0;z-index:12;position:absolute;background:#fffdf6f5;border-top:2px solid #e3d3b0;padding:10px 12px 12px;border-radius:18px 18px 0 0}
.tk-tray p{margin:0 0 8px;font-size:.85rem;line-height:1.5;text-align:center}
.tk-items{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:8px;min-height:48px}
.tk-items button{display:flex;align-items:center;gap:6px;min-height:48px;padding:4px 12px 4px 8px;font-size:.85rem}
.tk-items button[aria-pressed=true]{background:#fff3ce;border-color:#a56c19}
.tk-items button:disabled{opacity:.45}
.tk-trayrow{display:flex;gap:8px}.tk-trayrow button{flex:1;min-height:46px}
.tk-placedlist{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px}
.tk-placedlist:empty{display:none}
.tk-placedlist .tk-back{min-height:40px;padding:2px 10px 2px 6px;font-size:.8rem;display:flex;align-items:center;gap:4px}
.tk-fish:focus-visible{outline:3px solid #fff;outline-offset:1px;border-radius:50%;box-shadow:0 0 0 6px #17658a99}
.tk-listen .tk-water{box-shadow:inset 0 0 0 3px #ffe27a}
#tk .tk-actions{display:flex;gap:6px;padding:8px 10px 12px}
#tk .tk-actions button{flex:1;min-height:52px;padding:6px 6px;font-size:.86rem;line-height:1.25;word-break:keep-all}   /* 「ながめ／る」の ように 1もじ だけ 下へ 落ちない（すきまで 切る） */
#tk .tk-actions button[aria-pressed=true]{background:#17658a;color:#fff;border-color:#0e4a66}
.tk-photo{position:absolute;inset:0;z-index:30;background:#0d2a3aee;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px}
.tk-photo img{max-width:100%;max-height:calc(100% - 130px);border-radius:14px;border:3px solid #fff;box-shadow:0 6px 18px #0008;object-fit:contain}
.tk-photo p{margin:0;color:#fff;font-weight:800;text-align:center;font-size:.9rem;line-height:1.6}
.tk-photo .tk-photorow{display:flex;gap:8px}.tk-photo .tk-photorow button,.tk-photo .tk-photorow a{min-height:48px}
.tk-photo a{display:inline-flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:#17658a;border:2px solid #0e4a66;border-radius:18px;padding:8px 18px;text-decoration:none}
.tk-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

.tk-fish[data-rainbow]{animation:tk-rainbow 7s linear infinite}
.tk-fish[data-legend]:not([data-rainbow]){filter:drop-shadow(0 0 6px #fff6b8)}
@keyframes tk-rainbow{from{filter:hue-rotate(0deg) drop-shadow(0 0 6px #fff6b8)}to{filter:hue-rotate(360deg) drop-shadow(0 0 6px #fff6b8)}}
.tk-card .tk-tag.tk-myth{background:linear-gradient(90deg,#ff8fb1,#ffb84d,#5fc98f,#4cb6e6,#a98be8);text-shadow:0 1px 0 #0005}
.tk-lampbtn,.tk-rice,.tk-shelfbtn{position:absolute;z-index:6;padding:0;margin:0;border:0;background:none;box-shadow:none;min-height:0;min-width:0;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:none;-webkit-backdrop-filter:none;backdrop-filter:none}   /* 本体の ボタンの ガラスの ぼかしを 消す（うしろの だなの 絵が ぼやけない） */
.tk-lampbtn::before,.tk-rice::before,.tk-shelfbtn::before{display:none}
.tk-lampbtn:active,.tk-rice:active,.tk-shelfbtn:active{transform:none;box-shadow:none}
.tk-lampbtn:focus-visible,.tk-rice:focus-visible,.tk-shelfbtn:focus-visible{outline:3px solid #fff;outline-offset:2px;box-shadow:0 0 0 6px #17658a99}
.tk-lampbtn,.tk-shelfbtn{border-radius:14px}
.tk-shelf{position:absolute}
.tk-shelf[hidden],.tk-shelfbtn[hidden],.tk-giftlist[hidden]{display:none}
.tk-shelf .tk-gf{position:absolute;object-fit:contain;display:flex;align-items:center;justify-content:center;line-height:1;filter:drop-shadow(0 1px 1px #0003)}
.tk-giftlist{position:absolute;left:8px;right:8px;top:8px;max-height:calc(100% - 16px);overflow:auto;z-index:30;background:#fffdf6;border:2px solid #b9d1db;border-radius:18px;padding:12px 14px 14px;box-shadow:0 8px 24px #0004;color:#244653;word-break:keep-all;overflow-wrap:break-word}
.tk-giftlist:focus{outline:none}
.tk-giftlist h3{margin:0 0 2px;font-size:1.05rem;text-align:center}
.tk-giftsub{margin:0 0 8px;font-size:.85rem;line-height:1.6;text-align:center;color:#506874}
.tk-giftrows{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px}
.tk-giftrow{display:flex;gap:10px;align-items:center;border:2px solid #d5e6ed;border-radius:14px;padding:6px 10px;background:#fff}
.tk-giftrow .tk-giftimg{flex:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:32px;line-height:1}
.tk-giftrow .tk-giftimg img{width:100%;height:100%;object-fit:contain;display:block}
.tk-giftrow .tk-gifttext{min-width:0;display:block;line-height:1.5}
.tk-giftrow b{display:block;font-size:.95rem}
.tk-giftrow small{display:block;font-size:.82rem;color:#506874}
.tk-giftclose{display:block;margin:0 auto;min-width:160px;min-height:48px}
.tk-rice{display:flex;align-items:center;justify-content:center;border-radius:14px}
.tk-rice svg{width:60%;height:auto;display:block;pointer-events:none}
.tk-rice.tk-gone{visibility:hidden}
.tk-starwall{position:absolute;pointer-events:none;opacity:0;transition:opacity 1.6s}
.tk-room.tk-starry .tk-starwall{opacity:1}
.tk-st{opacity:.3;transform-box:fill-box;transform-origin:center;animation:tk-tw 5s ease-in-out infinite}
@keyframes tk-tw{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:1;transform:scale(1.12)}}
.tk-room.tk-starry .tk-halo{opacity:0 !important}
.tk-room.tk-starry .tk-dim{opacity:.6}
.tk-room.tk-starry .tk-water{filter:brightness(1.12) saturate(1.1)}
.tk-room.tk-starry .tk-twinkle{filter:drop-shadow(0 0 5px #fff6a8)}
.tk-friend{transition:transform 1.4s ease}
.tk-room.tk-nap .tk-mascot{animation:tk-nap 5.4s ease-in-out infinite}
@keyframes tk-nap{0%,100%{transform:scale(1,1) rotate(-1.5deg)}50%{transform:scale(1.03,.985) rotate(-1.5deg)}}
.tk-room.tk-nap .tk-friend[data-who=a]{transform:translateX(7px) rotate(3deg)}
.tk-room.tk-nap .tk-friend[data-who=b]{transform:translateX(-7px) rotate(-3deg)}
.tk-room.tk-nap[data-time=yoru] .tk-water{filter:brightness(.9)}
.tk-instar{position:absolute;left:36%;top:30%;font-style:normal;font-size:13px;line-height:1;color:#fff2a8;text-shadow:0 0 6px #ffe27a,0 0 10px #fff;opacity:0;pointer-events:none;animation:tk-tw 4.2s ease-in-out infinite}
.tk-night .tk-bottlestar .tk-instar{opacity:1}
.tk-restfish{position:absolute;left:66%;top:22%;font-style:normal;font-size:13px;line-height:1;display:none;pointer-events:none;animation:tk-float 4.2s ease-in-out infinite alternate}
.tk-night .tk-restfish{display:block}
.tk-hb{opacity:0}
@media(prefers-reduced-motion:reduce){
  .tk-fish[data-rainbow],.tk-st,.tk-instar,.tk-restfish,.tk-room.tk-nap .tk-mascot{animation:none}
  .tk-st{opacity:.7}
  .tk-friend{transition:none}
  .tk-sway,.tk-float,.tk-twinkle,.tk-ray,.tk-mascot{animation:none}
  .tk-bub{display:none}
  #tk .tk-chrome,.tk-says,.tk-water,.tk-dim{transition:none}
}`;
  document.head.append(css);

  // ─── 部品（ダイアログ）───
  const dlg = document.createElement('dialog');
  dlg.id = 'tk'; dlg.setAttribute('aria-labelledby', 'tk-title');
  const friendSrc = id => { const el = document.getElementById(id); return el && el.getAttribute('src'); };
  const fa = friendSrc('friend-a'), fb = friendSrc('friend-b');
  dlg.innerHTML = `
    <div class="tk-head tk-chrome"><h2 id="tk-title">まるふわの おへや</h2><div class="tk-headbtns"><button type="button" class="tk-cam" aria-label="しゃしんを とる">📷<span> しゃしん</span></button><button type="button" class="tk-snd" aria-pressed="false" aria-label="おと：OFF">🔇</button><button type="button" class="tk-close">とじる</button></div></div>
    <div class="tk-stage"><div class="tk-room" data-time="hiru">
      <div class="tk-roomsvg" style="left:0;top:0;width:100%;height:100%"></div>
      <div class="tk-shelf" aria-hidden="true" hidden></div>
      <div class="tk-dim"></div>
      <div class="tk-starwall" aria-hidden="true" style="left:0;top:0;width:100%;height:100%"></div>
      ${fa ? '<img class="tk-friend" data-who="a" src="' + fa + '" alt="" draggable="false">' : ''}
      <img class="tk-mascot" src="${BASE}img/game-blue.webp" width="240" height="320" alt="すいそうを ながめる まるふわ" draggable="false">
      ${fb ? '<img class="tk-friend" data-who="b" src="' + fb + '" alt="" draggable="false">' : ''}
      <div class="tk-lamp" style="left:0;top:0;width:100%;height:100%;pointer-events:none"></div>
      <button type="button" class="tk-lampbtn" aria-pressed="false" aria-label="ランプ" style="left:41.7%;top:0;width:16.7%;height:8.8%"></button>
      <button type="button" class="tk-rice" aria-label="おにぎり" style="left:53.1%;top:80.2%;width:15.6%;height:8.2%"></button>
      <button type="button" class="tk-shelfbtn" aria-expanded="false" aria-label="おくりもの だな" style="left:3.9%;top:39.7%;width:92.2%;height:14.4%" hidden></button>
      <div class="tk-water" data-tk="water">
        <svg class="tk-rays" viewBox="0 0 328 180" preserveAspectRatio="xMidYMin slice" aria-hidden="true"></svg>
        <div class="tk-base" aria-hidden="true"></div>
        <div class="tk-placed" aria-hidden="true"></div>
        <div class="tk-layer" aria-hidden="true"></div>
        <div class="tk-empty" hidden style="position:absolute"><span></span><button type="button">つりに いく</button></div>
      </div>
      <div class="tk-frame" style="left:0;top:0;width:100%;height:100%;pointer-events:none"></div>
      <p class="tk-says" aria-live="off" style="margin:0"></p>
      <div class="tk-card" hidden role="group" aria-label="さかなの データ"></div>
    </div>
    <div class="tk-giftlist" hidden role="group" aria-labelledby="tk-gift-title"><h3 id="tk-gift-title">おくりもの だな</h3><p class="tk-giftsub">もらった さかなが ならんで いるよ。つれた かずには、はいらないよ。</p><ul class="tk-giftrows"></ul><button type="button" class="tk-giftclose">とじる</button></div></div>
    <div class="tk-tray" hidden><p></p><div class="tk-items"></div><div class="tk-placedlist"></div><div class="tk-trayrow"><button type="button" class="tk-clear">ぜんぶ もどす</button><button type="button" class="tk-done">おわる</button></div></div>
    <div class="tk-actions tk-chrome"><button type="button" class="tk-feed">ごはんを あげる</button><button type="button" class="tk-deco-btn" aria-pressed="false">かざる</button><button type="button" class="tk-ear" aria-pressed="false">みみで ながめる</button></div>
    <div class="tk-photo" hidden><p></p><img alt="とった しゃしん"><div class="tk-photorow"><a class="tk-save" download="marufuwa-osuisou.png">ほぞん</a><button type="button" class="tk-share" hidden>ひとに みせる</button><button type="button" class="tk-photoclose">とじる</button></div></div>
    <p class="tk-sr" role="status" id="tk-sr"></p><ul class="tk-sr" id="tk-list"></ul>`;
  document.body.append(dlg);
  const stage = $(dlg, '.tk-stage'), room = $(dlg, '.tk-room'), water = $(dlg, '.tk-water'), layer = $(dlg, '.tk-layer'), base = $(dlg, '.tk-base'), placedBox = $(dlg, '.tk-placed'), rays = $(dlg, '.tk-rays');
  const tip = $(dlg, '.tk-card'), empty = $(dlg, '.tk-empty'), mascot = $(dlg, '.tk-mascot'), says = $(dlg, '.tk-says'), sr = $(dlg, '#tk-sr'), list = $(dlg, '#tk-list');
  const tray = $(dlg, '.tk-tray'), items = $(dlg, '.tk-items'), placedList = $(dlg, '.tk-placedlist'), decoBtn = $(dlg, '.tk-deco-btn'), earBtn = $(dlg, '.tk-ear'), sndBtn = $(dlg, '.tk-snd'), photo = $(dlg, '.tk-photo');
  const friendsEls = [...dlg.querySelectorAll('.tk-friend')];
  const starwall = $(dlg, '.tk-starwall'), lampBtn = $(dlg, '.tk-lampbtn'), rice = $(dlg, '.tk-rice');
  const shelf = $(dlg, '.tk-shelf'), shelfBtn = $(dlg, '.tk-shelfbtn'), giftBox = $(dlg, '.tk-giftlist'), giftRows = $(dlg, '.tk-giftrows');
  $(dlg, '.tk-roomsvg').innerHTML = roomSvg(); $(dlg, '.tk-lamp').innerHTML = lampSvg(); $(dlg, '.tk-frame').innerHTML = frameSvg();
  for (const child of [$(dlg, '.tk-roomsvg'), $(dlg, '.tk-lamp'), $(dlg, '.tk-frame')]) { const s = child.querySelector('svg'); if (s) { s.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block'; } }

  // 部屋のなかの おき場所（360×640 の ぶんりつ）
  const pct = (v, total) => (v / total * 100).toFixed(3) + '%';
  function placeRoom() {
    const t = ROOM.tank, m = ROOM.mascot, f = ROOM.friend;
    Object.assign(water.style, { left: pct(t.x, ROOM.w), top: pct(t.y, ROOM.h), width: pct(t.w, ROOM.w), height: pct(t.h, ROOM.h) });
    Object.assign(mascot.style, { left: pct(m.cx - m.w / 2, ROOM.w), top: pct(m.foot - m.h, ROOM.h), width: pct(m.w, ROOM.w), height: pct(m.h, ROOM.h) });
    friendsEls.forEach(el => { const i = el.dataset.who === 'a' ? 0 : 1; Object.assign(el.style, { left: pct(ROOM.friendX[i] - f.w / 2, ROOM.w), top: pct(f.foot[i] - f.w, ROOM.h), width: pct(f.w, ROOM.w), height: pct(f.w, ROOM.h) }); });
    Object.assign(says.style, { left: pct(ROOM.bubble.x, ROOM.w), top: pct(ROOM.bubble.y, ROOM.h), width: pct(ROOM.bubble.w, ROOM.w), position: 'absolute' });
  }
  placeRoom();

  // 開くボタン：本体の「ずかん」の隣に足す（なければ「なげる」の隣）
  const openBtn = document.createElement('button');
  openBtn.type = 'button'; openBtn.id = 'tk-open';
  openBtn.innerHTML = '🐠 すいそう<span class="tk-badge" hidden aria-hidden="true"></span>';
  const anchor = document.getElementById('open-book');
  if (CFG.noButton) { /* ボタンは ページに 足さない */ } else if (anchor && anchor.parentNode) { openBtn.style.flex = '1'; anchor.after(openBtn); } else (document.querySelector('.actions') || document.querySelector('main') || document.body).append(openBtn);
  const badge = $(openBtn, '.tk-badge');
  function refreshBadge() {
    const n = newArrivals().reduce((sum, r) => sum + r.n, 0);
    badge.hidden = n === 0; badge.textContent = String(n);
    openBtn.setAttribute('aria-label', n ? 'すいそうを みる。あたらしい なかまが ' + n + 'ひき' : 'すいそうを みる');
  }

  // ─── すいそうの中身 ───
  let fishes = [], flakes = [], W = 328, H = 180, unit = 1, floorY = 150, raf = 0, last = 0, now = 0, rnd = mulberry(1);
  let sayTimer = 0, zenTimer = 0, moodTimer = 0, rotateTimer = 0, lastSay = '', meals = 0, deco = false, selected = '', sayPending = 0, pal = palette();
  const isOpen = () => dlg.open;

  function layoutRoom() {
    dlg.style.width = '';
    const cs = getComputedStyle(stage), aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const s = Math.max(.3, Math.min(aw / ROOM.w, ah / ROOM.h));
    if (aw > ROOM.w * s + 40) dlg.style.width = Math.max(300, Math.ceil(ROOM.w * s) + 28) + 'px';   // 背の高さで きまる時は、ダイアログを部屋のはばに合わせる
    dlg.classList.toggle('tk-narrow', dlg.getBoundingClientRect().width < 400);   // へやの はばが せまい 時は、上の ボタンを 小さく まとめる
    room.style.width = (ROOM.w * s).toFixed(1) + 'px'; room.style.height = (ROOM.h * s).toFixed(1) + 'px'; room.style.setProperty('--s', String(s));
    water.style.borderRadius = (14 * s).toFixed(1) + 'px'; says.style.fontSize = (13 * s).toFixed(1) + 'px'; says.style.borderRadius = (16 * s).toFixed(1) + 'px';
    const r = water.getBoundingClientRect();
    W = Math.max(160, r.width); H = Math.max(90, r.height);
    unit = clamp(W / 360, .6, 1.5); floorY = H * .82;
    water.style.setProperty('--h', Math.round(H) + 'px');
    water.querySelectorAll('.tk-bub').forEach(b => b.style.setProperty('--h', Math.round(H) + 'px'));
  }

  function paintWater() {
    pal = palette();
    room.dataset.time = pal.time;
    water.style.setProperty('--tk-a', pal.a); water.style.setProperty('--tk-b', pal.b);
    base.innerHTML = tankBaseSvg(pal); rays.innerHTML = raysSvg(); rays.style.opacity = pal.night ? '.3' : '.85';
    const svg = base.querySelector('svg'); if (svg) svg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    water.querySelectorAll('.tk-bub').forEach(n => n.remove());
    if (reduced()) return;
    const r = mulberry(77);
    for (let i = 0; i < 7; i++) { // エアストーンから ゆっくり あがる あわ
      const b = document.createElement('span'), sz = 3 + r() * 5;
      b.className = 'tk-bub'; b.style.cssText = `left:${(22 + r() * 8) / 328 * 100}%;bottom:${(180 - 166) / 180 * 100}%;width:${sz}px;height:${sz}px;--d:${4 + r() * 3}s;--dl:${-r() * 6}s;--dx:${(r() - .5) * 14}px;--h:${Math.round(H)}px`;
      water.append(b);
    }
  }

  // 魚の表示
  const zoneOf = f => {
    if (f.icon === '🦀' || f.icon === '🦐') return { y0: .8, y1: .92, kind: 'crawl' };
    if (f.icon === '🐙') return { y0: .72, y1: .9, kind: 'crawl' };
    if (f.icon === '🪼') return { y0: .1, y1: .55, kind: 'float' };
    if (f.icon === '🦑') return { y0: .25, y1: .62, kind: 'jet' };
    if ([4, 14, 15, 21].includes(f.id)) return { y0: .6, y1: .84, kind: 'swim' };
    if (f.icon === '🐳' || f.icon === '🐬' || f.icon === '🐢') return { y0: .22, y1: .58, kind: 'glide' };
    return { y0: .1, y1: .7, kind: 'swim' };
  };
  const LEFT_FACING = new Set(['🐟', '🐠', '🐡']); // 絵文字の魚は左向き。絵（TsuriArt）は ぜんぶ頭が左向き（発注書）。どちらも右へ泳ぐ時だけ反転する
  const sizeOf = (f, best, nushi) => {
    const t = clamp((Math.log(f.max) - Math.log(3)) / (Math.log(400) - Math.log(3)), 0, 1);
    const mod = .92 + .2 * clamp((best - f.min) / Math.max(1, f.max - f.min), 0, 1); // 自分の最大サイズが、魚の大きさに出る
    return (24 + 40 * Math.pow(t, .9)) * mod * unit * (nushi ? 1.32 : f.rare === 5 ? 1.2 : f.rare === 4 ? 1.1 : 1); // ぬしは ひとまわり おおきく（スペシャルも ほんの すこし）
  };
  function makeFish(r, k, fresh, edge) {
    const f = r.fish, z = zoneOf(f), seedR = mulberry(f.id * 7919 + k * 104729 + 13);
    const el = document.createElement('span');
    el.className = 'tk-fish'; el.dataset.fid = String(f.id); if (f.legend) { el.dataset.legend = '1'; const artMeta = window.TsuriArt && window.TsuriArt.meta; if (!(artMeta && artMeta.rainbowInTank === false)) el.dataset.rainbow = '1'; }
    // 絵に すでに にじを ぬってある時（TsuriArt.meta.rainbowInTank=false）は、水槽の にじいろの 光を かけない
    el.dataset.layer = String(r.nushi || f.rare >= 4 ? 2 : Math.floor(seedR() * 3)); // ぬしと スペシャルは いちばん まえを、ゆっくり
    const layerNo = Number(el.dataset.layer), art = window.TsuriArt && window.TsuriArt[f.id];
    const size = sizeOf(f, r.best, r.nushi) * (1 + (k ? (seedR() - .5) * .16 : 0)) * [.86, 1, 1.12][layerNo];
    el.style.width = el.style.height = Math.round(size) + 'px';
    el.style.fontSize = Math.round(size * .92) + 'px'; el.style.zIndex = String(1 + layerNo);
    if (art) { const im = new Image(); im.src = art; im.alt = ''; im.draggable = false; el.append(im); } else el.textContent = f.icon;
    const o = { el, f, art: !!art, best: r.best, count: r.count, nushi: !!r.nushi, size, z, layer: layerNo, seed: seedR, at: performance.now(), leaving: false,
      x: 0, y: 0, vx: 0, tx: 0, ty: 0, dir: seedR() < .5 ? -1 : 1, face: 1, hold: 0, until: 0, pop: 0, nibble: 0,
      speed: (14 + seedR() * 12) * unit * [.7, 1, 1.25][layerNo] * (z.kind === 'glide' ? .8 : z.kind === 'crawl' ? .55 : 1) * (r.nushi ? .7 : f.rare >= 4 ? .85 : 1), fresh: !!fresh,
      bp: seedR() * 6.28, bw: .8 + seedR() * .8, ba: (2 + seedR() * 3) * unit, enter: 0 };
    const m = size * .6 + 6;
    o.x = m + seedR() * Math.max(1, W - 2 * m); o.y = (z.y0 + seedR() * (z.y1 - z.y0)) * floorY;
    if (edge) { o.x = edge > 0 ? W - m : m; o.dir = edge > 0 ? -1 : 1; }
    retarget(o);
    o.px = o.x; o.lastVoice = -1e9;
    if (fresh && !reduced()) { o.enter = 1.5; o.enterFrom = -size; o.ty0 = o.y; o.y = -size; ripple(o.x); cuePlop(o.x); if (f.rare >= 3 || r.nushi) fishVoice(f, panOf(o.x), .08, r.nushi); }
    if (edge && !reduced()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1400 });
    layer.append(el); place(o); prepFocus(o);
    return o;
  }
  function retarget(o) {
    const m = o.size * .6 + 6;
    if (o.gather && now < o.gather) {   // ごはんの おれい：ガラスの まんなかに あつまる
      o.tx = clamp(W * .5 + (o.seed() - .5) * W * .34, m, W - m); o.ty = clamp(H * .34 + o.seed() * H * .28, o.size * .5 + 4, floorY);
      o.dir = o.tx > o.x ? 1 : -1; o.until = now + 1600; return;
    }
    let tx = m + o.seed() * Math.max(1, W - 2 * m);
    if (Math.abs(tx - o.x) < W * .16) tx = o.x + (o.x < W / 2 ? 1 : -1) * (W * .24 + o.seed() * W * .2);
    o.tx = clamp(tx, m, W - m);
    o.ty = (o.z.y0 + o.seed() * (o.z.y1 - o.z.y0)) * floorY;
    o.dir = o.tx > o.x ? 1 : -1;
    o.until = now + 2600 + o.seed() * 5200;
    if ((o.z.kind === 'crawl' || o.z.kind === 'jet') && o.seed() < .55) o.hold = 1.4 + o.seed() * 3.4;
  }
  function place(o) {
    const bob = reduced() ? 0 : Math.sin(now / 1000 * o.bw + o.bp) * o.ba;
    const flip = (o.art || LEFT_FACING.has(o.f.icon)) ? (o.face > 0 ? -1 : 1) : 1;
    const pulse = o.z.kind === 'float' && !reduced() ? 1 + .07 * Math.sin(now / 1000 * 3.6 + o.bp) : 1;
    const s = (o.pop > 0 ? 1 + .22 * Math.sin(Math.min(1, o.pop) * Math.PI) : 1) * (o.nibble > 0 ? 1 + .12 * Math.sin(Math.min(1, o.nibble * 3) * Math.PI) : 1) * pulse;
    o.el.style.transform = `translate3d(${(o.x - o.size / 2).toFixed(1)}px,${(o.y - o.size / 2 + bob).toFixed(1)}px,0) scale(${(flip * s).toFixed(3)},${s.toFixed(3)})`;
  }
  function step(dt) {
    const still = reduced();
    for (let i = 0; i < fishes.length; i++) { // ぶつからないように、そっと はなれる
      const a = fishes[i]; if (a.enter > 0) continue;
      for (let j = i + 1; j < fishes.length; j++) {
        const b = fishes[j]; if (b.enter > 0) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, min = (a.size + b.size) * .42;
        if (d < min) { const push = (min - d) / min * 26 * unit * dt, ux = dx / d, uy = dy / d; a.x -= ux * push; b.x += ux * push; a.y -= uy * push * .6; b.y += uy * push * .6; }
      }
    }
    for (const o of fishes) {
      if (o.enter > 0) { // ぽちゃんと入ってきて、ふわっと定位置へ
        o.enter -= dt; const k = 1 - clamp(o.enter / 1.5, 0, 1), e = 1 - Math.pow(1 - k, 3);
        o.y = o.enterFrom + (o.ty0 - o.enterFrom) * e; place(o); if (o.enter <= 0) retarget(o); continue;
      }
      if (o.pop > 0) o.pop -= dt / 1.4;
      if (o.nibble > 0) o.nibble -= dt;
      if (o.hold > 0) { o.hold -= dt; o.vx += (0 - o.vx) * Math.min(1, dt * 2); }
      else {
        let food = null, best = Infinity; // ごはんがあれば、いちばん近いのへ（動きを減らす設定の時は追いかけない）
        if (!still && o.z.kind !== 'float') for (const fl of flakes) { const d = Math.hypot(fl.x - o.x, fl.y - o.y); if (d < 170 * unit && d < best && fl.y > H * .1) { best = d; food = fl; } }
        if (food) {
          if (!o.chasing) { o.chasing = true; if (sfx) cueGather(); }
          o.dir = food.x > o.x ? 1 : -1;
          const want = clamp((food.x - o.x) * 1.4, -o.speed * 2.2, o.speed * 2.2);
          o.vx += (want - o.vx) * Math.min(1, dt * 2.2);
          o.y += (food.y - o.y) * Math.min(1, dt * 1.4);
          if (Math.hypot(food.x - o.x, food.y - o.y) < o.size * .5 + 6) eat(o, food);
        } else {
          o.chasing = false;
          const want = o.dir * o.speed * (still ? .3 : listen ? .35 : 1) * (o.z.kind === 'jet' && o.until - now < 700 ? 3.2 : 1);
          o.vx += (want - o.vx) * Math.min(1, dt * 1.4);
          o.y += (o.ty - o.y) * Math.min(1, dt * (o.z.kind === 'float' ? .35 : .7));
          if ((o.dir > 0 && o.x >= o.tx) || (o.dir < 0 && o.x <= o.tx) || now > o.until) retarget(o);
        }
      }
      o.x += o.vx * dt;
      if (sfx) crossCue(o);
      const m = o.size * .5 + 4;
      if (o.x < m || o.x > W - m) { o.x = clamp(o.x, m, W - m); retarget(o); }
      o.y = clamp(o.y, o.size * .5 + 4, floorY + o.size * .12);
      if (Math.abs(o.vx) > 5) o.face = o.vx > 0 ? 1 : -1;
      place(o);
    }
    for (let i = flakes.length - 1; i >= 0; i--) {
      const fl = flakes[i];
      fl.age += dt;
      if (fl.y < floorY + 8) { fl.y += fl.vy * dt; fl.x += Math.sin(fl.age * 2 + fl.ph) * 6 * dt; } else fl.rest = (fl.rest || 0) + dt;
      fl.el.style.transform = `translate(${fl.x.toFixed(1)}px,${fl.y.toFixed(1)}px)`;
      if (fl.age > fl.life + 3 || (fl.rest || 0) > 2) { fl.el.remove(); flakes.splice(i, 1); }
    }
  }
  function loop(t) {
    raf = 0;
    if (!isOpen()) return;
    const dt = last ? clamp((t - last) / 1000, 0, .05) : .016; last = t; now = t;
    step(dt);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };

  // ─── 音（本体の save.sound を読む。目が見えなくても、耳で水槽が分かるように）───
  //   ぜんぶ その場で合成する（サンプル・ダウンロードなし）。おとが OFF の時は、AudioContext も作らない。
  //   魚ごとの「なまえの おと」：大きい魚ほど低く、めずらしいほど ゆたかな音色。ぬしは ゆっくり ふくらむ低い和音。
  let actx = null, master = null, noiseBuf = null, hissBuf = null, ambience = null, bubbleTimer = 0, sfx = false, lastCue = 0, lastGather = 0, listen = false;
  const mainSound = () => readSave().sound === true;
  function soundNow() { const main = mainSound(); return tank.sound !== undefined && tank.soundMain === main ? tank.sound : main; }
  function refreshSound() { sfx = soundNow(); if (!sfx) stopAmbience(); else if (isOpen()) startAmbience(); syncSoundButton(); bgmRefresh(); return sfx; }
  function audio() {
    const AC = window.AudioContext || window.webkitAudioContext;   // つかう時に探す（おとが OFF の間は、作らない）
    if (!sfx || !AC) return null;
    try {
      if (!actx) { actx = new AC(); master = actx.createGain(); master.gain.value = .55; master.connect(actx.destination); }
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch { return null; }
  }
  const panner = (c, pan) => { if (!c.createStereoPanner) return master; const p = c.createStereoPanner(); p.pan.value = clamp(pan || 0, -1, 1); p.connect(master); return p; };
  // むかしの ゲームき ふう（つりびよりと おなじ）：かくばった なみ（square）と、さんかくの なみ（triangle）と、みじかい ざつおん だけ。
  // ぷつっと はじまって、すぱっと きれる。たかさは だんだんに うごく（ピロリッ、ヒュ〜）
  function tone(freq, len, o = {}) {
    const c = audio(); if (!c) return;
    const t = c.currentTime + (o.at || 0), osc = c.createOscillator(), g = c.createGain(), vol = o.vol === undefined ? .1 : o.vol;
    osc.type = o.type === 'square' ? 'square' : 'triangle'; osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.linearRampToValueAtTime(Math.max(30, freq * o.glide), t + len);
    const level = osc.type === 'triangle' ? vol * 1.5 : vol * .7;   // さんかくの なみは ちいさく きこえるので すこし たす
    g.gain.setValueAtTime(level, t); g.gain.setValueAtTime(level * .6, t + len * .5); g.gain.setValueAtTime(0, t + len);
    osc.connect(g); g.connect(panner(c, o.pan)); osc.start(t); osc.stop(t + len + .02);
  }
  function noise(len, o = {}) {   // みじかい ざっ（ざらざらした ざつおん。むかしの ゲームきの ドラムの おと）
    const c = audio(); if (!c) return;
    if (!hissBuf) { hissBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = hissBuf.getChannelData(0); let hold = 0; for (let i = 0; i < d.length; i++) { if (i % 6 === 0) hold = Math.random() * 2 - 1; d[i] = hold; } }
    const t = c.currentTime + (o.at || 0), src = c.createBufferSource(), g = c.createGain();
    src.buffer = hissBuf; g.gain.setValueAtTime(Math.max(.0002, o.vol || .05), t); g.gain.linearRampToValueAtTime(0, t + len);
    src.connect(g); g.connect(panner(c, o.pan)); src.start(t, Math.random() * .4); src.stop(t + len + .02);
  }
  const PENTA = [0, 2, 4, 7, 9];
  const sizeNorm = f => clamp((Math.log(f.max) - Math.log(3)) / (Math.log(400) - Math.log(3)), 0, 1);
  function fishFreq(f) { const idx = Math.round((1 - sizeNorm(f)) * 13) + (f.id % 3); return 130.8 * 2 ** ((PENTA[idx % 5] + 12 * Math.floor(idx / 5)) / 12); }
  const REG = { 1: 'ふつう', 2: 'ちょっと めずらしい', 3: 'めずらしい', 4: 'スペシャル', 5: 'まぼろし' };
  const regOf = o => o.nushi ? 'ぬし' : REG[o.f.rare];
  const sizeWord = (f, nushi) => nushi || f.rare >= 4 ? 'とても おおきい' : sizeNorm(f) > .62 ? 'おおきい' : sizeNorm(f) > .3 ? 'ふつうの おおきさ' : 'ちいさい';
  function fishVoice(f, pan, vol = .1, nushi = false) {   // 魚の「なまえの おと」（ぬしと スペシャルは、ながい ファンファーレふう）
    if (!sfx) return;
    const fr = fishFreq(f);
    if (nushi || f.rare >= 4) { tone(fr, .3, { type: 'triangle', vol: vol * 1.2, pan }); tone(fr * 1.5, .3, { type: 'triangle', vol: vol * .8, pan, at: .11 }); tone(fr * 2, .42, { type: 'square', vol: vol * .5, pan, at: .22 }); if (f.rare === 5) tone(fr * 3, .34, { type: 'square', vol: vol * .35, pan, at: .5 }); }
    else if (f.rare === 3) { tone(fr, .18, { type: 'triangle', vol, pan }); tone(fr * 2, .12, { type: 'square', vol: vol * .5, pan, at: .09 }); tone(fr * 3, .1, { type: 'square', vol: vol * .35, pan, at: .17 }); }
    else if (f.rare === 2) { tone(fr, .14, { type: 'square', vol: vol * .8, pan }); tone(fr * 2, .1, { type: 'square', vol: vol * .4, pan, at: .09 }); }
    else tone(fr, .14, { type: 'triangle', vol, pan });
  }
  const panOf = x => clamp((x / W - .5) * 1.8, -.9, .9);
  function startAmbience() {   // ひくく ゆっくりの みずの おと＋ときどき あわ
    if (ambience || !sfx) return;
    const c = audio(); if (!c) return;
    try {
      if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const src = c.createBufferSource(), soft = c.createBiquadFilter(), swell = c.createGain(), lfo = c.createOscillator(), depth = c.createGain();
      src.buffer = noiseBuf; src.loop = true; soft.type = 'lowpass'; soft.frequency.value = 420; swell.gain.value = .022;
      lfo.frequency.value = .09; depth.gain.value = .012; lfo.connect(depth); depth.connect(swell.gain);
      src.connect(soft); soft.connect(swell); swell.connect(master); src.start(); lfo.start(); ambience = [src, lfo];
    } catch {}
    const blip = () => { clearTimeout(bubbleTimer); if (!sfx || !isOpen()) return; if (!reduced()) tone(380 + Math.random() * 520, .1, { vol: .022, glide: 1.9, pan: Math.random() * 1.6 - .8 }); bubbleTimer = setTimeout(blip, 1600 + Math.random() * 3800); };
    bubbleTimer = setTimeout(blip, 1200);
  }
  function stopAmbience() { clearTimeout(bubbleTimer); if (ambience) ambience.forEach(n => { try { n.stop(); } catch {} }); ambience = null; }
  const buzz = pattern => { try { if (sfx && !reduced() && navigator.vibrate) navigator.vibrate(pattern); } catch {} };
  // 魚が、左の線（画面の3割）か 右の線（7割）を こえて 前を通ると、なまえの おとが 小さく鳴る（左右の位置が ステレオで分かる）
  function crossCue(o) {
    const a = W * .3, b = W * .7, hit = (a - o.px) * (a - o.x) < 0 ? a : (b - o.px) * (b - o.x) < 0 ? b : 0;
    o.px = o.x;
    if (!hit) return;
    const t = performance.now();
    if (t - lastCue < 1600 || t - o.lastVoice < 8000) return;   // にぎやかに しすぎない：全体で1.6秒に1回まで、同じ魚は8秒に1回まで
    lastCue = t; o.lastVoice = t;
    fishVoice(o.f, panOf(hit), [.05, .07, .09][o.layer] || .07, o.nushi);
  }
  // もようごとの おと
  const cueSprinkle = x => { for (let i = 0; i < 4; i++) noise(.04, { at: i * .06, vol: .03, pan: panOf(x) }); };
  const cueMunch = x => { noise(.05, { vol: .05, pan: panOf(x) }); tone(300 + Math.random() * 120, .07, { vol: .05, glide: 1.6, pan: panOf(x), at: .01 }); buzz(12); };
  const cueGather = () => { const t = performance.now(); if (t - lastGather < 2500) return; lastGather = t; tone(659, .1, { vol: .05 }); tone(784, .14, { vol: .05, at: .09 }); };
  const cuePlop = x => { tone(720, .16, { vol: .09, glide: .32, pan: panOf(x) }); noise(.1, { vol: .035, at: .04, pan: panOf(x) }); };
  const cuePon = (x, off) => { tone(off ? 659 : 523, .1, { type: 'triangle', vol: .09, glide: off ? .6 : 1.26, pan: panOf(x) }); buzz(10); };
  const cueShutter = () => { noise(.05, { vol: .09 }); noise(.06, { at: .09, vol: .08 }); tone(1046, .07, { type: 'square', vol: .04, at: .02 }); buzz([15, 40, 15]); };
  const cueOpen = () => { [523, 659, 784].forEach((f, i) => tone(f, .22, { type: 'triangle', vol: .06, at: i * .08 })); };
  const cueClose = () => { [784, 659, 523].forEach((f, i) => tone(f, .18, { type: 'triangle', vol: .05, at: i * .07 })); };

  // ─── 動作：ごはん・さわる・ことば ───
  function heart(x, y) {
    if (reduced()) return;
    const h = document.createElement('i'); h.className = 'tk-heart'; h.textContent = '♥︎';
    h.style.left = (x - 6) + 'px'; h.style.top = (y - 12) + 'px'; water.append(h);
    h.animate([{ opacity: 0, transform: 'translateY(4px) scale(.5)' }, { opacity: 1, transform: 'translateY(-8px) scale(1.05)', offset: .3 }, { opacity: 0, transform: 'translateY(-26px) scale(.9)' }], { duration: 1200 }).onfinish = () => h.remove();
    setTimeout(() => h.remove(), 1500);
  }
  function ripple(x) {
    if (reduced()) return;
    const r = document.createElement('i'); r.className = 'tk-ripple'; r.style.left = x + 'px'; water.append(r);
    r.animate([{ opacity: .9, transform: 'scale(.3)' }, { opacity: 0, transform: 'scale(1.8)' }], { duration: 1100, easing: 'ease-out' }).onfinish = () => r.remove();
    setTimeout(() => r.remove(), 1400);
  }
  function mood(face, ms) {
    mascot.src = BASE + 'img/game-' + face + '.webp'; clearTimeout(moodTimer);
    moodTimer = setTimeout(() => { mascot.src = BASE + 'img/game-blue.webp'; }, ms || 2600);
  }
  function say(text, force) {
    if (!text || (text === lastSay && !force)) return;
    lastSay = text; says.dataset.fade = 'true'; clearTimeout(sayPending);
    sayPending = setTimeout(() => { says.textContent = text; says.dataset.fade = 'false'; }, reduced() ? 0 : 320);
  }
  function autoSay() {
    clearTimeout(sayTimer);
    if (!isOpen()) return;
    if (napping) { sayTimer = setTimeout(autoSay, 9000); return; }
    const cur = fishes.filter(o => !o.leaving).map(o => o.f), time = scene.dataset.time || 'hiru', roll = Math.random();
    let text;
    const left = fishList().filter(f => !f.legend).length - residents().filter(r => !r.fish.legend).length;   // ずかんは まぼろしを かぞえない
    if (!cur.length) text = pick(SAY.empty);
    else if (roll < .16 && left > 0 && left <= 5) text ='ずかんまで あと ' + left + 'しゅるい。ゆっくり あいにいこうね。';
    else if (roll < .2 && left === 0) text = 'ずかん、ぜんぶ そろったね。ありがとう。';
    else if (roll < .35) { const f = pick(cur); text = pick(SAY.touch(f.name)); if (f.rare >= 3) mood(f.rare >= 4 ? 'sparkle' : 'apricot', 3200); }
    else if (roll < .5 && gifts.length) text = pick(['だなに、もらった さかなが いるよ。', 'おくりもの、うれしかったね。', 'もらった さかな、ならんで いるね。']);
    else if (roll < .6 && SAY[time]) text = pick(SAY[time]);
    else text = pick(SAY.any);
    say(text);
    sayTimer = setTimeout(autoSay, 9000 + Math.random() * 5000);
  }
  function eat(o, fl) {
    const i = flakes.indexOf(fl); if (i < 0) return;
    flakes.splice(i, 1); fl.el.remove(); o.nibble = .4; o.hold = .5; meals++;
    if (sfx) cueMunch(o.x);
    if (Math.random() < .4) heart(o.x, o.y - o.size * .5);
    if (meals % 5 === 1) { say(pick(SAY.feed)); mood('mint', 2400); }
  }
  function drop(x, y, n = 3) {
    const r = mulberry(Math.floor(now) + flakes.length);
    for (let i = 0; i < n && flakes.length < 12; i++) {
      const el = document.createElement('i'); el.className = 'tk-flake'; water.append(el);
      const fl = { el, x: clamp(x + (r() - .5) * 24, 8, W - 8), y: clamp(y + (r() - .5) * 12, 6, floorY), vy: 24 + r() * 12, ph: r() * 6, age: 0, life: 10 };
      flakes.push(fl); el.style.transform = `translate(${fl.x}px,${fl.y}px)`;
    }
    if (sfx) cueSprinkle(x);
    resetZen();
  }
  // さかなの データ（さわると出る）。ひとことは、まるふわから。くらべない：出るのは自分の記録だけ
  const CARD_SAY = { 1: 'ゆったり およいでるね。', 2: 'ちょっと めずらしい こだよ。', 3: 'めずらしい こ！ あえて うれしいね。', 4: 'スペシャルな こだよ！ きらきら してるね。', 5: 'まぼろしの こ…！ ほんとうに いたんだ。' };
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  function touchFish(o, viaKey) {
    o.pop = 1; o.hold = 4; o.vx *= .2;
    const left = fishList().filter(f => !f.legend).length - residents().filter(r => !r.fish.legend).length;
    const line = o.fresh ? (left > 0 && left <= 5 ? 'はじめまして！ ずかんまで あと ' + left + 'しゅるい。' : 'はじめまして！') : (o.nushi ? 'ぬしだよ！ すごいね。' : CARD_SAY[o.f.rare] || CARD_SAY[1]);   // 「あと○」は 5しゅるい以下の時だけ（遠い時は重荷になる）
    const name = mk('div', 'tk-cardname'); name.append(mk('span', '', o.f.name));
    if (o.nushi) name.append(mk('span', 'tk-tag', 'ぬし')); else if (o.f.rare === 5) name.append(mk('span', 'tk-tag tk-myth', 'まぼろし')); else if (o.f.rare === 4) name.append(mk('span', 'tk-tag', 'スペシャル'));
    if (o.fresh) name.append(mk('span', 'tk-newburst', 'NEW'));
    const dl = mk('dl'), big = mk('span', 'tk-big', o.best.toFixed(2) + 'cm'), stars = mk('span', 'tk-stars', starsOf(o.f, o.nushi)); stars.setAttribute('aria-label', 'めずらしさ ' + starCount(o.f, o.nushi) + ' / 5');
    const row = (k, v) => { const dt = mk('dt', '', k), dd = mk('dd'); dd.append(v); dl.append(dt, dd); };
    row('さいだい', big); row('めずらしさ', stars); row('あつめた', mk('span', '', o.count + 'ひき'));
    const art = mk('div', 'tk-cardart', o.f.icon); art.setAttribute('aria-hidden', 'true');
    const l = mk('div', 'tk-cardl'); l.append(name, dl);
    const body = mk('div', 'tk-cardbody'); body.append(l, art);
    const close = mk('button', 'tk-cardclose', 'とじる'); close.type = 'button'; close.addEventListener('click', () => { tip.hidden = true; if (viaKey && o.el.isConnected) o.el.focus(); });
    tip.replaceChildren(mk('div', 'tk-cardsay', line), body, close); tip.hidden = false; o.fresh = false;
    if (viaKey) close.focus();
    clearTimeout(touchFish.t); touchFish.t = setTimeout(() => { tip.hidden = true; }, 9000);
    mood(o.nushi || o.f.rare >= 4 ? 'sparkle' : o.f.rare === 3 ? 'apricot' : 'smile', 2600);
    sr.textContent = o.f.name + '。' + regOf(o) + '。さいだい ' + o.best.toFixed(1) + 'センチ、あつめた ' + o.count + 'ひき。';
    fishVoice(o.f, panOf(o.x), .11, o.nushi); buzz(o.nushi || o.f.rare >= 4 ? [20, 40, 20, 40, 40] : 18);
    resetZen();
  }
  function resetZen() { dlg.classList.remove('tk-zen'); clearTimeout(zenTimer); zenTimer = setTimeout(() => dlg.classList.add('tk-zen'), 26000); }

  // ─── みみで ながめる：魚を Tab で えらべる（フォーカスで なまえの おと）＋ 左から右へ おとの ひとまわり ───
  const where = o => o.x < W / 3 ? 'ひだり' : o.x > W * 2 / 3 ? 'みぎ' : 'まんなか';
  const fishLabel = o => o.f.name + '。' + regOf(o) + '。' + sizeWord(o.f, o.nushi) + '。' + where(o) + 'に います。';
  function prepFocus(o) {
    o.el.tabIndex = listen ? 0 : -1;
    if (listen) o.el.setAttribute('role', 'button'); else { o.el.removeAttribute('role'); o.el.removeAttribute('aria-label'); }
  }
  function setListen(on) {
    listen = on; dlg.classList.toggle('tk-listen', on); earBtn.setAttribute('aria-pressed', String(on));
    if (on) layer.removeAttribute('aria-hidden'); else layer.setAttribute('aria-hidden', 'true');
    for (const o of fishes) prepFocus(o);
    bgmRefresh();
  }
  layer.addEventListener('focusin', e => {
    const o = fishes.find(f => f.el === (e.target.closest && e.target.closest('.tk-fish')));
    if (!o || !listen) return;
    o.hold = 4; o.el.setAttribute('aria-label', fishLabel(o)); fishVoice(o.f, panOf(o.x), .11, o.nushi);
  });
  layer.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const o = fishes.find(f => f.el === (e.target.closest && e.target.closest('.tk-fish')));
    if (o) { e.preventDefault(); touchFish(o, true); }
  });
  function tour() {
    const list = fishes.filter(o => !o.leaving).slice().sort((a, b) => a.x - b.x);
    if (!list.length) { say('まだ だれも いないよ。', true); sr.textContent = 'すいそうは まだ からっぽです。'; return; }
    sr.textContent = 'いま ' + list.length + 'ひき およいでいます。ひだりから じゅんに、' + list.map(o => where(o) + 'の ' + o.f.name + '（' + sizeWord(o.f, o.nushi) + '）').join('、') + '。';
    say(list.length + 'ひき いるよ。みみを すませてね。', true);
    list.forEach((o, i) => setTimeout(() => { if (isOpen() && sfx) fishVoice(o.f, panOf(o.x), .11, o.nushi); }, 400 + i * 650));   // ひだり→みぎへ、なまえの おとを じゅんに
    clearTimeout(utaTimer); if (sfx) utaTimer = setTimeout(sing, 400 + list.length * 650 + 5000);   // ひとまわり あと 5びょう なにも しないと、うたを うたう
  }
  function toggleSound(force) {
    const to = force === undefined ? !soundNow() : force;
    tank.sound = to; tank.soundMain = mainSound(); saveTank(); refreshSound();
    if (to) { cueOpen(); startAmbience(); say('おとを つけたよ。', true); sr.textContent = 'おとを つけました。'; } else { say('おとを けしたよ。', true); sr.textContent = 'おとを けしました。'; }
  }
  function syncSoundButton() { sndBtn.textContent = sfx ? '🔊' : '🔇'; sndBtn.setAttribute('aria-pressed', String(sfx)); sndBtn.setAttribute('aria-label', 'おと：' + (sfx ? 'ON' : 'OFF')); sndBtn.title = 'おと：' + (sfx ? 'ON' : 'OFF'); }

  // ─── BGM（外付け tsuri-bgm.js。はじめは OFF。「おと」が ON の 時だけ ながれる。おへやを ひらいて いる 間だけ）───
  //   曲：ひるは b（ぽこぽこ）、ランプを けした 星空の へやは c（ほしぞら）。「みみで ながめる」の 間は おやすみ（魚の なまえの おとを じゃましない）。
  //   「BGM」ボタンは 下の ならびに 足す。おとが OFF の まま おしたら、おとも つける。ながす 音の 部品（AudioContext）は、おへやの ものを かりる。
  let bgmBtn = null, bgmLoading = null, soundWasOff = false;
  const loadBgm = () => window.TsuriBgm ? Promise.resolve(window.TsuriBgm) : (bgmLoading || (bgmLoading = new Promise(res => { const s = document.createElement('script'); s.src = BASE + 'tsuri-bgm.js'; s.onload = () => res(window.TsuriBgm || null); s.onerror = () => res(null); document.head.append(s); })));
  function bgmEnter() {
    const B = window.TsuriBgm; if (!B) return;
    if (!bgmBtn) {
      bgmBtn = B.button({
        className: 'tk-bgm', sound: soundNow,
        enableSound: () => { soundWasOff = true; toggleSound(true); },
        onToggle: next => { const msg = next ? (soundWasOff ? 'おとと BGMを つけたよ。' : 'BGMを つけたよ。') + ' しずかな きょくが ながれるよ。' : 'BGMを けしたよ。'; soundWasOff = false; say(msg, true); sr.textContent = msg; }
      });
      $(dlg, '.tk-actions').append(bgmBtn);
    }
    B.enter('tank', { ctx: audio, sound: soundNow, starry: () => starry, mute: () => listen });
  }
  const bgmOpen = () => { if (window.TsuriBgm) bgmEnter(); else loadBgm().then(B => { if (B && isOpen()) bgmEnter(); }); };
  const bgmLeave = () => { if (window.TsuriBgm) window.TsuriBgm.leave('tank'); };
  function bgmRefresh() { if (window.TsuriBgm) window.TsuriBgm.refresh(); }

  // ─── おくりもの だな（もらった さかな。本体の Tsuri.gifts() を 読む。バケツとは べつ・つれた かずには 入れない・12ひきまで）───
  //   へやの 引き出しの ガラス 2まいに 小さく ならぶ（3×2 ずつ）。だなの まんなかの 大きな ボタンを おすと、ひとつずつ「だれから・ひとこと」が 読める。
  //   なまえの ならびは 本体の PALS・GIFT_WORDS と おなじ（本体は ならびじゅんを かえない やくそく。契約の 検査が 本体の ソースと 突きあわせる）。
  //   URL の 文字は 一切 画面に 出さない（出すのは この 表から 引いた ことばだけ）。ぬし・まぼろしは 贈れない（本体が 決める）。
  const PAL_NAME = ['ミントの うさぎ', 'ラテの かわうそ', 'レモンの ひよこ', 'リボンの うさぎ', 'おひるね パンダ', 'おほしさまの こじか', 'クローバーの たぬき', 'チョコの りす', 'ももの ねこ', 'はちみつの こいぬ', 'いちごの ハムスター', 'ほほきずの ねこ', 'さくらの あざらし', 'わたあめの アルパカ', 'がんたいの くま'];
  const GIFT_WORD = ['ひとこと なし', 'これ、あげる！', 'いっしょに つろうね', 'おおきいの つれたよ', 'きょうも おつかれさま', 'ゆっくり しようね', 'また あそぼうね', 'みて みて！', 'いい ことが ありますように', 'ありがとう。'];
  const SHELF = { panels: [{ x: 22, y: 264, w: 152, h: 72 }, { x: 186, y: 264, w: 152, h: 72 }], cols: 3, rows: 2, max: 12 };
  let gifts = [];
  const palName = i => Number.isInteger(i) && PAL_NAME[i] ? PAL_NAME[i] : 'だれか', giftWord = i => Number.isInteger(i) && i > 0 && GIFT_WORD[i] ? GIFT_WORD[i] : '';
  function giftsNow() {
    let raw = readSave().gifts;   // 記録（本体が すぐ 書く）を 先に 読む＝ひろばの ページでも 同じ。なければ 本体の Tsuri.gifts()
    if (!Array.isArray(raw)) { try { const T = window.Tsuri; raw = T && typeof T.gifts === 'function' ? T.gifts() : []; } catch { raw = []; } }
    const fl = fishList();
    return (Array.isArray(raw) ? raw : []).filter(g => g && Number.isInteger(g.id) && g.id >= 0 && g.id < fl.length && Number.isFinite(g.size)).slice(0, SHELF.max).map(g => { const f = fl[g.id]; return { id: g.id, name: f.name, icon: f.icon, size: Math.round(g.size * 10) / 10, from: palName(g.pal), word: giftWord(g.word), at: Number.isFinite(g.at) ? g.at : 0 }; });
  }
  const artOf = id => { try { return (window.TsuriArt && window.TsuriArt[id]) || ''; } catch { return ''; } };
  function renderShelf() {
    gifts = giftsNow(); shelf.replaceChildren(); shelf.hidden = shelfBtn.hidden = !gifts.length;
    if (!gifts.length) { closeGifts(); return; }
    const per = SHELF.cols * SHELF.rows;
    gifts.forEach((g, i) => {
      const p = SHELF.panels[Math.floor(i / per)], k = i % per, c = k % SHELF.cols, r = Math.floor(k / SHELF.cols), cw = (p.w - 8) / SHELF.cols, ch = (p.h - 6) / SHELF.rows, size = Math.min(cw, ch) - 4;
      const x = p.x + 4 + c * cw + (cw - size) / 2, y = p.y + 3 + r * ch + (ch - size) / 2, art = artOf(g.id); let el;
      if (art) { el = new Image(); el.src = art; el.alt = ''; el.draggable = false; } else { el = document.createElement('span'); el.textContent = g.icon; el.style.fontSize = 'calc(' + (size * .8).toFixed(1) + 'px * var(--s))'; }
      el.className = 'tk-gf'; Object.assign(el.style, { left: pct(x, ROOM.w), top: pct(y, ROOM.h), width: pct(size, ROOM.w), height: pct(size, ROOM.h) }); shelf.append(el);
    });
    shelfBtn.setAttribute('aria-label', 'おくりもの だな。もらった さかなが ' + gifts.length + 'ひき。おすと、ひらくよ。');
  }
  function openGifts() {
    if (!gifts.length) return;
    giftRows.replaceChildren(...gifts.map(g => { const li = document.createElement('li'), im = document.createElement('span'), tx = document.createElement('span'), b = document.createElement('b'), sm = document.createElement('small'), art = artOf(g.id);
      li.className = 'tk-giftrow'; im.className = 'tk-giftimg'; im.setAttribute('aria-hidden', 'true'); if (art) { const img = new Image(); img.src = art; img.alt = ''; img.draggable = false; im.append(img); } else im.textContent = g.icon;
      tx.className = 'tk-gifttext'; b.textContent = g.name + '　' + g.size.toFixed(1) + 'センチ'; sm.textContent = '🎁 ' + g.from + ' から' + (g.word ? '　「' + g.word + '」' : ''); tx.append(b, sm); li.append(im, tx); return li; }));
    giftBox.hidden = false; shelfBtn.setAttribute('aria-expanded', 'true'); giftBox.tabIndex = -1; giftBox.focus({ preventScroll: true }); giftBox.scrollTop = 0;   // さいしょの 1まいから 読める（とじるは Tab で）
    sr.textContent = 'おくりもの だなを ひらいたよ。もらった さかなが ' + gifts.length + 'ひき いるよ。'; resetZen();
  }
  function closeGifts(focus) {
    if (giftBox.hidden) return; giftBox.hidden = true; shelfBtn.setAttribute('aria-expanded', 'false'); if (focus && !shelfBtn.hidden) shelfBtn.focus();
  }
  shelfBtn.addEventListener('click', () => { if (giftBox.hidden) openGifts(); else closeGifts(true); });
  $(giftBox, '.tk-giftclose').addEventListener('click', () => closeGifts(true));
  dlg.addEventListener('cancel', e => { if (!giftBox.hidden) { e.preventDefault(); closeGifts(true); } });   // Esc は まず だなを とじる（おへやは そのまま）

  // ─── 魚の入れかえ：水槽に出ているのは、いっぺんに数ひきだけ。ときどき入れかわる ───
  const capFor = () => W < 420 ? 8 : 12;
  const chooseVisible = (res, arrivals) => {
    const arr = res.filter(r => arrivals.has(r.fish.id)), rest = res.filter(r => !arrivals.has(r.fish.id));
    const r2 = mulberry(Date.now() % 100000);
    rest.sort((a, b) => ((b.fish.rare + (b.nushi ? 1 : 0)) * .5 + r2()) - ((a.fish.rare + (a.nushi ? 1 : 0)) * .5 + r2()));
    return [...arr, ...rest].slice(0, capFor());
  };
  function populate(fresh) {
    layer.replaceChildren(); fishes = []; flakes.forEach(f => f.el.remove()); flakes = []; tip.hidden = true;
    const all = residents(), arrivals = fresh ? new Set(newArrivals().map(r => r.fish.id)) : new Set(), shown = chooseVisible(all, arrivals);
    let total = 0; const cap = capFor() + 2;
    for (const r of shown) {
      const n = shown.length <= 4 && r.fish.rare < 4 && !r.nushi ? (r.count >= 8 ? 3 : r.count >= 3 ? 2 : 1) : 1;
      for (let k = 0; k < n && total < cap; k++, total++) fishes.push(makeFish(r, k, arrivals.has(r.fish.id) && k === 0));
    }
    empty.hidden = all.length > 0;
    if (!all.length) $(empty, 'span').textContent = 'まだ だれも いないよ。\nつりを すると、ここで およぐよ。';
    list.replaceChildren(...all.map(r => { const li = document.createElement('li'); li.textContent = r.fish.name + '、さいだい ' + r.best.toFixed(1) + 'センチ、' + r.count + 'ひき'; return li; }));
    return all.length;
  }
  function rotate() {
    clearTimeout(rotateTimer);
    if (!isOpen()) return;
    rotateTimer = setTimeout(rotate, 38000 + Math.random() * 14000);
    const all = residents(), shownIds = new Set(fishes.map(o => o.f.id)), others = all.filter(r => !shownIds.has(r.fish.id));
    if (!others.length || deco) return;
    const old = fishes.filter(o => !o.leaving && performance.now() - o.at > 30000);
    if (!old.length) return;
    const out = pick(old), incoming = pick(others);
    out.leaving = true; out.hold = 0;
    if (!reduced()) out.el.animate([{ opacity: out.el.dataset.layer === '0' ? .82 : 1 }, { opacity: 0 }], { duration: 1200, fill: 'forwards' });
    setTimeout(() => { out.el.remove(); const i = fishes.indexOf(out); if (i >= 0) fishes.splice(i, 1); }, 1250);
    fishes.push(makeFish(incoming, 0, false, Math.random() < .5 ? -1 : 1));
  }

  // ─── かざり：置く・もどす ───
  function renderPlaced() {
    placedBox.replaceChildren();
    tank.placed.forEach((p, i) => {
      const d = DECOR[p.n] || DECOR['きれいな いし'], size = 34 * unit, el = document.createElement('div');
      el.className = 'tk-deco' + (d.sway ? ' tk-sway' : '') + (d.twinkle ? ' tk-twinkle tk-float' : '');
      el.style.cssText = `left:${(p.x * 100).toFixed(2)}%;top:${(p.y * 100).toFixed(2)}%;width:${size}px;height:${size}px;margin:${(-size / 2).toFixed(1)}px 0 0 ${(-size / 2).toFixed(1)}px`;
      el.innerHTML = decorMarkup(p.n, size); el.dataset.i = String(i); el.title = p.n;
      placedBox.append(el);
    });
    applyCombos(0);
  }
  function renderTray() {
    const have = Object.keys(DECOR).filter(n => (Number(owned()[n]) || 0) > 0);
    $(tray, 'p').textContent = have.length ? 'かざりを えらんで、すいそうを タップ。おいた かざりを タップすると、もどせるよ。' : 'まだ かざりは ないよ。さかなが ときどき もって くるよ。';
    items.replaceChildren(...have.map(n => {
      const b = document.createElement('button'), left = available(n);
      b.type = 'button'; b.disabled = left === 0 && selected !== n; b.setAttribute('aria-pressed', String(selected === n));
      b.innerHTML = decorMarkup(n, 30) + '<span></span>'; $(b, 'span').textContent = n + ' ×' + left;
      b.addEventListener('click', e => {
        if (e.detail === 0) { if (left > 0) placeDecor(n, .18 + Math.random() * .64, (DECOR[n].kind === 'float' ? .25 + Math.random() * .4 : .86 + Math.random() * .06)); return; } // キーボードは、その場にぽんと置く
        selected = selected === n ? '' : n; renderTray();
      });
      return b;
    }));
    // おいてある かざり（キーボード・よみあげでも、ひとつずつ もどせる）
    placedList.replaceChildren(...tank.placed.map((p, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tk-back'; b.innerHTML = decorMarkup(p.n, 22) + '<span></span>'; $(b, 'span').textContent = p.n + ' を もどす';
      b.addEventListener('click', () => removeDecor(i));
      return b;
    }));
    $(tray, '.tk-clear').disabled = tank.placed.length === 0;
  }
  function removeDecor(i) {
    const p = tank.placed[i]; if (!p) return;
    tank.placed.splice(i, 1); saveTank(); renderPlaced(); applyCombos(1); renderTray();
    cuePon(p.x * W, true); sr.textContent = p.n + ' を もどしたよ。';
  }
  function placeDecor(name, x, y) {
    if (available(name) <= 0) return;
    const d = DECOR[name];
    const py = d.kind === 'float' ? clamp(y, .12, .8) : clamp(Math.max(y, .8), .8, .94);   // 砂の上のものは、砂の高さに落ち着く
    tank.placed.push({ n: name, x: +clamp(x, .05, .95).toFixed(3), y: +py.toFixed(3) }); saveTank(); renderPlaced();
    if (available(name) === 0) selected = '';
    renderTray(); say(pick(SAY.deco), true); mood('smile', 2200); heart(x * W, py * H - 14);
    cuePon(x * W); sr.textContent = name + ' を おいたよ。'; applyCombos(1);
  }
  function setDeco(on) {
    deco = on; selected = on ? selected : ''; tray.hidden = !on; decoBtn.setAttribute('aria-pressed', String(on)); decoBtn.textContent = on ? 'かざりを おわる' : 'かざる';
    water.classList.toggle('tk-decorating', on); tip.hidden = true;
    if (on) renderTray();
    resetZen();
  }

  // ─── しゃしん：部屋ぜんたいを 1枚の絵に。ほぞん／ひとに みせる ───
  const svgCache = new Map();   // おなじ 絵は 覚えておく（動画の 材料づくりで 1コマごとに 読み直さない。多すぎたら 空に する）
  const svgImage = svg => { const hit = svgCache.get(svg); if (hit) return Promise.resolve(hit); return new Promise((res, rej) => { const im = new Image(); im.onload = () => { if (svgCache.size > 60) svgCache.clear(); svgCache.set(svg, im); res(im); }; im.onerror = rej; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); };
  // 絵が もう よみこまれて いる／もう しっぱい して いる時は、すぐ こたえる（しっぱいした絵を いつまでも またない）
  const imgReady = el => new Promise(res => { if (!el) res(null); else if (el.complete) res(el.naturalWidth ? el : null); else { el.addEventListener('load', () => res(el), { once: true }); el.addEventListener('error', () => res(null), { once: true }); } });
  async function snapshot(o = {}) {   // o: { video, dataURL, type, quality }。ふだんの しゃしんは 引数なし（PNG）。動画の 材料づくりでは あわも 描いて すぐ 文字（data URL）で 返す
    const K = 3, cvs = document.createElement('canvas'); cvs.width = ROOM.w * K; cvs.height = ROOM.h * K;
    const ctx = cvs.getContext('2d'); ctx.scale(K, K);
    const t = ROOM.tank, rp = palette();
    ctx.drawImage(await svgImage(roomSvg()), 0, 0, ROOM.w, ROOM.h);
    if (rp.night || rp.dusk) { ctx.save(); ctx.globalAlpha = rp.night ? (starry ? .6 : .5) : .12; ctx.fillStyle = rp.night ? '#0c2048' : '#ff8a3c'; ctx.fillRect(0, 0, ROOM.w, ROOM.h); ctx.restore(); }
    if (starry) { ctx.save(); STARS.forEach((st, i) => { ctx.globalAlpha = .55 + (i % 3) * .15; ctx.fillStyle = st.c; ctx.fill(new Path2D(starPath(st.x, st.y, st.s))); }); ctx.restore(); }
    if (!riceGone) ctx.drawImage(await svgImage(riceSvg()), RICE.x, RICE.y, RICE.w, RICE.h);
    for (const el of [...friendsEls.filter(e => e.dataset.who === 'a'), mascot, ...friendsEls.filter(e => e.dataset.who === 'b')]) {
      const img = await imgReady(el); if (!img) continue;
      const fi = el.dataset.who === 'a' ? 0 : 1, isM = el === mascot, w = isM ? ROOM.mascot.w : ROOM.friend.w, h = isM ? ROOM.mascot.h : ROOM.friend.w, cx = isM ? ROOM.mascot.cx : ROOM.friendX[fi], foot = isM ? ROOM.mascot.foot : ROOM.friend.foot[fi];
      ctx.save(); if (rp.night && 'filter' in ctx) ctx.filter = 'brightness(.88) saturate(.95)';
      ctx.drawImage(img, cx - w / 2, foot - h, w, h); ctx.restore();
    }
    ctx.drawImage(await svgImage(lampSvg(starry)), 0, 0, ROOM.w, ROOM.h);
    // 水槽のなか（角を丸く切りぬく）
    ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(t.x, t.y, t.w, t.h, 14) : ctx.rect(t.x, t.y, t.w, t.h); ctx.clip();
    const g = ctx.createLinearGradient(0, t.y, 0, t.y + t.h); g.addColorStop(0, rp.a); g.addColorStop(1, rp.b); ctx.fillStyle = g; ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.drawImage(await svgImage(tankBaseSvg(rp, false)), t.x, t.y, t.w, t.h);
    const kx = t.w / W, ky = t.h / H;
    for (const p of tank.placed) {
      const size = 34 * unit * kx, dx = t.x + p.x * t.w - size / 2, dy = t.y + p.y * t.h - size / 2; ctx.drawImage(await svgImage(decorMarkup(p.n, 120)), dx, dy, size, size);
      if (rp.night && p.n === 'ちいさな びん' && comboOn.bottle) { ctx.save(); ctx.font = `${Math.round(size * .34)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff2a8'; ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 14; ctx.fillText('✦', dx + size * .42, dy + size * .42); ctx.restore(); }
      if (rp.night && p.n === 'ながれぎ' && comboOn.forest) { ctx.save(); ctx.font = `${Math.round(size * .34)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐟', dx + size * .78, dy + size * .3); ctx.restore(); }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const o of fishes.slice().sort((a, b) => a.layer - b.layer)) {
      const size = o.size * kx, cx = t.x + o.x * kx, cy = t.y + o.y * ky, flip = (o.art || LEFT_FACING.has(o.f.icon)) ? (o.face > 0 ? -1 : 1) : 1;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(flip, 1); ctx.globalAlpha = o.layer === 0 ? .82 : 1; if (o.f.legend) { ctx.shadowColor = '#fff2a8'; ctx.shadowBlur = 30; }
      const art = window.TsuriArt && window.TsuriArt[o.f.id];
      if (art) { const im = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = art; }); if (im) ctx.drawImage(im, -size / 2, -size / 2, size, size); }
      else { ctx.font = `${Math.round(size * .9)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; ctx.fillText(o.f.icon, 0, 0); }
      ctx.restore();
    }
    if (o.video) {   // あわ（CSS の アニメ）も 描く
      const wr = water.getBoundingClientRect();
      for (const b of water.querySelectorAll('.tk-bub')) {
        const r = b.getBoundingClientRect(), op = parseFloat(getComputedStyle(b).opacity); if (!(op > .02) || r.width < 1) continue;
        const bx = t.x + (r.left + r.width / 2 - wr.left) * kx, by = t.y + (r.top + r.height / 2 - wr.top) * ky, br = r.width / 2 * kx;
        ctx.save(); ctx.globalAlpha = Math.min(1, op) * .85; const bg = ctx.createRadialGradient(bx - br * .35, by - br * .35, br * .05, bx, by, br);
        bg.addColorStop(0, '#ffffff'); bg.addColorStop(.5, '#ffffffb0'); bg.addColorStop(1, '#ffffff40'); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = .8; ctx.strokeStyle = '#ffffff99'; ctx.stroke(); ctx.restore();
      }
    }
    const glass = ctx.createLinearGradient(0, t.y, 0, t.y + t.h * .16); glass.addColorStop(0, '#ffffff59'); glass.addColorStop(1, '#ffffff00'); ctx.fillStyle = glass; ctx.fillRect(t.x, t.y, t.w, t.h * .16);
    ctx.restore();
    ctx.drawImage(await svgImage(frameSvg()), 0, 0, ROOM.w, ROOM.h);
    // ひづけ（名前は入れない）
    const d = new Date(), stamp = d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate();
    ctx.font = '700 11px system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#7a6a55'; ctx.fillText(stamp, ROOM.w - 10, ROOM.h - 10);
    // 記念の ふだ：ゲームの なまえ・つれた かず・シールちょう（作者の なまえと URL は いれない）
    const sv = readSave(), total = Number(sv.total) || 0, baseN = fishList().filter(f => !f.legend).length, gotN = residents().filter(r => !r.fish.legend).length;
    ctx.save(); ctx.fillStyle = '#fffdf6ee'; ctx.strokeStyle = '#e3d3b0'; ctx.lineWidth = 2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(10, ROOM.h - 68, 190, 56, 14); else ctx.rect(10, ROOM.h - 68, 190, 56); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#7a4b34'; ctx.font = '800 14px system-ui,sans-serif'; ctx.fillText('まるふわ つりびより', 22, ROOM.h - 47);
    ctx.fillStyle = '#506874'; ctx.font = '700 11.5px system-ui,sans-serif'; ctx.fillText('つれた かず ' + total + '　シールちょう ' + gotN + ' / ' + baseN, 22, ROOM.h - 27); ctx.restore();
    if (o.dataURL) return cvs.toDataURL(o.type || 'image/png', o.quality);   // 裏の 画面でも すぐ 返る（toBlob は 1びょうに 1回に なる）
    return new Promise(res => cvs.toBlob(b => res(b), 'image/png'));
  }
  async function takePhoto() {
    const btn = $(dlg, '.tk-cam'); btn.disabled = true; cueShutter();
    try {
      const blob = await snapshot(); if (!blob) throw new Error('no blob');
      const url = URL.createObjectURL(blob), img = $(photo, 'img');
      if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
      img.src = url; img.dataset.url = url; $(photo, 'a').href = url;
      $(photo, 'p').textContent = 'しゃしんが とれたよ。「ほぞん」を おすか、がぞうを ながおしで ほぞんできるよ。';
      const file = new File([blob], 'marufuwa-osuisou.png', { type: 'image/png' }), share = $(photo, '.tk-share');
      share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      share.onclick = () => navigator.share({ files: [file], title: 'まるふわの おへや' }).catch(() => {});
      photo.hidden = false; $(photo, '.tk-photoclose').focus(); sr.textContent = 'しゃしんが とれました。';
    } catch { say('ごめんね、しゃしんが うまく とれなかったよ。', true); } finally { btn.disabled = false; }
  }
  $(photo, '.tk-photoclose').addEventListener('click', () => { photo.hidden = true; $(dlg, '.tk-cam').focus(); });

  // ─── ひみつ（へやの なか）：ランプ・おにぎり・うとうと・かざりの くみあわせ・ごはんの おれい・すいそうの うた ───
  //   ごほうびは 見た目・音・ことば だけ（釣れる 魚は かえない）。見つけても 見のがしても 何も へらない。
  //   どれも「さわる」「まつ」だけで おこり、音（おと ON の時）と 読み上げ（sr）でも しらせる。見つけた ものは ひみつ専用の 鍵に 書く。
  const HM_KEY = 'marufuwa-himitsu-v1';
  function markFound(id, extra) {   // 読んで・足して・すぐ書く（ほかの ページが 書いた 物を 消さない）
    let d = {};
    try { d = JSON.parse(localStorage.getItem(HM_KEY)) || {}; } catch {}
    if (!d || typeof d !== 'object') d = {};
    if (!d.found || typeof d.found !== 'object') d.found = {};
    if (!d.found[id]) d.found[id] = { at: Date.now(), time: scene.dataset.time || '', ...extra };
    d.v = 1;
    try { localStorage.setItem(HM_KEY, JSON.stringify(d)); } catch {}
  }
  let starry = false, riceTaps = 0, riceGone = false, napping = false, napTimer = 0, napBreath = 0, thanksTimer = 0, utaTimer = 0, comboOn = { bottle: false, forest: false };
  const STARS = (() => { const r = mulberry(4242), out = []; for (let i = 0; i < 46; i++) out.push({ x: 6 + r() * 348, y: 4 + r() * 600, s: 2.2 + r() * 4.2, c: r() < .68 ? '#fff2a8' : '#d5ecff', d: -r() * 6, p: 3.4 + r() * 3.6 }); return out; })();
  const starPath = (x, y, s) => `M${x} ${y - s} L${x + s * .28} ${y - s * .28} L${x + s} ${y} L${x + s * .28} ${y + s * .28} L${x} ${y + s} L${x - s * .28} ${y + s * .28} L${x - s} ${y} L${x - s * .28} ${y - s * .28}Z`;
  starwall.innerHTML = `<svg viewBox="0 0 360 640" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%" aria-hidden="true">${STARS.map(st => `<path class="tk-st" d="${starPath(st.x, st.y, st.s)}" fill="${st.c}" style="animation-delay:${st.d.toFixed(2)}s;animation-duration:${st.p.toFixed(2)}s"/>`).join('')}</svg>`;
  rice.innerHTML = riceSvg();
  const cueClick = () => { noise(.03, { vol: .05 }); tone(1320, .04, { type: 'square', vol: .03 }); };
  const cueLamp = on => {
    noise(.03, { vol: .06 });
    if (on) { tone(660, .08, { type: 'triangle', vol: .07 }); tone(880, .1, { type: 'triangle', vol: .07, at: .08 }); }
    else { tone(880, .1, { type: 'triangle', vol: .06, glide: .5 }); [2093, 2637, 3136, 2637, 3136, 3951].forEach((f, i) => tone(f, .09, { type: 'square', vol: .018, at: .22 + i * .12 })); }
  };
  const cueHappy = () => { tone(784, .12, { type: 'triangle', vol: .07 }); tone(988, .18, { type: 'triangle', vol: .07, at: .12 }); };
  const cueChime = () => [1568, 2093, 2637].forEach((f, i) => tone(f, .12, { type: 'triangle', vol: .05, at: i * .1 }));
  const cueMunchMany = () => { for (let i = 0; i < 3; i++) noise(.06, { at: .25 + i * .18, vol: .05 }); cueHappy(); };
  const cueBubbles = () => { [0, 1, 2].forEach(i => tone(560 + i * 110, .12, { type: 'triangle', vol: .06, at: i * .32, glide: 1.35 })); tone(1568, .2, { type: 'triangle', vol: .04, at: 1.1 }); };
  function applyStarry() { room.classList.toggle('tk-starry', starry); lampBtn.setAttribute('aria-pressed', String(starry)); bgmRefresh(); }
  // へや1：ランプを けすと ほしぞら（よるだけ）
  function toggleLamp() {
    if (room.dataset.time !== 'yoru') { say('ひるまは ランプが なくても あかるいね。', true); sr.textContent = 'ひるまは ランプが なくても あかるいね。'; cueClick(); return; }
    starry = !starry; applyStarry();
    if (starry) { markFound('heya-lamp'); mood('sparkle', 3600); say('わあ… ほしぞらみたい。', true); sr.textContent = 'ランプを けしたよ。かべが ほしぞらに なったよ。'; cueLamp(false); }
    else { say('ぽっと あかるく なったね。', true); sr.textContent = 'ランプを つけたよ。'; cueLamp(true); }
  }
  // へや3：ラグの おにぎりを 3かい さわると、なかまと はんぶんこ
  function tapRice() {
    if (riceGone) return;
    riceTaps++;
    if (riceTaps < 3) { say(riceTaps === 1 ? 'おにぎり、おいしそう。' : 'はんぶんこ、しよっか。', true); sr.textContent = 'おにぎりを さわったよ。'; cueMunch(RICE.x); return; }
    riceTaps = 0; riceGone = true; rice.classList.add('tk-gone'); markFound('heya-onigiri');
    sr.textContent = 'おにぎりを はんぶんこ したよ。'; mood('mint', 4200); say('はんぶんこ しよ', true);
    setTimeout(() => { if (isOpen()) say('おいしいね', true); }, 1500);
    cueMunchMany();
    if (!reduced()) friendsEls.forEach((el, i) => { el.animate([{ translate: '0 0', scale: '1 1' }, { translate: '0 -10px', scale: '.96 1.06' }, { translate: '0 0', scale: '1.05 .95' }, { translate: '0 -6px', scale: '.98 1.03' }, { translate: '0 0', scale: '1 1' }], { duration: 1500, delay: 250 + i * 200, easing: 'ease-out' }); });
    heart(RICE.x + 12, 0);
  }
  // へや4：3ぷん なにも しないと、まるふわが うとうと
  function resetNap() { clearTimeout(napTimer); if (isOpen()) napTimer = setTimeout(nap, 180000); }
  function nap() {
    if (!isOpen()) return;
    if (napping || deco || !tip.hidden || !photo.hidden) { resetNap(); return; }
    napping = true; room.classList.add('tk-nap'); markFound('heya-utouto');
    say('すや すや…', true); sr.textContent = 'まるふわが うとうと しはじめたよ。';
    clearInterval(napBreath); napBreath = setInterval(() => { if (sfx && isOpen()) tone(150, .9, { type: 'triangle', vol: .018, glide: .8 }); }, 4200);
  }
  function wake() {
    if (!napping) return;
    napping = false; room.classList.remove('tk-nap'); clearInterval(napBreath); napBreath = 0;
    say('…ねてないよ。', true); mood('smile', 2200);
  }
  // へや5：かざりの くみあわせ（ほしの びん／ちいさな もり）
  const hasDecor = n => tank.placed.some(pl => pl.n === n);
  const decorEl = n => [...placedBox.children].find(e => e.title === n);
  function applyCombos(mode) {   // mode 0＝えが かわった だけ／1＝かざりを おいた・もどした／2＝ひらいた ところ
    const cur = { bottle: hasDecor('ちいさな びん') && hasDecor('ほしの かけら'), forest: hasDecor('ながれぎ') && hasDecor('みずくさ') && hasDecor('きれいな いし') };
    const night = room.dataset.time === 'yoru', bottle = decorEl('ちいさな びん'), log = decorEl('ながれぎ');
    placedBox.classList.toggle('tk-night', night);
    if (bottle) { bottle.classList.toggle('tk-bottlestar', cur.bottle); if (cur.bottle && !bottle.querySelector('.tk-instar')) { const st = document.createElement('i'); st.className = 'tk-instar'; st.textContent = '✦'; bottle.append(st); } }
    if (log && cur.forest && !log.querySelector('.tk-restfish')) { const fi = document.createElement('i'); fi.className = 'tk-restfish'; fi.textContent = '🐟'; log.append(fi); }
    const say2 = (text, id) => { sr.textContent = mode === 2 ? (sr.textContent ? sr.textContent + ' ' : '') + text : text; if (mode === 1) { say(text, true); mood('sparkle', 2600); cueChime(); } if (night) markFound(id); };
    if (cur.bottle && (mode === 2 || !comboOn.bottle) && mode !== 0) say2(night ? 'ほしの びんが ひかって いるよ。' : 'ほしの びんが できたよ。よるに なると ひかるよ。', 'heya-bin');
    if (cur.forest && (mode === 2 || !comboOn.forest) && mode !== 0) say2(night ? 'ちいさな もりで、さかなが やすんで いるよ。' : 'ちいさな もりが できたよ。よるに なると さかなが やすみに くるよ。', 'heya-mori');
    if (mode !== 0) comboOn = cur;   // えが かわっただけの 時は、まえの じょうたいを のこす（おいた・もどした 時に くらべる）
  }
  // へや6：ごはんの あと 20びょう なにも しないと、さかなが おれいに あつまる
  function armThanks() { clearTimeout(thanksTimer); thanksTimer = setTimeout(thanks, 20000); }
  function thanks() {
    if (!isOpen() || deco) return;
    const list = fishes.filter(o => !o.leaving); if (!list.length) return;
    for (const o of list) { o.gather = now + 7000; o.hold = 0; o.until = 0; }
    markFound('heya-okaeshi'); mood('mint', 4200); say('ありがとう、って いってるみたい。', true); sr.textContent = 'さかなたちが、ありがとう って いってる みたい。';
    cueBubbles();
    if (reduced()) { heart(W * .5, H * .5); return; }
    const cx = W * .5, cy = H * .48, sc = Math.min(W * .34, H * .5) / 34, n = 16;
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2, hx = 16 * Math.pow(Math.sin(t), 3), hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)), sz = 7 + (i % 3) * 2;
      const b = document.createElement('span'); b.className = 'tk-bub tk-hb';
      b.style.cssText = `left:${(cx + hx * sc).toFixed(1)}px;top:${(cy + hy * sc).toFixed(1)}px;width:${sz}px;height:${sz}px;animation:none`;
      water.append(b);
      b.animate([{ opacity: 0, transform: 'translateY(26px) scale(.4)' }, { opacity: .95, transform: 'translateY(0) scale(1)', offset: .25 }, { opacity: .95, transform: 'translateY(-6px) scale(1)', offset: .7 }, { opacity: 0, transform: 'translateY(-30px) scale(.9)' }], { duration: 3600, delay: i * 110, easing: 'ease-out', fill: 'backwards' }).onfinish = () => b.remove();
      setTimeout(() => b.remove(), 3600 + i * 110 + 400);
    }
  }
  // へや8：みみで ながめる → 魚の おとの ひとまわりの あと 5びょう まつと、まるふわが うたを うたう
  function sing() {
    if (!isOpen() || !sfx || !listen) return;
    const list = fishes.filter(o => !o.leaving).slice().sort((a, b) => a.x - b.x).slice(0, 8);
    if (!list.length) return;
    const gap = .3;
    list.forEach((o, i) => { let f = fishFreq(o.f); if (f < 300) f *= 2; tone(f, .26, { type: 'triangle', vol: .08, pan: panOf(o.x), at: i * gap }); });
    const end = list.length * gap;
    [523, 659, 784].forEach((f, i) => tone(f, .5, { type: 'triangle', vol: .06, at: end + i * .02 }));
    mood('smile', end * 1000 + 1800); say('♪ ふん ふふん ♪', true); sr.textContent = 'まるふわが、すいそうの うたを うたったよ。'; markFound('heya-uta');
  }
  const interact = () => { clearTimeout(thanksTimer); clearTimeout(utaTimer); if (napping) wake(); resetNap(); };
  dlg.addEventListener('pointerdown', interact, true); dlg.addEventListener('keydown', interact, true);
  lampBtn.addEventListener('click', toggleLamp); rice.addEventListener('click', tapRice);
  function resetSecrets() {
    starry = false; applyStarry(); riceTaps = 0; riceGone = false; rice.classList.remove('tk-gone');
    if (napping) { napping = false; room.classList.remove('tk-nap'); }
    clearInterval(napBreath); napBreath = 0; clearTimeout(thanksTimer); clearTimeout(utaTimer); clearTimeout(napTimer);
    comboOn = { bottle: false, forest: false };
  }
  // ひみつノート（つりびよりの ページ）から「もういちど きく」ための、おとと ことば
  const REPLAY = {
    'heya-lamp': { text: 'ランプを けしたよ。かべが ほしぞらに なったよ。', play: () => cueLamp(false) },
    'heya-onigiri': { text: 'おにぎりを はんぶんこ したよ。', play: cueMunchMany },
    'heya-utouto': { text: 'まるふわが うとうと しはじめたよ。', play: () => tone(150, .9, { type: 'triangle', vol: .04, glide: .8 }) },
    'heya-bin': { text: 'ほしの びんが ひかって いるよ。', play: cueChime },
    'heya-mori': { text: 'ちいさな もりで、さかなが やすんで いるよ。', play: cueChime },
    'heya-okaeshi': { text: 'さかなたちが、ありがとう って いってる みたい。', play: cueBubbles },
    'heya-uta': { text: 'まるふわが、すいそうの うたを うたったよ。', play: () => [523, 659, 784, 659, 523, 784].forEach((f, i) => tone(f, .24, { type: 'triangle', vol: .07, at: i * .3 })) }
  };
  function replay(id) { const r = REPLAY[id]; if (!r) return null; refreshSound(); r.play(); return r.text; }
  function secret(id) {   // 検査・ノート用：ひみつを その場で おこす
    if (!isOpen()) return false;
    if (id === 'lamp') { toggleLamp(); return true; }
    if (id === 'rice') { riceTaps = 2; tapRice(); return true; }
    if (id === 'nap') { nap(); return napping; }
    if (id === 'thanks') { thanks(); return true; }
    if (id === 'uta') { sing(); return true; }
    return false;
  }

  // ─── 開く・閉じる ───
  function open() {
    if (dlg.open) return;
    tank = readTank();
    const arrivals = newArrivals();
    dlg.showModal(); resetSecrets();
    // となりに いる なかまが かわって いたら、へやの なかまも かえる（つりばを かえた あと）
    friendsEls.forEach(el => { const src2 = friendSrc(el.dataset.who === 'a' ? 'friend-a' : 'friend-b'); if (src2 && el.getAttribute('src') !== src2) el.setAttribute('src', src2); });
    layoutRoom(); paintWater(); layoutRoom();
    const total = populate(true); renderPlaced(); setDeco(false); photo.hidden = true;
    if (arrivals.length) {
      const first = arrivals[0].fish;
      const text = arrivals.length === 1 && arrivals[0].n === 1 ? first.name + 'が すいそうに ようこそ。' : 'あたらしい なかまが ' + arrivals.reduce((s, r) => s + r.n, 0) + 'ひき きたよ。';
      say(text, true); mood(first.rare >= 4 ? 'sparkle' : first.rare === 3 ? 'apricot' : 'mint', 3600); sr.textContent = text;
      const seen = { ...tank.seen }; for (const r of residents()) seen[r.fish.id] = r.count; tank.seen = seen; saveTank();
    } else say(total ? pick(SAY.any) : pick(SAY.empty), true);
    refreshBadge(); resetZen();
    setListen(false); refreshSound(); if (sfx) { cueOpen(); startAmbience(); }
    bgmOpen(); closeGifts(); renderShelf();
    clearTimeout(sayTimer); sayTimer = setTimeout(autoSay, 8000);
    clearTimeout(rotateTimer); rotateTimer = setTimeout(rotate, 40000);
    applyCombos(2); resetNap();
    start();
  }
  function close() { if (dlg.open) dlg.close(); bgmLeave(); closeGifts(); }   // 「とじた」の しらせ（close イベント）は あとから 来る。BGM は すぐ 止める
  dlg.addEventListener('close', () => { resetSecrets(); clearTimeout(sayTimer); clearTimeout(zenTimer); clearTimeout(moodTimer); clearTimeout(rotateTimer); clearTimeout(sayPending); cancelAnimationFrame(raf); raf = 0; tip.hidden = true; photo.hidden = true; setDeco(false); setListen(false); refreshBadge(); mascot.src = BASE + 'img/game-blue.webp'; stopAmbience(); bgmLeave(); closeGifts(); if (sfx) cueClose(); });
  $(dlg, '.tk-close').addEventListener('click', close);
  $(empty, 'button').addEventListener('click', close);
  $(dlg, '.tk-cam').addEventListener('click', takePhoto);
  openBtn.addEventListener('click', () => open());
  $(dlg, '.tk-feed').addEventListener('click', () => { if (deco) setDeco(false); drop(W * (.3 + Math.random() * .4), H * .1, 4); say(pick(SAY.feed), true); sr.textContent = 'ごはんを あげたよ。さかなが あつまって くるよ。'; armThanks(); });
  decoBtn.addEventListener('click', () => setDeco(!deco));
  sndBtn.addEventListener('click', () => toggleSound());
  earBtn.addEventListener('click', () => {
    if (listen) { setListen(false); sr.textContent = 'みみで ながめるを おわりました。'; say('ふつうの ながめかたに もどったよ。', true); return; }
    if (!sfx) toggleSound(true);
    setListen(true); tour();
    sr.textContent += ' Tab キーで さかなを えらぶと、なまえの おとが 鳴ります。Enter で くわしく しらべます。';
    if (window.TsuriBgm && window.TsuriBgm.on()) sr.textContent += ' BGMは、みみで ながめる あいだ おやすみします。';
  });
  $(dlg, '.tk-done').addEventListener('click', () => setDeco(false));
  $(dlg, '.tk-clear').addEventListener('click', () => { tank.placed = []; saveTank(); renderPlaced(); renderTray(); say('ぜんぶ もどしたよ。また かざろうね。', true); });
  water.addEventListener('pointerdown', e => {
    const r = water.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (deco) {
      const decoEl = e.target.closest && e.target.closest('.tk-deco');
      if (decoEl) { removeDecor(Number(decoEl.dataset.i)); return; }   // おいた かざりを タップ＝もどす
      if (selected) placeDecor(selected, x / W, y / H);
      return;
    }
    const fishEl = e.target.closest && e.target.closest('.tk-fish');
    if (fishEl) { const o = fishes.find(f => f.el === fishEl); if (o) touchFish(o); return; }
    if (e.target.closest && e.target.closest('.tk-empty button')) return;
    drop(x, y, 3);
  });
  dlg.addEventListener('pointermove', resetZen); dlg.addEventListener('keydown', resetZen);
  addEventListener('resize', () => { if (isOpen()) { layoutRoom(); for (const o of fishes) { o.x = clamp(o.x, o.size * .5, W - o.size * .5); o.y = clamp(o.y, o.size * .5, floorY); } renderPlaced(); } });
  new MutationObserver(refreshBadge).observe(scene, { attributes: true, attributeFilter: ['data-phase'] });
  addEventListener('storage', () => { refreshBadge(); refreshSound(); }); addEventListener('pageshow', () => { refreshBadge(); refreshSound(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopAmbience(); if (actx && actx.state === 'running') actx.suspend().catch(() => {}); } else if (isOpen() && sfx) { startAmbience(); } });
  refreshBadge(); refreshSound();

  window.TsuriTank = { frame: o => snapshot(Object.assign({ video: true, dataURL: true, type: 'image/jpeg', quality: .9 }, o)), open, close, isOpen, residents: () => residents().map(r => ({ id: r.fish.id, count: r.count, best: r.best, nushi: r.nushi })), placed: () => tank.placed.map(p => ({ ...p })), gifts: () => giftsNow(), giftTables: () => ({ pals: [...PAL_NAME], words: [...GIFT_WORD] }), sound: () => sfx, listening: () => listen, secret, replay, state: () => ({ starry, riceGone, napping, combos: { ...comboOn } }), version: 4 };
})();
