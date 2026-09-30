/* まるふわ つりびより：English mode（外付け・総司令部）
   ・日本語のままでは何も変えない。?lang=en か、ブラウザの言語に日本語が1つも無い時だけ英語にする
   ・画面の日本語（ふりがなの「読み」を正規化した文字）を、訳表・ルール・かけらの置きかえで英語にする（本体には手を入れない）
   ・訳せなかった文は日本語のまま残し、TsuriEn.missing() に出す（未訳の検査）
   ・保存の鍵：marufuwa-lang-v1（'ja'|'en' だけ）。外へ何も送らない。 */
(() => {
  'use strict';
  if (window.TsuriEn) return;
  const KEY = 'marufuwa-lang-v1';
  const query = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  const JP = /[぀-ヿ㐀-鿿]/;

  // ---------- ことばの きめかた ----------
  function pickLang() {
    const asked = query.get('lang');
    if (asked === 'en' || asked === 'ja') { try { localStorage.setItem(KEY, asked); } catch (e) {} return asked; }
    try { const saved = localStorage.getItem(KEY); if (saved === 'en' || saved === 'ja') return saved; } catch (e) {}
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'ja'];
    return langs.some(l => /^ja/i.test(l)) ? 'ja' : 'en';
  }
  const LANG = pickLang();
  // 日本語（ぜんかくの きごうも ふくむ）の となりの すきまだけ 消す。英語の ことばの あいだの すきまは のこす
  const JPX = '\\u3000-\\u30ff\\u3400-\\u9fff\\uff00-\\uffef';
  // うしろ読み（(?<=…)）は iOS 16.3 いかの Safari で 例外に なるので つかわない：「日本語の まえの すきま」→「日本語の うしろの すきま」の 2回で 同じ 結果
  const WS_BEFORE_JP = new RegExp('[\\s\\u3000]+(?=[' + JPX + '])', 'g'), WS_AFTER_JP = new RegExp('([' + JPX + '])[\\s\\u3000]+', 'g');
  const norm = s => String(s).replace(WS_BEFORE_JP, '').replace(WS_AFTER_JP, '$1').trim();
  const missing = new Set();
  window.TsuriEn = { lang: LANG, t: s => s, missing: () => [...missing], toggle: null, add: () => {}, page: () => {} };   // add・page は 英語の ときだけ はたらく（add：ひろば など べつの ページの 訳を たす／page：ページごとの 題と 説明を 直す）

  // ---------- きりかえの ボタン（日本語でも 英語でも 出す）----------
  function addToggle() {
    const main = document.querySelector('main') || document.body;
    const row = document.createElement('div'); row.className = 'lang-row'; row.setAttribute('data-en-skip', '1'); row.style.cssText = 'text-align:center;margin:14px 0 8px';
    const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'lang-toggle';
    btn.textContent = LANG === 'en' ? '日本語（にほんご）' : 'English';
    btn.setAttribute('lang', LANG === 'en' ? 'ja' : 'en');
    btn.style.cssText = 'font-size:.85rem;min-height:44px;padding:8px 18px;border-radius:999px;border:1.5px solid currentColor;background:transparent;color:inherit;opacity:.85;cursor:pointer';
    btn.addEventListener('click', () => {
      try { localStorage.setItem(KEY, LANG === 'en' ? 'ja' : 'en'); } catch (e) {}
      const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.toString());
    });
    row.append(btn); main.append(row);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addToggle); else addToggle();
  if (LANG !== 'en') return;

  // =====================================================================
  //  やくひょう（English）
  // =====================================================================
  const FISH_JA = ['まるあじ', 'ふわふぐ', 'もちだい', 'ころいわし', 'ぽてかれい', 'しらたまえび', 'ぷかくらげ', 'こつぶがに', 'わたあめきんぎょ', 'まんまるいか', 'ふくふくたこ', 'にじいろべら', 'あさやけだい', 'ゆうやけさば', 'ほしぞらあなご', 'おもちひらめ', 'さくらます', 'ぽんぽんはりせんぼん', 'ころころかめ', 'ねむりいるか', 'つきみまんぼう', 'ひだまりえい', 'みかづきたちうお', 'しゃぼんだまうお', 'みずいろのこ', 'みんとのこ', 'あぷりこっとのこ', 'らべんだーのこ', 'きんのまるごい', 'まるくじら', 'つきあかりのきんぎょ', 'ほしくずのこい', 'しんじゅのたい', 'にじいろくじら'];
  const FISH_EN = ['Roundy Mackerel', 'Fluffy Pufferfish', 'Mochi Sea Bream', 'Rolly Sardine', 'Plump Flounder', 'Dumpling Shrimp', 'Bobbing Jellyfish', 'Tiny Crab', 'Cotton Candy Goldfish', 'Round Squid', 'Chubby Octopus', 'Rainbow Wrasse', 'Sunrise Sea Bream', 'Sunset Mackerel', 'Starry Sky Eel', 'Mochi Flounder', 'Sakura Trout', 'Puffy Porcupinefish', 'Rolling Turtle', 'Sleepy Dolphin', 'Moon-Gazing Sunfish', 'Sunny Spot Ray', 'Crescent Cutlassfish', 'Bubble Fish', 'Little Sky-Blue Fish', 'Little Mint Fish', 'Little Apricot Fish', 'Little Lavender Fish', 'Golden Round Carp', 'Round Whale', 'Moonlight Goldfish', 'Stardust Carp', 'Pearl Sea Bream', 'Rainbow Whale'];
  const PAL_JA = ['ミントの うさぎ', 'ラテの かわうそ', 'レモンの ひよこ', 'リボンの うさぎ', 'おひるね パンダ', 'おほしさまの こじか', 'クローバーの たぬき', 'チョコの りす', 'ももの ねこ', 'はちみつの こいぬ', 'いちごの ハムスター', 'ほほきずの ねこ', 'さくらの あざらし', 'わたあめの アルパカ', 'がんたいの くま'];
  const PAL_EN = ['Mint Bunny', 'Latte Otter', 'Lemon Chick', 'Ribbon Bunny', 'Nap Panda', 'Little Star Fawn', 'Clover Tanuki', 'Chocolate Squirrel', 'Peach Cat', 'Honey Puppy', 'Strawberry Hamster', 'Scrappy Cat', 'Sakura Seal', 'Cotton Candy Alpaca', 'Eyepatch Bear'];
  const PAL_WORD = [
    ['ぴょん と つれた', 'Boing! Got one.'], ['いい いし、みつけた', 'Found a nice stone.'], ['ぴよ。きょうも はれ', 'Peep. Sunny again today.'], ['リボン、にあう？', 'Does my ribbon look nice?'],
    ['ふわぁ、ねむい', 'Yaaawn, sleepy.'], ['もりの においが する', 'It smells like the forest.'], ['よつば、さがそ', "Let's look for a four-leaf clover."], ['どんぐり、たべる？', 'Want an acorn?'],
    ['にゃ、つれた', 'Meow. Caught one.'], ['わん！ たのしい', 'Woof! This is fun.'], ['ほっぺに いれとこ', "I'll stash it in my cheeks."], ['へっちゃら だよ', "I'm doing okay."],
    ['うみ、きもちいい', 'The sea feels nice.'], ['かぜが ふわふわ', 'The breeze is so fluffy.'], ['ほしが みえるよ', 'I can see the stars.']];
  const AREA = { 'みずうみ': ['Lake', 'the Lake'], 'かわ': ['River', 'the River'], 'みなとまち': ['Harbor Town', 'Harbor Town'], 'ふねのうえ': ['On the Boat', 'the Boat'] };
  const TIME = { 'あさ': ['Morning', 'morning'], 'ひる': ['Day', 'daytime'], 'ゆうがた': ['Evening', 'evening'], 'よる': ['Night', 'night'] };
  const FISH_MAP = new Map(FISH_JA.map((j, i) => [j, FISH_EN[i]]));
  const PAL_MAP = new Map(PAL_JA.map((j, i) => [norm(j), PAL_EN[i]]));
  const nmFish = s => FISH_MAP.get(s) || s;
  const nmPal = s => PAL_MAP.get(norm(s)) || s;
  const nmArea = (s, at) => (AREA[s] ? AREA[s][at ? 1 : 0] : s);
  const nmTime = (s, low) => (TIME[s] ? TIME[s][low ? 1 : 0] : s);
  const num = s => String(s);

  // ---- 1) まるごと おなじ 文（ふりがなの「よみ」で そろえた もじ・すきまなし）----
  const EX = new Map(Object.entries({
    // あたまの ぶぶん
    'いそがなくて、だいじょうぶ。にがしても、へらないよ。1ぴき30びょうくらい。むりょうであそべます。': "No rush, it's okay. Let one go, and nothing is lost. About 30 seconds a fish. Free to play.",
    '1ぴき30びょうくらい。むりょうであそべます。': 'About 30 seconds a fish. Free to play.',
    'おみせ': 'Shop', 'なげる': 'Cast', 'もういちどなげる': 'Cast again', 'まってる…': 'Waiting…', 'ひく！': 'Reel in!', 'いまだ！': 'Now!',
    'おと：OFF（つけるのがおすすめ）': 'Sound: OFF (better with sound)', 'おと：ON': 'Sound: ON', 'おと：OFF': 'Sound: OFF', 'おと': 'Sound',
    'しゃしんをとる': 'Take a photo', 'そっとにがす': 'Release gently', 'とおく：ON': 'Far view: ON', 'とおく：OFF': 'Far view: OFF', 'ながめる': 'Just watch', 'もどる': 'Back',
    'ふつう': 'Normal', 'らくちん': 'Easy mode', 'らくちん：ON': 'Easy mode: ON', 'らくちん：OFF': 'Easy mode: OFF', 'ふるえ：ON': 'Vibration: ON', 'ふるえ：OFF': 'Vibration: OFF',
    'けしきのいきもの：ON': 'Wildlife: ON', 'けしきのいきもの：OFF': 'Wildlife: OFF',
    'みる・いく': 'Look & Visit', 'バケツ': 'Bucket', 'ずかん': 'Fish Book', 'どうぐ': 'Gear', 'ひろば': 'Plaza', 'きろく': 'Records',
    'いまのじかん': 'Current time', 'あさ': 'Morning', 'ひる': 'Day', 'ゆうがた': 'Evening', 'よる': 'Night',
    'みずうみ': 'Lake', 'かわ': 'River', 'みなとまち': 'Harbor Town', 'ふねのうえ': 'On the Boat',
    'じかんででやすいさかながかわるよ（あさ・ひる・ゆうがた・よる）。きろくはこのたんまつのなかだけにのこります。ログインもインストールもいりません。はいけいとさかなのえは、いまはかりのものです。':
      'Which fish appear changes with the time (morning, day, evening, night). Your records stay only on this device. No login or install needed. The backgrounds and fish art are placeholders for now.',
    'きろくをのこす・もどす': 'Save / Restore records', 'おうちのかたへ': 'For grown-ups',
    'きろくはこのたんまつのなかだけにあります。したのもじをどこかにほぞんしておくと、きえてももどせます。': 'Your records live only on this device. Save the code below somewhere, and you can restore them even if they disappear.',
    'きろくのもじ': 'Record code', 'コピーする': 'Copy', 'このもじでもどす': 'Restore from this code', 'とじる': 'Close',
    'おさかなシールちょう': 'Fish Sticker Album', 'シールちょうをしゃしんに': 'Turn the album into a photo', 'さいきんつった10ぴき。つりばをかえても、きえないよ。': 'Your last 10 catches. They stay even if you change spots.',
    'ひろったかざり': 'Decorations you found', 'あったなかま': 'Friends you met', 'ひみつノート': 'Secret Notebook', 'しゃしん': 'Photo', 'ほぞんする': 'Save', 'ほぞん': 'Save', 'みせる（きょうゆう）': 'Share', 'Xにかく': 'Post to X',
    'かってにとうこうはしません。': 'Nothing is posted without you.',
    'じぶんのどうぐ': 'My Gear', 'すきないろにして、じぶんだけのどうぐにしよう。レベルがあがると、いろがふえるよ。': 'Pick your favorite colors and make your gear your own. More colors unlock as your level goes up.',
    'バケツのなまえ（ひらがな・カタカナで8もじまで）': 'Bucket name (up to 8 characters)',
    'きつねのおみせ': "Fox's Shop", 'おかねはいらないよ。あそぶと、どうぐがふえるよ。': 'No money needed. Play, and your gear grows.',
    'まるふわのおへや': "Marufuwa's Room", 'つりにいく': 'Go fishing', 'ぜんぶもどす': 'Put everything back', 'おわる': 'Done', 'ごはんをあげる': 'Feed', 'かざる': 'Decorate', 'みみでながめる': 'Listen', 'ひとにみせる': 'Show someone',
    // ふりがな・ラベル
    'ウキのいろ': 'Float color', 'ルアーのいろ（きらきらえさ）': 'Lure color (sparkle bait)', 'さおのいろ': 'Rod color', 'まるふわのふくのいろ': "Marufuwa's outfit color", 'そのまま': 'As is',
    'あか': 'Red', 'あお': 'Blue', 'きいろ': 'Yellow', 'もも': 'Pink', 'みどり': 'Green', 'むらさき': 'Purple', 'きん': 'Gold', 'にじ': 'Rainbow', 'ぎん': 'Silver', 'よぞら': 'Night sky', 'しろ': 'White', 'くろ': 'Black', 'オレンジ': 'Orange',
    // さお・えさ
    'きのえだのさお': 'Twig Rod', 'さいしょのさお': 'Your first rod', 'たけのさお': 'Bamboo Rod', 'すこしあわせやすい': 'A little easier to time', '10ぴきつるともらえる': 'Unlocks at 10 catches',
    'ほしのさお': 'Star Rod', 'とてもあわせやすい': 'Much easier to time', 'ずかんが15しゅるいでもらえる': 'Unlocks with 15 kinds in the Fish Book',
    'ふつうのえさ': 'Regular Bait', 'いつものえさ': 'The usual bait', 'きらきらえさ': 'Sparkle Bait', 'めずらしいこがきやすい': 'Rare fish come more often', 'ずかんが5しゅるいでもらえる': 'Unlocks with 5 kinds in the Fish Book',
    'おおきいえさ': 'Big Bait', 'おおきいこがきやすい': 'Bigger fish come more often', '20ぴきつるともらえる': 'Unlocks at 20 catches',
    'さお': 'Rod', 'えさ': 'Bait', '（つかっている）': '(in use)',
    'ちょっとめずらしい': 'A bit rare', 'めずらしい': 'Rare', 'スペシャル': 'Special', 'まぼろし': 'Mythical',
    'かいがら': 'Seashell', 'きれいないし': 'Pretty stone', 'ながれぎ': 'Driftwood', 'みずくさ': 'Water plant', 'ちいさなびん': 'Little bottle', 'ほしのかけら': 'Star fragment',
    // ヒントと つりの ことば
    'ここにしよう。「なげる」をおしてね。': 'Here we go. Press “Cast”.', '「なげる」をおしてね。': 'Press “Cast”.',
    'ぽちゃん。のんびりまとう。': "Plop. Let's wait, nice and easy.", 'ちょん、ちょん…。なにかきたかも。': 'Nibble, nibble… Something might be coming.',
    'おすだけで、つれるよ。': "Just press, and you'll catch it.", '「ピコン」で、おしてね。': 'Press at the “ping”.', 'ひかったら、おしてね。': 'Press when it glows.',
    'ぴったり！！': 'Perfect!!', 'いいね！': 'Nice!', 'おしい！': 'So close!',
    'つれた！': 'Got one!', 'のんびりだね': 'Nice and slow.', 'いいかぜ': 'Nice breeze.', 'おおきいのきたかも': 'Maybe a big one is coming.', 'おなかすいたね': "I'm getting hungry.", 'きょうはいいひ': 'Such a nice day.',
    'あめもいいね': 'Rain is nice, too.', 'ぽつぽつきこえる': 'Pitter-patter…', 'かさ、いる？': 'Need an umbrella?', 'あめのひはよくつれるよ': 'You catch more on rainy days.',
    'またね': 'See you!', 'こんにちは': 'Hello!', 'あそびにきたよ': 'Came to visit!',
    'ばいばい。またあおうね。': 'Bye-bye. See you again.', 'しゃしんをつくれなかったよ。もういちどためしてね。': "Couldn't make the photo. Please try again.",
    'おとをけしたよ。': 'Sound is off.', 'つりがおわってから、ながめよう。': "Let's watch after fishing is done.",
    'おとをつけると、なみのおとがきこえるよ。': 'Turn the sound on to hear the waves.', 'おかえり。「なげる」で、また つりができるよ。': 'Welcome back. Press “Cast” to fish again.',
    'あ、ながれぼし！おすと、ねがいごとができるよ。': 'Oh, a shooting star! Tap it to make a wish.', 'ねがいごとをしたよ。つぎは、めずらしいこがくるかも。': 'You made a wish. Maybe a rare one will come next.',
    'らくちんにしたよ。おすだけでつれるよ。': "Easy mode is on. Just press, and you'll catch it.", 'らくちんをやめたよ。わがひかったらおしてね。': 'Easy mode is off. Press when the ring glows.',
    'ふるえをつけたよ。': 'Vibration is on.', 'ふるえをけしたよ。': 'Vibration is off.', 'けしきのいきものをだしたよ。': 'Wildlife is back.', 'けしきのいきものをしまったよ。': 'Wildlife is put away.',
    'おかえり。ずかんもきろくも、そのままだよ。': 'Welcome back. Your Fish Book and records are just as you left them.', 'ねむれない？ゆっくりながめよう。': "Can't sleep? Let's watch quietly.",
    'きょうは、なにかがいるきがする…。': 'Somehow, it feels like something is out there today…',
    'はじめてだね。ゆっくりどうぞ。': "It's your first time. Take it slow.", 'なれてきたね。': "You're getting used to it.", 'じょうずになったね。': "You're getting good at this.", 'もうめいじんだね。': "You're a master now.",
    'まだからっぽ。のんびりいこう。': "Still empty. Let's take it easy.", 'まだないよ。さかながときどきもってくるよ。': 'None yet. Fish sometimes bring them.', 'まだあってない': 'Not met yet', 'いつでも': 'Any time',
    'ぜんがめんであそぶには、うえの⋮からブラウザ（Safariなど）でひらいてね。': 'For full screen, open this in your browser (Safari, etc.) from the ⋮ menu.',
    'ぜんがめんであそぶには、⋮からブラウザ（Safariなど）でひらいてね。': 'For full screen, open this in your browser (Safari, etc.) from the ⋮ menu.',
    'とじる（もうだしません）': 'Close (won’t show again)',
    // レベル・タグ
    'レベルアップ！': 'Level up!', 'きょうのラッキー': "Today's Lucky", '10ぴきめ！なかよし': '10th catch! Best friends', 'ぬし': 'Giant', 'はじめて！': 'First time!', 'じぶんのきろく！': 'Personal best!', 'おおもの': 'Big one',
    'いいこがつれたね。': 'Nice catch!', 'ぬしだよ！すごい、すごい。': "It's a Giant! Amazing, amazing.", 'またぬしだ！': 'Another Giant!', 'スペシャルなこだよ！': "It's a special one!",
    'ずかんがぜんぶうまったよ！': 'Your Fish Book is complete!', 'なにかもっていたみたい！': 'It seems to be carrying something!', 'はじめまして、だね。': 'Nice to meet you.', 'きろくがのびたね！': 'A new personal best!',
    'まぼろしのこだ…！ほんとうにいたんだ。': 'A mythical one…! They really exist.', 'まぼろしにあえました': 'Met a mythical fish', 'ぬしをつりました': 'Caught a Giant',
    // まるふわ・ペンギン・ようす
    'なみのおとを、きいていよう。': "Let's listen to the waves.", 'きょうも、おつかれさま。': 'Good work today.', 'なにもしなくて、いいよ。': "You don't have to do anything.", 'ゆっくり、いきをしよう。': "Let's breathe slowly.",
    'ここにいて、いいよ。': 'You can stay right here.', 'ぼんやりするのも、だいじなじかん。': 'Spacing out is important time, too.', 'いまできることだけで、じゅうぶん。': 'What you can do right now is enough.',
    'みずがきらきらしているね。': 'The water is sparkling.', 'くもがゆっくりながれていくね。': 'The clouds drift by slowly.', 'しんこきゅう、ひとつ。': 'One deep breath.', 'いそがなくて、だいじょうぶ。': "No rush. It's okay.",
    'ここは、ゆっくりしていいばしょ。': 'This is a place to take it slow.', 'よるのみずは、しずかだね。': 'The water is quiet at night.', 'ほしがひとつ、みえるかな。': 'Can you see a star?',
    'ねむれないよるも、ここにいていいよ。': 'On sleepless nights, you can stay here, too.', 'もうおそいね。むりしないでね。': "It's getting late. Don't push yourself.", 'あめのおとって、おちつくね。': 'The sound of rain is calming.',
    'ここはぬれないよ。ゆっくりしよう。': "You won't get wet here. Let's relax.", 'あさのひかりだね。': 'Morning light.', 'きょうは、きょうのペースでいいよ。': "Go at today's pace.",
    '10ぴきめ！なかまがはくしゅしているよ。': 'Your 10th catch! Your friends are clapping.', '30ぴきめ！はなびらがまってきたよ。': 'Your 30th catch! Petals are drifting in.', '50ぴきめ！ふうせんがあがったよ。': 'Your 50th catch! Balloons are rising.',
    '100ぴきめ！はなびがあがったよ。': 'Your 100th catch! Fireworks are going up.', '300ぴきめ！にじいろのかみふぶきだよ。': 'Your 300th catch! Rainbow confetti!', '500ぴきめ！ほしがふってきたよ。': 'Your 500th catch! Stars are falling.',
    '1000びきめ！もう、つりのめいじんだね。': "Your 1000th catch! You're a fishing master now.",
  }));

  // ---- 1b) ふきん・ラベル・おくりもの（本体の あたらしい ぶぶん）----
  Object.entries({
    'つかいやすくする（いま：': 'Comfort options (now: ', 'ばしょをかえる（いま：': 'Change spot (now: ', 'じかんをかえる（いま：': 'Change time (now: ',
    'つれたかず': 'Caught', 'つりびとレベル': 'Angler Lv.', '/30しゅるい': '/30 kinds', 'つりばをえらぶ': 'Choose a spot', 'じかんをえらぶ': 'Choose the time',
    'ながれぼしにねがいごとをする': 'Make a wish on the shooting star', 'ひだりのばしょでつる': 'Fish at the left spot', 'まんなかのばしょでつる': 'Fish at the middle spot', 'みぎのばしょでつる': 'Fish at the right spot',
    'おみせのきつねにはなしかける': 'Talk to the shop fox', 'あんないのペンギン': 'Guide penguin', 'とうだい': 'Lighthouse', 'まるまど': 'Round window', 'つき': 'Moon', 'ランプ': 'Lamp', 'おにぎり': 'Rice ball',
    'さかなのデータ': 'Fish data', 'つりをするまるふわ': 'Marufuwa fishing', 'とったしゃしん': 'Photo you took', 'すいそうをながめるまるふわ': 'Marufuwa watching the aquarium',
    'さかなをおくる': 'Send this fish', 'もらったさかな': 'Fish you received', 'ぬしとまぼろしのこは、じぶんでつったひとだけのたからもの。おくれないよ。': 'Giants and mythical fish are treasures only for the one who caught them. They can’t be sent.',
    'おくっても、じぶんのさかなはへらないよ。もらったひとのバケツにはいるよ。': "Sending a fish doesn't reduce your own. It goes into the other person's bucket.",
    'ひとこと（えらんでね）': 'Add a message (choose one)', 'ひとことなし': 'No message', 'これ、あげる！': 'This is for you!', 'いっしょにつろうね': "Let's fish together.", 'おおきいのつれたよ': 'I caught a big one!',
    'きょうもおつかれさま': 'Good work today.', 'ゆっくりしようね': "Let's take it easy.", 'またあそぼうね': "Let's play again.", 'みてみて！': 'Look, look!', 'いいことがありますように': 'May good things come your way.', 'ありがとう。': 'Thank you.',
    'リンクをおくる': 'Send link', 'リンクをおくるときは、おうちのひとといっしょにつかってね。': 'When sending a link, please use it together with a grown-up.', 'おくりものがとどいたよ': 'A gift has arrived!',
    'おくる': 'Send', 'えいっ': 'Hup!', 'ぽちゃん': 'Plop', 'このもじを、メモなどにはってのこしてね。': 'Paste this code into a note to keep it.', 'コピーしたよ。メモなどにはってのこしてね。': 'Copied. Paste it into a note to keep it.',
    'もじをえらんだよ。ながおしして、コピーしてね。': 'Code selected. Long-press to copy.',
    'ゆったり': 'Easygoing', 'まんなかで、ゆっくりになるよ': 'Slows down in the middle', 'ゆらり': 'Swaying', 'おなじはやさで、ちぢむよ': 'Shrinks at a steady pace',
    'ぐいぐい': 'Tugging', 'だんだん、はやくなるよ': 'Gets faster and faster', 'ふらふら': 'Wobbly', 'いったりきたりするよ': 'Goes back and forth', 'ぴたっと': 'Pausing', 'とちゅうで、いちどとまるよ': 'Stops once along the way',
  }).forEach(([k, v]) => EX.set(k, v));
  // ---- 1c) なかまの ひとこと・ぬしの おどろき・とおく・すいそう・ひみつ ----
  Object.entries({
    'すいそうをみる': 'View the aquarium', 'あたらしいなかまが': 'New friends: ',
    'べつのブラウザ（Safariなど）であそびたいときは、「リンクをコピー」して、そのブラウザのアドレスらんにはってひらいてね。リンクにはきろくがぜんぶはいっているので、ほかのひとにはおくらないでね。':
      'To play in a different browser (Safari, etc.), tap “Copy link” and paste it into that browser’s address bar. The link contains all of your records, so please don’t send it to anyone else.',
    'リンクをコピー（べつのブラウザへ）': 'Copy link (to another browser)', 'きろくをもどす？': 'Restore your records?',
    'きろくをもどしたよ。つづきからあそべるよ。': 'Records restored. You can pick up where you left off.',
    'リンクをコピーしたよ。べつのブラウザのアドレスらんにはってひらいてね。ほかのひとにはおくらないでね。': "Link copied. Paste it into another browser's address bar. Please don't send it to anyone else.",
    'このもじは、よめなかったよ。「MF1.」からはじまるもじ（か、きろくのリンク）を、ぜんぶはってね。': "Couldn't read that code. Please paste the whole code that starts with “MF1.” (or the records link).",
    'ひらがな・カタカナ・アルファベット・すうじでかいてね。': 'Please use letters and numbers.', 'ひらがな・カタカナでかいてね。': 'Please use letters and numbers.',
    'そのなまえはつかえないよ。べつのなまえをえらんでね。': "That name can't be used. Please choose another one.",
    'もらったよ': 'Received', 'だれか': 'Someone', 'あと': 'Only ', 'ひき': ' left',
    'てがみがとどいたよ': 'A letter has arrived', 'てがみがとどいているよ': 'A letter is waiting for you',
    // おくりものを うけとる 画面（index.html giftOpen／giftTake）
    'うけとる': 'Accept', 'あとで': 'Later', 'うけとったよ！ありがとう': 'Received! Thank you.', 'もううけとったよ': 'Already received',
    'うけとると、バケツの「もらったさかな」にはいるよ。': 'Once you accept, it goes into “Fish you received” in your bucket.',
    'バケツの「もらったさかな」にいれたよ。': 'Put into “Fish you received” in your bucket.', 'バケツの「もらったさかな」にいるよ。': 'It’s in “Fish you received” in your bucket.',
    'このブラウザのなかにほぞんされるよ。': 'It’s saved inside this browser.',
    'Xのなかでひらいたときは、Safariなどのブラウザとはべつにほぞんされるよ。': 'If you opened this inside X, it’s saved separately from browsers like Safari.',
    'この ブラウザの なかに ほぞんされるよ。Xの なかで ひらいた ときは、Safariなどの ブラウザとは べつに ほぞんされるよ。': 'It’s saved inside this browser. If you opened this inside X, it’s saved separately from browsers like Safari.',
    'おかえしにひとつおくる？あとででもいいよ。': 'Send one back? Later is fine, too.', 'おかえしをえらぶ': 'Choose one to send back', 'バケツをみる': 'Open bucket',
    'よくわからないさかながきたよ。': 'A fish we don’t recognize came along.', 'きろくをのこす': 'Save your records',
    // ひみつの ことば（tsuri-himitsu.js の T）
    'ひみつのことば': 'Secret Word', 'ためす': 'Try it', 'ひみつノートをひらく': 'Open the Secret Notebook',
    'ことばをしっていたら、ここにいれてね。まちがえても、なにもおこらないよ。': 'If you know a word, type it here. If you get it wrong, nothing happens.',
    'ひみつのことばがみつかったよ！': 'You found a secret word!', 'このことばはもうみつけているよ。いつでもどうぞ。': 'You’ve already found this word. Feel free to enter it anytime.',
    'みつからなかったよ。ことばがちがうのかも。もういちどためしてね。': 'Nothing found. Maybe the word is different. Try again.', 'ことばをいれてね。': 'Please type a word.',
    'はじめのことば': 'First Words', 'ひみつのことばをみつけたよ。ことばは、これからふえるかもしれないよ。': 'You found a secret word. More words may appear in the future.',
    'おくりものだな': 'Gift Shelf', 'もらったさかながならんでいるよ。つれたかずには、はいらないよ。': "Fish you received are lined up here. They don't count toward your catches.",
    // なかまの おしゃべり（tsuri-oshaberi.js）
    'あさのみずはすきとおってるね': 'The morning water is so clear.', 'おはよう。きょうものんびりいこう': "Good morning. Let's take it easy today, too.", 'あさはとりがよくなくね': 'Birds sing a lot in the morning.',
    'あさごはんたべた？': 'Did you have breakfast?', 'ひかりがきらきらしてる': 'The light is sparkling.', 'おひさまあったかいね': 'The sun feels warm.', 'ひるねしたくなっちゃう': 'Makes me want a nap.',
    'みずがきらきらしてるね': 'The water is sparkling.', 'おべんとうもってきた？': 'Did you bring a lunch box?', 'いいてんきだね': 'Nice weather.', 'そらがオレンジいろだね': 'The sky is orange.',
    'ゆうがたのかぜ、きもちいい': 'The evening breeze feels good.', 'そろそろさかなもおなかすくころ': 'About time the fish get hungry.', 'きょうもいちにちおつかれさま': 'Good work today.',
    'ゆうやけ、きれいだね': 'The sunset is beautiful.', 'ほし、いっぱいみえるね': 'So many stars.', 'しずかだね': 'So quiet.', 'よるのみずはくろくてふかい': 'The night water is dark and deep.',
    'ねむくなったらいつでもやすんでね': 'If you get sleepy, feel free to rest anytime.', 'つきがみずにうつってる': 'The moon is reflected in the water.', 'よるはよるのさかながいるよ': 'There are night fish at night.',
    'はなびらがながれてくる': 'Petals are drifting by.', 'はるだね。あったかい': "It's spring. So warm.", 'さくらのにおいがする': 'It smells like cherry blossoms.', 'せみがないてるね': 'The cicadas are singing.',
    'なつはみずがつめたくてきもちいい': 'The water is cool and nice in summer.', 'あついね。むりしないでね': "It's hot. Don't push yourself.", 'おちばがながれてくるね': 'Fallen leaves are drifting by.',
    'あきのかぜだね': "It's an autumn breeze.", 'とんぼがとんでる': 'Dragonflies are flying.', 'さむいね。てぶくろした？': "It's cold. Are you wearing gloves?", 'ふゆのみずはしずかだね': 'The winter water is quiet.',
    'いきがしろいね': 'Our breath is white.', 'あめのおと、おちつくね': 'The sound of rain is calming.', 'あめのひはさかながよくうごくよ': 'Fish move a lot on rainy days.',
    'みずうみ、ひろいね': 'The lake is so wide.', 'むこうぎしまでみえるね': 'You can see all the way to the far shore.', 'みずうみのそこにはなにがいるんだろう': "I wonder what's at the bottom of the lake.",
    'かわのおとがきこえる': 'I can hear the river.', 'ながれがはやいところ、きをつけてね': 'Careful where the current is fast.', 'かわのさかなはすばしっこいよ': 'River fish are quick.',
    'ふねがとおってく': 'A boat is passing by.', 'うみのにおいがするね': 'It smells like the sea.', 'かもめがないてる': 'The seagulls are calling.', 'ゆれてるね': "We're rocking.",
    'ふねのうえはかぜがつよいね': 'The wind is strong on the boat.', 'ここはおおきいのがいるよ': 'There are big ones here.', 'ここにいるとおちつくね': "It's calming to be here.", 'かぜがきもちいいね': 'The breeze feels nice.',
    'さかな、いまどこにいるのかな': "I wonder where the fish are now.", 'いそがなくてだいじょうぶ': "No rush. It's okay.", 'にがしても、またあえるよ': "Even if you let one go, you'll meet again.",
    'つれなくても、たのしいね': "Even if we don't catch anything, it's fun.", 'はじめまして。ここ、いいところだよ': 'Nice to meet you. This is a good place.', 'となりにいてもいい？': 'Mind if I sit next to you?',
    'つりははじめて？ゆっくりでいいよ': 'First time fishing? Take it slow.', 'ねむれない？いっしょにながめよう': "Can't sleep? Let's watch together.", 'こんなじかんまでおつかれさま': 'Good work, up this late.',
    'よなかのみずうみはぼくたちだけだね': "It's just us at the lake in the middle of the night.",
    // ぬしを つった とき・とおく
    'わあ！': 'Wow!', 'すごい！': 'Amazing!', 'ぬしだ！': "It's a Giant!", 'おおきい…！': 'So big…!', 'みてみて！': 'Look, look!', 'やったね！': 'You did it!',
    'とおくからみているよ。ひろいみずうみで、のんびり。': 'Watching from far away. On the wide lake, nice and slow.', 'ちかくにもどったよ。': 'Back to the close view.',
    'ひろば・おへや・ながめるでながれる、しずかなBGM': 'Quiet BGM that plays in the Plaza, the Room, and Just watch',
    // すいそう（おへや）
    'ゆっくりしていってね。': 'Take your time.', 'なにもしなくてだいじょうぶ。': "You don't have to do anything.", 'ぷかぷか、いいきもち。': 'Bobbing along… feels nice.', 'みずのおと、きこえる？': 'Can you hear the water?',
    'ぼーっとしていいんだよ。': "It's okay to zone out.", 'ここはずっと、おだやかだよ。': "It's always calm here.", 'いっしょにながめよう。': "Let's watch together.", 'すいそうのひかり、やさしいね。': 'The aquarium light is so gentle.',
    'おはよう。きょうもゆっくりいこうね。': "Good morning. Let's take it slow today, too.", 'あさのひかりがきれい。': 'The morning light is beautiful.', 'ひなたぼっこみたい。': 'Like basking in the sun.',
    'ぽかぽかしてきたね。': "It's getting warm and cozy.", 'ゆうやけのいろがうつってる。': 'The sunset colors are reflected.', 'しずかなよるだね。': 'A quiet night.', 'おやすみまえのおへや。': 'The room before bedtime.',
    'まだだれもいないよ。つりをするとここでおよぐよ。': "No one's here yet. Fish you catch will swim here.", 'ぱくぱく。おいしいって。': 'Munch munch. They say it’s tasty.', 'みんなうれしそう。': 'Everyone looks happy.',
    'ごはんのじかん、たのしいね。': 'Mealtime is fun.', 'すてきなかざり。': 'Lovely decoration.', 'ここ、いいばしょだね。': 'This is a nice spot.', 'ちょっとにぎやかになったね。': 'It got a little livelier.',
    // ひみつノート
    'ひみつノート': 'Secret Notebook', 'みつけたものが、ここにのこるよ。また なにかみつけたら、ここにのこるよ。': 'What you find stays here. Whenever you find something new, it will be saved here.',
    'みつけたものが、ここにのこるよ。またなにかみつけたら、ここにのこるよ。': 'What you find stays here. Whenever you find something new, it will be saved here.',
    'とうだいの あかりはついているよ。': 'The lighthouse light is on.', 'とうだいのあかりはついているよ。': 'The lighthouse light is on.',
    'とうだいにあかりがついたよ。ひかりのおびが、ゆっくりうみをなでているよ。': 'The lighthouse light came on. A band of light slowly sweeps over the sea.',
    'まどのむこうを、なにかおおきなかげがとおったよ。': 'Something big passed by beyond the window.', 'つきに、もちをつくうさぎのかげがみえたよ。': 'You saw the shadow of a rabbit pounding mochi on the moon.',
    'あ、おつきさまにうさぎ！': 'Oh, a rabbit on the moon!', 'きりがかかってきたよ。きりのむこうから、こじかがきたよ。': 'Mist rolled in. A fawn appeared from beyond the mist.',
    '…おはよう。ここのみず、おいしいね': '…Good morning. The water here is delicious.', 'こじかが「…おはよう。ここのみず、おいしいね」っていったよ。': 'The fawn said, “…Good morning. The water here is delicious.”',
    'すやすや…': 'Zzz…', 'ねこがひるねをはじめたよ。すやすや…': 'The cat started a nap. Zzz…', 'にゃっ！…ねてないよ': "Meow! …I wasn't sleeping.", 'ねこが「にゃっ！…ねてないよ」っていったよ。': 'The cat said, “Meow! …I wasn’t sleeping.”',
    'あさぎりのこじか': 'Fawn in the Morning Mist', 'きりのむこうから、こじかがみずをのみにきたよ。': 'A fawn came out of the mist to drink.', 'とうだいのあかり': 'Lighthouse Light',
    'とうだいにあかりがついて、ひかりのおびがうみをなでたよ。': 'The lighthouse light came on, and a band of light swept over the sea.', 'まるまどのかげ': 'Shadow in the Round Window',
    'まるまどのむこうを、おおきなかげがゆっくりとおったよ。': 'A big shadow slowly passed by the round window.', 'ねこのひるね': "Cat's Nap", 'ねこがすやすやひるねをはじめたよ。': 'The cat started napping peacefully.',
    'つきのうさぎ': 'Rabbit on the Moon', 'ほしぞらのへや': 'Starry Room', 'ランプをけしたら、かべがほしぞらになったよ。': 'When you turned off the lamp, the wall became a starry sky.',
    'おにぎりはんぶんこ': 'Sharing a Rice Ball', 'ラグのおにぎりを、なかまとはんぶんこしたよ。': 'You shared the rice ball on the rug with a friend.', 'まるふわのうとうと': 'Marufuwa Dozing',
    'まるふわがおへやでうとうとねむったよ。': 'Marufuwa dozed off in the room.', 'ほしのびん': 'Star Bottle', 'びんのなかで、ほしがひかったよ。': 'A star glowed inside the bottle.', 'ちいさなもり': 'Tiny Forest',
    'ちいさなもりで、さかながやすんでいたよ。': 'Fish were resting in the tiny forest.', 'ごはんのおれい': 'Thanks for the Meal', 'さかなたちが、ありがとうっていってるみたいだったよ。': 'The fish seemed to be saying thank you.',
    'すいそうのうた': 'Aquarium Song', 'まるふわが、すいそうのうたをうたったよ。': 'Marufuwa sang the aquarium song.', 'ふんすいのねがいぼし': 'Fountain Wishing Star', 'ふんすいを3かいさわって、ねがいごとをしたよ。': 'You touched the fountain three times and made a wish.',
    'おひさまのぽかぽか': 'Sunny Warmth', 'おひさまをさわったら、ぽかぽかしたよ。': 'You touched the sun and felt warm.', 'くものぽよん': 'Boing Cloud', 'くもがぽよんとはねたよ。': 'The cloud bounced with a boing.',
    'きのはっぱ': 'Leaves from the Tree', 'きをさわったら、はっぱがひらひらおちてきたよ。': 'You touched the tree, and leaves fluttered down.', 'まるふわのくるくる': 'Marufuwa Twirl', 'まるふわがくるくるとまわったよ。': 'Marufuwa twirled around.',
    'ひろばのながれぼし': 'Plaza Shooting Star', 'ひろばのよぞらに、ながれぼしがとんだよ。': "A shooting star flew across the plaza's night sky.", 'いけのさかな': 'Pond Fish', 'いけでさかながぴょんとはねたよ。': 'A fish leaped out of the pond.',
    'ありがとうのほしぞら': 'Thank-You Starry Sky', 'ありがとうのいしをひらいて、あそんでくれたひとのほしをみたよ。': 'You opened the thank-you stone and saw the stars of people who played.', 'もういちどきく': 'Listen again',
  }).forEach(([k, v]) => EX.set(k, v));
  // ---- 1d) まるふわの おへや（すいそう・tsuri-tank.js）の ことば：ひとこと・よみあげ・かざり・しゃしん ----
  Object.entries({
    'きょうも おつかれさま。': 'Good work today.', 'まだ だれも いないよ。': 'No one is here yet.', 'まだ だれも いないよ。つりを すると、ここで およぐよ。': "No one's here yet. Fish you catch will swim here.",
    'すいそうは まだ からっぽです。': 'The aquarium is still empty.', 'ずかん、ぜんぶ そろったね。ありがとう。': 'Your Fish Book is complete. Thank you.',
    'だなに、もらった さかなが いるよ。': 'The fish you received are on the shelf.', 'おくりもの、うれしかったね。': 'Gifts are so nice to get.', 'もらった さかな、ならんで いるね。': 'The fish you received are lined up.',
    'ゆっくり あいにいこうね。': "Let's go meet them slowly.",
    'ゆったり およいでるね。': 'Swimming so leisurely.', 'ちょっと めずらしい こだよ。': "That's a bit of a rare one.", 'めずらしい こ！ あえて うれしいね。': 'A rare one! So glad to meet it.',
    'スペシャルな こだよ！ きらきら してるね。': "It's a special one! So sparkly.", 'まぼろしの こ…！ ほんとうに いたんだ。': 'A mythical one…! They really exist.',
    'はじめまして！': 'Nice to meet you!', 'ぬしだよ！ すごいね。': "It's a Giant! Amazing.",
    'めずらしさ': 'Rarity', 'さいだい': 'Largest', 'あつめた': 'Collected',
    'ひるまは ランプが なくても あかるいね。': "It's bright enough in the daytime, even without the lamp.", 'わあ… ほしぞらみたい。': 'Wow… like a starry sky.',
    'ランプを けしたよ。かべが ほしぞらに なったよ。': 'You turned off the lamp. The wall became a starry sky.', 'ぽっと あかるく なったね。': 'It suddenly got bright and cozy.', 'ランプを つけたよ。': 'You turned on the lamp.',
    'おにぎり、おいしそう。': 'That rice ball looks yummy.', 'はんぶんこ、しよっか。': 'Shall we split it?', 'おにぎりを さわったよ。': 'You touched the rice ball.', 'おにぎりを はんぶんこ したよ。': 'You split the rice ball.',
    'はんぶんこ しよ': "Let's split it.", 'おいしいね': 'Yummy.',
    'まるふわが うとうと しはじめたよ。': 'Marufuwa started to doze off.', '…ねてないよ。': "…I wasn't sleeping.",
    'ほしの びんが ひかって いるよ。': 'The star bottle is glowing.', 'ほしの びんが できたよ。よるに なると ひかるよ。': 'You made a star bottle. It glows at night.',
    'ちいさな もりで、さかなが やすんで いるよ。': 'Fish are resting in the tiny forest.', 'ちいさな もりが できたよ。よるに なると さかなが やすみに くるよ。': 'You made a tiny forest. At night, fish come to rest.',
    'ありがとう、って いってるみたい。': 'They seem to be saying thank you.', 'さかなたちが、ありがとう って いってる みたい。': 'The fish seem to be saying thank you.',
    '♪ ふん ふふん ♪': '♪ Hum hum hmm ♪', 'まるふわが、すいそうの うたを うたったよ。': 'Marufuwa sang the aquarium song.',
    'ごはんを あげたよ。さかなが あつまって くるよ。': 'You fed them. The fish are gathering.', 'ふつうの ながめかたに もどったよ。': 'Back to the normal way of watching.', 'みみで ながめるを おわりました。': 'Finished listening mode.',
    'Tab キーで さかなを えらぶと、なまえの おとが 鳴ります。': 'Choose a fish with the Tab key to hear its name sound.', 'Enter で くわしく しらべます。': 'Press Enter to see details.',
    'BGMは、みみで ながめる あいだ おやすみします。': 'BGM takes a rest while you are listening.',
    'おとを つけたよ。': 'Sound is on.', 'おとを つけました。': 'Sound turned on.', 'おとを けしたよ。': 'Sound is off.', 'おとを けしました。': 'Sound turned off.',
    'おとと BGMを つけたよ。': 'Sound and BGM are on.', 'BGMを つけたよ。': 'BGM is on.', 'BGMを けしたよ。': 'BGM is off.', 'しずかな きょくが ながれるよ。': 'A quiet tune is playing.',
    'かざりを えらんで、すいそうを タップ。おいた かざりを タップすると、もどせるよ。': 'Choose a decoration, then tap the aquarium. Tap a placed decoration to take it back.',
    'まだ かざりは ないよ。さかなが ときどき もって くるよ。': 'No decorations yet. Fish sometimes bring them.', 'かざりを おわる': 'Done decorating', 'ぜんぶ もどしたよ。また かざろうね。': "Everything is back. Let's decorate again.",
    'しゃしんが とれたよ。「ほぞん」を おすか、がぞうを ながおしで ほぞんできるよ。': 'Photo taken! Press “Save”, or long-press the image to save it.', 'しゃしんが とれました。': 'Photo taken.',
    'ごめんね、しゃしんが うまく とれなかったよ。': "Sorry, the photo didn't come out well.",
    'おやすみタイマー：なし': 'Sleep timer: off', 'ぜんがめん': 'Full screen', 'ぜんがめんを やめる': 'Exit full screen',
    // きろくを もどす 窓（リンクで ひらいた とき）・きょうゆう・コピー・Xの ヒント
    'この ブラウザは まだ きろくが ないよ。もどすと、つづきから あそべるよ。': 'This browser has no records yet. Restore to pick up where you left off.',
    'いまの きろくの ほうが おおいよ。もどすと、いまの きろくは なくなるよ。': 'Your current record is bigger. If you restore, your current record will be lost.',
    'もどすと、いまの きろくは、この きろくに おきかわるよ。': 'If you restore, your current record will be replaced by this one.',
    'もどす': 'Restore', 'それでも もどす': 'Restore anyway', 'もどさない': 'Don’t restore',
    'コピーが できなかったよ。「コピーする」で もじを コピーしてね。': "Couldn't copy. Use “Copy” to copy the code.", 'コピーが できなかったよ。もういちど ためしてね。': "Couldn't copy. Please try again.",
    'リンクを コピー したよ。おくりたい ところに はってね。おうちの ひとと いっしょに つかってね。': 'Link copied. Paste it where you want to send it. Please use it together with a grown-up.',
    'きょうゆうの がめんを とじました。': 'Closed the share screen.', 'やめました。': 'Cancelled.', '「ほぞんする」を つかってね。': 'Please use “Save”.',
    'ぜんがめんで あそぶには、⋮ から ブラウザ（Safariなど）で ひらいてね。きろくは ブラウザごとに べつだよ。うつす ときは「きろくを のこす」から。': 'To play full screen, open this in a browser (such as Safari) from the ⋮ menu. Your records are separate in each browser. To move them, use “Save your records”.',
    'とじる（もう だしません）': 'Close (won’t show again)',
    'ホームがめんに おく': 'Add to home screen', 'いま ホームがめんに おく': 'Add it now',
    '🐠 すいそう': '🐠 Aquarium',   // すいそうの ボタン（バッジの span は ゲームが かえる ので のこす）
    'まるふわ つりびより': 'Marufuwa Fishing Days',   // おへやの しゃしん（canvas）の ふだ
  }).forEach(([k, v]) => EX.set(k, v));
  for (const [k, v] of [...EX]) { const nk = norm(k); if (nk !== k) { EX.delete(k); EX.set(nk, v); } }   // かぎの すきまを そろえる
  const COLOR = { 'あか': 'Red', 'あお': 'Blue', 'きいろ': 'Yellow', 'もも': 'Pink', 'みどり': 'Green', 'むらさき': 'Purple', 'きん': 'Gold', 'にじ': 'Rainbow', 'ぎん': 'Silver', 'よぞら': 'Night sky', 'しろ': 'White', 'くろ': 'Black', 'オレンジ': 'Orange', 'そのまま': 'As is' };
  const OFTEN = s => s.split('・').map(t => nmTime(t, true)).join(', ');

  // ---- 2) ルール（すうじ・なまえが はいる 文）----
  const REG_EN = { 'ふつう': 'Common', 'ちょっとめずらしい': 'A bit rare', 'めずらしい': 'Rare', 'スペシャル': 'Special', 'まぼろし': 'Mythical', 'ぬし': 'Giant' };
  const SIZE_EN = { 'とてもおおきい': 'very large', 'おおきい': 'large', 'ふつうのおおきさ': 'medium-sized', 'ちいさい': 'small' };
  const SIDE_EN = { 'ひだり': 'left', 'みぎ': 'right', 'まんなか': 'middle' };
  const up = s => s.charAt(0).toUpperCase() + s.slice(1);
  const REG_RE = 'ふつう|ちょっとめずらしい|めずらしい|スペシャル|まぼろし|ぬし', SIZE_RE = 'とてもおおきい|おおきい|ふつうのおおきさ|ちいさい', SIDE_RE = 'ひだり|みぎ|まんなか';
  const RULES = [
    // すいそう（おへや）：よみあげ・ならびの ことば
    [new RegExp(`^(.+?)。(${REG_RE})。(${SIZE_RE})。(${SIDE_RE})にいます。$`), (_, f, r, s, w) => `${nmFish(f)}. ${REG_EN[r]}. ${up(SIZE_EN[s])}. On the ${SIDE_EN[w]}.`],
    [new RegExp(`^(.+?)。(${REG_RE})。さいだい([\\d.]+)センチ、あつめた(\\d+)ひき。$`), (_, f, r, cm, n) => `${nmFish(f)}. ${REG_EN[r]}. Largest ${cm} cm, collected ${n}.`],
    [/^いま(\d+)ひきおよいでいます。$/, (_, n) => `${n} fish are swimming now.`],
    [new RegExp(`^ひだりからじゅんに、(.+)。$`), (_, list) => { const out = []; for (const it of list.split('、')) { const m = new RegExp(`^(${SIDE_RE})の(.+?)（(${SIZE_RE})）$`).exec(it); if (!m) return null; out.push(`${nmFish(m[2])} (${SIZE_EN[m[3]]}, ${SIDE_EN[m[1]]})`); } return `From left to right: ${out.join(', ')}.`; }],
    [/^(\d+)ひきいるよ。みみをすませてね。$/, (_, n) => `${n} fish here. Listen closely.`],
    [/^ずかんまであと(\d+)しゅるい。$/, (_, n) => `${n} more kinds to complete your Fish Book.`],
    [/^(.+?)がすいそうにようこそ。$/, (_, f) => `Welcome to the aquarium, ${nmFish(f)}!`],
    [/^おくりものだな。もらったさかなが(\d+)ひき。おすと、ひらくよ。$/, (_, n) => `Gift shelf. ${n} fish received. Press to open.`],
    [/^おくりものだなをひらいたよ。もらったさかなが(\d+)ひきいるよ。$/, (_, n) => `Opened the gift shelf. ${n} fish received.`],
    [/^([^\d.].*?)\s*([\d.]+)センチ$/, (_, f, cm) => (JP.test(f) && !FISH_MAP.has(f) ? null : `${nmFish(f)} ${cm} cm`)],
    [/^(?:[^×]+×\d+){2,}$/, s => { const out = []; for (const m of s.matchAll(/([^×]+)×(\d+)/g)) { const t = tailEn(m[1]); if (t == null) return null; out.push(`${t} ×${m[2]}`); } return out.join(', '); }],   // バケツの「ひろった かざり」（かいがら ×2　ながれぎ ×1）
    [/^(.+?)×(\d+)$/, (_, n, k) => { const t = tailEn(n); return t == null ? null : `${t} ×${k}`; }],
    [/^(.+?)をもどす$/, (_, n) => { const t = tailEn(n); return t == null ? null : `Put back ${t}`; }],
    [/^(.+?)をもどしたよ。$/, (_, n) => { const t = tailEn(n); return t == null ? null : `Put back ${t}.`; }],
    [/^(.+?)をおいたよ。$/, (_, n) => { const t = tailEn(n); return t == null ? null : `Placed ${t}.`; }],
    [/^(\d+)ひき$/, (_, n) => `${n} fish`],
    [/^もどすきろく：つれたかず(\d+)ひき・シールちょう(\d+)\s*\/\s*(\d+)・レベル(\d+)$/, (_, a, b, c, d) => `Record to restore: caught ${a} · Fish Book ${b} / ${c} · Lv. ${d}`],
    [/^いまのきろく：つれたかず(\d+)ひき$/, (_, a) => `Current record: caught ${a}`],
    [/^つれたかず(\d+)シールちょう(\d+)\s*\/\s*(\d+)$/, (_, a, b, c) => `Caught ${a} · Stickers ${b} / ${c}`],   // おへやの しゃしんの ふだ（canvas）
    [/^(.+)をおくる$/, (_, f) => `Send ${nmFish(f)}`],
    [/^(.*?)🎁\s*(.+?)から(?:「(.+?)」)?$/, (_, pre, p, w) => { const who = p === 'だれか' ? 'Someone' : nmPal(p); const word = w ? (EX.get(norm(w)) || null) : ''; if (w && word == null) return null; return `${pre.replace(/[　\s]+/g, ' ').trim()} 🎁 From ${who}${w ? `: “${word}”` : ''}`.trim(); }],
    [/^(.+?)から$/, (_, p) => (p === 'だれか' ? 'From someone' : PAL_MAP.has(p) ? `From ${nmPal(p)}` : null)],   // おくりものの「なかま から」
    [/^(ひみつのことばがみつかったよ！|このことばはもうみつけているよ。いつでもどうぞ。)(.*)$/, (_, a, r) => { const tail = r ? (EX.get(r) || tr(r)) : ''; return tail == null ? null : `${EX.get(a)}${tail ? ' ' + tail : ''}`; }],
    [/^✨\s*(.+?)\s*✨$/, (_, q) => { const t = tr(q); return t == null ? null : `✨ ${t} ✨`; }],
    [/^あと(\d+)ひき$/, (_, n) => `${n} to go`],
    [/^(.+?)、げんきそう。$/, (_, f) => `${nmFish(f)} looks lively.`],
    [/^(.+?)がこっちをみたよ。$/, (_, f) => `${nmFish(f)} looked over here.`],
    [/^(.+?)、ゆうゆうおよいでるね。$/, (_, f) => `${nmFish(f)} swims so leisurely.`],
    [/^(とうだい|まるまど|つき)をさわったよ。$/, (_, o) => `You touched the ${({ 'とうだい': 'lighthouse', 'まるまど': 'round window', 'つき': 'moon' })[o]}.`],
    [/^(\d+)がつ(\d+)にち$/, (_, m, d) => `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m] || m} ${d}`],
    [/^(.+?)。もういちどきく$/, (_, n) => { const t = EX.get(norm(n)); return t ? `${t}. Listen again` : null; }],
    [/^(.+?)からとどくよ。$/, (_, p) => `From ${nmPal(p)}.`],
    [/^めずらしさ(\d)\s*\/\s*(\d)$/, (_, a, b) => `Rarity ${a} / ${b}`],
    [/^\/\s*30しゅるい$/, () => '/ 30 kinds'],
    [/^(.+?)をかかげるまるふわのしゃしん$/, (_, f) => `Photo of Marufuwa holding up ${nmFish(f)}`],
    [/^(.+?)（つかっている）$/, (_, n) => { const t = EX.get(norm(n)) || tailEn(n); return t == null ? null : `${t} (in use)`; }],
    [/^「もうめいじんだね。」$/, () => '“You’re a master now.”'],
    [/^「(.+)」$/, (_, q) => { const t = EX.get(norm(q)); return t ? `“${t}”` : null; }],
    [/^(.+?)、さいだい([\d.]+)センチ、(\d+)ひき$/, (_, f, cm, n) => `${nmFish(f)}, largest ${cm} cm, ${n} caught`],
    [/^あたらしいなかまが(\d+)ひききたよ。$/, (_, n) => `${n} new friends have arrived.`],
    [/^さいだい([\d.]+)センチ（(\d+)ひき）(ぬし)?$/, (_, cm, n, b) => `Largest ${cm} cm (${n} caught)${b ? ' · Giant' : ''}`],
    [/^(みずうみ|かわ|みなとまち|ふねのうえ)・(いつでも)$/, (_, a) => `${nmArea(a)} · any time`],
    [/^(みずうみ|かわ|みなとまち|ふねのうえ)・(.+?)におおい$/, (_, a, t) => `Often at ${nmArea(a, true)} · ${OFTEN(t)}`],
    [/^(.+?)。つかっている$/, (_, c) => (COLOR[c] ? `${COLOR[c]}. In use` : null)],
    [/^(.+?)。レベル(\d+)でもらえるよ$/, (_, c, n) => (COLOR[c] ? `${COLOR[c]}. Unlocks at level ${n}` : null)],
    [/^レベル(\d+)$/, (_, n) => `Lv. ${n}`],
    [/^つれたかず(\d+)$/, (_, n) => `Caught ${n}`],
    [/^ずかん(\d+)\s*\/\s*(\d+)$/, (_, a, b) => `Fish Book ${a}/${b}`],
    [/^(\d+)\s*\/\s*(\d+)しゅるい$/, (_, a, b) => `${a}/${b} kinds`],
    [/^つりびとレベル(\d+)$/, (_, n) => `Angler Lv. ${n}`],
    [/^つりびとレベルが(\d+)になったよ！$/, (_, n) => `Angler level is now ${n}!`],
    [/^(\d+)\/(\d+)しゅるい$/, (_, a, b) => `${a}/${b} kinds`],
    [/^(🐠)?すいそう(\d+)$/, (_, e, n) => `${e || ''} Aquarium ${n}`.trim()],
    [/^すいそうをみる。あたらしいなかまが(\d+)ひき$/, (_, n) => `View the aquarium. ${n} new friends`],
    [/^つかいやすくする（いま：(.+)）$/, (_, x) => `Comfort options (now: ${x === 'ふつう' ? 'Normal' : x.replace('らくちん', 'Easy mode').replace('ふるえなし', 'No vibration').replace('いきものなし', 'No wildlife').replace(/・/g, ', ')})`],
    [/^ばしょをかえる（いま：(.+)）$/, (_, a) => `Change spot (now: ${nmArea(a)})`],
    [/^じかんをかえる（いま：(.+)）$/, (_, a) => `Change time (now: ${nmTime(a)})`],
    [/^(.+?)についたよ。きょうは(.+?)と(.+?)がいるよ。$/, (_, a, p1, p2) => `Arrived at ${nmArea(a, true)}. Today, ${nmPal(p1)} and ${nmPal(p2)} are here.`],
    [/^(あさ|ひる|ゆうがた|よる)になったよ。(（とけいにあわせているよ。）)?$/, (_, t, c) => `It's now ${nmTime(t, true)}.${c ? ' (Following your clock.)' : ''}`],
    [/^(.+?)に(いって)みる？$/, (_, a) => `Go to ${nmArea(a, true)}?`],
    [/^(.+?)が「またね」とかえっていったよ。$/, (_, p) => `${nmPal(p)} waved goodbye and left.`],
    [/^(.+?)があそびにきたよ。$/, (_, p) => `${nmPal(p)} came to visit!`],
    [/^(.+?)がきたよ。$/, (_, p) => (PAL_MAP.has(norm(p)) ? `${nmPal(p)} has arrived.` : null)],
    [/^となりでつりをする(.+)$/, (_, p) => `${nmPal(p)} fishing nearby`],
    [/^きょうのラッキーさかなは「(.+?)」。(.+?)にいるよ。(きょうはあめ。)?(?:きょうのぬしは「(.+?)の(.+?)」にでやすいよ。)?$/, (_, f, a, rain, ba, bt) =>
      `Today's lucky fish is “${nmFish(f)}”. You'll find it at ${nmArea(a, true)}.${rain ? " It's raining today." : ''}${ba ? ` Today's Giant is likely at “${nmArea(ba)} — ${nmTime(bt, true)}”.` : ''}`],
    [/^(.+?)がつれた。([\d.]+)センチ。(.*)$/, (_, f, cm, rest) => { const tail = tailEn(rest); return tail == null ? null : `${nmFish(f)} caught! ${cm} cm. ${tail}`.trim(); }],
    [/^([\d.]+)センチ$/, (_, cm) => `${cm} cm`],
    [/^(.+?)をみずにかえしたよ。またあおうね。$/, (_, f) => `${nmFish(f)} went back to the water. See you again.`],
    [/^あたらしくふえたよ：(.*)$/, (_, r) => { const t = tailEn(r); return t == null ? null : `New: ${t}`; }],
    [/^ぴったり×(\d+)$/, (_, n) => `Perfect ×${n}`],
    [/^(ぴったり！！|いいね！|おしい！)あとすこし。$/, (_, w) => `${EX.get(norm(w))} Almost there.`],
    [/^(にじいろにひかるかげ…！なんだろう。|とてもおおきなかげ…！ぬしかも。|きんいろのかげ…！スペシャルなこかも。|ひかるかげがきた！|きた！)「ひく！」をおしてね。いそがなくてだいじょうぶ。$/, (_, w) => ({
      'にじいろにひかるかげ…！なんだろう。': 'A rainbow-colored shadow…! What could it be?', 'とてもおおきなかげ…！ぬしかも。': 'A huge shadow…! Could it be a Giant?',
      'きんいろのかげ…！スペシャルなこかも。': 'A golden shadow…! Maybe a Special one.', 'ひかるかげがきた！': 'A shining shadow appeared!', 'きた！': 'A bite!' }[w] + ' Press “Reel in!” No rush.')],
    [/^おとをつけたよ。わがちかづくとおとがたかくなって、「ピコン」でおしてね。(きこえないときは、よこのマナースイッチをみてね。)?$/, (_, s) => 'Sound is on. As the ring closes in, the sound gets higher — press at the “ping”.' + (s ? " Can't hear it? Check the silent switch on the side." : '')],
    [/^にがしたこ：(\d+)ひき。またあえるよ。$/, (_, n) => `Released: ${n}. You can meet them again.`],
    [/^★5のまぼろしのこ：ぜんいんにあえたよ！$/, () => 'Mythical ★5 fish: you met them all!'],
    [/^★5のまぼろしのこが(\d+)ひきいるよ（あえたこ：(\d+)）。30しゅるいぜんぶあつめると、あえやすくなるよ。$/, (_, a, b) => `There are ${a} mythical ★5 fish (met: ${b}). Collect all 30 kinds, and they get easier to meet.`],
    [/^めずらしさ(\d)\/(\d)$/, (_, a, b) => `Rarity ${a} / ${b}`],
    [/^いまのきろく（(\d+)ひき）よりすくないきろく（(\d+)ひき）です。もどすなら、もういちどおしてね。$/, (_, a, b) => `This record (${b} catches) is smaller than your current one (${a} catches). Press again to restore anyway.`],
    [/^このもじは、よめなかったよ。「MF1\.」からはじまるもじを、ぜんぶはってね。$/, () => "Couldn't read that code. Please paste the whole code that starts with “MF1.”."],
    [/^かってにとうこうはしません。Xにのせるときは、ほぞんしたえをそえてね。Xは、おうちのひと（おとな）といっしょにつかってね。$/, () => 'Nothing is posted without you. When posting to X, attach the saved picture. Please use X with a grown-up.'],
    [/^Xにかく。あたらしいまどがひらきます。おうちのひとといっしょにつかってね$/, () => 'Post to X. A new window opens. Please use it with a grown-up.'],
  ];

  // ---- 3) かけら（長い じゅんに おきかえる）。ぜんぶ おきかわれば 英語に なる ----
  const PH = [];
  const ph = (ja, en) => PH.push([norm(ja), en]);
  FISH_JA.forEach((j, i) => ph(j, ` ${FISH_EN[i]} `));
  PAL_JA.forEach((j, i) => ph(j, ` ${PAL_EN[i]} `));
  PAL_WORD.forEach(([j, e]) => ph(j, ` ${e} `));
  [['レベルアップ！', 'Level up!'], ['きょうのラッキー', "Today's Lucky"], ['10ぴきめ！なかよし', '10th catch! Best friends'], ['はじめて！', 'First time!'], ['じぶんのきろく！', 'Personal best!'], ['おおもの', 'Big one'],
    ['ちょっとめずらしい', 'A bit rare'], ['スペシャル', 'Special'], ['まぼろし', 'Mythical'], ['めずらしい', 'Rare'], ['ぬし', 'Giant'],
    ['あたらしくふえたよ：', ' New: '], ['ペンギン：', ' Penguin: '], ['（さかなが もっていたよ）', '(the fish was carrying it)'], ['（さかながもっていたよ）', ' (the fish was carrying it) '], ['れんぞく', ' streak '],
    ['きのえだのさお', 'Twig Rod'], ['たけのさお', 'Bamboo Rod'], ['ほしのさお', 'Star Rod'], ['ふつうのえさ', 'Regular Bait'], ['きらきらえさ', 'Sparkle Bait'], ['おおきいえさ', 'Big Bait'],
    ['かいがら', 'Seashell'], ['きれいないし', 'Pretty stone'], ['ながれぎ', 'Driftwood'], ['みずくさ', 'Water plant'], ['ちいさなびん', 'Little bottle'], ['ほしのかけら', 'Star fragment'],
    ['いいこがつれたね。', 'Nice catch!'], ['ぬしだよ！すごい、すごい。', "It's a Giant! Amazing, amazing."], ['またぬしだ！', 'Another Giant!'], ['スペシャルなこだよ！', "It's a special one!"], ['なにかもっていたみたい！', 'It seems to be carrying something!'],
    ['はじめまして、だね。', 'Nice to meet you.'], ['きろくがのびたね！', 'A new personal best!'], ['ずかんがぜんぶうまったよ！', 'Your Fish Book is complete!'], ['まぼろしのこだ…！ほんとうにいたんだ。', 'A mythical one…! They really exist.'],
    ['つりびとレベルが', ' Angler level is now '], ['になったよ！', '!'], ['ずかんかんせいまで、あと', ' Only '], ['しゅるい！', ' kinds left to complete your Fish Book!'],
    ['センチ', ' cm '], ['ぴったり×', ' Perfect ×'], ['、', ', '], ['・', ' · ']].forEach(([j, e]) => ph(j, e));
  PH.sort((a, b) => b[0].length - a[0].length);

  // しゃしんの ぶぶんなど：かけらだけで 訳す（すべて 訳せた ときだけ 返す）
  function tailEn(rest) {
    let s = rest;
    for (const [p, e] of PH) { if (s.indexOf(p) >= 0) s = s.split(p).join(e); }
    s = tidy(s);
    return JP.test(s) ? null : s;
  }
  const tidy = s => s.replace(/\s+/g, ' ').replace(/\s+([.,!?:;)])/g, '$1').replace(/\(\s+/g, '(').trim();

  // 1つの 文（まるごと 一致 → ルール → かけら）。訳せなければ null
  function piece(p) {
    if (EX.has(p)) return EX.get(p);
    for (const [re, fn] of RULES) { const m = re.exec(p); if (m) { const r = fn(...m); if (r != null) return r; } }
    return tailEn(p);
  }
  // 「。！？」で 区切って、ぜんぶ 訳せた ときだけ 1つに つなぐ（つなぎ書きの 文・あとから ふえた 文の ため）
  function splitEn(k) {
    const parts = k.match(/[^。！？]+[。！？]+[」）』]?/g);
    if (!parts) return null;
    const rest = k.slice(parts.join('').length); if (rest) parts.push(rest);
    if (parts.length < 2) return null;
    const out = [];
    for (const p of parts) { const e = piece(p); if (e == null) return null; out.push(e); }
    return out.join(' ');
  }
  function tr(ja) {
    const k = norm(ja);
    if (!k) return null;
    const t = piece(k);
    return t != null ? t : splitEn(k);
  }
  window.TsuriEn.t = s => (JP.test(String(s)) ? (tr(s) ?? s) : s);
  window.TsuriEn.tr = tr;
  // さかなの なまえだけ（ひろばの いけ など）も 訳す
  FISH_JA.forEach((j, i) => EX.set(norm(j), FISH_EN[i]));
  // べつの ページ・べつの ファイルが 訳を たす くち：TsuriEn.add({ex:{'にほんご':'English'}, rules:[[/正規表現/, (m…)=>'English']]})
  window.TsuriEn.h = { nmFish, nmPal, nmArea, nmTime, norm, tailEn, EX, PAL_MAP, FISH_MAP };
  window.TsuriEn.add = ({ ex, rules, short } = {}) => {
    if (ex) Object.entries(ex).forEach(([k, v]) => EX.set(norm(k), v));
    if (short) Object.entries(short).forEach(([k, v]) => SHORT.set(norm(k), v));
    if (rules) rules.forEach(r => RULES.push(r));
    // すでに 訳した ものも、もとの 日本語から やりなおす（あとから ふえた 訳・みじかい 訳が きく）
    for (const [node, rec] of [...ORIG]) {
      if (!node.isConnected) { ORIG.delete(node); continue; }
      if (node.nodeValue !== rec.en) continue;   // ゲームが その あとで かきかえた ものは さわらない
      const e = (forSvg(node) && SHORT.get(norm(rec.ja))) || tr(rec.ja);
      if (e != null) { node.nodeValue = e; rec.en = e; }
    }
    missing.clear(); if (document.body) walk(document.body);   // まだ 日本語の ものも 訳す
  };

  // =====================================================================
  //  DOM の ほんやく
  // =====================================================================
  const PURE = new Set(['RUBY', 'RT', 'RP', 'BR', 'SMALL', 'B', 'I', 'EM', 'STRONG', 'SPAN']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'NOSCRIPT', 'IMG']);   // SVG の <text>（かんばんの もじ）も 訳す
  function reading(el) {
    let s = '';
    const walk = n => {
      if (n.nodeType === 3) { s += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      if (n.tagName === 'RT' || n.tagName === 'RP') return;
      if (n.tagName === 'RUBY') { const rt = n.querySelector('rt'); s += rt ? rt.textContent : n.textContent; return; }
      n.childNodes.forEach(walk);
    };
    walk(el);
    return s;
  }
  function isPure(el) {
    // 文字の 飾りだけの 要素（ふりがな・太字 など）を 1つの 文として 訳す。ID の ある もの・かくれた もの（hidden・aria-hidden＝バッジ など ゲームが 中身を かえる 部品）を ふくむ 時は さわらない（部品を こわさない）
    for (const d of el.querySelectorAll('*')) { if (!PURE.has(d.tagName) || d.id || d.hidden || d.getAttribute('aria-hidden') === 'true') return false; }
    return true;
  }
  function translateAttrs(el) {
    for (const a of ['aria-label', 'alt', 'title', 'placeholder']) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && JP.test(v)) { const e = tr(v); if (e != null) el.setAttribute(a, e); else missing.add(norm(v)); }
    }
  }
  const SHORT = new Map();   // かんばん（SVG の もじ）は 場所が せまい ので、みじかい 訳を つかう
  const ORIG = new Map();    // 訳した ぶぶんの「もとの 日本語」（あとから 訳が ふえた とき、やりなおせる）
  const forSvg = n => { const p = n.parentElement; return !!(p && p.namespaceURI === 'http://www.w3.org/2000/svg'); };
  function translateText(n) {
    const v = n.nodeValue;
    if (!v || !JP.test(v)) return;
    const e = (forSvg(n) && SHORT.get(norm(v))) || tr(v);
    if (e != null) {
      if (ORIG.size > 4000) { for (const k of ORIG.keys()) { if (!k.isConnected) ORIG.delete(k); } }
      ORIG.set(n, { ja: v, en: null });
      const lead = /^\s*/.exec(v)[0], trail = /\s*$/.exec(v)[0]; n.nodeValue = (lead ? ' ' : '') + e + (trail ? ' ' : ''); ORIG.get(n).en = n.nodeValue;
      // 「（いま：」のように ひらいた かっこは、つぎの ぶぶんの「）」を「)」に そろえる
      if (e.includes('(') && !e.includes(')')) { let s = n.nextSibling; while (s) { const t = s.nodeType === 3 ? s : (s.firstChild && s.firstChild.nodeType === 3 ? null : null); if (s.nodeType === 3 && s.nodeValue.trim().startsWith('）')) { s.nodeValue = s.nodeValue.replace('）', ')'); break; } s = s.nextSibling; } }
    } else missing.add(norm(v));
  }
  function walk(el) {
    if (!el || el.nodeType !== 1 || SKIP.has(el.tagName.toUpperCase())) return;
    if (el.closest && el.closest('[data-en-skip],[data-en]')) return;   // data-en-skip／data-en：その ページが 自分で 英語に する ところ（さわらない）
    translateAttrs(el);
    const hasRuby = !!el.querySelector('ruby');
    const text = el.textContent;
    if (!JP.test(text) && !hasRuby) { el.querySelectorAll('[aria-label],[alt],[title]').forEach(translateAttrs); return; }
    if (JP.test(reading(el)) || hasRuby) {
      if ((hasRuby || el.children.length) && isPure(el)) {
        const e = tr(reading(el));
        if (e != null) { const t = document.createTextNode(e); ORIG.set(t, { ja: reading(el), en: e }); el.replaceChildren(t); return; }
        if (hasRuby) { missing.add(norm(reading(el))); return; }
      }
    }
    el.childNodes.forEach(n => { if (n.nodeType === 3) translateText(n); else if (n.nodeType === 1) walk(n); });
  }

  // ロゴ：英語に つくりなおす（🎣の <i> は のこす＝ウキの えが はいる）
  function logo() {
    const h = document.querySelector('h1.logo'); if (!h || h.dataset.en) return;
    h.dataset.en = '1'; h.setAttribute('aria-label', 'Marufuwa Fishing Days');
    const mk = (ch, n) => { const s = document.createElement('span'); s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--n', String(n)); s.textContent = ch === ' ' ? ' ' : ch; return s; };
    const icon = h.querySelector('i'); [...h.querySelectorAll('span')].forEach(s => s.remove());
    const before = [...'Marufuwa'].map((c, i) => mk(c, i)), after = [...'Fishing Days'].map((c, i) => mk(c, i + 9));
    before.forEach(s => h.insertBefore(s, icon)); after.forEach(s => h.append(s));
    h.style.fontSize = 'clamp(1.2rem,6.4vw,2.1rem)'; h.style.flexWrap = 'wrap';
  }
  // データ：魚の なまえを 英語に（あとで つくる ふだ・バケツ・ずかんが 英語で でる）
  function patchData() {
    const all = window.Tsuri && window.Tsuri.all; if (!all) return;
    all.forEach((f, i) => { if (FISH_EN[i]) { f.name = FISH_EN[i]; f.kanji = FISH_EN[i]; } });
  }

  document.documentElement.lang = 'en';
  // 英語は 日本語より 文字が ながい：せまい 画面（320〜360px）で ボタンの もじが はみ出さない ように、英語の ときだけ 少し ちいさく・折り返す（本体の CSS は さわらない）
  { const css = document.createElement('style'); css.id = 'tsuri-en-css';
    css.textContent = '@media (max-width:380px){html[lang=en] .hud>button,html[lang=en] .hud>a{font-size:.8rem;padding-left:4px;padding-right:4px;white-space:normal;line-height:1.15}html[lang=en] #tk-open{white-space:nowrap}html[lang=en] #tk-title{font-size:.8rem}}';
    (document.head || document.documentElement).append(css); }
  // ページの 題と 説明：ふだんは 釣りの もの。ひろば など べつの ページは <html data-en-page> で この 既定を とばして、TsuriEn.page({title, description}) で 自分の 題・説明を きめる
  const meta = document.querySelector('meta[name=description]');
  // ホームがめんに おく 時の なまえも 英語に（iPhone は apple-mobile-web-app-title、Android(Chrome) は manifest）。manifest の あるページ（釣りの 本体）だけ
  { const mf = document.querySelector('link[rel=manifest]'), at = document.querySelector('meta[name=apple-mobile-web-app-title]');
    if (mf && /(^|\/)manifest\.webmanifest$/.test(mf.getAttribute('href') || '')) mf.setAttribute('href', mf.getAttribute('href').replace('manifest.webmanifest', 'manifest-en.webmanifest'));
    if (at) at.setAttribute('content', 'Fishing Days'); }
  window.TsuriEn.page = ({ title, description } = {}) => { if (title) document.title = title; if (description && meta) meta.content = description; };
  if (!document.documentElement.hasAttribute('data-en-page')) window.TsuriEn.page({ title: 'Marufuwa Fishing Days — a no-rush fishing game', description: "No rush. Let one go, and nothing is lost. A cozy fishing game that runs in your browser — free, no login, no install." });
  function start() {
    logo(); patchData(); walk(document.body);
    let queue = new Set(), scheduled = false;
    const flush = () => { scheduled = false; const items = [...queue]; queue = new Set(); items.forEach(n => { const el = n.nodeType === 1 ? n : n.parentElement; if (el && el.isConnected) walk(el); }); };
    const mo = new MutationObserver(recs => {
      for (const r of recs) {
        if (r.type === 'attributes') { translateAttrs(r.target); continue; }
        if (r.type === 'characterData') { queue.add(r.target); continue; }
        r.addedNodes.forEach(n => { if (n.nodeType === 1 || n.nodeType === 3) queue.add(n); });
        if (r.type === 'childList' && r.target.nodeType === 1) queue.add(r.target);
      }
      if (!scheduled) { scheduled = true; Promise.resolve().then(flush); }
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'alt', 'title', 'placeholder'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
