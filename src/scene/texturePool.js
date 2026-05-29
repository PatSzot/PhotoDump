import * as THREE from 'three'

const SIZE = 512

function makeCanvas() {
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  return c
}

function card(ctx, inner) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.strokeStyle = '#d8d8d8'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2)
  inner(ctx, SIZE)
}

function staticTex(drawFn) {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  drawFn(ctx, SIZE)
  return { tex: new THREE.CanvasTexture(canvas), animated: false }
}

function animatedTex(drawFn) {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)
  let lastFrame = -1
  return {
    tex,
    animated: true,
    update(t) {
      drawFn(ctx, SIZE, t, lastFrame)
      lastFrame = Math.floor(t * 30)
      tex.needsUpdate = true
    },
  }
}

// ─── Static textures ──────────────────────────────────────────────────────────

function texCircle() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(s * 0.5, s * 0.5, s * 0.34, 0, Math.PI * 2)
      ctx.fill()
    })
  )
}

function texGrid() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1.5
      const n = 8, pad = s * 0.12
      for (let i = 0; i <= n; i++) {
        const p = pad + (s - pad * 2) * (i / n)
        ctx.beginPath(); ctx.moveTo(p, pad); ctx.lineTo(p, s - pad); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(pad, p); ctx.lineTo(s - pad, p); ctx.stroke()
      }
    })
  )
}

function texDiagonal() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.moveTo(s * 0.08, s * 0.08)
      ctx.lineTo(s * 0.92, s * 0.08)
      ctx.lineTo(s * 0.08, s * 0.92)
      ctx.closePath()
      ctx.fill()
    })
  )
}

function texRings() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 3
      for (let r = s * 0.09; r < s * 0.44; r += s * 0.075) {
        ctx.beginPath()
        ctx.arc(s * 0.5, s * 0.5, r, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
  )
}

function texPlus() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.fillStyle = '#000'
      const t = s * 0.14, p = s * 0.13
      ctx.fillRect(s * 0.5 - t / 2, p, t, s - p * 2)
      ctx.fillRect(p, s * 0.5 - t / 2, s - p * 2, t)
    })
  )
}

function texStripes() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.fillStyle = '#000'
      const n = 7, pad = s * 0.1, gap = (s - pad * 2) / n
      for (let i = 0; i < n; i++) {
        ctx.fillRect(pad, pad + i * gap, s - pad * 2, gap * 0.45)
      }
    })
  )
}

function texLetter() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.fillStyle = '#000'
      ctx.font = `700 ${s * 0.68}px Georgia, serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('i', s * 0.5, s * 0.54)
    })
  )
}

function texDots() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      const n = 7, pad = s * 0.12
      const step = (s - pad * 2) / (n - 1)
      ctx.fillStyle = '#000'
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          ctx.beginPath()
          ctx.arc(pad + x * step, pad + y * step, s * 0.028, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })
  )
}

function texOval() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = s * 0.075
      ctx.beginPath()
      ctx.ellipse(s * 0.5, s * 0.5, s * 0.28, s * 0.36, 0, 0, Math.PI * 2)
      ctx.stroke()
    })
  )
}

function texComposition() {
  return staticTex((ctx, s) =>
    card(ctx, (ctx, s) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(s * 0.1, s * 0.1, s * 0.48, s * 0.48)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(s * 0.15, s * 0.15, s * 0.38, s * 0.38)
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(s * 0.67, s * 0.67, s * 0.2, 0, Math.PI * 2)
      ctx.fill()
    })
  )
}

// ─── Animated textures ────────────────────────────────────────────────────────

function texRotatingSpokes() {
  return animatedTex((ctx, s, t) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, s, s)
    ctx.strokeStyle = '#d8d8d8'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, s - 2, s - 2)

    ctx.save()
    ctx.translate(s * 0.5, s * 0.5)
    ctx.rotate(t * 0.6)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2.5
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6)
      ctx.beginPath()
      ctx.moveTo(0, s * 0.1)
      ctx.lineTo(0, s * 0.4)
      ctx.stroke()
    }
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.04, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

function texPulsingRing() {
  return animatedTex((ctx, s, t) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, s, s)
    ctx.strokeStyle = '#d8d8d8'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, s - 2, s - 2)

    const pulse = Math.sin(t * 2.5) * 0.08
    ctx.strokeStyle = '#000'
    ctx.lineWidth = s * 0.055
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.5, s * (0.29 + pulse), 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = s * 0.025
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.5, s * (0.13 + pulse * 0.5), 0, Math.PI * 2)
    ctx.stroke()
  })
}

function texScanner() {
  return animatedTex((ctx, s, t) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, s, s)
    ctx.strokeStyle = '#d8d8d8'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, s - 2, s - 2)

    // Faint horizontal grid
    ctx.strokeStyle = '#efefef'
    ctx.lineWidth = 1
    for (let y = s * 0.1; y < s * 0.9; y += s * 0.09) {
      ctx.beginPath(); ctx.moveTo(s * 0.08, y); ctx.lineTo(s * 0.92, y); ctx.stroke()
    }

    // Scan line
    const scanY = ((t * 0.4) % 1) * s * 0.8 + s * 0.1
    const grad = ctx.createLinearGradient(0, scanY - s * 0.06, 0, scanY + s * 0.02)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.18)')
    ctx.fillStyle = grad
    ctx.fillRect(s * 0.08, scanY - s * 0.06, s * 0.84, s * 0.08)
    ctx.fillStyle = '#000'
    ctx.fillRect(s * 0.08, scanY, s * 0.84, 2)
  })
}

function texExpandingSquares() {
  return animatedTex((ctx, s, t) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, s, s)
    ctx.strokeStyle = '#d8d8d8'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, s - 2, s - 2)

    const phase = (t * 0.25) % 1
    for (let i = 0; i < 5; i++) {
      const p = (phase + i * 0.2) % 1
      const sz = p * s * 0.88
      const alpha = 1 - p
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.9})`
      ctx.lineWidth = 2
      ctx.strokeRect(s * 0.5 - sz / 2, s * 0.5 - sz / 2, sz, sz)
    }
  })
}

function texNoise() {
  let lastFrame = -1
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)
  // Use smaller internal resolution for noise
  const N = 64
  const noiseCanvas = document.createElement('canvas')
  noiseCanvas.width = N
  noiseCanvas.height = N
  const nCtx = noiseCanvas.getContext('2d')

  return {
    tex,
    animated: true,
    update(t) {
      const frame = Math.floor(t * 18) // ~18fps update
      if (frame === lastFrame) return
      lastFrame = frame

      const imageData = nCtx.createImageData(N, N)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() > 0.5 ? 220 : 20
        d[i] = d[i + 1] = d[i + 2] = v
        d[i + 3] = 255
      }
      nCtx.putImageData(imageData, 0, 0)

      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, SIZE, SIZE)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(noiseCanvas, SIZE * 0.08, SIZE * 0.08, SIZE * 0.84, SIZE * 0.84)
      ctx.strokeStyle = '#d8d8d8'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2)

      tex.needsUpdate = true
    },
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function createTexturePool() {
  return [
    texCircle(),
    texGrid(),
    texDiagonal(),
    texRings(),
    texPlus(),
    texStripes(),
    texLetter(),
    texDots(),
    texOval(),
    texComposition(),
    texRotatingSpokes(),
    texPulsingRing(),
    texScanner(),
    texExpandingSquares(),
    texNoise(),
  ]
}
