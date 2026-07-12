/* ============================================================
   certificate.js — Certificate of Typing Proficiency
   Client-side only: draws a downloadable certificate on canvas
   and generates a deterministic verification code. No server,
   no account, no data ever leaves the browser.

   Honesty note (also stated in the UI): the verification code
   is a local integrity check, not a cryptographic guarantee —
   it confirms the displayed numbers were generated together,
   not that they are independently verifiable by a third party.

   Depends on: utilities.js
   ============================================================ */

const TypingAuraCertificate = (() => {

  const MIN_DURATION_SECONDS = 30; // below this, no certificate — too short to be meaningful
  const CANVAS_W = 1400;
  const CANVAS_H = 990;

  const COLORS = {
    bg:          '#faf8f2',
    borderOuter: '#1a2744',
    borderInner: '#00b8d4',
    ornament:    '#c9a961',
    titleText:   '#1a2744',
    bodyText:    '#3a4356',
    mutedText:   '#5a6478',
    faintText:   '#9aa0b0',
    wpmAccent:   '#00838f',
    accAccent:   '#7c4dff'
  };

  let currentStats    = null;
  let currentDuration  = null;

  /* ----------------------------------------------------------
     ELIGIBILITY
  ---------------------------------------------------------- */
  function isEligible(duration) {
    return typeof duration === 'number' && duration >= MIN_DURATION_SECONDS;
  }

  /* ----------------------------------------------------------
     VERIFICATION CODE — simple deterministic hash (DJB2 variant)
     Not cryptographic security — a lightweight integrity check
     that changes if any input value changes.
  ---------------------------------------------------------- */
  function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash * 33) ^ str.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36).toUpperCase();
  }

  function generateCode(name, wpm, accuracy, duration, dateStr) {
    const raw = `${name}|${wpm}|${accuracy}|${duration}|${dateStr}|TYPINGCERT-V1`;
    return simpleHash(raw).padStart(7, '0').slice(0, 7);
  }

  /* ----------------------------------------------------------
     DRAWING
  ---------------------------------------------------------- */
  function drawCornerMark(ctx, x, y, dx, dy) {
    const size = 36;
    ctx.strokeStyle = COLORS.ornament;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + dy * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * size, y);
    ctx.stroke();
  }

  async function ensureFontsReady() {
    if (!document.fonts || !document.fonts.ready) return;
    try {
      await document.fonts.load('700 46px Inter');
      await document.fonts.load('400 20px Inter');
      await document.fonts.ready;
    } catch (e) {
      // Font Loading API not fully supported — draw anyway with fallback font
    }
  }

  async function draw(name) {
    const canvas = TypingAuraUtils.$('#certificate-canvas');
    if (!canvas || !currentStats) return null;

    await ensureFontsReady();

    const ctx = canvas.getContext('2d');
    const W = CANVAS_W, H = CANVAS_H;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Borders
    ctx.strokeStyle = COLORS.borderOuter;
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.strokeStyle = COLORS.borderInner;
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    // Corner ornaments
    drawCornerMark(ctx, 48, 48, 1, 1);
    drawCornerMark(ctx, W - 48, 48, -1, 1);
    drawCornerMark(ctx, 48, H - 48, 1, -1);
    drawCornerMark(ctx, W - 48, H - 48, -1, -1);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.titleText;
    ctx.font = '700 32px Inter, sans-serif';
    ctx.fillText('CERTIFICATE OF TYPING PROFICIENCY', W / 2, 155);

    ctx.strokeStyle = COLORS.borderInner;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 150, 180);
    ctx.lineTo(W / 2 + 150, 180);
    ctx.stroke();

    // "This certifies that"
    ctx.font = '400 19px Inter, sans-serif';
    ctx.fillStyle = COLORS.mutedText;
    ctx.fillText('This certifies that', W / 2, 250);

    // Name
    const safeName = (name || 'Anonymous').slice(0, 40);
    ctx.font = '700 54px Inter, sans-serif';
    ctx.fillStyle = COLORS.titleText;
    ctx.fillText(safeName, W / 2, 320);

    const nameWidth = ctx.measureText(safeName).width;
    ctx.strokeStyle = COLORS.ornament;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameWidth / 2 - 24, 340);
    ctx.lineTo(W / 2 + nameWidth / 2 + 24, 340);
    ctx.stroke();

    // Body intro
    ctx.font = '400 20px Inter, sans-serif';
    ctx.fillStyle = COLORS.bodyText;
    ctx.fillText('has demonstrated a typing speed of', W / 2, 400);

    // Big stats row
    const wpm = Math.round(currentStats.netWpm);
    const acc = currentStats.accuracy;

    ctx.font = '700 48px Inter, sans-serif';
    ctx.fillStyle = COLORS.wpmAccent;
    ctx.textAlign = 'right';
    ctx.fillText(`${wpm} WPM`, W / 2 - 20, 470);

    ctx.fillStyle = COLORS.bodyText;
    ctx.font = '400 26px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('at', W / 2, 470);

    ctx.font = '700 48px Inter, sans-serif';
    ctx.fillStyle = COLORS.accAccent;
    ctx.textAlign = 'left';
    ctx.fillText(`${acc}% accuracy`, W / 2 + 20, 470);

    ctx.textAlign = 'center';
    ctx.font = '400 18px Inter, sans-serif';
    ctx.fillStyle = COLORS.mutedText;
    const durationLabel = currentDuration >= 60
      ? `${currentDuration / 60}-minute`
      : `${currentDuration}-second`;
    ctx.fillText(`over a ${durationLabel} typing assessment`, W / 2, 515);

    // Footer
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const code = generateCode(safeName, wpm, acc, currentDuration, dateStr);

    ctx.textAlign = 'left';
    ctx.font = '400 15px Inter, sans-serif';
    ctx.fillStyle = COLORS.mutedText;
    ctx.fillText(`Date: ${dateStr}`, 100, H - 100);

    ctx.textAlign = 'right';
    ctx.fillText(`Verification code: ${code}`, W - 100, H - 100);
    ctx.font = '700 16px Inter, sans-serif';
    ctx.fillStyle = COLORS.titleText;
    ctx.fillText('AlternateIncomeSource.com', W - 100, H - 74);

    ctx.textAlign = 'center';
    ctx.font = '400 13px Inter, sans-serif';
    ctx.fillStyle = COLORS.faintText;
    ctx.fillText(
      'Self-verified result, generated locally in your browser at the time of the test.',
      W / 2, H - 60
    );

    return { code, dateStr, wpm, acc };
  }

  /* ----------------------------------------------------------
     MODAL FLOW
  ---------------------------------------------------------- */
  function openForSession(stats, duration) {
    currentStats    = stats;
    currentDuration = duration;

    const modal = TypingAuraUtils.$('#certificate-modal');
    const formView = TypingAuraUtils.$('#certificate-form-view');
    const previewView = TypingAuraUtils.$('#certificate-preview-view');
    const nameInput = TypingAuraUtils.$('#certificate-name-input');

    if (!modal) return;
    modal.style.display = 'flex';
    if (formView) formView.style.display = 'block';
    if (previewView) previewView.style.display = 'none';
    if (nameInput) {
      nameInput.value = TypingAuraUtils.lsGet('certificate_name') || '';
      setTimeout(() => nameInput.focus(), 50);
    }
  }

  function close() {
    const modal = TypingAuraUtils.$('#certificate-modal');
    if (modal) modal.style.display = 'none';
  }

  async function handleGenerate() {
    const nameInput = TypingAuraUtils.$('#certificate-name-input');
    const name = (nameInput?.value || '').trim();
    if (!name) {
      nameInput?.focus();
      return;
    }
    TypingAuraUtils.lsSet('certificate_name', name);

    await draw(name);

    const formView = TypingAuraUtils.$('#certificate-form-view');
    const previewView = TypingAuraUtils.$('#certificate-preview-view');
    if (formView) formView.style.display = 'none';
    if (previewView) previewView.style.display = 'flex';
  }

  function handleEdit() {
    const formView = TypingAuraUtils.$('#certificate-form-view');
    const previewView = TypingAuraUtils.$('#certificate-preview-view');
    if (formView) formView.style.display = 'block';
    if (previewView) previewView.style.display = 'none';
  }

  function handleDownload() {
    const canvas = TypingAuraUtils.$('#certificate-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `typing-certificate-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function bindEvents() {
    TypingAuraUtils.$('#btn-certificate-close')?.addEventListener('click', close);
    TypingAuraUtils.$('#btn-certificate-generate')?.addEventListener('click', handleGenerate);
    TypingAuraUtils.$('#btn-certificate-edit')?.addEventListener('click', handleEdit);
    TypingAuraUtils.$('#btn-certificate-download')?.addEventListener('click', handleDownload);

    const nameInput = TypingAuraUtils.$('#certificate-name-input');
    nameInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    });

    // Close on backdrop click (but not when clicking the panel itself)
    TypingAuraUtils.$('#certificate-modal')?.addEventListener('click', e => {
      if (e.target && e.target.id === 'certificate-modal') close();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      const modal = TypingAuraUtils.$('#certificate-modal');
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') close();
    });
  }

  function init() {
    bindEvents();
  }

  return { init, isEligible, openForSession };

})();
