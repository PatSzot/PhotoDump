import { useState } from 'react'
import 'remixicon/fonts/remixicon.css'
import '../styles/export.css'

const MONO = '"IBM Plex Mono", monospace'

export default function ShareDock({ onShare }) {
  const [state,    setState]    = useState('idle') // idle | sharing | done | failed
  const [shareUrl, setShareUrl] = useState('')
  const [didCopy,  setDidCopy]  = useState(false)

  async function handleShare() {
    setState('sharing')
    setShareUrl('')
    setDidCopy(false)
    try {
      const url = await onShare()
      setShareUrl(url)
      setState('done')
      // Best-effort clipboard copy; failure is fine — URL is shown below
      try {
        await navigator.clipboard.writeText(url)
        setDidCopy(true)
      } catch { /* show input as fallback */ }
    } catch (err) {
      console.error('Share failed:', err)
      setState('failed')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  async function handleCopyInput(url) {
    try {
      await navigator.clipboard.writeText(url)
      setDidCopy(true)
      setTimeout(() => setDidCopy(false), 2500)
    } catch { /* user can manually select */ }
  }

  const label =
    state === 'sharing' ? 'Creating link…'    :
    state === 'done'    ? (didCopy ? 'Link copied!' : 'Link ready!') :
    state === 'failed'  ? 'Upload failed — try again' :
                          'Create a share link'

  const btnClass =
    `ep-cta ep-cta--share` +
    (state === 'done'   ? ' ep-cta--success' : '') +
    (state === 'failed' ? ' ep-cta--fail'    : '')

  return (
    <div className="ep-dock">
      <div className="ep-toolbar" style={{ justifyContent: 'center', gap: 0 }}>
        <button
          className={btnClass}
          disabled={state === 'sharing'}
          onClick={state === 'done' ? undefined : handleShare}
          style={{ flex: 1 }}
        >
          {state === 'idle'    && <i className="ri-global-line"    style={{ fontSize: 18, flexShrink: 0 }} />}
          {state === 'sharing' && <i className="ri-loader-4-line"  style={{ fontSize: 18, flexShrink: 0, opacity: 0.6 }} />}
          {state === 'done'    && <i className="ri-check-line"     style={{ fontSize: 18, flexShrink: 0 }} />}
          {state === 'failed'  && <i className="ri-error-warning-line" style={{ fontSize: 18, flexShrink: 0 }} />}
          <span className="ep-cta-label">{label}</span>
        </button>
      </div>

      {state === 'done' && shareUrl && (
        <div style={{ padding: '0 12px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <input
              readOnly
              value={shareUrl}
              onFocus={e => e.target.select()}
              onClick={e => e.target.select()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'rgba(240,237,228,0.8)',
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.02em',
                padding: '9px 10px',
                outline: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            />
            <button
              onClick={() => handleCopyInput(shareUrl)}
              title="Copy link"
              style={{
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                color: didCopy ? 'rgba(160,240,180,0.9)' : 'rgba(240,237,228,0.5)',
                cursor: 'pointer',
                padding: '0 12px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
            >
              <i className={didCopy ? 'ri-check-line' : 'ri-clipboard-line'} style={{ fontSize: 14 }} />
            </button>
          </div>
          <div style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.06em',
            color: 'rgba(240,237,228,0.3)',
            marginTop: 6,
            textAlign: 'center',
          }}>
            {didCopy ? 'COPIED TO CLIPBOARD' : 'TAP TO SELECT  ·  SHARE ANYWHERE'}
          </div>
        </div>
      )}
    </div>
  )
}
