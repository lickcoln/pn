import React, { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Inbox } from 'lucide-react'
import { Banner } from './ui'
import { listBookingInquiries, listTicketRsvps } from '../../lib/supabase'

const KINDS = {
  rsvps: {
    title: 'TICKET RESERVATIONS FROM FANS',
    text: "Fans who reserved tickets / RSVP'd through the website.",
    empty: 'No ticket reservations from visitors yet.',
    Icon: CheckCircle,
    fetchRemote: listTicketRsvps,
    localKey: 'pn_rsvps'
  },
  bookings: {
    title: 'BOOKING REQUESTS FROM PROMOTERS / ORGANIZERS',
    text: 'Stage booking requests sent through the website form.',
    empty: 'No booking requests from promoters / organizers yet.',
    Icon: Inbox,
    fetchRemote: listBookingInquiries,
    localKey: 'pn_bookings'
  }
}

const formatDate = (value) => new Date(value).toLocaleString('en-GB')

function RsvpCard({ rsvp }) {
  return (
    <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-tech space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-bold text-white text-sm">{rsvp.fan_name}</span>
        <span className="text-red-400 font-bold">{rsvp.ticket_count} {rsvp.ticket_count === 1 ? 'Ticket' : 'Tickets'}</span>
      </div>
      <div className="text-neutral-400">
        Event: <strong className="text-neutral-200">{rsvp.event_title}</strong>
      </div>
      <div className="text-neutral-400 flex flex-wrap gap-4 pt-1">
        <span>WhatsApp: <strong>{rsvp.fan_phone}</strong></span>
        <span>Email: <strong>{rsvp.fan_email || '-'}</strong></span>
        <span>Date: {formatDate(rsvp.created_at)}</span>
      </div>
      {rsvp.notes && <div className="text-neutral-500 italic pt-1">Notes: "{rsvp.notes}"</div>}
    </div>
  )
}

function BookingCard({ booking }) {
  return (
    <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-tech space-y-1">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-white text-sm">{booking.event_name}</span>
        <span className="text-red-400 font-bold shrink-0">{booking.event_date}</span>
      </div>
      <div className="text-neutral-400">
        Organizer: <strong className="text-neutral-200">{booking.organizer_name}</strong>
        {' '}&bull; {booking.city}{booking.venue ? `, ${booking.venue}` : ''}
      </div>
      <div className="text-neutral-400 flex flex-wrap gap-4 pt-1">
        <span>WhatsApp: <strong>{booking.phone}</strong></span>
        <span>Email: <strong>{booking.email}</strong></span>
        {booking.event_type && <span>Type: {booking.event_type}</span>}
        {booking.budget_estimate && <span>Budget: {booking.budget_estimate}</span>}
        <span>Date: {formatDate(booking.created_at)}</span>
      </div>
      {booking.message && <div className="text-neutral-500 italic pt-1">Message: "{booking.message}"</div>}
    </div>
  )
}

// Fan RSVPs and booking requests: read from Supabase for a Supabase admin, otherwise from this browser's fallback
export default function InboxTab({ kind, usesSupabaseLogin, active }) {
  const { title, text, empty, Icon, fetchRemote, localKey } = KINDS[kind]
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  // Reads the list without touching state; the effect below puts the answer on screen
  const read = useCallback(async () => {
    if (usesSupabaseLogin) {
      const result = await fetchRemote()
      return { items: result.data, error: result.success ? '' : result.error }
    }
    try {
      return { items: JSON.parse(localStorage.getItem(localKey) || '[]'), error: '' }
    } catch {
      return { items: [], error: '' }
    }
  }, [usesSupabaseLogin, fetchRemote, localKey])

  // Loads when the tab is opened (and again each time it is opened), never in the background
  useEffect(() => {
    if (!active) return undefined
    let cancelled = false
    read().then((outcome) => {
      if (cancelled) return
      setItems(outcome.items)
      setError(outcome.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [active, read, reloadToken])

  const refresh = () => {
    setLoading(true)
    setReloadToken((token) => token + 1)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bebas text-3xl text-white tracking-wide">{title}</h4>
          <p className="text-xs font-tech text-neutral-400">{text}</p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-tech text-neutral-200"
        >
          Refresh Data
        </button>
      </div>

      {error && <Banner tone="error">Could not load the data from the server: {error}</Banner>}

      {items.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 font-tech">
          <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{loading ? 'Loading...' : empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) =>
            kind === 'rsvps' ? <RsvpCard key={item.id ?? idx} rsvp={item} /> : <BookingCard key={item.id ?? idx} booking={item} />
          )}
        </div>
      )}
    </div>
  )
}
