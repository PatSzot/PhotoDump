import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Group,
  AmbientLight,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  CanvasTexture,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { createPhotoPlane, createSquarePhotoPlane, disposePhotoPlane } from './photoPlane.js'
import { PRESETS } from './presets.js'

// ─── Name texture helper ───────────────────────────────────────────────────────

function renderNameToTexture(name) {
  const fontSize = 52
  const padding  = 24

  // Measure with a temp canvas to get exact text width
  const tmp  = document.createElement('canvas')
  const tctx = tmp.getContext('2d')
  tctx.font  = `500 ${fontSize}px "Zalando Sans SemiExpanded", sans-serif`
  const textW = tctx.measureText(name.toUpperCase()).width

  const w = Math.ceil(textW + padding * 2)
  const h = Math.ceil(fontSize * 1.6)

  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  ctx.font          = `500 ${fontSize}px "Zalando Sans SemiExpanded", sans-serif`
  ctx.fillStyle     = 'rgba(255, 255, 255, 0.82)'
  ctx.textAlign     = 'center'
  ctx.textBaseline  = 'middle'
  ctx.letterSpacing = '0.08em'
  ctx.fillText(name.toUpperCase(), w / 2, h / 2)

  return { canvas, aspect: w / h }
}

// ─── Scene factory ─────────────────────────────────────────────────────────────

