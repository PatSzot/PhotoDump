import 'remixicon/fonts/remixicon.css'
import { PRESET_IDS, PRESETS } from '../lib/presets.js'

const MONO     = '"IBM Plex Mono", monospace'
const HEADLINE = '"Zalando Sans SemiExpanded", sans-serif'

const SLIDERS = [
  { label: 'SPEED',  key: 'speed',  min: 0.1, max: 3.0, step: 0.05 },
  { label: 'ZOOM',   key: 'zoom',   min: 0.5, max: 3.5, step: 0.05 },
  { label: 'RADIUS', key: 'radius', min: 0.5, max: 4.0, step: 0.05 },
  { label: 'SCALE',  key: 'scale',  min: 0.2, max: 2.0, step: 0.05 },
  { label: 'COUNT',  key: 'count',  min: 5,   max: 50,  step: 1     },
]

export default function LeftPanel({
  theme, onThemeChange,
  corners, onCornersChange,
  scapeName, onScapeNameChange,
  presetId, controls, onPresetChange, onControlsChange,
  duration, onDurationChange,
  images, onUploadClick, onDelete,
  exporting, exportProgress, onExport,
}) {
  const isDark  = theme === 'dark'
  const text    = isDark ? '#f0ede4' : '#1a1a18'
  const muted   = isDark ? 'rgba(240,237,228,0.42)' : 'rgba(26,26,24,0.38)'
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const bg      = isDark ? '#191812' : '#F0EDE4'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const rowBg   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const accent  = text
  const toggleOff = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)'

  function Label({ children }) {
    return (
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.13em', color: muted, textTransform: 'uppercase', marginBottom: 10 }}>
        {children}
      </div>
    )
  }

  function Divider() {
    return <div style={{ height: 1, background: divider, margin: '4px -16px 4px' }} />
  }

  function SliderValue(key) {
    return key === 'count'
      ? Math.round(controls[key])
      : controls[key].toFixed(2)
  }

  const canExport = images.length > 0 && presetId !== 'explore' && !exporting

  return (
    <aside className="panel panel--left"
      style={{ background: bg, borderRight: `1px solid ${border}`, padding: '18px 16px', gap: 0 }}>

      {/* ── Photos ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 18 }}>
        <Label>Photos</Label>
        <button onClick={onUploadClick} style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '7px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
          background: rowBg, color: muted,
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.07em',
        }}>
          <i className="ri-upload-2-line" style={{ fontSize: 13, color: text }} />
          {images.length > 0 ? `${images.length} PHOTO${images.length !== 1 ? 'S' : ''} — ADD MORE` : 'UPLOAD PHOTOS'}
        </button>

        {images.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 148, overflowY: 'auto' }}>
            {images.map(({ url, meta }, i) => (
              <div key={url} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 2px', borderBottom: `1px solid ${divider}`,
              }}>
                <img src={url} alt="" style={{ width: 28, height: 28, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: MONO, fontSize: 9, color: muted, letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {meta?.date ? meta.date.toUpperCase() : `PHOTO ${i + 1}`}
                </span>
                <button onClick={() => onDelete(url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: '2px 3px', lineHeight: 1 }}>
                  <i className="ri-close-line" style={{ fontSize: 11 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* ── Preset ─────────────────────────────────────────────────────── */}
      <section style={{ margin: '16px 0' }}>
        <Label>Preset</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {PRESET_IDS.map(id => (
            <button key={id} onClick={() => onPresetChange(id)} style={{
              background: presetId === id ? rowBg : 'none',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em',
              color: presetId === id ? text : muted,
              padding: '6px 8px', borderRadius: 4,
              transition: 'color 0.12s, background 0.12s',
            }}>
              {PRESETS[id].label}
            </button>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Composition sliders ────────────────────────────────────────── */}
      {presetId !== 'explore' ? (
        <section style={{ margin: '16px 0' }}>
          <Label>Composition</Label>
          {SLIDERS.map(({ label, key, min, max, step }) => (
            <div key={key} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', color: muted, textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: text, fontVariantNumeric: 'tabular-nums' }}>
                  {SliderValue(key)}
                </span>
              </div>
              <input type="range" min={min} max={max} step={step} value={controls[key]}
                onChange={e => onControlsChange({ ...controls, [key]: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: accent, cursor: 'pointer', display: 'block' }}
              />
            </div>
          ))}
        </section>
      ) : (
        <section style={{ margin: '16px 0', fontFamily: MONO, fontSize: 10, lineHeight: 1.8, color: muted }}>
          Drag to explore<br />Scroll to zoom<br />Two-finger to pan
        </section>
      )}

      <Divider />

      {/* ── Video ──────────────────────────────────────────────────────── */}
      <section style={{ margin: '16px 0' }}>
        <Label>Video</Label>
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loop</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: text }}>{duration}s</span>
          </div>
          <input type="range" min={4} max={30} step={1} value={duration}
            onChange={e => onDurationChange(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: accent, cursor: 'pointer', display: 'block' }}
          />
        </div>

        <button onClick={onExport} disabled={!canExport} style={{
          marginTop: 10, width: '100%', padding: '8px 0', borderRadius: 5, border: 'none',
          background: canExport ? rowBg : 'transparent',
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.09em',
          color: canExport ? text : muted,
          cursor: canExport ? 'pointer' : 'default',
          opacity: (!images.length || presetId === 'explore') ? 0.38 : 1,
          transition: 'all 0.15s',
        }}>
          {exporting ? `EXPORTING… ${Math.round(exportProgress * 100)}%` : 'EXPORT MP4'}
        </button>

        {exporting && (
          <div style={{ marginTop: 6, height: 2, borderRadius: 1, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${exportProgress * 100}%`, background: text, transition: 'width 0.3s linear', borderRadius: 1 }} />
          </div>
        )}
      </section>

      <Divider />

      {/* ── Style ──────────────────────────────────────────────────────── */}
      <section style={{ margin: '16px 0' }}>
        <Label>Style</Label>

        {/* Scape name */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.09em', color: muted, textTransform: 'uppercase', marginBottom: 6 }}>Name</div>
          <input
            type="text" placeholder="Untitled Scape" value={scapeName}
            onChange={e => onScapeNameChange(e.target.value)}
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              background: 'transparent', border: 'none',
              borderBottom: `1px solid ${divider}`,
              color: text, fontFamily: HEADLINE, fontSize: 15, fontWeight: 500,
              padding: '2px 0 6px', outline: 'none', caretColor: text,
            }}
          />
        </div>

        {/* Rounded corners */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, cursor: 'pointer' }}
          onClick={() => onCornersChange(corners === 'rounded' ? 'sharp' : 'rounded')}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Rounded Corners</span>
          <Toggle on={corners === 'rounded'} text={text} bg={isDark ? '#191812' : '#F0EDE4'} off={toggleOff} />
        </div>

        {/* Dark mode */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => onThemeChange(isDark ? 'light' : 'dark')}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Dark Mode</span>
          <Toggle on={isDark} text={text} bg={isDark ? '#191812' : '#F0EDE4'} off={toggleOff} />
        </div>
      </section>

    </aside>
  )
}

function Toggle({ on, text, bg, off }) {
  return (
    <div style={{
      width: 32, height: 18, borderRadius: 9, flexShrink: 0, position: 'relative',
      background: on ? text : off, transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%',
        background: on ? bg : 'rgba(255,255,255,0.5)',
        transform: on ? 'translateX(16px)' : 'translateX(2px)',
        transition: 'transform 0.2s',
      }} />
    </div>
  )
}
