// ─── Spiral 2D canvas renderer ────────────────────────────────────────────────
// Inspired by Spiral-1-1.json (Jitter/Lottie source).
//
// Concept: concentric spiral of images viewed face-on, all sharing the same
// canvas-center pivot. The entire formation rotates CCW: −720° over 1296 frames
// (21.6 s at 60 fps). Each image grows to fill the canvas in sequence, then
// snaps invisible for a hidden window before reappearing small.
//
// Source: 19 layers, 1350×1350 canvas, 60 fps, 1296 frames.
// Scale range: 784→136 (% of 820 peak) outer→inner.
// All layers at same orbital radius; scale difference creates depth illusion.

const TOTAL_F       = 1296   // 21.6 s at 60 fps
const GROUP_ROT_DEG = -720   // total group rotation over TOTAL_F (2 full CCW turns)
const SCALE_MAX     = 820    // peak denominator (= 100% canvas fill)
const SCALE_MIN_0   = 784    // outermost layer start scale (numerator)
const SCALE_MIN_N   = 136    // innermost layer start scale (numerator)

function lerp(a, b, t) { return a + (b - a) * t }

// ─── Build per-layer params from N photos ────────────────────────────────────

function buildLayers(N) {
  const stagger    = TOTAL_F / N
  const hiddenDur  = Math.min(stagger * 10, TOTAL_F - stagger)
  const scaleStep  = N > 1 ? (SCALE_MIN_0 - SCALE_MIN_N) / (N - 1) : 0
  const angStep    = (360 * 2) / N          // 2 full rotations of angular spread
  const outerCount = Math.ceil(N / 2)

  return Array.from({ length: N }, (_, i) => ({
    i,
    angleOffset: -(angStep * i),                           // degrees, fixed per layer
    initScale:   (SCALE_MIN_0 - i * scaleStep) / SCALE_MAX, // normalized 0→1
    peakFrame:   (i + 1) * stagger,
    hiddenEnd:   (i + 1) * stagger + hiddenDur,
    initOpacity: i < outerCount
      ? 1.0
      : Math.max(0.1, 1.0 - (i - outerCount + 1) / Math.max(N - outerCount, 1)),
  }))
}

// ─── Layer state at frame fMod (0..TOTAL_F) ──────────────────────────────────

function getLayerState(layer, fMod) {
  const { initScale, peakFrame, hiddenEnd, initOpacity } = layer

  if (fMod < peakFrame) {
    // Growing: initScale → 1.0 (peakScale)
    const t = fMod / peakFrame
    return { scale: lerp(initScale, 1.0, t), opacity: lerp(initOpacity, 1.0, t) }
  }

  const hiddenEndClamped = Math.min(hiddenEnd, TOTAL_F)
  if (fMod < hiddenEndClamped) {
    // Hidden: snap back to initScale, fully transparent
    return { scale: initScale, opacity: 0 }
  }

  // Reappear: grow again from initScale toward peakScale
  const phaseLen = TOTAL_F - hiddenEnd
  if (phaseLen <= 0) return { scale: initScale, opacity: initOpacity }
  const t = (fMod - hiddenEnd) / phaseLen
  return { scale: lerp(initScale, 1.0, t), opacity: lerp(initOpacity, 1.0, t) }
}

// ─── Draw one image (cover-fit into a square centered on cx, cy) ─────────────

function drawImageCover(ctx, photo, cx, cy, size, opacity, angle) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity))
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  const half = size / 2

  if (photo) {
    const iw = photo.naturalWidth
    const ih = photo.naturalHeight
    let sx, sy, sw, sh
    if (iw >= ih) {
      // landscape/square: crop sides to make square
      sw = ih; sh = ih
      sx = (iw - sw) / 2; sy = 0
    } else {
      // portrait: crop top/bottom
      sw = iw; sh = iw
      sx = 0; sy = (ih - sh) / 2
    }
    ctx.drawImage(photo, sx, sy, sw, sh, -half, -half, size, size)
  } else {
    // Placeholder tile
    ctx.fillStyle = '#111110'
    ctx.fillRect(-half, -half, size, size)
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = `500 ${Math.round(size * 0.25)}px "IBM Plex Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('M', 0, 0)
  }

  ctx.restore()
}

// ─── Render to a canvas element ──────────────────────────────────────────────

function renderTo(target, photos, frame, bgColor, cachedLayers) {
  const ctx = target.getContext('2d')
  const W = target.width
  const H = target.height
  const cx = W / 2
  const cy = H / 2
  const minDim = Math.min(W, H)

  ctx.fillStyle = bgColor || '#000000'
  ctx.fillRect(0, 0, W, H)

  const fMod = ((frame % TOTAL_F) + TOTAL_F) % TOTAL_F

  // Group rotation: linear −720° over TOTAL_F frames
  const groupAngleRad = (GROUP_ROT_DEG * Math.PI / 180) * (fMod / TOTAL_F)

  // Draw back-to-front: innermost (smallest initScale) first so outermost is on top
  const sorted = [...cachedLayers].sort((a, b) => a.initScale - b.initScale)

  for (const layer of sorted) {
    const { scale, opacity } = getLayerState(layer, fMod)
    if (opacity <= 0.005) continue

    const photo = photos.length > 0 ? photos[layer.i % photos.length] : null
    const totalAngle = (layer.angleOffset * Math.PI / 180) + groupAngleRad
    const drawSize = minDim * scale

    drawImageCover(ctx, photo, cx, cy, drawSize, opacity, totalAngle)
  }
}

// ─── Public factory ───────────────────────────────────────────────────────────

export function createSpiralRenderer(canvas, options = {}) {
  let bgColor = options.bgColor ?? '#0d0d0d'
  let speed   = options.speed   ?? 1.0
  let photos  = options.photos  ?? []

  let frame  = 0
  let paused = false
  let rafId  = null
  let lastTs = null

  // Layer cache — rebuilt only when N changes
  let cachedN      = -1
  let cachedLayers = []

  function getLayers() {
    const N = photos.length > 0 ? photos.length : 6
    if (N !== cachedN) {
      cachedLayers = buildLayers(N)
      cachedN = N
    }
    return cachedLayers
  }

  function render(target, bg) {
    renderTo(target || canvas, photos, frame, bg ?? bgColor, getLayers())
  }

  function tick(ts) {
    if (!paused) {
      if (lastTs !== null) {
        const dt = (ts - lastTs) / 1000
        frame = (frame + dt * 60 * speed) % TOTAL_F
      }
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
    setPhotos(p)   { photos = p || []; cachedN = -1 },
    setBgColor(c)  { bgColor = c },
    setSpeed(s)    { speed = s },

    pause()        { paused = true },
    resume()       { paused = false; lastTs = null },
    togglePause()  { paused ? this.resume() : this.pause() },
    isPaused()     { return paused },
    reset()        { frame = 0; lastTs = null },

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
