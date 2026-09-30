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
  const soundOn = () => { try { return !!JSON.parse(localStorage.getItem('marufuwa-tsuri-v1') || '{}').sound; } catch (e) { return false; } };

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
@media(prefers-reduced-motion:reduce){#nushi-fx .ring,#nushi-fx .splash,#scene[data-nushi-shake=true]{animation:none!important}#nushi-fx .halo{animation:none;opacity:.6}#nushi-fx .ray{animation-duration:2.4s}}
`;
  document.head.append(style);
  const dim = document.createElement('div'); dim.id = 'nushi-dim'; dim.setAttribute('aria-hidden', 'true');
  const fx = document.createElement('div'); fx.id = 'nushi-fx'; fx.setAttribute('aria-hidden', 'true');
  const flash = document.createElement('div'); flash.id = 'nushi-flash'; flash.setAttribute('aria-hidden', 'true');
  shadow.after(fx); scene.append(dim, flash);

  // ひくい おと：じぶんの おとの くち（ゲームの おとが ON の ときだけ ならす）
  let ctx = null, drum = 0;
  const thump = (gain, hz) => {
    if (!soundOn()) return;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { return; }
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = 'triangle'; o.frequency.setValueAtTime(hz, t); o.frequency.exponentialRampToValueAtTime(hz * .6, t + .25);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .28);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .3);
  };
  const stopDrum = () => { clearTimeout(drum); drum = 0; };

  const isNushi = () => shadow.dataset.nushi === 'true' && shadow.dataset.rare !== '5';
  const float = document.getElementById('float');
  // ばしょは ウキ（かげの いきさき）。かげ じしんは みぎの そとから およいで くる とちゅう
  const at = () => ({x: (float && float.style.left) || shadow.style.left || '50%', y: (float && float.style.top) || shadow.style.top || '80%'});
  const el = (cls, vars) => { const e = document.createElement('span'); e.className = cls; Object.entries(vars).forEach(([k, v]) => e.style.setProperty('--' + k, v)); fx.append(e); return e; };
  const setPos = () => { const p = at(); dim.style.setProperty('--x', p.x); dim.style.setProperty('--y', p.y); };

  let active = false, lastPhase = '';
  function clear() { active = false; stopDrum(); fx.textContent = ''; dim.dataset.on = 'false'; delete scene.dataset.nushiShake; }

  function approach() {
    // まつ あいだ：かげが ちかづく じかん（--swim）に あわせて、そらが くらくなり、みずが ゆれ、おとが はやくなる
    active = true;
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
  function landed() {
    // つれた：ひかりが ぱっと ひろがり、きんいろの ひかりの すじ
    stopDrum(); fx.textContent = ''; dim.dataset.on = 'false';
    flash.dataset.on = 'true'; setTimeout(() => { flash.dataset.on = 'false'; }, 950);
    const held = document.getElementById('held'), r = held && !held.hidden ? held.getBoundingClientRect() : null, s = scene.getBoundingClientRect();
    const x = r ? ((r.left + r.width / 2 - s.left) / s.width * 100) + '%' : '50%', y = r ? ((r.top + r.height / 2 - s.top) / s.height * 100) + '%' : '55%';
    for (let i = 0; i < 12; i++) el('ray', {x, y, r: (i * 30 + 15) + 'deg', d: (i % 3) * .08 + 's'});
    setTimeout(() => { if (scene.dataset.phase === 'caught') fx.textContent = ''; }, 2600);
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

  window.TsuriNushi = {active: () => active, count: () => fx.children.length};
})();
