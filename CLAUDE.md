# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goal

Official website for **Paranoid Noise**, a grunge/punk trio from Jakarta: a single-page React site (bio, members, a stompbox music player, gigs with RSVP, merch with WhatsApp checkout, a booking form). Source is `github.com/lickcoln/pn` (branch `main`), deployed on Vercel, with Supabase storing booking inquiries, ticket RSVPs, the shared site content edited in the admin portal, and the photos and MP3 songs uploaded there. **All website text is English** (the owner asked for it: UI, errors, admin portal, WhatsApp messages); only the band's own song titles stay Indonesian. Money is `IDR 65,000` (comma grouping, `toLocaleString('en-US')`), admin timestamps use `en-GB`. `README.md` is still Indonesian and partly stale (it says Vite 6 and a repo named `paranoid-noise`); trust `package.json`.

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # vite build -> dist/ (what Vercel runs)
npm run preview   # serve dist/ locally
npm run lint      # oxlint, config in .oxlintrc.json
```

There is no test suite and no typecheck (plain JSX). Verify with `npm run build`, `npm run lint`, and the UI in `npm run dev`. Lint exits 0 with a backlog of pre-existing warnings (~37: unused imports, setState-in-effect, exhaustive-deps); only new warnings or any error are regressions. Features here were verified with throwaway scripts outside the repo: headless Chrome over the DevTools protocol against a mock Supabase (auth, REST, Storage), and PGlite (WASM Postgres) for the RLS and storage policies.

## Environment and deploy

- Two env vars, both needed for Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Locally they go in `.env.local` (gitignored; `.env.example` is the template). On Vercel they go in Project Settings -> Environment Variables. Vite inlines them at build time, so changing them on Vercel needs a redeploy.
- If either is missing, `isSupabaseConfigured` is false and the forms quietly use localStorage. No error is shown.
- Every push to `main` is a production deploy once Vercel is connected. `vercel.json` only sets `framework: vite` and an SPA rewrite to `/index.html`.

## Architecture

### Content: everything reads from `useBandData()`

- `src/data/bandData.js` holds the default content (members, singles, gigs, merch, contact, and `IMAGE_SLOTS`/`SITE_IMAGES`). Only `src/context/BandDataContext.jsx` imports it; components read `useBandData().config`. Keep it that way, or admin edits stop applying.
- The context layers saved content over those defaults and exposes the `update*` setters, all routed through `commit()`. `AdminPortal` (hidden; Ctrl+Shift+A, or the faint lock icon bottom-right) edits the config and has JSON export/import and reset.
- **Two content modes**, chosen at runtime by `remoteStatus` in the context:
  - *Shared* (`'ready'`): once `supabase-admin.sql` has been run, the `site_content` row `main` (the whole config as JSON) is the source of truth for every visitor. Admin edits are upserted to it (debounced ~700 ms, admin session required). `pn_site_content_cache` in localStorage only gives returning visitors a fast first paint. "Reset" deletes the row, which returns the site to `bandData.js`.
  - *Local* (`'off'` / `'unavailable'`: no env vars, Supabase unreachable, or the table does not exist yet): admin edits are saved to `pn_live_band_config` in that browser only, and no other visitor sees them. `remoteReason` says why (`'missing'` or `'network'`); the admin login warns when the server cannot be reached instead of silently offering the local login.
- **Never write config to localStorage on load; only an admin edit may persist it.** Writing on mount froze every visitor's first-visit snapshot, which then won over the defaults (key by key; arrays replaced wholesale) and hid later deploys of `bandData.js`.
- **A saved snapshot shadows the defaults, so changing default copy in `bandData.js` does not reach a site that already has saved content.** `src/lib/contentMigration.js` handles that: `mergeConfig` runs `migrateLegacyContent`, which swaps every saved item that still matches its old default (by fingerprint of the old item) for the current default and keeps edited items. To change default copy again: compute fingerprints of the current items *before* editing `bandData.js`, add them to `LEGACY_FINGERPRINTS`, and bump `CONTENT_VERSION`. Otherwise tell the user to change it in the admin portal.
- **Images.** Site-wide images live in `config.images` (one entry per `IMAGE_SLOTS` item: logo, hero and music-section backgrounds, lineup/profile photos, press kit); a member's `image`, a single's `coverArt`, and a merch item's `image` live on the item. Components must read them from `config`, never hardcode `/band/...` paths. The browser tab icon follows `images.logo`. Defaults are files in `public/` (`/band/`, `/images/`, `/singles/`); the social-share `og:image` in `index.html` is static and cannot follow the admin.
- A single's `audioUrl` (+ `audioName`) is its uploaded MP3; without one the player falls back to the synthesized riff preview.
- Conventions the code relies on: past gigs are marked by `category: 'Past Gig'`, not by date (dates are free-text English strings like `'24 OCTOBER 2026'`). The hero button plays `config.singles[0]`.
- Theme: `THEME_PRESETS` (in the context) sets CSS vars `--primary-rock*` on `<html>`. Preset class strings (`accentText`, `accentBg`, ...) must stay literal Tailwind class names; Tailwind v4 only emits classes it finds as whole strings in source, so never build them by concatenation.

### Supabase

- `src/lib/supabase.js` holds every Supabase call. Visitors only insert: `submitBookingInquiry` -> `booking_inquiries`, `submitTicketRsvp` -> `ticket_rsvps`. On any Supabase error they fall back to localStorage (`pn_bookings`, `pn_rsvps`) and still return success; the form components ignore the returned `mode`. A broken DB setup is therefore silent. Look for "falling back to local" in the browser console.
- The schema is three SQL files, applied by hand in the Supabase SQL Editor in this order (no migration tooling): `supabase-schema.sql` (tables + anon INSERT; not re-runnable), `supabase-admin.sql` (opt-in, re-runnable: `site_content`, `is_admin()`, admin-only reads, the commented steps to create the admin user) and `supabase-media.sql` (opt-in, re-runnable: the `site-media` storage bucket). Until the second one is run the site works in local mode; until the third, uploads fail with an error telling the admin to run it. RLS is on everywhere. Rules:
  - Never chain `.select()` onto visitor inserts. RETURNING needs a SELECT policy, so RLS rejects the insert (error 42501) and it falls back to localStorage. This is why they have no `.select()`.
  - Never add an `anon` SELECT policy on `booking_inquiries` / `ticket_rsvps`: they hold visitors' names, emails and phone numbers. Only the admin reads them.
  - Admin means `app_metadata.role = 'admin'` in the JWT (`public.is_admin()`), granted server-side with SQL. Never base a policy on `user_metadata` (users can edit it) or on `authenticated` alone (sign-ups can be enabled).
  - The form insert policies cover `anon, authenticated`, so the forms keep saving while the admin is signed in on the same browser.
  - Payload keys must match the column names exactly (snake_case; built in `ContactBooking.jsx` and `EventSchedule.jsx`).
  - Any schema change must be mirrored into the SQL files and applied by the user in the dashboard.
- **Storage.** `uploadMedia(folder, file)` puts photos and MP3s in the public `site-media` bucket (anyone downloads, only the admin uploads/replaces/deletes; 25 MB limit; jpeg/png/webp/gif/mp3 only, no SVG because it can carry scripts). Each upload gets a new name, so replaced files never show from cache. The storage client sends a `File` with the type the browser detected and ignores the `contentType` option, so `uploadMedia` rewraps MP3s as `audio/mpeg` (some browsers report `audio/mp3` or nothing). `MediaField` shrinks photos (`prepareImage`) before upload and the replaced file is deleted ~12 s later, only if nothing in the saved content still points to it. Free plan: 1 GB storage, 5 GB downloads a month.
- Bookings and RSVPs are read in the admin portal's "Booking Requests" / "Ticket RSVPs" tabs in shared mode, or in the Supabase Table Editor. In local mode those tabs show only the localStorage fallback.

### Player, audio, mobile navigation

- `src/utils/audioSynth.js` exports a singleton `audioEngine`. One chain serves both sources: riff voices (oscillators -> always-on amp distortion -> cab filter) and the MP3 `<audio>` element (`crossOrigin = 'anonymous'`, which the storage server allows; without CORS the Web Audio graph would be silent) both go through the pedal (gain curve + tone lowpass), a three-band equalizer (bass shelf 120 Hz, mid peak 1 kHz, treble shelf 6 kHz, 50% = flat, +/-12 dB), the analyser, the master level and a limiter. Every setting is a 0-100 percentage (`setSetting`/`setSettings`; stored until the context exists, because browsers only create it from a click). `playSong` resumes a paused song, `playTrackRiff` is the fallback for a single without an MP3.
- The pedal starts **bypassed** (App's `distortionActive` is false) so real songs sound like the recording; GAIN and TONE only act while it is engaged. Sliders in `DiscographyPlayer` pair a range input with a typed percentage box, and are remembered in `localStorage['pn_player_settings']`.
- In `DiscographyPlayer`, `startTrack` always plays and `togglePlay` is for buttons; the effect that reacts to `activeTrackId` must call `startTrack`, never the toggle (the toggle there used to stop a track right after starting it). The analyser is only 64 points wide, so its bins cannot show bass.
- `src/components/MobileNav.jsx` is a fixed bottom tab bar below `lg` (7 sections, the one crossing the middle of the screen is highlighted, plus a back-to-top button). Anything fixed at the bottom has to clear it: `App.jsx` adds `pb-16`, and the hidden admin lock sits at `bottom-[4.75rem]` on phones. `html { scroll-padding-top }` keeps jumps below the top bar.

### Orders, contact, admin auth

- No payment backend. The cart lives in `App.jsx` (`localStorage['pn_cart']`) and checkout is a `wa.me/${config.contact.whatsappRaw}` message; the RSVP and booking forms also offer a WhatsApp send. `contact.whatsappRaw` is therefore load-bearing.
- `AdminPortal` has two logins. In shared mode it is Supabase Auth (email + password), and an account without `app_metadata.role = 'admin'` is signed out again (sign-out is `scope: 'local'`, so signing out on the PC keeps the phone signed in). In local mode it is a client-side comparison against credentials hardcoded in `AdminPortal.jsx` (session flag in `sessionStorage['pn_admin_session']`); those ship in the public bundle and repo, so local mode is a UI gate only and that password must never be reused for the Supabase admin account. Uploads need the shared mode and an admin session.
- Styling is Tailwind v4 via `@tailwindcss/vite` with no `tailwind.config`; custom utilities (`font-bebas`, `glow-red`, glitch effects, the `pn-range` slider) live in `src/index.css`.
- The `*.cjs` files in the repo root are one-off PDF/image extraction scripts (Node built-ins only). They hardcode an absolute path to a PDF on the original author's machine and are not part of the build; their output is already in `public/`.

## Working rules

- Band-owned facts (member info, bio, single titles/dates/links, gig dates/venues/prices/status, merch, phone/WhatsApp, social URLs, copy) come from the user. Do not invent, "correct" or fill in placeholders; ask. `bandData.js` has contained placeholder-looking values (e.g. the WhatsApp display string, the Spotify artist URL) and the band bio has spelling mistakes in the owner's own text: flag them instead of silently changing them.
- Keep every user-visible string English, including new admin text, error messages and WhatsApp templates.
- Sources of truth: `package.json` (versions, scripts), the three `supabase-*.sql` files (database), `.env.example` (env var names). If a task touches RLS/schema, the persistence model, or admin auth, confirm the intended behaviour with the user before coding. There is no way to run SQL against their project from here, so SQL changes must be handed over as a script with the steps to run it.
