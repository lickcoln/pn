import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, Ticket, X } from 'lucide-react'
import FormResult from './FormResult'
import Field from './FormField'
import { submitTicketRsvp } from '../lib/supabase'
import { externalUrl, whatsappLink } from '../lib/contactInfo'
import { MONTH_ABBREVIATIONS, isSoldOutGig, splitGigs } from '../lib/gigs'
import { useModal } from '../lib/useModal'
import { useBandData } from '../context/BandDataContext'

const EMPTY_RSVP = { name: '', phone: '', email: '', ticketCount: 1, notes: '' }
const PAST_PREVIEW = 3

const STATUS_TONES = {
  open: 'bg-green-950/50 border-green-800 text-green-400',
  limited: 'bg-amber-950/50 border-amber-700 text-amber-400',
  sold: 'bg-neutral-800 border-neutral-700 text-neutral-300',
  neutral: 'bg-neutral-900 border-neutral-700 text-neutral-300'
}

function statusTone(gig, past) {
  if (past || isSoldOutGig(gig)) return 'sold'
  if (/limited|left|few/i.test(gig.status)) return 'limited'
  if (/available|on sale|open|presale/i.test(gig.status)) return 'open'
  return 'neutral'
}

// The date as a compact tag; a date that could not be read is shown exactly as it was typed
function DateTag({ gig, date, past }) {
  const tone = past ? 'text-neutral-400' : 'text-white'
  return (
    <div className="w-[4.5rem] sm:w-24 shrink-0 px-2 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
      {date ? (
        <>
          <span className={`block font-bebas text-3xl sm:text-4xl leading-none ${tone}`}>
            {date.endDay !== date.day ? `${date.day}-${date.endDay}` : date.day}
          </span>
          <span className="block font-bebas text-base sm:text-lg tracking-widest text-red-500 leading-none mt-1">
            {MONTH_ABBREVIATIONS[date.month]}
          </span>
          <span className="block text-[10px] font-mono text-neutral-400 mt-1">{date.year}</span>
        </>
      ) : (
        <span className={`block font-bebas text-lg leading-tight ${tone}`}>{gig.date || 'TBA'}</span>
      )}
    </div>
  )
}

