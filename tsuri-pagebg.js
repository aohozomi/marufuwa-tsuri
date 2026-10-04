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
  var cur = null, id = '', tok = 0, opt = {};   // opt＝{tint:'rgba(..)'（絵の うえの かさね色・昼夜 とも）, panel/panelNight:'rgba(..)'（まん中の いた）, border:'#色', navy:数字（夜の 紺の かさねの こさ・既定 .55／tint が あれば .3）, padY:数字（600px みまんの うえしたの よはく）, glow:'radial-gradient(..)'（ほのかな あかり）}
  function tryLoad(list, i, done) {
    if (i >= list.length) { done(null); return; }
    var im = new Image(); im.onload = function () { done(list[i]); }; im.onerror = function () { tryLoad(list, i + 1, done); }; im.src = list[i].url;
  }
  function apply() {
    var my = ++tok, night = timeKey() === 'n', narrow = (window.innerWidth || 1000) < 600, list = [], names = night ? ['yoru', 'hiru'] : ['hiru'];
    names.forEach(function (nm) { if (narrow || opt.tate) list.push({ url: BASE + 'img/bg/' + id + '_' + nm + '_tate.webp', night: night && nm === 'hiru' }); if (!opt.tate) list.push({ url: BASE + 'img/bg/' + id + '_' + nm + '.webp', night: night && nm === 'hiru' }); });
    if (opt.fb) list = [];   // fb：絵を さがさず かりの 背景（そら・おか・ほし）だけ しく（天の 絵が ほぼ 無地の ページ・絵の ない ページ用・10/5 見た目巡回）
    tryLoad(list, 0, function (hit) {
      if (my !== tok) return;
      var st = document.getElementById('pagebg-style'); if (!st) { st = document.createElement('style'); st.id = 'pagebg-style'; document.head.append(st); }
      if (!hit) {   // 絵が まだ ない ページ：かりの 背景（そら・おか・ほし）を コードで しく。「うしろが なにも ない」を つくらない（10/4 マスター）。天の 絵が とどけば そちらに かわる
        root.classList.remove('pagebg-on'); cur = null;
        var hill = function (c1, c2) { return 'radial-gradient(130% 34% at 18% 100%,' + c1 + ' 0 62%,#0000 63%),radial-gradient(120% 40% at 88% 104%,' + c2 + ' 0 62%,#0000 63%)'; };
        var bg = night
          ? 'radial-gradient(1.5px 1.5px at 12% 14%,#fffd 0 60%,#0000),radial-gradient(1.5px 1.5px at 34% 8%,#fffc 0 60%,#0000),radial-gradient(2px 2px at 58% 18%,#fffd 0 60%,#0000),radial-gradient(1.5px 1.5px at 78% 9%,#fffc 0 60%,#0000),radial-gradient(2px 2px at 90% 24%,#fffd 0 60%,#0000),radial-gradient(1.5px 1.5px at 22% 30%,#fffb 0 60%,#0000),radial-gradient(circle at 82% 14%,#fff6c8 0 3.2%,#fff6c800 3.6%),' + hill('#1d3a4a', '#16303f') + ',linear-gradient(#141c3e,#2a3a66 75%,#3b4d7c)'
          : 'radial-gradient(circle at 84% 12%,#fff9cf 0 4%,#fff9cf00 4.6%),radial-gradient(ellipse 22% 5% at 22% 16%,#fffc 0 60%,#0000),radial-gradient(ellipse 18% 4% at 58% 26%,#fffa 0 60%,#0000),' + hill('#9bd6a2', '#78c595') + ',linear-gradient(#b7e1f5,#e9f6fa 72%,#f6f0d8)';
        st.textContent = 'html.pagebg-fb body{background:' + bg + ';background-color:' + (night ? '#1c2750' : '#cfeaf4') + '}'; root.classList.add('pagebg-fb'); return;
      }
      root.classList.remove('pagebg-fb');
      cur = hit.url;
      var tint = opt.tint ? 'linear-gradient(' + opt.tint + ',' + opt.tint + '), ' : '';
      var navy = hit.night ? (function (a) { return 'linear-gradient(rgba(16,24,64,' + a + '),rgba(16,24,64,' + a + ')), '; })(opt.navy !== undefined ? opt.navy : (opt.tint ? .3 : .55)) : '';
      var over = (opt.glow ? opt.glow + ', ' : '') + navy + tint;
      var panel = night ? (opt.panelNight || 'rgba(244,241,252,.84)') : (opt.panel || 'rgba(255,255,255,.82)');
      if (opt.blur) {   // blur：同じ 絵を ぼかして ページの 地に（別の 絵に 見えない）。body の うしろに 敷く（fixed は つかわない）
        st.textContent = 'html.pagebg-on body{position:relative;isolation:isolate;overflow-x:clip;background:' + (night ? '#1a1228' : '#2a1d14') + '}'
          + 'html.pagebg-on body::before{content:"";position:absolute;inset:0;z-index:-1;background:' + over + 'url("' + hit.url + '") center/cover no-repeat;filter:blur(' + (+opt.blur || 18) + 'px);pointer-events:none}'
          + 'html.pagebg-on .room{background:' + panel + '!important;' + (opt.border ? 'border-color:' + opt.border + '!important;' : '') + '-webkit-backdrop-filter:none;backdrop-filter:none}';
        root.classList.add('pagebg-on'); return;
      }
      st.textContent = 'html.pagebg-on body{background:' + over + 'url("' + hit.url + '") center/cover no-repeat, ' + (night ? '#2b3560' : '#d9c3a0') + '}'
        + (opt.padY && (window.innerWidth || 1000) < 600 ? 'html.pagebg-on body{padding-top:' + opt.padY + 'px;padding-bottom:' + opt.padY + 'px}' : '')   // せまい がめんでは いたの うえした に よはくを あけて 絵（ランプ・まめの ふくろ）を 見せる
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
