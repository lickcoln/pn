# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goal

Official website for **Paranoid Noise**, a grunge/punk trio from Jakarta: a single-page React site (bio, members, a synthesized-riff "stompbox" player, gigs with RSVP, merch with WhatsApp checkout, a booking form). Source is `github.com/lickcoln/pn` (branch `main`), deployed on Vercel, with Supabase used only to store booking inquiries and ticket RSVPs. Site copy is Indonesian; code and comments are English. `README.md` (Indonesian) has the feature list and setup walkthrough, but parts are stale (it says Vite 6 and a repo named `paranoid-noise`); trust `package.json`.

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # vite build -> dist/ (what Vercel runs)
npm run preview   # serve dist/ locally
npm run lint      # oxlint, config in .oxlintrc.json
```

There is no test suite and no typecheck (plain JSX). Verify with `npm run build`, `npm run lint`, and the UI in `npm run dev`. Lint exits 0 with a backlog of pre-existing warnings (~47: unused imports, setState-in-effect); only new warnings or any error are regressions.

## Environment and deploy

- Two env vars, both needed for Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Locally they go in `.env.local` (gitignored; `.env.example` is the template). On Vercel they go in Project Settings -> Environment Variables. Vite inlines them at build time, so changing them on Vercel needs a redeploy.
- If either is missing, `isSupabaseConfigured` is false and the forms quietly use localStorage. No error is shown.
- Every push to `main` is a production deploy once Vercel is connected. `vercel.json` only sets `framework: vite` and an SPA rewrite to `/index.html`.

## Architecture

### Content: everything reads from `useBandData()`

- `src/data/bandData.js` holds the default content (members, singles, gigs, merch, contact). Only `src/context/BandDataContext.jsx` imports it; components read `useBandData().config`. Keep it that way, or admin edits stop applying.
- The context merges those defaults with `localStorage['pn_live_band_config']` and exposes the `update*` setters. `AdminPortal` (hidden; Ctrl+Shift+A) edits that config and has JSON export/import and reset.
- **Persistence caveat:** the context effect writes the *entire* config to localStorage on first mount for every visitor, and saved values win over defaults on later loads (key by key; arrays are replaced wholesale). So after editing `bandData.js` and redeploying, returning visitors, including the maintainer's own browser, keep the old snapshot until localStorage is cleared or "reset to defaults" is used. Admin edits are per-browser; other visitors never see them. Content is not database-backed (the context imports `supabase` but never uses it). Changing this (versioned snapshot, persist only on admin edit, Supabase-backed content) is a product decision: ask first.
- Conventions the code relies on: past gigs are marked by `category: 'Past Gig'`, not by date (dates are free-text Indonesian strings like `'24 OKTOBER 2026'`); images are absolute paths served from `public/` (`/band/...`, `/images/...`, `/singles/...`).
- Hidden coupling: `App.jsx` hard-codes the featured single id `'mesin-waktu'` for the hero play button, so renaming or removing that single silently breaks it.
- Theme: `THEME_PRESETS` (in the context) sets CSS vars `--primary-rock*` on `<html>`. Preset class strings (`accentText`, `accentBg`, ...) must stay literal Tailwind class names; Tailwind v4 only emits classes it finds as whole strings in source, so never build them by concatenation.

### Supabase: two inserts, nothing else

- `src/lib/supabase.js`: `submitBookingInquiry` -> `booking_inquiries`, `submitTicketRsvp` -> `ticket_rsvps`. On any Supabase error they fall back to localStorage (`pn_bookings`, `pn_rsvps`) and still return success; the form components ignore the returned `mode`. A broken DB setup is therefore silent. Look for "falling back to local" in the browser console.
- `supabase-schema.sql` is the schema, applied by hand in the Supabase SQL Editor (no migration tooling). RLS is on and `anon` has INSERT only. Rules:
  - Never chain `.select()` onto these inserts. RETURNING needs a SELECT policy, so RLS rejects the insert (error 42501) and it falls back to localStorage. This is why they have no `.select()`.
  - Never add an `anon` SELECT policy: the tables hold visitors' names, emails and phone numbers.
  - Payload keys must match the column names exactly (snake_case; built in `ContactBooking.jsx` and `EventSchedule.jsx`).
  - Any schema change must be mirrored into `supabase-schema.sql` and applied by the user in the dashboard.
- Bookings and RSVPs are read in the Supabase dashboard (Table Editor). The admin "rsvps" tab only reads `localStorage['pn_rsvps']`, i.e. the fallback, so it does not show RSVPs stored in Supabase.

### Orders, contact, audio, admin auth

- No payment backend. The cart lives in `App.jsx` (`localStorage['pn_cart']`) and checkout is a `wa.me/${config.contact.whatsappRaw}` message; the RSVP and booking forms also offer a WhatsApp send. `contact.whatsappRaw` is therefore load-bearing.
- There are no audio files. `src/utils/audioSynth.js` exports a singleton `audioEngine` (Web Audio oscillators -> waveshaper distortion -> lowpass -> analyser -> gain). Each single's `riffType` (`fast_punk`, `heavy_grunge`, `quiet_loud`, `melodic_grunge`, otherwise a default) picks a chord loop in `playTrackRiff`. The AudioContext is created lazily on first use because browsers require a user gesture.
- `AdminPortal` login is a client-side comparison against credentials hardcoded in `AdminPortal.jsx` (session flag in `sessionStorage['pn_admin_session']`). They ship in the public bundle and repo, so it is a UI gate only. Do not put anything privileged behind it; letting the admin write to Supabase needs real auth (Supabase Auth + RLS) first.
- Styling is Tailwind v4 via `@tailwindcss/vite` with no `tailwind.config`; custom utilities (`font-bebas`, `glow-red`, glitch effects) live in `src/index.css`.
- The `*.cjs` files in the repo root are one-off PDF/image extraction scripts (Node built-ins only). They hardcode an absolute path to a PDF on the original author's machine and are not part of the build; their output is already in `public/`.

## Working rules

- Band-owned facts (member info, bio, single titles/dates/links, gig dates/venues/prices/status, merch, phone/WhatsApp, social URLs, copy) come from the user. Do not invent, "correct" or fill in placeholders; ask. `bandData.js` has contained placeholder-looking values (e.g. the WhatsApp display string, the Spotify artist URL): flag anything that looks like one instead of silently changing it.
- Sources of truth: `package.json` (versions, scripts), `supabase-schema.sql` (database), `.env.example` (env var names). If a task touches RLS/schema, the persistence model, or admin auth, confirm the intended behaviour with the user before coding.
