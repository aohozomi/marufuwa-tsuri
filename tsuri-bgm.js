/* まるふわ つりびより：BGM（しずかな 曲。外付け・ゲーム開発司令部）
   ・曲は ファイルでは なく、ブラウザの 中で 音を つくる（角ばった 波・三角の 波。メロディは ドレミソラだけ／和音は ハ長調の 白い 鍵ばんだけ）。ダウンロードも 通信も ない。
   ・3曲：a＝ひろば（あさの さんぽ）／b＝すいそう（ぽこぽこ）／c＝ほしぞら（よるの へや）。マスターが 耳で えらんだ 試作 3案と おなじ 音符。
   ・鳴る 条件：その ばしょの「おと」が ON かつ「BGM」が ON（はじめは OFF）。釣りの 画面では 鳴らさない（ひろば・おへや・ながめる だけ）。
     「おと」の せっていは そのまま 親スイッチ（おとを けせば BGMも きえる）。「うごきを へらす」では 止めない（おとは 動きとは べつの せってい）。
     画面が かくれた 時は 止める。「みみで ながめる」の 間は 鳴らさない（魚の なまえの おとを じゃましない）。
   ・ばしょが かわる と、ふわっと つなぐ（3びょうの クロスフェード）。
   ・記録は localStorage['marufuwa-bgm-v1'] = {v:1, on:boolean} だけ。本体の「おと」は 読むだけ（書かない）。
   ・AudioContext は、その ばしょが もっている ものを かりる（ctx を わたす）。かりる ものが 無ければ 自分で 作る。
     「おと」が OFF か「BGM」が OFF の 間は、AudioContext を 作らない・かりない。ゆびで さわる まえにも 作らない。
   ・使い方（ばしょ ＝ 'hiroba' | 'tank' | 'gaze'）：
       TsuriBgm.enter('hiroba', { ctx: () => AudioContext, sound: () => boolean, time: () => 'a|h|y|n', starry: () => boolean, mute: () => boolean })
       TsuriBgm.leave('hiroba')
       TsuriBgm.button({ id, className, sound, enableSound, onToggle })  → 「BGM：ON/OFF」ボタン（かってに 状態を そろえる）
       TsuriBgm.set(true|false) / .on() / .refresh() / .subscribe(fn) / .state()                                         */
