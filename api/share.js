import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'

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

  // ── GET /api/share?id=<uuid>  →  return manifest ──────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const id  = url.searchParams.get('id')
    if (!id) return res.status(400).json({ error: 'id required' })

    const base = blobBaseUrl()
    if (!base) return res.status(500).json({ error: 'Blob store not configured' })

    const r = await fetch(`${base}/shares/${id}.json`)
    if (!r.ok) return res.status(404).json({ error: 'Share not found' })

    const manifest = await r.json()
    return res.status(200).json(manifest)
  }

  // ── POST /api/share  →  upload images + settings, return { id } ───────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body
  try {
    body = await readBody(req)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { entries = [], settings = {} } = body
  const id = randomUUID()

  try {
    const images = await Promise.all(
      entries.map(async ({ dataUrl, meta }, i) => {
        const [header, b64] = dataUrl.split(',')
        const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
        const ext  = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png'
        const buf  = Buffer.from(b64, 'base64')
        const blob = await put(`shares/${id}/${i}.${ext}`, buf, {
          access: 'public', contentType: mime,
        })
        return { url: blob.url, meta: meta ?? {} }
      })
    )

    await put(`shares/${id}.json`, JSON.stringify({ images, settings }), {
      access: 'public', contentType: 'application/json',
    })

    return res.status(200).json({ id })
  } catch (err) {
    console.error('Share upload failed:', err)
    return res.status(500).json({ error: String(err.message) })
  }
}
