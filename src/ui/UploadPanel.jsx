import { useRef } from 'react'
import 'remixicon/fonts/remixicon.css'

const MAX_PER_PICK = 100

export default function UploadPanel({ onLoad, count, progress }) {
  const inputRef = useRef(null)
  const isLoading = progress !== null

  function openPicker() {
    if (isLoading) return
    inputRef.current?.click()
  }

  function handleChange(e) {
    const files = Array.from(e.target.files ?? [])
      .filter(f => f.type.startsWith('image/'))
      .slice(0, MAX_PER_PICK)
    if (!files.length) return
    const urls = files.map(f => URL.createObjectURL(f))
    onLoad(urls)
    e.target.value = ''
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        style={{ position: 'fixed', top: '-200px', left: '-200px', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
      />

      <div style={s.root}>

        {/* ── Loading progress ── */}
        {isLoading && (
          <div style={s.card}>
            <div style={s.progressHeader}>
              <i className="ri-image-2-line" style={{ fontSize: 15, color: '#aaa' }} />
              <span style={s.progressLabel}>Loading textures…</span>
              <span style={s.progressCount}>{progress.done} / {progress.total}</span>
            </div>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* ── Loaded pill ── */}
        {!isLoading && count > 0 && (
          <div style={s.pill}>
            <i className="ri-image-2-line" style={{ fontSize: 14, color: '#aaa' }} />
            <span style={s.pillCount}>{count}</span>
            <span style={s.pillLabel}>photo{count !== 1 ? 's' : ''}</span>
            <div style={s.pillDivider} />
            <button style={s.addBtn} onClick={openPicker}>
              <i className="ri-add-line" style={{ marginRight: 4 }} />
              Add more
            </button>
          </div>
        )}

        {/* ── Initial CTA ── */}
        {!isLoading && count === 0 && (
          <div style={s.card}>
            <button style={s.mainBtn} onClick={openPicker}>
              <div style={s.iconWrap}>
                <i className="ri-image-2-line" style={{ fontSize: 22 }} />
              </div>
              <div style={s.mainText}>
                <span style={s.mainLabel}>Select from Camera Roll</span>
                <span style={s.mainSub}>Up to {MAX_PER_PICK} photos</span>
              </div>
              <i className="ri-arrow-right-s-line" style={s.chevron} />
            </button>

            <div style={s.dividerH} />

            <button style={s.autoBtn} onClick={openPicker}>
              <i className="ri-flashlight-line" style={{ marginRight: 8, fontSize: 15 }} />
              Auto-fill — select all &amp; we'll use the first {MAX_PER_PICK}
            </button>
          </div>
        )}

      </div>
    </>
  )
}

const s = {
  root: {
    position: 'fixed',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    width: 'calc(100vw - 40px)',
    maxWidth: 400,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // ── Shared card shell ──
  card: {
    pointerEvents: 'auto',
    width: '100%',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(0,0,0,0.09)',
    overflow: 'hidden',
  },

  // ── Progress card ──
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '16px 20px 10px',
  },
  progressLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
    fontFamily: 'inherit',
  },
  progressCount: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'inherit',
    fontVariantNumeric: 'tabular-nums',
  },
  progressTrack: {
    margin: '0 20px 16px',
    height: 3,
    borderRadius: 2,
    background: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#000',
    borderRadius: 2,
    transition: 'width 0.15s ease-out',
  },

  // ── Initial card ──
  mainBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: '18px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  mainText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#000',
    letterSpacing: '-0.01em',
    fontFamily: 'inherit',
  },
  mainSub: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'inherit',
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
    flexShrink: 0,
  },
  dividerH: {
    height: 1,
    background: 'rgba(0,0,0,0.06)',
    margin: '0 20px',
  },
  autoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '15px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: '#888',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },

  // ── Loaded pill ──
  pill: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 50,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '10px 12px 10px 14px',
  },
  pillCount: {
    fontSize: 15,
    fontWeight: 700,
    color: '#000',
    fontFamily: 'inherit',
  },
  pillLabel: {
    fontSize: 13,
    color: '#aaa',
    fontFamily: 'inherit',
  },
  pillDivider: {
    width: 1,
    height: 14,
    background: 'rgba(0,0,0,0.1)',
    margin: '0 2px',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: '#444',
    padding: '4px 8px',
    borderRadius: 8,
    fontFamily: 'inherit',
    fontWeight: 500,
  },
}
