/* まるふわ びより：ひろばの English（訳表・外付け・総司令部）
   ・tsuri-en.js の あとに よむ（ひろばの ページ）。日本語の ときは 何も しない（TsuriEn.add は なにも しない）
   ・なかまの せりふは、その子の くちぐせ（釣りの tsuri-en.js の PAL_WORD）と おなじ ひびきに そろえた
   ・ほほきずの ねこ・がんたいの くま の せりふは、つらい ひとに よりそう もの。英語でも、はげまし すぎず、せめず、そのまま */
(() => {
  'use strict';
  if (!window.TsuriEn || window.TsuriEn.lang !== 'en' || !window.TsuriEn.h) return;
  const { nmFish, nmPal, nmTime, norm, EX } = window.TsuriEn.h;

  const ex = {
    // ---- 時間・あいさつ・ものの なまえ ----
    'おはよう': 'Good morning', 'こんにちは': 'Hello', 'こんばんは': 'Good evening', 'おつきさま': 'Moon', 'おひさま': 'Sun',
    'まるふわ': 'Marufuwa', 'あんないのペンギン': 'Guide Penguin', 'おみせのこぎつね': 'Shop Fox',
    'つりば': 'Fishing Spot', 'ありがとうのいし': 'Thank-You Stone',
    'じゅんびちゅうのばしょ': 'Getting ready', 'じゅんびちゅうのばしょ（ちかぢか）': 'Getting ready (coming soon)',
    'ここはまだじゅんびちゅう。ちかぢかあそべるよ。たのしみにまっててね': "Still getting ready. You'll be able to play soon. Look forward to it!",
    'ここもじゅんびちゅう。ちかぢかあそべるよ。おたのしみに': 'This one is getting ready, too. Coming soon. Stay tuned!',
    'あめ': 'Rain', 'はれ': 'Sunny', 'ふんすい': 'Fountain', 'ちかく': 'Nearby', 'ひだり': 'Left', 'みぎ': 'Right',
    'まるふわのひろば': "Marufuwa's Plaza", 'きょうのともだち': "Today's friends", 'さわってみてね': 'Try touching it',
    'ひろばにもどったよ': 'Back in the plaza.', 'いってきます！': 'See you later!', 'ただいま！': "I'm back!", 'またね！': 'See you!',
    'ぽかぽか': 'Warm and cozy', 'くるくる〜': 'Twirl twirl~', 'えへへ': 'Hehe', 'くすぐったい': 'That tickles', 'ふふっ': 'Hehe', 'にこにこ': 'Smile smile', 'なあに？': "What is it?",
    'かなうといいね': 'I hope it comes true.', 'ねがいごとをしたよ。かなうといいね。': 'You made a wish. I hope it comes true.',
    'ふんすいがちゃぷちゃぷしているよ': 'The fountain is splashing.', 'おひさまがぽかぽかしているよ': 'The sun is warm and cozy.', 'くもがぽよんとはねたよ': 'The cloud bounced with a boing.',
    'はっぱがひらひらおちてきたよ': 'Leaves are fluttering down.', 'ながれぼしがとんだよ。さわるとねがいごとができるよ': 'A shooting star flew by. Touch it to make a wish.',
    'やめたよ。すきなところへいこう': "Never mind. Let's go wherever you like.", 'じゅんびちゅうだって': "It's getting ready.",
    'まるふわのおへやにはいったよ': "Went into Marufuwa's room.", 'おへやからもどったよ': 'Came back from the room.',
    'ちかくにはだれもいないよ。': 'No one is nearby.', 'まんなかにはふんすいがあるよ。': "There's a fountain in the middle.", '（まだ）': '(not yet)',
    '。きょうあったよ': '. Met today', '。きょうまだあっていないよ': '. Not met yet today',
    'さっきつりばであったね。またあえてうれしいな': 'We met at the fishing spot earlier. Happy to see you again.',
    'うごき：すくない': 'Motion: Low', 'うごき：ふつう': 'Motion: Normal', 'うごき：すくない（このたんまつのせっていにあわせているよ）': "Motion: Low (following this device's setting)",
    'うごきをすくなくしているよ。おすとふつうにもどるよ': 'Motion is reduced. Press to return to normal.', 'うごきをすくなくする': 'Reduce motion',
    'おとをつけたよ。ふんすいにちかづくと、みずのおとがおおきくなるよ。「まわりをきく」で、ばしょのおとがきけるよ。': 'Sound is on. The closer you get to the fountain, the louder the water. Use “Listen around” to hear each place’s sounds.',
    'おととBGMをつけたよ。しずかなきょくがながれるよ。': 'Sound and BGM are on. Quiet music will play.', 'BGMをつけたよ。しずかなきょくがながれるよ。': 'BGM is on. Quiet music will play.', 'BGMをけしたよ。': 'BGM is off.',
    'うごきをすくなくしたよ。ともだちはそのばにいるよ。': 'Motion is reduced. Friends stay where they are.', 'うごきをふつうにもどしたよ。': 'Motion is back to normal.',
    'ちかくにはなにもないよ。したのボタンでいきたいところをえらべるよ': 'Nothing is nearby. Use the buttons below to choose where to go.',
    'いけでさかながぴょんとはねたよ': 'A fish leaped out of the pond.', 'ふんすいのちかく': 'Near the fountain',
    'ありがとうのいしは、まだじゅんびちゅうだよ。': "The thank-you stone isn't ready yet.", 'ほしをさわってみてね。': 'Try touching a star.',
    'ありがとうのほしぞらをひらいたよ。あそんでくれたひとのほしがならんでいるよ。': 'Opened the thank-you starry sky. The stars of people who played are lined up.', 'ありがとうのほしぞらをとじたよ。': 'Closed the thank-you starry sky.',
    'しゃしんをつくっているよ…': 'Making a photo…', 'きょうのひろばのしゃしん。まるふわとともだちがいるよ。': "Today's plaza photo. Marufuwa and friends are here.",
    'まるふわのひろばであそんだよ　#まるふわびより': "I played in Marufuwa's Plaza #MarufuwaDays",
    'きょうゆうのがめんをとじました。': 'Closed the share window.', 'やめました。': 'Cancelled.', '「ほぞんする」をつかってね。': 'Please use “Save”.',
    'かってにとうこうはしません。「ほぞんする」でのこせるよ。': 'Nothing is posted without you. Use “Save” to keep it.', 'つくれなかったよ。もういちどためしてね。': "Couldn't make it. Please try again.",
    'ひろばへようこそ。ゆびでさわると、まるふわがあるくよ。したのボタンで、いきたいところへいけるよ。': 'Welcome to the plaza. Tap, and Marufuwa will walk there. Use the buttons below to go where you like.',
    // ---- あんないの ペンギン ----
    'ひろばへようこそ': 'Welcome to the plaza.',
    'まだじゅんびちゅうのばしょもあるよ。たのしみにね': 'Some places are still getting ready. Look forward to them.', 'スカーフ、あったかいよ': 'My scarf is warm.',
    'ふんすいをさんかいさわると…ないしょ！': "If you touch the fountain three times… it's a secret!", 'いけをじっとみていると、いいことがあるよ': 'If you watch the pond quietly, something nice happens.',
    'いそがなくてだいじょうぶ': "No rush. It's okay.", 'ここにいていいんだよ': 'You can stay right here.', 'あめのひは、みずたまりがたのしいね': 'Puddles are fun on rainy days.',
    'ぼく、ぬれるのへいき': "I don't mind getting wet.", 'よるはほしがきれいにみえるよ': 'The stars look beautiful at night.', 'つきをさわると…どうなるかな': 'What happens if you touch the moon…?',
    'きょうもいいひになるよ': 'Today will be a good day, too.', 'そらのいろがかわるよ。ゆうがただね': "The sky is changing color. It's evening.",
    // ---- ももの ねこ ----
    'にゃ。まるふわ、きたね': "Meow. Marufuwa's here.", 'ひなたぼっこ、きもちいいにゃ': 'Sunbathing feels nice, meow.', 'ごろごろ…ねむくなってきた': "Purr… I'm getting sleepy.",
    'しっぽがうずうずするにゃ': 'My tail is itching to move, meow.', 'ここ、ぼくのおきにいり': 'This is my favorite spot.', 'まるふわ、きょうもふわふわだね': "Marufuwa's fluffy again today.",
    'ふんすいのみず、ひやっとしてたよ': 'The fountain water was nice and cool.', 'なにもしなくてもいいんだよ': "You don't have to do anything.", 'あめのおと、ねむくなるね': 'The sound of rain makes me sleepy.',
    'ぬれないようにここにいよっと': "I'll stay here so I don't get wet.", 'よるのさんぽは、しずかですき': 'I like quiet night walks.', 'おつきさま、ながめてたんだ': 'I was watching the moon.',
    'ふあぁ…ねむいにゃ': 'Yaaawn… sleepy, meow.', 'ゆうやけ、おさかないろだね': 'The sunset is fish-colored.',
    // ---- ミントの うさぎ ----
    'ぴょん！あえてうれしいな': 'Boing! So happy to see you.', 'ぴょんぴょん！げんき？': 'Boing boing! How are you?', 'みみをすませると、かぜのこえがするよ': "If you listen closely, you can hear the wind's voice.",
    'ひろば、すき。みんなくるから': 'I like the plaza. Everyone comes here.', 'いっしょにぴょんってしてみる？': 'Want to try hopping together?', 'にんじん…はないよね。えへへ': "Carrots… there aren't any, huh. Hehe.",
    'きょうもあえてうれしい': 'Happy to see you again today.', 'あめのひは、みみがぺたんとなるよ': 'On rainy days, my ears go flop.', 'ぽつぽつ、うたっているみたい': 'The raindrops sound like they’re singing.',
    'おほしさま、いっぱいだね': 'So many stars.', 'ねむいけど、もうちょっとここにいたいな': "I'm sleepy, but I want to stay a little longer.", 'いいあさだね！': 'What a lovely morning!', 'そらがももいろだよ！': 'The sky is pink!',
    // ---- おひるね パンダ ----
    'もぐもぐ…ゆっくりしていってね': 'Munch munch… take your time.', 'ささ、たべる？ないしょではんぶんこ': "Want some bamboo? Let's split it, just between us.", 'のんびりするの、とくいだよ': "I'm good at taking it easy.",
    'ころんであそぶときもちいいよ': 'Rolling around feels great.', 'おなかいっぱい…ねむい': 'Full belly… sleepy.', 'ゆっくりでいいんだよ': 'Slow is okay.', 'ここにすわると、ほっとするよ': 'Sitting here is a relief.',
    'きょうもきてくれてありがとう': 'Thank you for coming today, too.', 'あめのおとをきくと、おちつくね': 'The sound of rain is calming.', 'かさ、いっしょにはいる？': 'Want to share my umbrella?',
    'ほしをながめながら、ささをもぐもぐ': 'Munching bamboo while watching the stars.', 'おやすみまえのひろば、いいね': 'The plaza before bedtime is nice.', 'ふわぁ…まだねむいね': 'Yaaawn… still sleepy.',
    'ゆうやけ、おいしそう…ささみたい': 'The sunset looks tasty… like bamboo.',
    // ---- おほしさまの こじか ----
    'もりのにおいがするよ': 'It smells like the forest.', 'ちいさなはながさいてたよ': 'Tiny flowers were blooming.', 'はしるのはすき。でもいまはゆっくり': 'I like running. But for now, slowly.',
    'このかばんのほし、おきにいり': 'I love the star on this bag.', 'あるくと、ぽっくりおとがするよ': 'My steps go clip-clop.', 'きのう、ゆめでまるふわにあったよ': 'I met Marufuwa in a dream yesterday.',
    'いいかぜがふいているね': 'A nice breeze is blowing.', 'あめのもりは、いいにおいだよ': 'The forest smells good in the rain.', 'しずくがきらきらしているね': 'The droplets are sparkling.',
    'もりのよるは、しずかできれい': 'The forest at night is quiet and beautiful.', 'ほたる、いるかな': 'I wonder if there are fireflies.', 'あさのくうき、すきとおっているね': 'The morning air is so clear.',
    'ゆうやけのもり、あったかいいろ': 'The evening forest has warm colors.',
    // ---- おみせの こぎつね ----
    'おみせはつりばにあるよ': 'The shop is at the fishing spot.', 'おかねはいらないよ。あそぶとどうぐがふえるよ': 'No money needed. Play, and your gear grows.', 'このぼうし、おきにいり。にあう？': 'I love this hat. Does it suit me?',
    'つりばにおいでよ。おおきいこがいるかも': 'Come to the fishing spot. There might be a big one.', 'おにぎり、おいしいよね': 'Rice balls are so yummy.', 'いつでもゆっくりしていってね': 'Take your time, anytime.',
    'ここはいいところだよね': "This is a nice place, isn't it?", 'あめのひは、めずらしいこがでやすいんだって': 'They say rare fish show up more on rainy days.', 'おみせののれん、ぬれないかな': "I hope the shop curtain won't get wet.",
    'よるのつりばもすてきだよ': 'The fishing spot is lovely at night, too.', 'おつきさま、まんまるだね': 'The moon is so round.', 'きょうのおみせ、じゅんびできたよ': 'The shop is ready for today.', 'そろそろおみせをしまうじかん': 'Almost time to close the shop.',
    // ---- わたあめの アルパカ ----
    'かぜがふわふわしているね': 'The breeze is so fluffy.', 'もこもこ、さわってみる？': 'Want to touch my fluff?', 'ふわふわは、こころにもあるんだよ': "There's fluffiness in the heart, too.", 'かぜにふかれると、ねむくなるね': 'The breeze makes me sleepy.',
    'ゆっくりゆっくり、いこうね': "Slowly, slowly. Let's go.", 'スカーフ、おそろいにする？': 'Want to match scarves?', 'ここはあったかいばしょだね': 'This is a warm place.', 'あめのひのもこもこは、しっとりだよ': 'My fluff gets damp on rainy days.',
    'かさがほしいな。もこもこがぬれちゃう': 'I want an umbrella. My fluff will get wet.', 'よるのかぜは、すこしひんやりだね': 'The night wind is a little chilly.', 'ほしがわたあめにみえるよ': 'The stars look like cotton candy.',
    'あさのひかり、ふわっとしている': 'The morning light is soft and airy.', 'ゆうやけ、わたあめのいろ': 'The sunset is cotton-candy colored.',
    // ---- さくらの あざらし ----
    'いけのみずもきもちいいね': 'The pond water feels nice, too.', 'ごろん…ここでひとやすみ': 'Flop… time for a rest here.', 'おなか、ぽかぽかするね': 'My tummy feels warm.', 'つるつるのいし、みつけたよ': 'I found a smooth stone.',
    'およぐの、だいすき。でもいまはごろごろ': "I love swimming. But right now, I'm lounging.", 'さくらのはな、あたまについてる？': 'Do I have a cherry blossom on my head?', 'のんびり、のんびり': 'Nice and slow, nice and slow.',
    'あめはみずとおなじ。きもちいい': 'Rain is just water. It feels nice.', 'ぽつぽつおと、うみみたい': 'The pitter-patter sounds like the sea.', 'つきのひかりで、みずがきらきら': 'The water sparkles in the moonlight.',
    'ねむいときは、ねていいんだよ': "When you're sleepy, it's okay to sleep.", 'おはよう。あさのみずはつめたいよ': 'Good morning. The morning water is cold.', 'ゆうひで、みずがオレンジになるよ': 'The setting sun turns the water orange.',
    // ---- がんたいの くま ----
    'ほしがみえるよ。ひるでもね': 'I can see stars. Even in the daytime.', 'このがんたい、ちょっとかっこいいでしょ': 'This eyepatch is kind of cool, right?', 'かたほうのめでも、きれいなものはみえるよ': 'Even with one eye, I can see beautiful things.',
    'ほしをかぞえると、ねむくなるよ': 'Counting stars makes you sleepy.', 'むりにげんきにならなくていいよ': "You don't have to force yourself to be cheerful.", 'すわって、ゆっくりながめよう': "Let's sit and watch quietly.",
    'まるふわとおそろいのふく、うれしい': "I'm happy to have matching clothes with Marufuwa.", 'あめのひは、くものうえのほしをおもうんだ': 'On rainy days, I think of the stars above the clouds.', 'ぽつぽつ…ほしのかけらみたい': 'Pitter-patter… like fragments of stars.',
    'ほら、ほしがでてきたよ': 'Look, the stars are coming out.', 'ながれぼしをみつけたら、ねがいごとだよ': 'If you spot a shooting star, make a wish.', 'ひるまも、ほしはそこにいるんだよ': 'Even in the daytime, the stars are still there.',
    'もうすぐほしがでるよ': 'The stars will be out soon.',
    // ---- いちごの ハムスター ----
    'ほっぺにおやついれとこ': "I'll stash a snack in my cheeks.", 'ほっぺ、ぱんぱんだよ。さわる？': 'My cheeks are packed. Want to touch them?', 'いちごのかおり、する？': 'Can you smell the strawberries?',
    'ちいさいからだでも、だいじょうぶ': "Even with a small body, it's okay.", 'ちょこちょこあるくの、たのしい': 'Scurrying around is fun.', 'おやつ、はんぶんこする？': 'Want to split a snack?', 'ここ、ひなたであったかい': "It's sunny and warm here.",
    'あめのひは、おうちでごろごろしたいな': 'On rainy days, I want to laze around at home.', 'かさ、ちっちゃいのがほしいな': 'I want a teeny umbrella.', 'よるは、ひまわりのたねをかじるよ': 'At night, I nibble sunflower seeds.',
    'ねむい…ほっぺにゆめをいれとこ': "Sleepy… I'll stash my dreams in my cheeks.", 'あさごはん、たべた？': 'Did you have breakfast?', 'ゆうごはんのじかんだね': "It's dinner time.",
    // ---- レモンの ひよこ ----
    'ぴよ！きょうもいいひ': "Peep! It's a good day again.", 'ぴよぴよ。いっしょにあるく？': 'Peep peep. Want to walk together?', 'ちいさくても、げんきいっぱい': 'Small, but full of energy.', 'レモンのかおり、するかな？': 'Can you smell lemon?',
    'ころんでも、ぴよっておきればいいんだ': 'If you fall, just pop back up with a peep.', 'おひさま、まぶしいね': 'The sun is bright.', 'ぴよ。ここ、たのしいね': 'Peep. This place is fun.', 'あめのひは、みずたまりでぴちゃぴちゃ': 'On rainy days: splish-splash in the puddles.',
    'ぬれたら、ふるふるするよ': 'If I get wet, I shake shake shake.', 'ねむいぴよ…おやすみのじかん': 'Sleepy, peep… bedtime.', 'ほしがおおきなたまごみたい': 'The stars look like big eggs.', 'ぴよ！あさだよ、おきよう': "Peep! It's morning. Let's get up.",
    'そろそろおうちへかえろうかな': 'Maybe it’s time to head home.',
    // ---- ほほきずの ねこ ----
    'きょうもきたよ。いっしょにいようね': "I came today, too. Let's be together.", 'このほっぺのきず、なかよしのしるし': 'This scar on my cheek is a sign of friendship.', 'きずがあっても、いまはたのしいよ': "Even with scars, I'm having fun now.",
    'むりしてわらわなくていいからね': "You don't have to force a smile.", 'つらいときは、ここでやすんでいきな': 'When things are hard, rest here for a while.', 'ぼくも、ころんだことがいっぱいあるよ': "I've fallen down a lot, too.",
    'いっしょにひなたぼっこ、しよう': "Let's bask in the sun together.", 'あめのひは、きずがすこしうずくんだ。でもいっしょならだいじょうぶ': "On rainy days, my scar aches a little. But I'm okay if we're together.", 'あまやどり、いっしょにする？': 'Want to wait out the rain together?',
    'よるはしずかでいいね': 'Nights are quiet and nice.', 'ねむれないよるもあるよね。ここにいていいよ': "There are sleepless nights, aren't there. You can stay here.", 'あさは、ゆっくりでいいんだよ': 'Mornings can be slow.', 'いちにち、おつかれさま': 'Good work today.',
    // ---- ラテの かわうそ ----
    'いいいし、みつけたよ': 'Found a nice stone.', 'このいし、つるつる。あげよっか？': 'This stone is smooth. Want it?', 'ラテ、のむ？あったかいよ': "Want some latte? It's warm.", 'みずのなかは、きもちいいよ': 'It feels nice in the water.',
    'たからものは、ポケットにいれとくんだ': 'I keep treasures in my pocket.', 'ぷかぷかうくの、とくいだよ': "I'm good at floating.", 'いっしょにひとやすみしよう': "Let's take a break together.", 'あめのひは、みずあそびびより': 'Rainy days are perfect for water play.',
    'いしがつやつやになるよ': 'The stones get all shiny.', 'よるのみずは、つきがうつるよ': 'The moon is reflected in the night water.', 'ラテでほっとするよ': 'A latte warms me right up.', 'あさのラテはおいしいよ': 'Morning latte is delicious.', 'ゆうやけのいけ、きれいだよ': 'The pond at sunset is beautiful.',
    // ---- はちみつの こいぬ ----
    'わん！あえてうれしい': 'Woof! So happy to see you.', 'わん！おさんぽ、いく？': 'Woof! Want to go for a walk?', 'しっぽがぶんぶんしちゃう': "My tail won't stop wagging.", 'はちみつ、なめる？あまいよ': "Want to lick some honey? It's sweet.",
    'ここではしってもいいかな？': 'Is it okay to run around here?', 'いっしょにいると、たのしい': "It's fun being together.", 'ぼく、まるふわがだいすき': 'I love Marufuwa.', 'あめのさんぽもたのしいよわん': 'Rainy walks are fun, too. Woof.',
    'ぶるぶるぶるっ！ぬれちゃった': 'Shake shake shake! I got wet.', 'おほしさまにほえたらおこられるかな': 'If I howl at the stars, will I get scolded?', 'ねむいけど、もうすこしあそびたいわん': "I'm sleepy, but I want to play a bit more, woof.",
    'おはようわん！さんぽのじかん': 'Good morning, woof! Walk time.', 'ゆうがたのさんぽ、すき': 'I like evening walks.',
    // ---- リボンの うさぎ ----
    'リボン、にあう？': 'Does my ribbon look nice?', 'このリボン、おきにいり': 'This ribbon is my favorite.', 'まるふわのふくも、かわいいね': "Marufuwa's outfit is cute, too.", 'おしゃれは、じぶんがうれしいことがだいじ': 'What matters in fashion is what makes you happy.',
    'リボンをむすぶと、きもちがしゃんとするよ': 'Tying a ribbon makes me feel put together.', 'ぴょんってすると、ゆれるよ': 'It sways when I hop.', 'きょうもいいひだね': "It's a good day again.", 'あめのひのリボンは、しっとり': 'A ribbon on a rainy day gets damp.',
    'かさもリボンのがらなんだ': 'My umbrella has a ribbon pattern, too.', 'よるのリボンは、ほしいろ': 'At night, my ribbon is star-colored.', 'ねるまえに、リボンをほどくんだ': 'I untie my ribbon before bed.', 'あさのリボン、うまくむすべた': 'I tied my morning ribbon just right.',
    'ゆうやけいろのリボン、いいでしょ': 'A sunset-colored ribbon. Nice, right?',
    // ---- チョコの りす ----
    'どんぐり、たべる？': 'Want an acorn?', 'ちょこちょこうごくの、たのしい': 'Scampering around is fun.', 'どんぐり、いっぱいあつめたよ': 'I collected lots of acorns.', 'ベレーぼう、にあってる？': 'Does my beret suit me?', 'チョコのかおり、するでしょ': 'You can smell the chocolate, right?',
    'きのうえは、いいけしきだよ': 'The view from the treetops is lovely.', 'ゆっくりでいいよ、ぼくものんびり': "Slow is fine. I'm taking it easy, too.", 'あめのひは、きのうろでひとやすみ': 'On rainy days, I rest in a tree hollow.',
    'どんぐり、ぬれないようにしまうよ': "I'll put the acorns away so they don't get wet.", 'よるのもりは、ほたるがとぶよ': 'Fireflies fly in the night forest.', 'おやすみのまえに、どんぐりをかぞえる': 'Before bed, I count my acorns.',
    'あさのきは、つゆがきらきら': 'In the morning, the dew sparkles on the trees.', 'ゆうやけのきのうえ、おすすめだよ': 'The treetops at sunset are highly recommended.',
    // ---- クローバーの たぬき ----
    'よつばのクローバー、さがそ': "Let's look for a four-leaf clover.", 'よつばをみつけると、いいことがあるって': 'They say finding a four-leaf clover brings good things.', 'ぽんぽこおなか、さわる？': 'Want to pat my round tummy?',
    'ばけるのはにがて。でもここにいるよ': "I'm bad at shapeshifting. But I'm here.", 'のんびりさがそう。いそがなくていい': "Let's search slowly. No need to rush.", 'みつからなくても、たのしいよ': "It's fun even if we don't find one.",
    'いっしょにくさむら、みてみよう': "Let's check the grass together.", 'あめのひは、クローバーがつやつや': 'On rainy days, the clovers are glossy.', 'ぽんぽこ、あまやどり': 'Round tummy, sheltering from the rain.',
    'よるのくさむらで、ほたるをみたよ': 'I saw fireflies in the grass at night.', 'つきのひかりで、よつばがひかったよ': 'The four-leaf clover glowed in the moonlight.', 'つゆのクローバー、きれいだよ': 'Clovers with dew are beautiful.',
    'ゆうやけのくさむら、いいにおい': 'The grass at sunset smells nice.',
    // ---- ありがとうの いしの みほんの なまえ（?sample=1 のときだけ）----
    'ミルク': 'Milk', 'ほしぞら': 'Starry Sky', 'もも': 'Momo', 'ラムネ': 'Ramune', 'ゆき': 'Yuki', 'そら': 'Sora', 'はな': 'Hana', 'ことり': 'Kotori', 'くるみ': 'Walnut', 'あずき': 'Azuki', 'みかん': 'Mikan', 'ひなた': 'Hinata',
    'たんぽぽ': 'Dandelion', 'こむぎ': 'Komugi', 'あめだま': 'Candy Drop', 'すずらん': 'Lily of the Valley', 'ハート': 'Heart', 'ふわり': 'Fuwari', 'ぽっぽ': 'Poppo', 'マロン': 'Marron', 'ちょこ': 'Choco', 'ゆず': 'Yuzu', 'きなこ': 'Kinako', 'ぱんだ': 'Panda', 'ほたる': 'Hotaru',
    // ---- ページの せつめい・ボタン・かんばん ----
    'やじるしキーでまるふわがあるくよ。スペースキーでちかくのともだちにはなしかけたり、ばしょにはいったりできるよ。エスケープキーでやめるよ。したのボタンでもおなじことができるよ。スマホではしたへスクロールして、いきさきのボタンをえらんでね。': 'Use the arrow keys to walk Marufuwa. Press Space to talk to a nearby friend or enter a place. Press Escape to cancel. The buttons below do the same things. On a phone, scroll down to choose a destination.',
    'スマホではしたへスクロールして、いきさきのボタンをえらんでね。': 'On a phone, scroll down to choose a destination.', 'スマホはしたへスクロールして「いきさき」をえらんでね。': 'On a phone, scroll down to choose a destination.',
    'ひろば。まるふわがあるくばしょ': 'The plaza: where Marufuwa walks', 'おへや': 'Room', 'ありがとう': 'Thanks', 'じゅんびちゅう': 'Getting ready',
    'いきさき': 'Where to go', 'つりびより': 'Fishing', 'すいそう': 'Aquarium', 'まだできていないばしょ': 'Places not ready yet', 'ちかぢかあそべます': 'Coming soon',
    'ともだちにあいにいく': 'Visit friends', 'まわりをきく': 'Listen around', 'さわれるもの': 'Things to touch', 'くも': 'Cloud', 'き': 'Tree', 'あそびかた': 'How to play',
    'ゆびでさわったところへ、まるふわがあるいていくよ。かんばんやたてものをさわると、そこへいって、あそびにいけるよ。ともだちにちかづくと、ひとことはなしかけてくれるよ。': "Tap a spot and Marufuwa will walk there. Touch a sign or building to go and play. Get close to a friend, and they'll say a word to you.",
    'キーボードは、やじるしキーであるいて、スペースキーではなす・はいる。エスケープキーでやめるよ。': 'On a keyboard: walk with the arrow keys, talk or enter with Space, and cancel with Escape.',
    'いそがなくてだいじょうぶ。まちがえても、なにもへらないよ。': "No rush. If you make a mistake, nothing is lost.", 'おとのせっていは、つりびよりとおなじものをつかうよ。': 'The sound setting is shared with the fishing game.',
    'きろくはこのたんまつのなかだけにのこります。': 'Your records stay only on this device.', 'あそんでくれたひとのほしが、ならんでいるよ。': 'The stars of people who played are lined up.',
    'これはさんぷるです。': 'This is a sample.', 'ほんとうのなまえではありません。': 'These are not real names.', 'ほしぞら。ほしをさわると、なまえがでるよ': 'Starry sky. Touch a star to see a name.', 'なまえのいちらん': 'List of names',
    'このばしょは、おとなのひとがなまえをえらんでのせています。': 'In this place, grown-ups choose their names to be listed.',
    // ---- やどや（10/4・ひろばの 宿屋）----
    'やどや': 'Inn', 'おちゃとしおり': 'Tea & bookmark', 'こげちゃいろのきとふかみどりのやねのやどや': 'An inn with dark brown wood and a deep green roof',
    'やどやでひとやすみ': 'A little rest at the inn', 'ランプのあかりがぽっとともったよ。なにをたのしむ？': 'The lamp has glowed on. What would you like to enjoy?',
    'おちゃ、まどべ、しおり。すきなものをえらんでね。': 'Tea, the window, a bookmark. Pick whatever you like.',
    '🍵おちゃをのむ': '🍵 Have some tea', '🪟まどべをながめる': '🪟 Look out the window', '📖しおりをめくる': '📖 Turn the bookmark',
    'おちゃをのむ': 'Have some tea', 'まどべをながめる': 'Look out the window', 'しおりをめくる': 'Turn the bookmark', 'ひろばへもどる': 'Back to the plaza',
    'おちゃのゆげがくるり。ゆげのかたちがさかなになったよ。': 'The tea steam curls up. It took the shape of a fish.',
    'カップのふちにちいさなほしもよう。ランプがゆれているよ。': 'There is a tiny star pattern on the rim of the cup. The lamp sways softly.',
    'あまいおちゃをひとくち。ほっぺがふわっとゆるんだ。': 'A sip of sweet tea. Your cheeks relax softly.',
    'まどからひろばをながめる。ふんすいのみずがきらり。': 'You look at the plaza from the window. The fountain water sparkles.',
    'はっぱがひとひら、かぜにのってとおりすぎたよ。': 'A single leaf rides the wind and floats by.',
    'ちいさなとりがやねのうえで、ちょんとおじぎした。': 'A little bird on the roof gives a tiny bow.',
    'まるふわがまどにほっぺをよせると、まるいあとがついた。': 'When Marufuwa rests a cheek on the window, it leaves a round mark.',
    'しおりには、ひろばでみつけたはっぱがはさんであった。': 'A leaf found in the plaza was tucked into the bookmark.',
    'ページのすみに「またここであおう」とちいさくかいてある。': 'In the corner of the page, someone wrote small: "Let us meet here again."',
    'だれかがおいていったはなびら。あかりにすかすと、ももいろだ。': 'A petal someone left behind. Held to the light, it is pink.',
    'やどやからひろばへもどったよ': 'Came back to the plaza from the inn', 'またおいでね': 'Come again!',
  };

  const pl = s => { const k = norm(s); return EX.get(k) || nmPal(s); };
  const place = s => ({ 'つりば': 'the fishing spot', 'まるふわのおへや': "Marufuwa's room", 'ありがとうのいし': 'the thank-you stone', 'ふんすい': 'the fountain' })[norm(s)] || pl(s);
  const GREET = { 'おはよう': 'Good morning', 'こんにちは': 'Hello', 'こんばんは': 'Good evening' };
  const rules = [
    // なかまの せりふ：「なまえ：「あいさつ！ せりふ」」と、ふきだしの 「あいさつ！ せりふ」
    [/^(.+?)：「(?:(おはよう|こんにちは|こんばんは)！)?(.+?)」$/, (_, who, g, line) => { const l = EX.get(norm(line)); if (l == null) return null; return `${pl(who)}: “${g ? GREET[g] + '! ' : ''}${l}”`; }],
    [/^(おはよう|こんにちは|こんばんは)！(.+)$/, (_, g, line) => { const l = EX.get(norm(line)); return l == null ? null : `${GREET[g]}! ${l}`; }],
    [/^(.+?)。きょうまだあっていないよ$/, (_, n) => `${pl(n)}. Not met yet today`],
    [/^(.+?)。きょうあったよ$/, (_, n) => `${pl(n)}. Met today`],
    [/^(.+?)（まだ）$/, (_, n) => `${pl(n)} (not yet)`],
    [/^さっきの(.+?)、おおきかったね！$/, (_, f) => `That ${nmFish(f)} from earlier was big!`],
    [/^さっき(.+?)がつれたんだね。よかったね$/, (_, f) => `You caught ${nmFish(f)} earlier, right? That's great.`],
    [/^(.+?)のところへいくよ$/, (_, w) => `Heading over to ${place(w)}.`],
    [/^(.+?)へあるいていくよ$/, (_, w) => `Walking to ${place(w)}.`],
    [/^(.+?)へいってきます！$/, (_, w) => `Off to ${place(w)}!`],
    [/^(.+?)へ…$/, (_, w) => `To ${place(w)}…`],
    [/^ちかくに(.+?)がいるよ。$/, (_, w) => `${w.split('と').map(pl).join(' and ')} ${w.includes('と') ? 'are' : 'is'} nearby.`],
    [/^(.+?)がちかくにいるよ$/, (_, w) => `${pl(w)} is nearby.`],
    [/^(.+?)はかえったよ。$/, (_, w) => `${pl(w)} went home.`],
    [/^(.+?)があそびにきたよ$/, (_, w) => `${pl(w)} came to visit.`],
    [/^(.+?)のまえ。スペースキーではいれるよ$/, (_, w) => `In front of ${place(w)}. Press Space to enter.`],
    [/^(あさ|ひる|ゆうがた|よる)になったよ$/, (_, t) => `It's now ${nmTime(t, true)}.`],
    [/^ひろばについたよ。いまは(.+?)。きょうは(.+?)。ともだちが(\d+)にんいるよ。$/, (_, t, w, n) => `Arrived at the plaza. It's ${nmTime(t, true) || t} now. Today: ${({ 'あめ': 'rain', 'はれ': 'sunny' })[w] || w}. ${n} friends are here.`],
    [/^(.+?)さん、ありがとう$/, (_, n) => `Thank you, ${EX.get(norm(n)) || n}`],
    [/^(\d+)がつにきてくれたよ$/, (_, m) => `Came in ${['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][+m] || m}`],
  ];
  // かんばん（SVG）は せまい ので みじかく
  const short = { 'つりば': 'Fishing', 'じゅんびちゅう': 'Getting ready…', 'おへや': 'Room', 'ありがとう': 'Thanks' };
  window.TsuriEn.add({ ex, rules, short });
})();
