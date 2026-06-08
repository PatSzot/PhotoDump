// ─── Dice scene: interactive 3D polyhedron with photo textures ────────────────
// Supports Platonic solids: 4 / 6 / 8 / 12 / 20 faces.
// Any requested face count snaps to the nearest valid Platonic solid.
// setFaces(n) rebuilds geometry + materials on demand.
//
// Face→geometry map:
//   4  → TetrahedronGeometry  (4 equilateral triangles)
//   6  → BoxGeometry          (6 squares)
//   8  → OctahedronGeometry   (8 equilateral triangles)
//   12 → DodecahedronGeometry (12 regular pentagons, 3 triangles each)
//   20 → IcosahedronGeometry  (20 equilateral triangles)

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'

const DICE_SIZE   = 1.6
const TAU         = Math.PI * 2
const VALID_FACES = [4, 6, 8, 12, 20]

function snapFaces(n) {
  return VALID_FACES.reduce((prev, curr) =>
    Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev
  )
}

// ── Per-face UV setup ──────────────────────────────────────────────────────────
// Overrides spherical UVs so each face shows the full photo texture.
// triangular faces → equilateral triangle UV
// pentagonal faces → pentagon UV (fan triangulation from vertex 0)

function setFaceUVs(geo, nFaces, triPerFace) {
  const uvAttr = geo.getAttribute('uv')
  if (!uvAttr) return

  for (let f = 0; f < nFaces; f++) {
    const base = f * triPerFace * 3

    if (triPerFace === 1) {
      // Full-face triangle UV
      uvAttr.setXY(base,     0.5,  0.95)
      uvAttr.setXY(base + 1, 0.04, 0.05)
      uvAttr.setXY(base + 2, 0.96, 0.05)
    } else {
      // Pentagon UV: 5 vertices equally spaced on a circle, fan from v0
      // Three.js DodecahedronGeometry triangulates each pentagon as:
      //   T0: (v0,v1,v2)  T1: (v0,v2,v3)  T2: (v0,v3,v4)
      const pv = k => [
        0.5 + 0.48 * Math.cos(k * TAU / 5 - TAU / 4),
        0.5 + 0.48 * Math.sin(k * TAU / 5 - TAU / 4),
      ]
      uvAttr.setXY(base,     ...pv(0)); uvAttr.setXY(base + 1, ...pv(1)); uvAttr.setXY(base + 2, ...pv(2))
      uvAttr.setXY(base + 3, ...pv(0)); uvAttr.setXY(base + 4, ...pv(2)); uvAttr.setXY(base + 5, ...pv(3))
      uvAttr.setXY(base + 6, ...pv(0)); uvAttr.setXY(base + 7, ...pv(3)); uvAttr.setXY(base + 8, ...pv(4))
    }
  }
  uvAttr.needsUpdate = true
}

// ── Geometry builder ───────────────────────────────────────────────────────────

function buildDiceGeometry(rawFaces) {
  const n = snapFaces(rawFaces)

  // BoxGeometry already has correct per-face UVs and material groups
  if (n === 6) {
    return { geo: new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE), nFaces: 6 }
  }

  let geo, triPerFace
  switch (n) {
    case 4:  geo = new THREE.TetrahedronGeometry(DICE_SIZE * 0.95); triPerFace = 1; break
    case 8:  geo = new THREE.OctahedronGeometry(DICE_SIZE * 0.90);  triPerFace = 1; break
    case 12: geo = new THREE.DodecahedronGeometry(DICE_SIZE * 0.85); triPerFace = 3; break
    case 20: geo = new THREE.IcosahedronGeometry(DICE_SIZE * 0.90);  triPerFace = 1; break
  }

  // Assign one material group per polyhedron face
  geo.clearGroups()
  const vertsPerFace = triPerFace * 3
  for (let i = 0; i < n; i++) geo.addGroup(i * vertsPerFace, vertsPerFace, i)

  // Override UVs for clean photo rendering on each face
  setFaceUVs(geo, n, triPerFace)

  return { geo, nFaces: n }
}

// ── Texture helpers ────────────────────────────────────────────────────────────

async function loadFaceTex(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX   = 1024
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight, 1))
      const w     = Math.round(img.naturalWidth  * scale)
      const h     = Math.round(img.naturalHeight * scale)
      const size  = Math.min(w, h)
      const cv    = document.createElement('canvas')
      cv.width = size; cv.height = size
      cv.getContext('2d').drawImage(img, (w - size) / 2, (h - size) / 2, size, size, 0, 0, size, size)
      resolve(new THREE.CanvasTexture(cv))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function makePlaceholderTex(index) {
  const size   = 512
  const colors = [
    '#1a1208','#241a09','#2d2212','#1e1a0c','#302817','#261e10',
    '#1a1812','#231f14','#2a2315','#1f1b0e','#2e2618','#221d11',
    '#19160a','#272210','#1d190b','#2c240d','#211d0f','#261f0c',
    '#1b1609','#23200e',
  ]
  const cv  = document.createElement('canvas')
  cv.width  = size; cv.height = size
  const ctx = cv.getContext('2d')
  ctx.fillStyle = colors[index % colors.length]
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = `bold ${Math.round(size * 0.42)}px "IBM Plex Mono", monospace`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(String(index + 1), size / 2, size / 2)
  return new THREE.CanvasTexture(cv)
}

