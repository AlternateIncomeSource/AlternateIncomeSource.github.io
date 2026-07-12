/* ============================================================
   TYPINGAURA — achievements.js  (v2 — fixed hidden attr)
   C5 fix: overlay uses style.display not hidden attribute.
   ============================================================ */

const TypingAuraAchievements = (() => {

  const ACHIEVEMENTS = [
    { id:'first_test',    icon:'🚀', name:'First Launch',      desc:'Completed your first typing test.',
      check:(s,h)=>h.length>=1 },
    { id:'speed_30',      icon:'⚡', name:'Speed Spark',        desc:'Reached 30 WPM.',
      check:(s)=>s.netWpm>=30 },
    { id:'speed_50',      icon:'🔥', name:'On Fire',            desc:'Reached 50 WPM.',
      check:(s)=>s.netWpm>=50 },
    { id:'speed_70',      icon:'🌩️', name:'Lightning Fingers',  desc:'Reached 70 WPM.',
      check:(s)=>s.netWpm>=70 },
    { id:'speed_100',     icon:'🏆', name:'Century Typist',     desc:'Reached 100 WPM.',
      check:(s)=>s.netWpm>=100 },
    { id:'accuracy_100',  icon:'🎯', name:'Perfect Round',      desc:'Finished a test with 100% accuracy.',
      check:(s)=>s.accuracy===100 },
    { id:'accuracy_98',   icon:'💎', name:'Diamond Precision',  desc:'Finished a test with 98%+ accuracy.',
      check:(s)=>s.accuracy>=98 },
    { id:'no_backspace',  icon:'🧊', name:'Iron Fingers',       desc:'Completed a 60s test without Backspace.',
      check:(s,h,d)=>d===60&&s.backspaceCount===0 },
    { id:'sessions_10',   icon:'📅', name:'Ten Sessions',       desc:'Completed 10 typing tests.',
      check:(s,h)=>h.length>=10 },
    { id:'sessions_50',   icon:'🏅', name:'Dedicated',          desc:'Completed 50 typing tests.',
      check:(s,h)=>h.length>=50 },
    { id:'consistency_90',icon:'〰️', name:'Smooth Operator',   desc:'Consistency score of 90+.',
      check:(s)=>s.consistency>=90 },
    { id:'endurance',     icon:'🦾', name:'Endurance Mode',     desc:'Completed a 120-second test.',
      check:(s,h,d)=>d===120 },
    { id:'streak_3',      icon:'📆', name:'Three-Day Streak',   desc:'Practiced 3 days in a row.',
      check:()=>(TypingAuraUtils.lsGet('daily_streak')||0)>=3 },
  ];

  function getUnlocked()     { return TypingAuraUtils.lsGet('achievements') || []; }
  function saveUnlocked(l)   { TypingAuraUtils.lsSet('achievements', l); }
  function isUnlocked(id)    { return getUnlocked().includes(id); }

  function checkAll(stats, history, duration) {
    const unlocked    = getUnlocked();
    const newlyEarned = [];

    ACHIEVEMENTS.forEach(a => {
      if (unlocked.includes(a.id)) return;
      try {
        if (a.check(stats, history, duration)) {
          unlocked.push(a.id);
          newlyEarned.push(a);
        }
      } catch { /* skip silently */ }
    });

    if (newlyEarned.length) {
      saveUnlocked(unlocked);
      newlyEarned.forEach((a, i) => {
        setTimeout(() => showUnlockOverlay(a), i * 1800);
      });
    }
    return newlyEarned;
  }

  /* ----------------------------------------------------------
     OVERLAY — C5 fix: style.display instead of hidden attribute
  ---------------------------------------------------------- */
  function showUnlockOverlay(achievement) {
    const overlay = TypingAuraUtils.$('#achievement-overlay');
    const popup   = TypingAuraUtils.$('#achievement-popup');
    if (!overlay || !popup) return;

    popup.innerHTML = `
      <div class="achievement-popup__icon">${achievement.icon}</div>
      <div class="achievement-popup__label">Achievement Unlocked</div>
      <div class="achievement-popup__name">${achievement.name}</div>
      <div class="achievement-popup__desc">${achievement.desc}</div>
    `;

    // C5 fix: use display, not removeAttribute('hidden') or classList
    overlay.style.display = 'flex';
    TypingAuraSound.achieveUnlock();

    const dismiss = () => { overlay.style.display = 'none'; };
    setTimeout(dismiss, 2500);
    overlay.onclick = dismiss;
  }

  function renderList(containerId) {
    const container = TypingAuraUtils.$('#' + containerId);
    if (!container) return;
    const unlocked = getUnlocked();

    container.innerHTML = ACHIEVEMENTS.map(a => `
      <div class="badge-card ${unlocked.includes(a.id) ? 'unlocked' : 'locked'}"
           role="listitem"
           aria-label="${a.name}: ${a.desc}${unlocked.includes(a.id) ? ' (unlocked)' : ' (locked)'}">
        <div class="badge-card__icon">${a.icon}</div>
        <div class="badge-card__name">${a.name}</div>
        <div class="badge-card__desc">${a.desc}</div>
      </div>
    `).join('');
  }

  function init() {
    // Overlay starts hidden via style="display:none" in HTML — no further setup needed
  }

  return { init, checkAll, renderList, isUnlocked, getUnlocked, ACHIEVEMENTS };

})();
