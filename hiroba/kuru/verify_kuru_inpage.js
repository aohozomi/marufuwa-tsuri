// くるくる まるふわ の ページ専用 検査（headless Chrome を CDP で 実際に ひらいて 測る）
// つかいかた：node hiroba/kuru/verify_kuru_inpage.js [しゃしんの ほぞんさき]
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.argv[2] || path.join(os.tmpdir(), 'kuru_shots');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (n, c, d) => { results.push([!!c, n, d === undefined ? '' : d]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d === undefined ? '' : '  [' + d + ']')); };

async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/hiroba/kuru/index.html';
  const port = 9300 + Math.floor(Math.random() * 500);
  const chromePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(fs.existsSync);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'kuruprof-'));
  const ch = cp.spawn(chromePath, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); if (targets.some(t => t.type === 'page')) break; } catch (e) {} await sleep(200); }
  const tg = targets.find(t => t.type === 'page');
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const wait = new Map(), errors = [], evs = [];
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); return; }
    if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text));
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map(a => a.value || a.description).join(' '));
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/\/img\/(kuru\/(sym|reward)_[a-z]+|bg\/kuru_[a-z_]+)\.webp/.test(d.params.entry.url || '')) errors.push('log: ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    evs.push(d.method);
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  const open = async (url, w = 390, h = 844, opt = {}) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: opt.reduce ? 'reduce' : 'no-preference' }] });
    await send('Page.navigate', { url }); await sleep(1500);
  };
  const center = async sel => ev(`(()=>{document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'center'});const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
  const click = async sel => { const [x, y] = await center(sel); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name), Buffer.from(r.result.data, 'base64')); };
  const key = async (k, code) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: 32, text: k }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: 32 }); };
  const BAN = /スロット|ベット|かけ|ジャックポット|勝ち|負け|当たり|あたり|確率|コイン|かち|まけ/;
  const pushables = `[...document.querySelectorAll('a[href],button,summary,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&!e.closest('[hidden]')&&e.id!=='lang-toggle'&&!e.closest('details:not([open]) .inner')})`;
  // 人の ように ねらって そろえる（1つめは すぐ、あとは めじるしの えが まんなかに くる しゅんかんに）
  const aim = `window.__aim = async () => {
    const K = window.__kuru; const raf = () => new Promise(r => requestAnimationFrame(r));
    const btn = i => document.querySelectorAll('#stops button')[i];
    btn(0).click(); while (K.state(0) !== 'stop') await raf(); const want = K.sym(0);
    for (const i of [1, 2]) {
      for (let g = 0; g < 2000; g++) { await raf(); const p = K.pos(i), c = Math.round(p); if (K.symAt(i, c) === want && p - c > -0.1 && p - c < 0.12) { btn(i).click(); break; } }
      while (K.state(i) !== 'stop') await raf();
    }
    await new Promise(r => setTimeout(r, 200)); return document.getElementById('hut').dataset.last;
  }`;

  // ── 1. ひらく：エラー 0・390 と 1280 の しゃしん ──
  await open(base, 390, 844);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: '' });
  ok('ページが ひらく（くるくる まるふわ）', await ev(`document.title.includes('くるくる')`));
  ok('かざり：CSP メタ・translate=no・viewport', await ev(`!!document.querySelector('meta[http-equiv=Content-Security-Policy]') && document.documentElement.translate===false && !!document.querySelector('meta[name=viewport]')`));
  ok('きんしご（スロット／ベット／かけ／ジャックポット／勝ち／負け／当たり／確率／コイン）が がめんに ない', !BAN.test(await ev(`document.title+'\\n'+document.body.textContent`)), await ev(`(document.body.textContent.match(/スロット|ベット|かけ|ジャックポット|勝ち|負け|当たり|あたり|確率|コイン|かち|まけ/)||[''])[0]`));
  ok('おせる もの（はじめ）が 6つ いない', (await ev(`${pushables}.length`)) <= 6, await ev(`${pushables}.length`));
  await shot('idle390.png');

  // ── 2. れば → とめる（人の タイミング）で そろう ──
  await click('#lever'); await sleep(300);
  ok('ればで まわりだす（3つとも spin）', await ev(`[0,1,2].every(i=>__kuru.state(i)==='spin')`));
  ok('まわっている あいだ おせる もの 6つ いない', (await ev(`${pushables}.length`)) <= 6, await ev(`${pushables}.map(e=>e.id||e.tagName+':'+e.textContent.trim().slice(0,6)).join(',')`));
  ok('おせる もの すべて 44px いじょう', await ev(`${pushables}.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})`));
  await shot('spin390.png');
  await ev(aim);
  let r = await ev(`__aim()`);
  ok('ねらって とめると そろう（1回め）', r === 'win', r);
  await sleep(500);
  ok('そろうと ごほうびの カードが でる', await ev(`!document.getElementById('card').hidden && document.getElementById('c-h').textContent.length>3`));
  ok('おいわい：かがやきの クラス', await ev(`document.getElementById('cab').classList.contains('win')`));
  await sleep(1800); await shot('win390.png');
  ok('ごほうびの がめんにも きんしごが ない', !BAN.test(await ev(`document.body.textContent`)));
  const snd1 = await ev(`window.__kuruSnd.slice()`);
  ok('おとが ならされた（コトン・やさしい 3おと）', snd1.length >= 6, snd1.length);
  ok('おとは すべて sine・80〜440Hz・たちあがり 30ms いじょう', snd1.length > 0 && snd1.every(s => s.type === 'sine' && s.hz >= 80 && s.hz <= 440 && s.attack >= 0.03 - 1e-9), JSON.stringify(snd1.map(s => s.hz)));

  // ── 3. れんだでは そろわない ──
  const mash = await ev(`(async () => {
    const raf = () => new Promise(r => requestAnimationFrame(r)); let wins = 0, near = 0; const N = 90;
    for (let t = 0; t < N; t++) {
      document.getElementById('lever').click(); await raf();
      const b = document.querySelectorAll('#stops button');
      b[0].click(); b[1].click(); b[2].click();     // ぜんぶ いっしゅんで れんだ
      while (__kuru.phase() === 'spin') await raf();
      await new Promise(r => setTimeout(r, 40));
      const l = document.getElementById('hut').dataset.last; if (l === 'win') wins++; if (l === 'near') near++;
    }
    return { wins, near, N };
  })()`);
  ok('れんだ（ぜんぶ いっしゅんで とめる）では そろわない（90回 中 8回 いか）', mash.wins <= 8, JSON.stringify(mash));
  const mash2 = await ev(`(async () => {
    const raf = () => new Promise(r => requestAnimationFrame(r)); let wins = 0; const N = 40;
    for (let t = 0; t < N; t++) {
      document.getElementById('lever').click(); await raf();
      const b = document.querySelectorAll('#stops button');
      for (let i = 0; i < 3; i++) { await new Promise(r => setTimeout(r, 70 + Math.random() * 60)); b[i].click(); }
      while (__kuru.phase() === 'spin') await raf(); await new Promise(r => setTimeout(r, 40));
      if (document.getElementById('hut').dataset.last === 'win') wins++;
    }
    return { wins, N };
  })()`);
  ok('はやい れんだ（70〜130ms ごと）でも そろわない（40回 中 6回 いか）', mash2.wins <= 6, JSON.stringify(mash2));

  // ── 4. ねらえば たいてい そろう ──
  let timedWins = 0; const T = 10;
  for (let t = 0; t < T; t++) { await ev(`document.getElementById('lever').click()`); await sleep(80); const l = await ev(`__aim()`); if (l === 'win') timedWins++; }
  ok('ねらって とめれば そろう（10回 中 8回 いじょう）', timedWins >= 8, timedWins + '/' + T);

  // ── 5. よかん：2つ そろうと のこりが ゆっくり・ランプが はやく ──
  await ev(`document.getElementById('lever').click()`); await sleep(100);
  const y = await ev(`(async()=>{ const K=__kuru, raf=()=>new Promise(r=>requestAnimationFrame(r)); const b=i=>document.querySelectorAll('#stops button')[i];
    b(0).click(); while(K.state(0)!=='stop') await raf(); const want=K.sym(0), v0=K.speed(2);
    for (let g=0;g<2000;g++){ await raf(); const p=K.pos(1),c=Math.round(p); if(K.symAt(1,c)===want&&p-c>-0.1&&p-c<0.12){ b(1).click(); break; } }
    while(K.state(1)!=='stop') await raf(); await new Promise(r=>setTimeout(r,60));
    const slow = K.speed(2), cls = document.getElementById('cab').classList.contains('yokan'), msg = document.getElementById('msg').textContent;
    const dur = parseFloat(getComputedStyle(document.querySelector('.lamp')).animationDuration)*1000;
    b(2).click(); while(K.phase()==='spin') await raf(); return {v0, slow, cls, msg, dur}; })()`);
  ok('よかん：のこりの まどが ゆっくり（0.5ばい いか）・ランプ・ひとこと', y.cls && y.slow <= y.v0 * 0.5 && y.msg.includes('そろいそう'), JSON.stringify(y));
  ok('ちらつき：よかんの ランプの しゅうきは 800ms いじょう（1.25回/秒 いか ＜ 3回/秒）', y.dur >= 800, y.dur);

  // ── 6. ちらつき：うごいている アニメーションを ぜんぶ 測る ──
  const anims = await ev(`(async()=>{ document.getElementById('lever').click(); await new Promise(r=>setTimeout(r,200)); return document.getAnimations().map(a=>{const t=a.effect.getTiming();return {d:t.duration,it:t.iterations,name:a.animationName||a.constructor.name}}); })()`);
  ok('くりかえす アニメーションは すべて 1しゅうき 800ms いじょう（3回/秒 みまん）', anims.every(a => a.it !== Infinity || a.d >= 800), JSON.stringify(anims));
  await ev(`(async()=>{ const K=__kuru; const raf=()=>new Promise(r=>requestAnimationFrame(r)); document.querySelectorAll('#stops button').forEach(b=>b.click()); while(K.phase()==='spin') await raf(); })()`);

  // ── 7. キーボード（スペース） ──
  await sleep(300);
  await ev(`document.activeElement&&document.activeElement.blur()`);
  await key(' ', 'Space'); await sleep(200);
  ok('スペースで れば（まわりだす）', await ev(`__kuru.phase()==='spin'`));
  await key(' ', 'Space'); await sleep(450);
  ok('スペースで ひとつ とまる（ひだりから）', await ev(`__kuru.state(0)==='stop' && __kuru.state(1)==='spin'`));
  await key(' ', 'Space'); await sleep(450); await key(' ', 'Space'); await sleep(900);
  ok('スペースで ぜんぶ とまる', await ev(`__kuru.phase()==='done'`));
  ok('よみあげ：aria-live（ひとこと）が ある', await ev(`document.getElementById('msg').getAttribute('aria-live')==='polite' && document.getElementById('live').getAttribute('aria-live')==='polite'`));

  // ── 8. 🔇 で ぜんぶ とまる ──
  await click('#ps-mute'); await sleep(200);
  const before = await ev(`__kuruSnd.length`);
  await ev(`document.getElementById('lever').click()`); await sleep(100); await ev(`__aim()`); await sleep(300);
  ok('🔇 を おすと おとが ならない', (await ev(`__kuruSnd.length`)) === before, before);
  await click('#ps-mute');

  // ── 9. らくちん：じどうで ゆっくり とまって そろう ──
  await ev(`document.querySelector('#more').open=true`);
  ok('らくちんボタンが あそびかたの なかに ある', await ev(`!!document.querySelector('#more #mode')`));
  await click('#mode'); await sleep(100);
  ok('らくちん に きりかわる', await ev(`__kuru.easy()===true && document.getElementById('mode').getAttribute('aria-pressed')==='true'`));
  await ev(`document.querySelector('#more').open=false`);
  let easyWins = 0, easySlow = true;
  for (let t = 0; t < 2; t++) {
    await ev(`document.getElementById('lever').click()`); await sleep(150);
    if (t === 0) easySlow = (await ev(`__kuru.speed(0)`)) <= 1.9;
    for (let g = 0; g < 80 && (await ev(`__kuru.phase()`)) === 'spin'; g++) await sleep(250);
    await sleep(300); if ((await ev(`document.getElementById('hut').dataset.last`)) === 'win') easyWins++;
  }
  ok('らくちん：なにも おさなくても じどうで とまって そろう（2回 中 2回）', easyWins === 2, easyWins);
  ok('らくちん：ふつうより ゆっくり（1びょうに 1.9こ いか）', easySlow);
  await click('#more summary'); await click('#mode'); await click('#more summary');

  // ── 10. うごきを へらす（OS の せってい）──
  await open(base, 390, 844, { reduce: true });
  await click('#lever'); await sleep(200);
  const rd = await ev(`({ v: [0,1,2].map(i=>__kuru.speed(i)), anims: document.getAnimations().length })`);
  ok('うごきを へらす：まわりが ゆっくり（ふつうの はんぶん いか）', rd.v[0] <= 1.7 && rd.v[2] <= 1.95, JSON.stringify(rd.v));
  ok('うごきを へらす：アニメーション 0', rd.anims === 0, rd.anims);
  await ev(aim); r = await ev(`__aim()`); await sleep(500);
  ok('うごきを へらす：ねらえば そろい、かがやきは うごかない', r === 'win' && (await ev(`document.getAnimations().length`)) === 0, r);
  // data-calm（つかいやすく する）
  await open(base, 390, 844);
  await ev(`localStorage.setItem('marufuwa-tsuri-v1', JSON.stringify({calm:true}))`);
  await send('Page.navigate', { url: base }); await sleep(1500);
  await click('#lever'); await sleep(200);
  ok('data-calm：まわりが ゆっくり・アニメーション 0', (await ev(`__kuru.speed(0)`)) <= 1.7 && (await ev(`document.getAnimations().length`)) === 0);
  await ev(`localStorage.removeItem('marufuwa-tsuri-v1')`);

  // ── 11. コントラスト 4.5:1（ぶんしの いろと はいけいの さいあくの くみあわせ）──
  await open(base, 390, 844);
  const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const cols = await ev(`(()=>{const g=(s,p)=>getComputedStyle(document.querySelector(s))[p];return {ink:g('h1','color'),ink2:g('.lead','color'),btn:g('#lever','color'),msg:g('#msg','color'),foot:g('#foot','color'),sum:g('#more summary','color')}})()`);
  const rgb = s => s.match(/\d+/g).slice(0, 3).map(Number);
  const worstDark = hex('#6a4228');   // はいけいの いちばん あかるい ところ
  const checks = [['みだし', cols.ink, worstDark], ['せつめい', cols.ink2, worstDark], ['あし', cols.foot, worstDark], ['ひとこと', cols.msg, hex('#33211a')], ['あそびかた', cols.sum, hex('#33211a')], ['ボタン(うえ)', cols.btn, hex('#ffdf9c')], ['ボタン(した)', cols.btn, hex('#f1b455')]];
  const lows = checks.filter(([n, f, b]) => cr(rgb(f), b) < 4.5).map(([n, f, b]) => n + ':' + cr(rgb(f), b).toFixed(2));
  ok('コントラスト 4.5:1 いじょう', lows.length === 0, lows.join(',') || checks.map(([n, f, b]) => n + ' ' + cr(rgb(f), b).toFixed(1)).join(' / '));

  // ── 12. English ──
  await open(base + '?lang=en', 390, 844);
  await ev(`new Promise(r=>setTimeout(r,600))`);
  await ev(`document.querySelector('#more').open=true`);
  await click('#lever'); await sleep(200);
  await ev(aim); await ev(`__aim()`); await sleep(1200);
  const en = await ev(`({ text: document.body.innerText, title: document.title, missing: window.TsuriEn && TsuriEn.missing ? TsuriEn.missing() : null, lang: window.TsuriEn && TsuriEn.lang })`);
  const jp = en.text.replace(/日本語（にほんご）/g, '').match(/[\u3040-\u30ff\u3400-\u9fff]+/g) || [];
  ok('English：がめんに にほんごが のこらない', en.lang === 'en' && jp.length === 0, jp.slice(0, 8).join('|') || en.title);
  ok('English：みやくの ない ことば（missing）が ない', !en.missing || en.missing.length === 0, JSON.stringify(en.missing));
  await shot('en390.png');
  await ev(`localStorage.setItem('marufuwa-tsuri-lang', 'ja')`);

  // ── 13. 1280 ──
  await open(base + '?lang=ja', 1280, 800);
  await click('#lever'); await sleep(300);
  await ev(aim); await ev(`__aim()`); await sleep(1800);
  await shot('win1280.png');
  ok('1280：よこに はみださない', await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));
  await open(base + '?lang=ja', 390, 844);
  ok('390：よこに はみださない', await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));

  ok('JS エラー 0（exception・console.error・ログの error）', errors.length === 0, errors.slice(0, 5).join(' || '));
  ws.close(); ch.kill(); server.close();
  const bad = results.filter(x => !x[0]); console.log(`\n${results.length - bad.length}/${results.length} 通過。しゃしん：${OUT}`);
  process.exit(bad.length ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
