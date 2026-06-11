// ─── Stock photo library data ─────────────────────────────────────────────────
// 7 photos from the public folder, with rich metadata for filtering and display.

export const CATEGORIES = ['All', 'Landscape', 'Nature', 'Urban', 'Architecture', 'Aerial', 'Abstract']
export const ASPECT_RATIOS = ['All', 'landscape', 'portrait', 'square']

export const LIBRARY_IMAGES = [
  {
    id: 1,
    key: 'M',
    url: '/M.jpg',
    title: 'Mountain Light',
    description: 'Golden hour sweeps across jagged peaks, long shadows stretching over stone and snow.',
    category: 'Landscape',
    tags: ['mountain', 'golden hour', 'peaks', 'dramatic', 'stone'],
    aspectRatio: 'portrait',
    dominantColors: ['#3a2e1e', '#c8974a', '#e8d5a0', '#7a6040'],
  },
  {
    id: 2,
    key: 'Y',
    url: '/Y.jpg',
    title: 'Yellow Fields',
    description: 'Endless rows of canola stretch to the horizon under a pale morning sky.',
    category: 'Nature',
    tags: ['fields', 'yellow', 'agriculture', 'horizon', 'morning'],
    aspectRatio: 'landscape',
    dominantColors: ['#d4b830', '#8fa830', '#e8d880', '#5a7020'],
  },
  {
    id: 3,
    key: 'S',
    url: '/S.jpg',
    title: 'Sea Horizon',
    description: 'A calm expanse of ocean meets dusk sky — stillness held in warm tones.',
    category: 'Landscape',
    tags: ['ocean', 'sea', 'horizon', 'dusk', 'calm', 'water'],
    aspectRatio: 'landscape',
    dominantColors: ['#1a2840', '#4a6888', '#c87848', '#e8c080'],
  },
  {
    id: 4,
    key: 'C',
    url: '/C.jpg',
    title: 'Coastal Cliffs',
    description: 'Ancient rock faces carved by millennia of wave and wind — raw, uncompromising.',
    category: 'Landscape',
    tags: ['cliffs', 'coastal', 'rock', 'dramatic', 'ocean', 'raw'],
    aspectRatio: 'square',
    dominantColors: ['#3a3020', '#7a6840', '#c0a870', '#607080'],
  },
  {
    id: 5,
    key: 'A',
    url: '/A.jpg',
    title: 'Aerial Canvas',
    description: 'From altitude, the earth becomes a painter\'s study in pattern and color.',
    category: 'Aerial',
    tags: ['aerial', 'overhead', 'pattern', 'abstract', 'texture'],
    aspectRatio: 'landscape',
    dominantColors: ['#4a6030', '#8ab050', '#c8e070', '#2a3820'],
  },
  {
    id: 6,
    key: 'P',
    url: '/P.jpg',
    title: 'Pine Forest',
    description: 'Light filters through ancient pines, cathedral columns of bark and shadow.',
    category: 'Nature',
    tags: ['forest', 'pine', 'trees', 'light', 'shadow', 'cathedral'],
    aspectRatio: 'portrait',
    dominantColors: ['#1a2810', '#3a5820', '#6a9040', '#a8c870'],
  },
  {
    id: 7,
    key: 'E',
    url: '/E.jpg',
    title: 'Earth Haze',
    description: 'Atmospheric layers diffuse the boundary between land and sky at day\'s end.',
    category: 'Abstract',
    tags: ['atmosphere', 'haze', 'earth', 'abstract', 'layers', 'dusk'],
    aspectRatio: 'landscape',
    dominantColors: ['#c87840', '#e8a060', '#f0d098', '#8a5030'],
  },
]

export function filterImages({ query = '', category = 'All', aspectRatio = 'All' }) {
  const q = query.toLowerCase().trim()
  return LIBRARY_IMAGES.filter(img => {
    if (category !== 'All' && img.category !== category) return false
    if (aspectRatio !== 'All' && img.aspectRatio !== aspectRatio) return false
    if (q) {
      const haystack = [img.title, img.category, ...img.tags, img.description].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}
