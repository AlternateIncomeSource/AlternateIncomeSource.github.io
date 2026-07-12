/* ============================================================
   TYPINGAURA — sound.js
   Key click and feedback audio using the Web Audio API.
   No audio files needed — all sounds are synthesized in-browser.
   ============================================================ */

const TypingAuraSound = (() => {

  let audioCtx = null;
  let enabled = true;

  /* ----------------------------------------------------------
     AUDIO CONTEXT INIT
     Created lazily on first user interaction (browser rule)
  ---------------------------------------------------------- */
  function initContext() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      // Web Audio not supported — silent fail, typing continues
      enabled = false;
    }
  }

  /* ----------------------------------------------------------
     CORE SOUND PLAYER
     Creates a brief oscillator tone — efficient and GC-friendly
  ---------------------------------------------------------- */
  function playTone(options) {
    if (!enabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const {
      frequency = 800,
      type      = 'sine',     // sine | square | sawtooth | triangle
      volume    = 0.08,
      attack    = 0.001,      // seconds
      decay     = 0.06,       // seconds
    } = options;

    try {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now  = audioCtx.currentTime;

      osc.type      = type;
      osc.frequency.setValueAtTime(frequency, now);

      // Tiny attack then decay — mechanical key feel
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + attack + decay + 0.01);
    } catch {
      // Silently ignore any audio errors
    }
  }

  /* ----------------------------------------------------------
     NAMED SOUNDS
  ---------------------------------------------------------- */

  /** Standard key press — short, crisp click */
  function keyClick() {
    playTone({
      frequency: 1200,
      type:      'square',
      volume:    0.05,
      attack:    0.001,
      decay:     0.04,
    });
  }

  /** Error key — lower, softer thud */
  function keyError() {
    playTone({
      frequency: 280,
      type:      'sawtooth',
      volume:    0.07,
      attack:    0.001,
      decay:     0.08,
    });
  }

  /** Space bar press — slightly fuller */
  function keySpace() {
    playTone({
      frequency: 900,
      type:      'sine',
      volume:    0.06,
      attack:    0.001,
      decay:     0.05,
    });
  }

  /** Achievement unlock — two-tone chime */
  function achieveUnlock() {
    if (!enabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // First note
    playTone({ frequency: 880, type: 'sine', volume: 0.12, attack: 0.005, decay: 0.2 });

    // Second note slightly delayed
    setTimeout(() => {
      playTone({ frequency: 1320, type: 'sine', volume: 0.1, attack: 0.005, decay: 0.3 });
    }, 120);
  }

  /** Personal best — triumphant rising tone */
  function personalBest() {
    if (!enabled || !audioCtx) return;
    [440, 550, 660, 880].forEach((freq, i) => {
      setTimeout(() => {
        playTone({ frequency: freq, type: 'sine', volume: 0.1, attack: 0.005, decay: 0.18 });
      }, i * 80);
    });
  }

  /** Test complete — soft end chime */
  function testComplete() {
    if (!enabled || !audioCtx) return;
    playTone({ frequency: 660, type: 'sine', volume: 0.1, attack: 0.005, decay: 0.25 });
    setTimeout(() => {
      playTone({ frequency: 550, type: 'sine', volume: 0.08, attack: 0.005, decay: 0.3 });
    }, 200);
  }

  /* ----------------------------------------------------------
     MUTE / UNMUTE CONTROLS
  ---------------------------------------------------------- */

  function toggle() {
    enabled = !enabled;
    TypingAuraUtils.lsSet('sound_enabled', enabled);
    return enabled;
  }

  function setEnabled(state) {
    enabled = !!state;
  }

  function isEnabled() {
    return enabled;
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init() {
    // Restore mute preference from last session
    const saved = TypingAuraUtils.lsGet('sound_enabled');
    if (saved !== null) enabled = !!saved;

    // Web Audio context must be created on user gesture
    // We init it on the first keydown to satisfy browser policy
    document.addEventListener('keydown', initContext, { once: true });
    document.addEventListener('click',   initContext, { once: true });
    document.addEventListener('touchstart', initContext, { once: true, passive: true });
  }

  return {
    init,
    keyClick,
    keyError,
    keySpace,
    achieveUnlock,
    personalBest,
    testComplete,
    toggle,
    setEnabled,
    isEnabled
  };

})();
