/* ============================================================
   TYPINGAURA — statistics.js  (v2 — fixed testStart calc)
   L3 fix: testStart now uses charTimings[0] not Date.now()
   ============================================================ */

const TypingAuraStats = (() => {

  const MAX_HISTORY = 30;

  function calcGrossWpm(totalCharsTyped, elapsedMs) {
    if (elapsedMs <= 0) return 0;
    return TypingAuraUtils.round((totalCharsTyped / 5) / (elapsedMs / 60000), 1);
  }

  function calcNetWpm(grossWpm, errorCount, elapsedMs) {
    if (elapsedMs <= 0) return 0;
    const penalty = errorCount / (elapsedMs / 60000);
    return Math.max(0, TypingAuraUtils.round(grossWpm - penalty, 1));
  }

  function calcCpm(totalCharsTyped, elapsedMs) {
    if (elapsedMs <= 0) return 0;
    return TypingAuraUtils.round(totalCharsTyped / (elapsedMs / 60000), 0);
  }

  function calcAccuracy(correctChars, totalCharsTyped) {
    if (totalCharsTyped === 0) return 100;
    return TypingAuraUtils.round((correctChars / totalCharsTyped) * 100, 1);
  }

  function calcConsistency(charTimings) {
    const intervals = [];
    for (let i = 1; i < charTimings.length; i++) {
      if (charTimings[i] && charTimings[i - 1]) {
        intervals.push(charTimings[i] - charTimings[i - 1]);
      }
    }
    if (intervals.length < 2) return 100;
    const mean     = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / intervals.length;
    const stdDev   = Math.sqrt(variance);
    return TypingAuraUtils.round(Math.max(0, 100 - stdDev / 3), 0);
  }

  function calcProblemChars(errorPositions) {
    const map = {};
    errorPositions.forEach(({ expected, typed }) => {
      if (!map[expected]) map[expected] = { expected, typed, count: 0 };
      map[expected].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 3);
  }

  function calcWpmOverTime(charTimings, charStates, elapsedMs) {
    // L3 fix: use charTimings[0] as test start, not Date.now()
    const validTimings = charTimings.filter(t => t > 0);
    if (!validTimings.length || elapsedMs <= 0) return [];

    const testStart  = validTimings[0];
    const windowSize = 5000;
    const buckets    = [];

    for (let t = windowSize; t <= elapsedMs + windowSize; t += windowSize) {
      const windowStart = testStart + t - windowSize;
      const windowEnd   = testStart + t;
      let   charsInWin  = 0;

      charTimings.forEach((timing, i) => {
        if (timing >= windowStart && timing < windowEnd && charStates[i] === 'correct') {
          charsInWin++;
        }
      });

      const wpm = TypingAuraUtils.round((charsInWin / 5) / (windowSize / 60000), 1);
      buckets.push({ second: Math.round(t / 1000), wpm: Math.max(0, wpm) });
    }
    return buckets;
  }

  function analyse(sessionData, elapsedMs) {
    const { typedChars, correctChars, errorChars, errorCount, backspaceCount,
            charTimings, charStates, errorPositions } = sessionData;

    const grossWpm     = calcGrossWpm(typedChars, elapsedMs);
    // Net WPM penalty must be based on FINAL, uncorrected errors (errorChars),
    // not the lifetime errorCount — otherwise a typo you catch and fix
    // yourself keeps penalising you forever, even though your final typed
    // text is completely correct at that position. This was the source of
    // a large, unfair WPM gap for anyone who corrects mistakes as they go.
    const netWpm       = calcNetWpm(grossWpm, errorChars, elapsedMs);
    const cpm          = calcCpm(typedChars, elapsedMs);
    const accuracy     = calcAccuracy(correctChars, typedChars);
    const consistency  = calcConsistency(charTimings);
    const problemChars = calcProblemChars(errorPositions);
    const wpmOverTime  = calcWpmOverTime(charTimings, charStates, elapsedMs);

    return {
      grossWpm, netWpm, cpm, accuracy, consistency,
      errorCount, errorChars, backspaceCount, correctChars, typedChars,
      problemChars, wpmOverTime, elapsedMs,
      elapsedSeconds: Math.round(elapsedMs / 1000),
      timestamp: Date.now()
    };
  }

  function getHistoryKey(duration) { return `history_${duration}`; }

  function saveSession(stats, duration) {
    const key  = getHistoryKey(duration);
    const hist = TypingAuraUtils.lsGet(key) || [];
    hist.unshift({
      netWpm: stats.netWpm, grossWpm: stats.grossWpm,
      accuracy: stats.accuracy, errorCount: stats.errorChars,
      consistency: stats.consistency, timestamp: stats.timestamp
    });
    if (hist.length > MAX_HISTORY) hist.splice(MAX_HISTORY);
    TypingAuraUtils.lsSet(key, hist);
  }

  function getPersonalBest(duration) {
    const hist = TypingAuraUtils.lsGet(getHistoryKey(duration)) || [];
    return hist.length ? hist.reduce((b, s) => (!b || s.netWpm > b.netWpm) ? s : b, null) : null;
  }

  function getRecentHistory(duration, count = 10) {
    return (TypingAuraUtils.lsGet(getHistoryKey(duration)) || []).slice(0, count);
  }

  function getImprovementTrend(duration) {
    const hist = getRecentHistory(duration, 5);
    if (hist.length < 2) return null;
    const delta = TypingAuraUtils.round(hist[0].netWpm - hist[hist.length - 1].netWpm, 1);
    return { latest: hist[0].netWpm, oldest: hist[hist.length - 1].netWpm,
             delta, improved: delta > 0 };
  }

  function generateTip(stats) {
    const { accuracy, netWpm, backspaceCount, problemChars,
            errorCount, typedChars, consistency } = stats;
    const topError = problemChars[0];

    if (backspaceCount > typedChars * 0.15) return {
      icon: '⌫',
      text: `You deleted <strong>${backspaceCount} times</strong> — over 15% of all keystrokes. Try typing through mistakes instead of correcting them. Your muscle memory builds faster when you complete every word, even if it's wrong.`
    };
    if (netWpm >= 40 && accuracy < 90) return {
      icon: '🎯',
      text: `Fast fingers, but <strong>${accuracy}% accuracy</strong> is costing you net WPM. Slow down 10 WPM and hit 95%+ first — your real speed will be higher than it looks now.`
    };
    if (topError && topError.count >= 4) return {
      icon: '🔑',
      text: `You mistyped <strong>"${topError.expected}"</strong> ${topError.count} times — mostly hitting <strong>"${topError.typed}"</strong> instead. Check your hand position and try a targeted drill for that key.`
    };
    if (consistency < 50) return {
      icon: '〰️',
      text: `Your typing rhythm is uneven — fast bursts then sudden slowing. A steady pace from the start will raise your average WPM more than chasing peak speed.`
    };
    if (accuracy >= 95 && netWpm < 35) return {
      icon: '⚡',
      text: `Solid <strong>${accuracy}% accuracy</strong> — your technique is clean. Now push speed. Try the 15-second sprint mode and aim to beat your average by 10 WPM.`
    };
    if (accuracy >= 96 && netWpm >= 60) return {
      icon: '🔥',
      text: `<strong>${netWpm} WPM at ${accuracy}% accuracy</strong> is genuinely strong. The top 10% of typists average 70 WPM. Push endurance next with a 120-second test.`
    };
    return {
      icon: '💡',
      text: `Focus on accuracy before speed — <strong>95%+ is the target</strong>. Errors cost more net WPM than slowing down does.`
    };
  }

  function init() {}

  return {
    init, analyse, saveSession, getPersonalBest,
    getRecentHistory, getImprovementTrend, generateTip
  };

})();
