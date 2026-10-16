# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goal

Official website for **Paranoid Noise**, a grunge/punk trio from Jakarta: a single-page React site (bio, members, a synthesized-riff "stompbox" player, gigs with RSVP, merch with WhatsApp checkout, a booking form). Source is `github.com/lickcoln/pn` (branch `main`), deployed on Vercel, with Supabase storing booking inquiries and ticket RSVPs and, once `supabase-admin.sql` has been run, the shared site content edited in the admin portal. Site copy is Indonesian; code and comments are English. `README.md` (Indonesian) has the feature list and setup walkthrough, but parts are stale (it says Vite 6 and a repo named `paranoid-noise`); trust `package.json`.

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # vite build -> dist/ (what Vercel runs)
npm run preview   # serve dist/ locally
npm run lint      # oxlint, config in .oxlintrc.json
```

There is no test suite and no typecheck (plain JSX). Verify with `npm run build`, `npm run lint`, and the UI in `npm run dev`. Lint exits 0 with a backlog of pre-existing warnings (~46: unused imports, setState-in-effect); only new warnings or any error are regressions.

## Environment and deploy

- Two env vars, both needed for Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Locally they go in `.env.local` (gitignored; `.env.example` is the template). On Vercel they go in Project Settings -> Environment Variables. Vite inlines them at build time, so changing them on Vercel needs a redeploy.
- If either is missing, `isSupabaseConfigured` is false and the forms quietly use localStorage. No error is shown.
- Every push to `main` is a production deploy once Vercel is connected. `vercel.json` only sets `framework: vite` and an SPA rewrite to `/index.html`.

## Architecture

### Content: everything reads from `useBandData()`

- `src/data/bandData.js` holds the default content (members, singles, gigs, merch, contact). Only `src/context/BandDataContext.jsx` imports it; components read `useBandData().config`. Keep it that way, or admin edits stop applying.
- The context layers saved content over those defaults and exposes the `update*` setters, all routed through `commit()`. `AdminPortal` (hidden; Ctrl+Shift+A) edits the config and has JSON export/import and reset.
- **Two content modes**, chosen at runtime by `remoteStatus` in the context:
  - *Shared* (`'ready'`): once `supabase-admin.sql` has been run, the `site_content` row `main` (the whole config as JSON) is the source of truth for every visitor. Admin edits are upserted to it (debounced ~700 ms, admin session required). `pn_site_content_cache` in localStorage only gives returning visitors a fast first paint. "Reset" deletes the row, which returns the site to `bandData.js`.
  - *Local* (`'off'` / `'unavailable'`: no env vars, Supabase unreachable, or the table does not exist yet): admin edits are saved to `pn_live_band_config` in that browser only, and no other visitor sees them.
- **Never write config to localStorage on load; only an admin edit may persist it.** Writing on mount froze every visitor's first-visit snapshot, which then won over the defaults (key by key; arrays replaced wholesale) and hid later deploys of `bandData.js`. In local mode an admin's own browser keeps its saved copy until "reset to defaults", so `bandData.js` changes don't show there.
- Conventions the code relies on: past gigs are marked by `category: 'Past Gig'`, not by date (dates are free-text Indonesian strings like `'24 OKTOBER 2026'`); images are absolute paths served from `public/` (`/band/...`, `/images/...`, `/singles/...`).
- Hidden coupling: `App.jsx` hard-codes the featured single id `'mesin-waktu'` for the hero play button, so renaming or removing that single silently breaks it.
- Theme: `THEME_PRESETS` (in the context) sets CSS vars `--primary-rock*` on `<html>`. Preset class strings (`accentText`, `accentBg`, ...) must stay literal Tailwind class names; Tailwind v4 only emits classes it finds as whole strings in source, so never build them by concatenation.

### Supabase

- `src/lib/supabase.js` holds every Supabase call. Visitors only insert: `submitBookingInquiry` -> `booking_inquiries`, `submitTicketRsvp` -> `ticket_rsvps`. On any Supabase error they fall back to localStorage (`pn_bookings`, `pn_rsvps`) and still return success; the form components ignore the returned `mode`. A broken DB setup is therefore silent. Look for "falling back to local" in the browser console.
- The schema is two SQL files, applied by hand in the Supabase SQL Editor (no migration tooling): `supabase-schema.sql` (tables + anon INSERT; not re-runnable) and `supabase-admin.sql` (opt-in and re-runnable: `site_content`, `is_admin()`, admin-only reads, and the commented steps to create the admin user). Until the second one is run the site works in local mode. RLS is on everywhere. Rules:
  - Never chain `.select()` onto visitor inserts. RETURNING needs a SELECT policy, so RLS rejects the insert (error 42501) and it falls back to localStorage. This is why they have no `.select()`.
  - Never add an `anon` SELECT policy on `booking_inquiries` / `ticket_rsvps`: they hold visitors' names, emails and phone numbers. Only the admin reads them.
  - Admin means `app_metadata.role = 'admin'` in the JWT (`public.is_admin()`), granted server-side with SQL. Never base a policy on `user_metadata` (users can edit it) or on `authenticated` alone (sign-ups can be enabled).
  - The form insert policies cover `anon, authenticated`, so the forms keep saving while the admin is signed in on the same browser.
  - Payload keys must match the column names exactly (snake_case; built in `ContactBooking.jsx` and `EventSchedule.jsx`).
  - Any schema change must be mirrored into the SQL files and applied by the user in the dashboard.
- Bookings and RSVPs are read in the admin portal's "Data Booking Gig" / "Data Tiket RSVP" tabs in shared mode, or in the Supabase Table Editor. In local mode those tabs show only the localStorage fallback.

### Orders, contact, audio, admin auth

- No payment backend. The cart lives in `App.jsx` (`localStorage['pn_cart']`) and checkout is a `wa.me/${config.contact.whatsappRaw}` message; the RSVP and booking forms also offer a WhatsApp send. `contact.whatsappRaw` is therefore load-bearing.
- There are no audio files. `src/utils/audioSynth.js` exports a singleton `audioEngine` (Web Audio oscillators -> waveshaper distortion -> lowpass -> analyser -> gain). Each single's `riffType` (`fast_punk`, `heavy_grunge`, `quiet_loud`, `melodic_grunge`, otherwise a default) picks a chord loop in `playTrackRiff`. The AudioContext is created lazily on first use because browsers require a user gesture.
- `AdminPortal` has two logins. In shared mode it is Supabase Auth (email + password), and an account without `app_metadata.role = 'admin'` is signed out again. In local mode it is a client-side comparison against credentials hardcoded in `AdminPortal.jsx` (session flag in `sessionStorage['pn_admin_session']`); those ship in the public bundle and repo, so local mode is a UI gate only. Never let that login protect anything shared: writes to Supabase are guarded by RLS and the admin session.
- Styling is Tailwind v4 via `@tailwindcss/vite` with no `tailwind.config`; custom utilities (`font-bebas`, `glow-red`, glitch effects) live in `src/index.css`.
- The `*.cjs` files in the repo root are one-off PDF/image extraction scripts (Node built-ins only). They hardcode an absolute path to a PDF on the original author's machine and are not part of the build; their output is already in `public/`.

## Working rules

- Band-owned facts (member info, bio, single titles/dates/links, gig dates/venues/prices/status, merch, phone/WhatsApp, social URLs, copy) come from the user. Do not invent, "correct" or fill in placeholders; ask. `bandData.js` has contained placeholder-looking values (e.g. the WhatsApp display string, the Spotify artist URL): flag anything that looks like one instead of silently changing it.
- Sources of truth: `package.json` (versions, scripts), `supabase-schema.sql` + `supabase-admin.sql` (database), `.env.example` (env var names). If a task touches RLS/schema, the persistence model, or admin auth, confirm the intended behaviour with the user before coding. There is no way to run SQL against their project from here, so SQL changes must be handed over as a script with the steps to run it.
