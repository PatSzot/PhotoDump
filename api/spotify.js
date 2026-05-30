// Spotify client credentials token cache
let cachedToken = null
let tokenExpiry = 0

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(
          `${process.env.Spotify_Client_ID}:${process.env.Spotify_Secret}`
        ).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()
  if (!data.access_token) throw new Error('Spotify auth failed')

  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { q } = req.query
  if (!q || !q.trim()) return res.status(400).json({ error: 'Missing query' })

  try {
    const token = await getToken()

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=15`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await searchRes.json()

    const tracks = (data.tracks?.items ?? [])
      .filter(t => t.preview_url)
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        name: t.name,
        artist: t.artists[0]?.name ?? '',
        previewUrl: t.preview_url,
        albumArt: t.album.images[1]?.url ?? t.album.images[0]?.url ?? null,
      }))

    res.json(tracks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
