// ─── Spiral 2D canvas renderer ────────────────────────────────────────────────
// Replicates Spiral-1-1.json (Jitter/Lottie source):
//   1350×1350 ref canvas · 60 fps · 1296 frames · 19 layers
//
// Key facts verified from raw JSON:
//   • ALL cards orbit at the SAME fixed radius from canvas center (~8% of canvas)
//   • Card size = base × (scalePercent / 100) — not a per-layer tile size
//   • Each card has a FIXED rotation offset so it tilts outward as it orbits
//   • Peak behaviour: scale 820% → snap to 100% instantly, opacity → 0
//   • After hiddenDuration, card reappears and grows back toward peak

// ── Constants verified from raw JSON ─────────────────────────────────────────

const TOTAL_F        = 1296          // 21.6 s at 60 fps
const GROUP_ROT_DEG  = -720          // total group rotation (2 full CCW rotations)
const SCALE_PEAK     = 820           // peak scale % — card fills + overflows canvas
const SCALE_RESET    = 100           // scale immediately after peak snap
const HIDDEN_RATIO   = 10.0          // hiddenFrames = stagger × 10  (648/64.8)
const SCALE_MAX_INIT = 784           // initScalePercent for outermost layer (i=0)
const SCALE_MIN_INIT = 136           // initScalePercent for innermost layer (i=18)
const ROT_START      = -684          // rotOffset of layer 0 (degrees)
const ANG_STEP       = 36            // rotOffset increment per layer (degrees)

// Derived from child anchor [427,445] and position [180,180] with parentScale=0.30:
//   radius = sqrt((180-427)²+(180-445)²) × 0.30 / 1350 ≈ 108.7 / 1350
const ORBIT_R_NORM   = 108.7 / 1350   // ≈ 0.0806  — fixed orbit radius for ALL cards
// Base card size at 100% scale: 821px precomp × 30% parent / 1350 reference
const BASE_CARD_NORM = (821 * 0.30) / 1350  // ≈ 0.1824

// ── buildLayers(N) ───────────────────────────────────────────────────────────

function buildLayers(N) {
  if (N === 0) N = 8
  const stagger    = TOTAL_F / N
  const hiddenF    = Math.min(stagger * HIDDEN_RATIO, TOTAL_F - stagger)
  const scaleStep  = N > 1 ? (SCALE_MAX_INIT - SCALE_MIN_INIT) / (N - 1) : 0
  const outerCount = Math.ceil(N / 2)
  const dimCount   = N - outerCount

  return Array.from({ length: N }, (_, i) => {
    const initScalePercent = SCALE_MAX_INIT - i * scaleStep
    const peakFrame        = (i + 1) * stagger
    const hiddenEnd        = peakFrame + hiddenF

    // Fixed rotation offset in group space (same 36° step as source)
    const rotOffsetDeg = ROT_START + i * ANG_STEP

    // Opacity: outer half at 100%, inner half graduated 90% → 10%
    let initOpacity
    if (i < outerCount) {
      initOpacity = 1.0
    } else {
      const dimIndex = i - outerCount
      initOpacity = Math.max(0.1, 1.0 - (dimIndex + 1) * (0.9 / Math.max(dimCount, 1)))
    }

    return { i, rotOffsetDeg, initScalePercent, peakFrame, hiddenEnd, initOpacity }
  })
}

// ── getLayerState(layer, fMod) ───────────────────────────────────────────────
// Returns { scalePercent, opacity }  — opacity is 0..1

function getLayerState(layer, fMod) {
  const { initScalePercent, peakFrame, hiddenEnd, initOpacity } = layer

  if (fMod < peakFrame) {
    // GROWING: initScalePercent → SCALE_PEAK, opacity initOpacity → 1
    const t = peakFrame > 0 ? fMod / peakFrame : 0
    return {
      scalePercent: initScalePercent + (SCALE_PEAK - initScalePercent) * t,
      opacity:      initOpacity + (1.0 - initOpacity) * t,
    }
  }

  if (fMod < hiddenEnd) {
    // HIDDEN: instant snap to SCALE_RESET, opacity = 0
    return { scalePercent: SCALE_RESET, opacity: 0 }
  }

  // REAPPEAR: grow from initScalePercent → SCALE_PEAK for rest of cycle
  const phaseLen = TOTAL_F - hiddenEnd
  const t = phaseLen > 0 ? (fMod - hiddenEnd) / phaseLen : 0
  return {
    scalePercent: initScalePercent + (SCALE_PEAK - initScalePercent) * t,
    opacity:      initOpacity + (1.0 - initOpacity) * t,
  }
}

// ── drawCard ─────────────────────────────────────────────────────────────────

