import { Output, CanvasSource, BufferTarget, Mp4OutputFormat } from 'mediabunny'

/**
 * Export the current scene to an H.264 MP4.
 * Pass `shuffleRenderer` for the Shuffle preset (frame-perfect 2D canvas export).
 * Pass `scene` for all Three.js presets (real-time capture).
 */
export async function exportVideo({ scene, shuffleRenderer, fps, loopS, format, bgColor, onProgress }) {
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('VideoEncoder API not available. Use Chrome 94+, Edge 94+, or Firefox 130+.')
  }

  if (shuffleRenderer) {
    return exportShuffle({ shuffleRenderer, fps, loopS, format, bgColor, onProgress })
  }

  // ── Three.js path: real-time frame capture ──────────────────────────────────

  const canvas   = scene.getCanvas()
  const origSize = scene.getContainerSize()

  scene.setBgColor(bgColor)
  scene.resize(format.w, format.h)
  scene.pauseLoop()
  canvas.style.visibility = 'hidden'

  const target = new BufferTarget()
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  })

  const canvasSource = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: 24_000_000,
    bitrateMode: 'variable',
    latencyMode: 'quality',
  })

  output.addVideoTrack(canvasSource)
  await output.start()

  const totalFrames = Math.round(loopS * fps)
  const startWall   = performance.now()

  try {
    for (let p = 0; p < totalFrames; p++) {
      // Wait until wall-clock matches this frame's target time
      const targetMs = (p / fps) * 1000
      await new Promise(resolve => {
        function check() {
          if (performance.now() - startWall >= targetMs) resolve()
          else requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      })

      scene.renderFrame()
      await canvasSource.add(p / fps, 1 / fps)
      onProgress?.((p + 1) / totalFrames)
    }

    canvasSource.close()
    await output.finalize()

    const blob = new Blob([target.buffer], { type: 'video/mp4' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `myscape-${format.w}x${format.h}.mp4`
    a.click()
    URL.revokeObjectURL(a.href)

  } finally {
    scene.resize(origSize.width, origSize.height)
    scene.restoreBgColor()
    scene.resumeLoop()
    canvas.style.visibility = ''
  }
}

// ── Shuffle path: frame-perfect 2D canvas export ─────────────────────────────

async function exportShuffle({ shuffleRenderer, fps, loopS, format, bgColor, onProgress }) {
  // Pause + stop the live animation loop
  shuffleRenderer.pause()
  shuffleRenderer.stop()
  shuffleRenderer.reset()

  // Off-screen canvas at export resolution (doesn't touch the live canvas)
  const exportCanvas    = document.createElement('canvas')
  exportCanvas.width    = format.w
  exportCanvas.height   = format.h

  const target = new BufferTarget()
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  })

  const canvasSource = new CanvasSource(exportCanvas, {
    codec: 'avc',
    bitrate: 24_000_000,
    bitrateMode: 'variable',
    latencyMode: 'quality',
  })

  output.addVideoTrack(canvasSource)
  await output.start()

  const totalFrames = Math.round(loopS * fps)

  try {
    for (let p = 0; p < totalFrames; p++) {
      // Advance animation clock by exactly 1 frame and render to exportCanvas
      shuffleRenderer.stepFrame(fps, exportCanvas, bgColor)
      await canvasSource.add(p / fps, 1 / fps)
      onProgress?.((p + 1) / totalFrames)
    }

    canvasSource.close()
    await output.finalize()

    const blob = new Blob([target.buffer], { type: 'video/mp4' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `myscape-shuffle-${format.w}x${format.h}.mp4`
    a.click()
    URL.revokeObjectURL(a.href)

  } finally {
    // Restart the live animation
    shuffleRenderer.start()
    shuffleRenderer.resume()
  }
}
