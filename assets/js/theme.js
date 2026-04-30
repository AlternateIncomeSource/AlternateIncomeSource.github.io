/* ============================================================
   AlternateIncomeSource.com — Theme System
   File: assets/js/theme.js

   What this file does:
   → Controls Day/Night mode switching
   → Controls 7 color palette switching
   → Saves user preference in browser memory
   → Everything updates instantly when user changes theme
   ============================================================ */


/* ============================================================
   SECTION 1 — PALETTE CONFIGURATION
   
   What is this?
   → A list of all 7 color palettes available on your site.
   → Each palette has a name, color value, and display dot color.
   
   Why 7 palettes?
   → Gives users personal control over their experience.
   → Users who can customize stay longer on your site.
   ============================================================ */

const PALETTES = [
  { id: 'default', name: 'Cyan',   color: '#00E5CC' },
  { id: 'purple',  name: 'Purple', color: '#AA00FF' },
  { id: 'gold',    name: 'Gold',   color: '#FFB300' },
  { id: 'green',   name: 'Green',  color: '#00E676' },
  { id: 'pink',    name: 'Pink',   color: '#FF4081' },
  { id: 'orange',  name: 'Orange', color: '#FF6E40' },
  { id: 'ice',     name: 'Ice',    color: '#E0F7FA' },
];


/* ============================================================
   SECTION 2 — LOAD SAVED PREFERENCES
   
   What is localStorage?
   → A small storage space inside the user's browser.
   → Like a sticky note the browser remembers forever.
   → When user picks a theme, we write it here.
   → Next time they visit, we read it and apply it again.
   → This means their choice is remembered even after
     closing the browser or restarting their computer.
   ============================================================ */

/* Read saved theme — default to 'dark' if nothing saved */
let currentTheme   = localStorage.getItem('ais-theme')   || 'dark';

/* Read saved palette — default to 'default' (cyan) */
let currentPalette = localStorage.getItem('ais-palette') || 'default';


/* ============================================================
   SECTION 3 — APPLY THEME ON PAGE LOAD
   
   What happens here?
   → As soon as this file loads, we apply the saved theme.
   → This prevents a "flash" of wrong colors when page loads.
   → User always sees their preferred theme instantly.
   ============================================================ */

function applyTheme(theme) {
  /* 
   What is document.documentElement?
   → The <html> tag at the top of your page.
   → Setting data-theme on it affects your ENTIRE page
     because CSS reads it and switches all colors.
  */
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  /* Save to browser memory so it persists */
  localStorage.setItem('ais-theme', theme);
  currentTheme = theme;

  /* Update the toggle button text/icon */
  updateThemeButton();
}


/* ============================================================
   SECTION 4 — APPLY PALETTE
   
   Same idea as theme — but for color palette.
   Sets data-palette on <html> tag.
   CSS reads this and switches accent colors everywhere.
   ============================================================ */

function applyPalette(palette) {
  if (palette === 'default') {
    document.documentElement.removeAttribute('data-palette');
  } else {
    document.documentElement.setAttribute('data-palette', palette);
  }

  /* Save choice */
  localStorage.setItem('ais-palette', palette);
  currentPalette = palette;

  /* Update palette popup to show active selection */
  updatePalettePopup();
}


/* ============================================================
   SECTION 5 — UPDATE BUTTON APPEARANCE
   
   When theme changes, the toggle button icon and text
   should update to match current mode.
   ============================================================ */

function updateThemeButton() {
  /* Find the theme toggle button on the page */
  const btn = document.getElementById('theme-toggle');
  if (!btn) return; /* Safety check — if button not found, stop */

  if (currentTheme === 'dark') {
    btn.innerHTML = '☀️ Day';     /* Show sun icon in dark mode */
  } else {
    btn.innerHTML = '🌙 Night';   /* Show moon icon in light mode */
  }
}


/* ============================================================
   SECTION 6 — BUILD PALETTE POPUP
   
   This creates the palette selector popup dynamically.
   It builds the list of color options from PALETTES array above.
   
   Why build it with JavaScript instead of HTML?
   → If you add a new palette later, you only change PALETTES above.
   → The popup updates automatically. No HTML changes needed.
   ============================================================ */

