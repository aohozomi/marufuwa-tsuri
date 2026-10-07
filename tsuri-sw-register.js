/* まるふわ びより：オフライン用の しくみを 登録する（外付け・総司令部）
   ・https か localhost の ときだけ。Xアプリなどの ブラウザでは 使えない ことが 多い（そのまま 何も 起きない）
   ・?nosw=1 で ひらくと、この しくみと 保存を 外す（こまった ときの 逃げ道）
   ・外へは 何も 送らない */
(() => {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  const query = new URLSearchParams(location.search);
  if (query.get('nosw')) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then(ks => ks.filter(k => k.startsWith('marufuwa-tsuri-sw-')).forEach(k => caches.delete(k))).catch(() => {});
    return;
  }
  const ok = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (!ok) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}); });
})();