(() => {
  'use strict';
  if (window.TsuriBgm) return;
  const KEY = 'marufuwa-bgm-v1', MAIN = 'marufuwa-tsuri-v1';
  // 大きさ：3曲とも「K重みの LUFS」で −32 に そろえた（デモの mp3 は −20。ゲームでは 12 デシベル 小さく 鳴らす）。
  //   測った 生の 値（VOLUME・TRIM ともに 1 の とき）：a −29.7／b −28.5／c −27.3。ここから かけ算で 出した。耳で 見る 時だけ ?bgmvol=0.5〜2 で 動かせる。
  const VOLUME = .65, TRIM = { a: 1.19, b: 1.03, c: .89 };
  const boost = (() => { try { const v = Number(new URLSearchParams(location.search).get('bgmvol')); return v > 0 ? Math.min(2, v) : 1; } catch { return 1; } })();
  const readJSON = k => { try { const d = JSON.parse(localStorage.getItem(k)); return d && typeof d === 'object' ? d : null; } catch { return null; } };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const val = v => typeof v === 'function' ? v() : v;
  const N = { A4: 69, C5: 72, D5: 74, E5: 76, G5: 79, A5: 81 };

  // ── 曲：1周ぶんの 音の 一覧 [はじまり(びょう), ながさ(びょう), 音（ミディ）, 音色] と、1周の ながさ ──
  function trackA() {   // ひろば（あさの さんぽ）84。オルゴールの ような メロディ＋やさしい ベース＋さらさらの アルペジオ
    const ev = [], beat = 60 / 84, bar = beat * 4, add = (t, d, m, o) => ev.push([t, d, m, o]);
    const chords = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'Am', 'G', 'C'];
    const tri = { C: [60, 64, 67], Am: [57, 60, 64], F: [60, 65, 69], G: [59, 62, 67] }, root = { C: 48, Am: 45, F: 41, G: 43 };
    const mel = [
      [0, 0, N.E5, 1], [0, 1, N.G5, 1], [0, 2, N.E5, 1], [0, 3, N.D5, 1], [1, 0, N.C5, 2], [1, 2, N.D5, 1], [1, 3, N.E5, 1],
      [2, 0, N.G5, 1.5], [2, 1.5, N.E5, .5], [2, 2, N.D5, 1], [2, 3, N.C5, 1], [3, 0, N.D5, 2], [3, 2, N.E5, 1], [3, 3, N.D5, 1],
      [4, 0, N.E5, 1], [4, 1, N.G5, 1], [4, 2, N.A5, 1], [4, 3, N.G5, 1], [5, 0, N.E5, 2], [5, 2, N.D5, 1], [5, 3, N.C5, 1],
      [6, 0, N.A4, 1], [6, 1, N.C5, 1], [6, 2, N.D5, 1], [6, 3, N.E5, 1], [7, 0, N.D5, 3],
      [8, 0, N.G5, 1], [8, 1, N.E5, 1], [8, 2, N.G5, 1], [8, 3, N.A5, 1], [9, 0, N.G5, 2], [9, 2, N.E5, 1], [9, 3, N.D5, 1],
      [10, 0, N.C5, 1], [10, 1, N.D5, 1], [10, 2, N.E5, 1], [10, 3, N.G5, 1], [11, 0, N.E5, 2], [11, 2, N.D5, 2],
      [12, 0, N.C5, 1], [12, 1, N.E5, 1], [12, 2, N.G5, 1], [12, 3, N.E5, 1], [13, 0, N.D5, 2], [13, 2, N.C5, 1], [13, 3, N.A4, 1],
      [14, 0, N.C5, 1], [14, 1, N.D5, 1], [14, 2, N.E5, 2], [15, 0, N.C5, 4]];
    chords.forEach((c, b) => {
      const t0 = b * bar;
      add(t0, beat * 1.7, root[c], { gain: .16, a: .01, r: .3, lp: 900 });
      add(t0 + beat * 2, beat * 1.6, root[c] + 7, { gain: .1, a: .01, r: .3, lp: 900 });
      [0, 1, 2, 1, 0, 1, 2, 1].forEach((k, i) => add(t0 + i * beat / 2, beat * .42, tri[c][k] + 12, { type: 'triangle', gain: .045, a: .004, r: .1, pan: i % 2 ? .28 : -.28 }));
    });
    mel.forEach(([b, s, m, len]) => add(b * bar + s * beat, len * beat * .92, m, { type: 'triangle', gain: .13, a: .006, r: .35, partial: .22 }));
    return { len: bar * 16, ev };
  }
  function trackB() {   // すいそう（ぽこぽこ）60。ゆっくりの 和音＋ガラスの ベル＋あわ
    const ev = [], r = mulberry(1234), bar = 4, penta = [72, 74, 76, 79, 81, 84], add = (t, d, m, o) => ev.push([t, d, m, o]);
    const pads = { C: [48, 55, 64, 67, 71], Am: [45, 52, 60, 64, 67], F: [41, 48, 57, 60, 65], G: [43, 50, 59, 62, 67] };
    ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'C'].forEach((c, i) => pads[c].forEach((m, j) => add(i * 8, 7.2, m, { type: 'triangle', gain: .03, a: 2.2, r: 2.6, hold: true, pan: (j - 2) * .2 })));
    for (let b = 0; b < 16; b++) [.6, 2.1, 3.2].forEach(off => { if (r() < .72) add(b * bar + off, 1.2, pick(r, penta), { type: 'sine', gain: .05, a: .004, r: 1.6, partial: .28, pan: (r() - .5) * 1.2 }); });
    for (let t = 1.2; t < 61; t += 1.4 + r() * 2.2) { const m = 84 + Math.floor(r() * 9), pan = (r() - .5) * 1.5; add(t, .05, m, { type: 'sine', gain: .03, a: .004, r: .07, bend: 1.7, pan }); if (r() < .4) add(t + .17, .05, m + 2, { type: 'sine', gain: .022, a: .004, r: .07, bend: 1.6, pan }); }
    return { len: 64, ev };
  }
  function trackC() {   // ほしぞら（よるの へや）54。ひくい ドローン＋きらきらの 星＋ときどき お月さまの ベル
    const ev = [], r = mulberry(4242), stars = [84, 86, 88, 91, 93, 96], add = (t, d, m, o) => ev.push([t, d, m, o]);
    add(0, 52, 36, { type: 'triangle', gain: .06, a: 5, r: 5, hold: true });
    add(1, 51, 43, { type: 'triangle', gain: .04, a: 6, r: 5, hold: true });
    add(2, 50, 52, { type: 'triangle', gain: .018, a: 7, r: 5, hold: true });
    for (let t = .5; t < 58; t += .35 + r() * .85) add(t, .1, pick(r, stars), { type: 'sine', gain: .035, a: .004, r: 1.3, pan: (r() - .5) * 1.5 });
    for (let t = 4; t < 56; t += 8) [76, 79].forEach((m, i) => add(t + i * .05, 2.2, m, { type: 'sine', gain: .04, a: .02, r: 2.6, partial: .3, pan: i ? .3 : -.3 }));
    return { len: 60, ev };
  }
  const BUILD = { a: trackA, b: trackB, c: trackC };
  const TRACKS = {};
  const track = key => TRACKS[key] || (TRACKS[key] = (() => { const t = BUILD[key](); t.ev.sort((x, y) => x[0] - y[0]); return t; })());

  // ── 1つの 音（かくばった／三角の 波。partial＝1オクターブ うえの サイン波を すこし）──
  function voice(ctx, dest, t, dur, midi, o) {
    const { type = 'triangle', gain = .1, a = .008, r = .25, pan = 0, partial = 0, lp = 0, hold = false, bend = 0 } = o || {};
    const g = ctx.createGain(), f0 = mtof(midi); let node = g;
    const mk = (mult, level, ty) => { const os = ctx.createOscillator(); os.type = ty; os.frequency.setValueAtTime(f0 * mult, t); if (bend) os.frequency.linearRampToValueAtTime(f0 * mult * bend, t + Math.min(dur, .12)); const og = ctx.createGain(); og.gain.value = level; os.connect(og); og.connect(g); os.start(t); os.stop(t + a + dur + r + .1); };
    mk(1, 1, type); if (partial) mk(2, partial, 'sine');
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a);
    if (hold) { g.gain.setValueAtTime(gain, t + Math.max(a, dur)); g.gain.linearRampToValueAtTime(.0001, t + dur + r); } else g.gain.exponentialRampToValueAtTime(.0001, t + a + dur + r);
    if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; g.connect(fl); node = fl; }
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p); p.connect(dest); } else node.connect(dest);
  }
  // ゆるい こだま（空気）。曲の 音は ここへ あつめて、ぜんたいの 大きさを きめる
  function makeAir(ctx, volume) {
    const master = ctx.createGain(); master.gain.value = volume;
    const dl = ctx.createDelay(1); dl.delayTime.value = .34; const fb = ctx.createGain(); fb.gain.value = .3; const wet = ctx.createGain(); wet.gain.value = .22;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    master.connect(ctx.destination); master.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(ctx.destination);
    return master;
  }

  // ── 状態 ──
  let on = (readJSON(KEY) || {}).on === true, cur = null, air = null, ownCtx = null, wantGesture = false, ticker = 0;
  const stack = [], subs = new Set();
  const notify = () => subs.forEach(f => { try { f(); } catch {} });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, on })); } catch {} };
  const mainSound = () => { const m = readJSON(MAIN); return !!(m && m.sound === true); };
  const soundOk = fn => { try { return typeof fn === 'function' ? !!fn() : mainSound(); } catch { return false; } };
  const norm = t => ({ asa: 'a', hiru: 'h', yuu: 'y', yoru: 'n' }[t] || t);
  function pickKey(name, o) {
    o = o || {};
    const night = norm(val(o.time)) === 'n';
    if (name === 'hiroba') return night ? 'c' : 'a';
    if (name === 'tank') return val(o.starry) ? 'c' : 'b';
    if (name === 'gaze') return night ? 'c' : 'b';
    return null;   // 釣りの 画面など：鳴らさない
  }
  function desired() {
    const top = stack[stack.length - 1]; if (!top || !on || document.hidden) return null;
    try { if (!soundOk(top.o.sound) || val(top.o.mute)) return null; return pickKey(top.name, top.o); } catch { return null; }
  }
  const touched = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;   // ゆびで さわった あとか
  function getCtx(top) {
    if (!touched()) { wantGesture = true; return null; }   // さわる まえには、音の 部品を 作らない
    try {
      if (typeof top.o.ctx === 'function') return top.o.ctx() || null;
      if (ownCtx && ownCtx.state !== 'closed') return ownCtx;
      const AC = window.AudioContext || window.webkitAudioContext; return AC ? (ownCtx = new AC()) : null;
    } catch { return null; }
  }
  const airFor = c => (air && air.ctx === c) ? air.node : (air = { ctx: c, node: makeAir(c, VOLUME * boost) }).node;

  // ── 1曲の プレーヤー：すこし さきまで 音を 予約し、曲の おわりで もとに もどる（つなぎ目なし）──
  function startPlayer(c, key) {
    const t = track(key), g = c.createGain(), now = c.currentTime;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(TRIM[key], now + 3); g.connect(airFor(c));
    const p = { key, ctx: c, gain: g, loopStart: now + .15, idx: 0, ended: false, made: 0 };
    p.pump = () => {
      if (p.ended || c.state === 'closed') return;
      const t0 = c.currentTime, horizon = t0 + 4;
      for (let guard = 0; guard < 600; guard++) {
        const e = t.ev[p.idx], at = p.loopStart + e[0]; if (at > horizon) break;
        if (at >= t0 - .05) { try { voice(c, g, at, e[1], e[2], e[3]); p.made++; } catch {} }   // 間に あわなかった 音は とばす（まとめて 鳴らさない）
        p.idx++; if (p.idx >= t.ev.length) { p.idx = 0; p.loopStart += t.len; }
      }
    };
    p.pump(); return p;
  }
  function stopPlayer(p, sec) {
    if (!p || p.ended) return; p.ended = true;
    try { const n = p.ctx.currentTime; p.gain.gain.cancelScheduledValues(n); p.gain.gain.setValueAtTime(p.gain.gain.value, n); p.gain.gain.linearRampToValueAtTime(0, n + sec); } catch {}
    setTimeout(() => { try { p.gain.disconnect(); } catch {} }, sec * 1000 + 400);
  }
  function ensureTimer() {
    const need = on && stack.length > 0;
    if (need && !ticker) ticker = setInterval(tick, 500); else if (!need && ticker) { clearInterval(ticker); ticker = 0; }
  }
  function tick() { refresh(); if (cur) cur.pump(); }
  function refresh() {
    try {
      const key = desired();
      if (!key) { if (cur) { stopPlayer(cur, 1.6); cur = null; } return; }
      const top = stack[stack.length - 1], c = getCtx(top); if (!c) return;
      if (c.state === 'suspended') c.resume().catch(() => {});
      if (cur && cur.key === key && cur.ctx === c) return;
      if (cur) stopPlayer(cur, 3);   // ふわっと つなぐ（前の 曲は 3びょうで きえる）
      cur = startPlayer(c, key);
    } catch { /* 音が 出せなくても ゲームは 止めない */ } finally { ensureTimer(); }
  }
  const api = {
    version: 1, keys: ['a', 'b', 'c'],
    on: () => on,
    set(v) { on = !!v; save(); refresh(); notify(); return on; },
    enter(name, o) { const i = stack.findIndex(s => s.name === name); if (i >= 0) stack.splice(i, 1); stack.push({ name, o: o || {} }); refresh(); },
    leave(name) { const i = stack.findIndex(s => s.name === name); if (i >= 0) stack.splice(i, 1); refresh(); },
    refresh,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    // 「BGM：ON/OFF」ボタン。ばしょごとに 見た目（class）だけ かえられる。おとが OFF の まま おされたら、おとも つける（enableSound）
    button(o) {
      o = o || {};
      const b = document.createElement('button'); b.type = 'button'; b.className = o.className || 'bgm-btn'; if (o.id) b.id = o.id;
      b.title = 'ひろば・おへや・ながめる で ながれる、しずかな BGM';
      const paint = () => { b.textContent = 'BGM：' + (on ? 'ON' : 'OFF'); b.setAttribute('aria-pressed', String(on)); };
      b.addEventListener('click', () => {
        const next = !on;
        if (next && typeof o.enableSound === 'function' && !soundOk(o.sound)) { try { o.enableSound(); } catch {} }
        api.set(next);
        if (typeof o.onToggle === 'function') { try { o.onToggle(next, soundOk(o.sound)); } catch {} }
      });
      subs.add(paint); paint(); return b;
    },
    state: () => ({ on, key: cur ? cur.key : '', playing: !!cur, stack: stack.map(s => s.name), ownCtx: !!ownCtx, volume: VOLUME * boost, trim: { ...TRIM } }),
    _debug: { track, voice, makeAir, pickKey, tick, desired, TRIM, VOLUME, get cur() { return cur; }, get stack() { return stack; }, get wantGesture() { return wantGesture; }, get ticker() { return ticker; } }
  };
  window.TsuriBgm = api;
  // ゆびで さわった あとで はじめて 音の 部品を 作る／画面が かくれたら 止める／ほかの タブで「おと」「BGM」が かわったら 取りこむ
  ['pointerup', 'pointerdown', 'keydown', 'touchend', 'click'].forEach(ev => addEventListener(ev, () => { if (wantGesture) { wantGesture = false; refresh(); } }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', refresh);
  addEventListener('pageshow', refresh);
  addEventListener('storage', e => { if (e.key === KEY) { on = (readJSON(KEY) || {}).on === true; refresh(); notify(); } else if (e.key === MAIN) refresh(); });
})();