function drawCard(ctx, photo, cx, cy, size, opacity, tiltAngle) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity))
  ctx.translate(cx, cy)
  ctx.rotate(tiltAngle)   // card tilts to match its orbital angle — always faces outward

  const half = size / 2
  const r    = size * 0.06  // rounded corners

  if (photo) {
    const iw = photo.naturalWidth
    const ih = photo.naturalHeight
    // Center-crop to square
    let sx, sy, sw, sh
    if (iw > ih) { sw = ih; sh = ih; sx = (iw - ih) / 2; sy = 0 }
    else         { sw = iw; sh = iw; sx = 0; sy = (ih - iw) / 2 }

    ctx.beginPath()
    ctx.roundRect(-half, -half, size, size, r)
    ctx.clip()
    ctx.drawImage(photo, sx, sy, sw, sh, -half, -half, size, size)
  } else {
    ctx.beginPath()
    ctx.roundRect(-half, -half, size, size, r)
    ctx.fillStyle = '#1d1a12'
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.font = `500 ${Math.max(8, Math.round(size * 0.3))}px "IBM Plex Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('M', 0, 0)
  }

  ctx.restore()
}

// ── renderTo ─────────────────────────────────────────────────────────────────

function renderTo(target, photos, frame, bgColor, layers) {
  const ctx  = target.getContext('2d')
  const W    = target.width
  const H    = target.height
  const fMod = ((frame % TOTAL_F) + TOTAL_F) % TOTAL_F

  ctx.fillStyle = bgColor || '#000'
  ctx.fillRect(0, 0, W, H)

  const minDim = Math.min(W, H)

  // Group rotation: linear −720° over TOTAL_F
  const groupAngleRad = (GROUP_ROT_DEG * Math.PI / 180) * (fMod / TOTAL_F)

  // All cards share the same fixed orbit radius
  const orbitRadius = minDim * ORBIT_R_NORM
  // Base card size at 100% scale
  const baseCardSize = minDim * BASE_CARD_NORM

  // Draw order: smallest initScalePercent first (inner cards behind outer cards)
  const sorted = [...layers].sort((a, b) => a.initScalePercent - b.initScalePercent)

  for (const layer of sorted) {
    const { scalePercent, opacity } = getLayerState(layer, fMod)
    if (opacity <= 0.005) continue

    const photo = photos.length > 0 ? photos[layer.i % photos.length] : null

    // Card's total angle = fixed rotation offset + group rotation
    const totalAngle = layer.rotOffsetDeg * Math.PI / 180 + groupAngleRad

    // Card center — ALL cards orbit at the same radius
    const cardX = W / 2 + Math.cos(totalAngle) * orbitRadius
    const cardY = H / 2 + Math.sin(totalAngle) * orbitRadius

    // Card size in pixels: base × (scalePercent / 100)
    // At 820%: fills and overflows canvas. At 100%: small thumbnail.
    const cardSize = baseCardSize * (scalePercent / 100)

    // Blur inner (dim) cards proportional to how small their initScale is
    const blurPx = Math.max(0, (1.0 - layer.initScalePercent / SCALE_MAX_INIT) * 8)
    if (blurPx > 0.5) ctx.filter = `blur(${blurPx.toFixed(1)}px)`

    drawCard(ctx, photo, cardX, cardY, cardSize, opacity, totalAngle)

    if (blurPx > 0.5) ctx.filter = 'none'
  }
}

// ── Public factory ────────────────────────────────────────────────────────────

export function createSpiralRenderer(canvas, options = {}) {
  let bgColor = options.bgColor ?? '#0e0c08'
  let speed   = options.speed   ?? 1.0
  let photos  = options.photos  ?? []

  let frame  = 0
  let paused = false
  let rafId  = null
  let lastTs = null

  // Layer cache — rebuilt only when photo count changes
  let cachedN      = -1
  let cachedLayers = []

  function getLayers() {
    const N = photos.length > 0 ? photos.length : 8
    if (N !== cachedN) { cachedLayers = buildLayers(N); cachedN = N }
    return cachedLayers
  }

  function render(target, bg) {
    renderTo(target || canvas, photos, frame, bg ?? bgColor, getLayers())
  }

  function tick(ts) {
    if (!paused) {
      if (lastTs !== null) frame = (frame + (ts - lastTs) / 1000 * 60 * speed) % TOTAL_F
      lastTs = ts
      render(canvas, bgColor)
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
    setPhotos(p)  { photos = p || []; cachedN = -1 },
    setBgColor(c) { bgColor = c },
    setSpeed(s)   { speed = s },

    pause()       { paused = true },
    resume()      { paused = false; lastTs = null },
    togglePause() { paused ? this.resume() : this.pause() },
    isPaused()    { return paused },
    reset()       { frame = 0; lastTs = null },

    // Frame-perfect step for export
    stepFrame(fps, targetCanvas, bg) {
      frame = (frame + 60 * speed / fps) % TOTAL_F
      render(targetCanvas || canvas, bg ?? bgColor)
    },

    start:     startLoop,
    stop,
    getCanvas() { return canvas },
  }
}
