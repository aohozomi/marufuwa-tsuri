/* まるふわ まるいろ：休憩・合体の小さな演出・結果カードの背景
   外部ライブラリや通信は使わず、ゲームの進行データには触れない。 */
(() => {
  'use strict';

  const W = 300;
  const H = 420;
  const api = {
    paused: false,
    burst,
    drawCardBase,
    init
  };

  let cv = null;
  let fx = null;
  let fxCtx = null;
  let fxFrame = 0;
  let effects = [];
  let pauseDialog = null;
  let pauseButton = null;
  let resumeButton = null;
  let helpButton = null;
  let helpText = null;
  let returnFocus = null;
  let pauseStarted = 0;
  let initialized = false;

  function nowMs() {
    return window.performance && typeof window.performance.now === 'function'
      ? window.performance.now()
      : Date.now();
  }

  function isEnglish() {
    return !!(window.TsuriEn && window.TsuriEn.lang === 'en');
  }

  function word(ja, en) {
    return isEnglish() ? en : ja;
  }

  function calmMode() {
    return document.documentElement.dataset.calm === 'true'
      || !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function setPaused(value) {
    const next = !!value;
    if (next === api.paused) return;
    const now = nowMs();
    if (next) {
      pauseStarted = now;
      if (fxFrame) {
        cancelAnimationFrame(fxFrame);
        fxFrame = 0;
      }
    } else if (pauseStarted) {
      const held = Math.max(0, now - pauseStarted);
      for (const effect of effects) effect.started += held;
      pauseStarted = 0;
      if (effects.length && !fxFrame) fxFrame = requestAnimationFrame(drawEffects);
    }
    api.paused = next;
  }

  function addStyles() {
    if (document.getElementById('maruiro-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'maruiro-polish-style';
    style.textContent = [
      '.polish-rest-btn{box-sizing:border-box;min-width:44px;min-height:44px;padding:6px 10px;border:1px solid rgba(133,166,139,.52);',
      'border-radius:999px;background:linear-gradient(145deg,#fffef9,#e9f5eb);color:#315647;',
      'font-family:inherit;font-size:.84rem;line-height:1.1;font-weight:800;white-space:nowrap;',
      'box-shadow:0 3px 10px rgba(61,91,68,.12);',
      'cursor:pointer;transition:box-shadow .16s ease,background-color .16s ease}',
      '.polish-rest-btn:hover{box-shadow:0 5px 14px rgba(61,91,68,.2)}',
      '.polish-rest-btn:focus-visible,.polish-dialog button:focus-visible{outline:3px solid #c59b48;outline-offset:3px}',
      '.polish-dialog{box-sizing:border-box;width:min(360px,calc(100vw - 30px));max-height:calc(100dvh - 28px);',
      'overflow:auto;padding:24px;border:1px solid rgba(198,166,103,.76);border-radius:26px;color:#315447;',
      'background:radial-gradient(ellipse at 12% 0%,rgba(255,255,255,.96),transparent 55%),',
      'linear-gradient(145deg,#fffdf7,#edf6e9 72%,#f7f0d9);box-shadow:0 24px 70px rgba(35,60,46,.28);font-family:inherit}',
      '.polish-dialog::backdrop{background:rgba(37,54,45,.42);backdrop-filter:blur(4px)}',
      '.polish-dialog h2{margin:0 0 10px;font-size:1.35rem;line-height:1.3;color:#294d40}',
      '.polish-dialog p{margin:0;color:#4e665b;line-height:1.75}',
      '.polish-dialog .polish-note{margin-top:12px;font-size:.84rem;color:#6c7c70}',
      '.polish-dialog .polish-help{margin:16px 0 0;padding:14px 15px;border:1px solid rgba(139,177,145,.42);',
      'border-radius:16px;background:rgba(255,255,255,.64)}',
      '.polish-dialog .polish-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}',
      '.polish-dialog button{min-height:44px;padding:10px 16px;border-radius:999px;font-family:inherit;',
      'font-size:.95rem;line-height:1.2;font-weight:800;cursor:pointer}',
      '.polish-dialog .polish-continue{flex:1 1 140px;border:1px solid #6f9c7d;color:#fff;',
      'background:linear-gradient(145deg,#5b9271,#3f755b);box-shadow:0 5px 13px rgba(53,100,70,.2)}',
      '.polish-dialog .polish-help-toggle{flex:1 1 140px;border:1px solid rgba(132,164,138,.58);',
      'color:#355d49;background:rgba(255,255,255,.76)}',
      '#maruiro-polish-fx{position:fixed;inset:0;width:100vw;height:100dvh;z-index:18;pointer-events:none;visibility:hidden}',
      '#maruiro-polish-fx.polish-fx-live{visibility:visible}',
      '@media (prefers-reduced-motion:reduce){.polish-rest-btn{transition:none}.polish-rest-btn:hover{transform:none}}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function makeDialog() {
    const top = document.querySelector('.toprow');
    const controlGroup = document.querySelector('.mutegrp');
    const dayHud = document.getElementById('dayhud');
    const menuButton = document.getElementById('b-menu');
    if (!top || !controlGroup || document.getElementById('maruiro-polish-rest')) return;

    pauseButton = document.createElement('button');
    pauseButton.type = 'button';
    pauseButton.id = 'maruiro-polish-rest';
    pauseButton.className = 'polish-rest-btn';
    pauseButton.setAttribute('aria-haspopup', 'dialog');
    pauseButton.setAttribute('aria-controls', 'maruiro-polish-dialog');
    pauseButton.setAttribute('aria-expanded', 'false');
    pauseButton.textContent = word('やすむ', 'Rest');
    pauseButton.setAttribute('aria-label', word('ひとやすみ', 'Take a break'));

    /* きょうの まるいろでは .toprow が .playing で かくれるため、
       dayhud が見えている間はメニューのとなりへ置く。ほかのあそびでは
       dayhud が hidden なので、見えている .toprow のおとボタン横へ置く。 */
    const placePauseButton = () => {
      if (dayHud && !dayHud.hidden) {
        dayHud.insertBefore(pauseButton, menuButton && menuButton.parentElement === dayHud ? menuButton : null);
      } else {
        controlGroup.appendChild(pauseButton);
      }
    };
    placePauseButton();
    if (dayHud && typeof MutationObserver === 'function') {
      const observer = new MutationObserver(placePauseButton);
      observer.observe(dayHud, { attributes: true, attributeFilter: ['hidden'] });
    }

    pauseDialog = document.createElement('dialog');
    pauseDialog.id = 'maruiro-polish-dialog';
    pauseDialog.className = 'polish-dialog';
    pauseDialog.setAttribute('aria-labelledby', 'maruiro-polish-title');
    pauseDialog.setAttribute('aria-describedby', 'maruiro-polish-note');

    const title = document.createElement('h2');
    title.id = 'maruiro-polish-title';
    title.textContent = word('ひとやすみ', 'Paused');

    const intro = document.createElement('p');
    intro.textContent = word('おちゃを のんで、ゆっくり ひといき。', 'Take a little breather.');

    helpText = document.createElement('p');
    helpText.id = 'maruiro-polish-help';
    helpText.className = 'polish-help';
    helpText.hidden = true;

    const note = document.createElement('p');
    note.id = 'maruiro-polish-note';
    note.className = 'polish-note';
    note.textContent = word('Escキーで もどれるよ。', 'Press Esc to return.');

    const actions = document.createElement('div');
    actions.className = 'polish-actions';

    resumeButton = document.createElement('button');
    resumeButton.type = 'button';
    resumeButton.className = 'polish-continue';
    resumeButton.textContent = word('つづける', 'Continue');

    helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.className = 'polish-help-toggle';
    helpButton.setAttribute('aria-controls', 'maruiro-polish-help');
    helpButton.setAttribute('aria-expanded', 'false');
    helpButton.textContent = word('かんたんな あそびかた', 'How to play');

    actions.append(resumeButton, helpButton);
    pauseDialog.append(title, intro, helpText, note, actions);
    document.body.appendChild(pauseDialog);

    pauseButton.addEventListener('click', openPause);
    resumeButton.addEventListener('click', closePause);
    helpButton.addEventListener('click', toggleHelp);
    pauseDialog.addEventListener('cancel', event => {
      event.preventDefault();
      closePause();
    });
    pauseDialog.addEventListener('close', () => {
      setPaused(false);
      if (pauseButton) pauseButton.setAttribute('aria-expanded', 'false');
      restoreFocus();
    });

    document.addEventListener('keydown', event => {
      if (!api.paused || !pauseDialog) return;
      const inDialogButton = pauseDialog.contains(event.target)
        && event.target && event.target.closest && event.target.closest('button');
      if (inDialogButton) return; // ボタンのEnter/Space操作は残す
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'z', 'x'].includes(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function helpCopy() {
    const flood = document.getElementById('flood');
    if (flood && !flood.hidden) {
      return word(
        'いろの ボタン（または 1〜4）を おして、すこしずつ ひろげよう。',
        'Choose a color button (or press 1–4) to spread your color.'
      );
    }
    const selected = document.querySelector('#plays button[aria-pressed="true"]');
    const playName = (selected && selected.textContent || '').trim().toLowerCase();
    if (playName.includes('つみき') || playName.includes('blocks')) {
      return word(
        'ふたつ組を ひだり・みぎへ。↑ または Z・Xで まわして、↓・スペース・エンターで おとそう。',
        'Move the pair with ←/→, rotate with ↑ or Z/X, and drop with ↓, Space, or Enter.'
      );
    }
    if (playName.includes('そろえる') || playName.includes('match')) {
      return word(
        'まるを ひだり・みぎへ うごかして おとそう。同じ いろが 3つ ふれると きえるよ。',
        'Move and drop circles with ←/→. Three or more matching colors touching will clear.'
      );
    }
    if (playName.includes('そだてる') || playName.includes('grow')) {
      return word(
        'まるを ひだり・みぎへ うごかして おとそう。同じ いろと おおきさが ふれると そだつよ。',
        'Move and drop circles with ←/→. Matching colors and sizes join and grow.'
      );
    }
    if (playName.includes('おやつ') || playName.includes('snacks') || playName.includes('treats')) {
      return word(
        'おなじ おやつを あわせて、もっと おおきな おやつに しよう。',
        'Join matching snacks to make a bigger snack.'
      );
    }
    return word(
      'ひだり・みぎの やじるしや ゆびで まるを うごかしてね。おなじ いろが くっつくと、おおきくなるよ。',
      'Use the left and right arrows or your finger to move. Circles grow when matching colors join.'
    );
  }

  function openPause() {
    if (!pauseDialog || api.paused || typeof pauseDialog.showModal !== 'function') return;
    returnFocus = document.activeElement && document.activeElement !== document.body
      ? document.activeElement
      : pauseButton;
    helpText.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
    helpButton.textContent = word('かんたんな あそびかた', 'How to play');
    helpText.textContent = helpCopy();
    try {
      pauseDialog.showModal();
      setPaused(true);
      pauseButton.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => {
        if (resumeButton && pauseDialog.open) resumeButton.focus({ preventScroll: true });
      });
    } catch (error) {
      setPaused(false);
      returnFocus = null;
    }
  }

  function closePause() {
    if (!pauseDialog) return;
    if (pauseDialog.open) {
      pauseDialog.close();
      return;
    }
    setPaused(false);
    if (pauseButton) pauseButton.setAttribute('aria-expanded', 'false');
    restoreFocus();
  }

  function restoreFocus() {
    const target = returnFocus && returnFocus.isConnected ? returnFocus : pauseButton;
    returnFocus = null;
    if (!target || !target.isConnected) return;
    requestAnimationFrame(() => {
      try { target.focus({ preventScroll: true }); } catch (error) { target.focus(); }
    });
  }

  function toggleHelp() {
    if (!helpText || !helpButton) return;
    const expanded = helpText.hidden;
    helpText.hidden = !expanded;
    helpButton.setAttribute('aria-expanded', String(expanded));
    helpButton.textContent = expanded
      ? word('あそびかたを とじる', 'Hide the guide')
      : word('かんたんな あそびかた', 'How to play');
  }

  function ensureFx() {
    if (fx && fxCtx) return true;
    if (!document.body) return false;
    fx = document.getElementById('maruiro-polish-fx');
    if (!fx) {
      fx = document.createElement('canvas');
      fx.id = 'maruiro-polish-fx';
      fx.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fx);
    }
    fxCtx = fx.getContext('2d');
    return !!fxCtx;
  }

  function makeEffect(x, y, chain, points) {
    const quiet = calmMode();
    const c = Math.max(1, Math.min(99, Math.floor(Number(chain) || 1)));
    const p = Number.isFinite(Number(points)) ? Math.max(0, Math.floor(Number(points))) : 0;
    const item = {
      x: Math.max(0, Math.min(W, x)),
      y: Math.max(0, Math.min(H, y)),
      chain: c,
      points: p,
      quiet,
      started: nowMs(),
      duration: quiet ? 820 : 520,
      dots: []
    };
    if (!quiet) {
      for (let i = 0; i < 8; i++) {
        const angle = i * 2.399963229728653 + (c % 5) * 0.23;
        const speed = 24 + ((i * 7 + c * 11 + p) % 22);
        item.dots.push({ angle, speed });
      }
    }
    return item;
  }

  function burst(x, y, chain, points) {
    /* x/y は #cv の論理座標（幅300・高さ420）。点数・連鎖数は表示だけに使う。 */
    if (!initialized && document.readyState !== 'loading') init();
    if (api.paused) return false;
    if (!cv) cv = document.getElementById('cv');
    if (!cv || !ensureFx()) return false;
    const px = Number(x);
    const py = Number(y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
    const rect = cv.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    effects.push(makeEffect(px, py, chain, points));
    if (effects.length > 12) effects.shift();
    fx.classList.add('polish-fx-live');
    if (!fxFrame) fxFrame = requestAnimationFrame(drawEffects);
    return true;
  }

  function drawEffects(now) {
    fxFrame = 0;
    if (!ensureFx() || !cv) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(window.innerWidth * dpr));
    const height = Math.max(1, Math.round(window.innerHeight * dpr));
    if (fx.width !== width || fx.height !== height) {
      fx.width = width;
      fx.height = height;
    }
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const rect = cv.getBoundingClientRect();
    const sx = rect.width / W;
    const sy = rect.height / H;
    const scale = Math.min(sx, sy);
    const alive = [];
    for (const effect of effects) {
      const t = Math.max(0, (now - effect.started) / effect.duration);
      if (t >= 1 || rect.width <= 0 || rect.height <= 0) continue;
      drawEffect(effect, t, rect, sx, sy, scale);
      alive.push(effect);
    }
    effects = alive;
    if (effects.length) {
      fxFrame = requestAnimationFrame(drawEffects);
    } else {
      fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      fx.classList.remove('polish-fx-live');
    }
  }

  function drawEffect(effect, t, rect, sx, sy, scale) {
    const x = rect.left + effect.x * sx;
    const y = rect.top + effect.y * sy;
    const quietNow = effect.quiet || calmMode();
    const alpha = quietNow ? 0.76 : Math.max(0, 0.72 * (1 - t));
    const radius = quietNow ? 16 * scale : (8 + 22 * t) * scale;
    fxCtx.save();
    fxCtx.lineWidth = Math.max(1.5, 2.3 * scale);
    fxCtx.strokeStyle = 'rgba(222,184,91,' + alpha + ')';
    fxCtx.beginPath();
    fxCtx.arc(x, y, radius, 0, Math.PI * 2);
    fxCtx.stroke();
    fxCtx.lineWidth = Math.max(1, 1.1 * scale);
    fxCtx.strokeStyle = 'rgba(255,255,255,' + (alpha * 0.9) + ')';
    fxCtx.beginPath();
    fxCtx.arc(x, y, Math.max(1, radius - 4 * scale), 0, Math.PI * 2);
    fxCtx.stroke();

    if (!quietNow) {
      for (let i = 0; i < effect.dots.length; i++) {
        const dot = effect.dots[i];
        const progress = Math.min(1, t * 1.15);
        const dx = Math.cos(dot.angle) * dot.speed * progress * scale;
        const dy = Math.sin(dot.angle) * dot.speed * progress * scale - progress * progress * 5 * scale;
        fxCtx.globalAlpha = Math.max(0, 1 - progress);
        fxCtx.fillStyle = i % 2 ? '#f2d58f' : '#a9d8b5';
        fxCtx.beginPath();
        fxCtx.arc(x + dx, y + dy, Math.max(1.4, (3.1 - progress) * scale), 0, Math.PI * 2);
        fxCtx.fill();
      }
    }
    if (effect.chain >= 2) drawChainLabel(effect, x, y, rect, scale, quietNow ? 1 : Math.max(0, 1 - t * 1.2));
    fxCtx.restore();
  }

  function drawChainLabel(effect, x, y, rect, scale, alpha) {
    const chainText = word(effect.chain + 'れんさ', effect.chain + ' chain');
    const scoreText = effect.points > 0 ? '+' + effect.points : '';
    const label = scoreText ? chainText + '  ' + scoreText : chainText;
    const fontSize = Math.max(11, Math.min(14, 13 * scale));
    fxCtx.font = '800 ' + fontSize + 'px system-ui, "Yu Gothic UI", Meiryo, sans-serif';
    const padX = 8 * scale;
    const h = 23 * scale;
    const w = fxCtx.measureText(label).width + padX * 2;
    let left = x + 22 * scale;
    let top = y - 30 * scale;
    if (left + w > rect.right - 4) left = x - w - 22 * scale;
    left = Math.max(rect.left + 4, Math.min(rect.right - w - 4, left));
    top = Math.max(rect.top + 4, Math.min(rect.bottom - h - 4, top));
    fxCtx.globalAlpha = alpha;
    fxCtx.fillStyle = 'rgba(255,253,244,.96)';
    fxCtx.strokeStyle = 'rgba(198,166,103,.82)';
    fxCtx.lineWidth = Math.max(1, scale);
    roundedRect(fxCtx, left, top, w, h, h / 2);
    fxCtx.fill();
    fxCtx.stroke();
    fxCtx.fillStyle = '#395b49';
    fxCtx.textAlign = 'center';
    fxCtx.textBaseline = 'middle';
    fxCtx.fillText(label, left + w / 2, top + h / 2);
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, r);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function imageSize(image) {
    if (!image) return null;
    const width = Number(image.naturalWidth || image.videoWidth || image.width || 0);
    const height = Number(image.naturalHeight || image.videoHeight || image.height || 0);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  function drawCardBase(ctx, bg) {
    if (!ctx || !ctx.canvas) return false;
    const transform = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
    const sx = transform && Math.abs(transform.a) > 0 ? Math.abs(transform.a) : 1;
    const sy = transform && Math.abs(transform.d) > 0 ? Math.abs(transform.d) : 1;
    const width = ctx.canvas.width / sx;
    const height = ctx.canvas.height / sy;
    if (width <= 0 || height <= 0) return false;
    ctx.save();
    try {
      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, '#f6f0d9');
      base.addColorStop(0.48, '#e5f3e8');
      base.addColorStop(1, '#f9ead1');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const size = imageSize(bg);
      if (size) {
        const cover = Math.max(width / size.width, height / size.height);
        const drawWidth = size.width * cover;
        const drawHeight = size.height * cover;
        try {
          ctx.drawImage(bg, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
          ctx.fillStyle = 'rgba(255,251,238,.26)';
          ctx.fillRect(0, 0, width, height);
        } catch (error) {}
      }

      const edge = Math.min(width, height);
      const wash = ctx.createRadialGradient(width * 0.08, height * 0.06, 0, width * 0.08, height * 0.06, edge * 0.48);
      wash.addColorStop(0, 'rgba(255,255,255,.38)');
      wash.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      const pad = edge * 0.018;
      ctx.lineWidth = Math.max(2, edge * 0.004);
      ctx.strokeStyle = 'rgba(190,155,84,.76)';
      roundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, edge * 0.055);
      ctx.stroke();
      ctx.lineWidth = Math.max(1, edge * 0.002);
      ctx.strokeStyle = 'rgba(255,255,255,.86)';
      roundedRect(ctx, pad * 1.8, pad * 1.8, width - pad * 3.6, height - pad * 3.6, edge * 0.045);
      ctx.stroke();

      /* ガラス温室の丸い屋根を、白い文字板より先にうっすら描く。 */
      ctx.lineWidth = Math.max(1, edge * 0.003);
      ctx.strokeStyle = 'rgba(255,255,255,.82)';
      ctx.beginPath();
      ctx.moveTo(width * 0.2, edge * 0.1);
      ctx.quadraticCurveTo(width * 0.5, edge * 0.025, width * 0.8, edge * 0.1);
      ctx.stroke();

      ctx.fillStyle = 'rgba(247,224,163,.88)';
      for (const point of [
        [edge * 0.042, edge * 0.11],
        [width - edge * 0.042, edge * 0.11],
        [edge * 0.042, height - edge * 0.11],
        [width - edge * 0.042, height - edge * 0.11]
      ]) {
        ctx.beginPath();
        ctx.arc(point[0], point[1], Math.max(3, edge * 0.008), 0, Math.PI * 2);
        ctx.fill();
      }
      return true;
    } finally {
      ctx.restore();
    }
  }

  function init() {
    if (initialized || typeof document === 'undefined') return;
    initialized = true;
    cv = document.getElementById('cv');
    addStyles();
    makeDialog();
  }

  window.MaruiroPolish = api;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
