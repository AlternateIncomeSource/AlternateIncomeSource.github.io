/* ============================================================
   TYPINGAURA — results.js  (v2 — canvas fallback + session trend)
   Q4 fix: canvas.offsetWidth fallback to 800 when hidden.
   Added: session trend display (last 5 scores).
   ============================================================ */

const TypingAuraResults = (() => {

  function show(stats, duration, lessonContext) {
    const pb       = TypingAuraStats.getPersonalBest(duration);
    const isNewBest = !pb || stats.netWpm > pb.netWpm;

    TypingAuraUtils.$('#test-mode')?.classList.remove('active');
    TypingAuraUtils.$('#results-mode')?.classList.add('active');

    renderResultsHeader(lessonContext);
    renderStatCards(stats, isNewBest, pb);
    renderPbComparison(stats, pb, isNewBest);
    renderSessionTrend(duration);
    renderGraph(stats.wpmOverTime);
    renderErrorBreakdown(stats.problemChars);
    renderTip(stats);
    renderActions(stats, duration, lessonContext);

    if (lessonContext) {
      if (lessonContext.passed) TypingAuraSound.personalBest();
      else TypingAuraSound.testComplete();
    } else if (isNewBest && pb) {
      TypingAuraSound.personalBest();
      TypingAuraKeyboard.rainbowFlash();
    } else {
      TypingAuraSound.testComplete();
    }
  }

  function renderResultsHeader(lessonContext) {
    const titleEl = TypingAuraUtils.$('#results-title');
    const subEl   = TypingAuraUtils.$('#results-subtitle');
    if (!titleEl || !subEl) return;

    subEl.classList.remove('results-subtitle--pass', 'results-subtitle--fail');

    if (lessonContext) {
      const { lesson, passed } = lessonContext;
      titleEl.textContent = lesson ? lesson.title : 'Lesson Results';
      if (passed) {
        subEl.textContent = 'Passed — nice work.';
        subEl.classList.add('results-subtitle--pass');
      } else {
        const reqBits = [`${lesson?.requiredAccuracy ?? 90}%+ accuracy`];
        if (lesson?.requiredWpm) reqBits.push(`${lesson.requiredWpm}+ WPM`);
        subEl.textContent = `Not yet — this lesson needs ${reqBits.join(' and ')}. Try again.`;
        subEl.classList.add('results-subtitle--fail');
      }
    } else {
      titleEl.textContent = 'Your Results';
      subEl.textContent = 'Here is how you did — and what it means.';
    }
  }

  // Performance tiers — same benchmark bands documented in the page's SEO
  // content, so the label shown here matches what visitors can read about
  // elsewhere on the site.
  const TIERS = [
    { max: 20,  label: 'Just Starting Out', color: 'var(--neon-blue)'   },
    { max: 38,  label: 'Building Speed',    color: 'var(--neon-cyan)'  },
    { max: 60,  label: 'Average',           color: 'var(--neon-green)'},
    { max: 75,  label: 'Above Average',     color: 'var(--neon-purple)'},
    { max: 100, label: 'Professional',      color: 'var(--neon-gold)' },
    { max: Infinity, label: 'Elite',        color: 'var(--neon-gold)' }
  ];

  function getTier(wpm) {
    return TIERS.find(t => wpm < t.max) || TIERS[TIERS.length - 1];
  }

  // Smooth count-up from 0 to a target integer using requestAnimationFrame.
  // Skipped entirely under reduced motion — the final value is shown immediately.
  function animateCount(el, target, duration = 900) {
    if (!el) return;
    if (TypingAuraUtils.prefersReducedMotion()) {
      el.textContent = target;
      return;
    }
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  function renderStatCards(stats, isNewBest, pb) {
    const container = TypingAuraUtils.$('#stat-cards');
    if (!container) return;

    const wpm  = Math.round(stats.netWpm);
    const tier = getTier(wpm);
    const RING_CIRCUMFERENCE = 552.9;
    const accuracyOffset = RING_CIRCUMFERENCE * (1 - Math.min(100, stats.accuracy) / 100);

    container.innerHTML = `
      <div class="results-hero" style="--hero-ring-color:${tier.color}">
        <div class="hero-ring-wrap">
          <svg class="hero-ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle class="hero-ring__track" cx="100" cy="100" r="88"/>
            <circle class="hero-ring__fill" cx="100" cy="100" r="88"
                    id="hero-ring-fill" stroke-dashoffset="${RING_CIRCUMFERENCE}"/>
          </svg>
          <div class="hero-ring__content">
            <div class="hero-ring__value" id="hero-wpm-value">0</div>
            <div class="hero-ring__label">Net WPM</div>
          </div>
        </div>
        <div class="hero-tier">${tier.label}${isNewBest && pb ? ' · ★ New Best' : ''}</div>
        <div class="hero-sub"><strong>${stats.accuracy}%</strong> accuracy · <strong>${stats.grossWpm}</strong> gross WPM · <strong>${stats.cpm}</strong> CPM</div>
      </div>

      <div class="stat-strip">
        <div class="stat-strip__item">
          <div class="stat-strip__value">${stats.errorChars}</div>
          <div class="stat-strip__label">Errors</div>
        </div>
        <div class="stat-strip__divider"></div>
        <div class="stat-strip__item">
          <div class="stat-strip__value">${stats.correctChars}</div>
          <div class="stat-strip__label">Correct Chars</div>
        </div>
        <div class="stat-strip__divider"></div>
        <div class="stat-strip__item">
          <div class="stat-strip__value">${stats.elapsedSeconds}s</div>
          <div class="stat-strip__label">Time</div>
        </div>
        <div class="stat-strip__divider"></div>
        <div class="stat-strip__item">
          <div class="stat-strip__value">${stats.consistency}%</div>
          <div class="stat-strip__label">Consistency</div>
        </div>
      </div>
    `;

    animateCount(TypingAuraUtils.$('#hero-wpm-value'), wpm, 900);

    const ringFill = TypingAuraUtils.$('#hero-ring-fill');
    if (ringFill) {
      // Force a reflow before changing dashoffset so the CSS transition
      // actually animates from "empty" instead of jumping straight to value
      ringFill.getBoundingClientRect();
      requestAnimationFrame(() => {
        ringFill.style.strokeDashoffset = accuracyOffset;
      });
    }
  }

  function renderPbComparison(stats, pb, isNewBest) {
    const container = TypingAuraUtils.$('#pb-comparison');
    if (!container) return;

    if (!pb) {
      container.innerHTML = `
        <div class="pb-item">
          <div class="pb-item__label">This Session</div>
          <div class="pb-item__value">${Math.round(stats.netWpm)} WPM</div>
        </div>
        <div class="pb-gap">First session — your benchmark is set.</div>
      `;
      return;
    }

    const gap   = TypingAuraUtils.round(stats.netWpm - pb.netWpm, 1);
    const ahead = gap >= 0;
    container.innerHTML = `
      <div class="pb-item">
        <div class="pb-item__label">This Session</div>
        <div class="pb-item__value">${Math.round(stats.netWpm)} WPM</div>
      </div>
      <div class="pb-gap ${ahead ? 'pb-gap--improved' : ''}">
        ${ahead
          ? `▲ ${Math.abs(gap)} WPM above your best`
          : `${Math.abs(gap)} WPM away from your best`}
      </div>
      <div class="pb-item pb-item--best">
        <div class="pb-item__label">Personal Best</div>
        <div class="pb-item__value">${Math.round(pb.netWpm)} WPM</div>
      </div>
    `;
  }

  /* ----------------------------------------------------------
     SESSION TREND — last 5 scores (I7)
  ---------------------------------------------------------- */
  function renderSessionTrend(duration) {
    const hist      = TypingAuraStats.getRecentHistory(duration, 5);
    const container = TypingAuraUtils.$('#trend-container');
    const trendEl   = TypingAuraUtils.$('#session-trend');
    if (!container || !trendEl || hist.length < 2) return;

    container.style.display = 'block';

    trendEl.innerHTML = `
      <div style="display:flex; gap:var(--space-4); align-items:flex-end;
                  justify-content:center; padding:var(--space-2) 0;">
        ${hist.slice().reverse().map((s, i) => {
          const maxWpm  = Math.max(...hist.map(h => h.netWpm), 1);
          const pct     = Math.round((s.netWpm / maxWpm) * 100);
          const isLast  = i === hist.length - 1;
          return `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
              <span style="font-family:var(--font-mono); font-size:10px;
                           color:${isLast ? 'var(--neon-cyan)' : 'var(--text-muted)'};">
                ${Math.round(s.netWpm)}
              </span>
              <div style="
                width: 32px;
                height: ${Math.max(pct * 0.8, 4)}px;
                background: ${isLast ? 'var(--neon-cyan)' : 'var(--bg-elevated)'};
                border: 1px solid ${isLast ? 'var(--neon-cyan)' : 'var(--border-normal)'};
                border-radius: 3px 3px 0 0;
                box-shadow: ${isLast ? 'var(--glow-cyan)' : 'none'};
                transition: height 400ms ease;
              "></div>
              <span style="font-size:9px; color:var(--text-muted);">
                ${i === hist.length - 1 ? 'now' : '#' + (hist.length - i)}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ----------------------------------------------------------
     WPM GRAPH — Q4 fix: offsetWidth fallback
  ---------------------------------------------------------- */
  function renderGraph(wpmData) {
    const canvas = TypingAuraUtils.$('#wpm-graph');
    if (!canvas || !wpmData || wpmData.length < 2) return;

    const ctx = canvas.getContext('2d');
    // Q4 fix: use explicit 800px fallback if element not visible yet
    const W   = canvas.offsetWidth || 800;
    const H   = canvas.offsetHeight || 140;

    canvas.width  = W;
    canvas.height = H;

    const maxWpm = Math.max(...wpmData.map(d => d.wpm), 10);
    const pad    = { top:12, right:16, bottom:24, left:40 };
    const cW     = W - pad.left - pad.right;
    const cH     = H - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }

    // Y labels
    ctx.fillStyle = 'rgba(136,136,187,0.7)';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (cH / 4) * i;
      ctx.fillText(Math.round(maxWpm * (1 - i / 4)), pad.left - 6, y + 3);
    }

    const xOf = i => pad.left + (i / (wpmData.length - 1)) * cW;
    const yOf = wpm => pad.top + (1 - wpm / maxWpm) * cH;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(0,229,255,0.25)');
    grad.addColorStop(1, 'rgba(0,229,255,0)');

    ctx.beginPath();
    wpmData.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p.wpm)) : ctx.lineTo(xOf(i), yOf(p.wpm)));
    ctx.lineTo(xOf(wpmData.length - 1), H - pad.bottom);
    ctx.lineTo(pad.left, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    wpmData.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p.wpm)) : ctx.lineTo(xOf(i), yOf(p.wpm)));
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur  = 6;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // Dots
    wpmData.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(p.wpm), 3, 0, Math.PI * 2);
      ctx.fillStyle   = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    // X labels
    ctx.fillStyle = 'rgba(136,136,187,0.7)';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'center';
    wpmData.forEach((p, i) => {
      if (i % 2 === 0 || i === wpmData.length - 1) {
        ctx.fillText(p.second + 's', xOf(i), H - 4);
      }
    });
  }

  function renderErrorBreakdown(problemChars) {
    const container = TypingAuraUtils.$('#error-breakdown');
    if (!container) return;
    if (!problemChars || !problemChars.length) {
      container.innerHTML = `<div class="no-errors">✓ No repeated errors — clean session.</div>`;
      return;
    }
    const maxCount = problemChars[0].count;
    container.innerHTML = problemChars.map(({ expected, typed, count }) => `
      <div class="error-row">
        <div class="error-row__char">${TypingAuraUtils.escapeHtml(expected)}</div>
        <div class="error-row__bar-wrap">
          <div class="error-row__bar" style="width:${(count / maxCount) * 100}%"></div>
        </div>
        <div class="error-row__count">${count}×</div>
      </div>
    `).join('');
  }

  function renderTip(stats) {
    const container = TypingAuraUtils.$('#improvement-tip');
    if (!container) return;
    const tip = TypingAuraStats.generateTip(stats);
    container.innerHTML = `
      <div class="tip-icon">${tip.icon}</div>
      <div class="tip-text">${tip.text}</div>
    `;
  }

  function renderActions(stats, duration, lessonContext) {
    const container = TypingAuraUtils.$('#results-actions');
    if (!container) return;

    if (lessonContext) {
      const { passed, hasNext } = lessonContext;
      const primaryLabel = passed
        ? (hasNext ? 'Next Lesson' : 'Back to Lessons')
        : 'Retry Lesson';

      container.innerHTML = `
        <button class="btn-primary"   id="btn-lesson-primary">${primaryLabel}</button>
        <button class="btn-secondary" id="btn-lesson-back">All Lessons</button>
      `;
      TypingAuraUtils.$('#btn-lesson-primary')?.addEventListener('click', () => {
        if (passed && hasNext) TypingAuraUtils.emit('typingaura:next-lesson');
        else if (passed)       TypingAuraUtils.emit('typingaura:back-to-lessons');
        else                   TypingAuraUtils.emit('typingaura:retry-lesson');
      });
      TypingAuraUtils.$('#btn-lesson-back')?.addEventListener('click',
        () => TypingAuraUtils.emit('typingaura:back-to-lessons'));
      return;
    }

    // Certificate is only offered for genuine free-test sessions of
    // meaningful length — never for lesson attempts (handled above)
    const showCertificate = typeof TypingAuraCertificate !== 'undefined'
      && TypingAuraCertificate.isEligible(duration);

    container.innerHTML = `
      <button class="btn-primary"   id="btn-play-again">Play Again</button>
      <button class="btn-secondary" id="btn-change-duration">Change Duration</button>
      <button class="btn-secondary" id="btn-practice-weak">Practice Weak Keys</button>
      ${showCertificate ? '<button class="btn-secondary" id="btn-get-certificate">Get Certificate</button>' : ''}
    `;
    TypingAuraUtils.$('#btn-play-again')?.addEventListener('click',
      () => TypingAuraUtils.emit('typingaura:restart'));
    TypingAuraUtils.$('#btn-change-duration')?.addEventListener('click',
      () => TypingAuraUtils.emit('typingaura:restart'));
    TypingAuraUtils.$('#btn-practice-weak')?.addEventListener('click',
      () => TypingAuraUtils.emit('typingaura:golearn'));

    if (showCertificate) {
      TypingAuraUtils.$('#btn-get-certificate')?.addEventListener('click',
        () => TypingAuraUtils.emit('typingaura:get-certificate', { stats, duration }));
    }
  }

  return { show, renderGraph };

})();
