import { useState } from 'react'
import 'remixicon/fonts/remixicon.css'

function parseUsername(val) {
  return (
    val
      .trim()
      .replace(/https?:\/\/(www\.)?instagram\.com\/?/, '')
      .replace(/^@/, '')
      .replace(/\/$/, '')
      .split('?')[0]
      .split('/')[0]
      .toLowerCase() || null
  )
}

export default function SearchPanel({ onLoad, loading, error }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const username = parseUsername(value)
    if (!username || loading) return
    onLoad(username)
  }

  const btnActive = !loading && value.trim().length > 0

  return (
    <div style={s.root}>
      {error && (
        <p style={s.error}>
          <i className="ri-error-warning-line" style={{ marginRight: 6 }} />
          {error}
        </p>
      )}

      <form style={s.panel} onSubmit={handleSubmit}>
        <i className="ri-instagram-line" style={s.igIcon} />

        <input
          style={s.input}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Paste Instagram URL or @handle"
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
        />

        <button type="submit" style={s.btn(btnActive)} disabled={!btnActive}>
          {loading ? (
            <i className="ri-loader-4-line" style={s.spin} />
          ) : (
            <i className="ri-arrow-right-line" />
          )}
        </button>
      </form>
    </div>
  )
}

const s = {
  root: {
    position: 'fixed',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
    pointerEvents: 'none',
  },
  error: {
    pointerEvents: 'auto',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    color: '#888',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  panel: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 18,
    padding: '13px 14px 13px 18px',
    boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
    width: 380,
  },
  igIcon: {
    fontSize: 19,
    color: '#bbb',
    flexShrink: 0,
    lineHeight: 1,
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    color: '#111',
    outline: 'none',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
    minWidth: 0,
  },
  btn: active => ({
    flexShrink: 0,
    border: 'none',
    background: active ? '#000' : '#f0efec',
    color: active ? '#fff' : '#bbb',
    borderRadius: 11,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: active ? 'pointer' : 'default',
    fontSize: 16,
    transition: 'background 0.15s, color 0.15s',
    lineHeight: 1,
  }),
  spin: {
    animation: 'spin 0.75s linear infinite',
    display: 'block',
    lineHeight: 1,
  },
}
