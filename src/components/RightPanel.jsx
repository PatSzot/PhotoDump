const MONO     = '"IBM Plex Mono", monospace'
const HEADLINE = '"Zalando Sans SemiExpanded", sans-serif'

export default function RightPanel({ theme }) {
  const isDark = theme === 'dark'
  const text   = isDark ? '#f0ede4' : '#1a1a18'
  const muted  = isDark ? 'rgba(240,237,228,0.38)' : 'rgba(26,26,24,0.35)'

  return (
    <aside className="panel panel--right">

      <div className="panel-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.13em', color: muted, textTransform: 'uppercase', marginBottom: 16 }}>
          About
        </div>

        <div style={{ fontFamily: HEADLINE, fontSize: 18, fontWeight: 600, color: text, letterSpacing: '-0.01em', lineHeight: 1.25, marginBottom: 16 }}>
          My Scape.
        </div>

        <div style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.85, color: muted }}>
          A fun way to share, explore,<br />
          and view your photos.<br />
          <br />
          Upload your photos.<br />
          Choose a preset and share<br />
          as a link or video for<br />
          social media.
        </div>
      </div>

    </aside>
  )
}
