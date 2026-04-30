/* ============================================================
   AlternateIncomeSource.com — Core Strength Animation
   File: assets/js/animation.js
   Language: JavaScript

   What this file does:
   → Draws the hero animation on the <canvas> element
   → AlternateIncomeSource = the core energy source
   → All elements orbit around your brand name
   → Every element powered by your brand

   How canvas works:
   → Canvas is a blank drawing area in HTML
   → JavaScript draws on it like a digital paintbrush
   → We redraw everything 60 times per second
   → Fast redrawing = smooth animation
   ============================================================ */


/* ============================================================
   SECTION 1 — SETUP
   Find the canvas and prepare it for drawing
   ============================================================ */

/* Wait for page to fully load before running animation */
document.addEventListener('DOMContentLoaded', function() {

  /* Find the canvas element in index.html */
  const canvas = document.getElementById('hero-canvas');

  /* Safety check — if canvas not found, stop */
  if (!canvas) return;

  /* Get the drawing context
     What is context?
     → Like choosing your paintbrush type
     → '2d' = flat 2D drawing (what we use)
     → Alternative is 'webgl' for 3D (heavier) */
  const ctx = canvas.getContext('2d');

  /* Canvas center points — recalculated on resize */
  let CX, CY;

  /* ============================================================
     SECTION 2 — CANVAS SIZING
     
     Why responsive canvas?
     → Canvas has fixed pixel dimensions
     → We must manually set width + height
     → We read the actual displayed size and match it
     → This makes animation crisp on all screen sizes
     ============================================================ */

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  || 680;
    canvas.height = rect.height || 420;
    CX = canvas.width  / 2;
    CY = canvas.height / 2;
  }

  /* Resize when window size changes */
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); /* Run once immediately */


  /* ============================================================
     SECTION 3 — ORBITING ELEMENTS
     
     Each element that orbits your brand has:
     → s     = the symbol shown ($ € ₿ etc)
     → n     = full name shown during pose moment
     → c     = its unique color
     → r     = orbit radius (how far from center)
     → sp    = orbit speed
     → a     = starting angle
     → ti    = tilt angle (creates 3D illusion)
     → sz    = symbol size
     → on    = whether it has appeared yet
     → tr    = trail history (for motion blur effect)
     ============================================================ */

  const ELEMENTS = [
    { s:'$',  n:'DOLLAR',      c:'#00FF88', r:88,  sp:.82, a:0,    ti:.42,  sz:25, on:false, tr:[] },
    { s:'€',  n:'EURO',        c:'#4DAAFF', r:106, sp:.64, a:2.09, ti:-.33, sz:25, on:false, tr:[] },
    { s:'₿',  n:'BITCOIN',     c:'#FFB300', r:97,  sp:.98, a:4.19, ti:.21,  sz:25, on:false, tr:[] },
    { s:'💻', n:'COMPUTER',    c:'#00E5FF', r:126, sp:.50, a:1.05, ti:.55,  sz:21, on:false, tr:[] },
    { s:'📱', n:'PHONE',       c:'#FF4081', r:118, sp:.74, a:3.14, ti:-.46, sz:19, on:false, tr:[] },
    { s:'🖥',  n:'LAPTOP',     c:'#E040FB', r:137, sp:.42, a:5.24, ti:.32,  sz:19, on:false, tr:[] },
    { s:'AI', n:'INTELLIGENCE',c:'#AA00FF', r:150, sp:.30, a:2.62, ti:-.15, sz:17, on:false, tr:[] },
  ];


  /* ============================================================
     SECTION 4 — PARTICLES + EFFECTS
     
     What are particles?
     → Tiny dots that fly outward from elements
     → Created randomly during animation
     → Each has position, velocity, life
     → When life reaches 0 they disappear
     ============================================================ */

  let particles  = [];  /* Active particle dots */
  let rings      = [];  /* Expanding ring pulses from core */
  let arcs       = [];  /* Electric arcs between core and elements */


  /* ============================================================
     SECTION 5 — BACKGROUND STARS
     
     80 tiny stars in the background
     They twinkle at different speeds
     ============================================================ */

  const STARS = Array.from({ length: 80 }, function() {
    return {
      x:  Math.random() * 680,
      y:  Math.random() * 420,
      r:  0.3 + Math.random() * 0.9,
      tw: Math.random() * 6.28,
      sp: 0.4 + Math.random() * 0.7
    };
  });


  /* ============================================================
     SECTION 6 — ANIMATION PHASES
     
     The animation tells a story in phases:
     
     Phase 0 → VOID (darkness, just a spark)
     Phase 1 → CORE BIRTH (brand name appears)
     Phase 2 → ENERGY EMISSION (waves radiate out)
     Phase 3 → CREATION (elements appear one by one)
     Phase 4 → FULL ORBIT (everything orbits brand)
     
     Why phases?
     → More dramatic and engaging than everything appearing at once
     → Tells your brand story visually
     ============================================================ */

  let phase     = 0;
  let phaseTime = 0;
  let elapsed   = 0;
  let lastTime  = 0;

  /* Surge system — random energy bursts */
  let surgeTime    = -99;
  let nextSurge    = 24;
  let aiFlicker    = 0;  /* AI element flickers before stabilizing */


  /* ============================================================
     SECTION 7 — HELPER FUNCTIONS
     ============================================================ */

  /* Random number between min and max */
  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  /* Convert hex color to RGB array
     Why? → Canvas needs RGB values for gradients */
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* Create particle burst at a position */
  function burst(x, y, color, count, speed) {
    count = count || 14;
    speed = speed || 2.5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 6.28;
      const s = rnd(0.5, speed);
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 1,
        color: color,
        r: rnd(1, 2.8)
      });
    }
  }

  /* Add expanding ring from core */
  function addRing(alpha, color) {
    color = color || '#00FFFF';
    rings.push({ r: 2, life: alpha || 1, color: color });
  }

  /* Add electric arc from core to element position */
  function addArc(ex, ey, color) {
    const points = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      points.push({
        x: CX + (ex - CX) * f + (i > 0 && i < steps ? rnd(-28, 28) : 0),
        y: CY + (ey - CY) * f + (i > 0 && i < steps ? rnd(-28, 28) : 0)
      });
    }
    arcs.push({ points: points, life: 0.9, color: color });
  }


  /* ============================================================
     SECTION 8 — CALCULATE ELEMENT POSITION
     
     This creates the 3D illusion for orbiting elements.
     
     How 3D illusion works:
     → Elements orbit in a tilted ellipse
     → Elements closer to viewer appear larger
     → Elements farther appear smaller
     → This tricks the eye into seeing depth
     ============================================================ */

  function getPosition(el, t) {
    const angle = el.a + t * el.sp;

    /* 3D orbit math */
    const x3 = Math.cos(angle) * el.r;
    const y3 = Math.sin(angle) * el.r * Math.cos(el.ti);
    const z3 = Math.sin(angle) * el.r * Math.sin(el.ti);

    /* Scale based on Z depth (0.34 to 1.14 range) */
    const scale = Math.max(0.34, 0.72 + (z3 / el.r) * 0.42);

    return {
      x: CX + x3,
      y: CY + y3,
      z: z3,
      scale: scale,
      angle: angle
    };
  }


  /* ============================================================
     SECTION 9 — DRAW CORE BRAND TEXT
     
     This draws "AlternateIncomeSource" at the center
     with glow effects, light sweep, and tagline
     ============================================================ */

  function drawCore(t, alpha, revealProgress) {
    /* How much of the text to show (used during birth phase) */
    const brand = 'AlternateIncomeSource';
    const text = revealProgress < 1
      ? brand.slice(0, Math.ceil(brand.length * revealProgress))
      : brand;

    const pulse = 0.87 + 0.13 * Math.sin(t * 2.6);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px sans-serif';

    /* Layer 1 — outer deep glow */
    ctx.shadowBlur = 60 * pulse;
    ctx.shadowColor = '#00FFFF';
    ctx.fillStyle = 'rgba(0,255,255,.05)';
    ctx.fillText(text, CX, CY);

    /* Layer 2 — mid glow */
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#FFFFFF';
    ctx.fillStyle = 'rgba(200,255,255,.5)';
    ctx.fillText(text, CX, CY);

    /* Layer 3 — sharp text */
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    ctx.fillStyle = 'rgba(255,255,255,.97)';
    ctx.fillText(text, CX, CY);

    /* After full reveal — add traveling light sweep */
    if (revealProgress >= 1) {
      const textWidth = ctx.measureText(brand).width;
      const sweepX = CX - textWidth/2 + (((t * 52) % (textWidth + 90)) - 45);
      const sweep = ctx.createLinearGradient(sweepX - 38, 0, sweepX + 38, 0);
      sweep.addColorStop(0, 'rgba(0,255,220,0)');
      sweep.addColorStop(0.5, 'rgba(0,255,220,' + (0.7 * alpha) + ')');
      sweep.addColorStop(1, 'rgba(0,255,220,0)');
      ctx.shadowBlur = 0;
      ctx.fillStyle = sweep;
      ctx.fillText(brand, CX, CY);

      /* Underline glow */
      const uw = textWidth + 32;
      const ul = ctx.createLinearGradient(CX - uw/2, 0, CX + uw/2, 0);
      ul.addColorStop(0, 'rgba(0,255,200,0)');
      ul.addColorStop(0.5, 'rgba(0,255,200,' + (0.55 * pulse * alpha) + ')');
      ul.addColorStop(1, 'rgba(0,255,200,0)');
      ctx.beginPath();
      ctx.moveTo(CX - uw/2, CY + 15);
      ctx.lineTo(CX + uw/2, CY + 15);
      ctx.strokeStyle = ul;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.stroke();

      /* Tagline below brand */
      ctx.globalAlpha = 0.38 * alpha;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#80FFEE';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#00FFCC';
      ctx.fillText('CORE STRENGTH · DIGITAL ECOSYSTEM · INCOME ENGINE', CX, CY + 31);

      /* Core pulse ring */
      ctx.globalAlpha = alpha;
      const prg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 22 + 8 * pulse);
      prg.addColorStop(0, 'rgba(0,255,220,' + (0.18 * pulse) + ')');
      prg.addColorStop(1, 'rgba(0,255,220,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, 22 + 8 * pulse, 0, 6.28);
      ctx.fillStyle = prg;
      ctx.fill();
    }

    ctx.restore();
  }


  /* ============================================================
     SECTION 10 — DRAW ONE ORBITING ELEMENT
     ============================================================ */

  function drawElement(el, index, pos, t, surge) {
    const sz   = el.sz * pos.scale * (1 + surge * 0.2);
    const rgb  = hexToRgb(el.c);
    const isAI = el.n === 'INTELLIGENCE';

    /* AI flickers before stabilizing */
    if (isAI && aiFlicker > 0 && Math.random() < 0.3) return;

    /* --- TRAIL (motion history) --- */
    el.tr.push({ x: pos.x, y: pos.y, sc: pos.scale });
    if (el.tr.length > 16) el.tr.shift();

    for (let i = 0; i < el.tr.length; i++) {
      const tp = el.tr[i];
      const ta = (i / el.tr.length) * 0.22;
      ctx.save();
      ctx.globalAlpha = ta;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, el.sz * tp.sc * 0.44, 0, 6.28);
      ctx.fillStyle = el.c;
      ctx.fill();
      ctx.restore();
    }

    ctx.save();

    /* --- PERSONAL AURA --- */
    const aura = ctx.createRadialGradient(pos.x, pos.y, sz * 0.1, pos.x, pos.y, sz * 3);
    aura.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (0.38 + surge * 0.22) + ')');
    aura.addColorStop(0.45, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.07)');
    aura.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, sz * 3, 0, 6.28);
    ctx.fillStyle = aura;
    ctx.fill();

    /* --- ORBITING SPARKLE DOTS around each element --- */
    const spinDir = [1, -1, 1, -1, 1, -1, 1][index] || 1;
    ctx.shadowBlur = 12;
    ctx.shadowColor = el.c;
    for (let d = 0; d < 7; d++) {
      const spa = t * 1.65 * spinDir + el.a * 2.1 + d * (6.28 / 7);
      ctx.globalAlpha = 0.42 + 0.38 * Math.sin(t * 3 + d * 1.35 + el.a);
      ctx.beginPath();
      ctx.arc(
        pos.x + Math.cos(spa) * sz * 1.8,
        pos.y + Math.sin(spa) * sz * 1.8,
        1.7, 0, 6.28
      );
      ctx.fillStyle = el.c;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* --- MAIN DISC --- */
    ctx.shadowBlur = 16 + surge * 24;
    ctx.shadowColor = el.c;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, sz, 0, 6.28);
    ctx.fillStyle = 'rgba(2,2,16,.92)';
    ctx.fill();
    ctx.strokeStyle = el.c;
    ctx.lineWidth = 1.8 + surge * 0.9;
    ctx.stroke();

    /* --- SYMBOL TEXT --- */
    ctx.shadowBlur = 18 + surge * 14;
    ctx.shadowColor = el.c;
    ctx.fillStyle = el.c;
    ctx.font = 'bold ' + Math.round(sz * 0.9) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.s, pos.x, pos.y + 1.5);

    /* --- SURGE RAYS (during energy burst) --- */
    if (surge > 0.4) {
      for (let ray = 0; ray < 8; ray++) {
        const ra = (ray / 8) * 6.28 + t * 0.8;
        const ri = sz + 2;
        const ro = sz + 8 + surge * 10;
        ctx.globalAlpha = (0.3 + 0.3 * Math.sin(t * 5 + ray)) * surge;
        ctx.beginPath();
        ctx.moveTo(pos.x + Math.cos(ra) * ri, pos.y + Math.sin(ra) * ri);
        ctx.lineTo(pos.x + Math.cos(ra) * ro, pos.y + Math.sin(ra) * ro);
        ctx.strokeStyle = el.c;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* Expanding pulse ring */
      const pr = (t * 1.4 + index * 0.5) % 1;
      ctx.globalAlpha = (1 - pr) * 0.35 * surge;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, sz + pr * 30, 0, 6.28);
      ctx.strokeStyle = el.c;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }


  /* ============================================================
     SECTION 11 — DRAW ENERGY TETHER
     
     Faint dashed line from core to each element
     showing the energy connection
     ============================================================ */

  function drawTether(el, t) {
    const pos = getPosition(el, t);
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = el.c;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    /* Random energy packets traveling along tether */
    if (Math.random() < 0.28) {
      const f = Math.random();
      particles.push({
        x: CX + (pos.x - CX) * f,
        y: CY + (pos.y - CY) * f,
        vx: rnd(-0.35, 0.35),
        vy: rnd(-0.35, 0.35),
        life: 0.55,
        color: el.c,
        r: 1.2
      });
    }
    ctx.restore();
  }


  /* ============================================================
     SECTION 12 — MAIN ANIMATION LOOP
     
     What is requestAnimationFrame?
     → Tells the browser "run this function before the next
       screen refresh"
     → Browser refreshes 60 times per second
     → So our animation runs 60 times per second
     → This gives smooth 60fps animation
     → Better than setInterval (syncs with display)
     ============================================================ */

  function frame(timestamp) {

    /* Schedule next frame */
    requestAnimationFrame(frame);

    /* Calculate time passed since last frame */
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
    lastTime = timestamp;
    elapsed += dt;
    phaseTime += dt;

    const t = elapsed;

    /* === PHASE TRANSITIONS === */
    if (phase === 0 && phaseTime > 2.8)  { phase = 1; phaseTime = 0; }
    if (phase === 1 && phaseTime > 4.5)  { phase = 2; phaseTime = 0; addRing(1); addRing(0.7, '#AA00FF'); }
    if (phase === 2 && phaseTime > 5)    { phase = 3; phaseTime = 0; }
    if (phase === 3 && phaseTime > 9.5)  { phase = 4; phaseTime = 0; }

    /* Activate elements one by one during phase 3 */
    if (phase === 3) {
      ELEMENTS.forEach(function(el, i) {
        if (!el.on && phaseTime > i * 0.95 + 0.4) {
          el.on = true;
          const pos = getPosition(el, t);
          burst(pos.x, pos.y, el.c, 20, 4);
          burst(CX, CY, el.c, 8, 2.2);
          if (el.n === 'INTELLIGENCE') aiFlicker = 3;
        }
      });
    }

    /* All elements active in phase 4+ */
    if (phase >= 4) {
      ELEMENTS.forEach(function(el) { if (!el.on) el.on = true; });
    }

    /* Decay AI flicker */
    if (aiFlicker > 0) aiFlicker -= dt;

    /* === SURGE SYSTEM === */
    if (phase >= 3 && t > nextSurge) {
      surgeTime = t;
      nextSurge = t + rnd(9, 14);
      addRing(1); addRing(0.9, '#AA00FF'); addRing(0.7, '#FFB300');
      ELEMENTS.forEach(function(el) { burst(CX, CY, el.c, 6, 4); });
      /* Electric arc to random active element */
      const active = ELEMENTS.filter(function(el) { return el.on; });
      if (active.length) {
        const re = active[Math.floor(Math.random() * active.length)];
        const rpos = getPosition(re, t);
        addArc(rpos.x, rpos.y, re.c);
      }
    }

    const surge = Math.max(0, 1 - Math.max(0, t - surgeTime) / 2.6);

    /* ====================================================
       DRAW BACKGROUND
       ==================================================== */

    /* Dark background with subtle surge brightening */
    const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, canvas.width * 0.78);
    bg.addColorStop(0, 'rgb(' + (2 + Math.round(surge * 12)) + ',' + (3 + Math.round(surge * 14)) + ',' + (16 + Math.round(surge * 10)) + ')');
    bg.addColorStop(1, '#000103');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Subtle grid lines */
    ctx.save();
    ctx.globalAlpha = 0.02 + surge * 0.015;
    ctx.strokeStyle = '#00CCFF';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.restore();

    /* Stars */
    STARS.forEach(function(s) {
      const a = 0.06 + 0.1 * Math.sin(t * s.sp + s.tw);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(
        s.x * (canvas.width / 680),
        s.y * (canvas.height / 420),
        s.r, 0, 6.28
      );
      ctx.fillStyle = '#AACCFF';
      ctx.fill();
      ctx.restore();
    });

    /* Orbit path ellipses (very faint guides) */
    ELEMENTS.forEach(function(el) {
      if (!el.on) return;
      ctx.save();
      ctx.globalAlpha = 0.045;
      ctx.strokeStyle = el.c;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 16]);
      ctx.beginPath();
      ctx.ellipse(CX, CY, el.r, Math.max(3, el.r * Math.abs(Math.cos(el.ti))), 0, 0, 6.28);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    /* ====================================================
       DRAW ENERGY RINGS (expanding from core)
       ==================================================== */

    rings = rings.filter(function(rg) {
      rg.r += 2.5;
      rg.life -= 0.012;
      if (rg.life <= 0) return false;
      ctx.save();
      ctx.globalAlpha = rg.life * 0.28;
      ctx.beginPath();
      ctx.arc(CX, CY, rg.r, 0, 6.28);
      ctx.strokeStyle = rg.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = rg.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      return true;
    });

    /* ====================================================
       DRAW ELECTRIC ARCS
       ==================================================== */

    arcs = arcs.filter(function(arc) {
      arc.life -= 0.06;
      if (arc.life <= 0) return false;
      ctx.save();
      ctx.globalAlpha = arc.life * 0.8;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = arc.color;
      ctx.beginPath();
      ctx.moveTo(arc.points[0].x, arc.points[0].y);
      arc.points.slice(1).forEach(function(p) { ctx.lineTo(p.x, p.y); });
      ctx.stroke();
      ctx.restore();
      return true;
    });

    /* ====================================================
       DRAW TETHERS (energy connection lines)
       ==================================================== */

    if (phase >= 3) {
      ELEMENTS.forEach(function(el) {
        if (el.on) drawTether(el, t);
      });
    }

    /* ====================================================
       DRAW ELEMENTS (back to front for 3D depth)
       ==================================================== */

    ELEMENTS
      .filter(function(el) { return el.on; })
      .map(function(el) {
        return { el: el, pos: getPosition(el, t) };
      })
      .sort(function(a, b) { return a.pos.z - b.pos.z; })
      .forEach(function(item, i) {
        drawElement(item.el, i, item.pos, t, surge);
      });

    /* ====================================================
       DRAW PARTICLES
       ==================================================== */

    particles = particles.filter(function(p) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.012; /* Gravity */
      p.life -= 0.02;
      if (p.life <= 0 || particles.length > 300) return false;
      ctx.save();
      ctx.globalAlpha = p.life * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, 6.28);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
      return true;
    });

    /* ====================================================
       DRAW CORE BRAND NAME
       ==================================================== */

    if (phase === 0) {
      /* Just a spark */
      const sa = 0.15 + 0.12 * Math.sin(t * 5);
      ctx.save();
      ctx.globalAlpha = sa;
      ctx.beginPath();
      ctx.arc(CX, CY, 2 + phaseTime * 2, 0, 6.28);
      ctx.fillStyle = '#00FFFF';
      ctx.shadowBlur = 28;
      ctx.shadowColor = '#00FFFF';
      ctx.fill();
      ctx.restore();

    } else {
      const alpha = phase === 1 ? Math.min(1, phaseTime / 0.7) : 1;
      const reveal = phase === 1 ? Math.min(1, phaseTime / 2.8) : 1;
      drawCore(t, alpha, reveal);
    }

    /* Core radiance during surge */
    if (surge > 0) {
      ctx.save();
      const sr = 10 + surge * 32;
      const sg = ctx.createRadialGradient(CX, CY, 0, CX, CY, sr);
      sg.addColorStop(0, 'rgba(0,255,210,' + (0.8 * surge) + ')');
      sg.addColorStop(0.4, 'rgba(80,0,255,' + (0.3 * surge) + ')');
      sg.addColorStop(1, 'rgba(0,255,210,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, sr, 0, 6.28);
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.restore();
    }

    /* Emission phase — continuous fountain from core */
    if (phase === 2) {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * 6.28;
        const v = 0.9 + Math.random() * 2;
        particles.push({
          x: CX, y: CY,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 0.9,
          color: i % 2 ? '#00FFCC' : '#AA00FF',
          r: 2.2
        });
      }
      if (Math.random() < 0.08) addRing(0.6);
    }

    /* URL watermark at bottom */
    if (phase >= 4) {
      const ua = 0.28 + 0.1 * Math.sin(t * 0.7);
      ctx.save();
      ctx.globalAlpha = ua;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 10.5px sans-serif';
      ctx.fillStyle = '#00FFCC';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00FFAA';
      ctx.fillText('www.AlternateIncomeSource.com', CX, canvas.height - 8);
      ctx.restore();
    }

    /* Scanning line (premium SaaS feel) */
    const sl = (t * 35) % canvas.height;
    ctx.save();
    ctx.globalAlpha = 0.04 + surge * 0.04;
    const sll = ctx.createLinearGradient(0, sl - 8, 0, sl + 2);
    sll.addColorStop(0, 'rgba(0,255,220,0)');
    sll.addColorStop(1, 'rgba(0,255,220,1)');
    ctx.beginPath();
    ctx.moveTo(0, sl);
    ctx.lineTo(canvas.width, sl);
    ctx.strokeStyle = sll;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

  } /* End of frame function */

  /* ============================================================
     START THE ANIMATION
     Call frame() for the first time to begin the loop
     ============================================================ */

  requestAnimationFrame(frame);

  console.log('✅ AIS Core Strength Animation loaded');

}); /* End of DOMContentLoaded */
