// Share page for /s/:id — serves proper OG meta tags for crawlers (iMessage,
// Slack, Discord, etc.) then redirects browsers to the actual SPA.
//
// Vercel rewrite in vercel.json: /s/:id → /api/s?id=:id

function blobBaseUrl() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? ''
  const m = token.match(/vercel_blob_rw_([^_]+)/)
  return m ? `https://${m[1]}.public.blob.vercel-storage.com` : null
}

function getOrigin(req) {
  const host  = req.headers['x-forwarded-host'] || req.headers.host || 'myscape.vercel.app'
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${host}`
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const id  = url.searchParams.get('id')
  if (!id) return res.status(400).send('Missing share ID')

  // Fetch the manifest to get OG image URL and photo count
  let manifest = null
  try {
    const base = blobBaseUrl()
    if (base) {
      const r = await fetch(`${base}/shares/${id}.json`)
      if (r.ok) manifest = await r.json()
    }
  } catch { /* fall through to defaults */ }

  const origin  = getOrigin(req)
  const appUrl  = `${origin}/?view&s=${encodeURIComponent(id)}`
  const count   = manifest?.images?.length ?? 0
  const ogImage = manifest?.settings?.ogImage ?? `${origin}/MyScape-OpenGraphImage.jpg`
  const title   = count > 0
    ? `${count} photo${count !== 1 ? 's' : ''} on Myscape`
    : 'Myscape'
  const description = count > 0
    ? `View this collection of ${count} photo${count !== 1 ? 's' : ''} on Myscape.`
    : 'A fun way to view your camera roll.'

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Cache for 1 hour on CDN, 5 min in browser
  res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=300')
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>

  <meta property="og:title"       content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image"       content="${esc(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type"        content="website">
  <meta property="og:url"         content="${esc(appUrl)}">

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image"       content="${esc(ogImage)}">

  <!-- Redirect browsers immediately; crawlers read the meta tags above -->
  <meta http-equiv="refresh" content="0;url=${esc(appUrl)}">
</head>
<body>
  <script>window.location.replace(${JSON.stringify(appUrl)})</script>
</body>
</html>`)
}
