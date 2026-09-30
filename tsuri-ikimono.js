/* まるふわ つりびより：けしきの いきもの（そとづけ）
   ・ほんたい（index.html）の なまえは かえない。よむのは #scene の data-time / data-area / data-rain だけ
   ・さわれない（pointer-events:none）。つりの じゃまを しない
   ・「うごきを へらす」せっていでは、うごかさずに そっと おくだけ
   ・そとへは なにも おくらない。ほぞんも しない
   ・えは かり（コードで かいた もの）。ほんものの えが とどいたら さしかえる */
(() => {
  'use strict';
  const scene = document.getElementById('scene');
  if (!scene || document.getElementById('ikimono')) return;

  const query = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  const probe = key => local ? query.get(key) : null;   // けんさようの あいずは、てもとだけ
  if (probe('ikimono') === '0') return;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
#ikimono{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;contain:layout paint}
#ikimono .i{position:absolute;left:0;top:0;width:var(--w,6%);aspect-ratio:1/1;translate:-50% -50%;will-change:transform}
#ikimono .i svg{position:static;width:100%;height:100%;display:block;overflow:visible}
#ikimono .fly{animation:iki-fly var(--lap,26s) linear infinite;animation-delay:var(--d,0s)}
#ikimono .fly svg{animation:iki-bob 1.6s ease-in-out infinite alternate}
#ikimono .flap{transform-box:fill-box;transform-origin:50% 100%;animation:iki-flap .36s ease-in-out infinite alternate}
#ikimono .flap.b{transform-origin:50% 0;animation-delay:-.18s}
#ikimono .flutter{animation:iki-flutter var(--lap,19s) ease-in-out infinite;animation-delay:var(--d,0s)}
#ikimono .wing{transform-box:fill-box;transform-origin:100% 50%;animation:iki-wing .28s ease-in-out infinite alternate}
#ikimono .wing.r{transform-origin:0 50%}
#ikimono .hover{animation:iki-hover var(--lap,13s) ease-in-out infinite;animation-delay:var(--d,0s)}
#ikimono .buzz{transform-box:fill-box;transform-origin:50% 50%;animation:iki-buzz .12s linear infinite alternate}
#ikimono .glow{width:var(--w,2.2%);border-radius:50%;background:radial-gradient(circle,#f6ffb0 0 22%,#d8ff7a88 38%,#d8ff7a00 70%);animation:iki-glow var(--lap,5s) ease-in-out infinite,iki-drift var(--lap2,17s) ease-in-out infinite alternate;animation-delay:var(--d,0s),var(--d,0s)}
#ikimono .fall{animation:iki-fall var(--lap,12s) linear infinite;animation-delay:var(--d,0s)}
#ikimono .fall svg{animation:iki-spin var(--spin,4s) ease-in-out infinite alternate}
#ikimono .snow{width:var(--w,1.4%);border-radius:50%;background:#fff;opacity:.85;box-shadow:0 0 4px #fff}
#ikimono .sit svg{animation:iki-breathe 2.8s ease-in-out infinite alternate;transform-origin:50% 100%}
#ikimono .hop{animation:iki-hop 7s ease-in-out infinite;animation-delay:var(--d,0s)}
#scene[data-time=yoru] #ikimono .day,#scene[data-dim=true] #ikimono .day{filter:brightness(.62)}
@keyframes iki-fly{from{transform:translate(-12vw,0)}to{transform:translate(112vw,var(--rise,-6vw))}}
@keyframes iki-bob{from{transform:translateY(-8%)}to{transform:translateY(8%)}}
@keyframes iki-flap{from{transform:scaleY(1)}to{transform:scaleY(-.55)}}
@keyframes iki-wing{from{transform:scaleX(1)}to{transform:scaleX(.18)}}
@keyframes iki-buzz{from{transform:scaleY(1)}to{transform:scaleY(.35)}}
@keyframes iki-flutter{0%{transform:translate(0,0)}20%{transform:translate(7vw,-5vw)}40%{transform:translate(13vw,1vw)}60%{transform:translate(6vw,-7vw)}80%{transform:translate(-3vw,-2vw)}100%{transform:translate(0,0)}}
@keyframes iki-hover{0%,18%{transform:translate(0,0)}22%,48%{transform:translate(11vw,-2vw)}52%,78%{transform:translate(4vw,3vw)}82%,100%{transform:translate(0,0)}}
@keyframes iki-glow{0%,100%{opacity:.08}45%,60%{opacity:.95}}
@keyframes iki-drift{from{transform:translate(0,0)}to{transform:translate(var(--dx,5vw),var(--dy,-4vw))}}
@keyframes iki-fall{from{transform:translate(0,-10vw)}to{transform:translate(var(--dx,10vw),86vw)}}
@keyframes iki-spin{from{transform:rotate(-40deg)}to{transform:rotate(50deg)}}
@keyframes iki-breathe{from{transform:scale(1,1)}to{transform:scale(1.03,.97)}}
@keyframes iki-hop{0%,86%,100%{transform:translate(0,0)}90%{transform:translate(1.2vw,-2.4vw)}94%{transform:translate(2.4vw,0)}}
@media(prefers-reduced-motion:reduce){#ikimono *{animation:none!important}#ikimono .glow{opacity:.7}}
`;
  const style = document.createElement('style'); style.id = 'ikimono-style'; style.textContent = css; document.head.append(style);
  const layer = document.createElement('div'); layer.id = 'ikimono'; layer.setAttribute('aria-hidden', 'true');
  // けしきの うえ、まるふわ（z-index:3）の した
  const anchor = scene.querySelector('.spot') || scene.querySelector('#marufuwa'); anchor ? anchor.before(layer) : scene.append(layer);

  const NS = 'http://www.w3.org/2000/svg';
  const svg = inner => '<svg xmlns="' + NS + '" viewBox="0 0 40 40" focusable="false">' + inner + '</svg>';
  const ART = {
    // ことり：まるい からだ、ちいさな くちばし、はばたく はね
    kotori: c => svg('<ellipse cx="20" cy="22" rx="9" ry="7" fill="' + c + '"/><circle cx="27" cy="18" r="5" fill="' + c + '"/><path d="M31 18l5 1.5-5 1.5z" fill="#f4a63a"/><circle cx="28.5" cy="17" r="1" fill="#2b2b2b"/><path class="flap" d="M12 21q8-16 14 0z" fill="' + c + '" stroke="#ffffffaa" stroke-width=".8"/><path d="M11 23l-7 3 7 1z" fill="' + c + '"/><ellipse cx="21" cy="25" rx="5" ry="3" fill="#ffffffb0"/>'),
    // かもめ：ながい つばさ
    kamome: () => svg('<path class="flap" d="M20 20Q12 8 2 14q9-1 18 8z" fill="#fff" stroke="#9fb3c4" stroke-width=".8"/><path class="flap" d="M20 20Q28 8 38 14q-9-1-18 8z" fill="#fff" stroke="#9fb3c4" stroke-width=".8"/><ellipse cx="20" cy="22" rx="6" ry="3.4" fill="#fff" stroke="#9fb3c4" stroke-width=".8"/><path d="M25.5 21.5l4 .8-4 .9z" fill="#f4a63a"/><circle cx="23.6" cy="21" r=".8" fill="#2b2b2b"/>'),
    // ちょうちょ：4まいの はね
    chou: c => svg('<g class="wing"><path d="M20 20Q6 4 4 16q0 8 16 4z" fill="' + c + '" stroke="#fff" stroke-width=".8"/><path d="M20 21Q8 26 9 33q6 3 11-12z" fill="' + c + '" opacity=".85" stroke="#fff" stroke-width=".8"/></g><g class="wing r"><path d="M20 20Q34 4 36 16q0 8-16 4z" fill="' + c + '" stroke="#fff" stroke-width=".8"/><path d="M20 21Q32 26 31 33q-6 3-11-12z" fill="' + c + '" opacity=".85" stroke="#fff" stroke-width=".8"/></g><rect x="19" y="13" width="2" height="16" rx="1" fill="#5a4636"/><path d="M20 13q-3-5-5-5M20 13q3-5 5-5" stroke="#5a4636" stroke-width=".8" fill="none"/>'),
    // とんぼ：ほそい からだ、すきとおる はね
    tonbo: c => svg('<g class="buzz"><ellipse cx="13" cy="15" rx="9" ry="2.6" fill="#ffffffb8" stroke="#9fc4d8" stroke-width=".5"/><ellipse cx="13" cy="21" rx="8" ry="2.2" fill="#ffffff90" stroke="#9fc4d8" stroke-width=".5"/></g><rect x="4" y="17" width="26" height="2.4" rx="1.2" fill="' + c + '"/><circle cx="31" cy="18.2" r="3" fill="' + c + '"/><circle cx="32.4" cy="17.2" r="1.1" fill="#203040"/>'),
    // はなびら・おちば
    hanabira: () => svg('<path d="M20 6q10 10 0 28Q10 16 20 6z" fill="#ffc9dc" stroke="#ff9fbf" stroke-width=".8"/>'),
    ochiba: c => svg('<path d="M20 5q13 9 6 25l-6 5-6-5Q7 14 20 5z" fill="' + c + '"/><path d="M20 8v26M20 16l6-4M20 22l-7-4" stroke="#00000030" stroke-width="1" fill="none"/>'),
    // あめの ひの かえる
    kaeru: () => svg('<ellipse cx="20" cy="27" rx="13" ry="9" fill="#7fcf6a"/><circle cx="13" cy="17" r="5" fill="#7fcf6a"/><circle cx="27" cy="17" r="5" fill="#7fcf6a"/><circle cx="13" cy="16.5" r="2.6" fill="#fff"/><circle cx="27" cy="16.5" r="2.6" fill="#fff"/><circle cx="13.4" cy="16.8" r="1.3" fill="#2b2b2b"/><circle cx="27.4" cy="16.8" r="1.3" fill="#2b2b2b"/><path d="M14 27q6 4 12 0" stroke="#3f7f3a" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="9.5" cy="26" rx="2.2" ry="1.4" fill="#ffb6c8" opacity=".8"/><ellipse cx="30.5" cy="26" rx="2.2" ry="1.4" fill="#ffb6c8" opacity=".8"/>')
  };

  // まいにち おなじ ばしょに いないように、ひづけで きまる らんすう（おなじ ひは、おなじ けしき）
  const day = new Date(); let seed = (day.getFullYear() * 372 + day.getMonth() * 31 + day.getDate()) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const between = (a, b) => a + rnd() * (b - a);

  function put(kind, html, x, y, vars, extra) {
    const el = document.createElement('span'); el.className = 'i ' + kind + (extra ? ' ' + extra : ''); el.innerHTML = html;
    el.style.left = x + '%'; el.style.top = y + '%';
    Object.entries(vars || {}).forEach(([k, v]) => el.style.setProperty('--' + k, v));
    layer.append(el); return el;
  }
  // きせつ：つき で きまる（けんさようは ?kisetsu=haru|natsu|aki|fuyu）
  function season() {
    const asked = probe('kisetsu'); if (['haru', 'natsu', 'aki', 'fuyu'].includes(asked)) return asked;
    const m = day.getMonth() + 1; return m >= 3 && m <= 5 ? 'haru' : m >= 6 && m <= 8 ? 'natsu' : m >= 9 && m <= 11 ? 'aki' : 'fuyu';
  }

  let last = '';
  function draw() {
    const time = scene.dataset.time || 'hiru', area = scene.dataset.area || 'L', rain = scene.dataset.rain === 'true', now = season();
    const key = [time, area, rain, now, still()].join('|'); if (key === last) return; last = key;
    seed = ((day.getFullYear() * 372 + day.getMonth() * 31 + day.getDate()) * 7 + time.length * 13 + area.charCodeAt(0)) >>> 0;
    layer.textContent = '';
    const quiet = still();
    const sea = area === 'H' || area === 'B';   // みなと・ふね

    if (rain) {
      // あめの ひ：とりも むしも おやすみ。かえるが きしに いる（うみには いない）
      if (!sea) put('sit hop day', ART.kaeru(), between(20, 30), 60, {w: '7%', d: '-' + between(0, 6).toFixed(1) + 's'});
    } else if (time === 'yoru') {
      // よる：ほたる（うみでは でない）
      if (!sea && now !== 'fuyu') for (let i = 0; i < 7; i++) put('glow', '', between(6, 94), between(36, 58), {w: between(1.8, 2.8).toFixed(1) + '%', lap: between(3.6, 6.4).toFixed(1) + 's', lap2: between(12, 22).toFixed(0) + 's', d: '-' + between(0, 6).toFixed(1) + 's', dx: between(-6, 6).toFixed(1) + 'vw', dy: between(-5, 3).toFixed(1) + 'vw'});
    } else {
      // そらを とぶ とり：うみは かもめ、ほかは ことり（あさは おおめ）
      const birds = time === 'asa' ? 3 : time === 'hiru' ? 1 : 2;
      for (let i = 0; i < birds; i++) {
        const y = between(8, 30), lap = between(22, 38);
        if (quiet) put('day', sea ? ART.kamome() : ART.kotori(['#8fc7e8', '#f2c46b', '#e89aa8'][i % 3]), between(12, 88), y, {w: '6%'});
        else put('fly day', sea ? ART.kamome() : ART.kotori(['#8fc7e8', '#f2c46b', '#e89aa8'][i % 3]), 0, y, {w: sea ? '8%' : '6%', lap: lap.toFixed(0) + 's', d: '-' + between(0, lap).toFixed(1) + 's', rise: between(-9, 3).toFixed(1) + 'vw'});
      }
      if (!sea) {
        // ちょうちょ（はる・なつの ひる と あさ）
        if ((now === 'haru' || now === 'natsu') && time !== 'yuu') for (let i = 0; i < 2; i++) put('flutter day', ART.chou(['#ffd76a', '#ffffff', '#b9a4f5'][Math.floor(rnd() * 3)]), between(8, 70), between(44, 56), {w: '5%', lap: between(15, 24).toFixed(0) + 's', d: '-' + between(0, 12).toFixed(1) + 's'});
        // とんぼ（なつ・あき。ゆうがたは あかとんぼ）
        if (now === 'natsu' || now === 'aki') for (let i = 0; i < (time === 'yuu' ? 3 : 2); i++) put('hover day', ART.tonbo(time === 'yuu' || now === 'aki' ? '#e4572e' : '#3aa6b9'), between(8, 74), between(60, 78), {w: '7%', lap: between(10, 16).toFixed(0) + 's', d: '-' + between(0, 9).toFixed(1) + 's'});
      }
    }
    // きせつの ふる もの（あめの ひは ださない）。すくなめ：みている ひとの じゃまを しない
    if (!rain && !quiet) {
      if (now === 'haru' && time !== 'yoru') for (let i = 0; i < 5; i++) put('fall', ART.hanabira(), between(0, 90), 0, {w: '3%', lap: between(11, 17).toFixed(0) + 's', d: '-' + between(0, 16).toFixed(1) + 's', dx: between(4, 16).toFixed(0) + 'vw', spin: between(2.5, 5).toFixed(1) + 's'});
      if (now === 'aki' && !sea) for (let i = 0; i < 4; i++) put('fall day', ART.ochiba(['#e8913a', '#d9552e', '#e8c23a'][i % 3]), between(0, 90), 0, {w: '3.6%', lap: between(12, 19).toFixed(0) + 's', d: '-' + between(0, 18).toFixed(1) + 's', dx: between(4, 18).toFixed(0) + 'vw', spin: between(3, 6).toFixed(1) + 's'});
      if (now === 'fuyu') for (let i = 0; i < 12; i++) put('fall snow', '', between(0, 96), 0, {w: between(1, 1.8).toFixed(1) + '%', lap: between(13, 22).toFixed(0) + 's', d: '-' + between(0, 22).toFixed(1) + 's', dx: between(-4, 8).toFixed(0) + 'vw'});
    }
  }

  draw();
  new MutationObserver(draw).observe(scene, {attributes: true, attributeFilter: ['data-time', 'data-area', 'data-rain']});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', draw);
  // けんさの ための よみとり口（なまえは ふやす だけ）
  window.TsuriIkimono = {count: () => layer.children.length, kinds: () => [...layer.children].map(el => el.className), season, redraw: () => { last = ''; draw(); }};
})();
