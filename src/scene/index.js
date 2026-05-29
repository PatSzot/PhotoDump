import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { createTexturePool } from './texturePool.js'

// ─── Shaders ──────────────────────────────────────────────────────────────────

const VERT = /* glsl */`
  varying vec2 vUv;
  uniform float uSizeX;
  uniform float uSizeY;

  void main() {
    vUv = uv;

    // World-space center of this particle
    vec3 worldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    // Extract camera right/up from view matrix (transposed rotation)
    vec3 right = normalize(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]));
    vec3 up    = normalize(vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]));

    // Distance from camera for perspective-based sizing
    vec4 viewCenter = viewMatrix * vec4(worldCenter, 1.0);
    float dist = max(0.5, -viewCenter.z);
    float scale = clamp(6.0 / dist, 0.12, 3.0);

    // Billboard offset — position.xy span [-0.5, 0.5] on PlaneGeometry(1,1)
    vec3 finalPos = worldCenter
      + right * position.x * scale * uSizeX
      + up    * position.y * scale * uSizeY;

    gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
  }
`

const FRAG = /* glsl */`
  uniform sampler2D uTexture;
  varying vec2 vUv;

  void main() {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`

// ─── Aspect configs ───────────────────────────────────────────────────────────

const ASPECTS = [
  [1.0, 1.0],    // square
  [1.0, 1.0],    // square (weighted)
  [0.75, 1.0],   // portrait
  [0.75, 1.0],   // portrait (weighted)
  [1.0, 0.75],   // landscape
  [0.65, 1.0],   // tall portrait
]

// ─── Scene init ───────────────────────────────────────────────────────────────

export function initScene(container) {
  const W = window.innerWidth
  const H = window.innerHeight

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H)
  renderer.setClearColor(0xF5F3EC, 1)
  container.appendChild(renderer.domElement)

  // Scene & camera
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 120)
  camera.position.set(0, 0, 20)

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 4
  controls.maxDistance = 50
  controls.rotateSpeed = 0.6
  controls.zoomSpeed = 0.8

  // Texture pool
  const pool = createTexturePool()
  const animated = pool.filter(e => e.animated)

  // Shared plane geometry
  const geo = new THREE.PlaneGeometry(1, 1)

  const particles = []

  for (let i = 0; i < 100; i++) {
    const entry = pool[Math.floor(Math.random() * pool.length)]
    const [sx, sy] = ASPECTS[Math.floor(Math.random() * ASPECTS.length)]
    const baseSize = 0.9 + Math.random() * 1.3

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTexture: { value: entry.tex },
        uSizeX:   { value: sx * baseSize },
        uSizeY:   { value: sy * baseSize },
      },
      side: THREE.DoubleSide,
      depthWrite: true,
    })

    const mesh = new THREE.Mesh(geo, mat)

    // Target position: spread in a loose ellipsoid
    const r = 14
    const tx = (Math.random() - 0.5) * r * 2
    const ty = (Math.random() - 0.5) * r * 1.2
    const tz = (Math.random() - 0.5) * r * 2

    // Start at origin, animate out
    mesh.position.set(0, 0, 0)

    gsap.to(mesh.position, {
      x: tx, y: ty, z: tz,
      duration: 1.8 + Math.random() * 1.4,
      delay: Math.random() * 0.6,
      ease: 'expo.out',
      onComplete() {
        // Gentle idle drift
        gsap.to(mesh.position, {
          x: tx + (Math.random() - 0.5) * 0.6,
          y: ty + (Math.random() - 0.5) * 0.6,
          duration: 3 + Math.random() * 4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 3,
        })
      },
    })

    scene.add(mesh)
    particles.push(mesh)
  }

  // Resize
  function onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  // Animate
  let rafId
  const clock = new THREE.Clock()

  function animate() {
    rafId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    for (const entry of animated) {
      entry.update(t)
    }

    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // Cleanup
  return () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    gsap.killTweensOf(particles.map(m => m.position))
    renderer.dispose()
    container.removeChild(renderer.domElement)
  }
}
