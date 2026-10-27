// Saved content is JSON that came from a form, an import or a database, so it can have the wrong shape
// (a list that is not a list, a price that is text, an item without sizes). One broken value must never
// blank the public site, so every saved config is straightened out here before the components see it.

import { isValidEmail, isValidWhatsApp, normalizeWhatsApp } from './contactInfo'
import { formatIdr } from './format'

const text = (value, fallback = '') => (typeof value === 'string' ? value : value == null ? fallback : String(value))
const record = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})

// Keeps a list as the admin left it (even empty), but drops entries that are not objects and gives every
// entry an id. Anything that is not a list at all is replaced by the defaults.
function list(value, fallback, prefix, normalize) {
  if (!Array.isArray(value)) return fallback
  return value
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item, i) => normalize({ ...item, id: text(item.id) || `${prefix}-${i + 1}` }))
}

// A number stays as it is. Text such as "Rp 185.000" or "185,000" is read digit by digit, because rupiah has no
// cents and "." or "," in it is only a thousands separator (reading "185.000" as a decimal would give 185).
const toPrice = (value) => {
  const number = typeof value === 'number' ? value : Number(String(value ?? '').replace(/\D/g, ''))
  return Number.isFinite(number) && number >= 0 ? number : 0
}

export function sanitizeConfig(config, defaults, themePresetIds) {
  const logo = text(config.images?.logo) || defaults.images.logo
  const picture = (value) => text(value) || logo // an empty picture falls back to the logo instead of a broken image

  const theme = record(config.theme)
  const noise = Number(theme.noiseOpacity)

  // Every order and booking button depends on these two, so a broken value falls back to the default
  const savedContact = record(config.contact)
  const contact = {
    ...defaults.contact,
    ...Object.fromEntries(Object.keys(savedContact).map((key) => [key, text(savedContact[key], defaults.contact[key] ?? '')]))
  }
  contact.whatsappRaw = isValidWhatsApp(contact.whatsappRaw) ? normalizeWhatsApp(contact.whatsappRaw) : defaults.contact.whatsappRaw
  contact.email = isValidEmail(contact.email) ? contact.email.trim() : defaults.contact.email

  return {
    ...config,
    theme: {
      ...theme,
      preset: themePresetIds.includes(theme.preset) ? theme.preset : defaults.theme.preset,
      noiseOpacity: Number.isFinite(noise) ? Math.min(1, Math.max(0, noise)) : defaults.theme.noiseOpacity,
      glitchIntensity: ['off', 'normal', 'extreme'].includes(theme.glitchIntensity) ? theme.glitchIntensity : defaults.theme.glitchIntensity
    },
    hero: Object.fromEntries(Object.keys(defaults.hero).map((key) => [key, text(record(config.hero)[key], defaults.hero[key])])),
    bio: text(config.bio, defaults.bio),
    // a saved empty text stays empty (that is how a line is hidden); a missing or damaged one falls back
    texts: Object.fromEntries(Object.keys(defaults.texts).map((key) => [key, text(record(config.texts)[key], defaults.texts[key])])),
    contact,
    images: Object.fromEntries(Object.keys(defaults.images).map((key) => [key, text(record(config.images)[key]) || defaults.images[key]])),
    members: list(config.members, defaults.members, 'member', (m) => ({
      ...m,
      name: text(m.name),
      role: text(m.role),
      soundUrl: text(m.soundUrl),
      soundName: text(m.soundName),
      image: picture(m.image),
      fallbackImage: text(m.fallbackImage),
      gear: text(m.gear),
      description: text(m.description),
      quote: text(m.quote)
    })),
    singles: list(config.singles, defaults.singles, 'single', (s) => ({
      ...s,
      title: text(s.title),
      releaseDate: text(s.releaseDate),
      coverArt: picture(s.coverArt),
      description: text(s.description),
      spotifyUrl: text(s.spotifyUrl),
      youtubeUrl: text(s.youtubeUrl),
      soundcloudUrl: text(s.soundcloudUrl),
      riffType: text(s.riffType),
      audioUrl: text(s.audioUrl),
      audioName: text(s.audioName)
    })),
    gigs: list(config.gigs, defaults.gigs, 'gig', (g) => ({
      ...g,
      title: text(g.title),
      date: text(g.date),
      time: text(g.time),
      venue: text(g.venue),
      city: text(g.city),
      category: text(g.category),
      status: text(g.status),
      price: text(g.price),
      mapsUrl: text(g.mapsUrl),
      description: text(g.description)
    })),
    merch: list(config.merch, defaults.merch, 'merch', (m) => {
      const price = toPrice(m.price)
      const sizes = Array.isArray(m.sizes) ? m.sizes.map((size) => text(size).trim()).filter(Boolean) : []
      return {
        ...m,
        name: text(m.name),
        price,
        // always worked out from the price, so the two can never disagree after an edit
        priceFormatted: formatIdr(price),
        category: text(m.category),
        image: picture(m.image),
        sizes: sizes.length ? sizes : ['One Size'],
        stock: text(m.stock),
        description: text(m.description)
      }
    })
  }
}
