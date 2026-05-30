import { useEffect, useRef, useState } from 'react'
import { initScene } from './scene/index.js'
import UploadPanel from './ui/UploadPanel.jsx'

export default function App() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const allUrlsRef = useRef([])        // accumulated blob URLs across all selections
  const [count, setCount] = useState(0)
  const [progress, setProgress] = useState(null) // null | { done, total }

  useEffect(() => {
    const scene = initScene(containerRef.current)
    sceneRef.current = scene
    return scene.cleanup
  }, [])

  function handleLoad(newUrls) {
    // Append new photos to existing selection
    allUrlsRef.current = [...allUrlsRef.current, ...newUrls]
    const allUrls = allUrlsRef.current
    setCount(allUrls.length)
    setProgress({ done: 0, total: 100 })

    sceneRef.current.updateTextures(allUrls, (done, total) => {
      setProgress({ done, total })
      if (done === total) {
        setTimeout(() => setProgress(null), 800)
      }
    })
  }

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
      <UploadPanel onLoad={handleLoad} count={count} progress={progress} />
    </>
  )
}
