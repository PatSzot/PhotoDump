import { useState, useRef, useEffect } from 'react'
import 'remixicon/fonts/remixicon.css'

const MONO     = '"IBM Plex Mono", monospace'
const HEADLINE = '"IBM Plex Sans", sans-serif'

export default function MusicSearch({ onSelect, onClose }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const inputRef = useRef(null)
  const debounce = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    setError(null)
    clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); return }
    debounce.current = setTimeout(() => search(q), 400)
  }

  async function search(q) {
    setLoading(true)
    try {
      const res  = await fetch(`/api/spotify?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data)
    } catch (err) {
      setError('Search failed. Check Spotify credentials.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.sheet}>

        {/* Header */}
        <div style={s.header}>
          <span style={{ ...s.title, fontFamily: HEADLINE }}>Add music</span>
          <button style={s.closeBtn} onClick={onClose}>
            <i className="ri-close-line" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Search input */}
        <div style={s.searchRow}>
          <i className="ri-search-line" style={{ fontSize: 14, color: '#999', flexShrink: 0 }} />
          <input
            ref={inputRef}
            style={{ ...s.input, fontFamily: HEADLINE }}
            placeholder="Search Spotify…"
            value={query}
            onChange={handleChange}
          />
          {loading && <div style={s.spinner} />}
        </div>

        <div style={s.divider} />

        {/* Results */}
        <div style={s.list}>
          {error && (
            <div style={{ ...s.empty, fontFamily: MONO }}>{error.toUpperCase()}</div>
          )}
          {!error && results.length === 0 && query.trim() && !loading && (
            <div style={{ ...s.empty, fontFamily: MONO }}>NO RESULTS WITH PREVIEW</div>
          )}
          {!error && results.length === 0 && !query.trim() && (
            <div style={{ ...s.empty, fontFamily: MONO }}>SEARCH A TRACK OR ARTIST</div>
          )}
          {results.map(track => (
            <button key={track.id} style={s.track} onClick={() => onSelect(track)}>
              {track.albumArt
                ? <img src={track.albumArt} alt="" style={s.art} />
                : <div style={s.artPlaceholder}><i className="ri-music-2-line" style={{ fontSize: 16, color: '#666' }} /></div>
              }
              <div style={s.trackMeta}>
                <span style={{ ...s.trackName, fontFamily: HEADLINE }}>{track.name}</span>
                <span style={{ ...s.trackArtist, fontFamily: MONO }}>{track.artist.toUpperCase()}</span>
              </div>
              <i className="ri-play-circle-line" style={{ fontSize: 20, color: '#ccc', flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* Spotify badge */}
        <div style={s.badge}>
          <span style={{ ...s.badgeText, fontFamily: MONO }}>POWERED BY SPOTIFY · 30-SEC PREVIEWS</span>
        </div>

      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '85vh',
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px 24px 0 0',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 20px 16px',
    flexShrink: 0,
  },
  title: { fontSize: 17, fontWeight: 500, color: '#000', letterSpacing: '-0.01em' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    border: 'none', background: 'rgba(0,0,0,0.06)',
    color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  searchRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    margin: '0 16px 12px',
    background: 'rgba(0,0,0,0.05)', borderRadius: 12,
    padding: '10px 14px',
    flexShrink: 0,
  },
  input: {
    flex: 1, border: 'none', background: 'transparent',
    fontSize: 15, color: '#000', outline: 'none',
    letterSpacing: '-0.01em',
  },
  spinner: {
    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
    border: '2px solid rgba(0,0,0,0.1)',
    borderTopColor: '#000',
    animation: 'spin 0.7s linear infinite',
  },
  divider: { height: 1, background: 'rgba(0,0,0,0.06)', flexShrink: 0 },
  list: { overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingBottom: 8 },
  empty: { padding: '28px 20px', textAlign: 'center', fontSize: 10, color: '#bbb', letterSpacing: '0.08em' },
  track: {
    display: 'flex', alignItems: 'center', gap: 14,
    width: '100%', padding: '10px 16px',
    background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  },
  art: { width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#f0efec' },
  artPlaceholder: {
    width: 48, height: 48, borderRadius: 8, flexShrink: 0,
    background: '#f0efec', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  trackMeta: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  trackName: { fontSize: 14, fontWeight: 500, color: '#000', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  trackArtist: { fontSize: 10, color: '#aaa', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badge: { padding: '10px 16px', flexShrink: 0, display: 'flex', justifyContent: 'center' },
  badgeText: { fontSize: 9, color: '#ccc', letterSpacing: '0.08em' },
}
