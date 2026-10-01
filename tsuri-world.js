/* まるふわ つりびより：せかいの まど（tsuri-world.js）（ジョブズ2・2026-10-01・ジョブズ1 の OK）
   つりば・ひろば・おへや・おみせを「ひとつの せかい」として よむ ための、読みとり専用の 窓口。
   ・ほぞんは かかない（localStorage は よむだけ）／通信しない／画面を かきかえない（go() は 今ある ボタンを おす か、ページを うつす だけ）
   ・時間・雨・きせつ・レベル・釣り場の ひょうを ここに 1か所。本体・ひろばの 写し（計4か所）は 門（world_check_j2.mjs）で「同じ 値か」を 毎回 測る
   ・どの ページでも 読める（つりば・ひろば・おうちの かたへ）。script タグは 本体・ひろばに 1行（defer）。sw.js の 先どりは 総司令部。
   つかいかた：TsuriWorld.context()／places()／route(id)／go(id)／timeOf()／rainOf()／seasonOf()／moon(date?)＝本物の 月齢／levelOf(xp) */
(function () {
  'use strict';
  if (window.TsuriWorld) return;
  const KEY = 'marufuwa-tsuri-v1';
  const Q = () => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } };
  const EN = () => !!(window.TsuriEn && window.TsuriEn.lang === 'en');
  const T = (ja, en) => EN() ? en : ja;
  const save = () => { try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); return d && typeof d === 'object' && !Array.isArray(d) ? d : {}; } catch (e) { return {}; } };
  const num = (x, d) => Number.isFinite(x) ? x : d;
  // この ファイルの 場所＝ゲームの ルート（ひろば・おうちの かたへ からも 同じ ルートが わかる）
  const BASE = (() => {
    try { const s = document.currentScript || document.querySelector('script[src*="tsuri-world.js"]'); if (s && s.src) return new URL('.', s.src).href; } catch (e) {}
    try { return new URL(location.pathname.replace(/index\.html$/, '').replace(/(hiroba|anshin)\/$/, ''), location.href).href; } catch (e) { return ''; }
  })();
  const page = () => /\/hiroba\/(index\.html)?$/.test(location.pathname) ? 'hiroba' : /\/anshin\/(index\.html)?$/.test(location.pathname) ? 'anshin' : 'tsuri';

  // ---- 時間・雨・きせつ（本体・ひろばと おなじ 決めかた） ----
  const TIMES = {a: 'asa', h: 'hiru', y: 'yuu', n: 'yoru'};
  const TIME_LABEL = {a: ['あさ', 'Morning'], h: ['ひる', 'Day'], y: ['ゆうがた', 'Evening'], n: ['よる', 'Night']};
  const dayNumber = d => d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  function timeOf(date) {
    const asked = Q().get('time'), forced = {asa: 'a', hiru: 'h', yuu: 'y', yoru: 'n'}[asked] || asked;
    if (forced && TIMES[forced]) return forced;
    const s = save(); if (TIMES[s.time]) return s.time;   // じぶんで えらんだ じかん
    const h = (date instanceof Date && !isNaN(date) ? date : new Date()).getHours();
    return h >= 5 && h < 10 ? 'a' : h >= 10 && h < 16 ? 'h' : h >= 16 && h < 19 ? 'y' : 'n';
  }
  function rainOf(date) {
    const q = Q(); if (q.has('rain')) return q.get('rain') === '1';
    return dayNumber(date instanceof Date && !isNaN(date) ? date : new Date()) * 7 % 4 === 0;
  }
  const SEASONS = ['haru', 'natsu', 'aki', 'fuyu'];
  function seasonOf(date) {
    const q = Q(), asked = q.get('season') || q.get('kisetsu'); if (SEASONS.includes(asked)) return asked;
    const m = (date instanceof Date && !isNaN(date) ? date : new Date()).getMonth() + 1;
    return m >= 3 && m <= 5 ? 'haru' : m >= 6 && m <= 8 ? 'natsu' : m >= 9 && m <= 11 ? 'aki' : 'fuyu';
  }
  // ---- 月（本物の 月齢）：日付の 計算だけ。位置情報も 通信も つかわない。ずれは ±半日くらい＝ゲームの 夜空の 月の 形には じゅうぶん ----
  const SYNODIC = 29.530588853, NEW_MOON_JD = 2451550.1;   // 2000-01-06 14:24 UTC ごろの 平均の 新月（実際の 新月は 18:14）から 数える
  const MOONS = [['shingetsu', 'しんげつ', 'New Moon'], ['mikazuki', 'みかづき', 'Crescent Moon'], ['hantsuki', 'はんつき', 'Half Moon'], ['mangetsu', 'まんげつ', 'Full Moon']];
  const MOON_SHAPES = ['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent'];
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  function moon(date) {   // phase：0＝しんげつ・.25＝上弦・.5＝まんげつ・.75＝下弦。lit：日本（北半球）で 光って 見える がわ。?moon=0〜1 は 手元の 検査用（localhost だけ）
    const asked = LOCAL ? Q().get('moon') : null; let phase;
    if (asked !== null && asked !== '' && Number.isFinite(Number(asked)) && Number(asked) >= 0 && Number(asked) <= 1) phase = Number(asked) % 1;
    else {
      const d = date instanceof Date ? date.getTime() : typeof date === 'number' ? date : NaN, t = Number.isFinite(d) ? d : Date.now();
      const age = (((t / 86400000 + 2440587.5 - NEW_MOON_JD) % SYNODIC) + SYNODIC) % SYNODIC; phase = age / SYNODIC;
    }
    const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2, waxing = phase < .5;
    const i = illum < .08 ? 0 : illum < .4 ? 1 : illum < .88 ? 2 : 3, m = MOONS[i];   // しんげつ(±2.7日)・みかづき・はんつき・まんげつ(±3.4日)
    return {phase, age: phase * SYNODIC, illum, waxing, lit: i === 0 ? 'none' : waxing ? 'right' : 'left', shape: MOON_SHAPES[Math.floor(((phase + 1 / 16) % 1) * 8)], key: m[0], name: m[1], en: m[2], label: T(m[1], m[2])};
  }
  const levelOf = xp => Math.max(1, Math.floor(Math.sqrt(1 + Math.max(0, num(Number(xp), 0)) / 20)));

  // ---- つりばの ひょう（本体の AREAS と おなじ。「かならず 通る 順」＝みずうみ→かわ→みなとまち→ふねの うえ） ----
  const AREAS = [
    {id: 'L', name: 'みずうみ', en: 'Lake', need: 0}, {id: 'R', name: 'かわ', en: 'River', need: 5},
    {id: 'H', name: 'みなとまち', en: 'Harbor Town', need: 15}, {id: 'B', name: 'ふねの うえ', en: 'On the Boat', need: 30},
    {id: 'M', name: 'もりの いけ', en: 'Forest Pond', need: 45, late: true}, {id: 'S', name: 'ゆきの みずうみ', en: 'Snowy Lake', need: 65, late: true}   // 30ひき（ふねの うえ）に ついた ひとだけ ならぶ
  ];
  const areaOk = (a, total) => total >= a.need;

  function avatar(s) {
    const O = window.TsuriOwn;
    if (s.avatar === 'own' && O && typeof O.valid === 'function' && O.valid(s.own)) return {kind: 'own', id: 'own', label: O.label(s.own), own: {c: s.own.c, a: s.own.a, ear: s.own.ear, item: s.own.item}};
    if (typeof s.avatar === 'string' && /^[a-z0-9_-]{1,24}$/i.test(s.avatar) && s.avatar !== 'own') return {kind: 'pal', id: s.avatar, label: ''};
    return {kind: 'marufuwa', id: '', label: T('まるふわ', 'Marufuwa')};
  }
  function context(date) {
    const s = save(), total = Math.max(0, Math.floor(num(s.total, 0))), xp = Math.max(0, Math.floor(num(s.xp, 0)));
    const area = AREAS.find(a => a.id === s.area && areaOk(a, total)) || AREAS[0], t = timeOf(date);
    return {
      version: 1, page: page(), lang: EN() ? 'en' : 'ja',
      time: t, timeName: TIMES[t], timeLabel: T(TIME_LABEL[t][0], TIME_LABEL[t][1]), rain: rainOf(date), season: seasonOf(date), moon: moon(date),
      area: area.id, areaName: T(area.name, area.en), total, xp, level: levelOf(xp),
      avatar: avatar(s), party: Array.isArray(s.party) ? s.party.filter(x => typeof x === 'string' && /^[a-z0-9_-]{1,24}$/i.test(x)).slice(0, 3) : []
    };
  }

  // ---- 場所の 一覧（おなじ ひょうを つりば・ひろばの 両方が つかえる） ----
  // kind：area（つりば）／page（ページ）／dialog（窓）。open＝いま いける／left＝あと なんびき（数字は 出さなくて よい）／here＝いま いる ところ
  function places() {
    const s = save(), total = Math.max(0, Math.floor(num(s.total, 0))), here = page(), tank = !!(window.TsuriTank && typeof window.TsuriTank.open === 'function' && (window.TsuriTank.version || 0) >= 3);
    const c = context();
    const list = AREAS.filter(a => !a.late || total >= 30).map(a => ({id: a.id, kind: 'area', name: T(a.name, a.en), ja: a.name, need: a.need, open: areaOk(a, total), left: Math.max(0, a.need - total), here: here === 'tsuri' && c.area === a.id}));
    list.push({id: 'hiroba', kind: 'page', name: T('ひろば', 'Plaza'), ja: 'ひろば', need: 0, open: true, left: 0, here: here === 'hiroba'});
    list.push({id: 'heya', kind: 'dialog', name: T('まるふわの おへや', "Marufuwa's room"), ja: 'まるふわの おへや', need: 0, open: tank, left: 0, here: false});
    list.push({id: 'shop', kind: 'dialog', name: T('おみせ', 'Shop'), ja: 'おみせ', need: 0, open: here === 'tsuri' && !!document.getElementById('keeper'), left: 0, here: false});
    return list;
  }

  // ---- いく（route＝何を するかを 返すだけ／go＝ほんとうに する） ----
  function route(id) {
    const s = save(), total = Math.max(0, Math.floor(num(s.total, 0))), here = page(), a = AREAS.find(x => x.id === id);
    if (a) {
      if (!areaOk(a, total)) return {ok: false, why: 'locked', left: a.need - total};
      if (here === 'tsuri') { const b = document.querySelector('#areas [data-k="' + a.id + '"]'); return b ? {ok: true, type: 'click', el: b} : {ok: false, why: 'no-button'}; }
      return {ok: true, type: 'page', url: BASE};   // ひろば・おうちの かたへ から：つりばへ もどる（つりばの えらびは つりばで）
    }
    if (id === 'tsuri') return here === 'tsuri' ? {ok: false, why: 'here'} : {ok: true, type: 'page', url: BASE};
    if (id === 'hiroba') return here === 'hiroba' ? {ok: false, why: 'here'} : {ok: true, type: 'page', url: BASE + 'hiroba/'};
    if (id === 'heya') return window.TsuriTank && typeof window.TsuriTank.open === 'function' && (window.TsuriTank.version || 0) >= 3 ? {ok: true, type: 'call'} : {ok: false, why: 'no-tank'};
    if (id === 'shop') { const b = here === 'tsuri' ? document.getElementById('keeper') : null; return b ? {ok: true, type: 'click', el: b} : {ok: false, why: 'no-shop'}; }
    return {ok: false, why: 'unknown'};
  }
  function go(id) {
    const r = route(id); if (!r.ok) return false;
    try {
      if (r.type === 'page') { location.assign(r.url); return true; }
      if (r.type === 'click') { r.el.click(); return true; }
      if (r.type === 'call') { window.TsuriTank.open(); return true; }
    } catch (e) {}
    return false;
  }

  window.TsuriWorld = Object.freeze({VERSION: 1, BASE, AREAS: AREAS.map(a => ({...a})), timeOf, rainOf, seasonOf, moon, levelOf, context, places, route, go});
})();
