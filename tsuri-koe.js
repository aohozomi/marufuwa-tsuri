// まるふわ びより：なかまの ひとこと（1にん 16ほんずつ・ばめんべつ）。ジョブズ1・2026-09-30（マスター直命：「ぼーっと おちつく ばしょに。せかせか させない。かぶりにくく」）
// きまり：①「ぼーっと」の ことば（そら・かぜ・みず・ねむい・おなか・ここちいい）②しつもん・めいれい・せかす ことば（はやく・まだ？）は 0 ③かぞえない・くらべない ④よみあげは しない（ふきだしだけ）⑤ひらがな・カタカナだけ（かんじ なし）
// ばめん：n＝ふだん／rain＝あめ／asa・hiru・yuu・yoru＝じかん／get＝つれた あと／wait＝ながく まって いる とき。おなじ ぶんは 20ぽん のあいだ（ぜんいんで きょうゆう）でにくい。English は ふきだしごとに もつ。
// なかま 15にん（PALS）＋街人 5にん（あとから ふえる）。ならびは かんけい ない（id で ひく）
window.TsuriKoe = {
  usagi: {
    n: [["ミントの かおりが する", "Smells like mint."], ["みみが ぽかぽか するよ", "My ears feel warm."], ["ぴょん って したい きぶん", "Feels like a little hop."], ["きょうは のんびり だね", "A slow, easy day."], ["ふわ〜 いい かぜ", "Mm, nice breeze."]],
    rain: [["あめの おと、すき", "I like the sound of rain."], ["みみが しっとり する", "My ears are getting damp."]],
    asa: [["あさの くうき、つめたい", "The morning air is cool."]], hiru: [["ひなたが ぽかぽか", "The sunny spot is warm."]], yuu: [["そらが ももいろ", "The sky is pink."]],
    yoru: [["おほしさま、ちらちら", "The stars are twinkling."], ["よるの かぜは しずか", "The night wind is quiet."]],
    get: [["わあ、すてき", "Oh, lovely."], ["ぴょん と うれしい", "I feel like hopping."]],
    wait: [["まつのも、いいね", "Waiting is nice too."], ["ぼーっと するの すき", "I like spacing out."]]
  },
  kawauso: {
    n: [["つるつるの いし、あった", "Found a smooth stone."], ["みずの なか、きらきら", "Sparkles in the water."], ["おなかに いし、のせよ", "A stone on my tummy."], ["ゆらゆら ういてる", "Just floating, swaying."], ["みずの おと、いい こえ", "The water has a nice voice."]],
    rain: [["あめつぶ、ぽつぽつ", "Raindrops, pit-pat."], ["ぬれるの、へいき", "Getting wet is fine."]],
    asa: [["あさの みず、ひんやり", "Morning water, so cool."]], hiru: [["みずが ぬるくて いい", "The water is nicely warm."]], yuu: [["なみが きんいろ", "The waves are golden."]],
    yoru: [["つきが みずに ゆれてる", "The moon sways on the water."], ["ねむく なって きた", "Getting sleepy."]],
    get: [["わあ、つやつや", "Wow, so shiny."], ["いい いろ、してる", "Lovely colors."]],
    wait: [["ぷかぷか まつよ", "Bobbing and waiting."], ["いし、ひろって まってる", "Picking stones while I wait."]]
  },
  hiyoko: {
    n: [["ぴよ、いい てんき", "Peep, nice weather."], ["レモンの かおり、ふわり", "A whiff of lemon."], ["はねが ぽかぽか", "My feathers are warm."], ["ちいさく ぴよぴよ", "Peep peep, softly."], ["ひなたぼっこ、しあわせ", "Sunbathing, so happy."]],
    rain: [["あめ、ぴよっと つめたい", "Rain, brr, peep."], ["ちいさい かさが ほしい", "A tiny umbrella would be nice."]],
    asa: [["ぴよ、あさの ひかり", "Peep, the morning light."]], hiru: [["おひさま、まぶしい", "The sun is bright."]], yuu: [["ゆうひ、レモン いろ", "The sunset is lemon-colored."]],
    yoru: [["ふわふわで ねむい", "Fluffy and sleepy."], ["よるは ぴよ、ちいさい こえ", "At night, a peep, small."]],
    get: [["ぴよ！ きらきら", "Peep! Sparkly."], ["いいこ、つれたね", "A good one."]],
    wait: [["まつのも たのしい ぴよ", "Waiting is fun too, peep."], ["うとうと して きた", "Getting drowsy."]]
  },
  ribbon: {
    n: [["リボンが かぜに ゆれる", "My ribbon sways in the wind."], ["リボン、むすびなおそ", "Time to retie my ribbon."], ["ひらひら、きもちいい", "Fluttering feels nice."], ["みずに うつる リボン", "My ribbon in the water."], ["のんびり、ふわふわ", "Slow and fluffy."]],
    rain: [["リボンが しっとり", "My ribbon is damp."], ["あめの ひは しずか", "Rainy days are quiet."]],
    asa: [["あさの ひかりが まぶしい", "The morning light is bright."]], hiru: [["ぽかぽか、いい きもち", "Warm, feels nice."]], yuu: [["そらが リボン いろ", "The sky is ribbon-colored."]],
    yoru: [["よるの リボンは ひかる", "Ribbons glow at night."], ["ほし みてたら ねむい", "Watching stars, so sleepy."]],
    get: [["まあ、きれい", "Oh, how pretty."], ["ひらひら して るね", "It flutters so nicely."]],
    wait: [["まつ じかんも すてき", "This waiting time is lovely."], ["ふぅ、ひとやすみ", "Ahh, a little rest."]]
  },
  panda: {
    n: [["ふわ〜、ねむたい", "Ahh, so sleepy."], ["ごろん って したい", "Feels like rolling over."], ["たけの におい、する", "I smell bamboo."], ["めが とろんと する", "My eyes are getting droopy."], ["ふわあ〜、あくび", "Yaaawn."]],
    rain: [["あめの おと、ねむく なる", "The rain makes me sleepy."], ["たけが ぬれて つやつや", "The bamboo is glossy with rain."]],
    asa: [["あさの くうき、おいしい", "The morning air tastes good."]], hiru: [["ひるね びより", "Perfect nap weather."]], yuu: [["ゆうやけ、ぽかぽか", "Sunset, all warm."]],
    yoru: [["ぐう…", "Zzz…"], ["おやすみ の じかん", "Bedtime."]],
    get: [["おお、つやつや", "Ooh, shiny."], ["ふわぁ、いいね", "Whoa, nice."]],
    wait: [["ぼやーっと して いたい", "I want to stay dazed."], ["うとうと… いいね", "Dozing off… nice."]]
  },
  kojika: {
    n: [["もりの かぜ、やさしい", "The forest wind is gentle."], ["きの はの おと、すき", "I like the sound of leaves."], ["あしもと、ふわふわ", "Soft ground underfoot."], ["ちいさな ひかりが ゆれる", "Little lights sway."], ["しずかな ところが すき", "I like quiet places."]],
    rain: [["あめの もりは いいにおい", "The forest smells good in the rain."], ["つゆが きらきら", "Dew sparkles."]],
    asa: [["あさつゆ、ひんやり", "Morning dew, so cool."]], hiru: [["こもれびが あたたかい", "Sunlight through leaves is warm."]], yuu: [["ゆうやけの もり、あかい", "The forest glows red."]],
    yoru: [["おほしさまが ちかい", "The stars feel close."], ["そらに ほしが ゆれてる", "The stars sway in the sky."]],
    get: [["まあ、ぴかぴか", "Oh, gleaming."], ["ほしみたいだね", "Like a star."]],
    wait: [["ゆっくり まつよ", "Waiting slowly."], ["きの かげで ひとやすみ", "Resting in the shade."]]
  },
  tanuki: {
    n: [["クローバーの におい", "Smells like clover."], ["はっぱが ゆらゆら", "Leaves swaying."], ["おなか ぽんぽん", "Pat pat, my belly."], ["ころころ ひなたぼっこ", "Rolling in the sunshine."], ["つちの におい、すき", "I like the smell of earth."]],
    rain: [["あめで はっぱが つやつや", "The leaves shine in the rain."], ["ぽんぽこ、しっとり", "Damp and cozy."]],
    asa: [["つゆの クローバー、きれい", "Dewy clover, pretty."]], hiru: [["ぽかぽか ひなた、いい", "Warm sunny spot, nice."]], yuu: [["かえりの みち、のんびり", "A slow walk home."]],
    yoru: [["よるの かぜ、すずしい", "The night breeze is cool."], ["おなか いっぱいで ねむい", "Full and sleepy."]],
    get: [["おっ、いいね", "Oh, nice."], ["ぽん！ と うれしい", "Pon! So happy."]],
    wait: [["のんびり、ぽんぽこ", "Slow and easy."], ["ぼーっと しよっと", "I will just space out."]]
  },
  risu: {
    n: [["どんぐり、ころころ", "Acorns, rolling."], ["チョコの あまい ゆめ", "A sweet chocolate dream."], ["ほっぺ ふくらむ きぶん", "Puffy cheeks feeling."], ["しっぽ ふわふわ", "Fluffy tail."], ["きの みの におい", "Smells like nuts."]],
    rain: [["あめの ひは あなで ごろん", "On rainy days, I curl up in my hole."], ["しっぽが しめって おもい", "My tail is wet and heavy."]],
    asa: [["あさの もり、しんと してる", "The morning forest is hushed."]], hiru: [["おひさま、ぽかぽか", "Sunshine, so warm."]], yuu: [["ゆうひで しっぽが おれんじ", "My tail is orange in the sunset."]],
    yoru: [["ほし みながら うとうと", "Dozing under the stars."], ["よるの もりは しずか", "The night forest is quiet."]],
    get: [["わあ、ぴかぴか", "Wow, sparkly."], ["ほっぺ まで うれしい", "Even my cheeks are happy."]],
    wait: [["まつのは へいき", "Waiting is fine."], ["ひとやすみ、ひとやすみ", "A little rest, a little rest."]]
  },
  neko: {
    n: [["にゃ〜、ひなた いい", "Meow, the sun is nice."], ["しっぽが ゆらゆら", "Tail swaying."], ["ごろごろ いってる", "Purring away."], ["ひげが かぜを かんじる", "My whiskers feel the wind."], ["のびを して いい きもち", "A good stretch."]],
    rain: [["あめは にがて でも すき", "I dislike rain, but I like it."], ["ふさふさ しっとり", "Fluffy and damp."]],
    asa: [["あさは あくびが でる", "Morning brings a yawn."]], hiru: [["ひなたを みつけた", "Found a sunny spot."]], yuu: [["ももいろの ゆうぐれ", "A peach-colored dusk."]],
    yoru: [["よるは めが きらきら", "My eyes sparkle at night."], ["まるく なって ねたい", "Want to curl up and sleep."]],
    get: [["にゃ〜、いいなあ", "Meow, nice."], ["ごろごろ、うれしい", "Purr, so glad."]],
    wait: [["じっと まつの、とくい", "I am good at waiting."], ["めを ほそめて ぼーっと", "Squinting, spacing out."]]
  },
  koinu: {
    n: [["はちみつの あまい かぜ", "A sweet honey breeze."], ["しっぽ ぱたぱた", "Tail wagging."], ["いい におい が する", "Something smells good."], ["おさんぽ してる きぶん", "Feels like a walk."], ["ぽかぽか ひなたで ごろん", "Lying in the warm sun."]],
    rain: [["あめの におい、わくわく", "The smell of rain, exciting."], ["ぬれても たのしい", "Getting wet is fun."]],
    asa: [["あさの さんぽ、すき", "I love morning walks."]], hiru: [["おひさま、まぶしい わん", "The sun is bright, woof."]], yuu: [["ゆうやけ、はちみついろ", "Sunset, honey-colored."]],
    yoru: [["よるは しずかで いい", "Quiet nights are nice."], ["ねむく なって きた わん", "Getting sleepy, woof."]],
    get: [["わん！ すてき", "Woof! Lovely."], ["しっぽが とまらない", "My tail will not stop."]],
    wait: [["いい こで まってる", "Waiting like a good pup."], ["ゆっくり おすわり", "Sitting nice and slow."]]
  },
  hamster: {
    n: [["いちごの あまい におい", "A sweet strawberry smell."], ["ほっぺに ひまわりの たね", "Sunflower seeds in my cheeks."], ["ちいさく まるく なる", "Curling up small and round."], ["ふかふかの わらが すき", "I like soft straw."], ["ほっぺ ぷくぷく", "Puffy cheeks."]],
    rain: [["あめの おとが ちいさい", "The rain sounds small."], ["おうちで ぬくぬくしたい", "Want to be snug at home."]],
    asa: [["めが さめて きた", "Waking up."]], hiru: [["おなか いっぱいで ぽかぽか", "Full and warm."]], yuu: [["ゆうやけが いちご いろ", "The sunset is strawberry-colored."]],
    yoru: [["よるは ちょこちょこ うごく", "At night I scurry a little."], ["すやすや したい", "Want to sleep soundly."]],
    get: [["わあ、まんまる", "Wow, so round."], ["ほっぺに いれたい くらい", "So cute I want to tuck it in my cheeks."]],
    wait: [["まつあいだ、もぐもぐ", "Munching while I wait."], ["ゆっくり ゆっくり", "Slowly, slowly."]]
  },
  hoho: {
    n: [["そばに いるの、いいね", "It is nice to be close."], ["みずの おと、おちつく", "The water sound is calming."], ["ゆっくり いきを する", "Breathing slowly."], ["ここは あたたかい", "It is warm here."], ["なにも しないの、いいね", "Doing nothing is nice."]],
    rain: [["あめの おと、ずっと きける", "I could listen to the rain forever."], ["しずかな あめ", "A quiet rain."]],
    asa: [["あさの ひかり、やさしい", "The morning light is gentle."]], hiru: [["ひなたで ぬくぬく", "Snug in the sun."]], yuu: [["ゆうぐれ、ほっと する", "Dusk, such a relief."]],
    yoru: [["よるは おちつく", "Nights are calming."], ["いっしょに ほしを みてる", "Watching stars together."]],
    get: [["よかったね", "I am glad for you."], ["そっと うれしい", "Quietly happy."]],
    wait: [["いつまでも まてる", "I can wait forever."], ["ゆったり、ゆったり", "Easy, easy."]]
  },
  azarashi: {
    n: [["うみの におい、すき", "I like the smell of the sea."], ["なみの おと、ざざーん", "The waves, swish swish."], ["おなかを だして ごろん", "Belly up, lying around."], ["つるつる、ぷかぷか", "Smooth and floating."], ["ひげが ふるふる", "Whiskers trembling."]],
    rain: [["あめ、うみと おなじ におい", "The rain smells like the sea."], ["ぬれるの、うれしい", "Getting wet is nice."]],
    asa: [["あさの うみは しずか", "The sea is quiet in the morning."]], hiru: [["ひなたに ごろん", "Lounging in the sun."]], yuu: [["ゆうひが さくら いろ", "The sunset is cherry-pink."]],
    yoru: [["よるの うみ、くろくて きれい", "The night sea is dark and pretty."], ["なみの おとで ねむい", "The waves make me sleepy."]],
    get: [["わあ、ぴちぴち", "Wow, lively."], ["うみの おくりもの みたい", "Like a gift from the sea."]],
    wait: [["なみに ゆられて まつ", "Waiting, rocked by the waves."], ["ぼーっと うみ みてる", "Gazing at the sea, spacing out."]]
  },
  alpaca: {
    n: [["けが かぜで ゆれてる", "My wool sways in the wind."], ["わたあめ みたいな くも", "Clouds like cotton candy."], ["もこもこ あったかい", "Fluffy and warm."], ["ふわぁ、ひろい そら", "Ahh, a wide sky."], ["くもが ゆっくり ながれる", "Clouds drift slowly."]],
    rain: [["けが しっとり おもい", "My wool is heavy and damp."], ["あめの ひは ぼーっと できる", "A rainy day is good for spacing out."]],
    asa: [["あさの かぜ、ひんやり", "A cool morning breeze."]], hiru: [["おひさまで けが ぽかぽか", "The sun warms my wool."]], yuu: [["ゆうやけ、わたあめ いろ", "Sunset, cotton-candy colors."]],
    yoru: [["ほしが わたあめに みえる", "The stars look like cotton candy."], ["もこもこで ねむい", "Fluffy and sleepy."]],
    get: [["わあ、ふわふわ", "Wow, fluffy."], ["いいこと あったね", "Something nice happened."]],
    wait: [["ふわ〜っと まってる", "Waiting, all fluffy."], ["くもを ながめてる", "Watching the clouds."]]
  },
  gantai: {
    n: [["ほしの ことを かんがえてる", "Thinking about the stars."], ["しずかな ひが すき", "I like quiet days."], ["めの まわりが あったかい", "Around my eye is warm."], ["そらは ずっと ひろいね", "The sky is always wide."], ["ゆっくり いきを すう", "Breathing in slowly."]],
    rain: [["あめの むこうに ほしが ある", "Beyond the rain are the stars."], ["しずかな あめの おと", "The quiet sound of rain."]],
    asa: [["あさの ひかりで ほしが ねむる", "The stars sleep in the morning light."]], hiru: [["ひるの ほしは みえない でも いる", "Daytime stars are unseen but there."]], yuu: [["ゆうぐれ、ほしが おきる まえ", "Dusk, before the stars wake."]],
    yoru: [["ほしが ゆっくり めぐる", "The stars slowly turn."], ["ほしが みえる、ここち いい", "I see the stars, so comfortable."]],
    get: [["いい ひかり してる", "Nice glow."], ["しずかに うれしい", "Quietly happy."]],
    wait: [["ぼんやり そらを みてる", "Gazing vaguely at the sky."], ["まつのは きらいじゃない", "I do not mind waiting."]]
  },
  shirotama: {
    n: [["じっと たって いるのが すき", "I like standing perfectly still."], ["くちばしが すこし おもい", "My bill is a little heavy."], ["ゆっくり まばたき する", "Blinking slowly."], ["みずの おもてを ながめる", "Gazing at the water surface."], ["あしが みずに つかってる", "My feet are in the water."]],
    rain: [["あめの なかでも しずか", "Quiet even in the rain."], ["はねが しっとり する", "My feathers are getting damp."]],
    asa: [["あさもやの なかに たつ", "Standing in the morning mist."]], hiru: [["ひなたで じっと して いる", "Staying still in the sun."]], yuu: [["ゆうやけが みずに うつる", "The sunset reflects on the water."]],
    yoru: [["よるも じっと たって いる", "Standing still at night too."], ["つきの ひかりが くちばしに", "Moonlight on my bill."]],
    get: [["ほう…、いいね", "Hoo… nice."], ["しずかに かんしん して いる", "Quietly impressed."]],
    wait: [["いつまでも たって いられる", "I can stand here forever."], ["うごかず ぼーっと", "Staying put, spacing out."]]
  },
  natsume: {
    n: [["なつめの みが あまい", "Dates are sweet."], ["ゆっくり あるくのが すき", "I like walking slowly."], ["すなの おと、さらさら", "The sand whispers."], ["こぶの うえは あったかい", "It is warm up on my hump."], ["みずは ゆっくり のむよ", "I drink water slowly."]],
    rain: [["あめの おと、ふしぎ", "Rain sounds so strange."], ["すなが しっとり する", "The sand is damp."]],
    asa: [["あさの すなは ひんやり", "Morning sand is cool."]], hiru: [["ひるは ひかげで のんびり", "Noon, lazing in the shade."]], yuu: [["ゆうひで すなが きんいろ", "The sand is gold at sunset."]],
    yoru: [["よるの さばくは しずか", "The desert is quiet at night."], ["ほしが とおくに みえる", "The stars look far and wide."]],
    get: [["おお、りっぱ", "Oh, splendid."], ["ゆっくり うなずく", "A slow nod."]],
    wait: [["いそがない いそがない", "No rush, no rush."], ["こぶで うとうと", "Dozing on my hump."]]
  },
  koron: {
    n: [["まるく なると おちつく", "Curling into a ball is calming."], ["ころん、ころん", "Roll, roll."], ["かたい こうらが あったかい", "My shell is warm."], ["つちを ほるのが すき", "I like digging."], ["ちいさく なって ぼーっと", "Small and spaced out."]],
    rain: [["こうらに あめが ぽとぽと", "Rain drips on my shell."], ["あめの ひは まるく なる", "On rainy days I curl up."]],
    asa: [["あさの つち、ふかふか", "The morning soil is soft."]], hiru: [["ひなたで こうらが ぽかぽか", "My shell is warm in the sun."]], yuu: [["ゆうやけ、ころんと ながめる", "Watching the sunset, curled."]],
    yoru: [["まるく なって ねる じかん", "Time to curl up and sleep."], ["つきが こうらに うつる", "The moon reflects on my shell."]],
    get: [["わあ、ころんと かわいい", "Wow, so cute and round."], ["こうらが きらっと した", "My shell gleamed."]],
    wait: [["ころんと まってる", "Waiting, all curled."], ["ぼーっと まるまる", "Curling up, spacing out."]]
  },
  temari: {
    n: [["ふわふわの けが すき", "I like my fluffy fur."], ["すなあび の じかん", "Time for a dust bath."], ["まんまるに なって ぼーっと", "Round and spaced out."], ["てまりの ように ころころ", "Rolling like a ball."], ["かぜが けに ふれる", "The wind touches my fur."]],
    rain: [["けが しめると こまる", "Damp fur is trouble."], ["あめの おとを きいてる", "Listening to the rain."]],
    asa: [["あさの ひかりが けに とおる", "Morning light shines through my fur."]], hiru: [["ふかふか ひなた", "A soft sunny spot."]], yuu: [["ゆうやけで けが ももいろ", "My fur is pink in the sunset."]],
    yoru: [["よるは めが ぱっちり", "My eyes are wide at night."], ["ちいさな こえで ちゅう", "A small squeak."]],
    get: [["ふわっと うれしい", "Softly happy."], ["かわいい いろ", "Cute colors."]],
    wait: [["ふわふわ まってる", "Waiting, all fluffy."], ["ゆらゆら ゆれてる", "Swaying gently."]]
  },
  azuki: {
    n: [["みずの なか、しずか", "It is quiet underwater."], ["くちばしで みずを さわる", "Touching the water with my bill."], ["あずきいろの すいめん", "The water is azuki-colored."], ["およぐの、すき", "I love swimming."], ["かわの おと、ちいさい", "The river makes tiny sounds."]],
    rain: [["あめが みずに ぽつぽつ", "Rain dots the water."], ["あめの ひは すいちゅうが しずか", "Underwater is quiet in the rain."]],
    asa: [["あさの かわ、ゆげが でる", "The morning river steams."]], hiru: [["ひかりが みずの なかに とどく", "Light reaches underwater."]], yuu: [["ゆうひで かわが あかい", "The river is red at sunset."]],
    yoru: [["よるの みず、つめたくて いい", "The night water is nicely cold."], ["つきが かわに おちてる", "The moon has fallen in the river."]],
    get: [["みずみたいに きれい", "Pretty as water."], ["いい かんじ だね", "That looks good."]],
    wait: [["ぷかぷか ゆっくり", "Bobbing, slowly."], ["みずの おとを ききながら", "Listening to the water."]]
  },
  komugi: {
    n: [["かぜに のって ふわり", "Riding the wind, whoosh."], ["こむぎ いろの ひざし", "Wheat-colored sunlight."], ["きから きへ すーっと", "From tree to tree, swoosh."], ["ふわふわ ういてる きぶん", "Feels like floating."], ["はっぱの うえで ごろん", "Lying on a leaf."]],
    rain: [["あめの ひは きの うろで ぬくぬく", "Snug in a tree hollow on rainy days."], ["しずくが ぽとん", "A drop plops."]],
    asa: [["あさひが はっぱに きらきら", "Morning sun sparkles on the leaves."]], hiru: [["こもれびで うとうと", "Dozing in dappled sunlight."]], yuu: [["ゆうやけの そらを とびたい", "Want to glide across the sunset sky."]],
    yoru: [["よるは とぶ じかん", "Night is glide time."], ["つきの ひかりで ふわり", "Floating in the moonlight."]],
    get: [["わあ、ふわり と うれしい", "Wow, floating with joy."], ["かぜみたいに かるい", "Light as the wind."]],
    wait: [["かぜを かんじて まつ", "Waiting, feeling the breeze."], ["はっぱの うえで ひとやすみ", "A rest on a leaf."]]
  }
};
