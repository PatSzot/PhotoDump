import { useState, useEffect } from 'react'
import 'remixicon/fonts/remixicon.css'
import { togglePlay, getProgress } from '../audio/engine.js'

const MONO = '"IBM Plex Mono", monospace'
const SANS = '"IBM Plex Sans", sans-serif'

function fmt(s) {
  const m  = Math.floor(s / 60)
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${ss}`
}

export default function MusicPill({ name, artist, albumArt, loopSecs, onRemove, theme }) {
  const [playing, setPlaying] = useState(true)
  const [pct,     setPct]     = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      const p = getProgress()
      setPct(p.pct)
      setElapsed(p.elapsed)
    }, 300)
    return () => clearInterval(id)
  }, [])

  async function handleToggle() {
    const now = await togglePlay()
    setPlaying(now)
  }

  const isDark = theme === 'dark'
  const glass = {
    background:           isDark ? 'rgba(30,28,20,0.92)' : 'rgba(255,255,255,0.92)',
    backdropFilter:       'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:               isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
    boxShadow:            isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.09)',
  }
  const textPrimary   = isDark ? '#f0ede4' : '#000'
  const textSecondary = isDark ? '#666'    : '#aaa'
  const btnBg         = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
  const trackBg       = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.08)'
  const playBg        = isDark ? '#f0ede4' : '#000'
  const playColor     = isDark ? '#191812' : '#fff'

  return (
    <div style={{ ...s.pill, ...glass }}>

      {albumArt
        ? <img src={albumArt} alt="" style={s.art} />
        : (
          <button style={{ ...s.playBtn, background: playBg, color: playColor }} onClick={handleToggle} aria-label={playing ? 'Pause' : 'Play'}>
            <i className={playing ? 'ri-pause-fill' : 'ri-play-fill'} style={{ fontSize: 15, lineHeight: 1 }} />
          </button>
        )
      }
      {albumArt && (
        <button style={s.playOverlay} onClick={handleToggle} aria-label={playing ? 'Pause' : 'Play'}>
          <i className={playing ? 'ri-pause-fill' : 'ri-play-fill'} style={{ fontSize: 13, lineHeight: 1 }} />
        </button>
      )}

      <div style={s.body}>
        <div style={s.nameRow}>
          <span style={{ ...s.name, fontFamily: SANS, color: textPrimary }}>{name}</span>
          <span style={{ ...s.badge, fontFamily: MONO, color: textSecondary }}>{isDark ? 'SLOW + VERB' : 'SLOW + VERB'}</span>
        </div>
        {artist && <span style={{ ...s.artist, fontFamily: MONO, color: textSecondary }}>{artist.toUpperCase()}</span>}
        <div style={{ ...s.track, background: trackBg }}>
          <div style={{ ...s.fill, width: `${pct % 100}%`, background: textPrimary }} />
        </div>
        <span style={{ ...s.time, fontFamily: MONO, color: isDark ? '#555' : '#bbb' }}>
          {fmt(elapsed)} / {fmt(loopSecs)}
        </span>
      </div>

      <button style={{ ...s.closeBtn, background: btnBg, color: textSecondary }} onClick={onRemove} aria-label="Remove song">
        <i className="ri-close-line" style={{ fontSize: 14, lineHeight: 1 }} />
      </button>

    </div>
  )
}

const s = {
  pill: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: '12px 14px',
    width: '100%',
  },
  art: {
    width: 36,
    height: 36,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#000',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  playOverlay: {
    marginLeft: -48,
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'rgba(0,0,0,0.35)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: 500,
    color: '#000',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    minWidth: 0,
  },
  artist: {
    fontSize: 10,
    color: '#aaa',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    fontSize: 8,
    color: '#aaa',
    letterSpacing: '0.1em',
    flexShrink: 0,
    background: 'rgba(0,0,0,0.05)',
    padding: '2px 5px',
    borderRadius: 4,
  },
  track: {
    height: 3,
    borderRadius: 2,
    background: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: '#000',
    borderRadius: 2,
    transition: 'width 0.3s linear',
  },
  time: {
    fontSize: 9,
    color: '#bbb',
    letterSpacing: '0.06em',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    border: 'none',
    background: 'rgba(0,0,0,0.05)',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
}
