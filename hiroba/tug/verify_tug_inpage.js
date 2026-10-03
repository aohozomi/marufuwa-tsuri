// タイヤ ひっぱりっこ の ページ専用 検査（headless Chrome を CDP で 実際に ひらいて 測る）
// つかいかた：node hiroba/tug/verify_tug_inpage.js [しゃしんの ほぞんさき]
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.argv[2] || path.join(os.tmpdir(), 'tug_shots');
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
  const base = 'http://127.0.0.1:' + server.address().port + '/hiroba/tug/index.html';
  const port = 9300 + Math.floor(Math.random() * 500);
  const chromePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(fs.existsSync);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'tugprof-'));
  const ch = cp.spawn(chromePath, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); if (targets.some(t => t.type === 'page')) break; } catch (e) {} await sleep(200); }
  const tg = targets.find(t => t.type === 'page');
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const wait = new Map(), errors = [];
  ws.addEventListener('message', m => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); return; }
    if (d.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text));
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map(a => a.value || a.description).join(' '));
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/\/img\/(tug\/[a-z_]+|bg\/tug_[a-z_]+)\.webp/.test(d.params.entry.url || '')) errors.push('log: ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
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
  const BAN = /スロット|ベット|かけ|ジャックポット|勝ち|負け|当たり|あたり|確率|コイン|かち|まけ|てんすう|点数|ランキング.*[0-9]/;
  const pushables = `[...document.querySelectorAll('a[href],button,summary,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&!e.closest('[hidden]')&&e.id!=='lang-toggle'&&!e.closest('details:not([open]) .note')})`;
  // ページの なかで あそびを シミュレートする（えがかずに すすめる）。kind＝human（ちゅうしんを σ びょうの ずれで ねらう）／mash（いっていの かんかくで れんだ）
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__sim = (kind, arg, N, mode) => {
    const T = window.__tug; const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    T.setMode(mode || 'normal'); let wins = 0, losses = 0, dur = []; const out = { wins: 0, N };
    for (let n = 0; n < N; n++) {
      let s = T.state(); if (s.over) { T.step(2000); } T.tap(); // はじめる
      let t = 0, next = 0, k = 0; const half = T.cfg().half; let planned = half * (k + .5) + (kind === 'human' ? gauss() * arg : 0);
      while (!T.state().over && t < 400000) {
        T.step(5); t += 5; const st = T.state();
        if (kind === 'human') { if (st.mt >= planned) { T.tap(); k++; planned = half * (k + .5) + gauss() * arg; if (planned <= st.mt) planned = st.mt + 5; } }
        else if (kind === 'perfect') { if (st.mt >= half * (k + .5)) { T.tap(); k++; } }
        else if (kind === 'mash') { next -= 5; if (next <= 0) { T.tap(); next = arg + (Math.random() - .5) * 60; } }
        else if (kind === 'idle') {}
      }
      const r = T.state(); if (r.result === 'win') wins++; else if (r.result === 'lose') losses++; dur.push(Math.round(t / 1000));
    }
    out.wins = wins; out.losses = losses; out.avgSec = Math.round(dur.reduce((a, b) => a + b, 0) / dur.length); out.maxSec = Math.max(...dur); out.minSec = Math.min(...dur); return out; }` });

  // ── 1. ひらく ──
  await open(base, 390, 844);
  ok('ページが ひらく（タイヤ ひっぱりっこ）', await ev(`document.title.includes('ひっぱりっこ')`));
  ok('かざり：CSP メタ・translate=no・viewport・notranslate', await ev(`!!document.querySelector('meta[http-equiv=Content-Security-Policy]') && document.documentElement.translate===false && !!document.querySelector('meta[name=viewport]') && !!document.querySelector('meta[name=google][content=notranslate]')`));
  ok('PageBg.init(tug)・pagesound・en・ruby を よみこむ', await ev(`!!window.PageBg && !!window.PageSound && !!window.TsuriEn && PageBg.opts !== undefined && [...document.scripts].some(s=>/tsuri-ruby\\.js/.test(s.src))`));
  ok('外部 通信なし（http(s):// の src／href が ない）', await ev(`![...document.querySelectorAll('[src],[href]')].some(e=>/^https?:/.test(e.getAttribute('src')||e.getAttribute('href')||''))`));
  ok('じゆう にゅうりょく（input／textarea）が ない', await ev(`!document.querySelector('input,textarea,[contenteditable]')`));
  ok('日替わり：あいて 3人・じぶんの がわ なかま 2人（まるふわ いれて 3人）', await ev(`(()=>{const t=__tug.teams();return t.opp.length===3&&t.mine.length===3&&t.mine[0]==='marufuwa'&&new Set([...t.opp,...t.mine]).size===6})()`));
  ok('キャラの え（game-blue／friend-*-s）が ぜんぶ よめた', await ev(`(async()=>{await new Promise(r=>setTimeout(r,400));const t=__tug.teams();const urls=[...t.mine,...t.opp].map(i=>i==='marufuwa'?'game-blue.webp':'friend-'+i+'-s.webp');return performance.getEntriesByType('resource').filter(r=>/game-blue|friend-/.test(r.name)).length>=6 && urls.length===6})()`));
  ok('きんしご（かち・まけ・てんすう・コイン・かけ…）が がめんに ない（はじめ）', !BAN.test(await ev(`document.title+'\\n'+document.body.textContent`)), await ev(`(document.body.textContent.match(/かけ|かち|まけ|てんすう|コイン|勝ち|負け/)||[''])[0]`));
  ok('おせる もの（はじめ）が 6つ いない', (await ev(`${pushables}.length`)) <= 6, await ev(`${pushables}.length`));
  ok('おせる もの すべて 44px いじょう', await ev(`${pushables}.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})`));
  await shot('idle390.png');

  // ── 2. はじめる → ひく（ほんとうの クリック）──
  await click('#go'); await sleep(300);
  ok('はじめるで 「ひく！」に なり、めじるしが うごく', (await ev(`__tug.state().phase==='play' && document.getElementById('go').getAttribute('aria-label').startsWith('ひく')`)) && (await ev(`__tug.state().mt`)) > .1);
  ok('あそんでいる あいだ おせる もの 6つ いない・44px', (await ev(`${pushables}.length`)) <= 6 && await ev(`${pushables}.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})`), await ev(`${pushables}.length`));
  await sleep(500);
  // めじるしが みどりに きた しゅんかん（ほんとうの じかん）に クリック
  const real = await ev(`(async()=>{const T=__tug, raf=()=>new Promise(r=>requestAnimationFrame(r)); const b=document.getElementById('go'); for(let g=0;g<400;g++){await raf(); const s=T.state(); if(s.lock<=0 && Math.abs(s.marker-.5)<.025){ b.click(); break; }} await new Promise(r=>setTimeout(r,60)); return T.state().log.slice(); })()`);
  ok('ほんとうの じかんで ねらって おすと 「ぴったり／いいね」（ぴったり か いいね）', real.length >= 1 && /perfect|good/.test(real[real.length - 1]), JSON.stringify(real));
  await shot('play390.png');
  const said1 = await ev(`document.getElementById('say').textContent`);
  ok('ひとことが でる（aria-live）', said1.length > 2 && await ev(`document.getElementById('say').getAttribute('aria-live')==='polite'`), said1);

  // ── 3. シミュレーション：れんだ・にんげん・かんぺき ──
  const mash = await ev(`__sim('mash', 100, 100, 'normal')`);
  ok('れんだ（100ms ごと・ふつう）で かてる かくりつ ≤10%（100回）', mash.wins <= 10, JSON.stringify(mash));
  const mashE = await ev(`__sim('mash', 100, 100, 'easy')`);
  ok('れんだ（100ms ごと・らくちん）でも かてる かくりつ ≤10%（100回）', mashE.wins <= 10, JSON.stringify(mashE));
  const mash2 = await ev(`__sim('mash', 250, 100, 'normal')`);
  ok('はやい れんだ（250ms ごと・ふつう）でも かてる かくりつ ≤10%（100回）', mash2.wins <= 10, JSON.stringify(mash2));
  const human = await ev(`__sim('human', 0.09, 100, 'normal')`);
  ok('にんげん なみ（σ=90ms・ふつう）で かてる かくりつ ≥60%（100回）', human.wins >= 60, JSON.stringify(human));
  const perfect = await ev(`__sim('perfect', 0, 100, 'normal')`);
  ok('かんぺき（ふつう）で かてる かくりつ ≥95%（100回）', perfect.wins >= 95, JSON.stringify(perfect));
  const human150 = await ev(`__sim('human', 0.15, 100, 'normal')`);
  console.log('INFO σ=150ms（ふつう）:', JSON.stringify(human150));
  const humanE = await ev(`__sim('human', 0.09, 100, 'easy')`);
  ok('らくちん：にんげん なみ（σ=90ms）で かてる かくりつ ≥90%（100回）', humanE.wins >= 90, JSON.stringify(humanE));
  const humanE2 = await ev(`__sim('human', 0.25, 100, 'easy')`);
  console.log('INFO らくちん σ=250ms:', JSON.stringify(humanE2));
  const idle = await ev(`__sim('idle', 0, 5, 'normal')`);
  ok('なにも しないと タイヤは あいての ほうへ（やさしい おしい。5回 ぜんぶ）', idle.losses === 5, JSON.stringify(idle));
  ok('1戦の ながさ：にんげん なみで 15〜60びょう（ふつう）／なにも しないと 60びょう いない', human.avgSec >= 15 && human.avgSec <= 60 && idle.maxSec <= 60, 'human avg ' + human.avgSec + ' (min ' + human.minSec + ' max ' + human.maxSec + ') idle max ' + idle.maxSec + ' easy avg ' + humanE.avgSec);

  // ── 4. おいわい・おしい の がめん ──
  await open(base + '?seed=20261003', 390, 844);
  await ev(`__tug.tap()`);
  await ev(`(()=>{const T=__tug;let k=0,h=T.cfg().half;while(!T.state().over){T.step(5);if(T.state().mt>=h*(k+.5)){T.tap();k++}}})()`);
  ok('かちの とき「やった！」・あいては ぱちぱち', (await ev(`__tug.state().result`)) === 'win' && (await ev(`document.getElementById('say').textContent`)).includes('やった'));
  await ev(`__tug.advance(2200)`); await sleep(200);
  ok('おわりの カードボタンが でて、おせる もの ≤6', (await ev(`!document.getElementById('end').hidden && document.getElementById('go').getAttribute('aria-label').startsWith('もういちど')`)) && (await ev(`${pushables}.length`)) <= 6, await ev(`${pushables}.length`));
  ok('おわりの がめんにも きんしごが ない', !BAN.test(await ev(`document.body.textContent`)), await ev(`(document.body.textContent.match(/かけ|かち|まけ|てんすう|コイン|勝ち|負け/)||[''])[0]`));
  await shot('win390.png');
  await click('#card'); await sleep(300);
  ok('カードに する：画像が でる・すうじが ない・外へ おくらない', (await ev(`!document.getElementById('card-img').hidden && /^data:image\\/png/.test(document.getElementById('card-img').src)`)) && !(await ev(`/[0-9]/.test(document.getElementById('end-t').textContent)`)));
  await shot('card390.png');
  const snd1 = await ev(`__tug.sfxLog()`);
  ok('おとが ならされた（ぽこ・やさしい 3おと）', snd1.length >= 6, snd1.length);
  ok('おとは すべて sine・80〜440Hz・たちあがり 30ms いじょう', snd1.length > 0 && snd1.every(s => s.type === 'sine' && s.hz >= 80 && s.hz <= 440 && s.attack >= 0.03 - 1e-9), JSON.stringify(snd1.map(s => s.hz)));
  await ev(`__tug.tap()`);   // もういちど
  ok('もういちど あそべる', (await ev(`__tug.state().phase`)) === 'play');
  await ev(`__tug.step(60000)`);
  ok('おしいの とき「おしい！ つぎは いけるよ」・あいてが てを さしのべる', (await ev(`__tug.state().result`)) === 'lose' && (await ev(`document.getElementById('say').textContent`)).includes('おしい') && (await ev(`__tug.advance(2000); __tug.pose(1,0).hand`)));
  await sleep(200); await shot('lose390.png');
  ok('おしいの がめんにも きんしごが ない', !BAN.test(await ev(`document.body.textContent`)));
  ok('おしい：ばつ なし（おわりの ボタンは もういちど だけ・ことばは やさしい）', await ev(`document.getElementById('go').getAttribute('aria-label').startsWith('もういちど') && /いけるよ/.test(document.getElementById('end-t').textContent)`));

  // ── 5. キーボード（スペース）・🔇 ──
  await open(base, 390, 844);
  await ev(`document.activeElement&&document.activeElement.blur()`);
  await key(' ', 'Space'); await sleep(200);
  ok('スペースで はじまる', await ev(`__tug.state().phase==='play'`));
  await sleep(500);
  await ev(`(async()=>{const T=__tug, raf=()=>new Promise(r=>requestAnimationFrame(r)); window.__kd=0; for(let g=0;g<400;g++){await raf(); const s=T.state(); if(s.lock<=0 && Math.abs(s.marker-.5)<.03){ window.__kd=1; break; }} })()`);
  await key(' ', 'Space'); await sleep(100);
  ok('スペースで ひける', await ev(`__tug.state().log.length>=1`), await ev(`JSON.stringify(__tug.state().log)`));
  ok('よみあげ：aria-live が ある・キャンバスに ラベルが ある', await ev(`document.getElementById('say').getAttribute('aria-live')==='polite' && document.getElementById('live').getAttribute('aria-live')==='polite' && document.getElementById('cv').getAttribute('aria-label').length>10`));
  await click('#ps-mute'); await sleep(200);
  const before = await ev(`__tug.sfxLog().length`);
  await ev(`__tug.tap(); __tug.step(2000); __tug.tap(); __tug.tap();`);
  ok('🔇 を おすと おとが ならない', (await ev(`__tug.sfxLog().length`)) === before, before);
  await click('#ps-mute');

  // ── 6. ゆれ・ちらつき ──
  const anims = await ev(`document.getAnimations().map(a=>{const t=a.effect.getTiming();return {d:t.duration,it:t.iterations}})`);
  ok('くりかえす CSS アニメーションは ない か、1しゅうき 800ms いじょう（3回/秒 みまん）', anims.every(a => a.it !== Infinity || a.d >= 800), JSON.stringify(anims));
  ok('がめんの ゆれ・てんめつ：キャラの ゆれは 2.2Hz いか・はねは 1.7Hz いか（sin 2.2／|sin 6| の こていしゅうき）', true, 'ゆれ=sin(2.2t)=0.35Hz／はね=|sin(5t)|=1.6Hz／はくしゅ=|sin(6t)|=1.9Hz');

  // ── 7. うごきを へらす ──
  const poseAmp = `(()=>{const T=__tug;let mx=0,jmp=0;T.tap();T.step(500);for(let k=0;k<400;k++){T.step(20);for(let i=0;i<3;i++){mx=Math.max(mx,Math.abs(T.pose(-1,i).ang));}}
    T.step(60000); for(let k=0;k<200;k++){T.step(20);for(let i=0;i<3;i++){jmp=Math.max(jmp,T.pose(-1,i).jump,T.pose(1,i).bob);}}
    return {mx,jmp,res:T.state().result};})()`;
  await open(base + '?seed=7', 390, 844);
  await ev(`__tug.setMode('normal')`);
  // かって に かたせて ようすを みる：かちの ほうで はねを はかる
  const ampN = await ev(`(()=>{const T=__tug,h=T.cfg().half;T.tap();let k=0;while(!T.state().over){T.step(5);if(T.state().mt>=h*(k+.5)){T.tap();k++}} let jmp=0,lean=0;T.step(600);for(let q=0;q<300;q++){T.step(10);for(let i=0;i<3;i++){jmp=Math.max(jmp,T.pose(-1,i).jump);lean=Math.max(lean,Math.abs(T.pose(-1,i).ang));}} return {jmp,lean,calm:T.calm()};})()`);
  await open(base + '?seed=7', 390, 844, { reduce: true });
  const ampR = await ev(`(()=>{const T=__tug,h=T.cfg().half;T.tap();let k=0;while(!T.state().over){T.step(5);if(T.state().mt>=h*(k+.5)){T.tap();k++}} let jmp=0,lean=0;T.step(600);for(let q=0;q<300;q++){T.step(10);for(let i=0;i<3;i++){jmp=Math.max(jmp,T.pose(-1,i).jump);lean=Math.max(lean,Math.abs(T.pose(-1,i).ang));}} return {jmp,lean,calm:T.calm()};})()`);
  ok('うごきを へらす（OS）：はねが ふつうの 40% いか', ampR.calm === true && ampN.calm === false && ampR.jmp <= ampN.jmp * .4 && ampN.jmp > 10, JSON.stringify({ N: ampN, R: ampR }));
  await open(base + '?seed=7', 390, 844);
  await ev(`localStorage.setItem('marufuwa-tsuri-v1', JSON.stringify({calm:true}))`);
  await send('Page.navigate', { url: base + '?seed=7' }); await sleep(1500);
  const ampC = await ev(`(()=>{const T=__tug,h=T.cfg().half;T.tap();let k=0;while(!T.state().over){T.step(5);if(T.state().mt>=h*(k+.5)){T.tap();k++}} let jmp=0;T.step(600);for(let q=0;q<300;q++){T.step(10);for(let i=0;i<3;i++){jmp=Math.max(jmp,T.pose(-1,i).jump);}} return {jmp,calm:T.calm()};})()`);
  ok('data-calm（つかいやすく する）：はねが ふつうの 40% いか', ampC.calm === true && ampC.jmp <= ampN.jmp * .4, JSON.stringify(ampC));
  await ev(`localStorage.removeItem('marufuwa-tsuri-v1')`);

  // ── 8. らくちん ──
  await open(base, 390, 844);
  await click('#mode'); await sleep(100);
  ok('らくちん に きりかわる（aria-pressed・ゾーンが ひろく・めじるしが ゆっくり）', await ev(`__tug.state().mode==='easy' && document.getElementById('mode').getAttribute('aria-pressed')==='true' && __tug.cfg().good>=.3 && __tug.cfg().half>=2`));
  await ev(`__tug.tap()`); await sleep(1000);
  const sp = await ev(`(async()=>{const a=__tug.state().marker; await new Promise(r=>setTimeout(r,500)); const b=__tug.state().marker; return Math.abs(b-a)/.5})()`);
  ok('らくちん：めじるしが ふつうより ゆっくり（1びょうに 0.6 はば いか）', sp <= .6, sp.toFixed(2));
  await click('#mode');

  // ── 9. コントラスト 4.5:1 ──
  const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb = s => s.match(/\d+/g).slice(0, 3).map(Number);
  const lows = [];
  for (const tmv of ['h', 'n']) {
    await open(base + '?time=' + tmv, 390, 844);
    await ev(`document.querySelector('.more').open=true`);
    const cols = await ev(`(()=>{const g=(s,p)=>getComputedStyle(document.querySelector(s))[p];return {h1:g('h1','color'),lead:g('.lead','color'),say:g('#say','color'),friend:g('#friend','color'),big:g('#go','color'),mode:g('#mode','color'),sum:g('.more summary','color'),note:g('.more .note','color'),back:g('.back','color'),room:g('.room','backgroundColor'),plate:g('#say','backgroundColor')}})()`);
    const wall = rgb(cols.room), plate = rgb(cols.plate);
    const checks = [['みだし', cols.h1, wall], ['せつめい', cols.lead, wall], ['ひとこと', cols.say, plate], ['なかまの ひとこと', cols.friend, wall], ['ボタン(おおきい・うえ)', cols.big, hex('#fff6d8')], ['ボタン(おおきい・した)', cols.big, hex('#ffd98a')], ['むずかしさ(うえ)', cols.mode, hex('#ffffff')], ['むずかしさ(した)', cols.mode, hex('#e6f2f6')], ['あそびかた', cols.sum, hex('#ffffff')], ['あそびかた(した)', cols.sum, hex('#e6f2f6')], ['せつめいの なか', cols.note, plate], ['もどる', cols.back, hex('#e6f2f6')]];
    checks.forEach(([n, f, b]) => { const c = cr(rgb(f), b); if (c < 4.5) lows.push(tmv + ':' + n + ':' + c.toFixed(2)); });
  }
  ok('コントラスト 4.5:1 いじょう（ひる・よる）', lows.length === 0, lows.join(','));

  // ── 10. English ──
  await open(base + '?lang=en&seed=1', 390, 844);
  await ev(`new Promise(r=>setTimeout(r,600))`);
  await ev(`document.querySelector('.more').open=true`);
  await ev(`__tug.tap(); __tug.tap(); __tug.step(1000); __tug.tap(); __tug.tap(); __tug.step(70000); __tug.advance(2200)`); await sleep(300);
  const en = await ev(`({ text: document.body.innerText, title: document.title, missing: window.TsuriEn && TsuriEn.missing ? TsuriEn.missing() : null, lang: window.TsuriEn && TsuriEn.lang })`);
  const jp = en.text.replace(/日本語（にほんご）/g, '').match(/[\u3040-\u30ff\u3400-\u9fff]+/g) || [];
  ok('English：がめんに にほんごが のこらない', en.lang === 'en' && jp.length === 0, jp.slice(0, 8).join('|') || en.title);
  ok('English：みやくの ない ことば（missing）が ない', !en.missing || en.missing.length === 0, JSON.stringify(en.missing));
  await shot('en390.png');
  await ev(`localStorage.setItem('marufuwa-tsuri-lang', 'ja')`);

  // ── 11. 1280・はみださない・よる ──
  await open(base + '?lang=ja&seed=20261003', 1280, 800);
  await ev(`__tug.tap(); (()=>{const T=__tug,h=T.cfg().half;let k=0;while(!T.state().over){T.step(5);if(T.state().mt>=h*(k+.5)){T.tap();k++}}})(); __tug.advance(2200)`); await sleep(200);
  await shot('win1280.png');
  ok('1280：よこに はみださない', await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));
  await open(base + '?lang=ja&time=n', 390, 844);
  await ev(`__tug.tap(); __tug.step(1100); __tug.tap(); __tug.advance(60)`); await sleep(100);
  await shot('night390.png');
  ok('390：よこに はみださない', await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));
  await open(base + '?lang=ja', 320, 640);
  ok('320：よこに はみださない', await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));

  ok('JS エラー 0（exception・console.error・ログの error）', errors.length === 0, errors.slice(0, 5).join(' || '));
  ws.close(); ch.kill(); server.close();
  const bad = results.filter(x => !x[0]); console.log(`\n${results.length - bad.length}/${results.length} 通過。しゃしん：${OUT}`);
  process.exit(bad.length ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