function GigCard({ entry, past, index, onReserve }) {
  const { gig, date } = entry
  const soldOut = !past && isSoldOutGig(gig)
  const showCategory = gig.category && !/^\s*past\b/i.test(gig.category)
  const mapsUrl = externalUrl(gig.mapsUrl)

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index, 4) * 0.08 }}
      className={`relative rounded-2xl border p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 transition-all duration-300 group ${
        past
          ? 'bg-neutral-950/50 border-neutral-900 opacity-70'
          : 'bg-neutral-950/90 border-neutral-800 hover:border-red-600/80 shadow-xl hover:shadow-red-950/30 hover:-translate-y-1'
      }`}
    >
      {/* Left: date tag and event details */}
      <div className="flex items-start gap-4 sm:gap-5 min-w-0">
        <DateTag gig={gig} date={date} past={past} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            {showCategory && (
              <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800 text-[10px] font-tech font-bold uppercase tracking-wider text-red-400">
                {gig.category}
              </span>
            )}
            {gig.status && (
              <span className={`px-2 py-0.5 rounded border text-[10px] font-tech font-bold uppercase tracking-wider ${STATUS_TONES[statusTone(gig, past)]}`}>
                {gig.status}
              </span>
            )}
            {gig.time && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-neutral-400">
                <Clock className="w-3 h-3" />
                {gig.time}
              </span>
            )}
          </div>

          <h3 className={`font-bebas text-2xl sm:text-4xl text-white tracking-wide leading-tight transition-colors ${past ? '' : 'group-hover:text-red-500'}`}>
            {gig.title}
          </h3>

          {(gig.venue || gig.city) && (
            <p className="flex items-start gap-1.5 text-xs font-tech text-neutral-300 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>{gig.venue}</strong>
                {gig.venue && gig.city ? ', ' : ''}
                {gig.city}
              </span>
            </p>
          )}

          {gig.description && (
            <p className="text-xs font-tech text-neutral-400 mt-2 line-clamp-2 max-w-xl">{gig.description}</p>
          )}
        </div>
      </div>

      {/* Right: price and actions */}
      <div className="flex flex-wrap items-center gap-3 md:shrink-0 md:flex-nowrap">
        {!past && gig.price && (
          <span className="mr-auto md:mr-2 font-mono text-sm font-bold text-neutral-200 whitespace-nowrap">{gig.price}</span>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${gig.venue || 'the location'} on the map`}
            className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <MapPin className="w-4 h-4" />
          </a>
        )}

        {past ? (
          <span className="px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 font-tech text-xs uppercase font-bold">
            SHOW FINISHED
          </span>
        ) : soldOut ? (
          <span className="px-5 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-400 font-tech text-xs uppercase font-bold tracking-wider">
            SOLD OUT
          </span>
        ) : (
          <button
            onClick={() => onReserve(gig)}
            className="px-5 sm:px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-xs uppercase tracking-wider whitespace-nowrap flex items-center gap-2 transition-all shadow-lg shadow-red-950/50 hover:scale-105"
          >
            <Ticket className="w-4 h-4" />
            <span>GET TICKETS / RSVP</span>
          </button>
        )}
      </div>
    </motion.article>
  )
}

export default function EventSchedule() {
  const { config, currentTheme } = useBandData()
  const { upcoming, past } = splitGigs(config.gigs)
  const [showAllPast, setShowAllPast] = useState(false)
  const [selectedGigId, setSelectedGigId] = useState(null)
  const [rsvpForm, setRsvpForm] = useState(EMPTY_RSVP)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // null while the form is open, then { delivered } once the visitor has pressed submit
  const [result, setResult] = useState(null)

  // Looked up on every render, so the popup follows an edited show and disappears if the show is deleted
  const selectedGig = config.gigs.find((gig) => gig.id === selectedGigId) ?? null

  const handleOpenRsvp = (gig) => {
    setSelectedGigId(gig.id)
    setResult(null)
  }

  const handleCloseModal = () => {
    // A reservation that went through is finished; an unfinished one keeps what was typed
    if (result?.delivered) setRsvpForm(EMPTY_RSVP)
    setSelectedGigId(null)
    setResult(null)
  }

  useModal(Boolean(selectedGig), handleCloseModal)

  const bind = (key) => ({
    value: rsvpForm[key],
    onChange: (e) => setRsvpForm((prev) => ({ ...prev, [key]: key === 'ticketCount' ? Number(e.target.value) : e.target.value }))
  })

  const handleSubmitRsvp = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      event_id: selectedGig.id,
      event_title: selectedGig.title,
      fan_name: rsvpForm.name,
      fan_phone: rsvpForm.phone,
      fan_email: rsvpForm.email,
      ticket_count: rsvpForm.ticketCount,
      notes: rsvpForm.notes
    }

    try {
      const outcome = await submitTicketRsvp(payload)
      setResult({ delivered: outcome.mode === 'supabase' })
    } catch (err) {
      console.error(err)
      setResult({ delivered: false })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendToWhatsApp = () => {
    const text = `Hello Paranoid Noise! I would like to confirm my tickets for:\n\n*Event:* ${selectedGig.title}\n*Date:* ${selectedGig.date}\n*Location:* ${[selectedGig.venue, selectedGig.city].filter(Boolean).join(', ')}\n*Name:* ${rsvpForm.name}\n*Number of tickets:* ${rsvpForm.ticketCount}\n*Phone/WhatsApp:* ${rsvpForm.phone}\n*Email:* ${rsvpForm.email || '-'}\n\nPlease send me the payment details / e-ticket. Thank you!`
    window.open(whatsappLink(config.contact.whatsappRaw, text), '_blank')
  }

  const visiblePast = showAllPast ? past : past.slice(0, PAST_PREVIEW)

  return (
    <section id="gigs" className="py-16 sm:py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-neutral-900">

      {/* Background Ambience */}
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-red-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 pb-6 border-b border-neutral-800">
          <div>
            <div
              className="flex items-center gap-2 font-tech font-bold text-xs uppercase tracking-widest mb-2"
              style={{ color: currentTheme.primaryColor }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: currentTheme.primaryColor }}
              />{' '}
              EVENT &amp; TOUR SCHEDULE
            </div>
            <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
              TOUR &amp; <span style={{ color: currentTheme.primaryColor }}>LIVE DATES</span>
            </h2>
          </div>
          <p className="mt-4 md:mt-0 font-tech text-sm text-neutral-400 max-w-md">
            Witness the explosive stage energy of Paranoid Noise live from the front row of the moshpit. Get your tickets or reserve now!
          </p>
        </div>

        {/* Upcoming shows, soonest first */}
        <div className="space-y-4 max-w-5xl mx-auto">
          {upcoming.map((entry, idx) => (
            <GigCard key={entry.gig.id} entry={entry} past={false} index={idx} onReserve={handleOpenRsvp} />
          ))}

          {upcoming.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center font-tech text-sm text-neutral-400">
              No upcoming shows are announced right now. Follow our channels for news, or invite us to your city below.
            </div>
          )}
        </div>

        {/* Shows that already happened */}
        {past.length > 0 && (
          <div className="space-y-4 max-w-5xl mx-auto mt-10">
            <div className="flex items-center gap-4">
              <span className="font-bebas text-2xl tracking-widest text-neutral-500">PAST SHOWS</span>
              <span className="h-px grow bg-neutral-800" />
            </div>
            {visiblePast.map((entry, idx) => (
              <GigCard key={entry.gig.id} entry={entry} past index={idx} onReserve={handleOpenRsvp} />
            ))}
            {past.length > PAST_PREVIEW && (
              <button
                onClick={() => setShowAllPast((value) => !value)}
                className="w-full py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors"
              >
                {showAllPast ? 'Show fewer past shows' : `Show all ${past.length} past shows`}
              </button>
            )}
          </div>
        )}

        {/* Bring PN To Your City Banner */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-red-950/40 via-neutral-950 to-neutral-950 border border-red-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wider">
              WANT PARANOID NOISE IN YOUR CITY?
            </h3>
            <p className="font-tech text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl">
              We are ready to rock campus festivals, underground gigs, club showcases, and regional tours.
            </p>
          </div>
          <a
            href="#booking"
            className="w-full md:w-auto text-center px-8 py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-tech font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
          >
            CONTACT BOOKING AGENT
          </a>
        </div>

      </div>

      {/* Ticket RSVP Modal */}
      <AnimatePresence>
        {selectedGig && (
          <motion.div
            key="rsvp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md"
          >
            {/* A tap on the dark area closes the popup; the popup scrolls inside this layer on short screens */}
            <div
              className="min-h-full flex items-center justify-center p-4"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) handleCloseModal()
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="rsvp-title"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-neutral-950 border-2 border-neutral-800 rounded-3xl p-5 sm:p-8 max-w-lg w-full relative shadow-2xl text-left"
              >
                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  aria-label="Close"
                  className="absolute top-4 right-4 p-2.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6 pr-12">
                  <span className="text-[10px] font-tech font-bold text-red-500 uppercase tracking-widest">
                    GIG TICKET RESERVATION
                  </span>
                  <h3 id="rsvp-title" className="font-bebas text-3xl sm:text-4xl text-white tracking-wider leading-none mt-1">
                    {selectedGig.title}
                  </h3>
                  <p className="font-tech text-xs text-neutral-400 mt-1">
                    {[selectedGig.venue, selectedGig.city].filter(Boolean).join(', ')}
                    {selectedGig.date ? ` • ${selectedGig.date}` : ''}
                    {selectedGig.price ? ` (${selectedGig.price})` : ''}
                  </p>
                </div>

                {result ? (
                  <FormResult
                    delivered={result.delivered}
                    sentTitle="RESERVATION SENT!"
                    sentText="We have received your details. Tap the button below to confirm instantly via the official Paranoid Noise WhatsApp:"
                    failedText="We could not reach our server, so your reservation has not been recorded. Please confirm it through WhatsApp instead. Your details are already filled in:"
                    onWhatsApp={handleSendToWhatsApp}
                    whatsAppLabel="CONFIRM VIA BAND WHATSAPP"
                    onBack={result.delivered ? handleCloseModal : () => setResult(null)}
                    backLabel={result.delivered ? 'Close' : 'Back to the form'}
                  />
                ) : (
                  <form onSubmit={handleSubmitRsvp} className="space-y-4">
                    <Field
                      label="Full Name *"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Enter your name"
                      {...bind('name')}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="WhatsApp Number *"
                        type="tel"
                        inputMode="tel"
                        required
                        autoComplete="tel"
                        placeholder="e.g. 08123456789"
                        {...bind('phone')}
                      />
                      <Field label="Number of Tickets" as="select" {...bind('ticketCount')}>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Ticket' : 'Tickets'}</option>
                        ))}
                      </Field>
                    </div>

                    <Field
                      label="Email"
                      type="email"
                      autoComplete="email"
                      placeholder="email@example.com"
                      {...bind('email')}
                    />

                    <Field
                      label="Additional Notes (Optional)"
                      as="textarea"
                      rows={2}
                      className="resize-none"
                      placeholder="A message for the Paranoid Noise members..."
                      {...bind('notes')}
                    />

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-3 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white text-xs font-tech font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-wait text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                        {isSubmitting ? 'Sending...' : 'Submit Ticket Reservation'}
                      </button>
                    </div>
                  </form>
                )}

              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  )
}
