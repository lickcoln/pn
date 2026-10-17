import { createClient } from '@supabase/supabase-js'
import { safeFileName } from './media'

// Values pasted into the Vercel dashboard often carry a trailing newline or space. Ordinary requests shrug it off
// (browsers trim header values), but it ends up inside the WebSocket address of the live connection, which then
// fails with "transport failed". So both values are trimmed here.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// A form must not spin forever on a bad connection: after this long the visitor is told it was not sent
const SUBMIT_TIMEOUT_MS = 15000

async function withTimeout(run, ms = SUBMIT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await run(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Save booking inquiry to Supabase or fallback to LocalStorage.
 * `mode` says where it ended up: only 'supabase' means the band can see it.
 */
export async function submitBookingInquiry(data) {
  const timestamp = new Date().toISOString()
  const payload = { ...data, created_at: timestamp }

  if (isSupabaseConfigured && supabase) {
    try {
      // No .select(): anon only has INSERT under RLS, returning the row would need a SELECT policy
      const { error } = await withTimeout((signal) =>
        supabase.from('booking_inquiries').insert([payload]).abortSignal(signal)
      )

      if (error) throw error
      return { success: true, mode: 'supabase', data: payload }
    } catch (err) {
      console.warn('Supabase booking submission failed, falling back to local:', err)
    }
  }

  // Fallback to localStorage simulation
  try {
    const existing = JSON.parse(localStorage.getItem('pn_bookings') || '[]')
    existing.unshift(payload)
    localStorage.setItem('pn_bookings', JSON.stringify(existing))
    return { success: true, mode: 'local', data: payload }
  } catch (err) {
    return { success: true, mode: 'memory', data: payload }
  }
}

/**
 * Save ticket RSVP to Supabase or fallback (same `mode` rule as submitBookingInquiry)
 */
export async function submitTicketRsvp(data) {
  const payload = { ...data, created_at: new Date().toISOString() }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await withTimeout((signal) =>
        supabase.from('ticket_rsvps').insert([payload]).abortSignal(signal)
      )

      if (error) throw error
      return { success: true, mode: 'supabase', data: payload }
    } catch (err) {
      console.warn('Supabase RSVP failed, falling back to local:', err)
    }
  }

  try {
    const existing = JSON.parse(localStorage.getItem('pn_rsvps') || '[]')
    existing.unshift(payload)
    localStorage.setItem('pn_rsvps', JSON.stringify(existing))
    return { success: true, mode: 'local', data: payload }
  } catch (err) {
    return { success: true, mode: 'memory', data: payload }
  }
}

// ---------------------------------------------------------------------------
// Shared site content and admin session (needs supabase-admin.sql)
// ---------------------------------------------------------------------------

const CONTENT_ROW_ID = 'main'

/**
 * Admin = a signed-in Supabase user with app_metadata.role === 'admin'.
 * RLS enforces the same rule server-side (public.is_admin()); this check only drives the UI.
 */
export function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin'
}

/**
 * Read the content published from the admin portal.
 * 'ready' = site_content is reachable (config stays null until something is published).
 * 'unavailable' = Supabase is off or the content cannot be read, and reason says why:
 * 'off' (no env vars), 'missing' (supabase-admin.sql has not been run yet) or 'network'
 * (the server cannot be reached: offline, or blocked by an extension, VPN or network).
 */
export async function fetchSiteContent() {
  if (!isSupabaseConfigured || !supabase) return { status: 'unavailable', reason: 'off', config: null }

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('config, updated_at')
      .eq('id', CONTENT_ROW_ID)
      .maybeSingle()

    if (error) throw error
    return { status: 'ready', config: data?.config ?? null, updatedAt: data?.updated_at ?? null }
  } catch (err) {
    const missing = err?.code === 'PGRST205' || err?.code === '42P01'
    console.info('Shared site content unavailable, using local content:', err?.message || err)
    return { status: 'unavailable', reason: missing ? 'missing' : 'network', config: null }
  }
}

/**
 * Only the version (the publish time) of the published content, a few bytes instead of the whole config.
 * Open pages use it to notice that the admin published something new. `exists` is false when nothing is published.
 */
export async function fetchSiteContentVersion() {
  if (!isSupabaseConfigured || !supabase) return { ok: false }

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('updated_at')
      .eq('id', CONTENT_ROW_ID)
      .maybeSingle()

    if (error) throw error
    return { ok: true, exists: Boolean(data), updatedAt: data?.updated_at ?? null }
  } catch {
    return { ok: false }
  }
}

/**
 * Live updates (needs supabase-realtime.sql): Supabase pushes every change of the published content to the
 * open page. `onChange(payload)` gets the change; `onStatus(status, error)` reports SUBSCRIBED when the live
 * connection works and CHANNEL_ERROR / TIMED_OUT / CLOSED when it does not. Returns a function that closes it.
 */