function buildPalettePopup() {
  /* Find the palette list container */
  const list = document.getElementById('palette-list');
  if (!list) return;

  /* Clear existing content */
  list.innerHTML = '';

  /* Loop through each palette and create a button */
  PALETTES.forEach(function(palette) {

    /* Create button element */
    const btn = document.createElement('button');
    btn.className = 'palette-option' + 
      (palette.id === currentPalette ? ' active' : '');
    
    /* Button shows a colored dot + palette name */
    btn.innerHTML = `
      <span class="palette-dot" style="background:${palette.color}"></span>
      ${palette.name}
    `;

    /* When user clicks this palette option */
    btn.addEventListener('click', function() {
      applyPalette(palette.id);  /* Apply the palette */
      closePalettePopup();       /* Close the popup */
    });

    list.appendChild(btn);
  });
}


/* ============================================================
   SECTION 7 — UPDATE PALETTE POPUP (after selection)
   
   Refreshes which palette option shows as "active" (highlighted).
   ============================================================ */

function updatePalettePopup() {
  const options = document.querySelectorAll('.palette-option');
  options.forEach(function(opt, index) {
    if (PALETTES[index] && PALETTES[index].id === currentPalette) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}


/* ============================================================
   SECTION 8 — OPEN / CLOSE PALETTE POPUP
   ============================================================ */

function openPalettePopup() {
  const popup = document.getElementById('palette-popup');
  if (popup) popup.classList.add('open');
}

function closePalettePopup() {
  const popup = document.getElementById('palette-popup');
  if (popup) popup.classList.remove('open');
}

function togglePalettePopup() {
  const popup = document.getElementById('palette-popup');
  if (!popup) return;
  
  if (popup.classList.contains('open')) {
    closePalettePopup();
  } else {
    buildPalettePopup(); /* Rebuild to show current active state */
    openPalettePopup();
  }
}


/* ============================================================
   SECTION 9 — CLOSE POPUP WHEN CLICKING OUTSIDE
   
   Good UX practice: if user clicks anywhere outside
   the palette popup, it closes automatically.
   ============================================================ */

document.addEventListener('click', function(event) {
  const popup  = document.getElementById('palette-popup');
  const btn    = document.getElementById('palette-toggle');
  
  if (!popup || !btn) return;
  
  /* If click was NOT inside popup AND NOT on the toggle button */
  if (!popup.contains(event.target) && !btn.contains(event.target)) {
    closePalettePopup();
  }
});


/* ============================================================
   SECTION 10 — NAVBAR SCROLL EFFECT
   
   When user scrolls down, the navbar gets a shadow.
   This gives depth and makes it feel premium.
   ============================================================ */

window.addEventListener('scroll', function() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');    /* Add shadow */
  } else {
    navbar.classList.remove('scrolled'); /* Remove shadow at top */
  }
});


/* ============================================================
   SECTION 11 — MOBILE MENU TOGGLE
   
   On mobile screens, nav links are hidden.
   The hamburger button (☰) shows/hides them.
   ============================================================ */

function toggleMobileMenu() {
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;
  navLinks.classList.toggle('mobile-open');
}


/* ============================================================
   SECTION 12 — INITIALIZE EVERYTHING
   
   What is DOMContentLoaded?
   → An event that fires when your HTML page has fully loaded.
   → We wait for this before running our code,
     so all HTML elements exist when we try to find them.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {

  /* Apply saved theme immediately */
  applyTheme(currentTheme);

  /* Apply saved palette immediately */
  applyPalette(currentPalette);

  /* Connect theme toggle button */
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      /* Flip between dark and light */
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  /* Connect palette toggle button */
  const paletteBtn = document.getElementById('palette-toggle');
  if (paletteBtn) {
    paletteBtn.addEventListener('click', function(e) {
      e.stopPropagation(); /* Prevent click from closing popup immediately */
      togglePalettePopup();
    });
  }

  /* Connect mobile hamburger button */
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
  }

  /* Build palette popup content */
  buildPalettePopup();

  /* Update theme button text */
  updateThemeButton();

  console.log('✅ AIS Theme System loaded');
  console.log('Theme:', currentTheme, '| Palette:', currentPalette);
});
