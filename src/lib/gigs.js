// The gig list is typed by hand in the admin portal, so dates arrive as free text ("24 OCTOBER 2026",
// "2026-10-24", "24/10/2026", "24-25 Nov 2026"). Reading them lets the site put upcoming shows first and
// move a show to the "past" list by itself the day after it happened, with nobody editing anything.

import { isSoldOutLabel } from './format'

const MONTHS = {
  jan: 0, january: 0, januari: 0,
  feb: 1, february: 1, februari: 1,
  mar: 2, march: 2, maret: 2,
  apr: 3, april: 3,
  may: 4, mei: 4,
  jun: 5, june: 5, juni: 5,
  jul: 6, july: 6, juli: 6,
  aug: 7, august: 7, agu: 7, agt: 7, agustus: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, okt: 9, oktober: 9,
  nov: 10, november: 10, nop: 10, nopember: 10,
  dec: 11, december: 11, des: 11, desember: 11
}

export const MONTH_ABBREVIATIONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const dayKey = (year, month, day) => year * 10000 + (month + 1) * 100 + day

// A real calendar date? (rejects 31 February, month 13 and so on)
function build(year, month, day, endDay = day) {
  if (month === undefined || !Number.isInteger(month)) return null
  for (const d of [day, endDay]) {
    const check = new Date(Date.UTC(year, month, d))
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month || check.getUTCDate() !== d) return null
  }
  if (endDay < day) return null
  return { year, month, day, endDay, key: dayKey(year, month, day), endKey: dayKey(year, month, endDay) }
}

/** Reads a typed date. Returns null when it cannot be understood (the show is then simply listed as typed). */
export function parseGigDate(input) {
  const value = String(input || '').trim().replace(/\s+/g, ' ')
  if (!value) return null
  let m

  // 2026-10-24
  if ((m = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) return build(+m[1], +m[2] - 1, +m[3])
  // 24/10/2026 (day first, as in Indonesia)
  if ((m = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) return build(+m[3], +m[2] - 1, +m[1])
  // 24-25 OCTOBER 2026 (a festival over several days)
  if ((m = value.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([a-z]+)\.?,?\s+(\d{4})$/i))) {
    return build(+m[4], MONTHS[m[3].toLowerCase()], +m[1], +m[2])
  }
  // 24 OCTOBER 2026
  if ((m = value.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\.?,?\s+(\d{4})$/i))) {
    return build(+m[3], MONTHS[m[2].toLowerCase()], +m[1])
  }
  // OCTOBER 24, 2026
  if ((m = value.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i))) {
    return build(+m[3], MONTHS[m[1].toLowerCase()], +m[2])
  }
  return null
}

// The band plays in Indonesia, so "today" means today in Jakarta, wherever the visitor is
const JAKARTA = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })

export function todayKey(now = new Date()) {
  const parts = Object.fromEntries(JAKARTA.formatToParts(now).map((part) => [part.type, part.value]))
  return dayKey(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
}

/** Today in Jakarta as yyyy-mm-dd, the format of a date input's min attribute. */
export function todayIso(now = new Date()) {
  const key = todayKey(now)
  const month = Math.floor(key / 100) % 100
  return `${Math.floor(key / 10000)}-${String(month).padStart(2, '0')}-${String(key % 100).padStart(2, '0')}`
}

/** A show is past once its last day is over, or when the admin marked it with the "Past Gig" category. */
export function isPastGig(gig, today = todayKey()) {
  if (/^\s*past\b/i.test(gig.category || '')) return true
  const date = parseGigDate(gig.date)
  return date ? date.endKey < today : false
}

export const isSoldOutGig = (gig) => isSoldOutLabel(gig.status) || isSoldOutLabel(gig.price)

/** Upcoming shows soonest first, past shows most recent first; shows with an unreadable date go last in their group. */
export function splitGigs(gigs, today = todayKey()) {
  const decorated = gigs.map((gig, index) => ({ gig, index, date: parseGigDate(gig.date), past: isPastGig(gig, today) }))
  const order = (descending) => (a, b) => {
    if (a.date && b.date) return (descending ? b.date.key - a.date.key : a.date.key - b.date.key) || a.index - b.index
    if (a.date) return -1
    if (b.date) return 1
    return a.index - b.index
  }
  return {
    upcoming: decorated.filter((entry) => !entry.past).sort(order(false)),
    past: decorated.filter((entry) => entry.past).sort(order(true))
  }
}
