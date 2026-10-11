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
      const { data: result, error } = await supabase
        .from('booking_inquiries')
        .insert([payload])
        .select()
      
      if (error) throw error
      return { success: true, mode: 'supabase', data: result }
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
      const { data: result, error } = await supabase
        .from('ticket_rsvps')
        .insert([payload])
        .select()
      
      if (error) throw error
      return { success: true, mode: 'supabase', data: result }
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
