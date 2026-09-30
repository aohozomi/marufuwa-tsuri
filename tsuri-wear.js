// まるふわ つりびより：まるふわの「ふくの いろ」（じぶんの どうぐ）を、ひろば・おへやの まるふわにも 出す（外付け・共有ファイル）
//   ・読むのは localStorage['marufuwa-tsuri-v1'] の my.wear（えらんだ いろ）と xp（レベル）だけ。書かない・そとへ 何も おくらない。
//   ・色の きめかた・レベルの しきは つりびより本体（index.html の GEAR.wear・wearUrl・levelOf）と 同じ。あおい ぶぶんの いろあいだけ かえる（しろ・ほほ・め・かばんは そのまま）。
//     同じ 結果に なる ことは 検査（verify_wear_inpage.js）が 本体の 出す 絵と ピクセルまで くらべる。
//   ・使い方：<script src="tsuri-wear.js"></script> を 先に 読み、まるふわの <img> の 絵を かえる 所で
//       TsuriWear.apply(imgEl, '…/img/game-blue.webp')  ← 元の 絵の 住所。ふつうの 水色なら そのまま、えらんだ 色が あれば 用意が できた ところで 差しかえる（用意が できる まえは 元の 絵）。
//   ・本体に 手を 入れずに、ひろばと おへやの しゃしん（img を そのまま 描く）にも 同じ 色で 写る。読めなくても、色が かわらない だけ（元の 絵で 動く）。
(function () {
  'use strict';
  var KEY = 'marufuwa-tsuri-v1';
  // 本体の GEAR.wear.list と おなじ ならび（k・レベル・色あい h・こさ s・あかるさ v）。水色（ao）は 元の 絵の まま
  var LIST = [
    { k: 'ao', lv: 1 }, { k: 'momo', lv: 1, h: 335, s: 1, v: 1.04 }, { k: 'midori', lv: 1, h: 140, s: .95, v: 1 },
    { k: 'kiiro', lv: 8, h: 45, s: 1.05, v: 1.08 }, { k: 'murasaki', lv: 15, h: 265, s: .9, v: 1.02 },
    { k: 'aka', lv: 20, h: 5, s: 1.05, v: 1.05 }, { k: 'orenji', lv: 25, h: 28, s: 1.05, v: 1.06 },
    { k: 'shiro', lv: 30, h: 215, s: .18, v: 1.12 }, { k: 'kuro', lv: 40, h: 220, s: .25, v: .5 }
  ];
  var cache = {}, pending = {};
  function readSave() { try { var d = JSON.parse(localStorage.getItem(KEY)); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
  function levelOf(xp) { return Math.max(1, Math.floor(Math.sqrt(1 + Math.max(0, Number(xp) || 0) / 20))); }   // 本体の levelOf と おなじ
  // いま つかう 色。まだ ひらいて いない（レベルが たりない）色・しらない 名前は 水色（そのまま）
  function current() {
    var s = readSave(), want = s.my && s.my.wear, lv = levelOf(s.xp), o = null;
    for (var i = 0; i < LIST.length; i++) if (LIST[i].k === want) o = LIST[i];
    return o && o.lv <= lv ? o : LIST[0];
  }
  // 元の 絵（url）の あおい ぶぶんだけ 色を かえた 絵（data URL・PNG）。できなければ ''
  function build(url, o) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
          var x = c.getContext('2d'); x.drawImage(im, 0, 0);
          var d = x.getImageData(0, 0, c.width, c.height), px = d.data;
          for (var i = 0; i < px.length; i += 4) {
            if (px[i + 3] < 8) continue;
            var r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), df = mx - mn;
            if (mx < .25 || df < .1) continue;
            var h = mx === r ? ((g - b) / df) % 6 : mx === g ? (b - r) / df + 2 : (r - g) / df + 4; h *= 60; if (h < 0) h += 360;
            if (h < 170 || h > 260) continue;   // あおの ぶぶんだけ
            var s = Math.min(1, df / mx * o.s), v = Math.min(1, mx * o.v), C = v * s, X = C * (1 - Math.abs((o.h / 60) % 2 - 1)), m = v - C, hh = Math.floor(o.h / 60) % 6;
            var rgb = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][hh];
            px[i] = Math.round((rgb[0] + m) * 255); px[i + 1] = Math.round((rgb[1] + m) * 255); px[i + 2] = Math.round((rgb[2] + m) * 255);
          }
          x.putImageData(d, 0, 0); resolve(c.toDataURL('image/png'));
        } catch (e) { resolve(''); }
      };
      im.onerror = function () { resolve(''); };
      im.src = url;
    });
  }
  // まるふわの <img> に 元の 絵（url）を 出す。えらんだ 色が あれば、用意が できた ところで 差しかえる
  function apply(img, url) {
    if (!img) return;
    img.dataset.wearFor = url;
    var o = current();
    if (!o.h) { if (img.getAttribute('src') !== url) img.src = url; return; }
    var key = o.k + '|' + url, hit = cache[key];
    if (hit) { img.src = hit; return; }
    if (img.getAttribute('src') !== url) img.src = url;   // 用意が できる まえは 元の 絵
    var job = pending[key] || (pending[key] = build(url, o).then(function (u) { delete pending[key]; if (u) cache[key] = u; return u; }));
    job.then(function (u) { if (u && img.dataset.wearFor === url && current().k === o.k) img.src = u; });
  }
  // よく つかう 絵を あらかじめ 作って おく（顔を かえた 時に 水色が ちらつかない ように）
  function warm(urls) {
    var o = current(); if (!o.h) return;
    (urls || []).forEach(function (url) {
      var key = o.k + '|' + url; if (cache[key] || pending[key]) return;
      pending[key] = build(url, o).then(function (u) { delete pending[key]; if (u) cache[key] = u; return u; });
    });
  }
  window.TsuriWear = {
    version: 1,
    list: function () { return LIST.map(function (o) { return { k: o.k, lv: o.lv, h: o.h, s: o.s, v: o.v }; }); },
    current: function () { var o = current(); return { k: o.k, lv: o.lv, h: o.h, s: o.s, v: o.v, active: !!o.h }; },   // build(url, current()) で 色つきの 絵を 作れる
    levelOf: levelOf, apply: apply, build: build, warm: warm
  };
})();
