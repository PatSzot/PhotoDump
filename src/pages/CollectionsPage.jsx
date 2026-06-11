import { Link } from 'react-router-dom'
import 'remixicon/fonts/remixicon.css'
import { COLLECTIONS } from '../data/collectionsData.js'
import '../styles/library.css'

function LibNav() {
  return (
    <nav className="lib-nav">
      <Link to="/" className="lib-nav-brand">
        <img src="/A.svg" alt="" style={{ height: 18, opacity: 0.7 }} />
        MYSCAPE
      </Link>
      <div className="lib-nav-links">
        <Link to="/library" className="lib-nav-link">Library</Link>
        <Link to="/collections" className="lib-nav-link active">Collections</Link>
      </div>
      <Link to="/" className="lib-nav-cta">
        <i className="ri-sparkling-2-line" style={{ fontSize: 14 }} />
        Create
      </Link>
    </nav>
  )
}

export default function CollectionsPage() {
  return (
    <div className="lib-page">
      <LibNav />

      <div className="lib-section-header">
        <h1 className="lib-section-title">Collections</h1>
        <p className="lib-section-sub">Curated sets of photos, ready to use in your scapes.</p>
      </div>

      <div className="lib-collections-grid">
        {COLLECTIONS.map(col => (
          <Link key={col.id} to={`/collections/${col.slug}`} className="lib-collection-card">
            <img src={`/${col.coverKey}.jpg`} alt={col.name} />
            <div className="lib-collection-overlay">
              <span className="lib-collection-count">{col.imageIds.length} photos</span>
              <span className="lib-collection-name">{col.name}</span>
              <span className="lib-collection-desc">{col.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
