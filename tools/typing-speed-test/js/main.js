/* ============================================================
   TYPINGAURA — main.js  (v2 — all bugs fixed)
   App entry point. Boots all modules. Wires events together.
   Loads LAST — all other JS files must already be loaded.
   ============================================================ */

const TypingAura = (() => {

  /* ----------------------------------------------------------
     APP STATE
  ---------------------------------------------------------- */
  let currentMode     = 'test';
  let currentDuration = 60;
  let sessionStats    = null;
  let hasFinished     = false;   // C4 guard: prevents double-finish
  let activeLessonId  = null;    // set while practising a specific lesson; null in free Test mode

  /* ----------------------------------------------------------
     BOOT
  ---------------------------------------------------------- */
  function boot() {
    TypingAuraSound.init();
    TypingAuraTimer.init();
    TypingAuraEngine.init();
    TypingAuraKeyboard.init();
    TypingAuraEffects.init();
    TypingAuraStats.init();
    TypingAuraAchievements.init();
    TypingAuraLessons.init();
    TypingAuraOnboarding.init();
    TypingAuraCertificate.init();

    bindDurationSelector();
    bindModeNav();
    bindRestartButtons();
    bindSoundToggle();
    bindTypingArea();
    bindEngineEvents();
    bindTimerEvents();
    bindResultEvents();
    bindCapsLockDetection();
    bindGettingStarted();

    showMode('test');
    updateSoundIcon();
    checkDailyStreak();

    // Restore last duration
    const saved = TypingAuraUtils.lsGet('duration');
    if (saved) setDuration(saved, false);

    // Auto-focus after keyboard renders (300ms lets keyboard build first)
    setTimeout(() => autoFocusTypingArea(), 300);
  }

  /* ----------------------------------------------------------
     AUTO-FOCUS (I8)
     Focuses the hidden input so user can start typing immediately
     without clicking first.
  ---------------------------------------------------------- */
  function autoFocusTypingArea() {
    const input = TypingAuraUtils.$('#hidden-input');
    if (input) input.focus();

    // Hide the overlay so text is visible
    // (overlay will reappear on restart — it just signals readiness)
    const overlay = TypingAuraUtils.$('#typing-overlay');
    if (overlay) overlay.classList.add('hidden');

    TypingAuraUtils.$('.typing-display')?.classList.add('is-focused');
  }

  /* ----------------------------------------------------------
     MODE SWITCHING
  ---------------------------------------------------------- */
  function showMode(mode) {
    currentMode = mode;

    TypingAuraUtils.$$('.app-section').forEach(el => {
      el.classList.remove('active');
    });

    const map = {
      'test':       'test-mode',
      'results':    'results-mode',
      'lessons':    'lessons-mode',
      'onboarding': 'onboarding-mode'
    };

    const section = TypingAuraUtils.$('#' + map[mode]);
    if (section) section.classList.add('active');

    TypingAuraUtils.$$('.mode-btn').forEach(btn => {
      const isActive = btn.dataset.mode === mode ||
                      (mode === 'results' && btn.dataset.mode === 'test');
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  /* ----------------------------------------------------------
     DURATION SELECTOR
  ---------------------------------------------------------- */
  function bindDurationSelector() {
    TypingAuraUtils.$$('.duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setDuration(parseInt(btn.dataset.duration, 10));
      });
    });
  }

  function setDuration(seconds, restart = true) {
    currentDuration = seconds;
    TypingAuraTimer.setDuration(seconds);
    TypingAuraUtils.lsSet('duration', seconds);

    TypingAuraUtils.$$('.duration-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.duration, 10) === seconds);
    });

    if (restart) restartTest();
  }

  /* ----------------------------------------------------------
     MODE NAV
  ---------------------------------------------------------- */
  function bindModeNav() {
    TypingAuraUtils.$$('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        TypingAuraOnboarding.stop();
        if (mode === 'test') {
          exitLessonPractice();
          showMode('test');
          restartTest();
        } else if (mode === 'lessons') {
          showMode('lessons');
          renderLessonsView();
        }
      });
    });
  }

  // Leaving a lesson (via the Test tab, or after finishing) must clear the
  // lesson flag and hide the lesson panel — otherwise stale lesson info
  // (title, step badge, progress bar) stays visible on top of free typing.
  function exitLessonPractice() {
    activeLessonId = null;
    const panel = TypingAuraUtils.$('#lesson-panel');
    if (panel) panel.classList.remove('active');
    TypingAuraKeyboard.clearHint();
    const hintEl = TypingAuraUtils.$('#lesson-hint');
    if (hintEl) hintEl.classList.remove('visible');
  }

  /* ----------------------------------------------------------
     TYPING AREA & KEYDOWN ROUTING
  ---------------------------------------------------------- */
  function bindTypingArea() {
    const display = TypingAuraUtils.$('#typing-area');
    const input   = TypingAuraUtils.$('#hidden-input');
    const overlay = TypingAuraUtils.$('#typing-overlay');

    display?.addEventListener('click', () => {
      input?.focus();
      overlay?.classList.add('hidden');
      TypingAuraUtils.$('.typing-display')?.classList.add('is-focused');
    });

    document.addEventListener('keydown', e => {
      if (currentMode !== 'test') return;

      // Never intercept browser shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // ── C1 FIX: Prevent Space from scrolling the page ─────
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }

      // Tab = restart (prevent focus trap)
      if (e.key === 'Tab') {
        e.preventDefault();
        restartTest();
        return;
      }

      // Escape = restart
      if (e.key === 'Escape') {
        restartTest();
        return;
      }

      // Show typing area as active on first keypress
      overlay?.classList.add('hidden');
      TypingAuraUtils.$('.typing-display')?.classList.add('is-focused');

      // Start timer on first real character or backspace
      if (!TypingAuraTimer.getIsRunning() && !TypingAuraTimer.getHasStarted()) {
        if (e.key.length === 1 || e.key === 'Backspace') {
          TypingAuraTimer.start();
        }
      }

      TypingAuraEngine.handleKeydown(e);
    });

    // Remove focus indicator when clicking outside typing area
    document.addEventListener('click', e => {
      if (!display?.contains(e.target)) {
        TypingAuraUtils.$('.typing-display')?.classList.remove('is-focused');
      }
    });
  }

  /* ----------------------------------------------------------
     CAPS LOCK DETECTION (I6)
  ---------------------------------------------------------- */
  function bindCapsLockDetection() {
    const warning = TypingAuraUtils.$('#caps-warning');
    if (!warning) return;

    document.addEventListener('keydown', e => {
      if (typeof e.getModifierState === 'function') {
        const capsOn = e.getModifierState('CapsLock');
        warning.style.display = capsOn ? 'flex' : 'none';
      }
    });

    document.addEventListener('keyup', e => {
      if (typeof e.getModifierState === 'function') {
        const capsOn = e.getModifierState('CapsLock');
        warning.style.display = capsOn ? 'flex' : 'none';
      }
    });
  }

  /* ----------------------------------------------------------
     ENGINE EVENTS
  ---------------------------------------------------------- */
  function bindEngineEvents() {
    TypingAuraUtils.on('typingaura:keypress', e => {
      const { correct, char } = e.detail;
      if (correct) {
        char === ' ' ? TypingAuraSound.keySpace() : TypingAuraSound.keyClick();
      } else {
        TypingAuraSound.keyError();
        TypingAuraUtils.flashClass(
          TypingAuraUtils.$('.typing-display'), 'shake', 300
        );
      }
    });

    // Engine fires complete when all chars typed (user faster than timer)
    TypingAuraUtils.on('typingaura:complete', e => {
      if (hasFinished) return;   // C4 guard
      hasFinished = true;
      TypingAuraTimer.stop();
      finishTest(e.detail);
    });
  }

  /* ----------------------------------------------------------
     TIMER EVENTS
  ---------------------------------------------------------- */
  function bindTimerEvents() {
    TypingAuraTimer.onTick((remaining, elapsed) => {
      updateLiveStats(elapsed);
      updateTimerDisplay(remaining);
    });

    TypingAuraTimer.onEnd(() => {
      if (hasFinished) return;   // C4 guard
      hasFinished = true;
      finishTest(TypingAuraEngine.getSessionData());
    });
  }

  function updateTimerDisplay(remaining) {
    const el = TypingAuraUtils.$('#live-timer');
    if (!el) return;
    el.textContent = remaining;

    if (remaining <= 5 && remaining > 0) {
      el.style.animation = 'timerWarning 500ms ease-in-out infinite';
    } else {
      el.style.animation = '';
      el.style.color     = '';
      el.style.textShadow = '';
    }
  }

  // Same speed bands as the results screen tiers, reduced to just a colour
  // for the live in-progress glow. Only re-applied when the tier changes
  // (not every tick) so the glow drifts calmly instead of flickering.
  let lastAuraTier = null;
  function auraColorForWpm(wpm) {
    if (wpm < 20)  return 'var(--neon-blue)';
    if (wpm < 38)  return 'var(--neon-cyan)';
    if (wpm < 60)  return 'var(--neon-green)';
    if (wpm < 75)  return 'var(--neon-purple)';
    return 'var(--neon-gold)';
  }

  function updateLiveStats(elapsedSeconds) {
    const elapsedMs = elapsedSeconds * 1000;
    const data      = TypingAuraEngine.getSessionData();

    const liveWpm = elapsedMs > 0
      ? Math.max(0, Math.round((data.correctChars / 5) / (elapsedMs / 60000)))
      : 0;

    const acc = data.typedChars > 0
      ? Math.round((data.correctChars / data.typedChars) * 100)
      : 100;

    const wpmEl = TypingAuraUtils.$('#live-wpm');
    const accEl = TypingAuraUtils.$('#live-acc');
    if (wpmEl) wpmEl.textContent = liveWpm;
    if (accEl) accEl.textContent = acc + '%';

    const tier = Math.min(4, Math.floor(liveWpm / 20)); // coarse bucket, changes rarely
    if (tier !== lastAuraTier) {
      lastAuraTier = tier;
      const display = TypingAuraUtils.$('.typing-display');
      if (display) display.style.setProperty('--aura-color', auraColorForWpm(liveWpm));
    }
  }

  /* ----------------------------------------------------------
     FINISH TEST
  ---------------------------------------------------------- */
  function finishTest(rawData) {
    // Guard: don't finish if nothing was typed
    if (!rawData || rawData.typedChars === 0) {
      restartTest();
      return;
    }

    const elapsedMs  = TypingAuraTimer.getElapsedMs();
    sessionStats     = TypingAuraStats.analyse(rawData, elapsedMs);

    TypingAuraStats.saveSession(sessionStats, currentDuration);

    const history = TypingAuraStats.getRecentHistory(currentDuration, 100);
    TypingAuraAchievements.checkAll(sessionStats, history, currentDuration);

    // Generate share card data (B3)
    generateShareCard(sessionStats);

    if (activeLessonId) {
      const lesson  = TypingAuraLessons.getLesson(activeLessonId);
      const passed  = TypingAuraLessons.checkLessonComplete(sessionStats);
      const hasNext = !!TypingAuraLessons.getNextLesson(activeLessonId);
      TypingAuraResults.show(sessionStats, currentDuration, { lesson, passed, hasNext });
    } else {
      TypingAuraResults.show(sessionStats, currentDuration);
    }

    showMode('results');
  }

  /* ----------------------------------------------------------
     SCORE SHARE CARD (Bonus B3)
  ---------------------------------------------------------- */
  function generateShareCard(stats) {
    const card = TypingAuraUtils.$('#share-card');
    if (!card) return;

    const text =
      `⚡ I typed ${Math.round(stats.netWpm)} WPM at ${stats.accuracy}% accuracy\n` +
      `🎯 Test it yourself → alternateincomesource.com/tools/typing-speed-test/`;

    card.style.display = 'block';
    card.innerHTML = `
      <div style="
        background: var(--bg-elevated);
        border: 1px solid var(--border-normal);
        border-radius: var(--radius-lg);
        padding: var(--space-4) var(--space-5);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-secondary);
        white-space: pre-line;
        line-height: var(--leading-normal);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-4);
      ">
        <span>${text}</span>
        <button id="btn-copy-score" style="
          flex-shrink: 0;
          font-family: var(--font-ui);
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--neon-cyan);
          background: rgba(0,229,255,0.08);
          border: 1px solid rgba(0,229,255,0.2);
          border-radius: var(--radius-full);
          padding: var(--space-2) var(--space-4);
          cursor: pointer;
        " aria-label="Copy score to clipboard">Copy Score</button>
      </div>
    `;

    TypingAuraUtils.$('#btn-copy-score')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(text).then(() => {
        const btn = TypingAuraUtils.$('#btn-copy-score');
        if (btn) {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy Score'; }, 2000);
        }
      }).catch(() => {
        // Fallback for browsers without clipboard API
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    });
  }

  /* ----------------------------------------------------------
     RESULT PAGE EVENTS
  ---------------------------------------------------------- */
  function bindResultEvents() {
    TypingAuraUtils.on('typingaura:restart', () => {
      restartTest();
      showMode('test');
    });

    TypingAuraUtils.on('typingaura:golearn', () => {
      const rec = sessionStats?.problemChars
        ? TypingAuraLessons.recommend(sessionStats.problemChars)
        : null;

      if (rec) {
        startLessonPractice(rec.lesson.id);
      } else {
        showMode('lessons');
        renderLessonsView();
      }
    });

    TypingAuraUtils.on('typingaura:next-lesson', () => {
      const next = activeLessonId ? TypingAuraLessons.getNextLesson(activeLessonId) : null;
      if (next) {
        startLessonPractice(next.id);
      } else {
        exitLessonPractice();
        showMode('lessons');
        renderLessonsView();
      }
    });

    TypingAuraUtils.on('typingaura:retry-lesson', () => {
      if (activeLessonId) startLessonPractice(activeLessonId);
    });

    TypingAuraUtils.on('typingaura:get-certificate', e => {
      const { stats, duration } = e.detail || {};
      if (stats) TypingAuraCertificate.openForSession(stats, duration);
    });

    TypingAuraUtils.on('typingaura:back-to-lessons', () => {
      exitLessonPractice();
      showMode('lessons');
      renderLessonsView();
    });
  }

  /* ----------------------------------------------------------
     RESTART
  ---------------------------------------------------------- */
  function bindRestartButtons() {
    TypingAuraUtils.$('#btn-restart')?.addEventListener('click', restartTest);
  }

  function resetAuraColor() {
    lastAuraTier = null;
    const display = TypingAuraUtils.$('.typing-display');
    if (display) display.style.setProperty('--aura-color', 'var(--neon-cyan)');
  }

  function restartTest() {
    hasFinished = false;   // Reset C4 guard
    resetAuraColor();

    TypingAuraTimer.reset();

    if (activeLessonId) {
      TypingAuraLessons.startLesson(activeLessonId);   // same lesson, fresh attempt
    } else {
      TypingAuraEngine.newTest();                       // free test, fresh random words
    }

    TypingAuraKeyboard.clearHint();

    // Reset UI
    const overlay = TypingAuraUtils.$('#typing-overlay');
    if (overlay) overlay.classList.remove('hidden');
    TypingAuraUtils.$('.typing-display')?.classList.remove('is-focused');

    const wpmEl   = TypingAuraUtils.$('#live-wpm');
    const accEl   = TypingAuraUtils.$('#live-acc');
    const timerEl = TypingAuraUtils.$('#live-timer');

    if (wpmEl)   wpmEl.textContent   = '0';
    if (accEl)   accEl.textContent   = '100%';
    if (timerEl) {
      timerEl.textContent  = currentDuration;
      timerEl.style.animation = '';
    }

    // Re-focus so user can type immediately
    setTimeout(() => autoFocusTypingArea(), 50);
  }

  /* ----------------------------------------------------------
     LESSONS VIEW
  ---------------------------------------------------------- */
  function renderLessonsView() {
    const container = TypingAuraUtils.$('#lessons-grid');
    if (!container) return;

    const levelNames = { 1:'Foundation', 2:'Expansion', 3:'Speed', 4:'Mastery' };

    container.innerHTML = [1, 2, 3, 4].map(level => {
      const lessons   = TypingAuraLessons.getLevelLessons(level);
      const doneCount = TypingAuraLessons.getCompletedCount(level);

      const dots = lessons.map(l =>
        `<div class="level-dot ${TypingAuraLessons.isComplete(l.id) ? 'done' : ''}"
              aria-label="${TypingAuraLessons.isComplete(l.id) ? 'Completed' : 'Not yet completed'}"></div>`
      ).join('');

      return `
        <div class="level-card" data-level="${level}" role="button" tabindex="0"
             aria-label="Level ${level}: ${levelNames[level]}, ${doneCount} of ${lessons.length} lessons complete">
          <div class="level-number">${level}</div>
          <div class="level-name">${levelNames[level]}</div>
          <div class="level-desc">${lessons.length} lessons · ${doneCount} done</div>
          <div class="level-progress">${dots}</div>
        </div>
      `;
    }).join('');

    TypingAuraUtils.$$('.level-card').forEach(card => {
      const activate = () => {
        const level = parseInt(card.dataset.level, 10);
        showLevelLessons(level);
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });

    // Render achievements in Learn mode
    TypingAuraAchievements.renderList('achievements-grid');

    // Reflect whether the Getting Started guide has been completed before
    const badge = TypingAuraUtils.$('#getting-started-badge');
    if (badge) badge.hidden = !TypingAuraOnboarding.isDone();
  }

  function showLevelLessons(level) {
    const lessons = TypingAuraLessons.getLevelLessons(level);
    if (!lessons.length) return;

    const next = lessons.find(l => !TypingAuraLessons.isComplete(l.id)) || lessons[0];
    startLessonPractice(next.id);
  }

  /* ----------------------------------------------------------
     GETTING STARTED (onboarding guide)
  ---------------------------------------------------------- */
  function bindGettingStarted() {
    TypingAuraUtils.$('#btn-getting-started')?.addEventListener('click', () => {
      showMode('onboarding');
      TypingAuraOnboarding.start();
    });

    // Finished the guide naturally (clicked through to "Start Lesson 1 →")
    TypingAuraUtils.on('typingaura:onboarding-complete', () => {
      const firstLesson = TypingAuraLessons.getLevelLessons(1)[0];
      if (firstLesson) {
        startLessonPractice(firstLesson.id);
      } else {
        showMode('lessons');
        renderLessonsView();
      }
    });

    // Skipped — just go back to the lessons grid, no forced lesson start
    TypingAuraUtils.on('typingaura:onboarding-skip', () => {
      showMode('lessons');
      renderLessonsView();
    });
  }

  // Shared entry point for starting a lesson from anywhere (level card,
  // "Next Lesson", "Retry Lesson", or the "Practice Weak Keys" recommendation).
  // Keeps activeLessonId, the visible lesson panel, and the live stat
  // display all in sync regardless of where the lesson was launched from.
  function startLessonPractice(lessonId) {
    activeLessonId = lessonId;
    hasFinished    = false;
    resetAuraColor();

    TypingAuraTimer.reset();
    TypingAuraLessons.startLesson(lessonId);
    showMode('test');

    const panel = TypingAuraUtils.$('#lesson-panel');
    if (panel) panel.classList.add('active');

    const overlay = TypingAuraUtils.$('#typing-overlay');
    if (overlay) overlay.classList.remove('hidden');
    TypingAuraUtils.$('.typing-display')?.classList.remove('is-focused');

    const wpmEl   = TypingAuraUtils.$('#live-wpm');
    const accEl   = TypingAuraUtils.$('#live-acc');
    const timerEl = TypingAuraUtils.$('#live-timer');
    if (wpmEl)   wpmEl.textContent = '0';
    if (accEl)   accEl.textContent = '100%';
    if (timerEl) {
      timerEl.textContent = currentDuration;
      timerEl.style.animation = '';
    }

    setTimeout(() => autoFocusTypingArea(), 50);
  }

  /* ----------------------------------------------------------
     SOUND TOGGLE
  ---------------------------------------------------------- */
  function bindSoundToggle() {
    TypingAuraUtils.$('#btn-sound')?.addEventListener('click', () => {
      TypingAuraSound.toggle();
      updateSoundIcon();
    });
  }

  function updateSoundIcon() {
    const btn = TypingAuraUtils.$('#btn-sound');
    if (!btn) return;
    const on = TypingAuraSound.isEnabled();
    btn.setAttribute('aria-label', on ? 'Mute sound' : 'Unmute sound');
    btn.title = on ? 'Mute sound' : 'Unmute sound';
    btn.classList.toggle('active', on);

    // Swap SVG to show muted / unmuted state
    btn.innerHTML = on
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
           <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
           <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
         </svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
           <line x1="23" y1="9" x2="17" y2="15"/>
           <line x1="17" y1="9" x2="23" y2="15"/>
         </svg>`;
  }

  /* ----------------------------------------------------------
     DAILY STREAK (Bonus B2)
  ---------------------------------------------------------- */
  function checkDailyStreak() {
    const banner   = TypingAuraUtils.$('#streak-banner');
    if (!banner) return;

    const today    = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastVisit = TypingAuraUtils.lsGet('last_visit_date');
    let streak      = TypingAuraUtils.lsGet('daily_streak') || 0;

    if (lastVisit === today) {
      // Already visited today — just show current streak
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastVisit === yesterday) {
        streak++;
      } else if (lastVisit && lastVisit !== today) {
        streak = 1; // Streak broken — restart at 1
      } else {
        streak = 1; // First ever visit
      }
      TypingAuraUtils.lsSet('last_visit_date', today);
      TypingAuraUtils.lsSet('daily_streak', streak);
    }

    if (streak >= 2) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="
          text-align: center;
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          color: var(--neon-gold);
          padding: var(--space-2) 0 var(--space-4);
          letter-spacing: 0.05em;
        ">🔥 Day ${streak} streak — keep it going</div>
      `;
    }
  }

  /* ----------------------------------------------------------
     START
  ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', boot);

  return { boot, restartTest, showMode, setDuration };

})();
