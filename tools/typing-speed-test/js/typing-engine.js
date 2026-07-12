/* ============================================================
   TYPINGAURA — typing-engine.js  (v2 — infinite words fixed)
   Core typing logic: compares input to target text.
   Auto-appends words when running low so tests never end early.
   ============================================================ */

const TypingAuraEngine = (() => {

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  let targetText     = '';
  let typedText      = '';
  let charStates     = [];
  let currentIndex   = 0;
  let errorCount     = 0;
  let backspaceCount = 0;
  let isActive       = false;
  let charTimings    = [];
  let errorPositions = [];
  let isInfinite     = true;  // false for lessons: fixed text, no auto-append

  /* ----------------------------------------------------------
     WORD BANK — 300 unique common English words (deduplicated)
  ---------------------------------------------------------- */
  const WORDS = [
    'the','be','to','of','and','a','in','that','have','it',
    'for','not','on','with','he','as','you','do','at','this',
    'but','his','by','from','they','we','say','her','she','or',
    'an','will','my','one','all','would','there','their','what',
    'so','up','out','if','about','who','get','which','go','me',
    'when','make','can','like','time','no','just','him','know',
    'take','people','into','year','your','good','some','could',
    'them','see','other','than','then','now','look','only','come',
    'its','over','think','also','back','after','use','two','how',
    'our','work','first','well','way','even','new','want','because',
    'any','these','give','day','most','us','great','between','need',
    'large','often','hand','high','place','hold','turn','without',
    'still','small','number','off','always','move','live','before',
    'write','while','might','try','set','put','end','does','another',
    'big','down','again','went','tell','point','study','world',
    'found','along','both','white','children','begin','walk',
    'example','hear','every','near','add','food','below','country',
    'plant','school','father','keep','tree','never','start','city',
    'earth','eye','light','thought','head','under','story','saw',
    'few','north','open','seem','together','next','got','paper',
    'group','always','music','those','both','mark','book','letter',
    'until','mile','river','car','feet','care','second','enough',
    'plain','girl','usual','young','ready','above','ever','red',
    'list','though','feel','talk','bird','soon','body','dog','family',
    'direct','pose','leave','song','measure','door','product','black',
    'short','numeral','class','wind','question','happen','complete',
    'ship','area','half','rock','order','fire','south','problem',
    'piece','told','knew','pass','since','top','whole','king',
    'space','heard','best','hour','better','true','during','hundred',
    'five','remember','step','early','hold','west','ground','interest',
    'reach','fast','verb','sing','listen','six','table','travel',
    'less','morning','ten','simple','several','vowel','toward','war',
    'lay','against','pattern','slow','center','love','person','money',
    'serve','appear','road','map','rain','rule','govern','pull',
    'cold','notice','voice','unit','power','town','fine','drive',
    'lead','cry','dark','machine','note','wait','plan','figure',
    'star','box','noun','field','rest','correct','able','pound',
    'done','beauty','drive','stood','contain','front','teach','week',
    'final','gave','green','oh','quick','develop','ocean','warm',
    'free','minute','strong','special','mind','behind','clear','tail',
    'produce','fact','street','inch','multiply','nothing','course',
    'stay','wheel','full','force','blue','object','decide','surface',
    'deep','moon','island','foot','system','busy','test','record',
    'boat','common','gold','possible','plane','age','dry','wonder',
    'laugh','thousand','ago','ran','check','game','shape','equate',
    'miss','brought','heat','snow','tire','bring','yes','distant',
    'fill','east','paint','language','among','grand','ball','yet',
    'wave','drop','heart','am','present','heavy','dance','engine'
  ];

  /* ----------------------------------------------------------
     TEXT GENERATION
  ---------------------------------------------------------- */
  function generateWords(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(TypingAuraUtils.randomFrom(WORDS));
    }
    return result.join(' ');
  }

  function newTest(wordCount = 60) {
    setText(generateWords(wordCount));
  }

  function setText(text, options = {}) {
    targetText     = text;
    typedText      = '';
    charStates     = new Array(text.length).fill('pending');
    currentIndex   = 0;
    errorCount     = 0;
    backspaceCount = 0;
    charTimings    = [];
    errorPositions = [];
    isActive       = false;
    isInfinite     = options.infinite !== false;
    renderText();
  }

  /* ----------------------------------------------------------
     INFINITE WORD APPEND
     Called when user is within 50 chars of the end.
     Appends more words silently without resetting state.
  ---------------------------------------------------------- */
  function appendWords(count = 40) {
    const newText   = ' ' + generateWords(count);
    const newStates = new Array(newText.length).fill('pending');

    targetText  += newText;
    charStates   = charStates.concat(newStates);

    // Append new character spans to the existing DOM without a full re-render
    const wordsEl = TypingAuraUtils.$('#typing-words');
    if (!wordsEl) return;

    for (let i = targetText.length - newText.length; i < targetText.length; i++) {
      const span = document.createElement('span');
      span.className       = 'char pending';
      span.dataset.index   = i;
      span.dataset.char    = targetText[i];
      span.textContent     = targetText[i];
      wordsEl.appendChild(span);
    }
  }

  /* ----------------------------------------------------------
     TEXT RENDERING — full render on test start/reset only
  ---------------------------------------------------------- */
  function renderText() {
    const el = TypingAuraUtils.$('#typing-words');
    if (!el) return;

    el.innerHTML = '';
    el.style.transform = 'translateY(0)';

    for (let i = 0; i < targetText.length; i++) {
      const span = document.createElement('span');
      span.className     = 'char pending';
      span.dataset.index = i;
      span.dataset.char  = targetText[i];
      span.textContent   = targetText[i];

      if (i === 0) span.classList.add('current');
      el.appendChild(span);
    }
  }

  function updateCharEl(index, state) {
    const wordsEl = TypingAuraUtils.$('#typing-words');
    if (!wordsEl) return;
    const el = wordsEl.querySelector(`[data-index="${index}"]`);
    if (!el) return;
    el.className = 'char ' + state;
    if (index === currentIndex) el.classList.add('current');
  }

  // Keeps the current line inside the fixed 3-line viewport by shifting the
  // whole text block up with a CSS transform as the cursor crosses into a
  // new line — instead of letting the container grow taller (the old bug).
  // Line height is read once and cached: font-size varies by breakpoint but
  // line-height is a fixed px value everywhere, so one reading stays valid.
  let cachedLineHeight = null;

  function updateScrollPosition() {
    const wordsEl = TypingAuraUtils.$('#typing-words');
    if (!wordsEl) return;

    if (cachedLineHeight === null) {
      const parsed = parseFloat(getComputedStyle(wordsEl).lineHeight);
      cachedLineHeight = parsed > 0 ? parsed : 44;
    }

    const currentEl = wordsEl.querySelector('.char.current');
    if (!currentEl) return;

    const lineIndex = Math.round(currentEl.offsetTop / cachedLineHeight);
    const offset = lineIndex > 0 ? -(lineIndex * cachedLineHeight) : 0;

    wordsEl.style.transform = `translateY(${offset}px)`;
  }

  /* ----------------------------------------------------------
     INPUT HANDLING
  ---------------------------------------------------------- */
  function handleKeydown(e) {
    const IGNORED = [
      'Shift','Control','Alt','Meta','CapsLock','Tab','Escape',
      'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
      'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
      'Insert','Delete','Home','End','PageUp','PageDown',
      'PrintScreen','ScrollLock','Pause','NumLock',
      'ContextMenu','OS'
    ];
    if (IGNORED.includes(e.key)) return;

    if (e.key === 'Backspace') {
      handleBackspace();
      return;
    }

    if (e.key.length !== 1) return;

    handleCharInput(e.key);
  }

  function handleCharInput(char) {
    if (currentIndex >= targetText.length) return;

    if (!isActive) {
      isActive = true;
      TypingAuraUtils.emit('typingaura:start');
    }

    // Check if we need more words (infinite mode only — lessons use fixed text)
    if (isInfinite && currentIndex > targetText.length - 50) {
      appendWords(40);
    }

    const expected  = targetText[currentIndex];
    const isCorrect = (char === expected);

    charTimings[currentIndex] = Date.now();

    if (isCorrect) {
      charStates[currentIndex] = 'correct';
      updateCharEl(currentIndex, 'correct');

      TypingAuraUtils.emit('typingaura:keypress', {
        index: currentIndex, char, expected,
        correct: true, errorCount, backspaceCount
      });

    } else {
      charStates[currentIndex] = 'error';
      updateCharEl(currentIndex, 'error');
      errorCount++;

      errorPositions.push({ index: currentIndex, expected, typed: char });

      TypingAuraUtils.emit('typingaura:keypress', {
        index: currentIndex, char, expected,
        correct: false, errorCount, backspaceCount
      });

      TypingAuraUtils.emit('typingaura:error', {
        index: currentIndex, expected, typed: char
      });
    }

    typedText += char;
    currentIndex++;

    // Move cursor indicator
    const wordsEl = TypingAuraUtils.$('#typing-words');
    if (wordsEl) {
      const prevEl = wordsEl.querySelector(`[data-index="${currentIndex - 1}"]`);
      if (prevEl) {
        prevEl.classList.remove('current');
        prevEl.className = 'char ' + charStates[currentIndex - 1];
      }
      const nextEl = wordsEl.querySelector(`[data-index="${currentIndex}"]`);
      if (nextEl) nextEl.classList.add('current');
    }

    updateScrollPosition();

    // Free test (infinite=true): only fire complete if timer is NOT running —
    // in timed mode the timer fires the end event, engine does not end the test.
    // This prevents the double-finish race condition (C4).
    // Lesson (infinite=false): fixed text, so finishing the text always ends
    // it immediately — a lesson should not wait for an unrelated countdown.
    if (currentIndex >= targetText.length && (!isInfinite || !TypingAuraTimer.getIsRunning())) {
      isActive = false;
      TypingAuraUtils.emit('typingaura:complete', getSessionData());
    }
  }

  function handleBackspace() {
    if (currentIndex <= 0) return;

    backspaceCount++;
    currentIndex--;
    typedText = typedText.slice(0, -1);

    charStates[currentIndex] = 'pending';

    const wordsEl = TypingAuraUtils.$('#typing-words');
    if (!wordsEl) return;

    // Remove current marker from the char AFTER cursor
    const nextEl = wordsEl.querySelector(`[data-index="${currentIndex + 1}"]`);
    if (nextEl) nextEl.classList.remove('current');

    // Reset current char to pending + add current marker
    const curEl = wordsEl.querySelector(`[data-index="${currentIndex}"]`);
    if (curEl) {
      curEl.className = 'char pending current';
    }

    updateScrollPosition();

    TypingAuraUtils.emit('typingaura:backspace', { index: currentIndex, backspaceCount });
  }

  /* ----------------------------------------------------------
     SESSION DATA
  ---------------------------------------------------------- */
  function getSessionData() {
    return {
      targetText,
      typedText,
      charStates:    [...charStates],
      errorCount,
      backspaceCount,
      charTimings:   [...charTimings],
      errorPositions:[...errorPositions],
      totalChars:    targetText.length,
      typedChars:    typedText.length,
      correctChars:  charStates.filter(s => s === 'correct').length,
      errorChars:    charStates.filter(s => s === 'error').length,
    };
  }

  function getIsActive()     { return isActive; }
  function getCurrentIndex() { return currentIndex; }
  function getTargetText()   { return targetText; }

  function reset() { newTest(); }

  function init()  {
    newTest();
    window.addEventListener('resize', TypingAuraUtils.debounce(updateScrollPosition, 200));
  }

  return {
    init, newTest, setText, handleKeydown,
    getSessionData, getIsActive, getCurrentIndex,
    getTargetText, reset, WORDS
  };

})();
