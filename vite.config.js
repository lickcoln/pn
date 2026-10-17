import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The band's own domain. It is the address written into the link-preview and canonical tags of every
// build that runs on Vercel (production and previews alike, so a preview never competes with the real site).
// Change it here if the domain ever changes, or set VITE_SITE_URL in Vercel, which wins over this value.
const SITE_ORIGIN = 'https://paranoidnoise.com'

// Link previews (WhatsApp, Instagram, Facebook, X) only accept absolute addresses for the sharing picture.
// A build outside Vercel (npm run build on a laptop) keeps relative paths.
function siteMeta(origin) {
  return {
    name: 'site-meta',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', origin)
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const origin = (env.VITE_SITE_URL || (process.env.VERCEL ? SITE_ORIGIN : '')).replace(/\/+$/, '')

  return {
    plugins: [
      tailwindcss(),
      react(),
      siteMeta(origin)
    ],
  }
})
