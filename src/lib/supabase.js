import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Save booking inquiry to Supabase or fallback to LocalStorage
 */
export async function submitBookingInquiry(data) {
  const timestamp = new Date().toISOString()
  const payload = { ...data, created_at: timestamp }

  if (isSupabaseConfigured && supabase) {
    try {
      // No .select(): anon only has INSERT under RLS, returning the row would need a SELECT policy
      const { error } = await supabase
        .from('booking_inquiries')
        .insert([payload])
      
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
 * Save ticket RSVP to Supabase or fallback
 */
export async function submitTicketRsvp(data) {
  const payload = { ...data, created_at: new Date().toISOString() }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('ticket_rsvps')
        .insert([payload])
      
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
 * 'ready' = site_content is reachable (config stays null until something is published),
 * 'unavailable' = Supabase is off or unreachable, or supabase-admin.sql has not been run yet.
 */
export async function fetchSiteContent() {
  if (!isSupabaseConfigured || !supabase) return { status: 'unavailable', config: null }

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('config')
      .eq('id', CONTENT_ROW_ID)
      .maybeSingle()

    if (error) throw error
    return { status: 'ready', config: data?.config ?? null }
  } catch (err) {
    console.info('Shared site content unavailable, using local content:', err?.message || err)
    return { status: 'unavailable', config: null }
  }
}

async function runWrite(request) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase belum dikonfigurasi.' }
  }

  try {
    const { error } = await request()
    if (error) throw error
    return { success: true }
  } catch (err) {
    // 42501 = row level security: signed in, but without the admin role
    const message = err?.code === '42501'
      ? 'Akun ini tidak punya izin admin untuk menyimpan.'
      : err?.message || 'Gagal menyimpan ke server.'
    return { success: false, error: message }
  }
}

/**
 * Publish the whole config. RLS only accepts this from an admin session.
 */
export function saveSiteContent(config) {
  return runWrite(() =>
    supabase
      .from('site_content')
      .upsert({ id: CONTENT_ROW_ID, config, updated_at: new Date().toISOString() })
  )
}

/**
 * Remove the published content so the site falls back to the defaults in bandData.js.
 */
export function deleteSiteContent() {
  return runWrite(() => supabase.from('site_content').delete().eq('id', CONTENT_ROW_ID))
}

export async function adminSignIn(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase belum dikonfigurasi.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const wrongLogin = /invalid login credentials/i.test(error.message)
    return { success: false, error: wrongLogin ? 'Email atau password salah.' : error.message }
  }

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'Akun ini belum diberi role admin. Jalankan langkah 4 di supabase-admin.sql, lalu login lagi.'
    }
  }
  return { success: true, user: data.user }
}

export async function adminSignOut() {
  if (supabase) await supabase.auth.signOut()
}

// Only an admin session gets rows back: RLS hides these tables from everyone else
async function listRows(table) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, data: [], error: 'Supabase belum dikonfigurasi.' }
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
