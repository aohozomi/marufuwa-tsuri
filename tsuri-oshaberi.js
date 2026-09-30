/* まるふわ つりびより：なかまの おしゃべり（そとづけ）
   ・ほんたいの なかまの ひとこと（#bubble）を、いま の じかん・きせつ・てんき・つりば・きょうの ようす に あわせた ことばに さしかえる
   ・「つれた！」は さしかえない（ほんたいの うごきに つかっている）
   ・なまえは かえない。ほぞんは よむだけ（かかない）。そとへは なにも おくらない
   ・ことばは ぜんぶ ひらがな。せかさない・くらべない・たすけを おしつけない */
(() => {
  'use strict';
  const scene = document.getElementById('scene'), bubble = document.getElementById('bubble');
  if (!scene || !bubble || window.TsuriOshaberi) return;
  const query = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  const probe = key => local ? query.get(key) : null;
  if (probe('oshaberi') === '0') return;

  const pick = list => list[Math.floor(Math.random() * list.length)];
  const month = () => new Date().getMonth() + 1;
  const season = () => { const k = probe('kisetsu'); if (['haru', 'natsu', 'aki', 'fuyu'].includes(k)) return k; const m = month(); return m >= 3 && m <= 5 ? 'haru' : m >= 6 && m <= 8 ? 'natsu' : m >= 9 && m <= 11 ? 'aki' : 'fuyu'; };
  const hour = () => new Date().getHours();
  function record() { try { return JSON.parse(localStorage.getItem('marufuwa-tsuri-v1') || '{}'); } catch (e) { return {}; } }

  const LINES = {
    // じかん
    asa: ['あさの みずは すきとおってるね', 'おはよう。きょうも のんびり いこう', 'あさは とりが よく なくね', 'あさごはん たべた？', 'ひかりが きらきら してる'],
    hiru: ['おひさま あったかいね', 'ひるねしたく なっちゃう', 'みずが きらきら してるね', 'おべんとう もってきた？', 'いい てんきだね'],
    yuu: ['そらが オレンジいろだね', 'ゆうがたの かぜ、きもちいい', 'そろそろ さかなも おなか すくころ', 'きょうも いちにち おつかれさま', 'ゆうやけ、きれいだね'],
    yoru: ['ほし、いっぱい みえるね', 'しずかだね', 'よるの みずは くろくて ふかい', 'ねむく なったら いつでも やすんでね', 'つきが みずに うつってる', 'よるは よるの さかなが いるよ'],
    // きせつ
    haru: ['はなびらが ながれてくる', 'はるだね。あったかい', 'さくらの においが する'],
    natsu: ['せみが ないてるね', 'なつは みずが つめたくて きもちいい', 'あついね。むりしないでね'],
    aki: ['おちばが ながれてくるね', 'あきの かぜだね', 'とんぼが とんでる'],
    fuyu: ['さむいね。てぶくろ した？', 'ふゆの みずは しずかだね', 'いきが しろいね'],
    // てんき
    ame: ['あめの おと、おちつくね', 'ぽつぽつ きこえる', 'あめの ひは さかなが よく うごくよ', 'かさ、いる？'],
    // つりば
    L: ['みずうみ、ひろいね', 'むこうぎしまで みえるね', 'みずうみの そこには なにが いるんだろう'],
    R: ['かわの おとが きこえる', 'ながれが はやい ところ、きを つけてね', 'かわの さかなは すばしっこいよ'],
    H: ['ふねが とおってく', 'うみの においが するね', 'かもめが ないてる'],
    B: ['ゆれてるね', 'ふねの うえは かぜが つよいね', 'ここは おおきいのが いるよ'],
    // いつでも
    itsumo: ['ここに いると おちつくね', 'かぜが きもちいいね', 'さかな、いま どこに いるのかな', 'いそがなくて だいじょうぶ', 'にがしても、また あえるよ', 'つれなくても、たのしいね'],
    // はじめて・ひさしぶり・おそい じかん（かぞえない・せめない）
    hajimete: ['はじめまして。ここ、いい ところだよ', 'となりに いても いい？', 'つりは はじめて？ ゆっくりで いいよ'],
    yonaka: ['ねむれない？ いっしょに ながめよう', 'こんな じかんまで おつかれさま', 'よなかの みずうみは ぼくたちだけだね']
  };

  function line() {
    const time = scene.dataset.time || 'hiru', area = scene.dataset.area || 'L', rain = scene.dataset.rain === 'true', now = season(), save = record();
    const bag = [];
    const add = (list, n) => { for (let i = 0; i < n; i++) bag.push(list); };
    add(LINES[time] || LINES.hiru, 3); add(LINES[now], 1); add(LINES[area] || LINES.L, 2); add(LINES.itsumo, 2);
    if (rain) add(LINES.ame, 3);
    if (!save.total) add(LINES.hajimete, 3);
    if (hour() >= 1 && hour() < 4) add(LINES.yonaka, 3);
    return pick(pick(bag));
  }

  // ほんたいが ことばを おいたら（hidden が とれたら）、すぐに さしかえる。「つれた！」と なかま じしんの ことば（word）は そのまま
  const own = new Set();
  try { (window.Tsuri?.pals?.() || []); } catch (e) {}
  let last = '';
  new MutationObserver(() => {
    if (bubble.hidden) return;
    const text = bubble.textContent;
    if (text === 'つれた！' || text === last) return;
    // なかま じしんの くちぐせ（みじかい・「！」や「〜」つき）は のこす：ほんたいの WORDS だけ さしかえる
    const GENERIC = ['のんびりだね', 'いい かぜ', 'おおきいの きたかも', 'おなか すいたね', 'きょうは いい ひ', 'あめも いいね', 'ぽつぽつ きこえる', 'かさ、いる？', 'あめの ひは よく つれるよ'];
    if (!GENERIC.includes(text)) return;
    if (Math.random() < .1) return;   // ときどき もとの ことばも のこす
    last = line(); bubble.textContent = last;
    // がめんの はしで きれない よう、ほんたいと おなじ おきかた
    const half = bubble.offsetWidth / scene.clientWidth * 50, x = parseFloat(bubble.style.left) || 50;
    bubble.style.left = Math.min(98 - half, Math.max(2 + half, x)) + '%';
  }).observe(bubble, {attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true});

  window.TsuriOshaberi = {line, lines: LINES, season};
})();
