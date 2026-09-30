/* まるふわ つりびより：つりびと ノート（外付け・総司令部）
   ・あそんだ きろくが、1ぎょうずつ じどうで にっきに なる。よみかえす ための もの（Dispatch の 案 D・10/1）
       9/30 よる・みずうみ ／ レモンの ひよこと いっしょに ／ きんのまるごい 54.5センチ を つった
   ・よむ もの：本体の save.note（{at, id, size, spot, time, nushi, party, avatar, kind}の 配列・新しい ものが 先頭）。
     まだ 無い ときは save.bucket（さいきんの 10ぴき）だけで ページを 作る（ばしょ・なかまは 出さない）
   ・書く もの：なし（保存も 通信も しない）。「ノートを しゃしんに」は この 端末の 中で 絵を 作って 保存するだけ
   ・数字は ふやさない：合計・順位・日数の「かぞえ」は 出さない。「こんしゅうの ノート」は 何を つったか・だれと いたか だけ
   ・English：TsuriEn.lang が 'en' なら 英語で 書く（この ダイアログは data-en-skip・自分で 英語に する）
   ・入口：バケツの ダイアログの いちばん 上に「つりびと ノート」ボタン（44px） */
(() => {
  'use strict';
  if (window.TsuriNote) return;
  const KEY = 'marufuwa-tsuri-v1';
  const EN = () => !!(window.TsuriEn && window.TsuriEn.lang === 'en');
  const T = (ja, en) => EN() ? en : ja;
  const tr = s => { try { return EN() && window.TsuriEn && typeof window.TsuriEn.t === 'function' ? (window.TsuriEn.t(s) || s) : s; } catch { return s; } };
  const SPOT = { L: ['みずうみ', 'the lake'], R: ['かわ', 'the river'], H: ['みなとまち', 'the harbor town'], B: ['ふねの うえ', 'the boat'] };
  const TIME = { a: ['あさ', 'morning'], h: ['ひる', 'noon'], y: ['ゆうがた', 'evening'], n: ['よる', 'night'] };
  const PAL = { usagi: ['ミントの うさぎ', 'Mint Bunny'], kawauso: ['ラテの かわうそ', 'Latte Otter'], hiyoko: ['レモンの ひよこ', 'Lemon Chick'], ribbon: ['リボンの うさぎ', 'Ribbon Bunny'],
    panda: ['おひるね パンダ', 'Nap Panda'], kojika: ['おほしさまの こじか', 'Little Star Fawn'], tanuki: ['クローバーの たぬき', 'Clover Tanuki'], risu: ['チョコの りす', 'Chocolate Squirrel'],
    neko: ['ももの ねこ', 'Peach Cat'], koinu: ['はちみつの こいぬ', 'Honey Puppy'], hamster: ['いちごの ハムスター', 'Strawberry Hamster'], hoho: ['ほほきずの ねこ', 'Scrappy Cat'],
    azarashi: ['さくらの あざらし', 'Sakura Seal'], alpaca: ['わたあめの アルパカ', 'Cotton Candy Alpaca'], gantai: ['がんたいの くま', 'Eyepatch Bear'],
    penguin: ['あんないの ペンギン', 'Guide Penguin'], kogitsune: ['おみせの きつね', 'Shop Fox'] };
  const palName = id => {
    if (PAL[id]) return T(PAL[id][0], PAL[id][1]);
    try { const t = (window.TsuriTown && window.TsuriTown.list || []).find(x => x.id === id); if (t) return T(t.name, t.en || t.name); } catch {}
    return '';
  };
  const fishOf = id => { try { const all = window.Tsuri && (typeof window.Tsuri.all === 'function' ? window.Tsuri.all() : window.Tsuri.all); const f = (all || []).find(x => x.id === id); if (f) return f; const s = window.Tsuri && window.Tsuri.season ? window.Tsuri.season().find(x => x.id === id) : null; return s || null; } catch { return null; } };
  const fishName = f => f ? (EN() ? (f.en || tr(f.name)) : f.name) : T('さかな', 'a fish');
  const readSave = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const entries = () => {
    try { if (window.Tsuri && typeof window.Tsuri.note === 'function') { const n = window.Tsuri.note(); if (Array.isArray(n)) return n.map(e => ({...e})); } } catch {}
    const s = readSave();
    if (Array.isArray(s.note) && s.note.length) return s.note.map(e => ({...e}));
    return (Array.isArray(s.bucket) ? s.bucket : []).map(b => ({ at: b.at, id: b.id, size: b.size, nushi: !!b.nushi, kind: 'catch', lite: true }));   // まだ 本体が ノートを 書いて いない とき
  };
  const day = at => { const d = new Date(at); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const dayLabel = at => { const d = new Date(at); return EN() ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`; };
  const size = n => (typeof n === 'number' && n > 0) ? (EN() ? `${Math.round(n * 10) / 10} cm` : `${Math.round(n * 10) / 10}センチ`) : '';
  const joinNames = ids => { const n = (ids || []).map(palName).filter(Boolean); if (!n.length) return ''; return EN() ? (n.length === 1 ? n[0] : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]) : n.join('と '); };
  // 1けん → [1ぎょうめ（いつ・どこ）, 2ぎょうめ（だれと）, 3ぎょうめ（なにが）]
  function lines(e) {
    const f = fishOf(e.id), when = [e.time && TIME[e.time] ? T(TIME[e.time][0], TIME[e.time][1]) : '', e.spot && SPOT[e.spot] ? T(SPOT[e.spot][0], SPOT[e.spot][1]) : ''].filter(Boolean);
    const who = joinNames([...(e.avatar ? [e.avatar] : []), ...(Array.isArray(e.party) ? e.party : [])]);
    const l1 = EN() ? when.join(' · ') : when.join('・');
    const l2 = who ? T(`${who}と いっしょに`, `With ${who}`) : '';
    const nm = fishName(f), sz = size(e.size);
    let l3;
    if (e.kind === 'release') l3 = T(`${nm}を そっと にがした`, `Let ${nm} go, gently`);
    else if (e.kind === 'gift') l3 = T(`${nm}を もらった`, `Received ${nm} as a gift`);
    else l3 = e.nushi ? T(`ぬしの ${nm}${sz ? ' ' + sz : ''} に あえた`, `Met the Guardian, ${nm}${sz ? ' ' + sz : ''}`) : T(`${nm}${sz ? ' ' + sz : ''} を つった`, `Caught ${nm}${sz ? ', ' + sz : ''}`);
    return [l1, l2, l3];
  }
  // こんしゅう（きょうから 7日）の まとめ：だれと いた・なにを つった（かずは 出さない）
  function week(list) {
    const from = Date.now() - 7 * 864e5, w = list.filter(e => e.at >= from);
    if (!w.length) return '';
    const fishes = [...new Set(w.filter(e => e.kind !== 'release').map(e => fishName(fishOf(e.id))))].slice(0, 6);
    const pals = [...new Set(w.flatMap(e => [...(e.avatar ? [e.avatar] : []), ...(Array.isArray(e.party) ? e.party : [])]))].map(palName).filter(Boolean).slice(0, 4);
    const big = w.filter(e => e.kind !== 'release' && typeof e.size === 'number').sort((a, b) => b.size - a.size)[0];
    const p = [];
    if (fishes.length) p.push(T(`あえた さかな：${fishes.join('、')}`, `Fish this week: ${fishes.join(', ')}`));
    if (pals.length) p.push(T(`いっしょに いた こ：${pals.join('、')}`, `Company: ${pals.join(', ')}`));
    if (big) p.push(T(`いちばん おおきかったのは ${fishName(fishOf(big.id))} ${size(big.size)}`, `Biggest: ${fishName(fishOf(big.id))}, ${size(big.size)}`));
    return p.join('\n');
  }

  // ---------- 見た目 ----------
  const css = `
#note-open{min-height:44px;width:100%;margin:0 0 10px;border-radius:999px}
#note{max-width:min(520px,94vw)}
:root[data-night=true] #note{color:#e8f1f8;background:#13253d;border-color:#2d4d70}
:root[data-night=true] #note::backdrop{background:#000000b3}
#note .note-paper{background:#fffdf5;border:1.5px solid #e6dcc0;border-radius:16px;padding:12px 14px;margin:0 0 12px;line-height:1.75;font-size:.98rem;color:#3a3220;max-height:52vh;overflow:auto}
:root[data-night=true] #note .note-paper{background:#1a2438;border-color:#3b4a66;color:#f0f4fa}
#note .note-day{margin:8px 0 2px;font-weight:700;opacity:.8}
#note .note-ent{margin:0 0 8px;padding:0 0 8px;border-bottom:1px dashed #e6dcc0}
:root[data-night=true] #note .note-ent{border-bottom-color:#3b4a66}
#note .note-ent:last-child{border-bottom:0}
#note .note-l1{opacity:.75;font-size:.9rem}
#note .note-l3{font-weight:700}
#note .note-week{white-space:pre-line;margin:0 0 12px;line-height:1.7;font-size:.95rem}
#note .note-empty{opacity:.8;margin:0 0 12px;line-height:1.7}
#note .photo-actions button{min-height:44px}
#note .note-count{text-align:center;margin:0 0 12px;opacity:.85;font-size:.92rem}
`;
  function mount() {
    const bucket = document.getElementById('bucket'); if (!bucket || document.getElementById('note')) return;
    const style = document.createElement('style'); style.id = 'note-style'; style.textContent = css; document.head.append(style);
    const open = document.createElement('button'); open.id = 'note-open'; open.type = 'button'; open.setAttribute('data-en-skip', '1');
    open.textContent = T('つりびと ノート', 'Fishing Notebook');
    const h2 = bucket.querySelector('h2'); h2 ? h2.after(open) : bucket.prepend(open);
    const dlg = document.createElement('dialog'); dlg.id = 'note'; dlg.setAttribute('aria-labelledby', 'note-title'); dlg.setAttribute('data-en-skip', '1');
    dlg.innerHTML = `<h2 id="note-title"></h2><p class="note-count" id="note-lead"></p><div class="note-paper" id="note-paper" tabindex="0"></div><div class="note-week" id="note-week" hidden></div><div class="photo-actions"><button id="note-photo" type="button"></button></div><button class="close" type="button" id="note-close"></button>`;
    bucket.after(dlg);
    const $ = id => document.getElementById(id);
    function render() {
      $('note-title').textContent = T('つりびと ノート', 'Fishing Notebook');
      $('note-close').textContent = T('とじる', 'Close');
      $('note-photo').textContent = T('ノートを しゃしんに', 'Save the page as a picture');
      const list = entries().filter(e => e && Number.isFinite(e.at)).sort((a, b) => b.at - a.at).slice(0, 200), paper = $('note-paper'); paper.innerHTML = '';
      if (!list.length) {
        $('note-lead').textContent = T('つった さかなが、1ぎょうずつ にっきに なるよ。', 'Each fish you catch becomes one line of a diary.');
        const p = document.createElement('p'); p.className = 'note-empty'; p.textContent = T('まだ なにも かいて いないよ。さかなを つると、ここに のこるよ。', 'Nothing written yet. Catch a fish and it will appear here.'); paper.append(p);
        $('note-week').hidden = true; $('note-photo').disabled = true; return;
      }
      $('note-photo').disabled = false;
      $('note-lead').textContent = list.some(e => e.lite) ? T('さいきんの ぶんだけ のこって いるよ。', 'Only recent days are kept for now.') : T('よみかえす ための ノート。かってに きえないよ。', 'A diary to look back on. It does not disappear.');
      let last = '';
      list.forEach(e => {
        const d = day(e.at);
        if (d !== last) { last = d; const h = document.createElement('p'); h.className = 'note-day'; h.textContent = dayLabel(e.at); paper.append(h); }
        const [l1, l2, l3] = lines(e), div = document.createElement('div'); div.className = 'note-ent';
        [['note-l1', l1], ['note-l2', l2], ['note-l3', l3]].forEach(([c, t]) => { if (!t) return; const p = document.createElement('p'); p.className = c; p.style.margin = '0'; p.textContent = t; div.append(p); });
        paper.append(div);
      });
      const w = week(list); $('note-week').hidden = !w; $('note-week').textContent = w ? T('こんしゅうの ノート\n', 'This week\n') + w : '';
    }
    open.addEventListener('click', () => { render(); try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); } });
    $('note-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', ev => { if (ev.target === dlg) dlg.close(); });
    $('note-photo').addEventListener('click', () => photo(entries().filter(e => e && Number.isFinite(e.at)).sort((a, b) => b.at - a.at).slice(0, 8)));
  }

  // ---------- ノートの 1ページを 絵に（この 端末の 中だけ・1080×1350）----------
  function photo(list) {
    if (!list.length) return;
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const night = document.documentElement.getAttribute('data-night') === 'true';
    c.fillStyle = night ? '#1a2438' : '#fffdf5'; c.fillRect(0, 0, W, H);
    c.strokeStyle = night ? '#3b4a66' : '#e6dcc0'; c.lineWidth = 6; c.strokeRect(40, 40, W - 80, H - 80);
    const ink = night ? '#f0f4fa' : '#3a3220', soft = night ? '#b9c6da' : '#7a6f55';
    const font = (px, bold) => `${bold ? '700 ' : ''}${px}px system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif`;
    c.fillStyle = ink; c.font = font(54, true); c.textAlign = 'center'; c.fillText(T('つりびと ノート', 'Fishing Notebook'), W / 2, 150);
    c.textAlign = 'left';
    let y = 250; const wrap = (text, x, maxW, px, color, bold) => { c.font = font(px, bold); c.fillStyle = color; let line = ''; for (const ch of text) { if (c.measureText(line + ch).width > maxW) { c.fillText(line, x, y); y += px * 1.45; line = ch; } else line += ch; } if (line) { c.fillText(line, x, y); y += px * 1.45; } };
    let last = '';
    for (const e of list) {
      if (y > H - 200) break;
      const d = day(e.at); if (d !== last) { last = d; y += 10; wrap(dayLabel(e.at), 100, W - 200, 34, soft, true); }
      const [l1, l2, l3] = lines(e);
      if (l1) wrap(l1, 120, W - 240, 30, soft, false);
      if (l2) wrap(l2, 120, W - 240, 34, ink, false);
      if (l3) wrap(l3, 120, W - 240, 40, ink, true);
      y += 18;
    }
    c.fillStyle = soft; c.font = font(28, false); c.textAlign = 'center'; c.fillText(T('まるふわ つりびより', 'Marufuwa Fishing Days'), W / 2, H - 90);
    cv.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'marufuwa-note.png', { type: 'image/png' });
      const done = () => { const s = document.getElementById('status'); if (s) s.textContent = T('ノートの しゃしんを ほぞんしたよ。', 'The notebook picture was saved.'); };
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).then(done).catch(() => {}); return; }   // 端末の きょうゆう メニュー（おした ときだけ）
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'marufuwa-note.png'; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); done();
    }, 'image/png');
  }

  window.TsuriNote = { entries, lines, week, version: 1 };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
