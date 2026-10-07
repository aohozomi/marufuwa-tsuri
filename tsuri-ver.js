/* まるふわ びより：版の 表示と、新しい 版への 自動切りかえ（tsuri-ver.js・Claude 2026-10-05）
   ・画面の すみに ちいさく「v79」。HTML の <script src="tsuri-ver.js?v=79"> の 数字を そのまま 出す
     ＝いま 見えて いる ページが「どの 版の HTML か」が わかる（古い キャッシュの 切りわけ用）
   ・service worker が 新しく なって 引きついだ とき、1回だけ 自動で 読みなおす（60びょう いない は 読みなおさない＝ループ しない）
   ・外へは 何も 送らない・記録しない（読みなおしの 印は この タブの sessionStorage だけ） */
(function () {
  'use strict';
  var s = document.currentScript, m = s && /[?&]v=([\w.-]+)/.exec(s.src), v = m ? m[1] : '?';
  window.TSURI_VER = v;
  function show() {
    if (document.getElementById('tsuri-ver')) return;
    var el = document.createElement('div');
    el.id = 'tsuri-ver'; el.textContent = 'v' + v; el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;right:6px;bottom:4px;font:11px/1.2 system-ui,sans-serif;color:#2f2a3d;background:rgba(255,255,255,.6);padding:2px 6px;border-radius:6px;opacity:.7;z-index:2147483000;pointer-events:none';
    (document.body || document.documentElement).appendChild(el);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
  if ('serviceWorker' in navigator) {
    var had = !!navigator.serviceWorker.controller, done = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!had || done) return;   // はじめての 登録では 読みなおさない
      try { var k = 'marufuwa-sw-reload', t = +sessionStorage.getItem(k) || 0; if (Date.now() - t < 60000) return; sessionStorage.setItem(k, String(Date.now())); } catch (e) {}
      done = true; location.reload();
    });
  }
})();
