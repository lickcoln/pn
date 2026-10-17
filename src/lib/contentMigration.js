// Saved content (published to Supabase, or kept in a browser) is a full snapshot, so it keeps showing
// the copy it was saved with even after the defaults in bandData.js change. This migration swaps every item
// that still matches an OLD default for the current default, and keeps anything an admin edited.
//
//   version 2: the default copy was rewritten in English
//   version 3: the band bio was proofread, and the photos of the defaults became smaller WebP files
//
// To change a default in the future: compute the fingerprint of every item that will change BEFORE editing
// bandData.js, add it to the lists below, and raise CONTENT_VERSION by one.

export const CONTENT_VERSION = 3

// Fingerprints of each default item as it was in earlier versions (oldest first: Indonesian, English v2).
// An item that still has one of them was never edited, so it is replaced by the current default.
const LEGACY_FINGERPRINTS = {
  members: {
    arief: ['086138dd', '65340108'],
    ganjar: ['273b3165', '1189ace0'],
    kimao: ['b704bddd', 'be8d1ab8']
  },
  singles: {
    'mesin-waktu': ['d7bbb06e', 'f592d07b'],
    'diamkan-aku': ['40f5d551', 'ee33ce39'],
    'i-dont-surrender': ['874f129e', 'd2d041c0'],
    'aku-trauma': ['e957ae58', '122dba75'],
    'on-antarctica': ['7d516de7', '8243cb77'],
    pengkhianat: ['4013dd97', 'f5542792'],
    'ive-got-my-vision': ['ba85b6ec', 'a155a9cc']
  },
  gigs: {
    'gig-1': ['36367953', 'd16902ac'],
    'gig-2': ['e49fc28a', '0fb5149e'],
    'gig-3': ['2e42a9a3', '6b2c6a68'],
    'gig-4': ['bb3b070f', '3230cafe'],
    'gig-past-1': ['d1954a7c', 'e612a6b3']
  },
  merch: {
    'merch-tshirt-1': ['2e413591', 'cdf2fc31'],
    'merch-hoodie-1': ['448c1d54', 'f303a813'],
    'merch-cassette': ['a0c2224e', '92eb28ff'],
    'merch-cap': ['cebcc92b', '2116c941'],
    'merch-pick-set': ['cd184a9c', '0f631b83'],
    'merch-stickers': ['5c90739a', 'a2c31e7f']
  }
}

// The band bio before it was proofread (it had typos such as "frustation" and "reminiscent oh")
const LEGACY_BIO = ['cc8ddbd3']

// The photo each site-wide image slot used before the WebP versions. A slot that still points at one of
// these was never changed by the admin, so it moves to the current default.
const LEGACY_IMAGES = {
  heroBackground: ['/band/band_rock_9_1264x840.png'],
  lineupBanner: ['/band/band_rock_8_1254x1254.png'],
  profileBanner: ['/band/band_rock_10_1270x763.png'],
  profilePortrait: ['/band/band_rock_3_1269x1269.png'],
  profileTileLeft: ['/band/band_rock_7_1269x1267.png'],
  profileTileRight: ['/band/band_rock_2_1247x690.png']
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

/**
 * @param saved    the content as it was saved
 * @param defaults the current defaults: { members, singles, gigs, merch, bio, images }
 */
export function migrateLegacyContent(saved, defaults) {
  if (!saved || typeof saved !== 'object' || saved.contentVersion >= CONTENT_VERSION) return saved

  const migrated = { ...saved }

  for (const [key, legacy] of Object.entries(LEGACY_FINGERPRINTS)) {
    if (!Array.isArray(saved[key])) continue
    const current = new Map(defaults[key].map((item) => [item.id, item]))
    migrated[key] = saved[key].map((item) => {
      const untouched = legacy[item?.id]?.includes(fingerprint(item))
      return untouched && current.has(item.id) ? current.get(item.id) : item
    })
  }

  if (typeof saved.bio === 'string' && LEGACY_BIO.includes(fingerprint(saved.bio))) {
    migrated.bio = defaults.bio
  }

  if (saved.images && typeof saved.images === 'object') {
    migrated.images = { ...saved.images }
    for (const [slot, oldPaths] of Object.entries(LEGACY_IMAGES)) {
      if (oldPaths.includes(saved.images[slot])) migrated.images[slot] = defaults.images[slot]
    }
  }

  return migrated
}