export function subscribeToSiteContent({ onChange, onStatus }) {
  if (!isSupabaseConfigured || !supabase) return () => {}

  // A unique name per subscription, so closing one and opening the next never meets a half-closed channel
  const channel = supabase
    .channel(`site-content-${Math.random().toString(36).slice(2, 8)}`, {
      // makes a table without live updates enabled report a clear reason instead of staying silent
      config: { postgres_changes_options: { wait: true } }
    })
    // new and changed content (only the one row the site uses)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content', filter: `id=eq.${CONTENT_ROW_ID}` }, onChange)
    // a removed row (the admin's "Reset"): the server cannot filter deletions, and the table only has this one row
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'site_content' }, onChange)
    .subscribe((status, error) => onStatus?.(status, error))

  return () => {
    supabase.removeChannel(channel)
  }
}

async function runWrite(request) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  try {
    const { error } = await request()
    if (error) throw error
    return { success: true }
  } catch (err) {
    // 42501 = row level security: signed in, but without the admin role
    const message = err?.code === '42501'
      ? 'This account does not have the admin role, so it cannot save.'
      : err?.message || 'Could not save to the server.'
    return { success: false, error: message }
  }
}

/**
 * Publish the whole config. RLS only accepts this from an admin session.
 * `updatedAt` is the version this save will have on the server (the caller can pass one it has already noted,
 * so it can recognise this very save when the live update comes back); on success the result carries it.
 */
export async function saveSiteContent(config, updatedAt = new Date().toISOString()) {
  const result = await runWrite(() =>
    supabase.from('site_content').upsert({ id: CONTENT_ROW_ID, config, updated_at: updatedAt })
  )
  return result.success ? { ...result, updatedAt } : result
}

/**
 * Remove the published content so the site falls back to the defaults in bandData.js.
 */
export function deleteSiteContent() {
  return runWrite(() => supabase.from('site_content').delete().eq('id', CONTENT_ROW_ID))
}

export async function adminSignIn(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const wrongLogin = /invalid login credentials/i.test(error.message)
    return { success: false, error: wrongLogin ? 'Wrong email or password.' : error.message }
  }

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut({ scope: 'local' })
    return {
      success: false,
      error: 'This account has not been given the admin role yet. Run step 4 in supabase-admin.sql, then sign in again.'
    }
  }
  return { success: true, user: data.user }
}

// scope 'local' ends only this browser's session, so signing out on the PC keeps the phone signed in
export async function adminSignOut() {
  if (supabase) await supabase.auth.signOut({ scope: 'local' })
}

// Only an admin session gets rows back: RLS hides these tables from everyone else
async function listRows(table) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, data: [], error: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return error ? { success: false, data: [], error: error.message } : { success: true, data }
}

export const listBookingInquiries = () => listRows('booking_inquiries')
export const listTicketRsvps = () => listRows('ticket_rsvps')

// ---------------------------------------------------------------------------
// Uploads from the admin portal: photos and MP3 songs (needs supabase-media.sql)
// ---------------------------------------------------------------------------

export const MEDIA_BUCKET = 'site-media'

function describeStorageError(err) {
  const text = `${err?.message || ''} ${err?.statusCode || ''}`
  if (/bucket not found/i.test(text)) {
    return "The 'site-media' storage bucket does not exist yet. Run supabase-media.sql in the Supabase SQL Editor."
  }
  if (/row-level security|unauthorized|\b403\b/i.test(text)) {
    return 'This account is not allowed to upload. Sign in with the admin account.'
  }
  if (/exceeded the maximum|too large|\b413\b/i.test(text)) return 'The file is too large (the limit is 25 MB).'
  if (/mime type|\b415\b/i.test(text)) return 'This file type is not allowed.'
  return err?.message || 'The upload failed.'
}

/**
 * Upload a photo or an MP3 into the public site-media bucket. Every upload gets a new file name, so
 * browsers never show an old cached copy of a replaced file. Resolves to { success, url, path } or
 * { success: false, error }.
 */
export async function uploadMedia(folder, file) {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase is not configured.' }

  const isMp3 = /\.mp3$/i.test(file.name)
  const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`
  // The storage client sends a file with the type the browser detected (some report MP3 as
  // audio/mp3 or nothing at all), and the bucket only accepts audio/mpeg for songs
  const body = isMp3 && file.type !== 'audio/mpeg' ? new File([file], file.name, { type: 'audio/mpeg' }) : file

  try {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
      contentType: body.type,
      cacheControl: '31536000',
      upsert: false
    })
    if (error) throw error

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    return { success: true, url: data.publicUrl, path }
  } catch (err) {
    return { success: false, error: describeStorageError(err) }
  }
}

/** The storage path behind a public URL of the site-media bucket, or null for any other URL. */
export function mediaPathFromUrl(url) {
  const marker = `/object/public/${MEDIA_BUCKET}/`
  const at = typeof url === 'string' ? url.indexOf(marker) : -1
  return at === -1 ? null : decodeURIComponent(url.slice(at + marker.length).split('?')[0])
}

/** Best-effort cleanup of a file that is no longer used; files from other places are left alone. */
export async function deleteMedia(url) {
  const path = mediaPathFromUrl(url)
  if (!path || !supabase) return
  try {
    await supabase.storage.from(MEDIA_BUCKET).remove([path])
  } catch (err) {
    console.info('Could not remove the old file:', err?.message || err)
  }
}
