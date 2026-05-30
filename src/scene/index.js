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

    vec3 worldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    vec3 right = normalize(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]));
    vec3 up    = normalize(vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]));

    vec4 viewCenter = viewMatrix * vec4(worldCenter, 1.0);
    float dist = max(0.5, -viewCenter.z);
    float scale = clamp(6.0 / dist, 0.12, 3.0);

    vec3 finalPos = worldCenter
      + right * position.x * scale * uSizeX
      + up    * position.y * scale * uSizeY;

    gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
  }
`

const FRAG = /* glsl */`
  uniform sampler2D uTexture;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(uTexture, vUv);
    gl_FragColor = vec4(color.rgb, uOpacity);
  }
`

// ─── Aspect configs ───────────────────────────────────────────────────────────

const ASPECTS = [
  [1.0, 1.0],
  [1.0, 1.0],
  [0.75, 1.0],
  [0.75, 1.0],
  [1.0, 0.75],
  [0.65, 1.0],
]

// ─── Scene ────────────────────────────────────────────────────────────────────

export function initScene(container) {
  const W = window.innerWidth
  const H = window.innerHeight

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H)
  renderer.setClearColor(0xF5F3EC, 1)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 120)
  camera.position.set(0, 0, 20)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 4
  controls.maxDistance = 50
  controls.rotateSpeed = 0.6
  controls.zoomSpeed = 0.8

  const pool = createTexturePool()
  const animated = pool.filter(e => e.animated)
  const geo = new THREE.PlaneGeometry(1, 1)
  const particles = []

  for (let i = 0; i < 100; i++) {
    const entry = pool[Math.floor(Math.random() * pool.length)]
    const [sx, sy] = ASPECTS[Math.floor(Math.random() * ASPECTS.length)]
    const base = 0.9 + Math.random() * 1.3

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTexture: { value: entry.tex },
        uSizeX:   { value: sx * base },
        uSizeY:   { value: sy * base },
        uOpacity: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geo, mat)
    const r = 14
    const tx = (Math.random() - 0.5) * r * 2
    const ty = (Math.random() - 0.5) * r * 1.2
    const tz = (Math.random() - 0.5) * r * 2

    mesh.position.set(0, 0, 0)

    gsap.to(mesh.position, {
      x: tx, y: ty, z: tz,
      duration: 1.8 + Math.random() * 1.4,
      delay: Math.random() * 0.6,
      ease: 'expo.out',
      onComplete() {
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

  // ─── Texture loading (canvas-based to avoid iOS crossOrigin/blob issues) ────

  function loadBlobAsTexture(url) {
    return new Promise(resolve => {
      const img = new Image()
      // Do NOT set crossOrigin — blob URLs break on iOS Safari with it set
      img.onload = () => {
        const MAX = 1024
        const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        resolve(tex)
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  }

  function updateTextures(urls) {
    particles.forEach((mesh, i) => {
      const url = urls[i % urls.length]
      const delay = i * 0.015 + Math.random() * 0.15

      gsap.to(mesh.material.uniforms.uOpacity, {
        value: 0,
        duration: 0.2,
        delay,
        onComplete() {
          loadBlobAsTexture(url).then(tex => {
            if (tex) mesh.material.uniforms.uTexture.value = tex
            gsap.to(mesh.material.uniforms.uOpacity, { value: 1, duration: 0.35 })
          })
        },
      })
    })
  }

  // ─── Resize ───────────────────────────────────────────────────────────────

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  // ─── Loop ────────────────────────────────────────────────────────────────

  let rafId
  const clock = new THREE.Clock()

  function animate() {
    rafId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    for (const entry of animated) entry.update(t)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  return {
    updateTextures,
    cleanup() {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      gsap.killTweensOf(particles.map(m => m.position))
      renderer.dispose()
      container.removeChild(renderer.domElement)
    },
  }
}
