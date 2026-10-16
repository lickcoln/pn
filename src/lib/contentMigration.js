// Saved content (published to Supabase, or kept in a browser) is a full snapshot, so it keeps showing
// the copy it was saved with even after the defaults in bandData.js change. This one-time migration
// swaps every item that still matches its old default for the current default, and keeps anything an
// admin edited. It exists because the default copy was rewritten in English (content version 2).

export const CONTENT_VERSION = 2

// Fingerprints of each default item as it was before the English rewrite.
const LEGACY_FINGERPRINTS = {
  members: {
    arief: '086138dd',
    ganjar: '273b3165',
    kimao: 'b704bddd'
  },
  singles: {
    'mesin-waktu': 'd7bbb06e',
    'diamkan-aku': '40f5d551',
    'i-dont-surrender': '874f129e',
    'aku-trauma': 'e957ae58',
    'on-antarctica': '7d516de7',
    pengkhianat: '4013dd97',
    'ive-got-my-vision': 'ba85b6ec'
  },
  gigs: {
    'gig-1': '36367953',
    'gig-2': 'e49fc28a',
    'gig-3': '2e42a9a3',
    'gig-4': 'bb3b070f',
    'gig-past-1': 'd1954a7c'
  },
  merch: {
    'merch-tshirt-1': '2e413591',
    'merch-hoodie-1': '448c1d54',
    'merch-cassette': 'a0c2224e',
    'merch-cap': 'cebcc92b',
    'merch-pick-set': 'cd184a9c',
    'merch-stickers': '5c90739a'
  }
}

// JSON with sorted keys: Postgres jsonb does not keep key order, so a saved item must hash the same
// whatever order its keys come back in.
export function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}'
  }
  return JSON.stringify(value)
}

// FNV-1a, 32 bit
export function fingerprint(value) {
  const text = stableStringify(value)
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function migrateLegacyContent(saved, defaults) {
  if (!saved || typeof saved !== 'object' || saved.contentVersion >= CONTENT_VERSION) return saved

  const migrated = { ...saved }
  for (const [key, legacy] of Object.entries(LEGACY_FINGERPRINTS)) {
    if (!Array.isArray(saved[key])) continue
    const current = new Map(defaults[key].map((item) => [item.id, item]))
    migrated[key] = saved[key].map((item) => {
      const untouched = legacy[item?.id] && fingerprint(item) === legacy[item.id]
      return untouched && current.has(item.id) ? current.get(item.id) : item
    })
  }
  return migrated
}
