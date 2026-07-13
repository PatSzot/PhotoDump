import { useState } from 'react'
import 'remixicon/fonts/remixicon.css'
import '../styles/export.css'

const MONO = '"IBM Plex Mono", monospace'

// Copy text to clipboard, using the ClipboardItem+Promise trick so the write
// survives an async gap on iOS Safari (requires gesture context at call time).
function copyToClipboard(textPromise) {
  if (navigator.clipboard?.write && window.ClipboardItem) {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': Promise.resolve(textPromise).then(
          t => new Blob([t], { type: 'text/plain' })
        ),
      }),
    ])
  }
  // Fallback: works on desktop when called after await (gesture context is fine)
  return Promise.resolve(textPromise).then(t => navigator.clipboard.writeText(t))
}

export default function ShareDock({ onShare }) {
  const [state,    setState]    = useState('idle') // idle | sharing | done | failed
  const [shareUrl, setShareUrl] = useState('')
  const [copied,   setCopied]   = useState(false)

  function flashCopied() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleShare() {
    setState('sharing')
    setShareUrl('')
    setCopied(false)

    // Kick off clipboard write synchronously (preserves gesture context on iOS).
    // The Promise resolves when onShare() finishes — clipboard receives the URL then.
    const urlPromise = onShare()
    copyToClipboard(urlPromise).then(flashCopied).catch(() => {})

    try {
      const url = await urlPromise
      setShareUrl(url)
      setState('done')
    } catch (err) {
      console.error('Share failed:', err)
      setState('failed')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  async function handleRecopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      flashCopied()
    } catch { /* user can manually select the input */ }
  }

  // ── Done state: single URL row replaces the button entirely ─────────────────
  if (state === 'done' && shareUrl) {
    return (
      <div className="ep-dock">
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <i
              className="ri-check-line"
              style={{ fontSize: 14, flexShrink: 0, padding: '0 10px 0 13px', color: 'rgba(160,240,180,0.8)' }}
            />
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
                padding: '10px 0',
                outline: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            />
            <button
              onClick={handleRecopy}
              title="Copy link"
              style={{
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                color: copied ? 'rgba(160,240,180,0.9)' : 'rgba(240,237,228,0.45)',
                cursor: 'pointer',
                padding: '0 13px',
                height: 38,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: '0.06em',
                transition: 'color 0.15s',
              }}
            >
              <i className={copied ? 'ri-check-line' : 'ri-clipboard-line'} style={{ fontSize: 13 }} />
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Idle / sharing / failed state: single button ─────────────────────────────
  const label =
    state === 'sharing' ? 'Creating link…'          :
    state === 'failed'  ? 'Upload failed — try again' :
                          'Create a share link'

  const btnClass =
    `ep-cta ep-cta--share` +
    (state === 'failed' ? ' ep-cta--fail' : '')

  return (
    <div className="ep-dock">
      <div className="ep-toolbar" style={{ justifyContent: 'center', gap: 0 }}>
        <button
          className={btnClass}
          disabled={state === 'sharing'}
          onClick={handleShare}
          style={{ flex: 1 }}
        >
          {state === 'idle'    && <i className="ri-global-line"        style={{ fontSize: 18, flexShrink: 0 }} />}
          {state === 'sharing' && <i className="ri-loader-4-line"      style={{ fontSize: 18, flexShrink: 0, opacity: 0.6 }} />}
          {state === 'failed'  && <i className="ri-error-warning-line" style={{ fontSize: 18, flexShrink: 0 }} />}
          <span className="ep-cta-label">{label}</span>
        </button>
      </div>
    </div>
  )
}
