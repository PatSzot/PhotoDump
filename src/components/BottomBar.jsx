import { useState } from 'react'

const MONO = '"IBM Plex Mono", monospace'

const ASPECTS = [
  { label: '1:1',  value: '1:1',  size: { width: 1080, height: 1080 } },
  { label: '9:16', value: '9:16', size: { width: 1080, height: 1920 } },
  { label: '16:9', value: '16:9', size: { width: 1920, height: 1080 } },
]

export default function BottomBar({ aspectRatio, onAspectChange, onShare, hasPhotos, theme }) {
  const [copied,   setCopied]   = useState(false)
  const [copying,  setCopying]  = useState(false)
  const [shareUrl, setShareUrl] = useState(null)

  const isDark  = theme === 'dark'
  const text    = isDark ? '#f0ede4' : '#1a1a18'
  const muted   = isDark ? 'rgba(240,237,228,0.4)' : 'rgba(26,26,24,0.38)'
  const bg      = isDark ? '#191812' : '#F0EDE4'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  async function handleShare() {
    if (copying || copied || !hasPhotos) return
    setCopying(true)
    setShareUrl(null)
    try {
      const url = await onShare()
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch {
        setShareUrl(url)
      }
    } catch (err) {
      console.error('Share failed:', err)
      alert('Failed to generate share link. Please try again.')
    } finally {
      setCopying(false)
    }
  }

  const pillStyle = (active) => ({
    fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em',
    padding: '4px 10px', borderRadius: 4,
    border: `1px solid ${active ? (isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)') : border}`,
    background: active ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'none',
    color: active ? text : muted,
    cursor: 'pointer', transition: 'all 0.14s',
  })

  return (
    <footer className="bottom-bar"
      style={{ background: bg, borderTop: `1px solid ${border}` }}>

      {/* Format label */}
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.11em', textTransform: 'uppercase', color: muted, marginRight: 2 }}>
        Format
      </span>

      {/* Aspect ratio pills */}
      {ASPECTS.map(({ label, value, size }) => (
        <button key={value} onClick={() => onAspectChange(value, size)} style={pillStyle(aspectRatio === value)}>
          {label}
        </button>
      ))}

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: border, margin: '0 4px' }} />

      {/* Share button */}
      <button onClick={handleShare} disabled={!hasPhotos || copying} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '4px 12px', borderRadius: 4,
        border: `1px solid ${copied ? (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)') : border}`,
        background: 'none',
        color: copied ? text : muted,
        cursor: hasPhotos && !copying ? 'pointer' : 'default',
        opacity: !hasPhotos ? 0.38 : 1,
        transition: 'all 0.15s',
      }}>
        <i className={`ri-${copied ? 'check' : 'link'}-line`} style={{ fontSize: 12 }} />
        {copying ? 'Uploading…' : copied ? 'Copied' : 'Share'}
      </button>

      {/* Fallback share URL (iOS clipboard workaround) */}
      {shareUrl && (
        <input readOnly value={shareUrl}
          onFocus={e => e.target.select()}
          onClick={e => { e.target.select(); navigator.clipboard?.writeText(shareUrl).catch(() => {}) }}
          style={{
            fontFamily: MONO, fontSize: 10, color: text,
            background: 'none', border: `1px solid ${border}`, borderRadius: 4,
            padding: '4px 8px', outline: 'none', width: 190,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        />
      )}

    </footer>
  )
}
