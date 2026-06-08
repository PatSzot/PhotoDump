// ─── MainStage 2D canvas renderer ─────────────────────────────────────────────
// Inspired by MainStage.json (Jitter/Lottie source).
//
// Structure per 150-frame slot:
//   0..108  TRANSITION — prev slide exits up, curr slide enters from below
//   108..150 HOLD      — curr slide stationary
//
// Mask: centered rect, no corner radius.
//   FULL    = canvas size
//   INHALED = 860/1080 × 1700/1920 of canvas size, centered
//
// Image: cover-fit to mask rect, with subtle vertical Ken-Burns pan (±4% of mask height).
//
// Breath:
//   Pre-roll: 12 frames before slot start
//   Contract: 0→54 frames (easeInOut)
//   Expand:   54→150 frames (easeInOut)

const STAGGER    = 150  // frames per slot
const TRANS_F    = 108  // transition frames
const B_PREROLL  = 12   // breath starts this many frames before slot
const B_CONTRACT = 54   // frames to reach max contraction
const B_EXPAND   = 96   // frames to recover (54+96=150)

const INHALE_W   = 860 / 1080
const INHALE_H   = 1700 / 1920

// Pan offset as fraction of mask height (subtle Ken-Burns vertical shift)
const PAN_ENTRY  =  0.04  // entry start: image shifted down by 4% of mask height
const PAN_CENTER =  0.00  // hold: centered
const PAN_TOP    = -0.04  // exit end:   image shifted up by 4% of mask height

// Cubic ease-in-out — smooth at both start and end
function easeInOut(t)    { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2 }
function easeScroll(t)   { return easeInOut(t) }
function easeContract(t) { return easeInOut(t) }
function easeExpand(t)   { return easeInOut(t) }

function lerp(a, b, t)   { return a + (b - a) * t }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)) }

// Returns 0=FULL .. 1=INHALED based on position within a breath cycle
function breathValue(precomp_t) {
  if (precomp_t <= 0) return 0
  if (precomp_t < B_CONTRACT) {
    return easeContract(precomp_t / B_CONTRACT)
  }
  const et = clamp((precomp_t - B_CONTRACT) / B_EXPAND, 0, 1)
  return 1 - easeExpand(et)
}

// Draw one slide: clips to centered breathing mask rect, then cover-fits image inside
function drawSlide(ctx, img, W, H, offsetY, breath, panFrac) {
  if (!img) return
  ctx.save()
  ctx.translate(0, offsetY)

  // Centered mask rect
  const maskW = lerp(W, W * INHALE_W, breath)
  const maskH = lerp(H, H * INHALE_H, breath)
  const maskX = (W - maskW) / 2
  const maskY = (H - maskH) / 2
  ctx.beginPath()
  ctx.rect(maskX, maskY, maskW, maskH)
  ctx.clip()

  // Cover-fit image to mask rect, with subtle vertical pan
  const imgAr = img.naturalWidth / img.naturalHeight
  const boxAr = maskW / maskH
  let isx, isy, isw, ish
  if (imgAr > boxAr) {
    ish = img.naturalHeight; isw = ish * boxAr
    isx = (img.naturalWidth - isw) / 2; isy = 0
  } else {
    isw = img.naturalWidth; ish = isw / boxAr
    isx = 0; isy = (img.naturalHeight - ish) / 2
  }
  // Pan: shift drawY by panFrac * maskH
  const drawY = maskY + panFrac * maskH
  ctx.drawImage(img, isx, isy, isw, ish, maskX, drawY, maskW, maskH)

  ctx.restore()
}

function renderAt(canvas, imgEls, clock, bgColor) {
  const ctx = canvas.getContext('2d')
  const W   = canvas.width
  const H   = canvas.height
  const N   = imgEls.length

  ctx.fillStyle = bgColor || '#0e0c08'
  ctx.fillRect(0, 0, W, H)
  if (!N) return

  const slot     = Math.floor(clock)
  const t_frames = (clock - slot) * STAGGER   // 0..150 within slot
  const currIdx  = ((slot % N) + N) % N
  const prevIdx  = ((slot - 1 % N) + N) % N

  if (t_frames < TRANS_F) {
    // ── TRANSITION: prev exits up, curr enters from below ─────────────────────
    const tp     = t_frames / TRANS_F          // 0..1
    const easedP = easeScroll(tp)

    // Both entering and exiting use the same breath precomp_t formula:
    //   precomp_t = B_PREROLL + t_frames  (breath starts 12 frames before slot)
    const b_t = B_PREROLL + t_frames          // 12..120

    // Prev slide (exiting): heavy breath (→60%), pan center→upper
    const prevBreath = breathValue(b_t)
    const prevPanFrac = lerp(PAN_CENTER, PAN_TOP, easedP)
    drawSlide(ctx, imgEls[prevIdx], W, H, -H * easedP, prevBreath, prevPanFrac)

    // Curr slide (entering): light breath (→90%), pan lower→center
    const currBreath = breathValue(b_t)
    const currPanFrac = lerp(PAN_ENTRY, PAN_CENTER, easedP)
    drawSlide(ctx, imgEls[currIdx], W, H, H * (1 - easedP), currBreath, currPanFrac)

  } else {
    // ── HOLD: only curr visible, breath1 still expanding toward FULL ──────────
    const b_t    = B_PREROLL + t_frames        // 120..162
    const breath = breathValue(b_t)
    drawSlide(ctx, imgEls[currIdx], W, H, 0, breath, PAN_CENTER)
  }
}

// ─── Public factory ────────────────────────────────────────────────────────────

export function createMainStageRenderer(canvas, options = {}) {
  let { photos = [], bgColor = '#0e0c08', speed = 1.0 } = options

  let imgEls = []
  let clock  = TRANS_F / STAGGER  // start in hold phase (first photo already on screen)
  let paused = false
  let rafId  = null
  let lastTs = null

  function clockRate() { return speed }

  function tick(ts) {
    if (!paused) {
      if (lastTs !== null) clock += ((ts - lastTs) / 1000) * clockRate()
      lastTs = ts
      renderAt(canvas, imgEls, clock, bgColor)
    }
    rafId = requestAnimationFrame(tick)
  }

  function startLoop() {
    if (rafId !== null) return
    lastTs = null
    rafId  = requestAnimationFrame(tick)
  }

  function stop() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  }

  startLoop()

  return {
    setPhotos(els) { imgEls = els },
    setBgColor(c)  { bgColor = c },
    setSpeed(s)    { speed = s },

    pause()        { paused = true },
    resume()       { paused = false; lastTs = null },
    togglePause()  { paused ? this.resume() : this.pause() },
    isPaused()     { return paused },
    reset()        { clock = TRANS_F / STAGGER; lastTs = null },

    // Frame-perfect step for export
    stepFrame(fps, targetCanvas, bg) {
      clock += clockRate() / fps
      renderAt(targetCanvas || canvas, imgEls, clock, bg ?? bgColor)
    },

    start:     startLoop,
    stop,
    getCanvas() { return canvas },
  }
}
