import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { initScene } from './scene/index.js'
import UploadPanel from './ui/UploadPanel.jsx'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─── App ──────────────────────────────────────────────────────────────────────

const _params    = new URLSearchParams(window.location.search)
const SHARE_PARAM = _params.get('share')
const VIEW_MODE   = _params.has('view') || !!SHARE_PARAM

export default function App() {
  const containerRef = useRef(null)
  const sceneRef     = useRef(null)
  const poolRef      = useRef([])            // { url, meta }[] — source of truth
  const [images,   setImages]   = useState([])
  const [progress, setProgress] = useState(null)
  const [theme,          setTheme]          = useState('light')
  const [corners,        setCorners]        = useState('sharp')
  const [scapeName,      setScapeName]      = useState('')
  const [recording,      setRecording]      = useState(false)
  const [recordProgress, setRecordProgress] = useState(0)
  const [recordedVideo,  setRecordedVideo]  = useState(null) // { blob, ext } when ready to save

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#191812' : '#F5F3EC'
  }, [theme])

  useEffect(() => {
    let mounted = true
    initScene(containerRef.current).then(async scene => {
      if (!mounted) { scene.cleanup(); return }
      sceneRef.current = scene

      if (SHARE_PARAM) {
        try {
          const res = await fetch(decodeURIComponent(SHARE_PARAM))
          const manifest = await res.json()
          if (mounted && Array.isArray(manifest) && manifest.length > 0) {
            poolRef.current = manifest
            setImages([...manifest])
            setProgress({ done: 0, total: manifest.length })
            scene.updateTextures(manifest, (done, total) => {
              setProgress({ done, total })
              if (done === total) setTimeout(() => setProgress(null), 800)
            })
          }
        } catch (err) {
          console.error('Failed to load shared scape:', err)
        }
      }
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
      setProgress({ done: 0, total: next.length })
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

  function handleThemeChange(t) {
    setTheme(t)
    document.body.style.background = t === 'dark' ? '#191812' : '#F5F3EC'
    sceneRef.current?.setBackground(t === 'dark' ? 0x191812 : 0xF5F3EC)
  }

  async function handleRecord() {
    if (!sceneRef.current || recording) return
    setRecording(true)
    setRecordProgress(0)
    setRecordedVideo(null)
    try {
      const bgColor = theme === 'dark' ? 0x191812 : 0xF5F3EC
      const result = await sceneRef.current.startRecording(bgColor, p => setRecordProgress(p))
      setRecordedVideo(result)  // hold blob — let user gesture trigger the save
    } catch (err) {
      console.error('Recording failed:', err)
    } finally {
      setRecording(false)
      setRecordProgress(0)
    }
  }

  async function handleSaveVideo() {
    if (!recordedVideo) return
    const { blob, ext } = recordedVideo
    const filename = `myscape-videoloop1.${ext}`
    const file = new File([blob], filename, { type: blob.type })

    // On iOS / Android: Web Share API → user picks "Save Video" / Camera Roll
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Myscape' })
        setRecordedVideo(null)
        return
      } catch (e) {
        if (e.name === 'AbortError') return  // user cancelled — keep blob ready
        // Share failed for another reason — fall through to download
      }
    }

    // Desktop fallback: trigger a file download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setRecordedVideo(null)
  }

  async function handleCopyLink() {
    if (!poolRef.current.length) {
      await navigator.clipboard.writeText(`${window.location.origin}/?view`)
      return
    }

    const entries = await Promise.all(poolRef.current.map(async ({ url, meta }) => {
      const res  = await fetch(url)
      const blob = await res.blob()
      const dataUrl = await blobToDataUrl(blob)
      return { dataUrl, meta }
    }))

    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    })

    if (!res.ok) throw new Error('Upload failed')

    const { manifestUrl } = await res.json()
    await navigator.clipboard.writeText(
      `${window.location.origin}/?view&share=${encodeURIComponent(manifestUrl)}`
    )
  }

  function handleCornersChange(v) {
    setCorners(v)
    sceneRef.current?.setStyle({ corner: v === 'rounded' ? 0.12 : 0.0 })
    if (poolRef.current.length > 0) {
      applyPool(poolRef.current, false)
    } else {
      sceneRef.current?.reloadDefaults()
    }
  }

  function handleDelete(url) {
    URL.revokeObjectURL(url)
    const next = poolRef.current.filter(img => img.url !== url)
    applyPool(next, false)
  }

  return (
    <>
      {/* Name sits behind the canvas */}
      {scapeName && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '40pt',
          fontFamily: "'Zalando Sans SemiExpanded', sans-serif",
          fontWeight: 900,
          color: theme === 'dark' ? '#f0ede4' : '#000000',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}>
          {scapeName}
        </div>
      )}

      {/* Canvas sits above — transparent background lets name show through */}
      <div ref={containerRef} style={{ position: 'relative', zIndex: 1, width: '100vw', height: '100vh', overflow: 'hidden' }} />

      {!VIEW_MODE && <UploadPanel
        onLoad={handleLoad}
        onDelete={handleDelete}
        images={images}
        progress={progress}
        theme={theme}
        onThemeChange={handleThemeChange}
        corners={corners}
        onCornersChange={handleCornersChange}
        onRecord={handleRecord}
        isRecording={recording}
        recordProgress={recordProgress}
        recordedVideo={recordedVideo}
        onSaveVideo={handleSaveVideo}
        onCopyLink={handleCopyLink}
        scapeName={scapeName}
        onScapeNameChange={setScapeName}
      />}
    </>
  )
}
