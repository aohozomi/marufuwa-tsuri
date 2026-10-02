/* まるふわ つりびより：ページの はいけい（tsuri-pagebg.js）（ゲーム開発司令部２・2026-10-02）
   カフェ・びじゅつかん・おすすめの へや・まるいろ の ページの 地に「天の イラスト」を しく。ファイルを img/bg/ に 置くだけで 出る：
     img/bg/<id>_hiru.webp（ひる・よこ）／<id>_yoru.webp（よる・よこ）／<id>_hiru_tate.webp／<id>_yoru_tate.webp（はば 600px みまんの たてながの 版）
   ・よる（?time=n・data-time=n）は yoru が あれば それを。なければ hiru に「くらい かさね（rgba の 紺 .55）」を かける。
   ・はば 600px みまんは _tate を 先に ためし、なければ よこ版。えが 1まいも なければ 何も かえない（いまの 地の まま）。
   ・background は center/cover no-repeat（fixed は つかわない＝iOS で おもい）。えの したに おなじ 系の 無地色（よみこむ まえの 色）。
   ・ぶんしょうの おび（.room）は 半透明の しろい いた（rgba(255,255,255,.82)）に する＝文字は 4.5対1 いじょう（けんさで 測る）。
   つかいかた：PageBg.init('cafe') */
(function () {
  'use strict';
  if (window.PageBg) return;
  var BASE = (function () { try { var s = document.currentScript; return s && s.src ? s.src.replace(/[^\/]*$/, '') : ''; } catch (e) { return ''; } })();
  var root = document.documentElement;
  var timeKey = function () { var t = root.dataset.time; return /^[ahyn]$/.test(t || '') ? t : 'h'; };
  var cur = null, id = '', tok = 0, opt = {};   // opt＝{tint:'rgba(..)'（絵の うえの かさね色・昼夜 とも）, panel/panelNight:'rgba(..)'（まん中の いた）, border:'#色', glow:'radial-gradient(..)'（ほのかな あかり）}
  function tryLoad(list, i, done) {
    if (i >= list.length) { done(null); return; }
    var im = new Image(); im.onload = function () { done(list[i]); }; im.onerror = function () { tryLoad(list, i + 1, done); }; im.src = list[i].url;
  }
  function apply() {
    var my = ++tok, night = timeKey() === 'n', narrow = (window.innerWidth || 1000) < 600, list = [], names = night ? ['yoru', 'hiru'] : ['hiru'];
    names.forEach(function (nm) { if (narrow) list.push({ url: BASE + 'img/bg/' + id + '_' + nm + '_tate.webp', night: night && nm === 'hiru' }); list.push({ url: BASE + 'img/bg/' + id + '_' + nm + '.webp', night: night && nm === 'hiru' }); });
    tryLoad(list, 0, function (hit) {
      if (my !== tok) return;
      var st = document.getElementById('pagebg-style'); if (!st) { st = document.createElement('style'); st.id = 'pagebg-style'; document.head.append(st); }
      if (!hit) { st.textContent = ''; root.classList.remove('pagebg-on'); cur = null; return; }
      cur = hit.url;
      var tint = opt.tint ? 'linear-gradient(' + opt.tint + ',' + opt.tint + '), ' : '';
      var navy = hit.night ? (opt.tint ? 'linear-gradient(rgba(16,24,64,.3),rgba(16,24,64,.3)), ' : 'linear-gradient(rgba(16,24,64,.55),rgba(16,24,64,.55)), ') : '';
      var over = (opt.glow ? opt.glow + ', ' : '') + navy + tint;
      var panel = night ? (opt.panelNight || 'rgba(244,241,252,.84)') : (opt.panel || 'rgba(255,255,255,.82)');
      st.textContent = 'html.pagebg-on body{background:' + over + 'url("' + hit.url + '") center/cover no-repeat, ' + (night ? '#2b3560' : '#d9c3a0') + '}'
        + 'html.pagebg-on .room{background:' + panel + '!important;' + (opt.border ? 'border-color:' + opt.border + '!important;' : '') + '-webkit-backdrop-filter:none;backdrop-filter:none}';
      root.classList.add('pagebg-on');
    });
  }
  var rt = 0;
  window.PageBg = {
    init: function (pageId, o) { id = String(pageId || '').replace(/[^a-z0-9_-]/gi, ''); if (!id) return; opt = o && typeof o === 'object' ? o : {}; apply(); addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(apply, 250); }); },
    current: function () { return cur; }, opts: function () { return opt; }, apply: apply
  };
})();
