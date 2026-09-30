/* まるふわ つりびより：ぽつぽつの あめ（そとづけ）
   ・ほんたいの あめ（#rain＝ななめの せん）を かくして、つぶが ぽつぽつ おちて、みずに ちいさな わが ひろがる あめに する
   ・マスター 9/30「せんじゃなくて、ぽつぽつと。ふつうの あめに」
   ・さわれない。うごきを へらす せっていでは、つぶを うごかさず うすく おくだけ。ほぞん・つうしん なし */
(() => {
  'use strict';
  const scene = document.getElementById('scene');
  if (!scene || document.getElementById('ame')) return;
  const query = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  if (local && query.get('ame') === '0') return;

  const style = document.createElement('style'); style.id = 'ame-style';
  style.textContent = `
#scene[data-rain=true] #rain{display:none}
#ame{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;display:none;container-type:size}   /* cqh（おちる きょり）を 景色の たかさに するには、たてにも きめる（inline-size だけだと 画面の たかさに なる） */
#scene[data-rain=true] #ame{display:block}
#ame .d{position:absolute;top:-4%;width:.55cqw;height:2.2cqw;border-radius:50%;background:linear-gradient(#ffffff10,#ffffffc0);animation:ame-fall var(--t,1.3s) linear infinite;animation-delay:var(--d,0s);opacity:.85}
#ame .w{position:absolute;width:3.2cqw;height:1.1cqw;border:1.5px solid #ffffffb0;border-radius:50%;translate:-50% -50%;animation:ame-ring var(--t,1.6s) ease-out infinite;animation-delay:var(--d,0s);opacity:0}
#ame .p{position:absolute;width:.9cqw;height:.9cqw;border-radius:50%;background:#ffffff90;translate:-50% -50%;animation:ame-pop var(--t,1.6s) ease-out infinite;animation-delay:var(--d,0s);opacity:0}
@keyframes ame-fall{from{transform:translateY(0)}to{transform:translateY(110cqh)}}
@keyframes ame-ring{0%{transform:scale(.2);opacity:.9}60%{opacity:.35}100%{transform:scale(1.6);opacity:0}}
@keyframes ame-pop{0%{transform:translateY(0) scale(.6);opacity:.9}40%{transform:translateY(-1.4cqw) scale(1);opacity:.7}100%{transform:translateY(0) scale(.3);opacity:0}}
@media(prefers-reduced-motion:reduce){#ame *{animation:none!important}#ame .d{opacity:.35;top:auto}#ame .w,#ame .p{display:none}}
`;
  document.head.append(style);
  const layer = document.createElement('div'); layer.id = 'ame'; layer.setAttribute('aria-hidden', 'true');
  const rain = document.getElementById('rain'); rain ? rain.after(layer) : scene.append(layer);

  const r = (a, b) => a + Math.random() * (b - a);
  // おちる つぶ：36こ。すこし ちがう はやさで、ぱらぱら
  for (let i = 0; i < 36; i++) {
    const d = document.createElement('span'); d.className = 'd';
    d.style.left = r(0, 100) + '%'; d.style.setProperty('--t', r(1.1, 1.7).toFixed(2) + 's'); d.style.setProperty('--d', '-' + r(0, 1.7).toFixed(2) + 's');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) d.style.top = r(0, 90) + '%';
    layer.append(d);
  }
  // みずに ひろがる わ と はねる しずく：みずの ところ（したの 39%）にだけ。てまえほど おおきく
  for (let i = 0; i < 22; i++) {
    const y = r(63, 98), x = r(2, 98), t = r(1.3, 2.1).toFixed(2) + 's', dl = '-' + r(0, 2.1).toFixed(2) + 's';
    const w = document.createElement('span'); w.className = 'w'; w.style.left = x + '%'; w.style.top = y + '%'; w.style.scale = String(.6 + (y - 63) / 35); w.style.setProperty('--t', t); w.style.setProperty('--d', dl);
    const p = document.createElement('span'); p.className = 'p'; p.style.left = x + '%'; p.style.top = y + '%'; p.style.setProperty('--t', t); p.style.setProperty('--d', dl);
    layer.append(w, p);
  }
  window.TsuriAme = {count: () => layer.children.length};
})();
