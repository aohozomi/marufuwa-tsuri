/* まるふわ つりびより：BGM（最小の つくり・10/4 マスター「一定じゃなくて 消えたり 大きくなったり。一から やりなおせ。そのまま 流せ」）
   ・音の 処理は しない：WebAudio（コンプ・ローパス・ならし・ピークどめ・調停）は ぜんぶ やめた。ならすのは <audio> 1つ（loop）だけ・音量は 固定（0.5）。
   ・音量の ばらつきは ファイルの 側で 解決：snd/bgm/ の 6曲（asa・hiru・yuu・yoru・heya・gaze・ogg と m4a）は、ぜんぶ −20 LUFS（TP −2dB）に そろえ、
     「つなぎ目なしループ」（無音の しっぽを 切り、末尾 4秒を 先頭へ 等電力で クロスフェード 合成）に 作ってある。だから ループの 重ね・音量の 上下は 起きない。
   ・切りかえ（じかんたい・場所が かわる とき）だけ <audio> を 2つ：1.5びょうで 古い 曲を フェードアウト・あたらしい 曲を フェードイン。同じ 曲では 重ねない。
   ・複数の タブ：画面が かくれた（visibilitychange）タブは 止める。あとから ひらいた（見えている）タブが ならす。
   ・「おと」が OFF か「BGM」が OFF の 間は <audio> も 作らない（AudioContext は ここでは もう 使わない）。
   ・最初の タップ（どこでも）で play()。止められたら 次の タップで もういちど。ボタンの 文字は 本当の 状態（state().playing）で 出す。
   ・記録は localStorage['marufuwa-bgm-v1'] = {v:1, on:boolean, migrated:1} だけ。本体の「おと」は 読むだけ。
   ・API は これまでと おなじ（ばしょ ＝ 'hiroba' | 'tank' | 'gaze' | 'tsuri'）：
       TsuriBgm.enter('hiroba', { sound: () => boolean, time: () => 'a|h|y|n', starry: () => boolean, mute: () => boolean })（ctx は もう 使わない・わたされても むし）
       TsuriBgm.leave('hiroba') / .button({ id, className, sound, enableSound, onToggle }) / .set(true|false) / .on() / .refresh() / .subscribe(fn) / .state()
     「くみたてる」（ごうせいの 曲）は やめた：mixButton() は かくれた 空の 要素を かえすだけ。 */
