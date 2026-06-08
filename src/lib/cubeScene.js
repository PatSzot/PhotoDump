// ─── Cube scene: interactive 3D cube with photo textures ──────────────────────
// Three.js BoxGeometry with 6 faces, one photo per face.
// GSAP drives auto-spin. OrbitControls handles drag interaction.
// GSAP pauses while user is dragging; resumes on release.

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'

const CUBE_SIZE = 1.6

// ── Texture helpers ────────────────────────────────────────────────────────────

async function loadCubeFaceTex(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX   = 1024
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight, 1))
      const w     = Math.round(img.naturalWidth  * scale)
      const h     = Math.round(img.naturalHeight * scale)
      // Square crop (cover) so each face looks good
      const size  = Math.min(w, h)
      const canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')
      const sx = (w - size) / 2
      const sy = (h - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
      resolve(new THREE.CanvasTexture(canvas))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function makePlaceholderTex(index) {
  const size   = 512
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx    = canvas.getContext('2d')
  const colors = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#222831', '#393e46']
  ctx.fillStyle = colors[index % colors.length]
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = `bold ${Math.round(size * 0.45)}px "IBM Plex Mono", monospace`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(String(index + 1), size / 2, size / 2)
  return new THREE.CanvasTexture(canvas)
}

async function buildMaterials(photos) {
  const textures = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      if (!photos.length) return Promise.resolve(null)
      return loadCubeFaceTex(photos[i % photos.length].url)
    })
  )
  return textures.map((tex, i) =>
    new THREE.MeshBasicMaterial({ map: tex ?? makePlaceholderTex(i) })
  )
}

// ── Main init ──────────────────────────────────────────────────────────────────

export async function initCubeScene(container, photos = [], loopDuration = 8) {
  // ── Renderer ────────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const cw = container.clientWidth  || 800
  const ch = container.clientHeight || 800
  renderer.setSize(cw, ch)
  container.appendChild(renderer.domElement)

  // ── Scene + camera ──────────────────────────────────────────────────────────
  const scene  = new THREE.Scene()
  scene.background = new THREE.Color('#0d0d0d')

  const camera = new THREE.PerspectiveCamera(45, cw / ch, 0.1, 100)
  camera.position.set(0, 0.5, 3.8)

  scene.add(new THREE.AmbientLight(0xffffff, 1))

  // ── Cube ────────────────────────────────────────────────────────────────────
  const geometry  = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
  let   materials = await buildMaterials(photos)
  const cube      = new THREE.Mesh(geometry, materials)
  cube.rotation.x = 0.25   // slight tilt on mount for visual interest
  scene.add(cube)

  // ── Orbit controls ──────────────────────────────────────────────────────────
  const orbit = new OrbitControls(camera, renderer.domElement)
  orbit.enableDamping  = true
  orbit.dampingFactor  = 0.07
  orbit.enableZoom     = false
  orbit.enablePan      = false
  orbit.rotateSpeed    = 0.8

  // ── GSAP spin ───────────────────────────────────────────────────────────────
  let currentLoopDuration = loopDuration
  let spinTween = null
  let isDragging = false

  function startSpin() {
    spinTween?.kill()
    spinTween = gsap.to(cube.rotation, {
      y: `+=${Math.PI * 2}`,
      duration: currentLoopDuration,
      ease: 'none',
      repeat: -1,
    })
  }

  orbit.addEventListener('start', () => {
    isDragging = true
    spinTween?.pause()
  })
  orbit.addEventListener('end', () => {
    isDragging = false
    spinTween?.resume()
  })

  startSpin()

  // ── RAF loop ─────────────────────────────────────────────────────────────────
  let rafId  = null
  let paused = false

  function tick() {
    rafId = requestAnimationFrame(tick)
    orbit.update()
    renderer.render(scene, camera)
  }
  rafId = requestAnimationFrame(tick)

  // ── Resize observer ──────────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
  ro.observe(container)

  // ── Stored bg color for restore ─────────────────────────────────────────────
  let savedBg = '#0d0d0d'

  // ── Public interface ─────────────────────────────────────────────────────────
  return {
    pauseLoop() {
      if (paused) return
      paused = true
      cancelAnimationFrame(rafId)
      spinTween?.pause()
    },
    resumeLoop() {
      if (!paused) return
      paused = false
      if (!isDragging) spinTween?.resume()
      rafId = requestAnimationFrame(tick)
    },
    togglePause() {
      if (paused) this.resumeLoop(); else this.pauseLoop()
    },
    reset() {
      cube.rotation.set(0.25, 0, 0)
    },
    stepFrame(fps) {
      cube.rotation.y += (Math.PI * 2) / (currentLoopDuration * fps)
      renderer.render(scene, camera)
    },
    setBgColor(hex) {
      savedBg = hex
      scene.background = new THREE.Color(hex)
    },
    restoreBgColor() {
      scene.background = new THREE.Color(savedBg)
    },
    getCanvas()         { return renderer.domElement },
    getContainerSize()  { return { width: container.clientWidth, height: container.clientHeight } },
    resize(w, h) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    },
    setLoopDuration(s) {
      currentLoopDuration = s
      startSpin()
    },
    async setPhotos(newPhotos) {
      const oldMats = materials
      materials = await buildMaterials(newPhotos)
      cube.material = materials
      oldMats.forEach(m => { m.map?.dispose(); m.dispose() })
    },
    cleanup() {
      cancelAnimationFrame(rafId)
      spinTween?.kill()
      ro.disconnect()
      orbit.dispose()
      geometry.dispose()
      materials.forEach(m => { m.map?.dispose(); m.dispose() })
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    },
  }
}
