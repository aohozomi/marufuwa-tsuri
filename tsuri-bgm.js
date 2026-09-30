/* まるふわ つりびより：BGM（しずかな・おだやかな 曲。外付け・ゲーム開発司令部）
   ・曲は ファイルでは なく、ブラウザの 中で 音を つくる（サイン波が 中心。メロディは ドレミソラだけ／和音は ハ長調の 白い 鍵ばんだけ）。ダウンロードも 通信も ない。
   ・「キンキン」しない きまり（9/30 夜・マスター「穏やかな、静かな、流れるような メロディー」「高い音は いらん。落ち着く音は 低い音。波の音と、流れるような メロディーだけで いい」）：曲は「ひくい 旋律 1本」と「下で 支える ひくい 和音」だけ／旋律は G3〜G4（ミディ55〜67）・和音は F2〜A3／星・あわ・ベル・オルゴール ふうの 短い 金属音は 無し／アタックは 旋律 0.18びょう以上・和音 1.1びょう以上／ピッチは しゃくらない／音色は やわらかい 三角波（ローパス 1000Hz・和音は 700Hz）／こだまの ローパスは 1600Hz。いちばん 高い 音は G5（79）を こえない（TOP_MIDI）。
   ・じかんたいの 曲（10/1 マスター「夜は夜の音楽、昼間は昼間、朝は朝。何種類か あればいい。そんな いっぱいじゃ なくても」）：
       a＝あさ／h＝ひる／y＝ゆうがた／n＝よる の 4つ。どれも 2つの 曲（a1 a2・h1 h2・y1 y2・n1 n2）が つづけて ながれ、おわると また はじめから（つなぎ目なし）。ぜんぶで 8曲。
       ばしょでは なく「いまの じかん」で きまる（ひろば・ながめる＝そのときの じかん／おへや＝おへやの じかん。ランプを けして 星空に すると よるの 曲）。おへやは 2つめの 曲から はじまる（ひろばと ちがう 曲から）。
       むかしの 3曲は そのまま つかった：a1＝ひろば（あさの さんぽ・70）／h1＝すいそう（ゆっくりの 旋律）／n1＝ほしぞら（いちばん ゆっくり）。9/30 夜に 旋律 1本＋ひくい 和音だけへ 作りなおした。
   ・鳴る 条件：その ばしょの「おと」が ON かつ「BGM」が ON（はじめは OFF）。釣りの 画面では 鳴らさない（ひろば・おへや・ながめる だけ）。
     「おと」の せっていは そのまま 親スイッチ（おとを けせば BGMも きえる）。「うごきを へらす」では 止めない（おとは 動きとは べつの せってい）。
     画面が かくれた 時は 止める。「みみで ながめる」の 間は 鳴らさない（魚の なまえの おとを じゃましない）。
   ・ばしょが かわる と、ふわっと つなぐ（3びょうの クロスフェード）。
   ・記録は localStorage['marufuwa-bgm-v1'] = {v:1, on:boolean} だけ。本体の「おと」は 読むだけ（書かない）。
   ・AudioContext は、その ばしょが もっている ものを かりる（ctx を わたす）。かりる ものが 無ければ 自分で 作る。
     「おと」が OFF か「BGM」が OFF の 間は、AudioContext を 作らない・かりない。ゆびで さわる まえにも 作らない。
   ・使い方（ばしょ ＝ 'hiroba' | 'tank' | 'gaze'）：
       TsuriBgm.enter('hiroba', { ctx: () => AudioContext, sound: () => boolean, time: () => 'a|h|y|n', starry: () => boolean, mute: () => boolean })
       TsuriBgm.leave('hiroba')
       TsuriBgm.button({ id, className, sound, enableSound, onToggle })  → 「BGM：ON/OFF」ボタン（かってに 状態を そろえる）
       TsuriBgm.set(true|false) / .on() / .refresh() / .subscribe(fn) / .state()                                         */
