import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { initScene } from '../scene/index.js'

const LandscapeCanvas = forwardRef(function LandscapeCanvas({ images }, ref) {
  const containerRef = useRef(null)
  const sceneRef     = useRef(null)
  // Track latest images so we can apply them once init finishes
  const imagesRef    = useRef(images)

  useImperativeHandle(ref, () => ({
    getScene: () => null,  // landscape uses a different recorder — export unsupported
  }), [])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  // ── Mount: init the scatter scene ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    const container = containerRef.current

    initScene(container).then(scene => {
      if (!mounted) { scene.cleanup(); return }
      sceneRef.current = scene

      // Apply any images that arrived before init finished
      const imgs = imagesRef.current
      if (imgs && imgs.length > 0) {
        scene.updateTextures(imgs)
      }
    })

    return () => {
      mounted = false
      sceneRef.current?.cleanup()
      sceneRef.current = null
    }
  }, [])

  // ── Images changed ─────────────────────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (images && images.length > 0) {
      scene.updateTextures(images)
    } else {
      scene.reloadDefaults()
    }
  }, [images])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  )
})

export default LandscapeCanvas
