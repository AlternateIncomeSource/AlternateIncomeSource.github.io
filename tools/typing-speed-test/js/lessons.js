/* ============================================================
   TYPINGAURA — lessons.js  (v2)
   L1 fix: hintKey now passes correct KeyboardEvent.code format.
   I4:     Level 4 lessons added (was missing from original).
   ============================================================ */

const TypingAuraLessons = (() => {

  const LESSONS = [
    // ── LEVEL 1: Foundation ──────────────────────────────────
    { id:'1-1', level:1, step:1, total:8, title:'Left Hand Home Row',
      instruction:"Rest your left fingers on A, S, D, F. These four keys are your anchor — your left hand always returns here.",
      text:'asdf fdsa asfd dfas safd fads asdf fdsa aaaa ssss dddd ffff asdf fdsa',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:['KeyA','KeyS','KeyD','KeyF'] },

    { id:'1-2', level:1, step:2, total:8, title:'Right Hand Home Row',
      instruction:"Rest your right fingers on J, K, L, ;. Your right index finger sits on J — feel the small bump on it.",
      text:'jkl; ;lkj jlk; kj;l ;jkl lj;k jkl; ;lkj jjjj kkkk llll ;;;; jkl; ;lkj',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:['KeyJ','KeyK','KeyL','Semicolon'] },

    { id:'1-3', level:1, step:3, total:8, title:'Both Hands Together',
      instruction:"Combine both home rows. Keep all eight fingers resting — lift only to press.",
      text:'ask fad all fall lass jal flask sad lad ask fall lass dals flask ask jal',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:['KeyA','KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL','Semicolon'] },

    { id:'1-4', level:1, step:4, total:8, title:'Add G and H',
      instruction:"G is reached by your left index finger stretching right. H is your right index finger stretching left.",
      text:'glad gash hash half flag glad hash half gash flag had shall flags glad gash',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:['KeyG','KeyH'] },

    { id:'1-5', level:1, step:5, total:8, title:'Full Home Row',
      instruction:"All eight home row keys: A S D F G H J K L ; — practice until your fingers know the way.",
      text:'flash glass shall falls glad half jags flags ash hall glass flash glad falls',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon'] },

    { id:'1-6', level:1, step:6, total:8, title:'Add E and I',
      instruction:"E is above D — middle finger up. I is above K — right middle finger up. Return to home row after each.",
      text:'idea side life field kite slide idea like side idea field side like idea kite',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:['KeyE','KeyI'] },

    { id:'1-7', level:1, step:7, total:8, title:'Add R and U',
      instruction:"R is above F — left index up. U is above J — right index up. Keep your wrists steady.",
      text:'ride sure rule fire true ride sure rule fire true rude fire rules ride sure',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:['KeyR','KeyU'] },

    { id:'1-8', level:1, step:8, total:8, title:'Common Short Words',
      instruction:"Now use what you know. These are some of the most common English words — all using keys you have learned.",
      text:'is if he she did his her are the a in it like ride fire sure idea field',
      requiredAccuracy:90, requiredWpm:0, fingerCodes:[] },

    // ── LEVEL 2: Expansion ───────────────────────────────────
    { id:'2-1', level:2, step:1, total:8, title:'Full Top Row',
      instruction:"Q W E R T Y U I O P — stretch upward from home row. Return home after every key.",
      text:'type quite pretty tower upper write quite poetry tower require quite write type',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:[] },

    { id:'2-2', level:2, step:2, total:8, title:'Full Bottom Row',
      instruction:"Z X C V B N M — stretch downward from home row. Keep your palms off the desk.",
      text:'brave next calm zone mix venom bench zinc brave next calm zone mix bench brave',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:[] },

    { id:'2-3', level:2, step:3, total:8, title:'Numbers 1 to 5',
      instruction:"The left half of the number row: 1 2 3 4 5. Reach up with the matching left-hand finger.",
      text:'1 2 3 4 5 12 34 15 21 45 123 321 54321 12345 1 2 3 4 5 12 34 15 21',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:['Digit1','Digit2','Digit3','Digit4','Digit5'] },

    { id:'2-4', level:2, step:4, total:8, title:'Numbers 6 to 0',
      instruction:"The right half: 6 7 8 9 0. Reach up with the matching right-hand finger.",
      text:'6 7 8 9 0 67 89 60 78 90 678 890 6789 7890 60 78 900 6 7 8 9 0 67 89',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:['Digit6','Digit7','Digit8','Digit9','Digit0'] },

    { id:'2-5', level:2, step:5, total:8, title:'Shift Key and Capitals',
      instruction:"Opposite hand always presses Shift. Left hand types → Right Shift. Right hand types → Left Shift.",
      text:'Hello World Type Fast Great Job Well Done Keep Going You Can Do It Start Now',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:['ShiftLeft','ShiftRight'] },

    { id:'2-6', level:2, step:6, total:8, title:'Common Punctuation',
      instruction:"Period ends sentences. Comma adds pauses. Practice with natural sentence rhythm.",
      text:'Hello, world. This is fast. Type it all. Go on, keep going. Well done. Try again.',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:['Period','Comma'] },

    { id:'2-7', level:2, step:7, total:8, title:'Top 100 Common Words',
      instruction:"These words appear in over 50% of all written English. Type until they feel automatic.",
      text:'the be to of and a in that have it for not on with he as you do at this but his by from they we',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:[] },

    { id:'2-8', level:2, step:8, total:8, title:'Short Sentences',
      instruction:"Real sentences now — no time pressure. Focus on accuracy and smooth rhythm.",
      text:'The quick fox jumps over the lazy dog. She sells sea shells. Time flies when you type well.',
      requiredAccuracy:92, requiredWpm:20, fingerCodes:[] },

    // ── LEVEL 3: Speed Building ──────────────────────────────
    { id:'3-1', level:3, step:1, total:6, title:'Common Words Timed',
      instruction:"You know the keys. Now build speed with common English words. Aim for smooth flow.",
      text:'the and you that have for not with this from they will what been said each about most',
      requiredAccuracy:94, requiredWpm:35, fingerCodes:[] },

    { id:'3-2', level:3, step:2, total:6, title:'Accuracy Drill',
      instruction:"Target 95%+ accuracy at any speed. Slow is fine — every character must be right.",
      text:'required procedure beautiful environment throughout development immediately consideration',
      requiredAccuracy:95, requiredWpm:30, fingerCodes:[] },

    { id:'3-3', level:3, step:3, total:6, title:'Speed Bursts',
      instruction:"Short focused bursts — push your pace hard. Rest your hands between each attempt.",
      text:'fast type speed flow quick clear smart focus high drive sharp bold move energy bright',
      requiredAccuracy:94, requiredWpm:40, fingerCodes:[] },

    { id:'3-4', level:3, step:4, total:6, title:'Mixed Case Sentences',
      instruction:"Capital letters appear naturally in real writing. Keep your shift hand ready.",
      text:'In 2024, over 4 billion people use keyboards daily. Python, JavaScript, and CSS power the web.',
      requiredAccuracy:94, requiredWpm:35, fingerCodes:[] },

    { id:'3-5', level:3, step:5, total:6, title:'Numbers in Context',
      instruction:"Numbers inside real sentences — this is what data entry looks like.",
      text:'Order 1247 was placed on March 5, 2024, for a total of $89.50 plus $4.20 shipping.',
      requiredAccuracy:94, requiredWpm:32, fingerCodes:[] },

    { id:'3-6', level:3, step:6, total:6, title:'Paragraph Typing',
      instruction:"Longer text — maintain accuracy through a full paragraph without dropping pace.",
      text:'Typing speed improves with consistent daily practice. The most effective method is to focus on accuracy first and let speed follow naturally over time.',
      requiredAccuracy:94, requiredWpm:38, fingerCodes:[] },

    // ── LEVEL 4: Mastery (I4 — was missing entirely) ─────────
    { id:'4-1', level:4, step:1, total:5, title:'Weak Finger Drills',
      instruction:"Pinky and ring fingers are the weakest. These drills target them specifically. Slow down and make every press deliberate.",
      text:'quiz zap zero azure prize ozone pizza paws swam swap pal quiz zap zero azure prize',
      requiredAccuracy:95, requiredWpm:45, fingerCodes:['KeyQ','KeyA','KeyZ','KeyP','Semicolon','Slash'] },

    { id:'4-2', level:4, step:2, total:5, title:'Custom Problem Key Practice',
      instruction:"Focus on your most-missed keys. Type slowly and feel the correct finger placement before speeding up.",
      text:'proper pepper upper copper zipper apply appeal appear supply simple purple people apple',
      requiredAccuracy:95, requiredWpm:45, fingerCodes:[] },

    { id:'4-3', level:4, step:3, total:5, title:'Speed Consistency',
      instruction:"The goal is reducing WPM variance — not hitting a peak but sustaining a steady pace throughout.",
      text:'consistent rhythm makes you faster every session practice daily and track your progress carefully',
      requiredAccuracy:95, requiredWpm:50, fingerCodes:[] },

    { id:'4-4', level:4, step:4, total:5, title:'Cold Start Drills',
      instruction:"First 10 seconds of a test are the hardest. These drills train your fingers to reach full speed immediately.",
      text:'the quick brown fox jumps over the lazy dog pack my box with five dozen liquor jugs',
      requiredAccuracy:95, requiredWpm:55, fingerCodes:[] },

    { id:'4-5', level:4, step:5, total:5, title:'Advanced Punctuation',
      instruction:"Colons, semicolons, brackets, hyphens — professional writing needs all of them. Master these last.",
      text:'Note: the result (see Table 2) shows a 15% increase — well above the expected 8–10% range.',
      requiredAccuracy:95, requiredWpm:50, fingerCodes:['Semicolon','BracketLeft','BracketRight','Minus'] },
  ];

  /* ----------------------------------------------------------
     PROGRESS STORAGE
  ---------------------------------------------------------- */
  function getProgress()        { return TypingAuraUtils.lsGet('lesson_progress') || {}; }
  function markComplete(id)     { const p = getProgress(); p[id] = true; TypingAuraUtils.lsSet('lesson_progress', p); }
  function isComplete(id)       { return !!getProgress()[id]; }
  function isUnlocked(lesson)   { if (lesson.step === 1) return true; return isComplete(`${lesson.level}-${lesson.step-1}`); }
  function getLesson(id)        { return LESSONS.find(l => l.id === id) || null; }
  function getLevelLessons(lvl) { return LESSONS.filter(l => l.level === lvl); }
  function getCompletedCount(lvl){ return getLevelLessons(lvl).filter(l => isComplete(l.id)).length; }
  function getNextLesson(id) {
    const idx = LESSONS.findIndex(l => l.id === id);
    if (idx === -1 || idx === LESSONS.length - 1) return null;
    return LESSONS[idx + 1];
  }

  /* ----------------------------------------------------------
     RECOMMENDATION
  ---------------------------------------------------------- */
  function recommend(problemChars) {
    if (!problemChars || !problemChars.length) return null;
    const char = problemChars[0].expected.toLowerCase();
    const map  = {
      'a':'1-1','s':'1-1','d':'1-1','f':'1-1',
      'j':'1-2','k':'1-2','l':'1-2',
      'g':'1-4','h':'1-4',
      'e':'1-6','i':'1-6',
      'r':'1-7','u':'1-7',
      'q':'2-1','w':'2-1','t':'2-1','y':'2-1','o':'2-1','p':'2-1',
      'z':'2-2','x':'2-2','c':'2-2','v':'2-2','b':'2-2','n':'2-2','m':'2-2',
    };
    const lesson = getLesson(map[char] || '1-1');
    return lesson ? { lesson, problemChar: char } : null;
  }

  /* ----------------------------------------------------------
     ACTIVE LESSON
  ---------------------------------------------------------- */
  let currentLesson = null;
  let hintTimer     = null;
  let errorStreak   = { char: null, count: 0 };

  function startLesson(id) {
    const lesson = getLesson(id);
    if (!lesson) return;
    currentLesson = lesson;

    TypingAuraEngine.setText(lesson.text, { infinite: false });
    updateLessonUI(lesson);
    TypingAuraUtils.emit('typingaura:lesson-start', { lesson });
  }

  function updateLessonUI(lesson) {
    const titleEl    = TypingAuraUtils.$('#lesson-title');
    const stepEl     = TypingAuraUtils.$('#lesson-step');
    const instrEl    = TypingAuraUtils.$('#lesson-instruction');
    const progressEl = TypingAuraUtils.$('#lesson-progress-fill');

    if (titleEl)    titleEl.textContent   = lesson.title;
    if (stepEl)     stepEl.textContent    = `Step ${lesson.step} of ${lesson.total}`;
    if (instrEl)    instrEl.textContent   = lesson.instruction;
    if (progressEl) progressEl.style.width = ((lesson.step-1)/lesson.total*100) + '%';

    // L1 fix: fingerCodes are already in KeyboardEvent.code format (e.g. 'KeyA')
    TypingAuraKeyboard.clearHint();
    if (lesson.fingerCodes && lesson.fingerCodes.length) {
      lesson.fingerCodes.forEach(code => TypingAuraKeyboard.hintKey(code));
    }
  }

  function checkLessonComplete(stats) {
    if (!currentLesson) return false;
    const passed =
      stats.accuracy >= currentLesson.requiredAccuracy &&
      (currentLesson.requiredWpm === 0 || stats.netWpm >= currentLesson.requiredWpm);
    if (passed) {
      markComplete(currentLesson.id);
      TypingAuraUtils.emit('typingaura:lesson-complete', { lesson: currentLesson, stats });
    }
    return passed;
  }

  /* ----------------------------------------------------------
     HINT SYSTEM
  ---------------------------------------------------------- */
  function trackError(expected) {
    if (errorStreak.char === expected) { errorStreak.count++; }
    else { errorStreak = { char: expected, count: 1 }; }
    if (errorStreak.count >= 3) { showHint(expected); errorStreak.count = 0; }
  }

  function showHint(char) {
    const hintEl = TypingAuraUtils.$('#lesson-hint');
    if (!hintEl) return;
    const hints = {
      default: `Focus on "${char}" — find it without looking, then press.`,
      ' ': 'Spacebar: right thumb presses it. Keep wrists level.',
      'a': '"A" — left pinky. It rests there naturally.',
      's': '"S" — left ring finger.',
      'd': '"D" — left middle finger.',
      'f': '"F" — left index finger. Small bump helps you find it.',
      'j': '"J" — right index finger. Also has a small bump.',
      'k': '"K" — right middle finger.',
      'l': '"L" — right ring finger.',
      ';': '";" — right pinky.',
    };
    // Maps each home-row character to its finger-diagram id (L1-L5 left, R1-R5 right)
    const fingerMap = {
      ' ': 'R1', 'a': 'L5', 's': 'L4', 'd': 'L3', 'f': 'L2',
      'j': 'R2', 'k': 'R3', 'l': 'R4', ';': 'R5',
    };
    hintEl.textContent = hints[char] || hints.default;
    hintEl.classList.add('visible');

    // L1 fix: pass full KeyboardEvent.code format for letters
    if (/^[a-z]$/.test(char)) {
      TypingAuraKeyboard.hintKey('Key' + char.toUpperCase());
    } else if (char === ';') {
      TypingAuraKeyboard.hintKey('Semicolon');
    } else if (char === ' ') {
      TypingAuraKeyboard.hintKey('Space');
    }

    if (fingerMap[char]) {
      TypingAuraKeyboard.highlightFinger(fingerMap[char], 'finger-diagram');
    }

    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hintEl.classList.remove('visible');
      TypingAuraKeyboard.clearHint();
      TypingAuraKeyboard.clearFingerHighlight('finger-diagram');
    }, 4000);
  }

  /* ----------------------------------------------------------
     EVENTS
  ---------------------------------------------------------- */
  function bindEvents() {
    TypingAuraUtils.on('typingaura:error', e => {
      if (currentLesson) trackError(e.detail.expected);
    });
  }

  function init() { bindEvents(); }

  return {
    init, LESSONS,
    getLesson, getLevelLessons, getCompletedCount, getNextLesson,
    isComplete, isUnlocked, startLesson,
    checkLessonComplete, recommend, markComplete
  };

})();
