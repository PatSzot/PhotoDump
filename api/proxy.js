const ALLOWED = ['cdninstagram.com', 'fbcdn.net', 'instagram.com', 'scontent']

export default async function handler(req, res) {
  const raw = req.query.url
  if (!raw) return res.status(400).send('url required')

  let decoded
  try {
    decoded = decodeURIComponent(raw)
    const { hostname } = new URL(decoded)
    if (!ALLOWED.some(d => hostname.includes(d))) {
      return res.status(403).send('Forbidden domain')
    }
  } catch {
    return res.status(400).send('Invalid url')
  }

  try {
    const upstream = await fetch(decoded, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://www.instagram.com/',
      },
    })

    if (!upstream.ok) return res.status(upstream.status).send('Upstream error')

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).send(Buffer.from(buffer))
  } catch (err) {
    return res.status(500).send(err.message)
  }
}