async function buildMaterials(photos, nFaces) {
  const textures = await Promise.all(
    Array.from({ length: nFaces }, (_, i) =>
      photos.length ? loadFaceTex(photos[i % photos.length].url) : Promise.resolve(null)
    )
  )
  return textures.map((tex, i) =>
    new THREE.MeshBasicMaterial({ map: tex ?? makePlaceholderTex(i) })
  )
}

// ── Main init ──────────────────────────────────────────────────────────────────

export async function initCubeScene(container, photos = [], loopDuration = 8, initialFaces = 6) {
  // ── Renderer ────────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const cw = container.clientWidth  || 800
  const ch = container.clientHeight || 800
  renderer.setSize(cw, ch)
  container.appendChild(renderer.domElement)

  // ── Scene + camera ──────────────────────────────────────────────────────────
  const scene  = new THREE.Scene()
  scene.background = new THREE.Color('#0e0c08')
  const camera = new THREE.PerspectiveCamera(45, cw / ch, 0.1, 100)
  camera.position.set(0, 0.5, 3.8)
  scene.add(new THREE.AmbientLight(0xffffff, 1))

  // ── Initial geometry + dice mesh ────────────────────────────────────────────
  let currentFaceCount = snapFaces(initialFaces)
  let currentPhotos    = photos
  let { geo, nFaces }  = buildDiceGeometry(currentFaceCount)
  let materials        = await buildMaterials(currentPhotos, nFaces)

  const dice = new THREE.Mesh(geo, materials)
  dice.rotation.x = 0.25
  scene.add(dice)

  // ── Orbit controls ──────────────────────────────────────────────────────────
  const orbit = new OrbitControls(camera, renderer.domElement)
  orbit.enableDamping = true
  orbit.dampingFactor = 0.07
  orbit.enableZoom    = false
  orbit.enablePan     = false
  orbit.rotateSpeed   = 0.8

  // ── GSAP spin ───────────────────────────────────────────────────────────────
  let currentLoopDuration = loopDuration
  let spinTween  = null
  let isDragging = false

  function startSpin() {
    spinTween?.kill()
    spinTween = gsap.to(dice.rotation, {
      y: `+=${Math.PI * 2}`,
      duration: currentLoopDuration,
      ease: 'none',
      repeat: -1,
    })
  }

  orbit.addEventListener('start', () => { isDragging = true;  spinTween?.pause() })
  orbit.addEventListener('end',   () => { isDragging = false; spinTween?.resume() })

  startSpin()

  // ── RAF loop ──────────────────────────────────────────────────────────────
  let rafId  = null
  let paused = false

  function tick() {
    rafId = requestAnimationFrame(tick)
    orbit.update()
    renderer.render(scene, camera)
  }
  rafId = requestAnimationFrame(tick)

  // ── Resize observer ──────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
  ro.observe(container)

  let savedBg = '#0e0c08'

  // ── Public interface ───────────────────────────────────────────────────────
  return {
    pauseLoop()   { if (paused) return; paused = true; cancelAnimationFrame(rafId); spinTween?.pause() },
    resumeLoop()  { if (!paused) return; paused = false; if (!isDragging) spinTween?.resume(); rafId = requestAnimationFrame(tick) },
    togglePause() { if (paused) this.resumeLoop(); else this.pauseLoop() },
    reset()       { dice.rotation.set(0.25, 0, 0) },

    stepFrame(fps) {
      dice.rotation.y += (Math.PI * 2) / (currentLoopDuration * fps)
      renderer.render(scene, camera)
    },

    setBgColor(hex)     { savedBg = hex; scene.background = new THREE.Color(hex) },
    restoreBgColor()    { scene.background = new THREE.Color(savedBg) },
    setLoopDuration(s)  { currentLoopDuration = s; startSpin() },
    getCanvas()         { return renderer.domElement },
    getContainerSize()  { return { width: container.clientWidth, height: container.clientHeight } },

    resize(w, h) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    },

    async setFaces(rawFaces) {
      const snapped = snapFaces(rawFaces)
      if (snapped === currentFaceCount) return

      const { geo: newGeo, nFaces: newNFaces } = buildDiceGeometry(snapped)
      const oldGeo  = dice.geometry
      const oldMats = materials

      materials        = await buildMaterials(currentPhotos, newNFaces)
      currentFaceCount = snapped
      dice.geometry    = newGeo
      dice.material    = materials

      oldGeo.dispose()
      oldMats.forEach(m => { m.map?.dispose(); m.dispose() })
    },

    async setPhotos(newPhotos) {
      currentPhotos    = newPhotos
      const oldMats    = materials
      materials        = await buildMaterials(newPhotos, currentFaceCount)
      dice.material    = materials
      oldMats.forEach(m => { m.map?.dispose(); m.dispose() })
    },

    cleanup() {
      cancelAnimationFrame(rafId)
      spinTween?.kill()
      ro.disconnect()
      orbit.dispose()
      dice.geometry.dispose()
      materials.forEach(m => { m.map?.dispose(); m.dispose() })
      renderer.dispose()
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
    },
  }
}
