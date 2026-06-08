import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { initCubeScene } from '../lib/cubeScene.js'

const CubeCanvas = forwardRef(function CubeCanvas(
  { photos = [], bgColor = '#0e0c08', loopS = 8, faces = 6 },
  ref,
) {
  const containerRef = useRef(null)
  const sceneRef     = useRef(null)

  useEffect(() => {
    let mounted = true
    const container = containerRef.current

    initCubeScene(container, photos, loopS, faces).then(scene => {
      if (!mounted) { scene.cleanup(); return }
      sceneRef.current = scene
      scene.setBgColor(bgColor)
    })

    return () => {
      mounted = false
      sceneRef.current?.cleanup()
      sceneRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { sceneRef.current?.setBgColor(bgColor) },          [bgColor])
  useEffect(() => { sceneRef.current?.setLoopDuration(loopS) },       [loopS])
  useEffect(() => { sceneRef.current?.setPhotos(photos) },            [photos])
  useEffect(() => { sceneRef.current?.setFaces(faces) },              [faces])

  useImperativeHandle(ref, () => ({
    togglePause() { sceneRef.current?.togglePause() },
    getScene()    { return sceneRef.current },
  }))

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
})

export default CubeCanvas
