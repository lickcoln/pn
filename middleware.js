// Vercel Routing Middleware for the home page (it runs before the static files are served).
//
// The card that WhatsApp, Instagram, Facebook, X or Telegram show for a link is built by a robot that reads the
// HTML and does not run the page's JavaScript, so the words in it cannot come from the admin portal in the browser.
// This puts them into the HTML on the way out: it reads the texts the admin saved in the site_content row of
// Supabase (the same public read the website does, with the same two environment variables) and writes
//   - "Link preview title" and "Link preview description" into og:title, og:description, twitter:title and
//     twitter:description,
//   - "Browser tab title" into <title>,
// of the static index.html. Whatever goes wrong (Supabase slow or down, no saved texts, a missing tag), the page
// is served exactly as it was built, so this can never take the home page down.
//
// Only standard web APIs are used here (this runs on the edge runtime, not in Node).

export const config = { matcher: '/' }

const TEXTS_TTL_MS = 60 * 1000 // the saved texts are looked up at most once a minute per edge instance
const RETRY_AFTER_FAILURE_MS = 15 * 1000 // and a failed lookup is not repeated for every visitor
const SUPABASE_TIMEOUT_MS = 1500
const MAX_TITLE = 150
const MAX_DESCRIPTION = 300

let cached = { at: 0, texts: null }
let retryAfter = 0

// A single line of plain text, or '' when there is nothing usable
const clean = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function loadTexts() {
  const now = Date.now()
  if (cached.texts && now - cached.at < TEXTS_TTL_MS) return cached.texts
  if (now < retryAfter) return cached.texts

  const base = String(process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const key = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim()
  if (!base || !key) return cached.texts

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS)
  try {
    const response = await fetch(`${base}/rest/v1/site_content?id=eq.main&select=texts:config->texts`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal
    })
    if (!response.ok) throw new Error(`site_content answered ${response.status}`)
    const rows = await response.json()
    const saved = Array.isArray(rows) ? rows[0]?.texts : null
    // no row, or no texts in it, simply means nothing was edited yet
    const texts = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
    cached = { at: now, texts }
    return texts
  } catch {
    // an older copy is better than none
    retryAfter = now + RETRY_AFTER_FAILURE_MS
    return cached.texts
  } finally {
    clearTimeout(timer)
  }
}

// Replaces the content of one tag of the built index.html; a tag that is not found is left alone
function setMeta(html, attribute, name, value) {
  const tag = new RegExp(`(<meta\\s+${attribute}="${name}"\\s+content=")[^"]*(")`)
  return value ? html.replace(tag, (_, before, after) => before + escapeHtml(value) + after) : html
}

function applyTexts(html, texts) {
  if (!texts) return html
  const shareTitle = clean(texts.shareTitle, MAX_TITLE)
  const shareDescription = clean(texts.shareDescription, MAX_DESCRIPTION)
  const pageTitle = clean(texts.pageTitle, MAX_TITLE)

  let out = html
  out = setMeta(out, 'property', 'og:title', shareTitle)
  out = setMeta(out, 'name', 'twitter:title', shareTitle)
  out = setMeta(out, 'property', 'og:description', shareDescription)
  out = setMeta(out, 'name', 'twitter:description', shareDescription)
  if (pageTitle) out = out.replace(/(<title>)[^<]*(<\/title>)/, (_, before, after) => before + escapeHtml(pageTitle) + after)
  return out
}

export default async function middleware(request) {
  const origin = new URL(request.url).origin
  try {
    const [page, texts] = await Promise.all([fetch(`${origin}/index.html`), loadTexts()])
    const html = await page.text()
    // anything that does not look like the built page is not touched: let the platform serve it
    if (!page.ok || !html.includes('<div id="root">')) throw new Error('index.html is not the built page')

    const custom = applyTexts(html, texts)
    return new Response(request.method === 'HEAD' ? null : custom, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'x-pn-meta': custom === html ? 'default' : 'custom'
      }
    })
  } catch {
    // "continue to the next step" for the platform, i.e. the plain static file
    return new Response(null, { headers: { 'x-middleware-next': '1' } })
  }
}