export function createScapeScene(canvas) {
  // ── Renderer ───────────────────────────────────────────────────────────────
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)   // transparent — CSS bg shows through

  // ── Camera ─────────────────────────────────────────────────────────────────
  const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 1
  const camera = new PerspectiveCamera(60, aspect, 0.1, 200)
  camera.position.set(0, 0, 6)

  // ── Scene ──────────────────────────────────────────────────────────────────
  const scene    = new Scene()
  const fanGroup = new Group()
  scene.add(new AmbientLight(0xffffff, 1.0))
  scene.add(fanGroup)
  // Camera must be in scene for its children (name mesh) to render
  scene.add(camera)

  // ── OrbitControls (only active in 'explore' mode) ──────────────────────────
  const orbitControls = new OrbitControls(camera, canvas)
  orbitControls.enableDamping  = true
  orbitControls.dampingFactor  = 0.05
  orbitControls.enabled        = false

  // ── Scroll-to-zoom for animated presets ────────────────────────────────────
  function onWheelZoom(e) {
    if (currentPresetId !== 'explore') {
      userZoomDelta = Math.max(-3, Math.min(5, userZoomDelta - e.deltaY * 0.01))
      e.preventDefault()
    }
  }
  canvas.addEventListener('wheel', onWheelZoom, { passive: false })

  // ── State ──────────────────────────────────────────────────────────────────
  let meshes          = []
  let currentUrls     = []
  let nameMesh        = null
  let currentPreset   = PRESETS['sphere']
  let currentPresetId = 'sphere'
  let currentControls = { ...PRESETS['sphere'].defaults }
  let animClock       = 0
  let lastTimestamp   = null
  let userZoomDelta   = 0
  let canvasWidth     = 1080
  let canvasHeight    = 1080

  // ── Internal helpers ───────────────────────────────────────────────────────

  function applyLayout() {
    if (meshes.length === 0) return
    currentPreset.layoutPhotos(meshes, currentControls, canvasWidth, canvasHeight)
  }

  function driveFanAnimation() {
    if (currentPresetId !== 'rotatingImages' || meshes.length === 0) return
    const masterAngle = Math.sin(animClock * Math.PI * 2) * (55 * Math.PI / 180)
    fanGroup.rotation.z = masterAngle
    meshes.forEach((mesh, i) => {
      const phase = animClock + i * (1 / Math.max(meshes.length, 1)) * 0.5
      mesh.rotation.z = Math.sin(phase * Math.PI * 2) * (10 * Math.PI / 180)
    })
  }

  function disposeNameMesh() {
    if (!nameMesh) return
    camera.remove(nameMesh)
    nameMesh.geometry.dispose()
    if (nameMesh.material.map) nameMesh.material.map.dispose()
    nameMesh.material.dispose()
    nameMesh = null
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async function setPhotos(urlArray) {
    currentUrls = urlArray || []

    if (meshes.length > 0) {
      gsap.killTweensOf(meshes.map(m => m.position))
      gsap.killTweensOf(meshes.map(m => m.rotation))
    }

    for (const mesh of meshes) disposePhotoPlane(mesh)  // disposePhotoPlane removes from parent
    meshes = []

    if (!currentUrls.length) return

    const isRotating = currentPresetId === 'rotatingImages'
    const newMeshes  = await Promise.all(
      currentUrls.map(url => isRotating ? createSquarePhotoPlane(url) : createPhotoPlane(url, 1))
    )
    for (const mesh of newMeshes) {
      isRotating ? fanGroup.add(mesh) : scene.add(mesh)
      meshes.push(mesh)
    }

    applyLayout()
  }

  async function setPreset(presetId, controls) {
    const preset = PRESETS[presetId]
    if (!preset) return

    if (meshes.length > 0) {
      gsap.killTweensOf(meshes.map(m => m.position))
      gsap.killTweensOf(meshes.map(m => m.rotation))
    }

    const wasRotating = currentPresetId === 'rotatingImages'
    const isRotating  = presetId === 'rotatingImages'

    // No meshes — just update state
    if (meshes.length === 0) {
      if (wasRotating && !isRotating) fanGroup.rotation.z = 0
      currentPreset   = preset
      currentPresetId = presetId
      currentControls = { ...controls }
      orbitControls.enabled = (presetId === 'explore')
      animClock = 0
      userZoomDelta = 0
      return
    }

    // Switching between rotating ↔ non-rotating: recreate planes in correct format
    if (wasRotating !== isRotating) {
      for (const mesh of meshes) disposePhotoPlane(mesh)
      meshes = []
      if (wasRotating) fanGroup.rotation.z = 0

      currentPreset   = preset
      currentPresetId = presetId
      currentControls = { ...controls }
      orbitControls.enabled = (presetId === 'explore')
      animClock = 0
      userZoomDelta = 0

      if (currentUrls.length > 0) {
        const newMeshes = await Promise.all(
          currentUrls.map(url => isRotating ? createSquarePhotoPlane(url) : createPhotoPlane(url, 1))
        )
        for (const mesh of newMeshes) {
          isRotating ? fanGroup.add(mesh) : scene.add(mesh)
          meshes.push(mesh)
        }
        applyLayout()
      }
      return
    }

    // Both non-rotating: tween between positions
    if (!isRotating) {
      const saved = meshes.map(m => ({
        px: m.position.x, py: m.position.y, pz: m.position.z,
        ry: m.rotation.y,
      }))

      preset.layoutPhotos(meshes, controls, canvasWidth, canvasHeight)

      meshes.forEach((mesh, i) => {
        const tx = mesh.position.x, ty = mesh.position.y, tz = mesh.position.z
        const tRy = mesh.rotation.y

        mesh.position.set(saved[i].px, saved[i].py, saved[i].pz)
        mesh.rotation.y = saved[i].ry

        gsap.to(mesh.position, { x: tx, y: ty, z: tz, duration: 0.8, ease: 'power2.inOut' })
        gsap.to(mesh.rotation, { y: tRy,           duration: 0.8, ease: 'power2.inOut' })
      })
    } else {
      // Staying in rotatingImages (controls update)
      applyLayout()
    }

    currentPreset   = preset
    currentPresetId = presetId
    currentControls = { ...controls }
    orbitControls.enabled = (presetId === 'explore')
    animClock = 0
    userZoomDelta = 0
  }

  function updateControls(controls) {
    currentControls = { ...controls }
    applyLayout()
  }

  function setScapeName(name) {
    disposeNameMesh()
    if (!name) return

    const { canvas: tc, aspect } = renderNameToTexture(name)
    const texture = new CanvasTexture(tc)

    // Size: ~0.55 units wide in camera space at z=-2 (subtle caption scale)
    const w   = 0.55
    const h   = w / aspect
    const geo = new PlaneGeometry(w, h)
    const mat = new MeshBasicMaterial({
      map: texture, transparent: true,
      depthTest: false, depthWrite: false,
    })

    nameMesh = new Mesh(geo, mat)
    nameMesh.renderOrder = 999
    // Position bottom-center in camera space, 2 units ahead
    nameMesh.position.set(0, 0, -2)

    camera.add(nameMesh)
  }

  function tick(timestamp) {
    if (lastTimestamp === null) lastTimestamp = timestamp

    if (currentPresetId === 'explore') {
      orbitControls.update()
    } else if (currentPreset && meshes.length > 0) {
      const dt = (timestamp - lastTimestamp) / 1000
      animClock = (animClock + dt * currentControls.speed * 0.1) % 1.0
      driveFanAnimation()
      const state = currentPreset.getCameraState(animClock, currentControls, canvasWidth, canvasHeight)
      if (state) {
        const dir = state.position.clone().sub(state.target).normalize()
        const baseDist = state.position.distanceTo(state.target)
        const adjustedDist = Math.max(0.5, baseDist + userZoomDelta)
        camera.position.copy(state.target).addScaledVector(dir, adjustedDist)
        camera.lookAt(state.target)
      }
    }

    lastTimestamp = timestamp
    renderer.render(scene, camera)
  }

  function resize(width, height) {
    if (width <= 0 || height <= 0) return
    canvasWidth  = width
    canvasHeight = height
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  function dispose() {
    gsap.killTweensOf(meshes.map(m => m.position))
    gsap.killTweensOf(meshes.map(m => m.rotation))
    for (const mesh of meshes) disposePhotoPlane(mesh)  // removes from parent (scene or fanGroup)
    meshes = []
    disposeNameMesh()
    canvas.removeEventListener('wheel', onWheelZoom)
    scene.remove(fanGroup)
    scene.remove(camera)
    orbitControls.dispose()
    renderer.dispose()
  }

  return {
    setPhotos, setPreset, updateControls, setScapeName,
    tick, resize, dispose,
  }
}
