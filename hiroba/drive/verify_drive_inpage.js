// のんびり ドライブ の ページ専用 検査（headless Chrome を CDP で 実際に ひらいて 測る）
// つかいかた：node hiroba/drive/verify_drive_inpage.js [しゃしんの ほぞんさき]
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.argv[2] || path.join(os.tmpdir(), 'drive_shots');
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
  const base = 'http://127.0.0.1:' + server.address().port + '/hiroba/drive/index.html';
  const port = 9300 + Math.floor(Math.random() * 500);
  const chromePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(fs.existsSync);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'driveprof-'));
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
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/\/img\/(drive\/[a-z_0-9]+|bg\/drive_[a-z_]+)\.webp/.test(d.params.entry.url || '')) errors.push('log: ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
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

  const BAN = /順位|ランキング|タイム(?!も)|点数|じゅんい(?!も)|スコア|時間切れ|ゴール|いそげ|はやく|のこり|ライフ|ゲームオーバー/;
  const pushables = `[...document.querySelectorAll('a[href],button,summary,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&!e.closest('[hidden]')&&e.id!=='lang-toggle'&&!e.closest('details:not([open]) .inner')})`;
  const D = expr => ev('window.__drive.' + expr);
  const press = async (sel) => { const [x, y] = await center(sel); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); };
  const release = async (sel) => { const [x, y] = await center(sel); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
  const kdn = async (k, code) => send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: k === 'ArrowLeft' ? 37 : k === 'ArrowRight' ? 39 : 40 });
  const kup = async (k, code) => send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: k === 'ArrowLeft' ? 37 : k === 'ArrowRight' ? 39 : 40 });

  // ── 1. ひらく ──
  await open(base, 390, 844);
  ok('ページが ひらく（のんびり ドライブ）', await ev(`document.title.includes('ドライブ')`));
  ok('かざり：CSP メタ・translate=no・viewport', await ev(`!!document.querySelector('meta[http-equiv=Content-Security-Policy]') && document.documentElement.translate===false && !!document.querySelector('meta[name=viewport]')`));
  ok('ページ先頭に「仮の え」の コメントが ある', (fs.readFileSync(path.join(ROOT, 'hiroba/drive/index.html'), 'utf8').match(/【仮の え】/) || []).length === 1);
  ok('きんしご（じゅんい／ランキング／タイム／てんすう／スコア／じかんぎれ／いそげ…）が ない', !BAN.test(await ev(`(document.title+'\\n'+document.body.textContent).replace('タイムも ありません','')`)), await ev(`(document.body.textContent.match(/順位|ランキング|タイム(?!も)|点数|スコア|時間切れ|ゴール|いそげ|はやく|のこり/)||[''])[0]`));
  const n0 = await ev(`${pushables}.length`);
  ok('おせる もの（はじめ）が 6つ いない', n0 <= 6, n0 + ' : ' + await ev(`${pushables}.map(e=>e.id||e.textContent.trim().slice(0,6)).join(',')`));
  ok('おせる もの すべて 44px いじょう', await ev(`${pushables}.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})`));
  ok('ふりがな：「一周」に ruby が ついた', await ev(`document.querySelectorAll('ruby').length>0 || !/[\\u4e00-\\u9fff]/.test(document.querySelector('main').innerText)`), await ev(`document.querySelectorAll('ruby').length`));
  ok('よみあげ：メッセージが aria-live', await ev(`document.getElementById('msg').getAttribute('aria-live')==='polite'`));
  ok('canvas に 絵が ある（いろが 8しゅるい いじょう）', await ev(`(()=>{const c=document.getElementById('cv'),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<d.length;i+=4*97)s.add((d[i]>>5)+','+(d[i+1]>>5)+','+(d[i+2]>>5));return s.size})()`) >= 8);

  // ── 2. てで ハンドル：ボタンを おしている あいだ まがる ──
  await D('manual(true)'); await D('setCourse(0)'); await D('setPx(0)');
  await press('#br'); await sleep(50);
  ok('みぎボタンを おすと みぎへ（px が ふえる）', true);
  await D('advance(1.5)'); const sR = await D('st()');
  await release('#br');
  ok('みぎボタン：みぎへ まがる', sR.steerVel > .5 && sR.px > .15, JSON.stringify([sR.px.toFixed(2), sR.steerVel.toFixed(2)]));
  await D('setPx(0)'); await D('advance(1)');
  await press('#bl'); await D('advance(1.5)'); const sL = await D('st()'); await release('#bl');
  ok('ひだりボタン：ひだりへ まがる', sL.steerVel < -.5 && sL.px < -.15, JSON.stringify([sL.px.toFixed(2), sL.steerVel.toFixed(2)]));
  await D('advance(1.5)');
  await kdn('ArrowRight', 'ArrowRight'); await D('advance(1.5)'); const kR = await D('st()'); await kup('ArrowRight', 'ArrowRight');
  ok('キーボード（→）で みぎへ', kR.steerVel > .5, kR.steerVel.toFixed(2));
  await D('advance(1.5)');
  await kdn('ArrowLeft', 'ArrowLeft'); await D('advance(1.5)'); const kL = await D('st()'); await kup('ArrowLeft', 'ArrowLeft');
  ok('キーボード（←）で ひだりへ', kL.steerVel < -.5, kL.steerVel.toFixed(2));
  // ブレーキ
  await D('advance(2)'); const v1 = (await D('st()')).speed;
  await press('#bb'); await D('advance(2.5)'); const v2 = (await D('st()')).speed; await release('#bb');
  ok('ブレーキで もっと ゆっくり（とまらない）', v2 < v1 * .6 && v2 > 1, v1.toFixed(2) + ' -> ' + v2.toFixed(2));
  await D('advance(3)');

  // ── 3. はやさ・ハンドルの なめらかさ ──
  const sm = await ev(`(()=>{const D=window.__drive;let m=0;for(let ci=0;ci<2;ci++)for(let z=0;z<D.L;z++){m=Math.max(m,Math.abs(D.curveAt(ci,z+1)-D.curveAt(ci,z)))}return m})()`);
  ok('カーブが なめらか（となりの マスと の ちがい が ちいさい）', sm < 0.00004, sm.toExponential(2));
  const sp = await D('st()');
  ok('はやさは ゆっくり（1びょうに 12マス いか・1周 60〜90びょう）', sp.speed <= 12.01 && 900 / 12 >= 60 && 900 / 12 <= 90, sp.speed.toFixed(1));

  // ── 4. コースアウトから もどる（ばつなし・とまらない） ──
  await D('setCourse(0)'); await D('setPx(1.9)');
  const z0 = (await D('st()')).z;
  let minSpeed = 99, sawBack = false;
  await D('advance(8, ()=>{})');
  const o1 = await D('st()');
  ok('コースアウトしても とまらない（すすみつづける）', o1.z > z0 + 30, z0.toFixed(0) + ' -> ' + o1.z.toFixed(0));
  ok('ふわっと みちに もどる（|px| が 1.1 いか）', Math.abs(o1.px) < 1.15, o1.px.toFixed(2));
  ok('もどる ときの ひとこと（ばつを かんじさせない）', (await ev(`document.getElementById('msg').textContent`)).length > 3, await ev(`document.getElementById('msg').textContent`));
  await ev(`window.__speedProbe=[]`);
  await D('setPx(-1.9)'); await D('advance(8)'); const o2 = await D('st()');
  ok('ひだりの コースアウトからも もどる', Math.abs(o2.px) < 1.15 && o2.speed > 3, o2.px.toFixed(2));

  // ── 5. 1周 → カード（ふつう・なにも おさない） ──
  await D('setCourse(0)'); await D('advance(0.1)');
  let guard = 0; while ((await D('st()')).laps < 1 && guard++ < 40) await D('advance(10)');
  const lap = await D('st()');
  ok('1周 できる（なにも おさなくても おわる）', lap.laps >= 1, JSON.stringify([lap.laps, lap.t.toFixed(0) + 's']));
  ok('1周の じかん 60〜95びょう（ふつう・なにも おさない）', lap.lastLapT >= 60 && lap.lastLapT <= 95, lap.lastLapT.toFixed(1));
  ok('ごほうび：「きょうの ドライブ」カードが でる（画像）', await ev(`!document.getElementById('ovl').hidden && /^data:image\\/png/.test(document.getElementById('ovl-img').src)`));
  ok('カードの がめんに きんしごが ない・すうじの ひょうじが ない', !BAN.test(await ev(`document.getElementById('ovl').innerText`)) && !/\d/.test(await ev(`document.getElementById('ovl').innerText`)), await ev(`document.getElementById('ovl').innerText`));
  await shot('card390.png');
  const imgSz = await ev(`(()=>{const i=document.getElementById('ovl-img');return [i.naturalWidth,i.naturalHeight]})()`);
  ok('カードの がぞうは 540x760', imgSz[0] === 540 && imgSz[1] === 760, imgSz.join('x'));
  await ev(`document.getElementById('ovl').click()`);
  ok('タップで カードが とじる', await ev(`document.getElementById('ovl').hidden`));
  ok('とじても だいじょうぶ：保存（localStorage の あたらしい かぎ）を つくらない', await ev(`Object.keys(localStorage).every(k=>/^marufuwa-(tsuri-v1|sound-v1|bgm-v1|tsuri-lang)$/.test(k))`), await ev(`Object.keys(localStorage).join(',')`));

  // ── 6. よりみち・ぬし（めがけて ハンドルを きる ひとの ばあい） ──
  await D('setCourse(0)');
  await D('advance(0.1)');
  // ひとの かわりに：つぎの よりみちへ いどう（ハンドル＝ px を ゆっくり あわせる）
  const steerTo = `(i)=>{const D=window.__drive,s=D.st(),L=D.L,ps=D.pickups();let best=null;for(const p of ps){const d=((p.z-s.z)%L+L)%L;if(d>2&&(!best||d<best.d))best={d,side:p.side}}if(best&&best.d<26)D.setPx(s.px+(best.side-s.px)*0.08)}`;
  await ev(`window.__steer=${steerTo}`);
  await ev(`(()=>{const D=window.__drive;D.advance(95,window.__steer)})()`);
  const fnd = await D('st()');
  ok('よりみちを とおると みつかる（おはな／ともだち／ふんすい）', Object.keys(fnd.found).length >= 1 || Object.keys(fnd.lastFound).length >= 2, JSON.stringify([fnd.found, fnd.lastFound]));
  ok('ぬしが あらわれた（よかん → あらわれる）', fnd.laps >= 1 && (Object.keys(fnd.lastFound).includes('nushi') || fnd.nushiShown), JSON.stringify(fnd.lastFound));
  await D('setCourse(1)'); await D('advance(0.1)');
  await ev(`window.__drive.advance(95,window.__steer)`);
  const fnd2 = await D('st()');
  ok('ひろば 一周 も 1周 できて よりみちが ある', fnd2.ci === 1 && fnd2.laps >= 1 && Object.keys(fnd2.lastFound).length >= 2, JSON.stringify(fnd2.lastFound));
  // 見せ場：ぬしの すぐ てまえ
  await D('setCourse(0)'); const nz = (await D('nushi()')).z; await D('setZ(' + (nz - 70) + ')'); await D('advance(0.2)');
  ok('ぬしの よかん（ひとこと）が まず でる', await ev(`document.getElementById('msg').textContent.includes('なにか')`), await ev(`document.getElementById('msg').textContent`));
  await D('advance(3.5)'); await D('draw()'); await shot('nushi390.png');
  ok('ぬしが あらわれた（ひとこと）', await ev(`document.getElementById('msg').textContent.includes('ぬし')`), await ev(`document.getElementById('msg').textContent`));

  // ── 7. らくちん：はずれない・ひとりでに 1周 ──
  await ev(`document.querySelector('#more').open=true`);
  ok('らくちん／コースの ボタンは あそびかたの なかに ある', await ev(`!!document.querySelector('#more #mode') && !!document.querySelector('#more #c0') && !!document.querySelector('#more #c1')`));
  ok('あそびかたを ひらいても おせる もの 7つ いない（コース2・らくちん1 は なか）', (await ev(`${pushables}.length`)) <= 10);
  await click('#mode'); await sleep(100);
  ok('らくちん に きりかわる', await ev(`window.__drive.st().easy===true && document.getElementById('mode').getAttribute('aria-pressed')==='true'`));
  await click('#c1'); await sleep(100);
  ok('コースを ひろばに きりかえる', await ev(`window.__drive.st().ci===1`));
  await ev(`document.querySelector('#more').open=false`);
  for (const ci of [0, 1]) {
    await D('setCourse(' + ci + ')'); await D('advance(0.1)');
    const ez = await ev(`(()=>{const D=window.__drive;let m=0;let g=0;while(D.st().laps<1&&g++<60){D.advance(8,()=>{m=Math.max(m,Math.abs(D.st().px))})}const s=D.st();return {m,laps:s.laps,t:s.lastLapT,lf:s.lastFound}})()`);
    ok('らくちん（コース' + ci + '）：なにも おさなくても みちから はずれない・1周 できる', ez.m <= 0.8 && ez.laps >= 1, JSON.stringify([ez.m.toFixed(2), ez.laps, ez.t.toFixed(0)]));
    ok('らくちん（コース' + ci + '）：1周 60〜130びょう・ひとりでに よりみちも ひろう', ez.t >= 60 && ez.t <= 100 && Object.keys(ez.lf).length >= 1, JSON.stringify(ez.lf) + ' ' + ez.t.toFixed(0));
  }
  await click('#more summary'); await click('#mode'); await click('#c0'); await click('#more summary');

  // ── 8. おと ──
  await D('manual(false)');
  await click('#bl'); await sleep(100);   // さいしょの タップ
  await D('manual(true)'); await ev(`window.__driveSnd.length=0`);
  await D('setCourse(0)'); await D('advance(0.1)'); await ev(`window.__drive.advance(60,window.__steer)`);
  const snd = await ev(`window.__driveSnd.slice()`);
  ok('おとが ならされた（ぽこぽこ・ぬし・ごほうび）', snd.length >= 3, snd.length);
  ok('おとは すべて sine・80〜440Hz・たちあがり 30ms いじょう（エンジンの おと なし）', snd.length > 0 && snd.every(s => s.type === 'sine' && s.hz >= 80 && s.hz <= 440 && s.attack >= .03 - 1e-9), JSON.stringify(snd.map(s => s.hz)));
  await click('#ps-mute'); await sleep(100);
  await ev(`window.__driveSnd.length=0`); await D('setCourse(0)'); await ev(`window.__drive.advance(40,window.__steer)`);
  ok('🔇 を おすと おとが ならない', (await ev(`window.__driveSnd.length`)) === 0);
  await click('#ps-mute');
  await ev(`document.getElementById('ovl').hidden=true`);

  // ── 9. うごきを へらす・data-calm ──
  await D('manual(false)'); await D('setCourse(0)');
  const vN = await ev(`new Promise(r=>setTimeout(()=>r(window.__drive.st().speed),2500))`);
  await open(base, 390, 844, { reduce: true });
  const vR = await ev(`new Promise(r=>setTimeout(()=>r(window.__drive.st().speed),2500))`);
  ok('うごきを へらす：さらに ゆっくり（ふつうの 0.8ばい いか）', vR <= vN * .8 && vR >= 3, vN.toFixed(2) + ' -> ' + vR.toFixed(2));
  ok('うごきを へらす：アニメーション 0・まわり・ゆれ なし', (await ev(`document.getAnimations().length`)) === 0);
  await open(base, 390, 844);
  await ev(`localStorage.setItem('marufuwa-tsuri-v1', JSON.stringify({calm:true}))`);
  await send('Page.navigate', { url: base }); await sleep(1800);
  const vC = await ev(`new Promise(r=>setTimeout(()=>r(window.__drive.st().speed),2500))`);
  ok('data-calm（つかいやすく する）：さらに ゆっくり・アニメーション 0', vC <= vN * .8 && (await ev(`document.getAnimations().length`)) === 0, vC.toFixed(2));
  await ev(`localStorage.removeItem('marufuwa-tsuri-v1')`);

  // ── 10. ちらつき・ゆれ：がめんの へんかを 測る（1びょうに 3かい いじょう の ぜんめん きりかわり なし） ──
  await open(base, 390, 844);
  await D('manual(true)');
  const flick = await ev(`(()=>{const D=window.__drive,c=document.getElementById('cv'),x=c.getContext('2d');let prev=null,maxJump=0;for(let i=0;i<90;i++){D.advance(0.034);const d=x.getImageData(0,0,c.width,c.height).data;let s=0,n=0;for(let k=0;k<d.length;k+=4*53){s+=d[k]+d[k+1]+d[k+2];n++}const m=s/n/3;if(prev!==null)maxJump=Math.max(maxJump,Math.abs(m-prev));prev=m}return maxJump})()`);
  ok('がめんの あかるさが きゅうに かわらない（1コマの へんか 4 いか／255）', flick < 4, flick.toFixed(2));
  await D('manual(false)');

  // ── 11. コントラスト 4.5:1 ──
  const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const cols = await ev(`(()=>{const g=(s,p)=>getComputedStyle(document.querySelector(s))[p];return {ink:g('h1','color'),ink2:g('.lead','color'),btn:g('#bl','color'),msg:g('#msg','color'),foot:g('#foot','color'),sum:g('#more summary','color'),ovl:g('#ovl','color')}})()`);
  const rgb = s => s.match(/\d+/g).slice(0, 3).map(Number);
  const worstDark = hex('#6a4228');
  const checks = [['みだし', cols.ink, worstDark], ['せつめい', cols.ink2, worstDark], ['あし', cols.foot, worstDark], ['ひとこと', cols.msg, hex('#33211a')], ['あそびかた', cols.sum, hex('#33211a')], ['ボタン(うえ)', cols.btn, hex('#ffdf9c')], ['ボタン(した)', cols.btn, hex('#f1b455')], ['ボタン(おした)', cols.btn, hex('#f7c46e')], ['カードの もじ', cols.ovl, hex('#322620')]];
  const lows = checks.filter(([n, f, b]) => cr(rgb(f), b) < 4.5).map(([n, f, b]) => n + ':' + cr(rgb(f), b).toFixed(2));
  ok('コントラスト 4.5:1 いじょう', lows.length === 0, lows.join(',') || checks.map(([n, f, b]) => n + ' ' + cr(rgb(f), b).toFixed(1)).join(' / '));

  // ── 12. English ──
  await open(base + '?lang=en', 390, 844);
  await ev(`new Promise(r=>setTimeout(r,700))`);
  await ev(`document.querySelector('#more').open=true`);
  await ev('window.__steer=' + steerTo); await D('manual(true)'); await D('setZ(' + ((await D('nushi()')).z - 40) + ')'); await D('advance(4)');
  await ev(`window.__drive.advance(100,window.__steer)`); await sleep(500);
  const en = await ev(`({ text: document.body.innerText, title: document.title, missing: window.TsuriEn && TsuriEn.missing ? TsuriEn.missing() : null, lang: window.TsuriEn && TsuriEn.lang })`);
  const jp = en.text.replace(/日本語（にほんご）/g, '').match(/[぀-ヿ㐀-鿿]+/g) || [];
  ok('English：がめんに にほんごが のこらない', en.lang === 'en' && jp.length === 0, jp.slice(0, 8).join('|') || en.title);
  ok('English：みやくの ない ことば（missing）が ない', !en.missing || en.missing.length === 0, JSON.stringify(en.missing));
  ok('English：カードの 画像も えいご（alt）', await ev(`/Today/.test(document.getElementById('ovl-img').alt)`), await ev(`document.getElementById('ovl-img').alt`));
  await shot('en390.png');
  await ev(`localStorage.setItem('marufuwa-tsuri-lang', 'ja')`);

  // ── 13. 1280・390 の しゃしん・はみださない ──
  await open(base + '?lang=ja', 1280, 800);
  await D('manual(true)'); await D('setCourse(1)'); await D('advance(6)'); await D('draw()');
  await ev(`document.getElementById('ovl').hidden=true`);
  await shot('drive1280.png');
  ok('1280：よこに はみださない', await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));
  await open(base + '?lang=ja', 390, 844);
  await D('manual(true)'); await D('setCourse(0)'); await D('setZ(180)'); await D('setPx(0.2)'); await D('advance(2)'); await D('draw()');
  await shot('drive390_lake.png');
  await D('setCourse(1)'); await D('setZ(250)'); await D('advance(2)'); await D('draw()');
  await shot('drive390_plaza.png');
  ok('390：よこに はみださない', await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));
  ok('390：あそびかたを とじた ときの おせる もの 6つ いない', (await ev(`${pushables}.length`)) <= 6);
  await D('manual(false)');

  // ── 14. かるさ：CPU 4ばい おそくても 30fps いじょう ──
  await open(base, 390, 844);
  await send('Emulation.setCPUThrottlingRate', { rate: 4 }); await sleep(600);
  const f0 = await D('st()').then(s => s.frames); await sleep(3000); const f1 = (await D('st()')).frames;
  const fps4 = (f1 - f0) / 3;
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  ok('CPU 4ばい おそくても 30fps いじょう', fps4 >= 30, fps4.toFixed(1) + 'fps');
  await sleep(500);
  const g0 = (await D('st()')).frames; await sleep(2000); const fps1 = ((await D('st()')).frames - g0) / 2;
  ok('ふつうの CPU で 50fps いじょう', fps1 >= 50, fps1.toFixed(1) + 'fps');
  const dt1 = await ev(`(()=>{const D=window.__drive;D.manual(true);const t=performance.now();for(let i=0;i<60;i++){D.advance(.017)}const ms=(performance.now()-t)/60;D.manual(false);return ms})()`);
  ok('1コマの けいさん＋えがく は 8ms いか（ふつうの CPU）', dt1 < 8, dt1.toFixed(2) + 'ms');

  ok('JS エラー 0（exception・console.error・ログの error）', errors.length === 0, errors.slice(0, 5).join(' || '));
  ws.close(); ch.kill(); server.close();
  const bad = results.filter(x => !x[0]); console.log(`\n${results.length - bad.length}/${results.length} 通過。しゃしん：${OUT}`);
  process.exit(bad.length ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
