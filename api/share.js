import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { entries } = req.body

  if (!Array.isArray(entries) || !entries.length) {
    return res.status(400).json({ error: 'entries required' })
  }

  const id = randomUUID()

  try {
    const manifest = await Promise.all(
      entries.map(async ({ dataUrl, meta }, i) => {
        const [header, data] = dataUrl.split(',')
        const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
        const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
        const buffer = Buffer.from(data, 'base64')

        const blob = await put(`shares/${id}/${i}.${ext}`, buffer, {
          access: 'public',
          contentType: mime,
        })

        return { url: blob.url, meta: meta ?? {} }
      })
    )

    const manifestBlob = await put(
      `shares/${id}/manifest.json`,
      JSON.stringify(manifest),
      { access: 'public', contentType: 'application/json' }
    )

    res.status(200).json({ manifestUrl: manifestBlob.url })
  } catch (err) {
    console.error('Share failed:', err)
    res.status(500).json({ error: 'Upload failed' })
  }
}
