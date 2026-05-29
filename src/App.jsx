import { useEffect, useRef } from 'react'
import { initScene } from './scene/index.js'

export default function App() {
  const containerRef = useRef(null)

  useEffect(() => {
    return initScene(containerRef.current)
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
}
