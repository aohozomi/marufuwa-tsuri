// まるふわ つりびより：きせつの さかな 12しゅの え（かり）。ジョブズ1が コードで つくった：ほかの さかなの 色ちがい＋きせつの えもじ。
// ほんものの え（天）が きたら、tsuri-art.js の 34〜45 ばんに さしかえて、この ファイルは はずす（ばんごうは 本体の FISH の 34ばん〜と おなじ）。
// 使い方は tsuri-art.js と おなじ：TsuriArt[番号]＝画像の住所／TsuriArt.fish[番号]＝生のSVG／TsuriArt.shadow[番号]＝影
(function () {
  var A = window.TsuriArt;
  if (!A || !A.fish || !A.shadow || !A.meta) return;
  // [ばんごう, もとに する さかなの ばんごう, hue-rotate（度）, saturate, brightness, きせつの えもじ]
  var S = [
    [34, 2, -10, 1.5, 1.0, '🎍'],     // 1がつ ふくだるまうお：あか＋かどまつ
    [35, 1, -36, 1.3, 1.0, '⛩️'],     // 2がつ まめまきふぐ：だいだい＋じんじゃ
    [36, 8, -24, 0.9, 1.05, '🎎'],    // 3がつ ひなあられうお：もも＋おひなさま
    [37, 16, 38, 1.1, 1.08, '🌸'],    // 4がつ さくらふぶきうお：さくらいろ＋さくら
    [38, 28, 146, 1.0, 1.0, '🎏'],    // 5がつ こいのぼりごい：みずいろ＋こいのぼり
    [39, 3, 62, 2.0, 1.0, '☔'],            // 6がつ あじさいうお：むらさき＋かさ
    [40, 14, -7, 1.6, 1.05, '🎋'],    // 7がつ たなばたほしうお：こん＋ささ
    [41, 10, -159, 0.8, 1.15, '🍧'],  // 8がつ かきごおりだこ：そらいろ＋かきごおり
    [42, 20, -150, 4.5, 1.12, '🎑'],   // 9がつ おつきみうさぎうお：きいろ＋おつきみ
    [43, 17, -24, 1.7, 1.0, '🎃'],    // 10がつ ハロウィンかぼちゃうお：オレンジ＋かぼちゃ
    [44, 4, -21, 1.8, 1.0, '🍁'],     // 11がつ もみじがれい：あかだいだい＋もみじ
    [45, 23, -40, 0.55, 1.1, '⛄']           // 12がつ ゆきだるまうお：しろ＋ゆきだるま
  ];
  S.forEach(function (r) {
    var id = r[0], from = r[1], svg = A.fish[from];
    if (!svg || A.fish[id]) return;
    var filter = '<filter id="sf" color-interpolation-filters="sRGB"><feColorMatrix type="hueRotate" values="' + r[2] + '"/><feColorMatrix type="saturate" values="' + r[3] + '"/>' +
      '<feComponentTransfer><feFuncR type="linear" slope="' + r[4] + '"/><feFuncG type="linear" slope="' + r[4] + '"/><feFuncB type="linear" slope="' + r[4] + '"/></feComponentTransfer></filter>';
    var badge = '<text x="196" y="54" font-size="54" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">' + r[5] + '</text>';
    A.fish[id] = svg.replace(/<svg[^>]*>/, function (open) { return open + '<defs>' + filter + '</defs><g filter="url(#sf)">'; }).replace('</svg>', '</g>' + badge + '</svg>');
    A.shadow[id] = A.shadow[from];
    if (A.meta.shadowAspect) A.meta.shadowAspect[id] = A.meta.shadowAspect[from];
    (function (key) { var url; Object.defineProperty(A, String(key), { enumerable: false, configurable: true, get: function () { return url || (url = A.uri(A.fish[key])); } }); })(id);
  });
})();
