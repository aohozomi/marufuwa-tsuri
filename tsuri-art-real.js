// まるふわ つりびより：本物の 魚の絵（天）。build_real_art.py が 作る（てで かえない）。あるだけ、かりの え（tsuri-art.js）を さしかえる
// TsuriArt[番号]＝画像の 場所（WebP 512×512・透明）／TsuriArt.shadow[番号]＝あり／TsuriArt.shadowMask(番号)＝影の マスク（外接矩形で きりだした 黒の シルエット）
(function () {
  var A = window.TsuriArt; if (!A || !A.fish || !A.meta) return;
  var REAL = {"0": {"src": "img/fish/00.webp", "mask": "img/fish/00_s.png", "aspect": 1.891}, "1": {"src": "img/fish/01.webp", "mask": "img/fish/01_s.png", "aspect": 1.43}, "2": {"src": "img/fish/02.webp", "mask": "img/fish/02_s.png", "aspect": 1.408}, "3": {"src": "img/fish/03.webp", "mask": "img/fish/03_s.png", "aspect": 2.993}, "4": {"src": "img/fish/04.webp", "mask": "img/fish/04_s.png", "aspect": 1.387}, "5": {"src": "img/fish/05.webp", "mask": "img/fish/05_s.png", "aspect": 1.449}};
  var oldMask = A.shadowMask;
  // 絵の 場所は「この ファイルの 場所」から（ページの 場所では ない）。ひろば（/hiroba/）から よんでも ずれない
  var BASE = (document.currentScript && document.currentScript.src) || document.baseURI;
  var toUrl = function (p) { try { return new URL(p, BASE).href; } catch (e) { return p; } };
  A.meta.real = A.meta.real || {};
  Object.keys(REAL).forEach(function (id) {
    var r = REAL[id], abs = toUrl;
    Object.defineProperty(A, id, {enumerable: true, configurable: true, get: function () { return abs(r.src); }});
    A.fish[id] = abs(r.src);
    A.shadow[id] = abs(r.mask);
    if (A.meta.shadowAspect) A.meta.shadowAspect[id] = r.aspect;
    A.meta.real[id] = true;
  });
  A.shadowMask = function (id) { var r = REAL[id]; return r ? 'url("' + toUrl(r.mask) + '")' : oldMask(id); };
})();
