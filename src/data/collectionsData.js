// ─── Collections data ─────────────────────────────────────────────────────────

import { LIBRARY_IMAGES } from './libraryImages.js'

export const COLLECTIONS = [
  {
    id: 'c1',
    slug: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warmth caught just before dark — the hour photographers live for.',
    imageIds: [1, 7, 3, 5],
    coverKey: 'M',
  },
  {
    id: 'c2',
    slug: 'wild-earth',
    name: 'Wild Earth',
    description: 'Untouched landscapes and the raw scale of the natural world.',
    imageIds: [4, 6, 2, 5],
    coverKey: 'C',
  },
  {
    id: 'c3',
    slug: 'open-water',
    name: 'Open Water',
    description: 'Oceans, horizons, and the meditative power of moving water.',
    imageIds: [3, 7, 4, 1],
    coverKey: 'S',
  },
]

export function getCollectionImages(slug) {
  const col = COLLECTIONS.find(c => c.slug === slug)
  if (!col) return []
  return col.imageIds.map(id => LIBRARY_IMAGES.find(img => img.id === id)).filter(Boolean)
}
