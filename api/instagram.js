export default async function handler(req, res) {
  const { username } = req.query
  if (!username) return res.status(400).json({ error: 'username required' })

  const clean = username.replace(/^@/, '').toLowerCase().split('/')[0]

  const headers = {
    'x-ig-app-id': '936619743392459',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.instagram.com/',
  }

  try {
    const r = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${clean}`,
      { headers }
    )

    if (r.status === 404) return res.status(404).json({ error: 'Profile not found' })
    if (r.status === 401 || r.status === 403)
      return res.status(403).json({ error: 'Profile is private or requires login' })
    if (!r.ok) throw new Error(`Instagram returned ${r.status}`)

    const data = await r.json()
    const user = data?.data?.user
    if (!user) return res.status(404).json({ error: 'Profile not found or private' })

    const edges = user.edge_owner_to_timeline_media?.edges ?? []
    const images = edges
      .filter(e => e.node?.display_url)
      .map(e => ({
        url: e.node.display_url,
        thumbnail: e.node.thumbnail_src ?? e.node.display_url,
      }))
      .slice(0, 24)

    if (!images.length)
      return res.status(404).json({ error: 'No public images found' })

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ username: user.username, images })
  } catch (err) {
    return res.status(500).json({ error: 'Could not load profile — it may be private or rate-limited' })
  }
}
