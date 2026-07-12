# TypingAura
### Free Typing Speed Test Tool for AlternateIncomeSource.com

---

## What This Is

TypingAura is a free, browser-based typing speed test tool with a cyberpunk
RGB keyboard aesthetic. It measures WPM, accuracy, consistency, and shows
you specifically what to improve — not just a number. It also includes a
27-lesson structured "Learn" mode for building touch-typing skill from
scratch.

Built for: **alternateincomesource.com/tools/typing-speed-test/**
No server needed. Works directly from GitHub Pages.

---

## File Structure

```
tools/
└── typing-speed-test/
    ├── index.html              ← The main page
    ├── css/
    │   ├── variables.css       ← All colors, sizes, fonts (edit here to restyle)
    │   ├── reset.css           ← Browser normalization
    │   ├── layout.css          ← Page structure
    │   ├── keyboard.css        ← RGB keyboard styles
    │   ├── typing-area.css     ← The typing text display
    │   ├── results.css         ← Results page styles
    │   ├── lessons.css         ← Learn mode styles
    │   ├── onboarding.css      ← Getting Started guide styles
    │   ├── certificate.css     ← Certificate modal styles
    │   ├── achievements.css    ← Badge styles
    │   ├── animations.css      ← All animations
    │   └── responsive.css      ← Mobile layout
    ├── js/
    │   ├── utilities.js        ← Shared helpers (loads first)
    │   ├── sound.js            ← Key click audio (synthesized, no sound files needed)
    │   ├── effects.js          ← Particles and screen glow
    │   ├── timer.js            ← Countdown timer
    │   ├── typing-engine.js    ← Core typing logic
    │   ├── statistics.js       ← WPM, accuracy, all metrics
    │   ├── keyboard.js         ← RGB keyboard renderer + finger-diagram highlighting
    │   ├── lessons.js          ← Lesson data and progression
    │   ├── onboarding.js       ← Getting Started guided walkthrough
    │   ├── certificate.js      ← Certificate generation (canvas + verification code)
    │   ├── achievements.js     ← Achievement system
    │   ├── results.js          ← Results page renderer
    │   └── main.js             ← App controller (loads last)
    ├── assets/
    │   └── icons/
    │       ├── favicon.svg         ← Tab icon (modern browsers)
    │       ├── favicon.ico         ← Tab icon (fallback)
    │       ├── apple-touch-icon.png← iOS "Add to Home Screen" icon
    │       └── typing-test-og.jpg   ← Social share preview image
    └── README.md               ← This file
```

This entire `typing-speed-test` folder goes inside your existing `tools/`
folder on GitHub, next to `tools/speed-test/`.

---

## What Was Fixed From the Original Build

Full details were covered in chat, but as a reference, here is what changed
and why:

1. **Folder structure restored.** The version you had was flattened — every
   CSS/JS file sat at the same level with no `css/` or `js/` subfolder.
   Since `index.html` specifically loads `css/variables.css`, `js/main.js`,
   etc., uploading it flat would have meant the whole page loaded with no
   styling and no working typing test at all. This zip has the correct
   structure.
2. **`<h1>` moved out of `<head>`.** It's now the first element in `<body>`
   — `<head>` can only hold metadata, not content, so this was invalid HTML.
3. **Every `/typingaura/` link fixed to `/tools/typing-speed-test/`** —
   canonical tag, Open Graph tags, Twitter tags, schema.org data, the header
   logo link, the footer link, and the "copy score" share text that gets
   pasted into WhatsApp/Twitter when someone shares their result.
4. **Fonts now actually load.** `variables.css` specifies JetBrains Mono and
   Inter, but nothing ever loaded them, so every visitor silently saw a
   fallback system font instead of the intended look. Added the Google Fonts
   link.
5. **Missing icon files created**: `favicon.svg`, `favicon.ico`,
   `apple-touch-icon.png`, and the `typing-test-og.jpg` social-share image —
   all referenced in the HTML but not present in your original files.
6. **Learn mode now actually tracks progress.** Four connected bugs meant
   lessons looked complete but weren't functionally wired in:
   - Finishing a lesson never checked pass/fail or marked it done, so the
     progress dots never filled in and "next lesson" always restarted lesson 1.
   - Restarting mid-lesson (Tab, Esc, or the Restart button) silently
     discarded the lesson and gave you random words instead.
   - Leaving Learn mode never hid the lesson panel, so old lesson info could
     stay stuck on screen inside the free Test mode.
   - The "keep generating more words so a timed test never runs dry" logic
     was also running during lessons, so a short, deliberately-designed
     drill (e.g. home-row only) would get random full-alphabet words
     appended right after it.
   All four are fixed, and results now show a pass/fail message with
   "Next Lesson" / "Retry Lesson" buttons when you finish a lesson.
7. **Removed arbitrary UK-only targeting** (`geo.region: GB`, plus hreflang
   and locale tags favoring only GB/IE/AU/US). There was no stated reason
   for UK-specific targeting, so this is now a single neutral global tag —
   worth revisiting once you decide on real target markets.
8. **Added a small "← Tools" link in the header** next to the logo, so this
   page doesn't feel like a dead end — visitors can get back to your tools
   hub without scrolling to the footer.

Nothing about the actual typing-test logic, the WPM/accuracy formulas, the
lesson content, or the visual design was rewritten — those were already
solid. This was about making the existing engineering actually run
correctly once it's live.

---

## New: "Getting Started" Hand-Placement Guide

A permanent card now sits at the top of the Learn section. It opens a
5-step guided walkthrough teaching home-row finger placement (left hand
A S D F, right hand J K L ;, thumbs on space, and the F/J bumps), then
hands off directly into your real Lesson 1.

Worth knowing: your original build already contained a two-hand finger
diagram (SVG) meant to light up during lessons, but nothing in the
JavaScript ever activated it — it sat there fully drawn but inert. Building
this guide included wiring that diagram up for real, so it now also lights
the correct finger during ordinary lesson hints, not just inside the new
guide.

Nothing here is gated or forced — it's always sitting on the Learn page to
revisit any time, and shows a small "✓ Done" badge once completed. A "Skip"
option is always available for anyone who already knows how to type.

---

## Major Fixes: WPM Accuracy, Scrolling, Rebrand, Visual Redesign

### The WPM calculation bug

`errorCount` incremented on every wrong keystroke but never decremented
when you backspaced to fix it — so it measured "every mistake made during
the whole test," not "mistakes remaining in your final text." A careful
typist who corrects their own typos as they go was being permanently
penalised for mistakes that no longer existed in their result. Verified
with a matching scenario: a genuine 56 gross WPM with ~28 corrected typos
produced exactly 28 net WPM under the old formula — matching a real
reported discrepancy against a competitor site almost exactly. Fixed to
use final/uncorrected error count instead; the same scenario now correctly
shows 53 net WPM. The results screen's error display was also aligned to
the same corrected metric.

### The growing text area

The typing card used `min-height`, so it grew taller every time more words
were appended, pushing the keyboard down the page. Fixed with a real fixed
height (exactly 3 lines) and a smooth CSS-transform scroll that keeps your
current line at the top of the visible area as you type — keyboard never
moves again. Two duplicate copies of the same bug were also found and
fixed in responsive breakpoints, including one specifically at the exact
screen width where the keyboard becomes visible.

### Rebrand

"TypingAura" removed as a standalone name throughout — title, meta tags,
schema, header logo, footer, and all on-page copy now read as a plain
"Typing Speed Test," with AlternateIncomeSource as the one umbrella brand.
The header logo is now an icon mark instead of a wordmark. Internal code
naming (JavaScript module names, storage keys) was left alone deliberately
— renaming those is invisible to users and carries real risk of breaking
something for zero visible benefit.

### Results screen — redesigned, not cloned

Replaced the four-card grid (a layout most typing test sites use) with a
combined WPM + accuracy ring as the focal point: your net WPM counts up
inside an animated accuracy ring, with a performance-tier badge ("Above
Average," "Professional," etc. — using the same benchmark bands written
into the page's SEO content, so the language stays consistent everywhere).
Secondary stats moved to a quieter strip below. Same standard metrics
throughout (WPM, accuracy, errors, time, consistency) — those are
standard for a reason — just presented as its own thing rather than a
copy of any specific competitor's layout.

### Typing area — reactive glow

The border/glow around the typing card now drifts through colour based on
your current live speed (calm blue while slow, shifting toward gold at
higher speed) — checked only every so often and only changes on a real
speed-tier change, not every keystroke, so it stays a calm ambient effect
rather than a distracting flicker. Fully inert while reduced-motion is
enabled.

---

## SEO & AI-Engine (GEO) Foundation Pass

The single biggest issue found: **your full 27-lesson curriculum lived only
inside a JavaScript file** — meaning any crawler that doesn't execute
JavaScript (including some AI crawlers) never saw it at all. Fixed by
writing the complete curriculum out as real, static HTML text on the page
itself — every level, every lesson title, in a scannable list format
(research on 2026 AI search behaviour confirms structured lists get
extracted far more reliably than prose paragraphs).

Also fixed in this pass:
- The FAQ schema (invisible, for search engines) and the visible FAQ
  accordion previously listed **different questions** — now they match
  exactly, expanded from 5–6 questions to 10 genuinely useful ones (added:
  WPM vs CPM, how long touch typing takes to learn, typing benchmarks by
  job type)
- Added a "What's a Good Typing Speed" reference table — the kind of
  citable, structured content AI answer engines are shown to reward
- Added a visible breadcrumb trail (previously it only existed hidden in
  schema data, never on the page itself)
- Added HowTo schema for the Getting Started guide and Course schema for
  the lesson system — two schema types your competitors mostly don't use
- Fixed a factual error found while reviewing: the page said "20 structured
  lessons," it's actually 27

---

## New: Certificate of Typing Proficiency

A "Get Certificate" button now appears on the results screen after any
free-test session of 30 seconds or longer (not shown for lesson attempts —
those are short, targeted drills, not a fair basis for a proficiency claim).

The person enters their name, and a certificate is drawn — landscape,
formal border, their name, WPM, accuracy, test duration, date, and a short
verification code — all rendered live on a `<canvas>` element and
downloadable as a PNG. Nothing is sent anywhere; it's generated entirely in
the browser.

**Worth knowing, and stated in the UI itself:** the verification code is a
local integrity check (a hash of the name, score, and date), not a
cryptographic or third-party-verifiable credential — there's no server to
look it up against. It's honestly positioned as a personal, shareable
record — genuinely useful to attach to a freelance profile or resume,
but not a legal certification. Being upfront about that distinction was a
deliberate choice over inflating what it actually proves.

The certificate is also deliberately **not** styled like the rest of this
dark, neon app — it's drawn to look like an actual printable paper
certificate, since that's what makes it credible for its real use case.



## How to Upload to GitHub (Step by Step)

**You do not need to know coding. Follow these steps exactly.**

### Step 1 — Go to your GitHub repository

1. Open your web browser and go to **github.com**, sign in
2. Click into the repository connected to alternateincomesource.com
3. Click into the `tools` folder (where `speed-test` already lives)

### Step 2 — Create the typing-speed-test folder + index.html

1. Click **"Add file"** → **"Create new file"**
2. In the name box type: `typing-speed-test/index.html`
   (the slash `/` auto-creates the folder)
3. Open this zip's `index.html` on your computer, select all (Ctrl+A),
   copy (Ctrl+C), and paste into the GitHub editor
4. Scroll down, click **"Commit new file"**

### Step 3 — Upload every CSS file

Stay inside `tools/typing-speed-test/`. For each file below: **Add file** →
**Create new file** → type the path (e.g. `css/variables.css`) → paste that
file's content → **Commit new file**.

- `css/variables.css`
- `css/reset.css`
- `css/layout.css`
- `css/keyboard.css`
- `css/typing-area.css`
- `css/results.css`
- `css/lessons.css`
- `css/onboarding.css`
- `css/certificate.css`
- `css/achievements.css`
- `css/animations.css`
- `css/responsive.css`

### Step 4 — Upload every JS file

Same process, using `js/` as the folder prefix, in this order:

- `js/utilities.js`
- `js/sound.js`
- `js/effects.js`
- `js/timer.js`
- `js/typing-engine.js`
- `js/statistics.js`
- `js/keyboard.js`
- `js/lessons.js`
- `js/onboarding.js`
- `js/certificate.js`
- `js/achievements.js`
- `js/results.js`
- `js/main.js`

### Step 5 — Upload the icon files

These are binary image files, so use **Add file → Upload files** (not
"Create new file", which is for pasting text) and drag in all four from
this zip's `assets/icons/` folder:

- `assets/icons/favicon.svg`
- `assets/icons/favicon.ico`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/typing-test-og.jpg`

Make sure you're inside `tools/typing-speed-test/assets/icons/` before
uploading (create the folders the same slash-in-filename way if GitHub
doesn't offer them yet).

### Step 6 — Add ONE line to your site's real sitemap.xml

Don't upload a separate sitemap.xml inside this tool's folder — your site
already has one sitemap.xml at the root. Open it and add this entry:

```xml
<url>
  <loc>https://www.alternateincomesource.com/tools/typing-speed-test/</loc>
  <lastmod>2026-07-07</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.9</priority>
</url>
```

(Your root `robots.txt` doesn't need any change for this tool to work —
skip it.)

### Step 7 — Check the live site

1. Wait 1–2 minutes after your last upload
2. Go to `https://www.alternateincomesource.com/tools/typing-speed-test/`
3. Type a few characters — you should see the keyboard light up and the
   live WPM counter move

**If the page looks unstyled or nothing responds to typing:** open dev
tools (F12) → Console tab → look for a red 404 and check that exact file
path was uploaded to the exact folder shown in the error.

---

## How to Make Changes Later

1. Go to the file in your GitHub repository
2. Click the pencil (Edit) icon
3. Make your change, then **Commit changes**

The live site updates within 1–2 minutes.

**To change colors:** edit `css/variables.css`.
**To change test words:** edit `js/typing-engine.js`, the `WORDS` array.
**To change SEO text:** edit `index.html`, the `<meta name="description">` tag.
**To change lesson content:** edit `js/lessons.js`, the `LESSONS` array.

---

## What Each Module Does (Quick Reference)

| File | What it controls |
|------|-----------------|
| `variables.css` | All colors, sizes, fonts — change appearance here |
| `typing-engine.js` | Core logic: detects right/wrong keys, infinite vs. fixed-length text |
| `keyboard.js` | Draws the RGB keyboard and handles key lighting |
| `timer.js` | The countdown clock |
| `statistics.js` | Calculates WPM, accuracy, consistency |
| `results.js` | Draws the results screen, graph, and lesson pass/fail state |
| `lessons.js` | All lesson content and progression |
| `achievements.js` | Badge unlock rules |
| `effects.js` | Particles and screen glow |
| `sound.js` | Key click audio |
| `main.js` | Connects everything together, tracks free-test vs. lesson state |

---

*TypingAura — Built for AlternateIncomeSource.com*
