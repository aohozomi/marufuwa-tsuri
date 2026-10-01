/* まるふわ つりびより：ページの おと（tsuri-pagesound.js）（ゲーム開発司令部２・2026-10-01）
   カフェ・びじゅつかん・おすすめの へや が つかう「はじめから ON＋うえに 🔇 1つ＋はじめて だけ ふきだし」の きまりを 1か所に まとめた もの。
   ・きろく：localStorage['marufuwa-sound-v1'] = {v:1, mute:0|1, hint:0|1}（数字だけ・この たんまつだけ）。mute が なければ「うごきを へらす」（data-calm／OS）の ときは OFF、それいがいは ON。
   ・BGM：TsuriBgm（snd/bgm/）。この ページに いる あいだだけ BGM を この「おと」に あわせ、出る とき（pagehide）に もとの せっていへ もどす（つり・ひろばの BGM は そのまま）。
   ・かんきょうおん：ページごとに ambient(api) を わたす。api.voice(hz, to, len, vol, at)＝三角波＋ローパス 1100Hz＋アタック 15ms（1200Hz いか）。6〜14びょうに 1かい いか・かくれて いる とき・OFF の ときは ならさない。
   ・ブラウザの きまりで、さいしょの タップ／キーの あとから なる。
   つかいかた：PageSound.init({ mount: <「もどる」の 要素>, bgm: 'hiroba'|'tank', time: () => 'a|h|y|n', ambient: api => {...}, label? }) */
(function () {
  'use strict';
  if (window.PageSound) return;
  const KEY = 'marufuwa-sound-v1';
  const isEn = () => !!(window.TsuriEn && window.TsuriEn.lang === 'en');
  const L = (ja, en) => isEn() ? en : ja;
  const calm = () => document.documentElement.dataset.calm === 'true' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let rec = { mute: null, hint: 0 };
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && typeof d === 'object') { if (d.mute === 0 || d.mute === 1) rec.mute = d.mute; rec.hint = d.hint === 1 ? 1 : 0; } } catch (e) {}
  const save = () => { try { const o = { v: 1, hint: rec.hint }; if (rec.mute !== null) o.mute = rec.mute; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const soundOn = () => rec.mute === null ? !calm() : rec.mute === 0;

  let ac = null, opts = null, btn = null, hintEl = null, bgmMine = false, bgmPrev = false, ambT = 0, log = null;
  const mkAc = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; };
  const SFX_OFF = true;   // 10/2 マスター「効果音は 一旦 ぜんぶ 止める」：みじかい おと（かんきょうおんの カップなど）は 鳴らさない。BGM と「おとを けす」は そのまま
  function voice(hz, to, len, vol, at) {   // 三角波・ローパス 1100Hz・アタック 15ms
    if (SFX_OFF || !soundOn() || !mkAc()) return;
    try {
      const t = ac.currentTime + (at || 0), o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 1100; o.type = 'triangle';
      const h1 = Math.min(1100, hz), h2 = Math.min(1100, to || hz);
      o.frequency.setValueAtTime(h1, t); if (h2 !== h1) o.frequency.linearRampToValueAtTime(h2, t + len * .6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0008, t + len);
      o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + len + .05);
    } catch (e) {}
  }
  const api = { voice, soundOn, ctx: () => ac };

  function drawBtn() {
    if (!btn) return; const on = soundOn();
    btn.setAttribute('aria-pressed', String(!on)); btn.textContent = L(on ? '🔇 おとを けす' : '🔊 おとを ならす', on ? '🔇 Mute sound' : '🔊 Turn sound on');
  }
  function applyBgm() { const B = window.TsuriBgm; if (B && bgmMine) { try { B.set(soundOn()); } catch (e) {} } }
  function setMute(m) { rec.mute = m ? 1 : 0; save(); drawBtn(); applyBgm(); if (!m) mkAc(); }
  function scheduleAmbient() {
    clearTimeout(ambT); if (!opts || typeof opts.ambient !== 'function') return;
    ambT = setTimeout(() => { if (soundOn() && !document.hidden && ac) { try { opts.ambient(api); } catch (e) {} } scheduleAmbient(); }, 6000 + Math.random() * 8000);
  }
  function initBgm() {
    const B = window.TsuriBgm; if (!B || !opts.bgm || initBgm.done) return; initBgm.done = true;
    bgmPrev = !!B.on(); bgmMine = true;
    try { B.set(soundOn()); } catch (e) {}
    B.enter(opts.bgm, { ctx: () => ac, sound: () => soundOn(), time: () => (typeof opts.time === 'function' ? opts.time() : 'h'), starry: () => false, mute: () => false });
    addEventListener('pagehide', () => { if (!bgmMine) return; bgmMine = false; try { B.leave(opts.bgm); B.set(bgmPrev); } catch (e) {} });
  }
  function init(o) {
    opts = o || {}; if (init.done) return api; init.done = true;
    const style = document.createElement('style');
    style.textContent = '.ps-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.ps-grp{display:flex;align-items:center;gap:6px}.ps-btn{min-height:44px;min-width:44px;padding:4px 16px;border-radius:22px;border:2px solid #9bc9da;background:linear-gradient(#fff,#dff1f7);color:#14506b;font:inherit;font-weight:800;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}.ps-btn:focus-visible{outline:4px solid #286b88;outline-offset:2px}.ps-hint{padding:3px 10px;border-radius:12px;background:#fffdf7;border:2px solid #cfae7e;font-weight:800;font-size:.8rem;color:#27424e;white-space:nowrap}.ps-hint[hidden]{display:none}';
    document.head.append(style);
    const row = document.createElement('div'), grp = document.createElement('span'); row.className = 'ps-row'; grp.className = 'ps-grp';
    hintEl = document.createElement('span'); hintEl.className = 'ps-hint'; hintEl.hidden = true; hintEl.setAttribute('aria-hidden', 'true');
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ps-btn'; btn.id = 'ps-mute'; grp.append(hintEl, btn);
    const m = opts.mount; if (m && m.parentNode) { m.parentNode.insertBefore(row, m); row.append(m, grp); } else { document.body.prepend(row); row.append(grp); }
    btn.addEventListener('click', () => { setMute(soundOn()); });
    drawBtn();
    // はじめて ひらいた とき 1かいだけ「ミュートボタンは こちら →」を 3びょう
    if (!rec.hint) { hintEl.textContent = L('ミュートボタンは こちら →', 'Mute button is here →'); hintEl.hidden = false; rec.hint = 1; save(); setTimeout(() => { hintEl.hidden = true; }, 3000); }
    const E = window.TsuriEn; const reg = () => { const T = window.TsuriEn; if (T && T.lang === 'en' && typeof T.add === 'function' && !reg.done) { reg.done = true; T.add({ ex: { '🔇 おとを けす': '🔇 Mute sound', '🔊 おとを ならす': '🔊 Turn sound on', 'ミュートボタンは こちら →': 'Mute button is here →' } }); } };
    reg(); addEventListener('load', reg);
    addEventListener('pointerdown', () => { if (soundOn()) mkAc(); }, { once: true }); addEventListener('keydown', () => { if (soundOn()) mkAc(); }, { once: true });
    initBgm(); scheduleAmbient();
    return api;
  }
  window.PageSound = { init, voice, soundOn, setMute, state: () => ({ mute: rec.mute, hint: rec.hint, on: soundOn(), bgm: bgmMine, btn: !!btn }), ambientNow: () => { if (opts && opts.ambient) opts.ambient(api); }, resetAc: () => { ac = null; }, KEY };
})();
