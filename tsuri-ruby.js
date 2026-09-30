/* まるふわ つりびより：ふりがな（ruby）エンジン（ジョブズ1・2026-10-01）
   にほんごの とき だけ、画面の ひらがなの ことばを「漢字＋ふりがな」に かえる。English の ときは なにも しない。
   もとの ひらがなの 文は そのまま（English の ひょうの キー・よみあげ・きろくは かわらない）。かえるのは 画面に 出た 文字だけ。
   ・じしょ：tsuri-ruby-dict.js（window.TsuriRubyDict＝1ぎょうに 1つ「ひらがな=漢字《よみ》ひらがな」）。ないことばは ひらがなの まま
   ・かえない ところ：script・style・入力らん・ruby・[data-noruby]・#status・.bubble・ライブ領域（aria-live／role=status／role=alert＝よみあげが 2回 入らない ように）（よみあげ・ほかの 検査と ぶつかる ところ。あとで ひらく）
   ・けす：?noruby=1（検査用）。ひらがなだけ＝ほんたいの きろく save.hira（つかいやすくする →「もじ」）
   ・よみあげ：<rt aria-hidden="true">（かんじだけ よむ）。ことばを こえで よむ しくみは もとの ひらがなの 文を つかう */
(function (root) {
  'use strict';
  const HIRA = /[ぁ-ゖ]/;
  // じしょ：'つれた=釣《つ》れた' の ぎょうを {key, seg:[{b,r}|{t}]} に
  function parse(text) {
    const map = new Map(), dmap = new Map(), ends = new Set(), maxLen = {n: 1};
    String(text || '').split('\n').forEach(line => {
      line = line.trim(); if (!line || line[0] === '#') return;
      const i = line.indexOf('='); if (i < 1) return;
      let key = line.slice(0, i).trim(); const mk = line.slice(i + 1).trim(); if (!key || !mk) return;
      const digitOnly = key[0] === '^'; if (digitOnly) key = key.slice(1); if (!key) return;
      const endOnly = key.endsWith('$'); if (endOnly) key = key.slice(0, -1); if (!key) return;
      const seg = []; const re = /([^《》]+)《([^《》]+)》|([^《》]+)/g; let m;
      while ((m = re.exec(mk))) {
        if (m[1] !== undefined) {   // 土台の 先頭が かなで、よみが その かなで はじまらない ときは、かなを 土台から 出す（り人《びと》→ り＋人《びと》）
          const b = m[1], r = m[2], lead = /^[^㐀-鿿々〆ヶ]+/.exec(b);
          if (lead && b.length > lead[0].length && !r.startsWith(lead[0])) { seg.push({t: lead[0]}); seg.push({b: b.slice(lead[0].length), r}); } else seg.push({b, r});
        } else seg.push({t: m[3]});
      }
      if (seg.length) { (digitOnly ? dmap : map).set(key, seg); if (endOnly) ends.add(key); maxLen.n = Math.max(maxLen.n, key.length); }
    });
    return {map, dmap, ends, maxLen: maxLen.n};
  }
  // 1つの 文字れつを [{t}|{b,r}] の ならびに。かわる ところが なければ null
  function convert(text, D) {
    if (!D || !(D.map.size || D.dmap.size) || !HIRA.test(text)) return null;
    const out = [], src = String(text); let i = 0, changed = false, plain = '';
    const flush = () => { if (plain) { out.push({t: plain}); plain = ''; } };
    let allow = 1;   // 0＝しらべない／1＝ことばの あたま・じょしの あと／2＝すうじの あと（1ぴき・3かい の ような ^ の ことばだけ）
    while (i < src.length) {
      const c = src[i];
      if (!HIRA.test(c)) { plain += c; i++; allow = /[0-9０-９一二三四五六七八九十百]/.test(c) ? 2 : /[ァ-ヶー]/.test(c) ? 1 : /[ぁ-んぁ-ゖ一-鿿a-zA-Z]/.test(c) ? 0 : 1; continue; }   // カタカナの あとの ひらがなは ことばの あたま（ホームがめん）
      let hit = null;
      if (allow) for (let n = Math.min(D.maxLen, src.length - i); n >= 1; n--) { const k = src.substr(i, n), seg = allow === 2 ? (D.dmap.get(k) || D.map.get(k)) : D.map.get(k); if (seg && D.ends && D.ends.has(k) && HIRA.test(src[i + n] || '')) continue; if (seg) { hit = {n, seg}; break; } }   // $ の ことばは つぎが ひらがなで ない ときだけ   // すうじの あとは ^ の ことばも
      if (hit) { flush(); hit.seg.forEach(s => out.push(s.b !== undefined ? s : {t: s.t})); i += hit.n; changed = true; allow = 0; continue; }   // ことばの あとは しらべない（「つくれなかった」の「なか」を 中に しない）
      plain += c; i++; allow = 0;   // ことばの ちゅうでは しらべない
    }
    flush();
    return changed ? out : null;
  }
  // ならびから スペースを とる：ことば（スペースで くぎった まとまり）の どちらかに 漢字が あって、りょうがわが にほんごなら ひらく（ひらがな どうしは のこす）
  function tighten(parts) {
    const isK = s => /[㐀-鿿]/.test(s), JP = /[ぁ-んァ-ヶー一-鿿！？。、」）「（…〜♪♡★]/;
    const toks = [{parts: [], k: false}], gaps = [];
    for (const p of parts) {
      const cur = toks[toks.length - 1];
      if (p.b !== undefined) { cur.parts.push(p); cur.k = true; continue; }
      p.t.split(/( +)/).forEach(sg => {
        if (sg === '') return;
        if (/^ +$/.test(sg)) { gaps.push(sg); toks.push({parts: [], k: false}); return; }
        const c2 = toks[toks.length - 1]; c2.parts.push({t: sg}); if (isK(sg)) c2.k = true;
      });
    }
    const lastCh = t => { const l = t.parts[t.parts.length - 1]; if (!l) return ''; const x = l.b !== undefined ? l.b : l.t; return x[x.length - 1] || ''; };
    const firstCh = t => { const f = t.parts[0]; if (!f) return ''; const x = f.b !== undefined ? f.b : f.t; return x[0] || ''; };
    const res = [];
    toks.forEach((t, i) => {
      t.parts.forEach(p => res.push(p));
      if (i < gaps.length) { const nx = toks[i + 1], drop = t.parts.length && nx.parts.length && (t.k || nx.k) && JP.test(lastCh(t)) && JP.test(firstCh(nx)); if (!drop) res.push({t: gaps[i]}); }
    });
    return res;
  }
  const api = {parse, convert, tighten};
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  // ---- ブラウザ：画面の もじを かえる ----
  const q = new URLSearchParams(location.search);
  // もじの しゅるい：「かんじ＋ふりがな」（はじめから）／「ひらがなだけ」（幼児・低学年向け。漢字を 一切 出さない）。ほんたいの きろく（save.hira）を よむ
  const hiraOnly = () => { try { const d = JSON.parse(localStorage.getItem('marufuwa-tsuri-v1') || '{}'); return !!(d && d.hira === true); } catch { return false; } };
  let enabled = !(q.get('noruby') === '1' || hiraOnly());
  const HIRA_MODE = !enabled && q.get('noruby') !== '1';
  const isEn = () => !!(root.TsuriEn && root.TsuriEn.lang === 'en');
  let D = null, observer = null, busy = false, scheduled = 0; const pending = new Set(), made = new WeakSet();
  const SKIP = 'svg,canvas,script,style,textarea,input,select,option,ruby,rt,rp,[data-noruby],#status,.bubble,#bubble,.sr-only,#hm-live,.hm-note,[class*="hm-"],[id^="hm-"],[id^="tk-"],[class*="tk-"],#tank,#himitsu,title,head,[aria-live],[role=status],[role=alert]';
  function ensureDict() {
    if (D) return D; if (typeof root.TsuriRubyDict !== 'string') return null;
    D = parse(root.TsuriRubyDict);
    // さかなの なまえ：ゲームが もつ 漢字の ひょう（{漢字|よみ}）を そのまま つかう（ずかんの ひょうきと そろう）
    try { const list = root.Tsuri && typeof root.Tsuri.fishList === 'function' ? root.Tsuri.fishList() : []; list.forEach(f => { if (f && f.name && typeof f.kanji === 'string' && f.kanji.includes('{')) { const one = parse(f.name + '=' + f.kanji.replace(/\{([^|{}]+)\|([^{}]+)\}/g, '$1《$2》')); one.map.forEach((seg, k) => { D.map.set(k, seg); D.maxLen = Math.max(D.maxLen, k.length); }); } }); } catch {}
    return D;
  }
  function skip(node) { const el = node.nodeType === 1 ? node : node.parentElement; return !el || !!(el.closest && el.closest(SKIP)); }
  function build(parts) {
    const frag = document.createDocumentFragment();
    parts.forEach(p => {
      if (p.b !== undefined) { const r = document.createElement('ruby'); r.append(p.b); const rp1 = document.createElement('rp'); rp1.textContent = '('; const rt = document.createElement('rt'); rt.textContent = p.r; rt.setAttribute('aria-hidden', 'true'); const rp2 = document.createElement('rp'); rp2.textContent = ')'; r.append(rp1, rt, rp2); frag.append(r); }
      else { const t = document.createTextNode(p.t); made.add(t); frag.append(t); }
    });
    return frag;
  }
  function processText(tn) {
    if (made.has(tn) || !tn.parentNode || skip(tn)) return;
    const parts = convert(tn.data, ensureDict()); if (!parts) return;
    const frag = build(tighten(parts)), par = tn.parentNode;
    // ふくろが flex／grid（.pill など）だと ruby が ひとつずつ ばらばらの 箱に なり、折り返しや ふりがなの 位置が くずれる → ひとつの span に まとめて 1つの 箱に する
    let box = false; try { box = par.nodeType === 1 && (par.classList.contains('pill') || /flex|grid/.test(getComputedStyle(par).display)); } catch {}
    if (box) { const w = document.createElement('span'); w.className = 'rbw'; w.append(frag); par.replaceChild(w, tn); } else par.replaceChild(frag, tn);
  }
  function walk(rootNode) {
    if (!rootNode || skip(rootNode)) return;
    if (rootNode.nodeType === 3) { processText(rootNode); return; }
    const tw = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null); const list = []; let n;
    while ((n = tw.nextNode())) if (HIRA.test(n.data)) list.push(n);
    list.forEach(processText);
  }
  function flush() {
    scheduled = 0; if (!enabled || isEn() || !ensureDict()) { pending.clear(); return; }
    busy = true; try { const items = [...pending]; pending.clear(); items.forEach(node => { if (node.isConnected) walk(node); }); } finally { busy = false; if (observer) observer.takeRecords(); }
  }
  function schedule(node) { if (!node) return; pending.add(node); if (!scheduled) scheduled = requestAnimationFrame ? requestAnimationFrame(flush) : setTimeout(flush, 16); }
  // ひらがなだけ：もとから ある ふりがな（トップの せつめい・さかなの なまえ など）も よみ（rt）に もどして、漢字を 出さない
  function deruby(rootNode) {
    if (!rootNode || rootNode.nodeType !== 1 && rootNode.nodeType !== 9) return;
    const list = rootNode.nodeType === 1 && rootNode.tagName === 'RUBY' ? [rootNode] : [...rootNode.querySelectorAll('ruby')];
    list.forEach(r => { if (r.closest('svg,[data-noruby]')) return; const rt = r.querySelector('rt'); r.replaceWith(document.createTextNode(rt ? rt.textContent : r.textContent)); });
  }
  function startHira() {
    if (isEn()) return;
    deruby(document.body);
    new MutationObserver(records => { for (const r of records) r.addedNodes.forEach(n => { if (n.nodeType === 1) deruby(n); }); }).observe(document.body, {childList: true, subtree: true});
  }
  function start() {
    if (HIRA_MODE) { startHira(); return; }
    if (!enabled || isEn() || !ensureDict()) return;
    const st = document.createElement('style'); st.textContent = 'ruby{ruby-position:over;white-space:nowrap}rt{font-size:.52em;font-weight:700;line-height:1;letter-spacing:0}'; document.head.append(st);
    schedule(document.body);
    observer = new MutationObserver(records => {
      if (busy) return;
      for (const r of records) { if (r.type === 'childList') r.addedNodes.forEach(n => { if (n.nodeType === 1 || n.nodeType === 3) schedule(n); }); else if (r.type === 'characterData') schedule(r.target); }
    });
    observer.observe(document.body, {childList: true, characterData: true, subtree: true});
  }
  // 画像（canvas）や きょうゆうの 文のように ふりがなを 付けられない ところ用：漢字だけの 文字れつに する（ひらがなの まま のこす ことばも ある）
  function kanji(text) {
    if (!enabled || isEn() || !ensureDict()) return text;
    const parts = convert(String(text), D); if (!parts) return text;
    return tighten(parts).map(p => p.b !== undefined ? p.b : p.t).join('');
  }
  // canvas の fillText を ひとつに：しゃしん・どうがの もじも 漢字に（English・ふりがな なしの ときは そのまま）
  try { const proto = root.CanvasRenderingContext2D && root.CanvasRenderingContext2D.prototype; if (proto && !proto.__rubyPatched) { const ft = proto.fillText; proto.fillText = function (t, ...rest) { return ft.call(this, typeof t === 'string' ? kanji(t) : t, ...rest); }; proto.__rubyPatched = true; } } catch {}
  root.TsuriRuby = Object.assign({}, api, {
    kanji,
    hira: () => HIRA_MODE,
    active: () => enabled && !isEn() && !!ensureDict() && !!observer
  });
  // English の ことばが きまって から（TsuriEn.lang）はじめる
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 0)); else setTimeout(start, 0);
})(typeof window !== 'undefined' ? window : globalThis);
