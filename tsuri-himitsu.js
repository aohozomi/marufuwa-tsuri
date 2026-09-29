// まるふわ つりびより「ひみつ」（外付け1ファイル）
//   つりの がめんの ひみつ：あさぎりの こじか／みなとまちの とうだい／ふねの まるまど／ねこの ひるね／つきの うさぎ。＋ ひみつノート。
//   ・本体（index.html）は書き換えない。本体の さいごに 1行：<script defer src="tsuri-himitsu.js"></script>（外すには その1行を消す）。
//   ・読むだけ：#scene の data-phase・data-time・data-area、#friend-a・#friend-b の 絵、localStorage['marufuwa-tsuri-v1'] の sound。
//   ・書く：ひみつ専用の 鍵 localStorage['marufuwa-himitsu-v1'] = {v:1, found:{名前:{at,time}}, gifts:{}} だけ（読んで・足して・すぐ書く。ほかの ページが 書いた物を 消さない）。
//   ・ごほうびは 見た目・音・ことば だけ。釣れる 魚は かえない。見つけなくても、見のがしても、何も へらない。
//   ・ぜんぶ「さわる（本当の ボタン。Tab で えらべる）」か「まつ」で おこり、音（おと ON の時）と 読み上げ（#status）でも しらせる。
//   ・つりの 最中（かかった・ひいて いる 間）は、ひみつの ボタンを とめる（本体は ボタンの 上を おしても ひけない ため）。
//   ・音は 本体と おなじ むかしの ゲームき ふう（かくばった なみ・さんかくの なみ・みじかい ざつおん）。おとが OFF の間は 何も 鳴らさない。
(() => {
  'use strict';
  const scene = document.getElementById('scene');
  if (!scene) return;
  const $ = id => document.getElementById(id), status = $('status');
  const HM_KEY = 'marufuwa-himitsu-v1', MAIN_KEY = 'marufuwa-tsuri-v1';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readJSON = key => { try { const d = JSON.parse(localStorage.getItem(key)); return d && typeof d === 'object' ? d : null; } catch { return null; } };
  const soundOn = () => (readJSON(MAIN_KEY) || {}).sound === true;
  let speed = 1, skew = 0, muted = false;        // 検査用：時間を はやめる／すすめる／ひみつの 待ち時間を 止める（ほかの 検査が 仮想の 時計を 進める 間、こじか・ねこが 勝手に 出ないように）
  const dur = ms => ms / speed, later = (fn, ms) => setTimeout(fn, dur(ms)), clock = () => performance.now() + skew;
  const say = text => { if (status) status.textContent = text; };
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  // ─── おと ───
  let ac = null, hiss = null;
  const ready = () => { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; };
  const route = (c, node, pan) => { if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); p.connect(c.destination); } else node.connect(c.destination); };
  function tone(freq, len = .09, type = 'square', delay = 0, loud = .05, slideTo = 0, pan = 0) {
    if (!soundOn()) return;
    try {
      const c = ready(), at = c.currentTime + delay, osc = c.createOscillator(), vol = c.createGain();
      osc.type = type === 'sine' ? 'triangle' : type; osc.frequency.setValueAtTime(freq, at);
      if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, at + len);
      const level = osc.type === 'triangle' ? loud * 2.2 : loud;
      vol.gain.setValueAtTime(level, at); vol.gain.setValueAtTime(level * .6, at + len * .5); vol.gain.setValueAtTime(0, at + len);
      osc.connect(vol); route(c, vol, pan); osc.start(at); osc.stop(at + len + .02);
    } catch {}
  }
  function zap(len = .1, delay = 0, loud = .06, pan = 0) {
    if (!soundOn()) return;
    try {
      const c = ready(), at = c.currentTime + delay;
      if (!hiss) { hiss = c.createBuffer(1, c.sampleRate * .5, c.sampleRate); const d = hiss.getChannelData(0); let hold = 0; for (let i = 0; i < d.length; i++) { if (i % 6 === 0) hold = Math.random() * 2 - 1; d[i] = hold; } }
      const src = c.createBufferSource(), vol = c.createGain(); src.buffer = hiss;
      vol.gain.setValueAtTime(loud, at); vol.gain.linearRampToValueAtTime(0, at + len);
      src.connect(vol); route(c, vol, pan); src.start(at); src.stop(at + len + .02);
    } catch {}
  }
  const chord = (notes, gap = .08, type = 'square', loud = .04) => notes.forEach((n, i) => tone(n, gap * 1.05, type, i * gap, loud));

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
    tone(196, .07, 'square', 0, .04); if (h.taps < 3) { say(h.label + 'を さわったよ。'); return; }
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
      tone(1047, .06, 'square', 0, .03); tone(1319, .08, 'square', .07, .03); say('ねこが「にゃっ！ …ねてないよ」って いったよ。'); later(() => b.remove(), 2600);
    } else b.remove();
  }

  // ─── まわして みる：ようすが かわった時の あとしまつ・さわる ボタンの 出し入れ ───
  let lastKey = '', idleSince = clock();
  function update() {
    const s = state(), key = s.area + '/' + s.time, moving = s.phase === 'bite' || s.phase === 'reel';
    if (key !== lastKey) { lastKey = key; idleSince = clock(); }
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
  }
  new MutationObserver(update).observe(scene, { attributes: true, attributeFilter: ['data-phase', 'data-time', 'data-area'] });
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
    'heya-lamp': ['💡', 'ほしぞらの へや', 'ランプを けしたら、かべが ほしぞらに なったよ。'],
    'heya-onigiri': ['🍙', 'おにぎり はんぶんこ', 'ラグの おにぎりを、なかまと はんぶんこ したよ。'],
    'heya-utouto': ['💤', 'まるふわの うとうと', 'まるふわが おへやで うとうと ねむったよ。'],
    'heya-bin': ['🍾', 'ほしの びん', 'びんの なかで、ほしが ひかったよ。'],
    'heya-mori': ['🌿', 'ちいさな もり', 'ちいさな もりで、さかなが やすんで いたよ。'],
    'heya-okaeshi': ['💗', 'ごはんの おれい', 'さかなたちが、ありがとう って いってる みたいだったよ。'],
    'heya-uta': ['🎵', 'すいそうの うた', 'まるふわが、すいそうの うたを うたったよ。'],
    'hiroba-wish': ['⭐', 'ふんすいの ねがいぼし', 'ふんすいを 3かい さわって、ねがいごとを したよ。'],
    'hiroba-sun': ['☀️', 'おひさまの ぽかぽか', 'おひさまを さわったら、ぽかぽか したよ。'],
    'hiroba-cloud': ['☁️', 'くもの ぽよん', 'くもが ぽよんと はねたよ。'],
    'hiroba-tree': ['🌳', 'きの はっぱ', 'きを さわったら、はっぱが ひらひら おちて きたよ。'],
    'hiroba-spin': ['🌀', 'まるふわの くるくる', 'まるふわが くるくると まわったよ。'],
    'hiroba-meteor': ['🌠', 'ひろばの ながれぼし', 'ひろばの よぞらに、ながれぼしが とんだよ。'],
    'hiroba-pond': ['🐟', 'いけの さかな', 'いけで さかなが ぴょんと はねたよ。'],
    'hiroba-thanks': ['🌟', 'ありがとうの ほしぞら', 'ありがとうの いしを ひらいて、あそんで くれた ひとの ほしを みたよ。']
  };
  const REPLAY = {
    'tsuri-kojika': () => { zap(.9, 0, .03, .3); [0, 1, 2, 3, 4].forEach(i => tone(i % 2 ? 196 : 165, .04, 'triangle', .5 + i * .38, .02, 0, .5 - i * .2)); [0, 1, 2].forEach(i => { zap(.06, 2.6 + i * .7, .03, .1); tone(700 + i * 40, .04, 'triangle', 2.6 + i * .7, .03, 820); }); },
    'tsuri-toudai': () => { tone(110, 1.1, 'triangle', 0, .07, 96); tone(880, .12, 'triangle', .9, .04); },
    'tsuri-marumado': () => { tone(240, 2.4, 'triangle', 0, .06, 88); },
    'tsuri-neko': () => [0, 1].forEach(i => tone(150, .9, 'triangle', i * 1.4, .02, 120)),
    'tsuri-tsuki': () => { for (let i = 0; i < 4; i++) { tone(130, .1, 'triangle', i * .9, .06, 92); zap(.03, i * .9, .03); } }
  };
  const bucket = $('bucket');
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
    if (REPLAY[id]) REPLAY[id]();
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

  window.TsuriHimitsu = {
    version: 1, found: foundMap, replay, open: () => { if (!noteDlg) buildNote(); drawNote(); noteDlg.showModal(); },
    _debug: { tick, update, skew: ms => { skew += ms; }, speed: v => { speed = v; }, pause: v => { muted = !!v; }, hots: HOTS, state: () => ({ lit: !!lit, deerBusy, deerDone, nap: !!nap, windowBusy, rabbitBusy }) }
  };
})();