(() => {
  'use strict';
  if (window.TsuriBgm) return;
  const SELF = (() => { try { return (document.currentScript && document.currentScript.src) || ''; } catch { return ''; } })();   // この ファイルの 住所（どこから 読んでも snd/bgm/ を おなじ 場所に さがす）
  const FILE_DIR = (() => { try { return new URL('snd/bgm/', SELF || location.href).href; } catch { return 'snd/bgm/'; } })();
  const KEY = 'marufuwa-bgm-v1', MAIN = 'marufuwa-tsuri-v1';
  const VOLUME = .5, FADE_MS = 1500, GIVEUP_MS = 9000, RETRY_MS = 30000;
  const boost = (() => { try { const v = Number(new URLSearchParams(location.search).get('bgmvol')); return v > 0 ? Math.min(2, v) : 1; } catch { return 1; } })();   // 耳で 見る 時だけ ?bgmvol=0.5〜2
  const FILE_OF = { a: 'asa', h: 'hiru', y: 'yuu', n: 'yoru' };   // じかんたい → ファイル（おへやは heya・ながめるは gaze）
  const FILE_EXT = (() => { try { const a = document.createElement('audio'); return !a.canPlayType ? '' : a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : a.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? 'm4a' : ''; } catch { return ''; } })();   // iPhone など ogg が よめない 時は m4a
  const FILE_OFF = (() => { try { return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && new URLSearchParams(location.search).get('bgmfile') === '0'; } catch { return false; } })();   // 手もとの けんさ用：?bgmfile=0 で ならさない
  const readJSON = k => { try { const d = JSON.parse(localStorage.getItem(k)); return d && typeof d === 'object' ? d : null; } catch { return null; } };
  const val = v => typeof v === 'function' ? v() : v;
  const isEn = () => !!(window.TsuriEn && window.TsuriEn.lang === 'en');
  const readOn = () => { const r = readJSON(KEY); return r && r.migrated === 1 ? r.on === true : true; };
  let on = readOn(), cur = null, ticker = 0;
  const stack = [], subs = new Set(), failed = new Set(), outs = new Set();
  const notify = () => subs.forEach(f => { try { f(); } catch {} });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, on, migrated: 1 })); } catch {} };
  const mainSound = () => { const m = readJSON(MAIN); return !(m && m.sound === false); };
  const soundOk = fn => { try { return typeof fn === 'function' ? !!fn() : mainSound(); } catch { return false; } };
  const norm = t => ({ asa: 'a', hiru: 'h', yuu: 'y', yoru: 'n' }[t] || t);
  // ばしょ → 曲の ならび（さきに ある ファイルを つかう）。10/7 マスター「場所によって 曲を 変えて」：しろ・カフェ・びじゅつかんは 専用の ファイルが 来たら HAVE に 足すだけで 切りかわる（それまでは 代用）
  const HAVE = ['asa', 'hiru', 'yuu', 'yoru', 'heya', 'gaze'];   // snd/bgm/ に 実際に ある ファイル（無い 名前を ここに 書くと 404 で 9びょう 待つので 書かない）
  const PLACE = { gaze: ['gaze'], tank: ['heya'], cafe: ['cafe', 'heya'], bijutsukan: ['bijutsukan', 'heya'], shiro: ['shiro', 'gaze'] };
  function fileFor(name, o) {   // この ばしょ・じかんで ながす ファイル（なければ ''）
    o = o || {};
    let f = '';
    if (PLACE[name]) f = PLACE[name].find(x => HAVE.includes(x)) || '';
    else if (name === 'hiroba' || name === 'tsuri') { const t = norm(val(o.time)); f = FILE_OF[t] || FILE_OF.h; }
    return f && !failed.has(f) ? f : '';
  }
  function desired() {   // いま ながす ファイル。ならさない 時は ''
    const top = stack[stack.length - 1]; if (!top || !on || !FILE_EXT || FILE_OFF) return '';
    try { if (!soundOk(top.o.sound) || val(top.o.mute)) return ''; return fileFor(top.name, top.o); } catch { return ''; }
  }
  // 音量の フェード（等電力：しだいに 上げる＝sin・さげる＝1−cos。<audio>.volume だけを うごかす）
  function fadeTo(el, to, ms, done) {
    clearInterval(el._fade); const from = el.volume, t0 = performance.now();
    if (!ms || from === to) { el.volume = to; if (done) done(); return; }
    el._fade = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms), e = to >= from ? Math.sin(k * Math.PI / 2) : 1 - Math.cos(k * Math.PI / 2);
      try { el.volume = Math.max(0, Math.min(1, from + (to - from) * e)); } catch {}
      if (k >= 1) { clearInterval(el._fade); if (done) done(); }
    }, 40);
  }
  const closeEl = el => { clearInterval(el._fade); try { el.pause(); } catch {} try { el.removeAttribute('src'); el.load(); } catch {} outs.delete(el); };
  const retire = p => { const el = p.el; outs.add(el); fadeTo(el, 0, FADE_MS, () => closeEl(el)); };   // あたらしい 曲に かわる／止める：1.5びょうで きえて とじる
  const fail = p => { if (p.dead) return; p.dead = true; closeEl(p.el); failed.add(p.file); if (cur === p) cur = null; setTimeout(() => { failed.delete(p.file); refresh(); }, RETRY_MS); notify(); };   // よめない・9びょう たっても 鳴らない：しずかに 30びょう あとに もういちど
  function play(p) {   // 音を ならす（ブラウザの きまりで さいしょの タップ まで 止められる ことが ある）
    p.blocked = false;
    try {
      const pr = p.el.play();
      const ok = () => { if (cur === p) { p.blocked = false; fadeTo(p.el, VOLUME * boost, FADE_MS); notify(); } };
      if (pr && pr.then) pr.then(ok, err => { if (cur !== p) return; if (err && err.name === 'NotAllowedError') { p.blocked = true; notify(); } else fail(p); }); else ok();
    } catch { fail(p); }
  }
  function start(file) {
    const el = new Audio(); el.preload = 'auto'; el.loop = true; el.volume = 0; el.src = FILE_DIR + file + '.' + FILE_EXT;
    const p = { file, el, born: Date.now(), blocked: false, dead: false };
    el.addEventListener('error', () => fail(p), { once: true });
    cur = p; play(p); return p;
  }
  function refresh() {
    try {
      if (document.hidden) { if (cur && !cur.el.paused) { const p = cur; fadeTo(p.el, 0, 300, () => { if (document.hidden) try { p.el.pause(); } catch {} }); } return; }   // かくれた タブは 止める（あとから ひらいた タブが ならす）
      const file = desired();
      if (!file) { if (cur) { retire(cur); cur = null; notify(); } return; }
      if (cur && cur.file === file) { if (cur.el.paused || cur.blocked) play(cur); return; }   // おなじ 曲：もどって きた・止められて いた ときだけ ふたたび ならす（かさねない）
      if (cur) retire(cur);
      start(file); notify();
    } catch { /* 音が 出せなくても ゲームは 止めない */ } finally { ensureTimer(); }
  }
  function ensureTimer() {
    const need = on && stack.length > 0;
    if (need && !ticker) ticker = setInterval(tick, 1500); else if (!need && ticker) { clearInterval(ticker); ticker = 0; }
  }
  function tick() {
    refresh();
    if (cur && !cur.dead && !cur.blocked && !cur.heard) { if (!cur.el.paused && cur.el.readyState >= 3 && cur.el.currentTime > 0) cur.heard = true; else if (Date.now() - cur.born > GIVEUP_MS) fail(cur); }   // 9びょう たっても 鳴らない
  }
  const api = {
    on: () => on,
    set(v) { on = !!v; save(); refresh(); notify(); return on; },
    mix: () => null, setMix: () => null, mixCode: () => '', openMixer() {},   // 「くみたてる」は やめた（互換の ための 空）
    mixButton() { const s = document.createElement('span'); s.hidden = true; s._unsub = () => {}; return s; },
    enter(name, o) { const i = stack.findIndex(s => s.name === name); if (i >= 0) stack.splice(i, 1); stack.push({ name, o: o || {} }); refresh(); },
    leave(name) { const i = stack.findIndex(s => s.name === name); if (i >= 0) stack.splice(i, 1); refresh(); },
    refresh,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    // 「BGM：ON/OFF」ボタン。ばしょごとに 見た目（class）だけ かえられる。おとが OFF の まま おされたら、おとも つける（enableSound）
    button(o) {
      o = o || {};
      const b = document.createElement('button'); b.type = 'button'; b.className = o.className || 'bgm-btn'; if (o.id) b.id = o.id;
      b.title = 'ひろば・おへや・ながめる で ながれる、しずかな BGM';
      const paint = () => { b.textContent = (isEn() ? 'BGM: ' : 'BGM：') + (on ? 'ON' : 'OFF'); b.setAttribute('aria-pressed', String(on)); };
      b.addEventListener('click', () => {
        const next = !on;
        if (next && typeof o.enableSound === 'function' && !soundOk(o.sound)) { try { o.enableSound(); } catch {} }
        api.set(next);
        if (typeof o.onToggle === 'function') { try { o.onToggle(next, soundOk(o.sound)); } catch {} }
      });
      subs.add(paint); paint(); b._unsub = () => subs.delete(paint); return b;
    },
    state: () => ({ on, key: cur ? cur.file : '', playing: !!(cur && !cur.dead && !cur.blocked && !cur.el.paused && cur.el.currentTime > 0), blocked: !!(cur && cur.blocked), file: cur ? cur.file : '', audios: (cur ? 1 : 0) + outs.size, stack: stack.map(s => s.name), volume: VOLUME * boost, ownCtx: false, part: 0, mix: null, gr: 0, grLim: 0, vol: cur ? Math.round(cur.el.volume * 1000) / 1000 : 0 }),
    _debug: { fileFor, FILE_OF, FILE_EXT, FILE_DIR, failed, VOLUME, FADE_MS, get cur() { return cur; }, get stack() { return stack; }, get outs() { return outs; } }
  };
  window.TsuriBgm = api;
  // 最初の タップ／キー（どこでも）で ならす。ならし はじめるまで ずっと 見はる（止められた ときは 次の タップで もういちど）
  const unlock = () => { if (!on || !stack.length || document.hidden) return; if (!cur || cur.blocked || cur.el.paused) refresh(); };
  ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'click'].forEach(ev => addEventListener(ev, unlock, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', refresh);
  addEventListener('pageshow', refresh);
  // 「おと」の ボタンなど、どこかを おした 直後に 見なおす（本体の おとボタンが 記録を かえた あと すぐ 止まる）
  addEventListener('click', () => { if (on && stack.length) setTimeout(refresh, 30); }, { passive: true, capture: true });
  // ─── English mode（tsuri-en.js が あって 英語の 時だけ）：BGM の 文を 訳表に 足す ───
  const EN = { ex: {
    'ひろば・おへや・ながめる で ながれる、しずかな BGM': "Quiet music that plays in the Plaza, Marufuwa's Room and Just Watch",
    'おとと BGMを つけたよ。しずかな きょくが ながれるよ。': 'Sound and BGM are on. Quiet music will play.',
    'BGMを つけたよ。しずかな きょくが ながれるよ。': 'BGM is on. Quiet music will play.',
    'BGMを けしたよ。': 'BGM is off.',
    'BGMは、みみで ながめる あいだ おやすみします。': 'BGM takes a break while Listen mode is on.'
  }, rules: [   // 「みみで ながめる」を はじめた ときの 長い 読みあげの あとに つづけて 出る（前の 文は 総司令部の 表で 訳す）
    [/^(.+)BGMは、みみでながめるあいだおやすみします。$/, (_, pre) => { const E = window.TsuriEn, p = E && E.tr ? E.tr(pre) : null; return p == null ? null : p + ' BGM takes a break while Listen mode is on.'; }]
  ] };
  const regEn = () => { const E = window.TsuriEn; if (E && E.lang === 'en' && typeof E.add === 'function' && !regEn.done) { regEn.done = true; E.add(EN); } notify(); };
  addEventListener('load', regEn);
  addEventListener('storage', e => { if (e.key === KEY) { on = readOn(); refresh(); notify(); } else if (e.key === MAIN) refresh(); });
})();
