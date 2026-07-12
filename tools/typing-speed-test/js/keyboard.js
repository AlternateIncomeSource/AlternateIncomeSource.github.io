/* ============================================================
   TYPINGAURA — keyboard.js  (v2 — cached positions, fixed hints)
   Renders the full RGB keyboard DOM.
   Pre-caches key positions to avoid reflow on every keypress.
   Fixed hintKey() to use correct KeyboardEvent.code format.
   ============================================================ */

const TypingAuraKeyboard = (() => {

  const LAYOUT = [
    [
      { label:'Esc',   key:'Escape',       width:1,    zone:'fn' },
      { label:'F1',    key:'F1',           width:1,    zone:'fn' },
      { label:'F2',    key:'F2',           width:1,    zone:'fn' },
      { label:'F3',    key:'F3',           width:1,    zone:'fn' },
      { label:'F4',    key:'F4',           width:1,    zone:'fn' },
      { label:'F5',    key:'F5',           width:1,    zone:'fn' },
      { label:'F6',    key:'F6',           width:1,    zone:'fn' },
      { label:'F7',    key:'F7',           width:1,    zone:'fn' },
      { label:'F8',    key:'F8',           width:1,    zone:'fn' },
      { label:'F9',    key:'F9',           width:1,    zone:'fn' },
      { label:'F10',   key:'F10',          width:1,    zone:'fn' },
      { label:'F11',   key:'F11',          width:1,    zone:'fn' },
      { label:'F12',   key:'F12',          width:1,    zone:'fn' },
      { label:'PrtSc', key:'PrintScreen',  width:1,    zone:'fn' },
      { label:'ScrLk', key:'ScrollLock',   width:1,    zone:'fn' },
      { label:'Pause', key:'Pause',        width:1,    zone:'fn' },
    ],
    [
      { label:'`',  sub:'~', key:'Backquote',    width:1,    zone:'left' },
      { label:'1',  sub:'!', key:'Digit1',        width:1,    zone:'left' },
      { label:'2',  sub:'@', key:'Digit2',        width:1,    zone:'left' },
      { label:'3',  sub:'#', key:'Digit3',        width:1,    zone:'left' },
      { label:'4',  sub:'$', key:'Digit4',        width:1,    zone:'left' },
      { label:'5',  sub:'%', key:'Digit5',        width:1,    zone:'mid'  },
      { label:'6',  sub:'^', key:'Digit6',        width:1,    zone:'mid'  },
      { label:'7',  sub:'&', key:'Digit7',        width:1,    zone:'right'},
      { label:'8',  sub:'*', key:'Digit8',        width:1,    zone:'right'},
      { label:'9',  sub:'(', key:'Digit9',        width:1,    zone:'right'},
      { label:'0',  sub:')', key:'Digit0',        width:1,    zone:'right'},
      { label:'-',  sub:'_', key:'Minus',         width:1,    zone:'right'},
      { label:'=',  sub:'+', key:'Equal',         width:1,    zone:'right'},
      { label:'⌫ Backspace', key:'Backspace',     width:2,    zone:'right'},
    ],
    [
      { label:'Tab',  key:'Tab',           width:1.5,  zone:'left' },
      { label:'Q',    key:'KeyQ',          width:1,    zone:'left' },
      { label:'W',    key:'KeyW',          width:1,    zone:'left' },
      { label:'E',    key:'KeyE',          width:1,    zone:'left' },
      { label:'R',    key:'KeyR',          width:1,    zone:'left' },
      { label:'T',    key:'KeyT',          width:1,    zone:'mid'  },
      { label:'Y',    key:'KeyY',          width:1,    zone:'mid'  },
      { label:'U',    key:'KeyU',          width:1,    zone:'right'},
      { label:'I',    key:'KeyI',          width:1,    zone:'right'},
      { label:'O',    key:'KeyO',          width:1,    zone:'right'},
      { label:'P',    key:'KeyP',          width:1,    zone:'right'},
      { label:'[', sub:'{', key:'BracketLeft',   width:1,    zone:'right'},
      { label:']', sub:'}', key:'BracketRight',  width:1,    zone:'right'},
      { label:'\\',sub:'|',key:'Backslash',      width:1.5,  zone:'right'},
    ],
    [
      { label:'Caps Lock', key:'CapsLock', width:1.75, zone:'left' },
      { label:'A', key:'KeyA',   width:1, zone:'left' },
      { label:'S', key:'KeyS',   width:1, zone:'left' },
      { label:'D', key:'KeyD',   width:1, zone:'left' },
      { label:'F', key:'KeyF',   width:1, zone:'left' },
      { label:'G', key:'KeyG',   width:1, zone:'mid'  },
      { label:'H', key:'KeyH',   width:1, zone:'mid'  },
      { label:'J', key:'KeyJ',   width:1, zone:'right'},
      { label:'K', key:'KeyK',   width:1, zone:'right'},
      { label:'L', key:'KeyL',   width:1, zone:'right'},
      { label:';', sub:':', key:'Semicolon', width:1, zone:'right'},
      { label:"'", sub:'"', key:'Quote',     width:1, zone:'right'},
      { label:'Enter', key:'Enter', width:2.25, zone:'right'},
    ],
    [
      { label:'Shift',  key:'ShiftLeft',   width:2.25, zone:'left' },
      { label:'Z', key:'KeyZ', width:1, zone:'left' },
      { label:'X', key:'KeyX', width:1, zone:'left' },
      { label:'C', key:'KeyC', width:1, zone:'left' },
      { label:'V', key:'KeyV', width:1, zone:'left' },
      { label:'B', key:'KeyB', width:1, zone:'mid'  },
      { label:'N', key:'KeyN', width:1, zone:'right'},
      { label:'M', key:'KeyM', width:1, zone:'right'},
      { label:',', sub:'<', key:'Comma',  width:1, zone:'right'},
      { label:'.', sub:'>', key:'Period', width:1, zone:'right'},
      { label:'/', sub:'?', key:'Slash',  width:1, zone:'right'},
      { label:'Shift', key:'ShiftRight', width:2.75, zone:'right'},
    ],
    [
      { label:'Ctrl',  key:'ControlLeft',  width:1.25, zone:'left'  },
      { label:'Win',   key:'MetaLeft',     width:1.25, zone:'left'  },
      { label:'Alt',   key:'AltLeft',      width:1.25, zone:'left'  },
      { label:'Space', key:'Space',        width:6.25, zone:'space' },
      { label:'Alt',   key:'AltRight',     width:1.25, zone:'right' },
      { label:'Win',   key:'MetaRight',    width:1.25, zone:'right' },
      { label:'Menu',  key:'ContextMenu',  width:1.25, zone:'right' },
      { label:'Ctrl',  key:'ControlRight', width:1.25, zone:'right' },
    ],
  ];

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  let keyEls           = {};   // code → DOM element
  let cachedPositions  = {};   // code → {x, y} — pre-cached to avoid reflow
  let isEnabled        = true;
  let isLowEnd         = false;
  let lastPressedCode  = null;
  let ambientRestoreTimer = null;

  /* ----------------------------------------------------------
     BUILD
  ---------------------------------------------------------- */
  function build() {
    const container = TypingAuraUtils.$('#keyboard-container');
    if (!container) return;

    if (TypingAuraUtils.isMobile()) {
      container.style.display = 'none';
      return;
    }

    const kbEl = document.createElement('div');
    kbEl.className = 'keyboard';
    kbEl.setAttribute('aria-hidden', 'true');
    kbEl.setAttribute('role', 'presentation');

    LAYOUT.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'key-row';
      row.forEach(def => {
        const el = buildKey(def);
        keyEls[def.key] = el;
        rowEl.appendChild(el);
      });
      kbEl.appendChild(rowEl);
    });

    container.appendChild(kbEl);

    // Pre-cache all key positions after a frame (layout must be painted first)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cacheKeyPositions();
        startAmbient(kbEl);
      });
    });
  }

  function buildKey(def) {
    const el = document.createElement('div');
    el.className   = `key zone-${def.zone}`;
    el.dataset.key  = def.key;
    el.style.width  = `calc(var(--key-unit) * ${def.width})`;

    if (def.sub) {
      const lbl = document.createElement('div');
      lbl.className = 'key__label';
      lbl.innerHTML =
        `<span class="top">${TypingAuraUtils.escapeHtml(def.sub)}</span>` +
        `<span class="bottom">${TypingAuraUtils.escapeHtml(def.label)}</span>`;
      el.appendChild(lbl);
    } else {
      el.textContent = def.label;
    }
    return el;
  }

  /* ----------------------------------------------------------
     PRE-CACHE KEY POSITIONS (Q2 fix — zero reflow during typing)
  ---------------------------------------------------------- */
  function cacheKeyPositions() {
    Object.entries(keyEls).forEach(([code, el]) => {
      const rect = el.getBoundingClientRect();
      cachedPositions[code] = { x: rect.left + rect.width / 2,
                                y: rect.top  + rect.height / 2 };
    });
  }

  // Re-cache on resize
  window.addEventListener('resize', TypingAuraUtils.debounce(() => {
    cacheKeyPositions();
  }, 200));

  /* ----------------------------------------------------------
     AMBIENT ANIMATION
  ---------------------------------------------------------- */
  function startAmbient(kbEl) {
    if (TypingAuraUtils.prefersReducedMotion() || isLowEnd) return;
    kbEl.classList.add('ambient');
  }

  function stopAmbient() {
    const kb = TypingAuraUtils.$('.keyboard');
    if (kb) kb.classList.remove('ambient');
  }

  function scheduleAmbientResume() {
    clearTimeout(ambientRestoreTimer);
    ambientRestoreTimer = setTimeout(() => {
      const kb = TypingAuraUtils.$('.keyboard');
      if (kb) kb.classList.add('ambient');
    }, 2000);
  }

  /* ----------------------------------------------------------
     KEY STATE CHANGES
  ---------------------------------------------------------- */
  function pressKey(code) {
    const el = keyEls[code];
    if (el) el.classList.add('key--active');
  }

  function releaseKey(code) {
    const el = keyEls[code];
    if (el) el.classList.remove('key--active');
  }

  function flashCorrect(code) {
    const el = keyEls[code];
    if (!el) return;
    TypingAuraUtils.flashClass(el, 'key--correct', 400);
    if (!isLowEnd) triggerRipple(code);
  }

  function flashError(code) {
    const el = keyEls[code];
    if (!el) return;
    TypingAuraUtils.flashClass(el, 'key--error', 500);
  }

  /* ----------------------------------------------------------
     RIPPLE — uses cached positions, zero layout reflow (Q2 fix)
  ---------------------------------------------------------- */
  function triggerRipple(pressedCode) {
    if (TypingAuraUtils.prefersReducedMotion() || isLowEnd) return;
    const origin = cachedPositions[pressedCode];
    if (!origin) return;

    Object.entries(cachedPositions).forEach(([code, pos]) => {
      if (code === pressedCode) return;
      const dist = Math.hypot(pos.x - origin.x, pos.y - origin.y);
      if (dist < 90) {
        setTimeout(() => {
          TypingAuraUtils.flashClass(keyEls[code], 'key--ripple', 350);
        }, 50);
      }
    });
  }

  /* ----------------------------------------------------------
     STREAK & RAINBOW
  ---------------------------------------------------------- */
  function streakOn() {
    Object.values(keyEls).forEach(el => el.classList.add('key--streak'));
  }

  function streakOff() {
    Object.values(keyEls).forEach(el => el.classList.remove('key--streak'));
  }

  function rainbowFlash() {
    if (TypingAuraUtils.prefersReducedMotion()) return;
    Object.values(keyEls).forEach((el, i) => {
      setTimeout(() => TypingAuraUtils.flashClass(el, 'key--rainbow', 1300), i * 3);
    });
  }

  /* ----------------------------------------------------------
     LESSON HINT (L1 fix — correct KeyboardEvent.code format)
  ---------------------------------------------------------- */
  function hintKey(code) {
    clearHint();
    // Accept both 'KeyA' format and single letter 'A' — normalize both
    let resolvedCode = code;
    if (code.length === 1) {
      // Single character passed — convert to KeyboardEvent.code format
      const char = code.toUpperCase();
      if (/[A-Z]/.test(char)) {
        resolvedCode = 'Key' + char;
      } else {
        // For special chars, try to find matching key by label
        const match = Object.entries(keyEls).find(([c, el]) =>
          el.textContent.trim() === code || el.dataset.key === code
        );
        if (match) resolvedCode = match[0];
      }
    }
    const el = keyEls[resolvedCode];
    if (el) el.classList.add('key--lesson-hint');
  }

  function clearHint() {
    Object.values(keyEls).forEach(el => el.classList.remove('key--lesson-hint'));
  }

  // Highlights several keys at once (e.g. a whole hand's worth of home-row
  // keys held together). Kept separate from hintKey() above so existing
  // single-key hint behaviour elsewhere is untouched.
  function hintKeys(codes) {
    clearHint();
    codes.forEach(code => {
      let resolvedCode = code;
      if (code.length === 1) {
        const char = code.toUpperCase();
        resolvedCode = /[A-Z]/.test(char) ? 'Key' + char : code;
      }
      const el = keyEls[resolvedCode];
      if (el) el.classList.add('key--lesson-hint');
    });
  }

  // Lights up one or more fingers on a hand-diagram SVG (data-finger="L1".."L5","R1".."R5").
  // Shared by the lesson hint system and the onboarding guide so both stay
  // perfectly in sync with a single mechanism instead of two.
  function highlightFinger(fingerIds, svgId = 'finger-diagram') {
    const svg = TypingAuraUtils.$('#' + svgId);
    if (!svg) return;
    const ids = Array.isArray(fingerIds) ? fingerIds : [fingerIds];
    svg.querySelectorAll('[data-finger]').forEach(el => el.classList.remove('finger-active'));
    ids.forEach(id => {
      const el = svg.querySelector(`[data-finger="${id}"]`);
      if (el) el.classList.add('finger-active');
    });
  }

  function clearFingerHighlight(svgId = 'finger-diagram') {
    const svg = TypingAuraUtils.$('#' + svgId);
    if (!svg) return;
    svg.querySelectorAll('[data-finger]').forEach(el => el.classList.remove('finger-active'));
  }

  /* ----------------------------------------------------------
     EVENT BINDING
  ---------------------------------------------------------- */
  function bindEvents() {
    document.addEventListener('keydown', e => {
      if (!isEnabled) return;
      lastPressedCode = e.code;
      pressKey(e.code);
      stopAmbient();
      scheduleAmbientResume();
    });

    document.addEventListener('keyup', e => {
      if (!isEnabled) return;
      releaseKey(e.code);
    });

    TypingAuraUtils.on('typingaura:keypress', e => {
      if (!lastPressedCode) return;
      e.detail.correct
        ? flashCorrect(lastPressedCode)
        : flashError(lastPressedCode);
    });
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init() {
    isLowEnd = TypingAuraUtils.isLowEndDevice();
    build();
    bindEvents();
  }

  function enable()  { isEnabled = true; }
  function disable() { isEnabled = false; }

  return {
    init, pressKey, releaseKey, flashCorrect, flashError,
    streakOn, streakOff, rainbowFlash, hintKey, hintKeys, clearHint,
    highlightFinger, clearFingerHighlight,
    enable, disable
  };

})();
