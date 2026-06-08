import { useState, useRef, useEffect } from 'react'
import 'remixicon/fonts/remixicon.css'
import ExportPanelContent from '../export/ExportPanel.jsx'
import '../styles/export.css'

const MONO = '"IBM Plex Mono", monospace'

export default function LeftPanel({
  theme, onThemeChange,
  corner, onCornerChange,
  images, onUploadClick,
  mode, onModeChange,
  // Export / preset props
  presetId, onPresetChange,
  bgColor, onBgChange,
  exportControls, onExportControlsChange,
  loopS, onLoopChange,
  exportFormat,
}) {
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 1024)
  const panelRef  = useRef(null)
  const toggleRef = useRef(null)

  // Auto-open on desktop resize
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setIsOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close on outside click (mobile/tablet only)
  useEffect(() => {
    function handleClick(e) {
      if (window.innerWidth >= 1024) return
      if (!isOpen) return
      if (panelRef.current?.contains(e.target)) return
      if (toggleRef.current?.contains(e.target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [isOpen])

  const isDark = theme === 'dark'
  const muted  = isDark ? 'rgba(240,237,228,0.42)' : 'rgba(26,26,24,0.38)'
  const text   = isDark ? '#f0ede4' : '#1a1a18'
  const rowBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'

  return (
    <>
      <button
        ref={toggleRef}
        className={`panel-toggle-btn${isOpen ? ' panel-toggle-btn--open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close panel' : 'Open panel'}
      >
        <i className={`toggle-icon ri-${isOpen ? 'close' : 'menu'}-line`} />
        <span className="toggle-label">Create</span>
      </button>

      <aside
        ref={panelRef}
        className={`panel panel--left ${isOpen ? 'panel--visible' : 'panel--hidden'} panel--wide`}
      >
        {/* Mode switcher — sticky, not scrollable */}
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          <div className="mode-switcher" style={{ margin: '0 0 12px' }}>
            {[
              { id: 'explore', icon: 'ri-compass-3-line', label: 'Explore' },
              { id: 'export',  icon: 'ri-film-line',      label: 'Export'  },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                className={`mode-btn ${mode === id ? 'mode-btn--active' : ''}`}
                onClick={() => onModeChange(id)}
              >
                <i className={icon} />
                {label}
              </button>
            ))}
          </div>

          {/* Upload Photos button — pinned below mode tabs */}
          <button
            onClick={onUploadClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 10px', marginBottom: 12, borderRadius: 5, border: 'none',
              cursor: 'pointer', background: rowBg, color: muted,
              fontFamily: MONO, fontSize: 10, letterSpacing: '0.07em',
            }}
          >
            <i className="ri-upload-2-line" style={{ fontSize: 13, color: text }} />
            {images.length > 0
              ? `${images.length} PHOTO${images.length !== 1 ? 'S' : ''} — ADD MORE`
              : 'UPLOAD PHOTOS'}
          </button>
        </div>

        {/* Scrollable panel body — same content for both modes */}
        <div className="panel-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          <ExportPanelContent
            presetId={presetId}
            onPresetChange={onPresetChange}
            bgColor={bgColor}
            onBgChange={onBgChange}
            controls={exportControls}
            onControlsChange={onExportControlsChange}
            loopS={loopS}
            onLoopChange={onLoopChange}
            photoCount={images.length}
            exportFormat={exportFormat}
            corner={corner}
            onCornerChange={onCornerChange}
            theme={theme}
            onThemeChange={onThemeChange}
          />
        </div>
      </aside>
    </>
  )
}
