import { useEffect, useRef, useState } from 'react'
import { initScene } from './scene/index.js'
import SearchPanel from './ui/SearchPanel.jsx'

export default function App() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const scene = initScene(containerRef.current)
    sceneRef.current = scene
    return scene.cleanup
  }, [])

  async function handleLoad(username) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/instagram?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load profile')
      const proxyUrls = data.images.map(
        img => `/api/proxy?url=${encodeURIComponent(img.url)}`
      )
      sceneRef.current.updateTextures(proxyUrls)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
      <SearchPanel onLoad={handleLoad} loading={loading} error={error} />
    </>
  )
}
