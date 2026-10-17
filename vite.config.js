import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Link previews (WhatsApp, Instagram, Facebook, X) only accept absolute addresses for the sharing picture.
// The site's address is known at build time: Vercel provides the production domain, and VITE_SITE_URL
// overrides it (set it when the site has its own domain). Without either, the tags keep relative paths.
function siteMeta(origin) {
  return {
    name: 'site-meta',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', origin)
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const origin = (env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}` : '')).replace(/\/+$/, '')

  return {
    plugins: [
      tailwindcss(),
      react(),
      siteMeta(origin)
    ],
  }
})
