// まるふわ つりびより：ひろがる つりば（もりの いけ・ゆきの みずうみ）の さかな 8しゅの え（かり）。ゲーム開発司令部１が コードで つくった：
// ほかの さかなの 色ちがい＋小さな えもじの ばっじ（tsuri-art-season.js と おなじ かた）。ばんごうは 本体の FISH の 46ばん〜。
// ほんものの え（天）が きたら、tsuri-art.js の 46〜53 ばんに さしかえて、この ファイルは はずす。
// 使い方は tsuri-art.js と おなじ：TsuriArt[番号]＝画像の住所／TsuriArt.fish[番号]＝生のSVG／TsuriArt.shadow[番号]＝影
(function () {
  var A = window.TsuriArt;
  if (!A || !A.fish || !A.shadow || !A.meta) return;
  // [ばんごう, もとに する さかなの ばんごう, hue-rotate（度）, saturate, brightness, ばっじの えもじ]
  var S = [
    [46, 28, 62, 0.8, 0.88, '🌿'],     // こけむしこい：きんの まるごいを こけいろに
    [47, 3, 195, 0.9, 1.0, '🌰'],      // どんぐりめだか：ころいわしを ちゃいろに
    [48, 22, 215, 3.4, 1.1, '✨'],     // ほたるうお：ぎんいろを ほたるの きみどりに
    [49, 3, 22, 0.45, 1.12, '🌫️'],    // あさぎりいわな：ころいわしを きりの うすい あおみどりに
    [50, 22, -12, 1.9, 1.12, '❄️'],    // こおりわかさぎ：ぎんいろを こおりの あおに
    [51, 23, 0, 0.3, 1.2, '🌨️'],     // ゆきだまはぜ：しゃぼんだまうおを ゆきの しろに
    [52, 18, -88, 1.0, 1.0, '♨️'],     // おんせんがめ：ころころかめを あったかい あかちゃに
    [53, 20, -62, 3.0, 1.12, '🌌']     // おーろらうお：つきみまんぼうを オーロラの みどりに
  ];
  S.forEach(function (r) {
    var id = r[0], from = r[1], svg = A.fish[from];
    if (!svg || A.fish[id]) return;
    var filter = '<filter id="xf" color-interpolation-filters="sRGB"><feColorMatrix type="hueRotate" values="' + r[2] + '"/><feColorMatrix type="saturate" values="' + r[3] + '"/>' +
      '<feComponentTransfer><feFuncR type="linear" slope="' + r[4] + '"/><feFuncG type="linear" slope="' + r[4] + '"/><feFuncB type="linear" slope="' + r[4] + '"/></feComponentTransfer></filter>';
    var badge = '<text x="196" y="54" font-size="54" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">' + r[5] + '</text>';
    A.fish[id] = svg.replace(/<svg[^>]*>/, function (open) { return open + '<defs>' + filter + '</defs><g filter="url(#xf)">'; }).replace('</svg>', '</g>' + badge + '</svg>');
    A.shadow[id] = A.shadow[from];
    if (A.meta.shadowAspect) A.meta.shadowAspect[id] = A.meta.shadowAspect[from];
    (function (key) { var url; Object.defineProperty(A, String(key), { enumerable: false, configurable: true, get: function () { return url || (url = A.uri(A.fish[key])); } }); })(id);
  });
})();
