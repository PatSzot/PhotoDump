const MONO = '"IBM Plex Mono", monospace'

export default function RightPanel({ theme }) {
  const isDark  = theme === 'dark'
  const muted   = isDark ? 'rgba(240,237,228,0.38)' : 'rgba(26,26,24,0.35)'
  const bg      = isDark ? '#191812' : '#F0EDE4'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <aside className="panel panel--right"
      style={{ background: bg, borderLeft: `1px solid ${border}`, padding: '18px 16px' }}>

      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.13em', color: muted, textTransform: 'uppercase', marginBottom: 12 }}>
        About
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.9, color: muted }}>
        MYSCAPE<br />
        A personal photo viewer<br />
        built with Three.js.<br />
        <br />
        Upload your photos and<br />
        watch them float in space.<br />
        <br />
        Choose a preset, adjust<br />
        composition, export MP4.
      </div>

    </aside>
  )
}
