/* ============================================================
   TYPINGAURA — utilities.js
   Shared helper functions used by all other modules.
   This file MUST load first — all other JS files depend on it.
   ============================================================ */

const TypingAuraUtils = (() => {

  /* ----------------------------------------------------------
     TIMING HELPERS
  ---------------------------------------------------------- */

  /**
   * Debounce — delays execution until after a pause in calls.
   * Use for: resize events, input events that fire rapidly.
   */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Throttle — limits how often a function runs.
   * Use for: scroll events, live WPM updates.
   */
  function throttle(fn, limit) {
    let lastRun = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastRun >= limit) {
        lastRun = now;
        fn.apply(this, args);
      }
    };
  }

  /* ----------------------------------------------------------
     MATH HELPERS
  ---------------------------------------------------------- */

  /** Clamp a value between min and max. */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /** Round to a given number of decimal places. */
  function round(value, decimals = 1) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /** Return a random integer between min and max inclusive. */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Pick a random element from an array. */
  function randomFrom(arr) {
    return arr[randomInt(0, arr.length - 1)];
  }

  /* ----------------------------------------------------------
     TIME FORMATTING
  ---------------------------------------------------------- */

  /** Format seconds into mm:ss string. */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** Format milliseconds into a readable string. */
  function formatMs(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${round(ms / 1000, 2)}s`;
  }

  /* ----------------------------------------------------------
     DOM HELPERS
  ---------------------------------------------------------- */

  /** Safe querySelector — returns null without throwing if not found. */
  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /** Safe querySelectorAll — returns empty array if nothing found. */
  function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  /** Create an element with optional class and text content. */
  function createElement(tag, className = '', text = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text)      el.textContent = text;
    return el;
  }

  /**
   * Add a temporary class to an element, then remove it after duration.
   * Used for triggering one-shot CSS animations.
   */
  function flashClass(el, className, duration = 500) {
    if (!el) return;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), duration);
  }

  /* ----------------------------------------------------------
     LOCAL STORAGE HELPERS
     All wrapped in try/catch — localStorage can be blocked
     in private browsing or restricted environments.
  ---------------------------------------------------------- */

  const LS_PREFIX = 'typingaura_';

  function lsGet(key) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function lsRemove(key) {
    try {
      localStorage.removeItem(LS_PREFIX + key);
      return true;
    } catch {
      return false;
    }
  }

  /* ----------------------------------------------------------
     DEVICE / ENVIRONMENT DETECTION
  ---------------------------------------------------------- */

  /**
   * Detect if user prefers reduced motion.
   * Used to disable animations gracefully.
   */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Detect low-end device by logical CPU core count.
   * Used to disable expensive visual effects automatically.
   */
  function isLowEndDevice() {
    const cores = navigator.hardwareConcurrency || 4;
    return cores < 4;
  }

  /**
   * Detect mobile screen width.
   * Used to skip keyboard rendering below 768px.
   */
  function isMobile() {
    return window.innerWidth < 768;
  }

  /* ----------------------------------------------------------
     STRING HELPERS
  ---------------------------------------------------------- */

  /** Escape HTML special characters to prevent XSS. */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /** Pad a number with leading zeros to a given length. */
  function zeroPad(num, length = 2) {
    return String(num).padStart(length, '0');
  }

  /* ----------------------------------------------------------
     EVENT HELPERS
  ---------------------------------------------------------- */

  /**
   * Emit a custom DOM event with optional data payload.
   * Use this for cross-module communication.
   *
   * Example:
   *   TypingAuraUtils.emit('typingaura:keypress', { char: 'a' });
   *   document.addEventListener('typingaura:keypress', e => console.log(e.detail));
   */
  function emit(eventName, detail = {}) {
    document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
  }

  /**
   * Shorthand for adding a document-level event listener.
   */
  function on(eventName, handler) {
    document.addEventListener(eventName, handler);
  }

  /* ----------------------------------------------------------
     PUBLIC API
  ---------------------------------------------------------- */
  return {
    debounce,
    throttle,
    clamp,
    round,
    randomInt,
    randomFrom,
    formatTime,
    formatMs,
    $,
    $$,
    createElement,
    flashClass,
    lsGet,
    lsSet,
    lsRemove,
    prefersReducedMotion,
    isLowEndDevice,
    isMobile,
    escapeHtml,
    zeroPad,
    emit,
    on
  };

})();