(() => {
  'use strict';
  if (window.TsuriBgm) return;
  const KEY = 'marufuwa-bgm-v1', MAIN = 'marufuwa-tsuri-v1';
  // 大きさ：3曲とも「K重みの LUFS」で −35 に そろえた（なおす 前は −32。本体の「なみ」は おなじ 測りかたで −28 なので、BGM は なみより 7 デシベル 小さい）。
  //   測りかた＝_qa の bgm_probe.js（OfflineAudioContext で 書き出し・K重みの 近似）。耳で 見る 時だけ ?bgmvol=0.5〜2 で 動かせる。
  //   曲ごとの 大きさ PART_TRIM は 書き出して 測って きめる（_qa の bgm_probe.js）。TRIM＝じかんたいの さいしょの 曲の 大きさ（ノードに かける）・2つめの 曲は 音符の gain に PART_TRIM／TRIM を かける。
  const VOLUME = .65, PART_TRIM = { a1: .291, a2: .288, h1: .274, h2: .285, y1: .285, y2: .298, n1: .296, n2: .322 };
  const TRIM = { a: PART_TRIM.a1, h: PART_TRIM.h1, y: PART_TRIM.y1, n: PART_TRIM.n1 };
  const boost = (() => { try { const v = Number(new URLSearchParams(location.search).get('bgmvol')); return v > 0 ? Math.min(2, v) : 1; } catch { return 1; } })();
  const readJSON = k => { try { const d = JSON.parse(localStorage.getItem(k)); return d && typeof d === 'object' ? d : null; } catch { return null; } };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const val = v => typeof v === 'function' ? v() : v;
  const isEn = () => !!(window.TsuriEn && window.TsuriEn.lang === 'en');   // English mode（tsuri-en.js）の 時は「BGM: ON」（半角の コロン）
  // やさしさの きまり（ぜんぶの 曲・声に かかる。耳に 痛い「キンキン」を 作らない ための 土台）
  //   ・いちばん 高い 音符は G5（ミディ 79）まで（いまの 曲は G4＝67 まで）。アタックは 0.03びょう より みじかく しない（曲の 音は 旋律 0.18〜／和音 1.1〜）。ピッチを しゃくる（bend）は しない。
  //   ・どの 声も ローパス 1800Hz より うえは ぼかす。ゆるい こだま（空気）の ローパスは 1600Hz。
  const TOP_MIDI = 79, MIN_ATTACK = .03, LP = 1800, AIR_LP = 1600;

  // ── 曲：1周ぶんの 音の 一覧 [はじまり(びょう), ながさ(びょう), 音（ミディ）, 音色] と、1周の ながさ ──
  // 曲は「ひくい 旋律 1本」と「下で 支える ひくい 和音」だけ（マスター直・9/30 夜「高い音は いらん。落ち着く音は 低い音。波の音と、流れるような メロディーだけで いい」）。
  //   高い 星・あわ・ベル・きらきらの アルペジオ・オルゴール ふうの 短い 金属音は ぜんぶ 無し。旋律は G3〜G4（ミディ 55〜67）、和音は F2〜A3（41〜57）。
  //   音色の role は 検査が 見分ける ための しるし（mel＝旋律／pad＝和音）。
  const MEL = (gain, a, r) => ({ role: 'mel', type: 'triangle', gain, a, r, hold: true, lp: 1000 });   // やわらかい 三角波（ローパス 1000Hz）・ゆっくり 立ちあがり ふわっと きえる
  const PAD = (gain, a, r, pan) => ({ role: 'pad', type: 'triangle', gain, a, r, hold: true, lp: 700, pan });
  const PADS = { C: [43, 48, 52, 55], Am: [45, 48, 52, 57], F: [41, 45, 48, 53], G: [43, 47, 50, 55], Dm: [45, 50, 53, 57] };   // 和音は ぜんぶ 白い 鍵ばん（ド レ ミ ファ ソ ラ）だけ
  function barPart(bpm, chords, mel, p) {   // 1小節＝4拍の 曲。mel＝[小節, 拍, 音, 長さ（拍）]・和音は 1小節に 1つ
    const ev = [], beat = 60 / bpm, bar = beat * 4;
    chords.forEach((c, b) => PADS[c].forEach((m, j) => ev.push([b * bar, bar, m, PAD(.034, p.pa, p.pr, (j - 1.5) * .22)])));
    mel.forEach(([b, s, m, len]) => ev.push([b * bar + s * beat, len * beat * .97, m, MEL(.13, p.ma, p.mr)]));
    return { len: bar * chords.length, ev };
  }
  function trackA() {   // ひろば（あさの さんぽ）70。ゆっくり 流れる 旋律＋ひくい 和音
    const ev = [], beat = 60 / 70, bar = beat * 4, add = (t, d, m, o) => ev.push([t, d, m, o]);
    const chords = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'Am', 'G', 'C'];
    // 旋律：2小節ずつ ふくらんで しずむ なだらかな 上下。跳びは 4度まで（ドレミソラ だけ）。[小節, 拍, 音, 長さ（拍）]
    const mel = [
      [0, 0, 64, 2], [0, 2, 62, 1], [0, 3, 60, 1], [1, 0, 57, 2], [1, 2, 60, 1], [1, 3, 62, 1],
      [2, 0, 64, 3], [2, 3, 62, 1], [3, 0, 62, 4],
      [4, 0, 64, 1], [4, 1, 67, 3], [5, 0, 64, 2], [5, 2, 62, 1], [5, 3, 60, 1], [6, 0, 57, 2], [6, 2, 60, 2], [7, 0, 62, 3],
      [8, 0, 57, 2], [8, 2, 60, 2], [9, 0, 64, 2], [9, 2, 60, 2], [10, 0, 57, 2], [10, 2, 60, 1], [10, 3, 62, 1], [11, 0, 64, 2], [11, 2, 62, 2],
      [12, 0, 67, 2], [12, 2, 64, 2], [13, 0, 62, 2], [13, 2, 60, 2], [14, 0, 57, 2], [14, 2, 62, 2], [15, 0, 60, 4]];
    chords.forEach((c, b) => PADS[c].forEach((m, j) => add(b * bar, bar, m, PAD(.034, 1.1, 1.9, (j - 1.5) * .22))));
    mel.forEach(([b, s, m, len]) => add(b * bar + s * beat, len * beat * .97, m, MEL(.13, .18, 1.2)));
    return { len: bar * 16, ev };
  }
  function trackB() {   // すいそう。ゆっくり 流れる 旋律（ひろばより ゆっくり）＋ひくい 和音
    const ev = [], bar = 4, add = (t, d, m, o) => ev.push([t, d, m, o]);
    ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'C'].forEach((c, i) => PADS[c].forEach((m, j) => add(i * 8, 7.2, m, PAD(.034, 2.2, 2.6, (j - 1.5) * .22))));
    // 旋律：[小節, びょう, 音, 長さ（びょう）]。1小節＝4びょう。ドレミソラ だけ・跳びは 5度まで
    const mel = [
      [0, 0, 60, 3], [0, 3, 64, 1], [1, 0, 67, 2], [1, 2, 64, 2], [2, 0, 64, 2], [2, 2, 62, 2], [3, 0, 60, 3], [3, 3, 57, 1],
      [4, 0, 57, 2], [4, 2, 60, 2], [5, 0, 62, 3], [5, 3, 60, 1], [6, 0, 62, 2], [6, 2, 60, 2], [7, 0, 55, 4],
      [8, 0, 60, 2], [8, 2, 64, 2], [9, 0, 67, 3], [9, 3, 64, 1], [10, 0, 64, 2], [10, 2, 60, 2], [11, 0, 57, 3], [11, 3, 60, 1],
      [12, 0, 62, 2], [12, 2, 60, 2], [13, 0, 57, 2], [13, 2, 60, 2], [14, 0, 64, 2], [14, 2, 62, 2], [15, 0, 60, 4]];
    mel.forEach(([b, s, m, len]) => add(b * bar + s, len * .98, m, MEL(.13, .25, 1.4)));
    return { len: 64, ev };
  }
  function trackC() {   // ほしぞら（よるの へや）。いちばん ゆっくりの 旋律（ひとつが 4〜5びょう）＋ひくい 和音
    const ev = [], add = (t, d, m, o) => ev.push([t, d, m, o]);
    [['C', 0], ['Am', 15], ['F', 30], ['G', 45]].forEach(([c, t0]) => PADS[c].forEach((m, j) => add(t0, 15, m, PAD(.036, 4, 4, (j - 1.5) * .25))));
    // 旋律：[はじまり(びょう), ながさ(びょう), 音]
    [[1, 5, 64], [6.5, 4, 62], [11, 4.5, 60], [16, 5, 57], [21.5, 4, 60], [26, 4.5, 64], [31, 5, 62], [36.5, 4, 60], [41, 4, 57], [46, 5, 55], [51.5, 4, 62], [56, 3.5, 60]].forEach(([t, d, m]) => add(t, d, m, MEL(.13, .4, 1.6)));
    return { len: 60, ev };
  }
  // ─ あたらしい 5曲（旋律は ドレミソラ だけ・G3〜G4・和音は 白い 鍵ばんだけ。むかしの 曲と おなじ きまり）─
  //   あさ 2：72BPM。ひかりが さしこむ ような ゆるやかな のぼり（ド→ミ→ソ）
  const trackA2 = () => barPart(72, ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'C'], [
    [0, 0, 60, 2], [0, 2, 64, 2], [1, 0, 62, 3], [1, 3, 60, 1], [2, 0, 57, 2], [2, 2, 60, 2], [3, 0, 60, 3], [3, 3, 57, 1],
    [4, 0, 64, 2], [4, 2, 67, 2], [5, 0, 62, 2], [5, 2, 64, 2], [6, 0, 60, 3], [6, 3, 62, 1], [7, 0, 64, 4],
    [8, 0, 60, 2], [8, 2, 57, 2], [9, 0, 60, 2], [9, 2, 64, 2], [10, 0, 64, 3], [10, 3, 62, 1], [11, 0, 62, 4],
    [12, 0, 60, 2], [12, 2, 62, 2], [13, 0, 62, 2], [13, 2, 64, 2], [14, 0, 57, 2], [14, 2, 60, 2], [15, 0, 60, 4]], { pa: 1.2, pr: 1.9, ma: .2, mr: 1.2 });
  //   ひる 2：76BPM。ひなたぼっこ。ちいさな はずみの ある 旋律（1拍の 音が まじる）
  const trackH2 = () => barPart(76, ['F', 'C', 'G', 'Am', 'F', 'C', 'G', 'C', 'Am', 'G', 'F', 'C', 'F', 'G', 'C', 'C'], [
    [0, 0, 60, 1], [0, 1, 62, 1], [0, 2, 64, 2], [1, 0, 62, 1], [1, 1, 60, 1], [1, 2, 64, 2], [2, 0, 62, 2], [2, 2, 67, 2], [3, 0, 64, 2], [3, 2, 60, 2],
    [4, 0, 60, 1], [4, 1, 62, 1], [4, 2, 64, 2], [5, 0, 64, 1], [5, 1, 62, 1], [5, 2, 60, 2], [6, 0, 62, 3], [6, 3, 64, 1], [7, 0, 64, 4],
    [8, 0, 64, 2], [8, 2, 60, 2], [9, 0, 62, 2], [9, 2, 67, 2], [10, 0, 60, 2], [10, 2, 62, 2], [11, 0, 60, 4],
    [12, 0, 60, 1], [12, 1, 62, 1], [12, 2, 64, 2], [13, 0, 62, 2], [13, 2, 64, 2], [14, 0, 64, 1], [14, 1, 62, 1], [14, 2, 60, 2], [15, 0, 60, 4]], { pa: 1.1, pr: 1.9, ma: .2, mr: 1.2 });
  //   ゆうがた 1・2：56 と 52BPM。ゆうやけ。あたたかい ラ（イ短調）から、しずかに くだって おちつく
  const trackY1 = () => barPart(56, ['Am', 'F', 'C', 'G', 'Am', 'Dm', 'F', 'G', 'Am', 'F', 'C', 'C'], [
    [0, 0, 64, 3], [0, 3, 62, 1], [1, 0, 60, 2], [1, 2, 57, 2], [2, 0, 60, 2], [2, 2, 64, 2], [3, 0, 62, 3], [3, 3, 60, 1], [4, 0, 57, 4],
    [5, 0, 60, 2], [5, 2, 62, 2], [6, 0, 60, 2], [6, 2, 57, 2], [7, 0, 62, 2], [7, 2, 60, 2], [8, 0, 64, 3], [8, 3, 62, 1],
    [9, 0, 60, 2], [9, 2, 57, 2], [10, 0, 55, 2], [10, 2, 60, 2], [11, 0, 60, 4]], { pa: 2, pr: 2.4, ma: .3, mr: 1.5 });
  const trackY2 = () => barPart(52, ['Dm', 'Am', 'F', 'C', 'Dm', 'Am', 'G', 'C', 'F', 'G', 'Am', 'C'], [
    [0, 0, 62, 2], [0, 2, 64, 2], [1, 0, 60, 3], [1, 3, 57, 1], [2, 0, 60, 2], [2, 2, 64, 2], [3, 0, 64, 4], [4, 0, 62, 2], [4, 2, 60, 2],
    [5, 0, 57, 2], [5, 2, 60, 2], [6, 0, 62, 3], [6, 3, 60, 1], [7, 0, 60, 4], [8, 0, 60, 2], [8, 2, 64, 2],
    [9, 0, 62, 2], [9, 2, 60, 2], [10, 0, 57, 3], [10, 3, 60, 1], [11, 0, 60, 4]], { pa: 2, pr: 2.4, ma: .3, mr: 1.5 });
  //   よる 2：ほしの ねむり。1つの 音が 4〜5びょう・和音は 16びょうずつ（よる 1 より ひくく・すくなく）
  function trackN2() {
    const ev = [], add = (t, d, m, o) => ev.push([t, d, m, o]);
    [['Am', 0], ['F', 16], ['C', 32], ['G', 48]].forEach(([c, t0]) => PADS[c].forEach((m, j) => add(t0, 16, m, PAD(.036, 4, 4, (j - 1.5) * .25))));
    [[1.5, 5, 60], [7.5, 4.5, 62], [13, 5, 64], [19, 5, 60], [25, 4.5, 57], [31, 5, 60], [37, 4.5, 55], [43, 5, 57], [49, 4.5, 60], [55, 5, 62]].forEach(([t, d, m]) => add(t, d, m, MEL(.13, .45, 1.7)));
    return { len: 64, ev };
  }
  const PARTS = { a1: trackA, a2: trackA2, h1: trackB, h2: trackH2, y1: trackY1, y2: trackY2, n1: trackC, n2: trackN2 };
  const PART_KEYS = ['a1', 'a2', 'h1', 'h2', 'y1', 'y2', 'n1', 'n2'];
  const KEYS = { a: ['a1', 'a2'], h: ['h1', 'h2'], y: ['y1', 'y2'], n: ['n1', 'n2'] };   // じかんたい → その じかんの 2曲（つづけて ながれる）
  const TRACKS = {};
  // 1つの じかんたいの 曲＝2曲を つなげて 1周に する。2曲めの 音符は 大きさを PART_TRIM／TRIM の 比で そろえる。marks＝2曲めの はじまり（びょう）
  const track = key => TRACKS[key] || (TRACKS[key] = (() => {
    let off = 0; const ev = [], marks = [];
    for (const n of KEYS[key]) {
      const p = PARTS[n](), k = PART_TRIM[n] / TRIM[key]; marks.push(off);
      p.ev.forEach(([t, d, m, o]) => ev.push([t + off, d, m, k === 1 ? o : { ...o, gain: o.gain * k }]));
      off += p.len;
    }
    ev.sort((x, y) => x[0] - y[0]); return { len: off, ev, marks, parts: KEYS[key].slice() };
  })());

  // ── 1つの 音（ふつうは サイン波。アタックは 0.03びょう より みじかく しない・ローパスは 1800Hz より うえに しない・ピッチは しゃくらない）──
  function voice(ctx, dest, t, dur, midi, o) {
    const { type = 'sine', gain = .1, r = .6, pan = 0, lp = LP, hold = false } = o || {};
    const a = Math.max((o && o.a) || .08, MIN_ATTACK);
    const g = ctx.createGain(), os = ctx.createOscillator(); os.type = type; os.frequency.setValueAtTime(mtof(midi), t); os.connect(g); os.start(t); os.stop(t + a + dur + r + .1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a);
    if (hold) { g.gain.setValueAtTime(gain, t + Math.max(a, dur)); g.gain.linearRampToValueAtTime(.0001, t + dur + r); } else g.gain.exponentialRampToValueAtTime(.0001, t + a + dur + r);
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = Math.min(lp || LP, LP); g.connect(fl);
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; fl.connect(p); p.connect(dest); } else fl.connect(dest);
  }
  // ゆるい こだま（空気）。曲の 音は ここへ あつめて、ぜんたいの 大きさを きめる。こだまは 8ぶん音符（70BPM の ちょうど 半拍）で かえって くる
  function makeAir(ctx, volume) {
    const master = ctx.createGain(); master.gain.value = volume;
    const dl = ctx.createDelay(1); dl.delayTime.value = 60 / 70 / 2; const fb = ctx.createGain(); fb.gain.value = .3; const wet = ctx.createGain(); wet.gain.value = .22;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = AIR_LP;
    master.connect(ctx.destination); master.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(ctx.destination);
    return master;
  }

  // ── 状態 ──
  let on = (readJSON(KEY) || {}).on === true, cur = null, air = null, ownCtx = null, wantGesture = false, ticker = 0;
  const stack = [], subs = new Set();
  const notify = () => subs.forEach(f => { try { f(); } catch {} });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, on })); } catch {} };
  const mainSound = () => { const m = readJSON(MAIN); return !!(m && m.sound === true); };
  const soundOk = fn => { try { return typeof fn === 'function' ? !!fn() : mainSound(); } catch { return false; } };
  const norm = t => ({ asa: 'a', hiru: 'h', yuu: 'y', yoru: 'n' }[t] || t);
  function pickKey(name, o) {   // 曲は「いまの じかん」できまる（a あさ・h ひる・y ゆうがた・n よる）。じかんが わからなければ ひる
    o = o || {};
    if (name !== 'hiroba' && name !== 'tank' && name !== 'gaze') return null;   // 釣りの 画面など：鳴らさない
    if (name === 'tank' && val(o.starry)) return 'n';   // ランプを けして 星空に した へやは よるの 曲
    const t = norm(val(o.time)); return Object.prototype.hasOwnProperty.call(KEYS, t) ? t : 'h';
  }
  function desired() {
    const top = stack[stack.length - 1]; if (!top || !on || document.hidden) return null;
    try { if (!soundOk(top.o.sound) || val(top.o.mute)) return null; return pickKey(top.name, top.o); } catch { return null; }
  }
  const touched = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;   // ゆびで さわった あとか
  function getCtx(top) {
    if (!touched()) { wantGesture = true; return null; }   // さわる まえには、音の 部品を 作らない
    try {
      if (typeof top.o.ctx === 'function') return top.o.ctx() || null;
      if (ownCtx && ownCtx.state !== 'closed') return ownCtx;
      const AC = window.AudioContext || window.webkitAudioContext; return AC ? (ownCtx = new AC()) : null;
    } catch { return null; }
  }
  const airFor = c => (air && air.ctx === c) ? air.node : (air = { ctx: c, node: makeAir(c, VOLUME * boost) }).node;

  // ── 1曲の プレーヤー：すこし さきまで 音を 予約し、曲の おわりで もとに もどる（つなぎ目なし）──
  function startPlayer(c, key, startPart) {   // startPart＝はじめに ながす 曲（0＝1つめ／1＝2つめ）。おへやは 2つめから はじめて、ひろばと ちがう 曲に する
    const t = track(key), g = c.createGain(), now = c.currentTime, off = startPart > 0 && t.marks[startPart] > 0 ? t.marks[startPart] : 0;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(TRIM[key], now + 3); g.connect(airFor(c));
    const p = { key, ctx: c, gain: g, loopStart: now + .15 - off, idx: off ? Math.max(0, t.ev.findIndex(e => e[0] >= off - 1e-6)) : 0, startPart: off ? startPart : 0, ended: false, made: 0 };
    p.pump = () => {
      if (p.ended || c.state === 'closed') return;
      const t0 = c.currentTime, horizon = t0 + 4;
      for (let guard = 0; guard < 600; guard++) {
        const e = t.ev[p.idx], at = p.loopStart + e[0]; if (at > horizon) break;
        if (at >= t0 - .05) { try { voice(c, g, at, e[1], e[2], e[3]); p.made++; } catch {} }   // 間に あわなかった 音は とばす（まとめて 鳴らさない）
        p.idx++; if (p.idx >= t.ev.length) { p.idx = 0; p.loopStart += t.len; }
      }
    };
    p.pump(); return p;
  }
  function stopPlayer(p, sec) {
    if (!p || p.ended) return; p.ended = true;
    try { const n = p.ctx.currentTime; p.gain.gain.cancelScheduledValues(n); p.gain.gain.setValueAtTime(p.gain.gain.value, n); p.gain.gain.linearRampToValueAtTime(0, n + sec); } catch {}
    setTimeout(() => { try { p.gain.disconnect(); } catch {} }, sec * 1000 + 400);
  }
  function ensureTimer() {
    const need = on && stack.length > 0;
    if (need && !ticker) ticker = setInterval(tick, 500); else if (!need && ticker) { clearInterval(ticker); ticker = 0; }
  }
  function tick() { refresh(); if (cur) cur.pump(); }
  function refresh() {
    try {
      const key = desired();
      if (!key) { if (cur) { stopPlayer(cur, 1.6); cur = null; } return; }
      const top = stack[stack.length - 1], c = getCtx(top); if (!c) return;
      if (c.state === 'suspended') c.resume().catch(() => {});
      if (cur && cur.key === key && cur.ctx === c) return;
      if (cur) stopPlayer(cur, 3);   // ふわっと つなぐ（前の 曲は 3びょうで きえる）
      cur = startPlayer(c, key, top.name === 'tank' ? 1 : 0);
    } catch { /* 音が 出せなくても ゲームは 止めない */ } finally { ensureTimer(); }
  }
  const api = {
    version: 1, keys: ['a', 'h', 'y', 'n'], parts: PART_KEYS,
    on: () => on,
    set(v) { on = !!v; save(); refresh(); notify(); return on; },
    enter(name, o) { const i = stack.findIndex(s => s.name === name); if (i >= 0) stack.splice(i, 1); stack.push({ name, o: o || {} }); refresh(); },
    leave(name) { const i = stack.findIndex(s => s.name === name); if (i >= 0) stack.splice(i, 1); refresh(); },
    refresh,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    // 「BGM：ON/OFF」ボタン。ばしょごとに 見た目（class）だけ かえられる。おとが OFF の まま おされたら、おとも つける（enableSound）
    button(o) {
      o = o || {};
      const b = document.createElement('button'); b.type = 'button'; b.className = o.className || 'bgm-btn'; if (o.id) b.id = o.id;
      b.title = 'ひろば・おへや・ながめる で ながれる、しずかな BGM';
      const paint = () => { b.textContent = (isEn() ? 'BGM: ' : 'BGM：') + (on ? 'ON' : 'OFF'); b.setAttribute('aria-pressed', String(on)); };
      b.addEventListener('click', () => {
        const next = !on;
        if (next && typeof o.enableSound === 'function' && !soundOk(o.sound)) { try { o.enableSound(); } catch {} }
        api.set(next);
        if (typeof o.onToggle === 'function') { try { o.onToggle(next, soundOk(o.sound)); } catch {} }
      });
      subs.add(paint); paint(); return b;
    },
    state: () => ({ on, key: cur ? cur.key : '', playing: !!cur, stack: stack.map(s => s.name), ownCtx: !!ownCtx, volume: VOLUME * boost, trim: { ...TRIM }, part: cur ? cur.startPart : 0 }),
    _debug: { track, part: n => PARTS[n](), PARTS, KEYS, PART_TRIM, voice, makeAir, pickKey, tick, desired, TRIM, VOLUME, TOP_MIDI, MIN_ATTACK, LP, AIR_LP, get cur() { return cur; }, get stack() { return stack; }, get wantGesture() { return wantGesture; }, get ticker() { return ticker; } }
  };
  window.TsuriBgm = api;
  // ゆびで さわった あとで はじめて 音の 部品を 作る／画面が かくれたら 止める／ほかの タブで「おと」「BGM」が かわったら 取りこむ
  ['pointerup', 'pointerdown', 'keydown', 'touchend', 'click'].forEach(ev => addEventListener(ev, () => { if (wantGesture) { wantGesture = false; refresh(); } }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', refresh);
  addEventListener('pageshow', refresh);
  // 「おと」の ボタンなど、どこかを おした 直後に 見なおす（本体の おとボタンが 記録を かえた あと すぐ 止まる。ほかの ページの 記録の かわりは storage が しらせる）
  addEventListener('click', () => { if (on && stack.length) setTimeout(refresh, 30); }, { passive: true, capture: true });
  // ─── English mode（tsuri-en.js が あって 英語の 時だけ）：BGM の 文を 訳表に 足す。ひろば・おへや・ながめる の どこでも おなじ ───
  const EN = { ex: {
    'ひろば・おへや・ながめる で ながれる、しずかな BGM': "Quiet music that plays in the Plaza, Marufuwa's Room and Just Watch",
    'おとと BGMを つけたよ。しずかな きょくが ながれるよ。': 'Sound and BGM are on. Quiet music will play.',
    'BGMを つけたよ。しずかな きょくが ながれるよ。': 'BGM is on. Quiet music will play.',
    'BGMを けしたよ。': 'BGM is off.',
    'BGMは、みみで ながめる あいだ おやすみします。': 'BGM takes a break while Listen mode is on.'
  }, rules: [   // 「みみで ながめる」を はじめた ときの 長い 読みあげの あとに つづけて 出る（前の 文は 総司令部の 表で 訳す）
    [/^(.+)BGMは、みみでながめるあいだおやすみします。$/, (_, pre) => { const E = window.TsuriEn, p = E && E.tr ? E.tr(pre) : null; return p == null ? null : p + ' BGM takes a break while Listen mode is on.'; }]
  ] };
  const regEn = () => { const E = window.TsuriEn; if (E && E.lang === 'en' && typeof E.add === 'function' && !regEn.done) { regEn.done = true; E.add(EN); } notify(); };
  addEventListener('load', regEn);
  addEventListener('storage', e => { if (e.key === KEY) { on = (readJSON(KEY) || {}).on === true; refresh(); notify(); } else if (e.key === MAIN) refresh(); });
})();
