import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import 'remixicon/fonts/remixicon.css'
import { COLLECTIONS, getCollectionImages } from '../data/collectionsData.js'
import '../styles/library.css'

function ImageCard({ image, onUseInScape }) {
  function handleDownload(e) {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = image.url
    a.download = `myscape-${image.key}.jpg`
    a.click()
  }

  return (
    <div className="lib-card">
      <img src={image.url} alt={image.title} loading="lazy" />
      <div className="lib-card-overlay">
        <div className="lib-card-meta">
          <span className="lib-card-category">{image.category}</span>
          <span className="lib-card-title">{image.title}</span>
          <div className="lib-card-actions">
            <button
              className="lib-card-btn lib-card-btn--primary"
              onClick={e => { e.stopPropagation(); onUseInScape(image) }}
            >
              <i className="ri-sparkling-2-line" style={{ fontSize: 12 }} />
              Use in Scape
            </button>
            <button
              className="lib-card-btn lib-card-btn--secondary"
              onClick={handleDownload}
              title="Download"
            >
              <i className="ri-download-2-line" style={{ fontSize: 13 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CollectionDetailPage() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const collection = COLLECTIONS.find(c => c.slug === slug)
  const images     = getCollectionImages(slug)

  const handleUseAll = useCallback(() => {
    const urls = images.map(img => img.url)
    sessionStorage.setItem('pendingLibraryPhotos', JSON.stringify(urls))
    navigate('/')
  }, [images, navigate])

  const handleUseInScape = useCallback((image) => {
    const pending = JSON.parse(sessionStorage.getItem('pendingLibraryPhotos') || '[]')
    if (!pending.includes(image.url)) pending.push(image.url)
    sessionStorage.setItem('pendingLibraryPhotos', JSON.stringify(pending))
    navigate('/')
  }, [navigate])

  if (!collection) {
    return (
      <div className="lib-page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh' }}>
        <div style={{ textAlign:'center', color:'rgba(240,237,228,0.35)', fontSize:11, letterSpacing:'0.08em' }}>
          Collection not found. <Link to="/collections" style={{ color:'rgba(240,237,228,0.6)' }}>Back to Collections</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="lib-page">
      {/* Hero */}
      <div className="lib-detail-hero">
        <img src={`/${collection.coverKey}.jpg`} alt={collection.name} />
        <div className="lib-detail-hero-overlay">
          <Link to="/collections" className="lib-detail-back">
            <i className="ri-arrow-left-line" style={{ fontSize: 13 }} />
            Collections
          </Link>
          <span className="lib-detail-title">{collection.name}</span>
          <span className="lib-detail-desc">{collection.description}</span>
        </div>
      </div>

      {/* Actions bar */}
      <div style={{ padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize:10, color:'rgba(240,237,228,0.35)', letterSpacing:'0.1em' }}>
          {images.length} {images.length === 1 ? 'PHOTO' : 'PHOTOS'}
        </span>
        <button
          onClick={handleUseAll}
          style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'8px 16px', borderRadius:999, border:'none',
            background:'rgba(255,255,255,0.1)', color:'#f0ede4',
            fontFamily:'"IBM Plex Mono",monospace', fontSize:10,
            fontWeight:500, letterSpacing:'0.08em', cursor:'pointer',
          }}
        >
          <i className="ri-sparkling-2-line" style={{ fontSize:13 }} />
          Use All in Scape
        </button>
      </div>

      {/* Masonry grid */}
      <div className="lib-grid-wrap">
        <div className="lib-masonry">
          {images.map(img => (
            <ImageCard key={img.id} image={img} onUseInScape={handleUseInScape} />
          ))}
        </div>
      </div>
    </div>
  )
}
