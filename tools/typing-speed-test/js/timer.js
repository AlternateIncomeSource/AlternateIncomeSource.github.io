/* ============================================================
   TYPINGAURA — timer.js  (v2 — fixed immediate tick bug)
   Countdown timer: 15s / 30s / 60s / 120s / custom.
   L4 fix: removed immediate tick() call on start().
   ============================================================ */

const TypingAuraTimer = (() => {

  let duration   = 60;
  let remaining  = 60;
  let intervalId = null;
  let startTime  = null;
  let isRunning  = false;
  let hasStarted = false;
  let onTickCb   = null;
  let onEndCb    = null;

  function tick() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    remaining = Math.max(0, duration - elapsed);

    TypingAuraUtils.emit('typingaura:tick', {
      remaining, elapsed, duration,
      percentDone: elapsed / duration
    });

    if (onTickCb) onTickCb(remaining, elapsed);

    if (remaining <= 0) {
      stop();
      TypingAuraUtils.emit('typingaura:timerend', { elapsed: duration });
      if (onEndCb) onEndCb();
    }
  }

  function setDuration(seconds) {
    duration   = parseInt(seconds, 10) || 60;
    remaining  = duration;
    hasStarted = false;
  }

  function start() {
    if (isRunning) return;
    if (remaining <= 0) reset();

    startTime  = Date.now();
    isRunning  = true;
    hasStarted = true;

    // L4 fix: do NOT call tick() immediately here.
    // First tick fires after 500ms so the display shows the correct
    // starting value (duration) for the first half-second.
    intervalId = setInterval(tick, 500);
  }

  function pause() {
    if (!isRunning) return;
    clearInterval(intervalId);
    isRunning = false;
  }

  function resume() {
    if (isRunning) return;
    startTime  = Date.now() - ((duration - remaining) * 1000);
    isRunning  = true;
    intervalId = setInterval(tick, 500);
  }

  function stop() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning  = false;
  }

  function reset() {
    stop();
    remaining  = duration;
    startTime  = null;
    hasStarted = false;
    TypingAuraUtils.emit('typingaura:reset', { duration });
  }

  function onTick(cb)  { onTickCb = cb; }
  function onEnd(cb)   { onEndCb  = cb; }

  function getRemaining()   { return remaining; }
  function getElapsed()     { return duration - remaining; }
  function getDuration()    { return duration; }
  function getIsRunning()   { return isRunning; }
  function getHasStarted()  { return hasStarted; }
  function getElapsedMs()   { return startTime ? Date.now() - startTime : 0; }

  function init() {
    const saved = TypingAuraUtils.lsGet('duration');
    if (saved && [15,30,60,120].includes(saved)) setDuration(saved);
  }

  return {
    init, setDuration, start, pause, resume, stop, reset,
    onTick, onEnd,
    getRemaining, getElapsed, getDuration,
    getIsRunning, getHasStarted, getElapsedMs
  };

})();
