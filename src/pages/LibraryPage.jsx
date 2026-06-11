import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import 'remixicon/fonts/remixicon.css'
import { LIBRARY_IMAGES, CATEGORIES, ASPECT_RATIOS, filterImages } from '../data/libraryImages.js'
import '../styles/library.css'

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({ image, onUseInScape }) {
  const [touched, setTouched] = useState(false)

  function handleDownload(e) {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = image.url
    a.download = `myscape-${image.key}.jpg`
    a.click()
  }

  return (
    <div
      className={`lib-card${touched ? ' lib-card--touch' : ''}`}
      onTouchStart={() => setTouched(true)}
      onTouchEnd={() => setTimeout(() => setTouched(false), 1200)}
    >
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

// ─── Library Nav ──────────────────────────────────────────────────────────────

function LibNav() {
  return (
    <nav className="lib-nav">
      <Link to="/" className="lib-nav-brand">
        <img src="/A.svg" alt="" style={{ height: 18, opacity: 0.7 }} />
        MYSCAPE
      </Link>
      <div className="lib-nav-links">
        <Link to="/library" className="lib-nav-link active">Library</Link>
        <Link to="/collections" className="lib-nav-link">Collections</Link>
      </div>
      <Link to="/" className="lib-nav-cta">
        <i className="ri-sparkling-2-line" style={{ fontSize: 14 }} />
        Create
      </Link>
    </nav>
  )
}

// ─── Library Page ─────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const navigate = useNavigate()
  const [query,       setQuery]       = useState('')
  const [category,    setCategory]    = useState('All')
  const [aspectRatio, setAspectRatio] = useState('All')

  const filtered = filterImages({ query, category, aspectRatio })

  const handleUseInScape = useCallback((image) => {
    const pending = JSON.parse(sessionStorage.getItem('pendingLibraryPhotos') || '[]')
    if (!pending.includes(image.url)) pending.push(image.url)
    sessionStorage.setItem('pendingLibraryPhotos', JSON.stringify(pending))
    navigate('/')
  }, [navigate])

  return (
    <div className="lib-page">
      <LibNav />

      <div className="lib-controls">
        <div className="lib-search-row">
          <div className="lib-search-wrap">
            <i className="ri-search-line lib-search-icon" />
            <input
              type="text"
              className="lib-search"
              placeholder="Search by title, tag, category…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <span className="lib-result-count">
            {filtered.length} {filtered.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>

        <div className="lib-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`lib-filter-pill${category === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
          <span className="lib-filter-divider" />
          {ASPECT_RATIOS.map(ar => (
            <button
              key={ar}
              className={`lib-filter-pill${aspectRatio === ar ? ' active' : ''}`}
              onClick={() => setAspectRatio(ar)}
            >
              {ar === 'All' ? 'Any ratio' : ar}
            </button>
          ))}
        </div>
      </div>

      <div className="lib-grid-wrap">
        {filtered.length === 0 ? (
          <div className="lib-empty">No photos match your filters.</div>
        ) : (
          <div className="lib-masonry">
            {filtered.map(img => (
              <ImageCard key={img.id} image={img} onUseInScape={handleUseInScape} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
