/* まるふわ つりびより：ぬしの とうじょう（そとづけ）
   ・「これ みて！」の しゅんかん を つくる。ぬし（とくだいの 1ぴき）の ときだけ
   ・まつ あいだ：みずの したから おおきな かげが ちかづき、そらが すこし くらくなり、みずが ゆれ、ひくい おとが「ドン…ドン…」と はやくなる
   ・アタリ：みずしぶき。ひく あいだ：かげの まわりに ゆらぎ
   ・つれた：ひかりが ぱっと ひろがり、きんいろの ひかりの すじが さかなの うしろに たつ
   ・よむのは #scene の data-phase と #shadow の data-nushi／data-rare だけ。なまえは かえない。ほぞんは よむだけ。そとへは なにも おくらない
   ・うごきを へらす せっていでは、くらくなる・ひかる だけ（ゆれ・ちかづく うごきは なし）。おとは ゲームの おとが ON の ときだけ */
(() => {
  'use strict';
  const scene = document.getElementById('scene'), shadow = document.getElementById('shadow');
  if (!scene || !shadow || window.TsuriNushi) return;
  const query = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  if (local && query.get('nushi-en') === '0') return;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 「おと」が ON で、かつ「こうかおん」を きって いない 人だけ（save.sndFx===false の 人には ならさない。ジョブズ1 の 依頼・9/30）
  const soundOn = () => { try { const s = JSON.parse(localStorage.getItem('marufuwa-tsuri-v1') || '{}'); return !!s.sound && s.sndFx !== false; } catch (e) { return false; } };

  const style = document.createElement('style'); style.id = 'nushi-style';
  style.textContent = `
#nushi-dim{position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(ellipse 70% 60% at var(--x,50%) var(--y,75%),#0a1a3a00 0%,#0a1a3a00 35%,#0a1a3acc 100%);opacity:0;transition:opacity var(--t,2.5s) ease-in}
#nushi-dim[data-on=true]{opacity:1}
#nushi-dim[data-on=deep]{opacity:1;transition-duration:.3s;background:radial-gradient(ellipse 60% 50% at var(--x,50%) var(--y,75%),#0a1a3a00 0%,#0a1a3a55 35%,#0a1a3ae6 100%)}
#nushi-fx{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden;container-type:size}
#nushi-fx .ring{position:absolute;left:var(--x);top:var(--y);width:10cqw;height:4cqw;translate:-50% -50%;border:2px solid #ffffff90;border-radius:50%;opacity:0;animation:nushi-ring var(--t,1.8s) ease-out infinite;animation-delay:var(--d,0s)}
#nushi-fx .halo{position:absolute;left:var(--x);top:var(--y);width:40cqw;height:16cqw;translate:-50% -50%;border-radius:50%;background:radial-gradient(ellipse,#ffe08a55 0%,#ffe08a00 70%);opacity:0;animation:nushi-halo 1.1s ease-in-out infinite alternate}
#nushi-fx .splash{position:absolute;left:var(--x);top:var(--y);width:1.6cqw;height:1.6cqw;translate:-50% -50%;border-radius:50%;background:#fff;opacity:.95;animation:nushi-splash .7s ease-out forwards;animation-delay:var(--d,0s)}
#nushi-fx .ray{position:absolute;left:var(--x);top:var(--y);width:1.4cqw;height:60cqw;translate:-50% -100%;transform-origin:50% 100%;rotate:var(--r);background:linear-gradient(#ffd34d00,#ffd34dcc 40%,#fff6c9 100%);opacity:0;animation:nushi-ray 2.4s ease-out forwards;animation-delay:var(--d,0s);mix-blend-mode:screen}
#nushi-flash{position:absolute;inset:0;z-index:6;pointer-events:none;background:#fff;opacity:0}
#nushi-flash[data-on=true]{animation:nushi-flash .9s ease-out forwards}
#scene[data-nushi-shake=true]{animation:nushi-shake .5s ease-in-out 2}
@keyframes nushi-ring{0%{transform:scale(.3);opacity:.9}100%{transform:scale(2.6);opacity:0}}
@keyframes nushi-halo{from{opacity:.35}to{opacity:.9}}
@keyframes nushi-splash{0%{transform:translate(0,0) scale(1);opacity:.95}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
@keyframes nushi-ray{0%{opacity:0;height:0}25%{opacity:.9}100%{opacity:0;height:70cqw}}
@keyframes nushi-flash{0%{opacity:.85}100%{opacity:0}}
@keyframes nushi-shake{0%,100%{translate:0 0}25%{translate:-.6% .3%}75%{translate:.6% -.3%}}
#nushi-fx .bang{position:absolute;left:var(--x);top:var(--y);translate:-50% -100%;font-weight:900;font-size:clamp(1.2rem,7cqw,2.2rem);color:#ff5a3c;-webkit-text-stroke:2px #fff;paint-order:stroke;animation:nushi-bang .6s ease-out forwards;animation-delay:var(--d,0s);opacity:0}
#nushi-fx .word{position:absolute;left:var(--x);top:var(--y);translate:-50% -100%;background:#fff;border:2px solid #ffb347;border-radius:14px;padding:2px 10px;font-size:.8rem;font-weight:800;white-space:nowrap;color:#5a3a10;opacity:0;animation:nushi-word 2.6s ease-out forwards;animation-delay:var(--d,0s)}
#nushi-fx .word.lore{white-space:normal;max-width:86%;width:max-content;text-align:center;font-size:.9rem;font-weight:600;line-height:1.5;padding:6px 12px;animation-duration:4.4s}
#scene .who[data-nushi-jump=true]{animation:nushi-jump .9s ease-out 2}
@keyframes nushi-bang{0%{opacity:0;transform:scale(.4) translateY(10%)}30%{opacity:1;transform:scale(1.25)}100%{opacity:1;transform:scale(1)}}
@keyframes nushi-word{0%{opacity:0;transform:translateY(6px)}12%,80%{opacity:1;transform:translateY(0)}100%{opacity:0}}
@keyframes nushi-jump{0%,100%{translate:0 0;rotate:0deg}30%{translate:0 -16%;rotate:-8deg}60%{translate:0 0}80%{translate:0 -8%;rotate:6deg}}
/* ぬしの あいだは しずかに：なかまの ひとこと・なかまの つりあげ・けしきの いきもの・あめ を とめる（きんちょうが とぎれない ように）。data-boss は approach〜つりあげの あと 4びょうまで */
#scene #ikimono,#scene #ame{transition:opacity .9s ease}
#scene[data-boss=true] #bubble,#scene[data-boss=true] #held-friend,#scene[data-boss=true] .hop{display:none!important}
#scene[data-boss=true] #ikimono{opacity:0}
#scene[data-boss=true] #ame{opacity:.2}
@media(prefers-reduced-motion:reduce){#scene .who[data-nushi-jump=true]{animation:none}}
@media(prefers-reduced-motion:reduce){#nushi-fx .ring,#nushi-fx .splash,#scene[data-nushi-shake=true]{animation:none!important}#nushi-fx .halo{animation:none;opacity:.6}#nushi-fx .ray{animation-duration:2.4s}}
`;
  document.head.append(style);
  const dim = document.createElement('div'); dim.id = 'nushi-dim'; dim.setAttribute('aria-hidden', 'true');
  const fx = document.createElement('div'); fx.id = 'nushi-fx'; fx.setAttribute('aria-hidden', 'true');
  const flash = document.createElement('div'); flash.id = 'nushi-flash'; flash.setAttribute('aria-hidden', 'true');
  shadow.after(fx); scene.append(dim, flash);

  // ひくい おと：じぶんの おとの くち（ゲームの おとが ON の ときだけ ならす）
  // やさしい 出口（聴覚過敏の 人の ため・9/30 夜 マスター直「キンキン 高い おとは 不向き」）：この ファイルの 音は ぜんぶ ここを 通る。
  //   ・基音は 1200Hz まで（もっと 高い おとは 1オクターブ ずつ さげる）／アタックは 15ms いじょう／かくばった なみ（square）は さんかくに／
  //     ざつおん（ぽちゃん・ざわざわ）は ローパス 1500Hz／出口は ローパス 2500Hz → やわらかい 頭打ち（tanh）。ピークは −12dBFS（0.25）を こえない。
  const GENTLE = { top: 1200, attack: .015, lp: 2500, noiseLp: 1500, cap: .25, noiseGain: 2.4 };
  function gentleBus(c) {   // 出口は ローパス → 頭打ち。部品が 無い（ふるい 環境・検査の 見本）ときは あるものだけ つなぐ
    if (c._gentle) return c._gentle;
    let head = c.destination;
    try { if (c.createWaveShaper) { const sh = c.createWaveShaper(), n = 2048, curve = new Float32Array(n); for (let i = 0; i < n; i++) curve[i] = GENTLE.cap * Math.tanh((i / (n - 1) * 2 - 1) * 4); sh.curve = curve; sh.oversample = '2x'; sh.connect(head); head = sh; } } catch {}
    try { if (c.createBiquadFilter) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = GENTLE.lp; if (lp.Q) lp.Q.value = .5; lp.connect(head); head = lp; } } catch {}
    return (c._gentle = head);
  }
  const lowerTo = (freq, slideTo) => { const hi = Math.max(freq, slideTo || 0); if (!(hi > GENTLE.top)) return [freq, slideTo || 0]; const k = 2 ** Math.ceil(Math.log2(hi / GENTLE.top)); return [freq / k, slideTo ? slideTo / k : 0]; };
  let ctx = null, drum = 0;
  const thump = (gain, hz) => {
    if (!soundOn()) return;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { return; }
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = 'triangle'; o.frequency.setValueAtTime(hz, t); o.frequency.exponentialRampToValueAtTime(hz * .6, t + .25);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + GENTLE.attack + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .28);
    o.connect(g).connect(gentleBus(ctx)); o.start(t); o.stop(t + .3);
  };
  const stopDrum = () => { clearTimeout(drum); drum = 0; };

  const isNushi = () => shadow.dataset.nushi === 'true' && shadow.dataset.rare !== '5';
  const float = document.getElementById('float');
  // ばしょは ウキ（かげの いきさき）。かげ じしんは みぎの そとから およいで くる とちゅう
  const at = () => ({x: (float && float.style.left) || shadow.style.left || '50%', y: (float && float.style.top) || shadow.style.top || '80%'});
  const el = (cls, vars) => { const e = document.createElement('span'); e.className = cls; Object.entries(vars).forEach(([k, v]) => e.style.setProperty('--' + k, v)); fx.append(e); return e; };
  const setPos = () => { const p = at(); dim.style.setProperty('--x', p.x); dim.style.setProperty('--y', p.y); };

  let active = false, lastPhase = '';
  let bossTimer = 0;
  function clear() { active = false; stopDrum(); fx.textContent = ''; dim.dataset.on = 'false'; delete scene.dataset.nushiShake; clearTimeout(bossTimer); delete scene.dataset.boss; }

  function approach() {
    // まつ あいだ：かげが ちかづく じかん（--swim）に あわせて、そらが くらくなり、みずが ゆれ、おとが はやくなる
    active = true; scene.dataset.boss = 'true';
    const swim = parseInt(shadow.style.getPropertyValue('--swim')) || 3000;
    setPos(); dim.style.setProperty('--t', Math.max(1.2, swim / 1000 * .9) + 's'); dim.dataset.on = 'true';
    const p = at();
    for (let i = 0; i < 3; i++) el('ring', {x: p.x, y: p.y, t: '1.8s', d: (i * .6) + 's'});
    if (!still()) {
      let gap = Math.max(420, swim / 5), count = 0;
      const beat = () => { if (!active || scene.dataset.phase !== 'waiting') return; thump(.11 + Math.min(.12, count * .02), 70); count++; gap = Math.max(220, gap * .82); drum = setTimeout(beat, gap); };
      drum = setTimeout(beat, 150);
    }
  }
  function strike() {
    // アタリ：みずしぶき＋ひとゆれ。そらは もっと くらく
    stopDrum(); setPos(); dim.dataset.on = 'deep';
    thump(.28, 55); setTimeout(() => thump(.2, 48), 160);
    const p = at();
    if (!still()) {
      scene.dataset.nushiShake = 'true'; setTimeout(() => { delete scene.dataset.nushiShake; }, 1100);
      for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 1.6, r = 6 + Math.random() * 10; el('splash', {x: p.x, y: p.y, dx: (Math.cos(a) * r) + 'cqw', dy: (Math.sin(a) * r) + 'cqw', d: (Math.random() * .12) + 's'}); }
    }
    el('halo', {x: p.x, y: p.y});
  }

  // まわりの なかまが びっくりする：「！」が でて、とびあがって、「わあ！」「すごい！」
  function friendsReact() {
    const s = scene.getBoundingClientRect(), words = [['わあ！', 'すごい！'], ['ぬしだ！', 'おおきい…！'], ['みて みて！', 'やったね！']][Math.floor(Math.random() * 3)];
    ['friend-a', 'friend-b'].forEach((id, i) => {
      const f = document.getElementById(id); if (!f || f.hidden) return;
      const r = f.getBoundingClientRect(), x = ((r.left + r.width / 2 - s.left) / s.width * 100) + '%', y = ((r.top - s.top) / s.height * 100) + '%';
      setTimeout(() => {
        el('bang', {x, y, d: '0s'}).textContent = '！';
        f.dataset.nushiJump = 'true'; setTimeout(() => { delete f.dataset.nushiJump; }, 1900);
        setTimeout(() => { el('word', {x, y, d: '0s'}).textContent = words[i]; }, 700);
      }, 350 + i * 260);
    });
  }
  // つれた あとの ひとこと：ぬしの いいつたえ（Dispatch の 案 E-4・10/1）。つりばごとに 2つ。こわい ことばは いれない
  const LORE = {
    L: ['この こは 100ねん まえから この みずうみに いるんだって', 'みずうみの おくで、ほしを みて ねむるんだって'],
    R: ['かわの ぬしは、あめの ひに うたを うたうんだって', 'むかしから、かわの みずを きれいに してくれて いるんだって'],
    H: ['みなとの ふねを、ずっと みまもって いるんだって', 'まちの ひとは「みなとの おじいさん」って よぶんだって'],
    B: ['ふかい うみの そこから、たまに あそびに くるんだって', 'つきの あかるい よるに、ふねの したを とおるんだって'],
  };
  const lore = () => { const a = LORE[scene.dataset.area] || LORE.L; return a[Math.floor(Math.random() * a.length)]; };
  function landed() {
    // つれた：ひかりが ぱっと ひろがり、きんいろの ひかりの すじ
    stopDrum(); fx.textContent = ''; dim.dataset.on = 'false';
    flash.dataset.on = 'true'; setTimeout(() => { flash.dataset.on = 'false'; }, 950);
    const held = document.getElementById('held'), r = held && !held.hidden ? held.getBoundingClientRect() : null, s = scene.getBoundingClientRect();
    const x = r ? ((r.left + r.width / 2 - s.left) / s.width * 100) + '%' : '50%', y = r ? ((r.top + r.height / 2 - s.top) / s.height * 100) + '%' : '55%';
    for (let i = 0; i < 12; i++) el('ray', {x, y, r: (i * 30 + 15) + 'deg', d: (i % 3) * .08 + 's'});
    friendsReact();
    setTimeout(() => { if (scene.dataset.phase === 'caught') { const w = el('word', {x: '50%', y: '30%', d: '0s'}); w.className += ' lore'; w.textContent = lore(); } }, 1700);   // いいつたえ（1.7びょう あと・まんなか の うえ）
    setTimeout(() => { if (scene.dataset.phase === 'caught') fx.textContent = ''; }, 6200);
    clearTimeout(bossTimer); bossTimer = setTimeout(() => { delete scene.dataset.boss; }, 4200);   // 見せ場（！・わあ！）が おわる まで ひとこと・いきものは もどさない
    active = false;
  }

  new MutationObserver(() => {
    const phase = scene.dataset.phase; if (phase === lastPhase) return; lastPhase = phase;
    if (phase === 'waiting') { clear(); if (isNushi()) approach(); }
    else if (phase === 'bite') { if (active) strike(); }
    else if (phase === 'reel') { if (active) { setPos(); } }
    else if (phase === 'caught') { if (active) landed(); }
    else clear();
  }).observe(scene, {attributes: true, attributeFilter: ['data-phase']});

  window.TsuriNushi = {active: () => active, count: () => fx.children.length, _debug: {thump}};
})();
