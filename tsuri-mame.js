// まるふわ つりびより：さかなの「まめちしき」30こ（外付け・共有ファイル）。あんないの ペンギンが ひろばで 言う。本体の 釣れた カードでも つかえる（つり9）。
//   ・魚の 番号（0〜29）ごとに 1こ。まちがいを 教えない ように、たしかな 事だけ（あじの ぜいご・ふぐの ふくらみ・たこの しんぞう 3つ・かれいの め・いかの 青い ち など）。
//   ・ぜんぶ ひらがな（漢字なし）。数字は 3 と 350 だけ。English も ついて いる。
//   ・使い方：TsuriMame.ja(番号)＝日本語の 文（「まめちしき。」から はじまる）／TsuriMame.en(番号)＝English／TsuriMame.lines＝全部（配列）。
//   ・魚の 名前の 絵と ならびは 本体の FISH（0〜29）と おなじ。31ばん いこうは ありません（null を かえす）。
(function () {
  'use strict';
  var L = [
    ['あじの しっぽの ちかくには、かたい ぎざぎざの うろこが あるんだって', 'Horse mackerel have hard, jagged scales near the tail.'],
    ['ふぐは、おこると みずを のみこんで、おなかを ぷくっと ふくらませるんだって', 'When a pufferfish gets upset, it swallows water and puffs up its belly.'],
    ['たいは「めでたい」と ことばが にているから、おいわいの ごちそうに よく なるよ', '“Tai” (sea bream) sounds like “medetai,” which means joyful, so it is often served at celebrations.'],
    ['いわしは、たくさんで むれに なって、いっしょに およぐんだって', 'Sardines swim together in a big school.'],
    ['かれいは、うまれた ときは ふつうの さかなの かたち。そだつと めが かたほうに よるんだって', 'A flounder is born looking like an ordinary fish. As it grows, both eyes move to one side.'],
    ['えびは、しっぽを ぱたんと して、うしろへ ぴょんと にげられるんだって', 'A shrimp can flick its tail and hop backward to escape.'],
    ['くらげの からだは、ほとんどが みずで できているんだって', 'A jellyfish’s body is mostly water.'],
    ['かには、よこに あるくのが とくいなんだって', 'Crabs are good at walking sideways.'],
    ['きんぎょは、フナという さかなを もとに、ひとが そだてて できたんだって', 'Goldfish were bred by people from a fish called the crucian carp.'],
    ['いかの ちは、あおい いろを しているんだって', 'A squid’s blood is blue.'],
    ['たこは、しんぞうが 3つ あるんだって', 'An octopus has three hearts.'],
    ['べらの なかまには、ほかの さかなの からだを そうじして あげる こが いるんだって', 'Some wrasses clean the bodies of other fish.'],
    ['はるの たいは「さくらだい」と よばれるんだって', 'Sea bream caught in spring are called “sakura-dai,” cherry blossom sea bream.'],
    ['さばは、ずっと およぎ つづける さかななんだって', 'Mackerel keep swimming all the time.'],
    ['あなごは、ひるは すなの なかや いわの すきまに かくれて、よるに ごはんを さがすんだって', 'Conger eels hide in the sand or between rocks by day, and look for food at night.'],
    ['ひらめは、すなの いろに あわせて、からだの いろを かえられるんだって', 'A flatfish can change its body color to match the sand.'],
    ['ますの なかまには、かわで うまれて うみで そだち、また かわへ もどる こが いるんだって', 'Some kinds of trout and salmon are born in rivers, grow up in the sea, and return to the river.'],
    ['はりせんぼんの はりは、せんぼん ではなく 350ほん くらいなんだって', 'A porcupinefish has about 350 spines, not a thousand.'],
    ['かめの こうらは、ほねが かたく つながって できているんだって', 'A turtle’s shell is made of bones joined together.'],
    ['いるかは、ねむる とき、のうを かたほうずつ やすませるんだって', 'When dolphins sleep, they rest one half of their brain at a time.'],
    ['まんぼうは、いちどに ものすごく たくさんの たまごを うむんだって', 'An ocean sunfish lays a huge number of eggs at one time.'],
    ['えいの からだは、かたい ほねじゃなくて、やわらかい ほね（なんこつ）で できているんだって', 'A ray has a soft skeleton made of cartilage instead of hard bone.'],
    ['たちうおは、あたまを うえに して、たって およぐ ことが あるんだって', 'A cutlassfish sometimes swims standing upright, head up.'],
    ['さかなは、えらで みずの なかの さんそを とりこんで いきを するんだって', 'Fish take oxygen from the water with their gills.'],
    ['さかなの うろこには、きの ねんりんのような しまが あって、ねんれいの てがかりに なるんだって', 'Fish scales have rings like tree rings, which hint at the fish’s age.'],
    ['さかなの よこに ある せんは「よこせん」。みずの ながれを かんじる ところなんだって', 'The line along a fish’s side is the “lateral line.” It senses the flow of water.'],
    ['さかなには みみたぶは ないけど、からだの なかに みみが あって、おとを きいているんだって', 'Fish have no ear flaps, but they have ears inside their bodies and can hear sounds.'],
    ['うみの ふかい ところには、じぶんで ひかる さかなが いるんだって', 'Some fish in the deep sea make their own light.'],
    ['こいは、なんじゅうねんも いきる ことが あるんだって', 'A koi can live for decades.'],
    ['くじらは、さかなじゃなくて、あかちゃんに おっぱいを あげる なかまなんだって', 'Whales are not fish. Like us, they feed their babies milk.']
  ].map(function (p) { return { ja: 'まめちしき。' + p[0], en: 'Fun fact: ' + p[1] }; });
  function pick(id) { return Number.isInteger(id) && id >= 0 && id < L.length ? L[id] : null; }
  window.TsuriMame = {
    version: 1, count: L.length,
    ja: function (id) { var l = pick(id); return l ? l.ja : null; },
    en: function (id) { var l = pick(id); return l ? l.en : null; },
    lines: L.map(function (l) { return { ja: l.ja, en: l.en }; })
  };
})();
