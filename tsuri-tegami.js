/* まるふわ びより：てがみ（文の束・外付け・総司令部）
   ・ひさしぶりに もどった ときに とどく、なかまからの てがみ。日数は かぞえない・出さない。せめない
   ・「さびしかった」「まってた のに」は かかない（もどった 人を せめる ことばを 1もじも いれない）
   ・ぜんぶ ひらがな（漢字なし）。英語は ならべて もつ（English mode の とき ここから えらぶ）
   ・つかいかた：window.TsuriTegami.pick({pal:'usagi', night:false, seed:数}) → {from, name:{ja,en}, ja:[…], en:[…]}
                 window.TsuriTegami.lines(letter) → いまの ことばの ぎょう（ふつうは ja。TsuriEn.lang==='en' なら en）
   ・かたちだけ：ほんたい（ジョブズ1）が ✉ を 出して ひらく。このファイルは データと えらぶ 関数だけ（保存も 通信も なし） */
(() => {
  'use strict';
  if (window.TsuriTegami) return;

  const WHO = {
    usagi: ['ミントの うさぎ', 'Mint Bunny'], kawauso: ['ラテの かわうそ', 'Latte Otter'], hiyoko: ['レモンの ひよこ', 'Lemon Chick'], ribbon: ['リボンの うさぎ', 'Ribbon Bunny'],
    panda: ['おひるね パンダ', 'Nap Panda'], kojika: ['おほしさまの こじか', 'Little Star Fawn'], tanuki: ['クローバーの たぬき', 'Clover Tanuki'], risu: ['チョコの りす', 'Chocolate Squirrel'],
    neko: ['ももの ねこ', 'Peach Cat'], koinu: ['はちみつの こいぬ', 'Honey Puppy'], hamster: ['いちごの ハムスター', 'Strawberry Hamster'], hoho: ['ほほきずの ねこ', 'Scrappy Cat'],
    azarashi: ['さくらの あざらし', 'Sakura Seal'], alpaca: ['わたあめの アルパカ', 'Cotton Candy Alpaca'], gantai: ['がんたいの くま', 'Eyepatch Bear'],
    penguin: ['あんないの ペンギン', 'Guide Penguin'], kogitsune: ['おみせの きつね', 'Shop Fox'],
  };

  // [にほんご の ぎょう, English の ぎょう]
  const L = {
    usagi: [
      [['ひさしぶり！', 'ぴょんぴょん はねて まっていたよ。', 'また あえて うれしいな。'], ['Long time no see!', 'I was hopping around while I waited.', 'So happy to see you again.']],
      [['おかえり！', 'きょうは ぴょん と おおきいの つれたよ。', 'あとで みせるね。'], ['Welcome back!', 'I caught a big one with a hop today.', "I'll show you later."]],
      [['やっほー！', 'ミントの かぜが ふいて いるよ。', 'ゆっくり して いってね。'], ['Hi hi!', 'A minty breeze is blowing.', 'Take your time.']],
    ],
    kawauso: [
      [['ひさしぶり。', 'きれいな いしを ひろったよ。', 'きみに みせたくて とっておいたんだ。'], ['Long time no see.', 'I found a pretty stone.', 'I saved it to show you.']],
      [['おかえり。', 'みずの なかで いしを さがして いたよ。', 'また いっしょに さがそうね。'], ['Welcome back.', 'I was looking for stones under the water.', "Let's look together again."]],
      [['こんにちは。', 'きょうの かわは ぽかぽか だよ。', 'また あえて うれしい。'], ['Hello.', "The river is nice and warm today.", 'So glad to see you again.']],
    ],
    hiyoko: [
      [['ぴよ。ひさしぶり！', 'きょうも はれ だよ。', 'きてくれて ありがとう。'], ['Peep. Long time no see!', "It's sunny again today.", 'Thank you for coming.']],
      [['ぴよぴよ。おかえり。', 'おひさまが ぽかぽか だから、', 'いっしょに ひなたぼっこ しよう。'], ['Peep peep. Welcome back.', "The sun is so warm,", "let's bask in it together."]],
      [['ぴよ！', 'また あえて うれしいな。', 'ゆっくり して いってね。'], ['Peep!', 'So happy to see you again.', 'Take your time.']],
    ],
    ribbon: [
      [['ひさしぶり！', 'あたらしい リボン、つけて みたよ。', 'にあう かな？'], ['Long time no see!', "I tried a new ribbon.", 'Does it suit me?']],
      [['おかえりなさい。', 'きょうの リボンは ゆうやけ いろ。', 'また あえて うれしい。'], ['Welcome back.', "Today's ribbon is sunset-colored.", 'So glad to see you again.']],
      [['やあ！', 'きみの ふくも すてきだね。', 'ゆっくり して いってね。'], ['Hey!', 'Your outfit is lovely, too.', 'Take your time.']],
    ],
    panda: [
      [['ふわぁ… ひさしぶり。', 'ちょうど ひるね してたよ。', 'また あえて うれしい。'], ['Yaaawn… long time no see.', 'I was just taking a nap.', 'So glad to see you again.']],
      [['おかえり…', 'ねむい けど、きみが きて うれしいな。', 'いっしょに のんびり しよう。'], ['Welcome back…', "I'm sleepy, but I'm happy you're here.", "Let's take it easy together."]],
      [['ふわぁ。', 'きょうも ゆっくり いこうね。'], ['Yaaawn.', "Let's take it slow today, too."]],
    ],
    kojika: [
      [['ひさしぶり。', 'もりの においが して きたら、', 'きみを おもいだしたよ。'], ['Long time no see.', 'When I smelled the forest,', 'I thought of you.']],
      [['おかえり。', 'ゆうべは ほしが たくさん みえたよ。', 'きょうの よるも みえるかな。'], ['Welcome back.', 'I saw so many stars last night.', 'I wonder if we can see them tonight.']],
      [['こんにちは。', 'きりの あさに、きれいな みずを みつけたよ。'], ['Hello.', 'On a misty morning, I found some clear water.']],
    ],
    tanuki: [
      [['ひさしぶり！', 'よつばを さがして いたら、', 'あっと いう ま に いちにち だったよ。'], ['Long time no see!', 'I was looking for clovers,', 'and the day flew by.']],
      [['おかえり！', 'きょうは よつばを 1まい みつけたよ。', 'きみに ひとつ あげるね。'], ['Welcome back!', 'I found a four-leaf clover today.', "I'll share the luck with you."]],
      [['やあ。', 'いっしょに よつば、さがそう。', 'のんびり ね。'], ['Hey.', "Let's look for a four-leaf clover together.", 'Nice and slow.']],
    ],
    risu: [
      [['ひさしぶり！', 'どんぐりを とっておいたよ。', 'また あえて うれしいな。'], ['Long time no see!', 'I saved some acorns.', 'So happy to see you again.']],
      [['おかえり。', 'ほっぺに どんぐりを つめて まっていたよ。', 'いっしょに たべよう？'], ['Welcome back.', 'I stuffed my cheeks with acorns while I waited.', 'Want to eat together?']],
      [['こんにちは！', 'きょうは いい ひ だね。'], ['Hello!', "It's a lovely day."]],
    ],
    neko: [
      [['にゃ。ひさしぶり。', 'ひなたで ごろごろ して いたよ。', 'また あえて うれしい。'], ['Meow. Long time no see.', 'I was rolling around in the sun.', 'So glad to see you again.']],
      [['にゃ。おかえり。', 'きょうは いい さかなが つれそうだよ。'], ['Meow. Welcome back.', "Looks like we might catch a good one today."]],
      [['にゃー。', 'ゆっくり して いきなよ。'], ['Meow.', 'Stay and relax.']],
    ],
    koinu: [
      [['わん！ ひさしぶり！', 'しっぽが ぶんぶん とまらないよ。', 'また あえて うれしい！'], ['Woof! Long time no see!', "I can't stop wagging my tail.", 'So happy to see you again!']],
      [['おかえり！ わん！', 'きょうも たのしい ひ に しようね。'], ['Welcome back! Woof!', "Let's make today a fun day."]],
      [['わんわん！', 'いっしょに あそぼう。'], ['Woof woof!', "Let's play together."]],
    ],
    hamster: [
      [['ひさしぶり！', 'ほっぺに いちごを いれて まってたよ。', 'また あえて うれしいな。'], ['Long time no see!', 'I waited with a strawberry in my cheeks.', 'So happy to see you again.']],
      [['おかえり。', 'きょうは いちごの あまい におい が するよ。'], ['Welcome back.', 'It smells like sweet strawberries today.']],
      [['やあ！', 'ゆっくり して いってね。'], ['Hey!', 'Take your time.']],
    ],
    hoho: [   // ※ きずの はなしに ふれる。マスターが めで みて きめる（けす なら この 3つを ぬく）
      [['ひさしぶり。', 'ほほの きずは、もう おちついて いるよ。', 'また あえて うれしい。'], ['Long time no see.', 'The scar on my cheek has settled down.', 'So glad to see you again.']],
      [['おかえり。', 'きずが あっても、ここでは', 'ゆっくり して いいんだよ。'], ['Welcome back.', 'Even with scars,', 'you can take it easy here.']],
      [['やあ。', 'きょうも ゆっくり いこう。'], ['Hey.', "Let's take it slow today, too."]],
    ],
    azarashi: [
      [['ひさしぶり。', 'うみの かぜが きもちよかったよ。', 'また あえて うれしい。'], ['Long time no see.', 'The sea breeze felt lovely.', 'So glad to see you again.']],
      [['おかえり。', 'なみの おとを きいて いたよ。', 'いっしょに きこう。'], ['Welcome back.', 'I was listening to the waves.', "Let's listen together."]],
      [['こんにちは。', 'さくらいろの ゆうやけ だったよ。'], ['Hello.', 'The sunset was cherry-blossom pink.']],
    ],
    alpaca: [
      [['ひさしぶり。', 'かぜが ふわふわ ふいて いるよ。', 'また あえて うれしい。'], ['Long time no see.', 'The breeze is blowing so softly.', 'So glad to see you again.']],
      [['おかえり。', 'わたあめみたいな くもが ながれて いくよ。'], ['Welcome back.', 'Clouds like cotton candy are drifting by.']],
      [['やあ。', 'のんびり いこうね。'], ['Hey.', "Let's take it easy."]],
    ],
    gantai: [
      [['ひさしぶり。', 'ゆうべ、ほしが きれいに みえたよ。', 'また あえて うれしい。'], ['Long time no see.', 'The stars were beautiful last night.', 'So glad to see you again.']],
      [['おかえり。', 'かた めでも、ほしは ちゃんと みえるんだ。', 'きみと みたいな。'], ['Welcome back.', 'Even with one eye, I can see the stars just fine.', 'I want to watch them with you.']],
      [['こんばんは。', 'きょうも ほしが みえるよ。'], ['Good evening.', 'The stars are out again tonight.']],
    ],
    penguin: [
      [['ひさしぶり！', 'きょうも ゆっくり つりを たのしんでね。'], ['Long time no see!', 'Enjoy some slow fishing today.']],
      [['おかえりなさい。', 'ずかんも きろくも、ちゃんと のこって いるよ。'], ['Welcome back.', 'Your Fish Book and records are safe and sound.']],
    ],
    kogitsune: [
      [['いらっしゃい。', 'おかねは いらないよ。', 'また きて くれて うれしい。'], ['Welcome.', 'No money needed.', "I'm glad you came back."]],
    ],
  };

  // だれからでも
  const GENERIC = [
    [['ひさしぶり！', 'また あえて うれしい。', 'きょうも ゆっくり いこうね。'], ['Long time no see!', 'So glad to see you again.', "Let's take it slow today, too."]],
    [['おかえりなさい。', 'ここは いつでも ここに あるよ。'], ['Welcome back.', 'This place is always here.']],
    [['いらっしゃい。', 'いそがなくて だいじょうぶ。'], ['Welcome.', "No rush. It's okay."]],
    [['きて くれて ありがとう。', 'のんびり して いってね。'], ['Thank you for coming.', 'Take your time.']],
    [['また あえたね。', 'ずかんも きろくも そのままだよ。'], ['We meet again.', 'Your Fish Book and records are just as you left them.']],
    [['おかえり。', 'みずの おと、きこえるかな。', 'ゆっくり ききに おいで。'], ['Welcome back.', 'Can you hear the water?', 'Come and listen for a while.']],
  ];
  // よなか（1〜4じ）に ひらいた とき
  const NIGHT = [
    [['こんばんは。', 'ねむれない？', 'いっしょに ながめよう。'], ['Good evening.', "Can't sleep?", "Let's watch together."]],
    [['よなかの みずうみは しずかだね。', 'ここに いて いいよ。'], ['The lake is quiet in the middle of the night.', 'You can stay right here.']],
    [['ほしが ひとつ みえるかな。', 'むりに ねなくても いいよ。'], ['Can you see a star?', "You don't have to force yourself to sleep."]],
    [['おそい じかんまで おつかれさま。', 'ゆっくり いきを しよう。'], ['Good work, up this late.', "Let's breathe slowly."]],
  ];

  const make = (from, pair) => ({ from, name: { ja: WHO[from] ? WHO[from][0] : '', en: WHO[from] ? WHO[from][1] : '' }, ja: pair[0], en: pair[1] });
  const pick = (o) => {
    o = o || {};
    const seed = Math.abs(Number.isFinite(o.seed) ? Math.floor(o.seed) : new Date().getDate());
    if (o.night) { const p = NIGHT[seed % NIGHT.length]; return make(o.pal && WHO[o.pal] ? o.pal : 'penguin', p); }
    const mine = o.pal && L[o.pal];
    if (mine && mine.length) return make(o.pal, mine[seed % mine.length]);
    return make('penguin', GENERIC[seed % GENERIC.length]);
  };
  const lines = (letter) => (window.TsuriEn && window.TsuriEn.lang === 'en' ? letter.en : letter.ja);
  window.TsuriTegami = { v: 1, who: WHO, letters: L, generic: GENERIC, night: NIGHT, pick, lines,
    all: () => [...Object.entries(L).flatMap(([id, arr]) => arr.map(p => make(id, p))), ...GENERIC.map(p => make('penguin', p)), ...NIGHT.map(p => make('penguin', p))] };
})();
