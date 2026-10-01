// まるふわ つりびより：まるふわの「ふくの いろ」（じぶんの どうぐ）を、ひろば・おへやの まるふわにも 出す（外付け・共有ファイル）
//   ・読むのは localStorage['marufuwa-tsuri-v1'] の my.wear（えらんだ いろ）と xp（レベル）だけ。書かない・そとへ 何も おくらない。
//   ・色の きめかた・レベルの しきは つりびより本体（index.html の GEAR.wear・wearUrl・levelOf）と 同じ。あおい ぶぶんの いろあいだけ かえる（しろ・ほほ・め・かばんは そのまま）。
//     同じ 結果に なる ことは 検査（verify_wear_inpage.js）が 本体の 出す 絵と ピクセルまで くらべる。
//   ・もちもの（v2）：まるふわの 左手に 小物（ランタン・バケツ・おにぎり・あみ・おはな・かさ）を 持たせる。えらんだ 番号（0＝なし）は おへやの 記録 marufuwa-tsuri-tank-v1 の item（数字だけ・よむだけ・かかない）。
//     レベルが たりない 物・しらない 番号は 持たない。絵は コードで 描く（顔・からだには かぶせない）。apply が 色と いっしょに 描き、compose で 本体も おなじ 絵を 作れる。
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
  var TANK_KEY = 'marufuwa-tsuri-tank-v1';
  // もちもの（0＝なし）。番号は ふやす ときは うしろへ（まえの 番号を かえない）。lv＝ひらく レベル（本体と おなじ しき）
  var ITEMS = [
    { k: 'none', lv: 0, ja: 'なし', en: 'None' }, { k: 'lantern', lv: 1, ja: 'ランタン', en: 'Lantern' }, { k: 'bucket', lv: 1, ja: 'バケツ', en: 'Bucket' }, { k: 'onigiri', lv: 1, ja: 'おにぎり', en: 'Rice ball' },
    { k: 'net', lv: 3, ja: 'あみ', en: 'Net' }, { k: 'flower', lv: 5, ja: 'おはな', en: 'Flower' }, { k: 'umbrella', lv: 8, ja: 'かさ', en: 'Umbrella' }
  ];
  var cache = {}, pending = {};
  function readSave() { try { var d = JSON.parse(localStorage.getItem(KEY)); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
  function levelOf(xp) { return Math.max(1, Math.floor(Math.sqrt(1 + Math.max(0, Number(xp) || 0) / 20))); }   // 本体の levelOf と おなじ
  function readTankItem() { try { var d = JSON.parse(localStorage.getItem(TANK_KEY)), n = Math.floor(Number(d && d.item)); return Number.isFinite(n) && n >= 0 && n < ITEMS.length ? n : 0; } catch (e) { return 0; } }
  // いま 持つ もの。レベルが たりない・しらない 番号は なし
  function currentItem() { var n = readTankItem(), o = ITEMS[n]; return o && o.lv <= levelOf(readSave().xp) && n > 0 ? { n: n, k: o.k, lv: o.lv, active: true } : { n: 0, k: 'none', lv: 0, active: false }; }
  // いま つかう 色。まだ ひらいて いない（レベルが たりない）色・しらない 名前は 水色（そのまま）
  function current() {
    var s = readSave(), want = s.my && s.my.wear, lv = levelOf(s.xp), o = null;
    for (var i = 0; i < LIST.length; i++) if (LIST[i].k === want) o = LIST[i];
    return o && o.lv <= lv ? o : LIST[0];
  }
  // ─── もちもの の 絵：元の 絵（240×320）の ざひょうで 描く（左手＝(96,198)。顔（y<180）には かぶせない）───
  var INK = '#6b3a22';
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
  function fillStroke(c, fill, w) { c.fillStyle = fill; c.fill(); c.lineWidth = w || 3; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); }
  var DRAW = {
    lantern: function (c) {
      var g = c.createRadialGradient(96, 240, 2, 96, 240, 34); g.addColorStop(0, 'rgba(255,240,170,.55)'); g.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = g; c.beginPath(); c.arc(96, 240, 34, 0, 6.3); c.fill();
      c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(96, 196); c.lineTo(96, 212); c.stroke();
      rr(c, 86, 211, 20, 7, 3); fillStroke(c, '#ffb347', 2.6); rr(c, 84, 218, 24, 30, 7); fillStroke(c, '#fff3b0', 2.6);
      c.strokeStyle = '#e9a23b'; c.lineWidth = 2; c.beginPath(); c.moveTo(96, 220); c.lineTo(96, 246); c.moveTo(88, 232); c.lineTo(104, 232); c.stroke();
      rr(c, 86, 247, 20, 7, 3); fillStroke(c, '#ffb347', 2.6);
    },
    bucket: function (c) {
      c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.arc(96, 224, 17, 3.14, 6.28); c.stroke();
      c.beginPath(); c.moveTo(78, 226); c.lineTo(114, 226); c.lineTo(108, 262); c.lineTo(84, 262); c.closePath(); fillStroke(c, '#7fc8ee', 2.8);
      c.strokeStyle = '#ffffffaa'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(82, 236); c.lineTo(110, 236); c.stroke(); c.strokeStyle = '#4fa3d4'; c.lineWidth = 2; c.beginPath(); c.moveTo(81, 244); c.lineTo(111, 244); c.stroke();
    },
    onigiri: function (c) {
      c.beginPath(); c.moveTo(96, 190); c.quadraticCurveTo(104, 192, 124, 224); c.quadraticCurveTo(128, 236, 116, 238); c.lineTo(76, 238); c.quadraticCurveTo(64, 236, 68, 224); c.quadraticCurveTo(88, 192, 96, 190); c.closePath(); fillStroke(c, '#ffffff', 3);
      c.beginPath(); c.moveTo(82, 224); c.lineTo(110, 224); c.lineTo(113, 238); c.lineTo(79, 238); c.closePath(); fillStroke(c, '#3b5a47', 2.6);
      c.fillStyle = INK; c.beginPath(); c.arc(92, 208, 1.6, 0, 6.3); c.arc(100, 208, 1.6, 0, 6.3); c.fill();
    },
    net: function (c) {
      c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(96, 198); c.lineTo(52, 292); c.stroke(); c.strokeStyle = '#d9a566'; c.lineWidth = 2; c.beginPath(); c.moveTo(96, 198); c.lineTo(52, 292); c.stroke();
      c.beginPath(); c.arc(40, 262, 20, 0, 6.3); c.fillStyle = '#e6f6ffaa'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = '#7fb5cf'; c.lineWidth = 1.4; for (var i = -14; i <= 14; i += 9) { c.beginPath(); c.moveTo(40 + i, 262 - 14); c.lineTo(40 + i, 262 + 14); c.stroke(); c.beginPath(); c.moveTo(40 - 14, 262 + i); c.lineTo(40 + 14, 262 + i); c.stroke(); }
    },
    flower: function (c) {
      c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(96, 256); c.lineTo(96, 214); c.stroke(); c.strokeStyle = '#6cc796'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(96, 256); c.lineTo(96, 214); c.stroke();
      c.beginPath(); c.ellipse(86, 242, 9, 4.5, -.6, 0, 6.3); fillStroke(c, '#7fd6a4', 2.2);
      for (var a = 0; a < 5; a++) { var t = a * 1.2566 - 1.57; c.beginPath(); c.arc(96 + Math.cos(t) * 11, 206 + Math.sin(t) * 11, 9, 0, 6.3); fillStroke(c, '#ff9ab8', 2.4); }
      c.beginPath(); c.arc(96, 206, 7, 0, 6.3); fillStroke(c, '#ffe27a', 2.4);
    },
    umbrella: function (c) {
      c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(96, 198); c.lineTo(96, 270); c.stroke(); c.strokeStyle = '#d9a566'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(96, 198); c.lineTo(96, 270); c.stroke();
      c.beginPath(); c.moveTo(96, 204); c.quadraticCurveTo(112, 220, 108, 256); c.lineTo(96, 262); c.lineTo(84, 256); c.quadraticCurveTo(80, 220, 96, 204); c.closePath(); fillStroke(c, '#ffb3c7', 2.8);
      c.strokeStyle = '#ff8fb0'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(96, 206); c.lineTo(96, 260); c.moveTo(96, 208); c.quadraticCurveTo(104, 230, 103, 256); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.arc(103, 270, 7, 3.14, 1.2, true); c.stroke();
    }
  };
  function drawItem(c, k, w, h) { if (!DRAW[k]) return; c.save(); c.scale(w / 240, h / 320); try { DRAW[k](c); } catch (e) {} c.restore(); }
  // 元の 絵（url）の あおい ぶぶんだけ 色を かえた 絵（data URL・PNG）。item（{k}）が あれば 手に 持つ もの も 描く。できなければ ''
  function build(url, o, item) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
          var x = c.getContext('2d'); x.drawImage(im, 0, 0);
          var d = x.getImageData(0, 0, c.width, c.height), px = d.data;
          for (var i = 0; i < px.length && o && o.h; i += 4) {
            if (px[i + 3] < 8) continue;
            var r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), df = mx - mn;
            if (mx < .25 || df < .1) continue;
            var h = mx === r ? ((g - b) / df) % 6 : mx === g ? (b - r) / df + 2 : (r - g) / df + 4; h *= 60; if (h < 0) h += 360;
            if (h < 170 || h > 260) continue;   // あおの ぶぶんだけ
            var s = Math.min(1, df / mx * o.s), v = Math.min(1, mx * o.v), C = v * s, X = C * (1 - Math.abs((o.h / 60) % 2 - 1)), m = v - C, hh = Math.floor(o.h / 60) % 6;
            var rgb = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][hh];
            px[i] = Math.round((rgb[0] + m) * 255); px[i + 1] = Math.round((rgb[1] + m) * 255); px[i + 2] = Math.round((rgb[2] + m) * 255);
          }
          x.putImageData(d, 0, 0); if (item && item.k && item.k !== 'none') drawItem(x, item.k, c.width, c.height); resolve(c.toDataURL('image/png'));
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
    var o = current(), it = currentItem();
    if (!o.h && !it.active) { if (img.getAttribute('src') !== url) img.src = url; return; }
    var key = o.k + '|' + it.k + '|' + url, hit = cache[key];
    if (hit) { img.src = hit; return; }
    if (img.getAttribute('src') !== url) img.src = url;   // 用意が できる まえは 元の 絵
    var job = pending[key] || (pending[key] = build(url, o, it).then(function (u) { delete pending[key]; if (u) cache[key] = u; return u; }));
    job.then(function (u) { if (u && img.dataset.wearFor === url && current().k === o.k && currentItem().k === it.k) img.src = u; });
  }
  // よく つかう 絵を あらかじめ 作って おく（顔を かえた 時に 水色が ちらつかない ように）
  function warm(urls) {
    var o = current(), it = currentItem(); if (!o.h && !it.active) return;
    (urls || []).forEach(function (url) {
      var key = o.k + '|' + it.k + '|' + url; if (cache[key] || pending[key]) return;
      pending[key] = build(url, o, it).then(function (u) { delete pending[key]; if (u) cache[key] = u; return u; });
    });
  }
  // 本体（index.html）も おなじ 絵を 作る ための 口：色と もちもの を かけた 絵（data URL）を 返す Promise。かわらない（水色・もちもの なし）ときは 元の 住所を そのまま 返す
  function compose(url) { var o = current(), it = currentItem(); if (!o.h && !it.active) return Promise.resolve(url); var key = o.k + '|' + it.k + '|' + url; if (cache[key]) return Promise.resolve(cache[key]); return (pending[key] = pending[key] || build(url, o, it).then(function (u) { delete pending[key]; if (u) cache[key] = u; return u || url; })); }
  window.TsuriWear = {
    version: 2,
    items: function () { return ITEMS.map(function (o, n) { return { n: n, k: o.k, lv: o.lv, ja: o.ja, en: o.en }; }); },
    currentItem: currentItem, compose: compose, drawItem: drawItem,
    list: function () { return LIST.map(function (o) { return { k: o.k, lv: o.lv, h: o.h, s: o.s, v: o.v }; }); },
    current: function () { var o = current(); return { k: o.k, lv: o.lv, h: o.h, s: o.s, v: o.v, active: !!o.h }; },   // build(url, current()) で 色つきの 絵を 作れる
    levelOf: levelOf, apply: apply, build: build, warm: warm
  };
})();
