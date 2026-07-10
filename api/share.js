import { put } from '@vercel/blob'

// Derive the public base URL of the blob store from the token
function blobBaseUrl() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? ''
  const m = token.match(/vercel_blob_rw_([^_]+)/)
  return m ? `https://${m[1]}.public.blob.vercel-storage.com` : null
}

// Reliably read and JSON-parse the request body (works in Vercel Node.js runtime)
async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const reqUrl = new URL(req.url, 'http://localhost')
  const action = reqUrl.searchParams.get('action')

  // ── GET /api/share?id=<uuid>  →  return manifest ──────────────────────────
  if (req.method === 'GET') {
    const id = reqUrl.searchParams.get('id')
    if (!id) return res.status(400).json({ error: 'id required' })

    const base = blobBaseUrl()
    if (!base) return res.status(500).json({ error: 'Blob store not configured' })

    const r = await fetch(`${base}/shares/${id}.json`)
    if (!r.ok) return res.status(404).json({ error: 'Share not found' })

    return res.status(200).json(await r.json())
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body
  try {
    body = await readBody(req)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  // ── POST /api/share?action=upload  →  upload one image, return { url, meta } ──
  // Each image is uploaded in its own request to stay well under Vercel's
  // 4.5 MB serverless function body limit.
  if (action === 'upload') {
    const { id, index, dataUrl, meta } = body
    if (!id || index == null || !dataUrl) {
      return res.status(400).json({ error: 'id, index, dataUrl required' })
    }
    try {
      const [header, b64] = dataUrl.split(',')
      const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
      const ext  = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png'
      const buf  = Buffer.from(b64, 'base64')
      const blob = await put(`shares/${id}/${index}.${ext}`, buf, {
        access: 'public', contentType: mime, addRandomSuffix: false,
      })
      return res.status(200).json({ url: blob.url, meta: meta ?? {} })
    } catch (err) {
      console.error('Image upload failed:', err)
      return res.status(500).json({ error: String(err.message) })
    }
  }

  // ── POST /api/share?action=manifest  →  save manifest JSON, return { id } ──
  // Body is tiny — just URLs and settings, no image data.
  if (action === 'manifest') {
    const { id, images, settings } = body
    if (!id) return res.status(400).json({ error: 'id required' })
    try {
      await put(
        `shares/${id}.json`,
        JSON.stringify({ images: images ?? [], settings: settings ?? {} }),
        { access: 'public', contentType: 'application/json', addRandomSuffix: false }
      )
      return res.status(200).json({ id })
    } catch (err) {
      console.error('Manifest upload failed:', err)
      return res.status(500).json({ error: String(err.message) })
    }
  }

  return res.status(400).json({ error: 'Unknown action. Use ?action=upload or ?action=manifest' })
}
