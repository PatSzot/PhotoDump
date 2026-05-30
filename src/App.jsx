import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { initScene } from './scene/index.js'
import UploadPanel from './ui/UploadPanel.jsx'
import { loadFromUrl, unload } from './audio/engine.js'

// ─── EXIF helpers ─────────────────────────────────────────────────────────────

async function readMeta(file) {
  try {
    const data = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude'],
    })
    if (!data) return {}

    const dt   = data.DateTimeOriginal || data.CreateDate
    const date = dt instanceof Date
      ? dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : null

    let location = null
    if (data.GPSLatitude != null && data.GPSLongitude != null) {
      const lat    = data.GPSLatitude
      const lon    = data.GPSLongitude
      const latDir = lat >= 0 ? 'N' : 'S'
      const lonDir = lon >= 0 ? 'E' : 'W'
      location = `${Math.abs(lat).toFixed(4)}° ${latDir}  ${Math.abs(lon).toFixed(4)}° ${lonDir}`
    }

    return { date, location }
  } catch {
    return {}
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const containerRef = useRef(null)
  const sceneRef     = useRef(null)
  const poolRef      = useRef([])            // { url, meta }[] — source of truth
  const [images,   setImages]   = useState([])
  const [progress, setProgress] = useState(null)
  const [song,     setSong]     = useState(null)

  useEffect(() => {
    let mounted = true
    initScene(containerRef.current).then(scene => {
      if (!mounted) { scene.cleanup(); return }
      sceneRef.current = scene
    })
    return () => {
      mounted = false
      sceneRef.current?.cleanup()
    }
  }, [])

  function applyPool(next, showProgress = true) {
    poolRef.current = next
    setImages([...next])

    if (showProgress) {
      setProgress({ done: 0, total: 100 })
      sceneRef.current.updateTextures(next, (done, total) => {
        setProgress({ done, total })
        if (done === total) setTimeout(() => setProgress(null), 800)
      })
    } else {
      sceneRef.current.updateTextures(next)
    }
  }

  async function handleLoad(files) {
    // Read EXIF in parallel, then create blob URLs
    const metas = await Promise.all(files.map(readMeta))
    const newImages = files.map((f, i) => ({
      url:  URL.createObjectURL(f),
      meta: metas[i],
    }))
    applyPool([...poolRef.current, ...newImages], true)
  }

  async function handleLoadMusic(track) {
    const result = await loadFromUrl(track.previewUrl, track.name)
    setSong({ ...result, artist: track.artist, albumArt: track.albumArt })
  }

  async function handleRemoveMusic() {
    await unload()
    setSong(null)
  }

  function handleDelete(url) {
    URL.revokeObjectURL(url)
    const next = poolRef.current.filter(img => img.url !== url)
    applyPool(next, false)
  }

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
      <UploadPanel
        onLoad={handleLoad}
        onDelete={handleDelete}
        images={images}
        progress={progress}
        onLoadMusic={handleLoadMusic}
        song={song}
        onRemoveMusic={handleRemoveMusic}
      />
    </>
  )
}
