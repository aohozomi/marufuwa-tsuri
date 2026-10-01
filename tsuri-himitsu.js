// まるふわ つりびより「ひみつ」（外付け1ファイル）
//   つりの がめんの ひみつ：あさぎりの こじか／みなとまちの とうだい／ふねの まるまど／ねこの ひるね／つきの うさぎ。＋ ひみつノート。
//   ・本体（index.html）は書き換えない。本体の さいごに 1行：<script defer src="tsuri-himitsu.js"></script>（外すには その1行を消す）。
//   ・読むだけ：#scene の data-phase・data-time・data-area、#friend-a・#friend-b の 絵、localStorage['marufuwa-tsuri-v1'] の sound。
//   ・書く：ひみつ専用の 鍵 localStorage['marufuwa-himitsu-v1'] = {v:1, found:{名前:{at,time}}, gifts:{sakura|aoba|donguri|yuki|sasabune|yadokari: 個数(1〜3)}} だけ（読んで・足して・すぐ書く。ほかの ページが 書いた物を 消さない）。
//       gifts＝ひみつで もらえる おへやの かざり（ひろばの きせつの おとしもの・つりの ひみつの おくりもの）。おへや（tsuri-tank.js の GIFT_DECOR）が 読んで 本体の save.decor に 足して 数える。
//   ・ごほうびは 見た目・音・ことば だけ。釣れる 魚は かえない。見つけなくても、見のがしても、何も へらない。
//   ・ぜんぶ「さわる（本当の ボタン。Tab で えらべる）」か「まつ」で おこり、音（おと ON の時）と 読み上げ（#status）でも しらせる。
//   ・つりの 最中（かかった・ひいて いる 間）は、ひみつの ボタンを とめる（本体は ボタンの 上を おしても ひけない ため）。
//   ・音は 本体と おなじ むかしの ゲームき ふう（かくばった なみ・さんかくの なみ・みじかい ざつおん）。おとが OFF の間は 何も 鳴らさない。
//   ・ひみつの ことば（合言葉）：Xなどで おしえる ことばを いれると「ひみつの ことばが みつかったよ」。名前は「ひみつの ことば」（「あいことば」は 記録の 持ち運びの 名前）。
//       ことばは ソースに 書かず SHA-256 の ハッシュだけ 持つ（読んでも 一覧は 読めない）。※「見つけにくい」だけで「守り」では ない（みじかい ことばは 総当たりで わかる）→ ごほうびは 取られても 困らない 物だけ。
//       入れかた：バケツの「ひみつの ことば」ボタン／リンク ?kotoba=ことば（ひらいたら アドレスから 消す）。どちらも この 端末の 中で しらべるだけ（外へ 送らない・入れた 文字は 画面に 出さない）。
//       何度でも（期限なし・取りのがしなし・数えない・まちがえても 何も おこらない）。ごほうびは いまは「みつかったよ」の えんしゅつと ひみつノートの 1まい だけ。
//       本体・ほかの 外付けは window の 'tsuri-kotoba' イベント（detail:{id,fresh,title}）を きいて、ごほうび（いろ・かざり）を 出せる。ことばの 足しかた：TsuriHimitsu._debug.kotoba.hashOf('ことば') の 16進 64もじを WORDS に 足す。
(() => {
  'use strict';
  const scene = document.getElementById('scene');
  if (!scene) return;
  const $ = id => document.getElementById(id), status = $('status');
  const HM_KEY = 'marufuwa-himitsu-v1', MAIN_KEY = 'marufuwa-tsuri-v1';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readJSON = key => { try { const d = JSON.parse(localStorage.getItem(key)); return d && typeof d === 'object' ? d : null; } catch { return null; } };
  const soundOn = () => (readJSON(MAIN_KEY) || {}).sound === true;
  // おとの せってい（つりびよりの「つかいやすく する」→「おとの せってい」）：こうかおん（sndFx）を きった 人には、ひみつを 見つけた 時の おとも ならさない（項目が なければ 入）。
  // ひみつノートの「もういちど きく」は じぶんで おした ものなので、こうかおんを きっていても ならす（「おと」が ON の 時だけ＝'ui'）。
  // やさしい おと（soft）：かくばった なみは まるい なみに・1.8kHz より たかい おとは 1オクターブ さげる（本体と おなじ かんがえ）
  let sndKind = 'fx';
  const sndSet = () => readJSON(MAIN_KEY) || {};
  const kindOn = () => { const st = sndSet(); return st.sound === true && (sndKind === 'ui' || st.sndFx !== false); };
  const asKind = (k, fn) => { const p = sndKind; sndKind = k; try { return fn(); } finally { sndKind = p; } };
  let speed = 1, skew = 0, muted = false;        // 検査用：時間を はやめる／すすめる／ひみつの 待ち時間を 止める（ほかの 検査が 仮想の 時計を 進める 間、こじか・ねこが 勝手に 出ないように）
  const dur = ms => ms / speed, later = (fn, ms) => setTimeout(fn, dur(ms)), clock = () => performance.now() + skew;
  const say = text => { if (status) status.textContent = text; };
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  // ─── おと ───
  let ac = null, hiss = null;
  const ready = () => { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; };
  // やさしい 出口（聴覚過敏の 人の ため・9/30 夜 マスター直「キンキン 高い おとは 不向き」）：この ファイルの 音は ぜんぶ ここを 通る。
  //   ・基音は 900Hz まで（もっと 高い おとは 1オクターブ ずつ さげる）／アタックは 15ms いじょう／かくばった なみは 使わない（まるい さんかく波に）／
  //     ざつおん（ぽちゃん・ざわざわ）は ローパス 1500Hz／出口は ローパス 1300Hz → やわらかい 頭打ち（tanh）。ピークは −12dBFS（0.25）を こえない。
  const GENTLE = { top: 900, attack: .015, lp: 1300, noiseLp: 1500, cap: .25, noiseGain: 2.4 };   // 10/1 top 1200→900・lp 2500→1300（三角波の 3倍音の「キン」を 出口で 切る・ひろば・おへや・ひみつ・ぬし ぜんぶ そろえた）
  function gentleBus(c) {   // 出口は ローパス → 頭打ち。部品が 無い（ふるい 環境・検査の 見本）ときは あるものだけ つなぐ
    if (c._gentle) return c._gentle;
    let head = c.destination;
    try { if (c.createWaveShaper) { const sh = c.createWaveShaper(), n = 2048, curve = new Float32Array(n); for (let i = 0; i < n; i++) curve[i] = GENTLE.cap * Math.tanh((i / (n - 1) * 2 - 1) * 4); sh.curve = curve; sh.oversample = '2x'; sh.connect(head); head = sh; } } catch {}
    try { if (c.createBiquadFilter) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = GENTLE.lp; if (lp.Q) lp.Q.value = .5; lp.connect(head); head = lp; } } catch {}
    return (c._gentle = head);
  }
  const lowerTo = (freq, slideTo) => { const hi = Math.max(freq, slideTo || 0); if (!(hi > GENTLE.top)) return [freq, slideTo || 0]; const k = 2 ** Math.ceil(Math.log2(hi / GENTLE.top)); return [freq / k, slideTo ? slideTo / k : 0]; };
  const route = (c, node, pan) => { const bus = gentleBus(c); if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); p.connect(bus); } else node.connect(bus); };
  function tone(freq, len = .09, type = 'round', delay = 0, loud = .05, slideTo = 0, pan = 0) {
    if (!kindOn()) return;
    try {
      const c = ready(), at = c.currentTime + delay, osc = c.createOscillator(), vol = c.createGain();
      let rounded = false; if (type !== 'triangle' && type !== 'sine') { type = 'triangle'; rounded = true; }   // 'round'＝まるい さんかく波
      if (sndSet().soft === true && freq >= 1800) { freq /= 2; if (slideTo) slideTo /= 2; }
      [freq, slideTo] = lowerTo(freq, slideTo);
      osc.type = type === 'sine' ? 'triangle' : type; osc.frequency.setValueAtTime(freq, at);
      if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, at + len);
      const level = osc.type === 'triangle' ? loud * (rounded ? 1.75 : 2.2) : loud, A = GENTLE.attack, mid = Math.max(A + .002, len * .5), end = Math.max(mid + .002, len);
      vol.gain.setValueAtTime(0, at); vol.gain.linearRampToValueAtTime(level, at + A); vol.gain.linearRampToValueAtTime(level * .6, at + mid); vol.gain.linearRampToValueAtTime(0, at + end);
      osc.connect(vol); route(c, vol, pan); osc.start(at); osc.stop(at + end + .02);
    } catch {}
  }
  function zap(len = .1, delay = 0, loud = .06, pan = 0) {
    if (!kindOn()) return;
    try {
      const c = ready(), at = c.currentTime + delay;
      if (!hiss) { hiss = c.createBuffer(1, c.sampleRate * .5, c.sampleRate); const d = hiss.getChannelData(0); let hold = 0; for (let i = 0; i < d.length; i++) { if (i % 6 === 0) hold = Math.random() * 2 - 1; d[i] = hold; } }
      const src = c.createBufferSource(), lp = c.createBiquadFilter(), vol = c.createGain(); src.buffer = hiss; lp.type = 'lowpass'; lp.frequency.value = GENTLE.noiseLp; if (lp.Q) lp.Q.value = .5;
      const A = GENTLE.attack, end = Math.max(A + .005, len);
      vol.gain.setValueAtTime(0, at); vol.gain.linearRampToValueAtTime(loud * GENTLE.noiseGain, at + A); vol.gain.linearRampToValueAtTime(0, at + end);
      src.connect(lp); lp.connect(vol); route(c, vol, pan); src.start(at); src.stop(at + end + .02);
    } catch {}
  }
  const chord = (notes, gap = .08, type = 'round', loud = .04) => notes.forEach((n, i) => tone(n, gap * 1.05, type, i * gap, loud));

  // ─── ひみつの 記録（ひみつ専用の 鍵）───
  function markFound(id, extra) {
    let d = readJSON(HM_KEY) || {};
    if (!d.found || typeof d.found !== 'object') d.found = {};
    const fresh = !d.found[id];
    if (fresh) d.found[id] = { at: Date.now(), time: scene.dataset.time || '', ...extra };
    d.v = 1;
    try { localStorage.setItem(HM_KEY, JSON.stringify(d)); } catch {}
    if (fresh) syncNoteButton();
    return fresh;
  }
  const foundMap = () => { const d = readJSON(HM_KEY); return d && d.found && typeof d.found === 'object' ? d.found : {}; };

  // ─── ようす（本体の 印を 読む）───
  const state = () => ({ phase: scene.dataset.phase || 'idle', time: scene.dataset.time || 'hiru', area: scene.dataset.area || 'L' });
  const idleLike = () => { const p = state().phase; return p === 'idle' || p === 'caught'; };
  const palOf = el => { const m = el && /friend-([a-z]+)-s\.webp/.exec(el.getAttribute('src') || ''); return m ? m[1] : ''; };
  const pals = () => ['friend-a', 'friend-b'].map(id => $(id)).filter(Boolean);
  const palEl = name => pals().find(el => palOf(el) === name);
  const at = el => ({ x: parseFloat(el.style.left) || 50, y: parseFloat(el.style.top) || 60 });
  const shore = x => 58 + .16 * x;   // 本体と おなじ：みずぎわの たかさ（%）

  // ─── 見た目（CSS）───
  const css = make('style');
  css.textContent = `
#scene .hm-hot{position:absolute;z-index:6;padding:0;margin:0;border:0;background:none;box-shadow:none;min-height:0;min-width:0;border-radius:18px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:none;-webkit-backdrop-filter:none;backdrop-filter:none}
#scene .hm-hot::before{display:none}
#scene .hm-hot:active:not(:disabled){transform:none;box-shadow:none}
#scene .hm-hot:focus-visible{outline:3px solid #fff;outline-offset:2px;box-shadow:0 0 0 6px #286b88aa}
#scene .hm-hot[hidden]{display:none}
.hm-fog{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,#ffffff00 18%,#ffffffb0 52%,#ffffff70 100%);opacity:0;transition:opacity 3s ease}
.hm-fog.on{opacity:1}
.hm-deer{position:absolute;z-index:1;width:14%;aspect-ratio:1/1;object-fit:contain;transform:translate(-50%,-100%);pointer-events:none;opacity:0;transition:opacity .8s}
.hm-deer.on{opacity:1}
.hm-beam{position:absolute;z-index:1;left:83.7%;top:13%;width:88%;height:26%;margin-top:-13%;transform-origin:0 50%;background:linear-gradient(90deg,#fff8c8c0,#fff8c800);clip-path:polygon(0 44%,100% 0,100% 100%,0 56%);pointer-events:none;mix-blend-mode:screen;animation:hm-sweep 14s ease-in-out infinite alternate}
@keyframes hm-sweep{from{transform:rotate(166deg)}to{transform:rotate(198deg)}}
.hm-glow{position:absolute;z-index:1;left:83.7%;top:13%;width:26%;aspect-ratio:1/1;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff6b8f0 0,#fff6b866 34%,#fff6b800 70%);pointer-events:none;animation:hm-pulse 5.2s ease-in-out infinite}
@keyframes hm-pulse{0%,100%{opacity:.75}50%{opacity:1}}
.hm-jelly{position:absolute;z-index:1;left:24%;top:88%;font-size:1.5rem;line-height:1;filter:drop-shadow(0 0 8px #bfefff) drop-shadow(0 0 3px #fff);pointer-events:none;opacity:0;transition:opacity 2.4s;animation:hm-bob 4.2s ease-in-out infinite alternate}
.hm-jelly.on{opacity:.95}
@keyframes hm-bob{from{transform:translateY(-3px) scale(1)}to{transform:translateY(4px) scale(1.08)}}
.hm-win{position:absolute;z-index:1;left:46.7%;top:35.6%;width:8.6%;aspect-ratio:1/1;transform:translate(-50%,-50%);border-radius:50%;overflow:hidden;background:linear-gradient(#5c8fbf,#1d3e66);border:3px solid #c9a23a;box-shadow:0 0 0 2px #fff8,0 0 12px #ffe9a0aa;pointer-events:none;opacity:0;transition:opacity 1s}
.hm-win.on{opacity:1}
.hm-win svg{position:absolute;left:0;top:22%;width:220%;height:56%}
.hm-rabbit{position:absolute;z-index:1;left:78.3%;top:15.3%;width:16%;aspect-ratio:5/4;transform:translate(-50%,-52%);pointer-events:none;opacity:0;transition:opacity 1.2s}
.hm-rabbit.on{opacity:.9}
.hm-rabbit svg{width:100%;height:100%;overflow:visible}
.hm-rabbit .kine{transform-box:fill-box;transform-origin:100% 100%}
#hm-note{padding:16px}
#hm-note .hm-sub{text-align:center;margin:0 0 10px;font-size:.9rem;line-height:1.7}
#hm-list{display:grid;gap:8px;margin:0 0 12px}
.hm-card{display:grid;grid-template-columns:3.2rem 1fr;gap:4px 10px;align-items:center;border:2px solid #d5e6ed;border-radius:14px;padding:8px 10px;background:#fff}
.hm-card .hm-sil{grid-row:1 / span 2;font-size:2rem;text-align:center;filter:brightness(0) opacity(.72);line-height:1}
.hm-card h3{margin:0;font-size:1rem;line-height:1.5}
.hm-card p{margin:0;font-size:.9rem;line-height:1.6}
.hm-card small{color:#506874}
.hm-card button{grid-column:1 / span 2;min-height:48px;font-size:.9rem}
#hm-live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@media(prefers-reduced-motion:reduce){.hm-beam,.hm-glow,.hm-jelly{animation:none}.hm-fog,.hm-jelly,.hm-win,.hm-rabbit,.hm-deer{transition:none}}
.hm-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
#hm-word{padding:16px}
#hm-word .hm-sub{text-align:center;margin:0 0 10px;font-size:.9rem;line-height:1.7}
.hm-wrow{display:flex;gap:8px;align-items:stretch;margin:0 0 8px}
.hm-wrow input{flex:1;min-width:0;min-height:48px;font-size:1.05rem;padding:6px 12px;border:3px solid #bfdce8;border-radius:14px;color:#244653;background:#fff;font-family:inherit}
.hm-wrow input:focus-visible{outline:3px solid #286b88;outline-offset:2px}
.hm-wrow button{flex:none;min-height:48px;min-width:88px}
#hm-word-msg{min-height:3.4em;margin:6px 0 12px;text-align:center;font-weight:800;line-height:1.7;color:#244653}
#hm-word-msg.hit{color:#1f6a4a}
#hm-word-msg.pop{animation:hm-pop .7s ease-out}
@keyframes hm-pop{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
#hm-toast{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:7000;width:min(420px,calc(100vw - 24px));padding:12px 14px;border:3px solid #f0c060;border-radius:18px;background:#fff9e0;color:#5a3a10;text-align:center;box-shadow:0 8px 24px #0003}
#hm-toast p{margin:0;font-weight:900;line-height:1.6}
#hm-toast small{display:block;margin:2px 0 8px;font-size:.9rem;color:#6a4a1a}
#hm-toast .hm-trow{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
#hm-toast button{min-height:48px;min-width:120px;font-size:.9rem}
:root[data-inapp=x] #hm-note,:root[data-inapp=x] #hm-word{max-height:calc(100dvh - 64px);margin:8px auto auto;overflow:auto}
@media(prefers-reduced-motion:reduce){#hm-word-msg.pop{animation:none}}
#scene .hm-boat{width:14%;min-width:44px;min-height:44px;aspect-ratio:1/1;transform:translate(-50%,-70%)}
.hm-boat svg{display:block;width:100%;height:100%;filter:drop-shadow(0 2px 2px #0b2a4a55);animation:hm-rock 2.4s ease-in-out infinite alternate}
@keyframes hm-rock{from{transform:rotate(-4deg) translateY(-1px)}to{transform:rotate(4deg) translateY(2px)}}
.hm-rainbow{pointer-events:none;opacity:0;transition:opacity 2.6s ease}
.hm-rainbow.on{opacity:.42}
.hm-crabbox{display:flex;flex-direction:column;align-items:center;gap:4px;margin:0 0 12px}
.hm-crabtrack{position:relative;width:100%;height:56px;overflow:hidden}
.hm-crab{position:absolute;left:0;top:4px;width:56px;height:48px;min-width:0;min-height:0;padding:0;border:0;background:none;box-shadow:none;border-radius:12px;cursor:pointer;-webkit-backdrop-filter:none;backdrop-filter:none;transition:none;animation:hm-scuttle 7s ease-in-out infinite alternate}
.hm-crab::before{display:none}
.hm-crab:active:not(:disabled){transform:none;box-shadow:none}
.hm-crab svg{width:100%;height:100%;display:block}
.hm-crab:focus-visible{outline:3px solid #286b88;outline-offset:2px;background:#ffffffb3}
@keyframes hm-scuttle{from{left:0}to{left:calc(100% - 56px)}}
.hm-crabmsg{margin:0;font-size:.9rem;line-height:1.6;text-align:center;font-weight:800;min-height:1.6em}
@media(prefers-reduced-motion:reduce){.hm-boat svg,.hm-crab{animation:none}.hm-crab{left:calc(50% - 28px)}.hm-rainbow{transition:none}}
`;
  document.head.append(css);

  // ─── さわる ひみつ（本当の ボタン）───
  const HOTS = {
    toudai: { label: 'とうだい', box: [76, 8, 16, 30], when: s => s.area === 'H' && s.time === 'yoru' },
    marumado: { label: 'まるまど', box: [40, 27, 13, 18], when: s => s.area === 'B' && (s.time === 'yuu' || s.time === 'yoru') },
    tsuki: { label: 'つき', box: [71.5, 10, 14.5, 21], when: s => s.time === 'yoru' && s.area !== 'H' }
  };
  for (const [key, h] of Object.entries(HOTS)) {
    const b = make('button'); b.type = 'button'; b.className = 'hm-hot'; b.hidden = true; b.dataset.hm = key; b.setAttribute('aria-label', h.label);
    b.style.cssText = `left:${h.box[0]}%;top:${h.box[1]}%;width:${h.box[2]}%;height:${h.box[3]}%`;
    h.el = b; h.taps = 0; scene.append(b);
    b.addEventListener('click', () => tapHot(key));
  }
  const tapHot = key => {
    const h = HOTS[key]; h.taps++;
    tone(196, .07, 'round', 0, .04); if (h.taps < 3) { say(h.label + 'を さわったよ。'); return; }
    h.taps = 0; ({ toudai: toudaiLight, marumado: marumadoPass, tsuki: tsukiRabbit })[key]();
  };

  // ─── つり4 みなとまちの とうだい（3かい さわる）───
  let lit = null;
  function toudaiLight() {
    if (lit) { say('とうだいの あかりは ついて いるよ。'); return; }
    const beam = make('div', 'hm-beam'), glow = make('div', 'hm-glow'), jelly = make('div', 'hm-jelly', '🪼');
    beam.setAttribute('aria-hidden', 'true'); glow.setAttribute('aria-hidden', 'true'); jelly.setAttribute('aria-hidden', 'true');
    scene.append(beam, glow, jelly); setTimeout(() => jelly.classList.add('on'), 30);
    lit = { beam, glow, jelly };
    tone(110, 1.1, 'triangle', 0, .07, 96); tone(880, .12, 'triangle', .9, .04); markFound('tsuri-toudai');
    say('とうだいに あかりが ついたよ。ひかりの おびが、ゆっくり うみを なでて いるよ。');
  }
  function toudaiOff() { if (!lit) return; Object.values(lit).forEach(e => e.remove()); lit = null; }

  // ─── つり5 ふねの まるまど（3かい さわる）───
  let windowBusy = false;
  function marumadoPass() {
    if (windowBusy) return; windowBusy = true;
    const win = make('div', 'hm-win', '<svg viewBox="0 0 120 50" aria-hidden="true"><path d="M4 30 Q10 8 50 10 Q88 12 100 28 Q108 20 118 12 Q116 26 112 34 Q116 40 120 46 Q106 42 100 38 Q80 46 46 44 Q14 44 4 30Z" fill="#12283f"/></svg>');
    win.setAttribute('aria-hidden', 'true'); scene.append(win); setTimeout(() => win.classList.add('on'), 30);
    const whale = win.firstElementChild;
    if (!reduced()) whale.animate([{ transform: 'translateX(70%)' }, { transform: 'translateX(-95%)' }], { duration: dur(5500), easing: 'ease-in-out', fill: 'forwards' });
    else whale.style.transform = 'translateX(-10%)';
    tone(240, 2.4, 'triangle', 0, .06, 88); [0, 1, 2].forEach(i => tone(700 + i * 90, .05, 'triangle', .3 + i * .35, .02, 900 + i * 90));
    markFound('tsuri-marumado'); say('まどの むこうを、なにか おおきな かげが とおったよ。');
    later(() => { win.classList.remove('on'); later(() => { win.remove(); windowBusy = false; }, 1100); }, 6600);
  }

  // ─── つり10 つきの うさぎ（3かい さわる）───
  let rabbitBusy = false;
  function tsukiRabbit() {
    if (rabbitBusy) return; rabbitBusy = true;
    const g = make('div', 'hm-rabbit', '<svg viewBox="0 0 100 80" aria-hidden="true"><g fill="#4d5478"><ellipse cx="34" cy="20" rx="6" ry="17" transform="rotate(-8 34 20)"/><ellipse cx="48" cy="19" rx="6" ry="17" transform="rotate(10 48 19)"/><circle cx="42" cy="40" r="13"/><ellipse cx="44" cy="62" rx="17" ry="14"/><path d="M62 74 h30 l-5 -20 h-20z"/></g><g class="kine"><rect x="56" y="30" width="5" height="34" rx="2" fill="#4d5478" transform="rotate(24 58 64)"/><rect x="46" y="22" width="20" height="11" rx="5" fill="#4d5478" transform="rotate(24 58 64)"/></g></svg>');
    g.setAttribute('aria-hidden', 'true'); scene.append(g); setTimeout(() => g.classList.add('on'), 30);
    if (!reduced()) g.querySelector('.kine').animate([{ transform: 'rotate(-28deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-28deg)' }], { duration: dur(900), iterations: 8, easing: 'ease-in-out' });
    for (let i = 0; i < 8; i++) later(() => { tone(130, .1, 'triangle', 0, .06, 92); zap(.03, 0, .03); }, 450 + i * 900);
    markFound('tsuri-tsuki'); say('つきに、もちを つく うさぎの かげが みえたよ。');
    const usagi = palEl('usagi');
    if (usagi) { const p = at(usagi), b = make('div', 'bubble', 'あ、おつきさまに うさぎ！'); b.setAttribute('aria-hidden', 'true'); b.style.left = p.x + '%'; b.style.top = (p.y - 19) + '%'; scene.append(b); later(() => b.remove(), 3600); }
    later(() => { g.classList.remove('on'); later(() => { g.remove(); rabbitBusy = false; }, 1300); }, 8200);
  }

  // ─── つり2 あさぎりの こじか（みずうみ・あさ・なげずに 20びょう）───
  let deerBusy = false, deerDone = false;
  function deerEvent() {
    deerBusy = deerDone = true;
    const fog = make('div', 'hm-fog'), deer = make('img', 'hm-deer'), x = 62, y = shore(x) - 1;
    fog.setAttribute('aria-hidden', 'true'); deer.setAttribute('aria-hidden', 'true'); deer.alt = ''; deer.src = 'img/friend-kojika-s.webp'; deer.draggable = false;
    deer.style.top = y + '%'; deer.style.left = (reduced() ? x : 112) + '%'; deer.style.transition = reduced() ? 'opacity .8s' : 'opacity .8s,left ' + dur(5000) + 'ms linear';
    scene.append(fog, deer); setTimeout(() => { fog.classList.add('on'); }, 30);
    if (reduced()) fog.style.transition = 'none', fog.style.opacity = '.6';
    say('きりが かかって きたよ。きりの むこうから、こじかが きたよ。');
    zap(.9, 0, .03, .3); zap(.9, .7, .022, -.3);
    later(() => {
      deer.classList.add('on');
      if (!reduced()) {
        deer.style.left = x + '%';
        let steps = 0; const walk = setInterval(() => { tone(steps++ % 2 ? 196 : 165, .04, 'triangle', 0, .02, 0, Math.max(-.9, Math.min(.9, (parseFloat(getComputedStyle(deer).left) / scene.clientWidth * 100 - 50) / 45))); }, dur(380));
        later(() => clearInterval(walk), 5000);
      }
    }, 1200);
    later(() => {
      const b = make('div', 'bubble', '…おはよう。ここの みず、おいしいね'); b.setAttribute('aria-hidden', 'true'); b.style.left = x + '%'; b.style.top = (y - 15) + '%'; scene.append(b);
      say('こじかが「…おはよう。ここの みず、おいしいね」って いったよ。'); markFound('tsuri-kojika');
      [0, 1, 2].forEach(i => { zap(.06, i * .7, .03, .1); tone(700 + i * 40, .04, 'triangle', i * .7, .03, 820); });
      later(() => b.remove(), 4300);
    }, 6400);
    later(() => { if (!reduced()) deer.style.left = '112%'; else deer.classList.remove('on'); fog.classList.remove('on'); }, 11200);
    later(() => { fog.remove(); deer.remove(); deerBusy = false; }, 17000);
  }

  // ─── つり7 ねこの ひるね（ねこが となりに いる ひる・なげずに 30びょう）───
  let nap = null;
  function napStart() {
    const pal = palEl('neko'); if (!pal || nap) return;
    const b = make('div', 'bubble', 'すや すや…'); b.setAttribute('aria-hidden', 'true'); scene.append(b);
    nap = { pal, b, anim: null, breath: 0 };
    if (!reduced()) nap.anim = pal.animate([{ scale: '1 1' }, { scale: '1.04 .96' }, { scale: '1 1' }], { duration: dur(4200), iterations: Infinity, easing: 'ease-in-out' });
    nap.breath = setInterval(() => tone(150, .9, 'triangle', 0, .018, 120), dur(4200));
    napFollow(); markFound('tsuri-neko'); say('ねこが ひるねを はじめたよ。すや すや…');
  }
  function napFollow() { if (!nap) return; const p = at(nap.pal); nap.b.style.left = p.x + '%'; nap.b.style.top = (p.y - 24) + '%'; }
  function napEnd(byCast) {
    if (!nap) return;
    const { pal, b, anim, breath } = nap; nap = null; clearInterval(breath); if (anim) anim.cancel();
    if (byCast) {
      b.textContent = 'にゃっ！ …ねてないよ'; const p = at(pal); b.style.left = p.x + '%'; b.style.top = (p.y - 24) + '%';
      tone(1047, .06, 'round', 0, .03); tone(1319, .08, 'round', .07, .03); say('ねこが「にゃっ！ …ねてないよ」って いったよ。'); later(() => b.remove(), 2600);
    } else b.remove();
  }

  // ─── ひみつで もらえる かざり（おへやの かざり）：ひみつの 鍵の gifts に 足す（さいだい 3こ・いっぱいでも おこらない）。ほかの ページが 書いた 物は そのまま ───
  function giveGift(id) {
    const d = readJSON(HM_KEY) || {}; if (!d.gifts || typeof d.gifts !== 'object' || Array.isArray(d.gifts)) d.gifts = {};
    const have = Math.max(0, Math.floor(Number(d.gifts[id]) || 0)), full = have >= 3;
    if (!full) d.gifts[id] = have + 1; d.v = 1;
    try { localStorage.setItem(HM_KEY, JSON.stringify(d)); } catch {}
    return { n: full ? have : have + 1, full };
  }
  const giftHave = id => { const d = readJSON(HM_KEY); return d && d.gifts && typeof d.gifts === 'object' && !Array.isArray(d.gifts) ? Math.max(0, Math.floor(Number(d.gifts[id]) || 0)) : 0; };
  const decorArt = (name, size, fallback) => { try { const D = window.TsuriTank && window.TsuriTank.decor; const s = D && typeof D.markup === 'function' ? D.markup(name, size) : ''; if (s) return s; } catch {} return fallback; };

  // ─── つり3 パンダの ささぶね（かわ・パンダが となりに いる・なげずに 25びょう）───
  //   かわの 川上（みぎ）から ささぶねが ゆっくり ながれて くる（14びょう・かわの きしに そって）。ながれて いる 間は「ささぶね。ひろう」の ボタン（さわる・Tab と Enter）。
  //   ひろうと おへやの かざり「ささぶね」に なる（ひみつの 鍵の gifts.sasabune・さいだい 3こ）。ひろわなくても なにも へらない（そのまま ながれて いく）。かわを はなれて もどると また ながれる。つりの 最中は ボタンを とめる
  let boat = null, boatDone = false;
  const boatFallback = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M2 22 C8 22 10 34 20 34 C30 34 32 22 38 22 C33 30 28 31 20 31 C12 31 7 30 2 22Z" fill="#8fe0a8" stroke="#4fae7c" stroke-width="2" stroke-linejoin="round"/></svg>';
  function boatEvent() {
    if (boat) return; boatDone = true;
    const el = make('button', 'hm-hot hm-boat'); el.type = 'button'; el.setAttribute('aria-label', 'ささぶね。ひろう'); el.innerHTML = decorArt('ささぶね', 40, boatFallback);
    const sv = el.querySelector('svg'); if (sv) sv.setAttribute('aria-hidden', 'true');
    const lvl = x => shore(x) + 9, x0 = 106, x1 = -8, still = reduced();
    el.style.left = (still ? 50 : x0) + '%'; el.style.top = lvl(still ? 50 : x0) + '%'; scene.append(el);
    boat = { el, anim: null };
    if (!still) { boat.anim = el.animate([{ left: x0 + '%', top: lvl(x0) + '%' }, { left: x1 + '%', top: lvl(x1) + '%' }], { duration: dur(14000), easing: 'linear', fill: 'forwards' }); boat.anim.onfinish = () => boatLeave(false); }
    else later(() => boatLeave(false), 14000);
    el.addEventListener('click', boatPick);
    zap(.9, 0, .02, .3); zap(.9, .8, .015, -.3); tone(1319, .05, 'triangle', .3, .02);
    say('かわの うえから、ささぶねが ながれて きたよ。ボタンで ひろえるよ。');
  }
  function boatLeave(picked) { if (!boat) return; const b = boat; boat = null; if (b.anim) b.anim.cancel(); b.el.remove(); if (!picked) say('ささぶねは、かわしもへ ながれて いったよ。'); }
  function boatPick() {
    if (!boat) return; const r = giveGift('sasabune'); markFound('tsuri-sasabune'); boatLeave(true);
    chord([1047, 1319, 1568], .07, 'triangle', .04);
    say(r.full ? 'ささぶねは もう いっぱい もって いるよ。おへやに かざって あげてね。' : 'ささぶねを ひろったよ。おへやに かざれるよ。');
    const pa = palEl('panda'); if (pa) { const p = at(pa), b = make('div', 'bubble', 'ささぶね、いいね'); b.setAttribute('aria-hidden', 'true'); b.style.left = p.x + '%'; b.style.top = (p.y - 19) + '%'; scene.append(b); later(() => b.remove(), 3000); }
  }

  // ─── つり6 あめあがりの にじ（あめの ひ・よる いがい・その 回で 5ひき つる）───
  //   本体の きろく save.total（つった かず）が ひらいた ときより 5 ふえたら、あめが やんで（#ame が すうっと きえて data-rain が false に なる）、やまの うしろの おおぞらに うすい にじが かかる（ド・ミ・ソ・ド）。
  //   にじは 「そらの そう」（svg.land の やまより うしろ）に えがく：やまや キャラの うえには のらない。ほそく・ふちを ぼかして・2ふんはん（150びょう）で すうっと きえる
  //   ひらき なおしても 2ふんはんの あいだだけは しずかに 出る（ひみつの 鍵に 日づけと じこくを のこす）。
  //   しるし：#scene[data-rainbow="true"]（本体の しゃしんが おなじ ばしょに にじを うつす 口に つかえる）。よるには 出ない。あめの ひだけ
  const isRainy = () => scene.dataset.rain === 'true';
  const totalNow = () => Math.max(0, Math.floor(Number((readJSON(MAIN_KEY) || {}).total) || 0));
  const dayNow = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  // 600×450 の けしき（svg.land と おなじ 4:3）で：みぎよせ・はば 65%・いちばん うえの ふちが てっぺんの すぐ した。あしは やまの うしろに かくれる
  const RB = { cx: 392, cy: 200, r0: 190, step: 7, w: 8, ms: 150000 };
  const RAINBOW = ['#ff9a9a', '#ffc48a', '#fff09a', '#a6e6a0', '#9ccbff', '#c9a8f5'].map((c, i) => { const r = RB.r0 - i * RB.step; return `<path d="M${RB.cx - r} ${RB.cy} A${r} ${r} 0 0 1 ${RB.cx + r} ${RB.cy}" fill="none" stroke="${c}" stroke-width="${RB.w}"/>`; }).join('');
  let rainbow = null, rainbowEnd = 0, total0 = totalNow(), rainbowLoud = false;
  function stopRain(soft) {   // あめを やませる：つぶを すうっと うすくしてから data-rain を false に（ほかの そとづけも この しるしを みて あめあがりに なる）
    const ame = document.getElementById('ame');
    const done = () => { if (ame) { ame.style.transition = ''; ame.style.opacity = ''; } scene.dataset.rain = 'false'; };
    if (soft && ame && !reduced()) { ame.style.transition = 'opacity 2.4s ease'; ame.style.opacity = '0'; later(done, 2500); } else done();
  }
  function showRainbow(loud, left) {
    if (rainbow) return;
    const land = scene.querySelector('svg.land'); if (!land) return;
    const hill = land.querySelector('path[style*="--hill"]'), NS = 'http://www.w3.org/2000/svg', tmp = document.createElementNS(NS, 'svg');
    tmp.innerHTML = `<g class="hm-rainbow" aria-hidden="true"><defs><filter id="hm-rbblur"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g filter="url(#hm-rbblur)">${RAINBOW}</g></g>`;
    const el = tmp.firstChild; if (hill) hill.before(el); else land.append(el);   // やまの すぐ うしろ（そらの うえ・やまの した）
    rainbow = el; rainbowEnd = clock() + (left || RB.ms); scene.dataset.rainbow = 'true';
    later(() => el.classList.add('on'), loud ? 1500 : 30);
    if (loud) {
      chord([523, 659, 784, 1047], .12, 'triangle', .05); say('あめが やんで きたよ。にじが でてる');
      const d = readJSON(HM_KEY) || {}; d.rainbow = dayNow(); d.rainbowAt = Date.now(); d.v = 1; try { localStorage.setItem(HM_KEY, JSON.stringify(d)); } catch {}
      markFound('tsuri-nijii');
    }
  }
  function hideRainbow(now) {
    if (!rainbow) return; const el = rainbow; rainbow = null; delete scene.dataset.rainbow; el.classList.remove('on');
    if (now || reduced()) el.remove(); else later(() => el.remove(), 2800);
  }
  function rainCheck(s) {   // ひらき なおしても、にじの 2ふんはんの あいだ（あめが やんで いる あいだ）は しずかに 出す
    if (!isRainy() || rainbow || s.time === 'yoru') return;
    const d = readJSON(HM_KEY) || {}, left = RB.ms - (Date.now() - Number(d.rainbowAt || 0));
    if (d.rainbow === dayNow() && left > 3000 && left <= RB.ms) { stopRain(false); showRainbow(false, left); }
  }

  // ─── つり8 バケツの やどかり（バケツを 5かい のぞく）───
  //   バケツを ひらく たびに かぞえて、5かいめ（10・15…）に、なかに やどかりが いる（バケツの まどの なかを かさかさ あるく）。さわると おへやの かざりに なる（gifts.yadokari・さいだい 3こ）。
  //   3こ もって いれば もう でない。ひろわなくても なにも へらない。とじると きえる
  let bucketOpens = 0, crabBox = null;
  const crabFallback = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M33 32 Q40 8 22 7 Q10 8 13 26 Q15 31 33 32Z" fill="#ffe3c4" stroke="#d98a5a" stroke-width="2"/><path d="M14 33 Q24 38 33 33 L32 28 L14 28Z" fill="#ff9a7a" stroke="#d96f40" stroke-width="1.6"/></svg>';
  function crabHide() { if (crabBox) { crabBox.remove(); crabBox = null; } }
  function crabShow() {
    if (!bucket || crabBox || giftHave('yadokari') >= 3) return;
    const box = make('div', 'hm-crabbox'), track = make('div', 'hm-crabtrack'), b = make('button', 'hm-crab'), msg = make('p', 'hm-crabmsg');
    b.type = 'button'; b.setAttribute('aria-label', 'バケツの なかに やどかり。さわる'); b.innerHTML = decorArt('やどかり', 48, crabFallback); const sv = b.querySelector('svg'); if (sv) sv.setAttribute('aria-hidden', 'true');
    msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite'); msg.textContent = 'バケツの なかに、やどかりが いたよ。さわると なかよしに なるよ。';
    track.append(b); box.append(track, msg); const close = bucket.querySelector('.close'); if (close) close.before(box); else bucket.append(box); crabBox = box;
    zap(.04, 0, .03); [0, 1, 2].forEach(i => zap(.03, .12 + i * .1, .03));
    b.addEventListener('click', () => {
      const r = giveGift('yadokari'); markFound('tsuri-yadokari'); chord([784, 988, 1175], .07, 'triangle', .04);
      msg.textContent = r.full ? 'やどかりは もう いっぱい いるよ。おへやに かざって あげてね。' : 'やどかりが、すいそうに ひっこしたいって。おへやに かざれるよ。'; track.remove();
    });
  }

  // ─── まわして みる：ようすが かわった時の あとしまつ・さわる ボタンの 出し入れ ───
  let lastKey = '', idleSince = clock();
  function update() {
    const s = state(), key = s.area + '/' + s.time, moving = s.phase === 'bite' || s.phase === 'reel';
    if (key !== lastKey) { lastKey = key; idleSince = clock(); boatDone = false; if (boat) boatLeave(true); }
    if (boat) boat.el.hidden = moving;
    if (rainbow && s.time === 'yoru') hideRainbow(true);
    else if (rainbow && clock() >= rainbowEnd) hideRainbow(false);   // 2ふんはんで すうっと きえる
    rainCheck(s);
    for (const h of Object.values(HOTS)) { const ok = h.when(s); h.el.hidden = !ok || moving; if (!ok) h.taps = 0; }
    if (!HOTS.toudai.when(s)) toudaiOff();
    if (nap && (s.time !== 'hiru' || !palEl('neko') || nap.pal !== palEl('neko'))) napEnd(false);
    if (nap && (s.phase === 'waiting' || s.phase === 'bite' || s.phase === 'reel')) napEnd(true);
    if (!idleLike()) idleSince = clock();
  }
  function tick() {
    update(); napFollow();
    if (muted || !idleLike()) return;
    const s = state(), waited = clock() - idleSince;
    if (!deerBusy && !deerDone && s.area === 'L' && s.time === 'asa' && waited >= 20000 && !pals().some(el => palOf(el) === 'kojika')) deerEvent();
    if (!nap && s.time === 'hiru' && waited >= 30000 && palEl('neko')) napStart();
    if (!boat && !boatDone && s.area === 'R' && waited >= 25000 && palEl('panda')) boatEvent();
    if (isRainy() && s.time !== 'yoru' && !rainbow && !rainbowLoud && totalNow() - total0 >= 5) { rainbowLoud = true; stopRain(true); showRainbow(true); }   // はじめて かかる ときだけ おと・ことば（あめが やんでから にじ）
  }
  new MutationObserver(update).observe(scene, { attributes: true, attributeFilter: ['data-phase', 'data-time', 'data-area', 'data-rain'] });
  pals().forEach(el => new MutationObserver(update).observe(el, { attributes: true, attributeFilter: ['src'] }));
  setInterval(tick, 500);
  update();

  // ─── ひみつノート（バケツの なかから ひらく。見つけた ものだけ。数・割合は 出さない）───
  const TIME_LABEL = { asa: 'あさ', hiru: 'ひる', yuu: 'ゆうがた', yoru: 'よる' };
  const NOTE = {
    'tsuri-kojika': ['🦌', 'あさぎりの こじか', 'きりの むこうから、こじかが みずを のみに きたよ。'],
    'tsuri-toudai': ['🗼', 'とうだいの あかり', 'とうだいに あかりが ついて、ひかりの おびが うみを なでたよ。'],
    'tsuri-marumado': ['🐋', 'まるまどの かげ', 'まるまどの むこうを、おおきな かげが ゆっくり とおったよ。'],
    'tsuri-neko': ['🐈', 'ねこの ひるね', 'ねこが すやすや ひるねを はじめたよ。'],
    'tsuri-tsuki': ['🐇', 'つきの うさぎ', 'つきに、もちを つく うさぎの かげが みえたよ。'],
    'tsuri-sasabune': ['🎍', 'パンダの ささぶね', 'かわで パンダと ゆっくり して いたら、ささぶねが ながれて きたよ。おへやに かざれるよ。'],
    'tsuri-nijii': ['🌈', 'あめあがりの にじ', 'あめの ひに たくさん つったら、あめが やんで にじが でたよ。'],
    'tsuri-yadokari': ['🐚', 'バケツの やどかり', 'バケツを なんども のぞいたら、やどかりが でて きたよ。おへやに かざれるよ。'],
    'heya-lamp': ['💡', 'ほしぞらの へや', 'ランプを けしたら、かべが ほしぞらに なったよ。'],
    'heya-onigiri': ['🍙', 'おにぎり はんぶんこ', 'つくえの うえの おにぎりを、なかまと はんぶんこ したよ。'],
    'heya-utouto': ['💤', 'まるふわの うとうと', 'まるふわが おへやで うとうと ねむったよ。'],
    'heya-bin': ['🍾', 'ほしの びん', 'びんの なかで、ほしが ひかったよ。'],
    'heya-mori': ['🌿', 'ちいさな もり', 'ちいさな もりで、さかなが やすんで いたよ。'],
    'heya-okaeshi': ['💗', 'ごはんの おれい', 'さかなたちが、ありがとう って いってる みたいだったよ。'],
    'heya-uta': ['🎵', 'すいそうの うた', 'まるふわが、すいそうの うたを うたったよ。'],
    'heya-parade': ['🎺', 'さかなの パレード', 'かざりを 6しゅるい ぜんぶ おいたら、さかなが ぐるっと パレードを したよ。'],
    'hiroba-wish': ['⭐', 'ふんすいの ねがいぼし', 'ふんすいを 3かい さわって、ねがいごとを したよ。'],
    'hiroba-sun': ['☀️', 'おひさまの ぽかぽか', 'おひさまを さわったら、ぽかぽか したよ。'],
    'hiroba-cloud': ['☁️', 'くもの ぽよん', 'くもが ぽよんと はねたよ。'],
    'hiroba-tree': ['🌳', 'きの はっぱ', 'きを さわったら、はっぱが ひらひら おちて きたよ。'],
    'hiroba-spin': ['🌀', 'まるふわの くるくる', 'まるふわが くるくると まわったよ。'],
    'hiroba-meteor': ['🌠', 'ひろばの ながれぼし', 'ひろばの よぞらに、ながれぼしが とんだよ。'],
    'hiroba-pond': ['🐟', 'いけの さかな', 'いけで さかなが ぴょんと はねたよ。'],
    'hiroba-bench': ['🪑', 'ベンチで ひとやすみ', 'ベンチで ゆっくり すわって いたら、なかまが となりに きて くれたよ。'],
    'hiroba-skip': ['🪨', 'いけの みずきり', 'いけの ほとりから、いしを なげて みたよ。ぴょん ぴょんと はねたよ。'],
    'hiroba-flower': ['🌷', 'おはなに みず', 'おはなに みずを あげたら、うれしそうに ゆれたよ。'],
    'hiroba-post': ['✉️', 'ポストの おてがみ', 'ポストを のぞいたら、ともだちからの おてがみが とどいて いたよ。'],
    'hiroba-care': ['🍙', 'ともだちの おせわ', 'ごはんや うわぎ、もうふを あげたら、すこし よろこんで くれたよ。'],
    'hiroba-sweep': ['🧹', 'ひろばの おそうじ', 'おちばを はいたら、ひろばが さっぱり したよ。'],
    'hiroba-lamp': ['🏮', 'あかりを ともす', 'よるの がいとうに あかりを ともしたよ。'],
    'hiroba-trace': ['🌼', 'なかまの あと', 'ひろばに なかまの あとを みつけたよ。'],
    'hiroba-return': ['🌷', 'おかえり', 'また きたら、はなだんに おはなが さいて いたよ。'],
    'hiroba-season': ['🎆', 'きせつの おたのしみ', 'きせつの ふぶきや はなびを みたよ。'],
    'hiroba-wishstar': ['🌟', 'ねがいの ほし', 'つりばで ねがった ぶんだけ、よるの ひろばの そらに ほしが ふえるよ。'],
    'hiroba-group': ['📷', 'みんなで しゃしん', 'なかまが ぜんいん あつまって きたよ。'],
    'hiroba-kouji': ['🚧', 'かんばんの うら', 'じゅんびちゅうの かんばんの うらに、なにか かいて あったよ。'],
    'hiroba-drop': ['🍂', 'きせつの おとしもの', 'きを ゆらしたら、きせつの ものが おちて きたよ。おへやに かざれるよ。'],
    'hiroba-plush': ['🧸', 'ぬしの ぬいぐるみ', 'ぬしを つった さかなの ぬいぐるみが、ベンチの うえで まって いたよ。'],
    'hiroba-thanks': ['🌟', 'ありがとうの ほしぞら', 'ありがとうの いしを ひらいて、あそんで くれた ひとの ほしを みたよ。'],
    'kotoba-hajimari': ['✨', 'はじめの ことば', 'ひみつの ことばを みつけたよ。ことばは、これから ふえるかも しれないよ。']
  };
  const REPLAY = {
    'tsuri-kojika': () => { zap(.9, 0, .03, .3); [0, 1, 2, 3, 4].forEach(i => tone(i % 2 ? 196 : 165, .04, 'triangle', .5 + i * .38, .02, 0, .5 - i * .2)); [0, 1, 2].forEach(i => { zap(.06, 2.6 + i * .7, .03, .1); tone(700 + i * 40, .04, 'triangle', 2.6 + i * .7, .03, 820); }); },
    'tsuri-toudai': () => { tone(110, 1.1, 'triangle', 0, .07, 96); tone(880, .12, 'triangle', .9, .04); },
    'tsuri-marumado': () => { tone(240, 2.4, 'triangle', 0, .06, 88); },
    'tsuri-neko': () => [0, 1].forEach(i => tone(150, .9, 'triangle', i * 1.4, .02, 120)),
    'tsuri-tsuki': () => { for (let i = 0; i < 4; i++) { tone(130, .1, 'triangle', i * .9, .06, 92); zap(.03, i * .9, .03); } },
    'tsuri-sasabune': () => { zap(.9, 0, .02, .3); zap(.9, .8, .015, -.3); tone(1319, .05, 'triangle', .3, .02); },
    'tsuri-nijii': () => chord([523, 659, 784, 1047], .12, 'triangle', .05),
    'tsuri-yadokari': () => { zap(.04, 0, .03); [0, 1, 2].forEach(i => zap(.03, .12 + i * .1, .03)); }
  };
  const bucket = $('bucket');
  { const openBucketBtn = $('open-bucket');   // バケツを ひらく たびに かぞえる（つり8 やどかり）。本体の ひらく しごとの あとで 動く（さきに 本体の 取りつけが おわって いる）
    if (openBucketBtn && bucket) { openBucketBtn.addEventListener('click', () => { crabHide(); bucketOpens++; if (bucketOpens % 5 === 0) crabShow(); }); bucket.addEventListener('close', crabHide); } }
  let noteBtn = null, noteDlg = null;
  function buildNote() {
    noteDlg = make('dialog', '', '<h2 id="hm-title">ひみつノート</h2><p class="hm-sub">みつけた ものが、ここに のこるよ。<br>また なにか みつけたら、ここに のこるよ。</p><div id="hm-list"></div><p id="hm-live" role="status" aria-live="polite"></p><button class="close" type="button">とじる</button>');
    noteDlg.id = 'hm-note'; noteDlg.setAttribute('aria-labelledby', 'hm-title');
    noteDlg.querySelector('.close').addEventListener('click', () => noteDlg.close());
    document.body.append(noteDlg);
  }
  function drawNote() {
    const list = noteDlg.querySelector('#hm-list'), found = foundMap();
    const rows = Object.entries(found).filter(([id]) => NOTE[id]).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).map(([id, info]) => {
      const [icon, title, text] = NOTE[id], d = new Date(info.at || 0), card = make('div', 'hm-card');
      const sil = make('b', 'hm-sil'); sil.textContent = icon; sil.setAttribute('aria-hidden', 'true');
      const h = make('h3'); h.textContent = title;
      const p = make('p'); p.textContent = text;
      const small = make('small'); small.textContent = (d.getMonth() + 1) + 'がつ' + d.getDate() + 'にち　' + (TIME_LABEL[info.time] || '');
      const box = make('div'); box.append(h, p, small);
      const again = make('button'); again.type = 'button'; again.textContent = 'もういちど きく'; again.setAttribute('aria-label', title + '。もういちど きく');
      again.addEventListener('click', () => replay(id));
      card.append(sil, box, again); return card;
    });
    list.replaceChildren(...rows);
  }
  function replay(id) {
    if (!NOTE[id]) return false;
    let text = NOTE[id][2];
    if (REPLAY[id]) asKind('ui', () => REPLAY[id]());
    else if (/^heya-/.test(id) && window.TsuriTank && typeof window.TsuriTank.replay === 'function') { const t = window.TsuriTank.replay(id); if (t) text = t; }
    else chord([988, 1319, 1568], .07);
    const live = $('hm-live'); if (live) live.textContent = text;
    return true;
  }
  function syncNoteButton() {
    if (!bucket) return;
    const any = Object.keys(foundMap()).some(id => NOTE[id]);
    if (!noteBtn) {
      noteBtn = make('button'); noteBtn.type = 'button'; noteBtn.id = 'hm-open'; noteBtn.textContent = 'ひみつノート'; noteBtn.style.cssText = 'display:block;margin:0 auto 12px;min-width:200px';
      noteBtn.addEventListener('click', () => { if (!noteDlg) buildNote(); drawNote(); noteDlg.showModal(); });
      const close = bucket.querySelector('.close'); if (close) close.before(noteBtn); else bucket.append(noteBtn);
    }
    noteBtn.hidden = !any;
  }
  syncNoteButton();
  addEventListener('storage', e => { if (e.key === HM_KEY) syncNoteButton(); });

  // ─── ひみつの ことば（合言葉）───
  //   ことばは ここに 書かない。SHA-256 の ハッシュ（塩つき）だけ 持つ。しらべるのは この 端末の 中だけ。
  const SALT = 'marufuwa-kotoba:';
  const SHA_K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function sha256hex(str) {   // 純粋な JS（https でない ページでも 動く・同じ 場所で 同期）。検査で crypto.subtle と 突きあわせる
    const msg = new TextEncoder().encode(String(str)), len = msg.length, total = (len + 9 + 63) & ~63, buf = new Uint8Array(total), dv = new DataView(buf.buffer);
    buf.set(msg); buf[len] = 0x80; dv.setUint32(total - 8, Math.floor(len * 8 / 0x100000000)); dv.setUint32(total - 4, (len * 8) >>> 0);
    const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]), w = new Uint32Array(64), rr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < total; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) { const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = w[i - 16] + s0 + w[i - 7] + s1; }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + SHA_K[i] + w[i]) >>> 0, S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
    }
    return [...h].map(x => x.toString(16).padStart(8, '0')).join('');
  }
  // ゆるく そろえる：全角・半角／カタカナ・ひらがな／大文字・小文字／空白・かなの 記号 を 気にしない
  const norm = s => String(s).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/[\s・、。，．,.!！?？~〜「」『』()（）\-_"'“”‘’]/g, '');
  const hashOf = word => sha256hex(SALT + norm(word));
  const WORDS = [   // { id: ひみつの 名前（found の 鍵）, h: [ことばの ハッシュ…（同じ ごほうびに つながる 言い方を 何個でも）] }
    { id: 'kotoba-hajimari', h: ['9c2a761530c68817a24a59230c50613e3479fce922d15b87500e1be69cacd02a', 'fcde406bfbf5b4d8bee6f784b2700a35ccd50fe698cd0c098ab3860ec5b4691c', '0dc033f9dd0da633b6606cc92fe5c39090814e1e5491bb9f112b7fc572b2d6ab', 'caf61c8c4a566376e8812b46d10ed1d4da2710161b314e10b7b78a3b0a5cdd4a'] }   // はじめの ことば：あいさつの ことば 4つ（だれでも 見つけられる。ひみつの しくみの ご案内）
  ];
  const T = {   // 画面に 出す ことば（ひらがな・翻訳表に 出せるように ここに まとめる）
    title: 'ひみつの ことば', open: 'ひみつの ことば', go: 'ためす', close: 'とじる',
    hint: 'ことばを しって いたら、ここに いれてね。まちがえても、なにも おこらないよ。',
    hit: 'ひみつの ことばが みつかったよ！', again: 'この ことばは もう みつけて いるよ。いつでも どうぞ。',
    none: 'みつからなかったよ。ことばが ちがうのかも。もういちど ためしてね。', empty: 'ことばを いれてね。',
    openNote: 'ひみつノートを ひらく'
  };
  const wordOf = text => { const n = norm(text); if (!n || n.length > 40) return null; const h = sha256hex(SALT + n); return WORDS.find(w => w.h.includes(h)) || null; };
  const titleOf = id => (NOTE[id] || [])[1] || '';
  const fanfare = () => { chord([988, 1319, 1568, 2093], .07, 'round', .04); tone(2637, .3, 'triangle', .35, .03); };
  function tryWord(text) {
    if (!norm(text)) return { ok: false, reason: 'empty' };
    const w = wordOf(text); if (!w) return { ok: false, reason: 'none' };
    const fresh = markFound(w.id), title = titleOf(w.id);
    try { window.dispatchEvent(new CustomEvent('tsuri-kotoba', { detail: { id: w.id, fresh, title } })); } catch {}
    return { ok: true, id: w.id, fresh, title };
  }
  let wordBtn = null, wordDlg = null;
  function buildWord() {
    wordDlg = make('dialog', '', '<h2 id="hm-word-title"></h2><p class="hm-sub"></p><div class="hm-wrow"><label class="hm-sr" for="hm-word-in"></label><input id="hm-word-in" type="text" maxlength="24" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done"><button id="hm-word-go" type="button"></button></div><p id="hm-word-msg" role="status" aria-live="polite"></p><button class="close" type="button"></button>');
    wordDlg.id = 'hm-word'; wordDlg.setAttribute('aria-labelledby', 'hm-word-title');
    wordDlg.querySelector('#hm-word-title').textContent = T.title; wordDlg.querySelector('.hm-sub').textContent = T.hint; wordDlg.querySelector('label').textContent = T.title;
    wordDlg.querySelector('#hm-word-go').textContent = T.go; wordDlg.querySelector('.close').textContent = T.close;
    const input = wordDlg.querySelector('#hm-word-in'), msg = wordDlg.querySelector('#hm-word-msg');
    const go = () => {
      const r = tryWord(input.value); msg.classList.remove('hit', 'pop'); void msg.offsetWidth;
      if (r.ok) { msg.textContent = (r.fresh ? T.hit : T.again) + '　' + r.title; msg.classList.add('hit'); if (!reduced()) msg.classList.add('pop'); fanfare(); input.value = ''; }
      else msg.textContent = r.reason === 'empty' ? T.empty : T.none;
    };
    wordDlg.querySelector('#hm-word-go').addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    wordDlg.querySelector('.close').addEventListener('click', () => wordDlg.close());
    document.body.append(wordDlg);
  }
  function openWord() {
    if (!wordDlg) buildWord();
    const msg = wordDlg.querySelector('#hm-word-msg'); msg.textContent = ''; msg.classList.remove('hit', 'pop');
    wordDlg.showModal(); wordDlg.querySelector('#hm-word-in').focus();
  }
  function syncWordButton() {
    if (!bucket || wordBtn) return;
    wordBtn = make('button'); wordBtn.type = 'button'; wordBtn.id = 'hm-word-open'; wordBtn.textContent = T.open; wordBtn.style.cssText = 'display:block;margin:0 auto 12px;min-width:200px';
    wordBtn.addEventListener('click', openWord);
    const close = bucket.querySelector('.close'); if (close) close.before(wordBtn); else bucket.append(wordBtn);
  }
  syncWordButton();
  // リンク ?kotoba=ことば：ひらいたら しらべて、アドレスから 消す（もういちど 読みこんでも くりかえさない）。入れられた 文字は 画面に 出さない
  function showToast(r) {
    const old = $('hm-toast'); if (old) old.remove();
    const t = make('div'); t.id = 'hm-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.append(t);
    setTimeout(() => {
      const p = make('p'), row = make('div', 'hm-trow'), shut = make('button'); shut.type = 'button'; shut.textContent = T.close; shut.addEventListener('click', () => t.remove());
      p.textContent = r.ok ? '✨ ' + (r.fresh ? T.hit : T.again) + ' ✨' : T.none; t.append(p);
      if (r.ok) { const s = make('small'); s.textContent = r.title; t.append(s); const n = make('button'); n.type = 'button'; n.textContent = T.openNote; n.addEventListener('click', () => { t.remove(); window.TsuriHimitsu.open(); }); row.append(n); }
      row.append(shut); t.append(row);
    }, 60);
  }
  function fromUrl() {
    let u, raw; try { u = new URL(location.href); raw = u.searchParams.get('kotoba'); } catch { return null; }
    if (raw === null) return null;
    try { u.searchParams.delete('kotoba'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {}
    if (!norm(raw)) return null;
    const r = tryWord(raw); if (r.ok) fanfare(); showToast(r); return r;
  }
  setTimeout(fromUrl, 900);

  // ─── English mode（tsuri-en.js が あって 英語の 時だけ）：ひみつの ことばの 文を 訳表に 足す ───
  {
    const EN = { ex: {
      'ひみつの ことば': 'Secret Word', 'ためす': 'Try it', 'ひみつノートを ひらく': 'Open the Secret Notebook', 'はじめの ことば': 'First Word',
      'ことばを しって いたら、ここに いれてね。まちがえても、なにも おこらないよ。': 'If you know a word, type it here. If you get it wrong, nothing happens.',
      'ひみつの ことばが みつかったよ！': 'You found a secret word!', 'この ことばは もう みつけて いるよ。いつでも どうぞ。': 'You already found this word. Feel free to enter it anytime.',
      'みつからなかったよ。ことばが ちがうのかも。もういちど ためしてね。': 'Not found. Maybe the word is different. Please try again.', 'ことばを いれてね。': 'Please enter a word.',
      'ひみつの ことばを みつけたよ。ことばは、これから ふえるかも しれないよ。': 'You found a secret word. There might be more words from now on.',
      'いけの みずきり': 'Skipping Stones', 'いけの ほとりから、いしを なげて みたよ。ぴょん ぴょんと はねたよ。': 'You threw a stone from the edge of the pond. It skipped across the water.',
      'おはなに みず': 'Watering the Flowers', 'おはなに みずを あげたら、うれしそうに ゆれたよ。': 'You watered the flowers, and they swayed happily.',
      'ポストの おてがみ': 'A Letter in the Mailbox', 'ポストを のぞいたら、ともだちからの おてがみが とどいて いたよ。': 'You peeked into the mailbox, and a letter from a friend had arrived.',
      'ともだちの おせわ': 'Caring for a Friend', 'ごはんや うわぎ、もうふを あげたら、すこし よろこんで くれたよ。': 'You gave a friend some food, a coat, or a blanket, and they looked a little happier.',
      'ひろばの おそうじ': 'Tidying the Plaza', 'おちばを はいたら、ひろばが さっぱり したよ。': 'You swept up the fallen leaves, and the plaza feels fresh.',
      'あかりを ともす': 'Lighting the Lamps', 'よるの がいとうに あかりを ともしたよ。': 'You lit the street lamps at night.',
      'なかまの あと': 'A Friend Was Here', 'ひろばに なかまの あとを みつけたよ。': 'You found traces that a friend had left in the plaza.',
      'おかえり': 'Welcome Back', 'また きたら、はなだんに おはなが さいて いたよ。': 'When you came back, flowers had bloomed in the flower bed.',
      'きせつの おたのしみ': 'A Seasonal Show', 'きせつの ふぶきや はなびを みたよ。': 'You saw a seasonal flurry of petals or snow, and fireworks.',
      'ベンチで ひとやすみ': 'A Rest on the Bench', 'ベンチで ゆっくり すわって いたら、なかまが となりに きて くれたよ。': 'While you rested quietly on the bench, a friend came and sat next to you.',
      'ねがいの ほし': 'Wishing Star', 'つりばで ねがった ぶんだけ、よるの ひろばの そらに ほしが ふえるよ。': 'The more wishes you make at the fishing spot, the more stars appear in the plaza sky at night.',
      'みんなで しゃしん': 'Group Photo', 'なかまが ぜんいん あつまって きたよ。': 'All the friends gathered around.',
      'かんばんの うら': 'Back of the Sign', 'じゅんびちゅうの かんばんの うらに、なにか かいて あったよ。': 'There was something written on the back of the “Getting Ready” sign.',
      'パンダの ささぶね': 'Panda’s Bamboo Boat', 'かわで パンダと ゆっくり して いたら、ささぶねが ながれて きたよ。おへやに かざれるよ。': 'While relaxing at the river with Panda, a bamboo-leaf boat floated by. You can decorate the room with it.',
      'あめあがりの にじ': 'Rainbow After the Rain', 'あめの ひに たくさん つったら、あめが やんで にじが でたよ。': 'After catching lots of fish on a rainy day, the rain stopped and a rainbow appeared.',
      'バケツの やどかり': 'Hermit Crab in the Bucket', 'バケツを なんども のぞいたら、やどかりが でて きたよ。おへやに かざれるよ。': 'After peeking into the bucket many times, a hermit crab came out. You can decorate the room with it.',
      'ささぶね。ひろう': 'Bamboo-leaf boat. Pick up', 'かわの うえから、ささぶねが ながれて きたよ。ボタンで ひろえるよ。': 'A bamboo-leaf boat came floating down the river. Press the button to pick it up.', 'ささぶねは、かわしもへ ながれて いったよ。': 'The boat floated away downstream.',
      'ささぶねを ひろったよ。おへやに かざれるよ。': 'You picked up the boat. You can decorate Marufuwa’s Room with it.', 'ささぶねは もう いっぱい もって いるよ。おへやに かざって あげてね。': 'You already have plenty of boats. Why not decorate the room with them?', 'ささぶね、いいね': 'Nice boat!',
      'あめが やんで きたよ。にじが でてる': 'The rain is stopping. There’s a rainbow!',
      'バケツの なかに やどかり。さわる': 'A hermit crab in the bucket. Touch it', 'バケツの なかに、やどかりが いたよ。さわると なかよしに なるよ。': 'There was a hermit crab in the bucket. Touch it to make friends.',
      'やどかりが、すいそうに ひっこしたいって。おへやに かざれるよ。': 'The hermit crab wants to move into the tank. You can decorate the room with it.', 'やどかりは もう いっぱい いるよ。おへやに かざって あげてね。': 'You already have plenty of hermit crabs. Why not decorate the room with them?',
      'ぬしの ぬいぐるみ': 'Guardian Plush', 'ぬしを つった さかなの ぬいぐるみが、ベンチの うえで まって いたよ。': 'A plush of the fish whose Guardian you caught was waiting on the bench.',
      'さかなの パレード': 'Fish Parade', 'かざりを 6しゅるい ぜんぶ おいたら、さかなが ぐるっと パレードを したよ。': 'When you placed all six kinds of decorations, the fish paraded around in a big circle.',
      'きせつの おとしもの': 'Seasonal Find', 'きを ゆらしたら、きせつの ものが おちて きたよ。おへやに かざれるよ。': 'When you shook the tree, something from the season fell down. You can decorate the room with it.'
    }, rules: [
      [/^(ひみつのことばがみつかったよ！|このことばはもうみつけているよ。いつでもどうぞ。)(.+)$/, (_, a, b) => { const E = window.TsuriEn, x = E && E.tr ? E.tr(a) : null, y = E && E.tr ? E.tr(b) : null; return x == null || y == null ? null : x + ' ' + y; }],
      [/^✨(.+)✨$/, (_, a) => { const E = window.TsuriEn, x = E && E.tr ? E.tr(a) : null; return x == null ? null : '✨ ' + x + ' ✨'; }],
      [/^(\d{1,2})がつ(\d{1,2})にち(あさ|ひる|ゆうがた|よる)?$/, (_, m, d, w) => { const MO = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(m)], WH = { 'あさ': 'morning', 'ひる': 'daytime', 'ゆうがた': 'evening', 'よる': 'night' }; return MO ? MO + ' ' + Number(d) + (w ? ' · ' + WH[w] : '') : null; }]   // ひみつノートの 日づけ
    ] };
    const regEn = () => { const E = window.TsuriEn; if (E && E.lang === 'en' && typeof E.add === 'function' && !regEn.done) { regEn.done = true; E.add(EN); } };
    addEventListener('load', regEn);
  }

  window.TsuriHimitsu = {
    version: 1, found: foundMap, replay, open: () => { if (!noteDlg) buildNote(); drawNote(); noteDlg.showModal(); },
    kotoba: { version: 1, try: tryWord, open: openWord, list: () => WORDS.map(w => ({ id: w.id, title: titleOf(w.id), found: !!foundMap()[w.id] })) },
    _debug: { audio: { tone, zap, chord, fanfare, ids: () => Object.keys(REPLAY) }, kotoba: { sha256hex, norm, hashOf, words: () => WORDS.map(w => ({ id: w.id, keys: Object.keys(w), hashes: w.h.length, hex: w.h.every(x => /^[0-9a-f]{64}$/.test(x)) })), fromUrl, T }, tick, update, skew: ms => { skew += ms; }, speed: v => { speed = v; }, pause: v => { muted = !!v; }, hots: HOTS, state: () => ({ lit: !!lit, deerBusy, deerDone, nap: !!nap, windowBusy, rabbitBusy, boat: !!boat, boatDone, rainbow: !!rainbow, rainbowLeft: rainbow ? Math.max(0, rainbowEnd - clock()) : 0, crab: !!crabBox, bucketOpens }), gifts: () => { const d = readJSON(HM_KEY); return d && d.gifts && typeof d.gifts === 'object' && !Array.isArray(d.gifts) ? { ...d.gifts } : {}; }, resetTotal: () => { total0 = totalNow(); rainbowLoud = false; }, resetOpens: () => { bucketOpens = 0; } }
  };
})();
