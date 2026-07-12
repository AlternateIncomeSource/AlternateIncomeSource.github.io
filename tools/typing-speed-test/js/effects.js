/* ============================================================
   TYPINGAURA — effects.js  (v2 — typo fixed, performance safe)
   Q3 fix: spawnOnKepress → spawnOnKeypress (correct spelling)
   ============================================================ */

const TypingAuraEffects = (() => {

  let canvas     = null;
  let ctx        = null;
  let particles  = [];
  let rafId      = null;
  let isDisabled = false;

  function createParticle(x, y) {
    const colors = ['#00e5ff','#aa44ff','#00aaff','#00ff88','#ffcc00'];
    return {
      x, y,
      vx:    (Math.random() - 0.5) * 1.5,
      vy:    -(Math.random() * 2 + 0.5),
      life:  1.0,
      decay: Math.random() * 0.02 + 0.015,
      r:     Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }

  function setupCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'effects-canvas';
    canvas.style.cssText = [
      'position:fixed', 'inset:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:5'
    ].join(';');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', TypingAuraUtils.debounce(resize, 200));
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function loop() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.restore();
    });
    rafId = requestAnimationFrame(loop);
  }

  function spawnAt(x, y, count = 4) {
    if (isDisabled) return;
    for (let i = 0; i < count; i++) particles.push(createParticle(x, y));
  }

  // Q3 fix: correct spelling — was spawnOnKepress (missing 'y')
  function spawnOnKeypress() {
    if (isDisabled) return;
    const el = document.querySelector('#typing-area');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + Math.random() * rect.width;
    const y = rect.top  + Math.random() * (rect.height * 0.5);
    spawnAt(x, y, 3);
  }

  /* Edge glow */
  let edgeGlowEl   = null;
  let streakCount   = 0;
  let streakTimer   = null;

  function createEdgeGlow() {
    edgeGlowEl = document.createElement('div');
    edgeGlowEl.id = 'edge-glow';
    edgeGlowEl.style.cssText = [
      'position:fixed', 'inset:0', 'pointer-events:none', 'z-index:4',
      'opacity:0', 'transition:opacity 600ms ease',
      'background:radial-gradient(ellipse at center, transparent 60%, rgba(0,229,255,0.06) 100%)',
      'box-shadow:inset 0 0 80px rgba(0,229,255,0.08)'
    ].join(';');
    document.body.appendChild(edgeGlowEl);
  }

  function onCorrectKey() {
    streakCount++;
    clearTimeout(streakTimer);
    streakTimer = setTimeout(() => {
      streakCount = 0;
      hideEdgeGlow();
      TypingAuraKeyboard.streakOff();
    }, 2000);
    if (streakCount >= 10 && !isDisabled) {
      showEdgeGlow();
      TypingAuraKeyboard.streakOn();
    }
  }

  function onErrorKey() {
    streakCount = 0;
    hideEdgeGlow();
    TypingAuraKeyboard.streakOff();
  }

  function showEdgeGlow() {
    if (edgeGlowEl && !TypingAuraUtils.prefersReducedMotion()) edgeGlowEl.style.opacity = '1';
  }

  function hideEdgeGlow() {
    if (edgeGlowEl) edgeGlowEl.style.opacity = '0';
  }

  function bindEvents() {
    TypingAuraUtils.on('typingaura:keypress', e => {
      if (e.detail.correct) {
        spawnOnKeypress();   // Q3 fix: correct spelling
        onCorrectKey();
      } else {
        onErrorKey();
      }
    });
    TypingAuraUtils.on('typingaura:restart', () => {
      streakCount = 0;
      hideEdgeGlow();
      TypingAuraKeyboard.streakOff();
    });
  }

  function init() {
    if (TypingAuraUtils.isLowEndDevice() || TypingAuraUtils.prefersReducedMotion()) {
      isDisabled = true;
      return;
    }
    setupCanvas();
    createEdgeGlow();
    bindEvents();
    loop();
  }

  return { init, spawnAt, spawnOnKeypress, showEdgeGlow, hideEdgeGlow };

})();
