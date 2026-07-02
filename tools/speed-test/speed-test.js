/* ============================================================
   AlternateIncomeSource.com — Speed Test JavaScript
   File: tools/speed-test/speed-test.js

   WHAT THIS FILE DOES:
   → Draws the gauge arc on the SVG canvas
   → Measures real ping, download and upload speed
   → Detects visitor's IP address and internet provider
   → Updates all numbers and cards live during the test

   HOW TO EDIT IN FUTURE:
   → Change test duration      → find "TEST DURATION" section
   → Change max speed on gauge → find "GAUGE_MAX" and change the number
   → Change IP detection API   → find "IP DETECTION" section
   → Change server used        → find "TEST SERVERS" section

   IMPORTANT:
   → This file only runs AFTER the HTML page has fully loaded
   → It never touches style.css or speed-test.css
   → All colors on the gauge come from CSS variables (your palette system)
   ============================================================ */


/* ============================================================
   WRAP EVERYTHING IN A SELF-CONTAINED FUNCTION
   This prevents any variable names here from accidentally
   clashing with variables in theme.js or animation.js
   ============================================================ */
(function () {

  'use strict';

  /* ----------------------------------------------------------
     STEP 1 — CONNECT TO ALL HTML ELEMENTS
     We find each element by its id and store a reference.
     If any element is not found, the null check in each
     function prevents errors.
     ---------------------------------------------------------- */
  var startBtn   = document.getElementById('st-start-btn');
  var bigNum     = document.getElementById('st-big-num');
  var phaseEl    = document.getElementById('st-phase');
  var arcTrack   = document.getElementById('st-arc-track');
  var arcFill    = document.getElementById('st-arc-fill');
  var sparkDot   = document.getElementById('st-spark');
  var dlEl       = document.getElementById('st-dl');
  var ulEl       = document.getElementById('st-ul');
  var pingEl     = document.getElementById('st-ping');
  var ipEl       = document.getElementById('st-ip');
  var ispEl      = document.getElementById('st-isp');
  var metaEl     = document.getElementById('st-meta');
  var errorEl    = document.getElementById('st-error');

  /* ----------------------------------------------------------
     STEP 2 — GAUGE SETTINGS
     Change GAUGE_MAX to set the top speed shown on the arc.
     Default is 150 Mbps. If your users have faster connections,
     increase this (e.g. to 500 or 1000).
     ---------------------------------------------------------- */
  var GAUGE_MAX = 150;  /* Maximum Mbps shown on gauge arc */

  var ARC_CENTER_X = 130;
  var ARC_CENTER_Y = 130;
  var ARC_RADIUS   = 96;

  /* Arc goes from -225° to +45° — this gives a 270° speedometer
     with a gap at the bottom, exactly like a car speedometer. */
  var ARC_START_DEG = -225;
  var ARC_END_DEG   =   45;


  /* ----------------------------------------------------------
     STEP 3 — DRAW THE GAUGE ARC
     Converts degrees to X/Y coordinates and creates the SVG
     path string used for both the track and the fill arc.
     ---------------------------------------------------------- */
  function degreeToXY (degrees) {
    /* Convert degrees to radians, offset by -90° so 0° is at top */
    var radians = (degrees - 90) * Math.PI / 180;
    return {
      x: ARC_CENTER_X + ARC_RADIUS * Math.cos(radians),
      y: ARC_CENTER_Y + ARC_RADIUS * Math.sin(radians)
    };
  }

  function buildArcPath (startDeg, endDeg) {
    var start    = degreeToXY(startDeg);
    var end      = degreeToXY(endDeg);
    var sweepDeg = endDeg - startDeg;
    var largeArc = sweepDeg > 180 ? 1 : 0;
    return (
      'M ' + start.x + ' ' + start.y +
      ' A ' + ARC_RADIUS + ' ' + ARC_RADIUS +
      ' 0 ' + largeArc + ' 1 ' +
      end.x + ' ' + end.y
    );
  }

  /* Draw the full grey background track */
  var fullArcPath = buildArcPath(ARC_START_DEG, ARC_END_DEG);
  if (arcTrack) {
    arcTrack.setAttribute('d', fullArcPath);
    arcTrack.setAttribute('stroke', 'rgba(255,255,255,0.1)');
    arcTrack.setAttribute('stroke-width', '10');
    arcTrack.setAttribute('stroke-linecap', 'round');
  }

  /* The fill arc uses the same path — JavaScript animates it
     using stroke-dasharray trick (common SVG animation method) */
  if (arcFill) {
    arcFill.setAttribute('d', fullArcPath);
    arcFill.setAttribute('stroke-width', '10');
    arcFill.setAttribute('stroke-linecap', 'round');
    arcFill.setAttribute('filter', 'url(#st-glow)');
    /* Color from CSS variable so palette switching works */
    arcFill.style.stroke = 'var(--accent)';
  }

  /* Style the spark dot */
  if (sparkDot) {
    sparkDot.style.fill = 'var(--accent)';
    sparkDot.setAttribute('filter', 'url(#st-glow)');
  }


  /* ----------------------------------------------------------
     STEP 4 — UPDATE GAUGE DISPLAY
     Called repeatedly during the test with the current speed.
     ---------------------------------------------------------- */
  function updateGauge (mbps) {
    /* Convert speed to 0–100% of the arc */
    var pct = Math.max(0, Math.min(100, (mbps / GAUGE_MAX) * 100));

    /* Animate the fill arc */
    if (arcFill) {
      arcFill.setAttribute('stroke-dasharray', pct + ' 100');
    }

    /* Move the spark dot to the tip of the fill arc */
    if (sparkDot) {
      var tipDeg = ARC_START_DEG + (ARC_END_DEG - ARC_START_DEG) * (pct / 100);
      var tipPos = degreeToXY(tipDeg);
      sparkDot.setAttribute('cx', tipPos.x);
      sparkDot.setAttribute('cy', tipPos.y);
      sparkDot.setAttribute('opacity', mbps > 0.1 ? '1' : '0');
    }

    /* Update the center number */
    if (bigNum) {
      bigNum.textContent = mbps.toFixed(1);
    }
  }

  /* ----------------------------------------------------------
     STEP 5 — UPDATE PHASE LABEL
     Shows the current phase name inside the gauge center.
     ---------------------------------------------------------- */
  function setPhase (text) {
    if (phaseEl) {
      phaseEl.textContent = text || '';
    }
  }


  /* ----------------------------------------------------------
     STEP 6 — RESET UI TO INITIAL STATE
     Called at the start of each new test.
     ---------------------------------------------------------- */
  function resetUI () {
    if (dlEl)    dlEl.textContent    = '—';
    if (ulEl)    ulEl.textContent    = '—';
    if (pingEl)  pingEl.textContent  = '—';
    if (metaEl)  metaEl.textContent  = '';
    if (errorEl) errorEl.textContent = '';
    updateGauge(0);
    setPhase('');
  }


  /* ----------------------------------------------------------
     TEST SERVERS
     We use Cloudflare's public speed test endpoints.
     These are the same servers used by Cloudflare's own
     speed.cloudflare.com — no API key needed, always free.

     __down?bytes=N  → downloads N bytes
     __up            → accepts POST data (upload test)
     ---------------------------------------------------------- */
  var CF_DOWN  = 'https://speed.cloudflare.com/__down?bytes=';
  var CF_UP    = 'https://speed.cloudflare.com/__up';
  var CF_PING  = 'https://speed.cloudflare.com/__down?bytes=1000';


  /* ----------------------------------------------------------
     TEST DURATIONS (milliseconds)
     How long each phase runs.
     Increase for more accurate results on fast connections.
     Decrease for faster test completion.
     ---------------------------------------------------------- */
  var PING_SAMPLES     = 6;         /* number of ping measurements */
  var DOWNLOAD_DURATION = 7000;     /* 7 seconds of download measuring */
  var UPLOAD_DURATION   = 5000;     /* 5 seconds of upload measuring */


  /* ----------------------------------------------------------
     STEP 7 — PING MEASUREMENT
     Sends multiple tiny requests and measures round-trip time.
     Returns the best (lowest) result in milliseconds.
     ---------------------------------------------------------- */
  function measurePing (sampleCount) {
    var times = [];

    /* Runs one ping request and adds result to times array */
    function onePing () {
      return new Promise(function (resolve) {
        var t0 = performance.now();
        fetch(CF_PING + '&_nocache=' + Math.random(), { cache: 'no-store' })
          .then(function () {
            times.push(performance.now() - t0);
            resolve();
          })
          .catch(function () {
            /* If one ping fails, we still continue */
            resolve();
          });
      });
    }

    /* Chain all pings sequentially (not in parallel) */
    var chain = Promise.resolve();
    for (var i = 0; i < sampleCount; i++) {
      chain = chain.then(onePing);
    }

    return chain.then(function () {
      if (!times.length) return null;
      /* Sort and return the lowest value (most favorable, less noise) */
      times.sort(function (a, b) { return a - b; });
      return Math.round(times[0]);
    });
  }


  /* ----------------------------------------------------------
     STEP 8 — DOWNLOAD MEASUREMENT
     Downloads repeated chunks of data and measures total
     bytes received vs time elapsed.
     Updates the gauge live as download progresses.
     ---------------------------------------------------------- */
  function measureDownload (durationMs) {
    return new Promise(function (resolve) {
      var totalBytes  = 0;
      var startTime   = performance.now();
      var completed   = false;
      var chunkSize   = 10 * 1024 * 1024; /* 10 MB per chunk */

      function downloadChunk () {
        if (completed) return;

        var url = CF_DOWN + chunkSize + '&_nocache=' + Math.random();

        fetch(url, { cache: 'no-store' })
          .then(function (response) {
            var reader = response.body.getReader();

            function readStream () {
              if (completed) return;
              reader.read().then(function (result) {
                if (result.done) {
                  /* Chunk finished, start next one if time allows */
                  if (!completed) downloadChunk();
                  return;
                }

                /* Add received bytes to total */
                totalBytes += result.value.length;

                /* Calculate current speed */
                var elapsed = performance.now() - startTime;
                var mbps    = (totalBytes * 8) / (elapsed / 1000) / 1e6;
                updateGauge(mbps);

                /* Stop after the specified duration */
                if (elapsed >= durationMs) {
                  completed = true;
                  resolve(mbps);
                  return;
                }

                readStream();

              }).catch(function () {
                if (!completed) {
                  completed  = true;
                  var elapsed = performance.now() - startTime;
                  var mbps    = elapsed > 0
                    ? (totalBytes * 8) / (elapsed / 1000) / 1e6
                    : 0;
                  resolve(mbps);
                }
              });
            }

            readStream();
          })
          .catch(function () {
            if (!completed) {
              completed = true;
              resolve(0);
            }
          });
      }

      downloadChunk();
    });
  }


  /* ----------------------------------------------------------
     STEP 9 — UPLOAD MEASUREMENT
     Sends repeated chunks of data to the server and measures
     total bytes sent vs time elapsed.
     ---------------------------------------------------------- */
  function measureUpload (durationMs) {
    return new Promise(function (resolve) {
      var totalBytes  = 0;
      var startTime   = performance.now();
      var completed   = false;

      /* Create a fixed chunk of random data to send repeatedly */
      var chunkSize   = 4 * 1024 * 1024; /* 4 MB per upload */
      var uploadBlob  = new Blob([new Uint8Array(chunkSize)]);

      function uploadChunk () {
        if (completed) return;

        fetch(CF_UP, {
          method: 'POST',
          body: uploadBlob,
          cache: 'no-store'
        })
        .then(function () {
          totalBytes += chunkSize;

          var elapsed = performance.now() - startTime;
          var mbps    = (totalBytes * 8) / (elapsed / 1000) / 1e6;
          updateGauge(mbps);

          if (elapsed >= durationMs) {
            completed = true;
            resolve(mbps);
            return;
          }

          uploadChunk();
        })
        .catch(function () {
          if (!completed) {
            completed  = true;
            var elapsed = performance.now() - startTime;
            var mbps    = elapsed > 0
              ? (totalBytes * 8) / (elapsed / 1000) / 1e6
              : 0;
            resolve(mbps);
          }
        });
      }

      uploadChunk();
    });
  }


  /* ----------------------------------------------------------
     IP DETECTION
     Uses ipapi.co — free tier, no API key needed for
     moderate traffic. Returns IP address, ISP/org name.

     If this ever stops working, replace the URL with:
     'https://api.ipify.org?format=json'  (IP only)
     or
     'https://ipwho.is/'  (IP + ISP, also free)
     ---------------------------------------------------------- */
  function detectIPAndISP () {
    fetch('https://ipapi.co/json/', { cache: 'no-store' })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (ipEl && data.ip) {
          ipEl.textContent = data.ip;
        }
        if (ispEl) {
          /* Try org first, then isp field */
          var provider = data.org || data.isp || 'Unknown provider';
          /* Remove the "AS12345 " prefix that some APIs include */
          provider = provider.replace(/^AS\d+\s+/, '');
          ispEl.textContent = provider;
        }
      })
      .catch(function () {
        /* If IP detection fails, show a friendly message */
        if (ipEl)  ipEl.textContent  = 'Unable to detect';
        if (ispEl) ispEl.textContent = 'Unable to detect';
      });
  }


  /* ----------------------------------------------------------
     STEP 10 — SUMMARY MESSAGE
     Shows a helpful sentence after the test based on ping.
     ---------------------------------------------------------- */
  function getSummaryMessage (pingMs) {
    if (pingMs < 30) {
      return 'Excellent latency — perfect for gaming and video calls.';
    } else if (pingMs < 60) {
      return 'Great latency — suitable for all online activities.';
    } else if (pingMs < 100) {
      return 'Good latency — fine for streaming and browsing.';
    } else if (pingMs < 150) {
      return 'Moderate latency — may notice some delay in real-time apps.';
    } else {
      return 'Higher latency — consider moving closer to your router.';
    }
  }


  /* ----------------------------------------------------------
     STEP 11 — MAIN TEST SEQUENCE
     Runs ping → download → upload in order.
     Updates the UI at each stage.
     ---------------------------------------------------------- */
  function runTest () {
    /* Disable button and update label */
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = '⏳ Testing...';
    }

    resetUI();

    /* --- PHASE 1: PING --- */
    setPhase('Checking ping...');

    measurePing(PING_SAMPLES)
      .then(function (pingMs) {

        if (pingMs === null) {
          throw new Error('Could not measure ping. Check your connection.');
        }

        /* Show ping result immediately */
        if (pingEl) pingEl.textContent = pingMs;
        setPhase('Measuring download...');
        updateGauge(0);

        /* --- PHASE 2: DOWNLOAD --- */
        return measureDownload(DOWNLOAD_DURATION)
          .then(function (downloadMbps) {

            /* Show download result */
            if (dlEl) dlEl.textContent = downloadMbps.toFixed(1);
            setPhase('Measuring upload...');
            updateGauge(0);

            /* --- PHASE 3: UPLOAD --- */
            return measureUpload(UPLOAD_DURATION)
              .then(function (uploadMbps) {

                /* Show upload result */
                if (ulEl) ulEl.textContent = uploadMbps.toFixed(1);

                /* Leave gauge showing upload speed */
                updateGauge(uploadMbps);
                setPhase('Done ✓');

                /* Show summary message */
                if (metaEl) {
                  metaEl.textContent = getSummaryMessage(pingMs);
                }

              });
          });
      })
      .catch(function (err) {
        /* Handle any error during the test */
        setPhase('');
        updateGauge(0);
        if (errorEl) {
          errorEl.textContent = 'Test could not complete. Please check your connection and try again.';
        }
      })
      .finally(function () {
        /* Re-enable button whether test succeeded or failed */
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.textContent = '↻ Test Again';
        }
      });
  }


  /* ----------------------------------------------------------
     STEP 12 — INITIALISE
     Runs when the page first loads.
     ---------------------------------------------------------- */
  function init () {
    /* Draw the gauge at zero */
    updateGauge(0);

    /* Detect IP and ISP immediately on page load
       (does not require the user to start the test) */
    detectIPAndISP();

    /* Connect the start button */
    if (startBtn) {
      startBtn.addEventListener('click', runTest);
    }
  }

  /* Run init when everything is ready */
  init();

}()); /* end self-contained function */
