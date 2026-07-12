/* ============================================================
   onboarding.js — "Getting Started" hand-position guide
   A short guided walkthrough teaching home-row finger placement,
   reusing the existing finger-diagram SVG and RGB keyboard —
   no new visual system, just a guided front door to what
   already exists.
   Depends on: utilities.js, keyboard.js (loads after both)
   ============================================================ */

const TypingAuraOnboarding = (() => {

  const SVG_ID = 'onboarding-finger-diagram';
  const STEP_DELAY_MS = 450;

  const STEPS = [
    {
      title: 'Left Hand — Home Row',
      fingers: ['L5', 'L4', 'L3', 'L2'],
      keys:    ['KeyA', 'KeyS', 'KeyD', 'KeyF'],
      text: 'Rest your left hand here. Pinky on A, ring finger on S, middle finger on D, index finger on F. This is called the home row — your fingers always return here after pressing any other key.'
    },
    {
      title: 'Right Hand — Home Row',
      fingers: ['R2', 'R3', 'R4', 'R5'],
      keys:    ['KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
      text: 'Now the right hand. Index finger on J, middle finger on K, ring finger on L, pinky on the semicolon. Together, both hands cover the whole home row: A S D F  J K L ;'
    },
    {
      title: 'Finding Home Row Blind',
      fingers: ['L2', 'R2'],
      keys:    ['KeyF', 'KeyJ'],
      text: 'Feel the small raised bump on F and J? That is not a manufacturing flaw — it is there on purpose. Your index fingers can find these two bumps without looking, so you can find your entire home row without ever looking down.'
    },
    {
      title: 'Thumbs on the Space Bar',
      fingers: ['L1', 'R1'],
      keys:    ['Space'],
      text: 'Both thumbs rest lightly on the space bar. Either thumb can press it — most people naturally settle into whichever feels comfortable and just keep using that one.'
    },
    {
      title: 'Try It',
      fingers: ['L5', 'L4', 'L3', 'L2', 'R2', 'R3', 'R4', 'R5'],
      keys:    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
      text: 'That is the whole foundation. Every other key on the keyboard is just a short reach away from one of these eight positions. Ready to practice for real?'
    }
  ];

  let currentStep    = 0;
  let sequenceTimers = [];

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */
  function renderStep() {
    clearSequenceTimers();
    const step  = STEPS[currentStep];
    const total = STEPS.length;
    const isLast = currentStep === total - 1;

    const titleEl   = TypingAuraUtils.$('#onboarding-step-title');
    const textEl    = TypingAuraUtils.$('#onboarding-step-text');
    const counterEl = TypingAuraUtils.$('#onboarding-step-counter');
    const backBtn   = TypingAuraUtils.$('#btn-onboarding-back');
    const nextBtn   = TypingAuraUtils.$('#btn-onboarding-next');

    if (titleEl)   titleEl.textContent   = step.title;
    if (textEl)    textEl.textContent    = step.text;
    if (counterEl) counterEl.textContent = `Step ${currentStep + 1} of ${total}`;
    if (backBtn)   backBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
    if (nextBtn)   nextBtn.textContent   = isLast ? 'Start Lesson 1 →' : 'Next →';

    renderDots();
    playSequence(step);
  }

  function renderDots() {
    const container = TypingAuraUtils.$('#onboarding-dots');
    if (!container) return;
    container.innerHTML = STEPS.map((_, i) => {
      const cls = ['onboarding-dot'];
      if (i === currentStep) cls.push('active');
      if (i < currentStep)   cls.push('done');
      return `<span class="${cls.join(' ')}"></span>`;
    }).join('');
  }

  // Reveals fingers/keys one at a time, then leaves the full set of the
  // step lit together. Skips the stagger entirely under reduced motion —
  // shows the complete step state immediately instead.
  function playSequence(step) {
    TypingAuraKeyboard.clearFingerHighlight(SVG_ID);
    TypingAuraKeyboard.clearHint();

    if (TypingAuraUtils.prefersReducedMotion()) {
      TypingAuraKeyboard.highlightFinger(step.fingers, SVG_ID);
      TypingAuraKeyboard.hintKeys(step.keys);
      return;
    }

    step.fingers.forEach((_, i) => {
      const t = setTimeout(() => {
        TypingAuraKeyboard.highlightFinger(step.fingers.slice(0, i + 1), SVG_ID);
        TypingAuraKeyboard.hintKey(step.keys[i]);
      }, i * STEP_DELAY_MS);
      sequenceTimers.push(t);
    });

    // After the reveal finishes, hold the whole step's keys lit together
    const holdT = setTimeout(() => {
      TypingAuraKeyboard.hintKeys(step.keys);
    }, step.fingers.length * STEP_DELAY_MS);
    sequenceTimers.push(holdT);
  }

  function clearSequenceTimers() {
    sequenceTimers.forEach(t => clearTimeout(t));
    sequenceTimers = [];
  }

  /* ----------------------------------------------------------
     NAVIGATION
  ---------------------------------------------------------- */
  function goNext() {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderStep();
    } else {
      finish();
    }
  }

  function goBack() {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  }

  function finish() {
    clearSequenceTimers();
    TypingAuraKeyboard.clearFingerHighlight(SVG_ID);
    TypingAuraKeyboard.clearHint();
    TypingAuraUtils.lsSet('onboarding_done', true);
    TypingAuraUtils.emit('typingaura:onboarding-complete');
  }

  function skip() {
    clearSequenceTimers();
    TypingAuraKeyboard.clearFingerHighlight(SVG_ID);
    TypingAuraKeyboard.clearHint();
    TypingAuraUtils.lsSet('onboarding_done', true);
    TypingAuraUtils.emit('typingaura:onboarding-skip');
  }

  /* ----------------------------------------------------------
     PUBLIC
  ---------------------------------------------------------- */
  function start() {
    currentStep = 0;
    renderStep();
  }

  function isDone() {
    return !!TypingAuraUtils.lsGet('onboarding_done');
  }

  // Pure cleanup — used when the user navigates away mid-guide via the
  // header nav, without marking it done or firing a completion event.
  function stop() {
    clearSequenceTimers();
    TypingAuraKeyboard.clearFingerHighlight(SVG_ID);
    TypingAuraKeyboard.clearHint();
  }

  function bindEvents() {
    TypingAuraUtils.$('#btn-onboarding-next')?.addEventListener('click', goNext);
    TypingAuraUtils.$('#btn-onboarding-back')?.addEventListener('click', goBack);
    TypingAuraUtils.$('#btn-onboarding-skip')?.addEventListener('click', skip);
  }

  function init() {
    bindEvents();
  }

  return { init, start, isDone, stop };

})();
