/* まるふわ つりびより：きょうの ラッキーさかな・ぬし・まぼろしの ひ（日づけだけで きまる）。本体と ひろばが おなじ ファイルを つかう ので、いつも 一致する
   ・サーバー なし・保存 なし・通信 なし。たんまつの 日づけが ずれても エラーには ならない（ずれた 日づけの 値が でる だけ）
   ・つかいかた：TsuriDaily.lucky(base)＝ラッキーさかなの ばんごう（0〜base-1。base は ずかんの しゅるい＝30）／TsuriDaily.boss()＝{area:'L|R|H|B', time:'a|h|y|n'}／TsuriDaily.myth()＝きょうは まぼろしの ひ か
     どれも 引数の date（Date）を 省くと いまの 日づけ
   ・ひろばは ぬしの「ばしょ・じかん」を さきに いわない（釣りの たのしみを うばわない）。ひろばが つかうのは lucky() だけ。boss() は 本体だけ
   ・ここを かえる ときは、本体の index.html の 同じ しきの ひかえ（DAILY_FALLBACK）も おなじに する */
(() => {
  'use strict';
  if (window.TsuriDaily) return;
  const valid = date => (date instanceof Date && !isNaN(date) ? date : new Date());
  const day = date => { const t = valid(date); return t.getFullYear() * 372 + t.getMonth() * 31 + t.getDate(); };
  window.TsuriDaily = {
    v: 1,
    day,
    lucky: (base, date) => (day(date) * 11) % (base > 0 ? base : 30),
    boss: date => { const h = Math.imul(day(date), 2654435761) >>> 0; return {area: 'LRHB'[h % 4], time: 'ahyn'[(h >>> 8) % 4]}; },
    myth: date => { const t = valid(date); return t.getDate() === (t.getFullYear() * 12 + t.getMonth()) * 5 % 27 + 1; }
  };
})();
