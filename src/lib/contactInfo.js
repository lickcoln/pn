// Contact details: one WhatsApp number is stored (digits with the country code, the form wa.me wants) and the
// pretty version shown on the site is always derived from it, so what visitors read is what they dial.

/** '0812 9999 0099', '+62 812-9999-0099' and '6281299990099' all become '6281299990099'. */
export function normalizeWhatsApp(input) {
  const digits = String(input || '').replace(/\D/g, '')
  return digits.startsWith('0') ? '62' + digits.slice(1) : digits
}

/** A usable international number has between 8 and 15 digits (the E.164 limit). */
export function isValidWhatsApp(input) {
  const digits = normalizeWhatsApp(input)
  return digits.length >= 8 && digits.length <= 15
}

/** '6281299990099' -> '+62 812-9999-0099' */
export function formatWhatsApp(input) {
  const digits = normalizeWhatsApp(input)
  if (!digits) return ''
  if (digits.startsWith('62') && digits.length >= 10) {
    const number = digits.slice(2)
    return `+62 ${number.slice(0, 3)}-${number.slice(3, 7)}-${number.slice(7)}`
  }
  return '+' + digits
}

/** The wa.me link for the band's number, optionally with a ready-made message. */
export function whatsappLink(input, message) {
  const number = normalizeWhatsApp(input)
  if (!number) return ''
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}

export const isValidEmail = (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input || '').trim())

/**
 * Turns whatever was typed into a link that opens a real web page: a missing https:// is added
 * ("instagram.com/paranoid.noise"), and any other scheme (javascript:, data:) is refused.
 * An empty value stays empty, which is how a link gets hidden.
 */
export function externalUrl(input) {
  const value = String(input || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return ''
  return `https://${value.replace(/^\/+/, '')}`
}

const CHANNELS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'spotify', label: 'Spotify' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'soundcloud', label: 'SoundCloud' }
]

/** The social channels that currently have a link. Clearing a link in the admin portal hides it everywhere. */
export function socialChannels(contact) {
  return CHANNELS.map(({ key, label }) => ({
    key,
    label,
    url: externalUrl(contact?.[key]),
    handle: String(contact?.[`${key}Handle`] || '').trim() || label
  })).filter((channel) => channel.url)
}
