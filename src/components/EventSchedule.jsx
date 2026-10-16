import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Clock, Ticket, ExternalLink, CheckCircle, AlertCircle, X, Send } from 'lucide-react'
import { submitTicketRsvp } from '../lib/supabase'
import { useBandData } from '../context/BandDataContext'

export default function EventSchedule() {
  const { config, currentTheme } = useBandData()
  const gigs = config.gigs
  const [selectedGig, setSelectedGig] = useState(null)
  const [rsvpForm, setRsvpForm] = useState({
    name: '',
    phone: '',
    email: '',
    ticketCount: 1,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleOpenRsvp = (gig) => {
    setSelectedGig(gig)
    setSubmitSuccess(false)
  }

  const handleCloseModal = () => {
    setSelectedGig(null)
    setSubmitSuccess(false)
    setRsvpForm({ name: '', phone: '', email: '', ticketCount: 1, notes: '' })
  }

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
      await submitTicketRsvp(payload)
      setSubmitSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendToWhatsApp = () => {
    const text = `Halo Paranoid Noise! Saya mau konfirmasi tiket untuk:\n\n*Event:* ${selectedGig.title}\n*Tanggal:* ${selectedGig.date}\n*Lokasi:* ${selectedGig.venue}, ${selectedGig.city}\n*Nama:* ${rsvpForm.name}\n*Jumlah Tiket:* ${rsvpForm.ticketCount}\n*No. HP/WA:* ${rsvpForm.phone}\n*Email:* ${rsvpForm.email}\n\nMohon info pembayaran/e-ticketnya. Terima kasih!`
    const url = `https://wa.me/${config.contact.whatsappRaw}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <section id="gigs" className="py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-neutral-900">
      
      {/* Background Ambience */}
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-red-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-neutral-800">
          <div>
            <div
              className="flex items-center gap-2 font-tech font-bold text-xs uppercase tracking-widest mb-2"
              style={{ color: currentTheme.primaryColor }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: currentTheme.primaryColor }}
              />{' '}
              JADWAL EVENT &amp; TOUR
            </div>
            <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
              TOUR &amp; <span style={{ color: currentTheme.primaryColor }}>LIVE DATES</span>
            </h2>
          </div>
          <p className="mt-4 md:mt-0 font-tech text-sm text-neutral-400 max-w-md">
            Saksikan energi panggung eksplosif Paranoid Noise langsung dari barisan depan moshpit. Dapatkan tiket atau reservasi sekarang!
          </p>
        </div>

        {/* Tour Dates List */}
        <div className="space-y-4 max-w-5xl mx-auto">
          {gigs.map((gig, idx) => {
            const isPast = gig.category === 'Past Gig'

            return (
              <motion.div
                key={gig.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`relative rounded-2xl border p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 group hover:-translate-y-1 ${
                  isPast
                    ? 'bg-neutral-950/50 border-neutral-900 opacity-70'
                    : 'bg-neutral-950/90 border-neutral-800 hover:border-red-600/80 shadow-xl hover:shadow-red-950/30'
                }`}
              >
                
                {/* Left: Date Badge & Event Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  
                  {/* Big Date Tag */}
                  <div className="min-w-36 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center group-hover:border-red-600 transition-colors">
                    <Calendar className="w-4 h-4 text-red-500 mb-1" />
                    <span className="font-bebas text-xl text-white tracking-wider leading-none">
                      {gig.date}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 mt-1">
                      {gig.time}
                    </span>
                  </div>

                  {/* Gig Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800 text-[10px] font-tech font-bold uppercase tracking-wider text-red-400">
                        {gig.category}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        {gig.price}
                      </span>
                    </div>

                    <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide group-hover:text-red-500 transition-colors">
                      {gig.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-tech text-neutral-400 mt-1">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <strong>{gig.venue}</strong>, {gig.city}
                      </span>
                    </div>

                    <p className="text-xs font-tech text-neutral-400 mt-2 line-clamp-1 max-w-xl">
                      {gig.description}
                    </p>
                  </div>

                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  {gig.mapsUrl && (
                    <a
                      href={gig.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-colors"
                      title="Lihat Peta Lokasi"
                    >
                      <MapPin className="w-4 h-4" />
                    </a>
                  )}

                  {!isPast ? (
                    <button
                      onClick={() => handleOpenRsvp(gig)}
                      className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-red-950/50 hover:scale-105"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>PESAN TIKET / RSVP</span>
                    </button>
                  ) : (
                    <span className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 font-tech text-xs uppercase font-bold">
                      SHOW SELESAI
                    </span>
                  )}
                </div>

              </motion.div>
            )
          })}
        </div>

        {/* Bring PN To Your City Banner */}
        <div className="mt-16 max-w-5xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-red-950/40 via-neutral-950 to-neutral-950 border border-red-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wider">
              INGIN PARANOID NOISE MANGGUNG DI KOTAMU?
            </h3>
            <p className="font-tech text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl">
              Kami siap mengguncang panggung festival kampus, gig underground, showcase klub, maupun tour regional.
            </p>
          </div>
          <a
            href="#booking"
            className="px-8 py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-tech font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
          >
            HUBUNGI BOOKING AGENT
          </a>
        </div>

      </div>

      {/* Ticket RSVP Modal */}
      <AnimatePresence>
        {selectedGig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl text-left"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-5 right-5 p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-[10px] font-tech font-bold text-red-500 uppercase tracking-widest">
                  RESERVASI TIKET GIGS
                </span>
                <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wider leading-none mt-1">
                  {selectedGig.title}
                </h3>
                <p className="font-tech text-xs text-neutral-400 mt-1">
                  {selectedGig.venue}, {selectedGig.city} &bull; {selectedGig.date} ({selectedGig.price})
                </p>
              </div>

              {submitSuccess ? (
                <div className="p-6 rounded-2xl bg-neutral-900 border border-green-700/60 text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <h4 className="font-bebas text-2xl text-white tracking-wide">
                    RESERVASI BERHASIL TERSIMPAN!
                  </h4>
                  <p className="font-tech text-xs text-neutral-300">
                    Data Anda telah kami catat. Klik tombol di bawah untuk konfirmasi instan via WhatsApp resmi band Paranoid Noise:
                  </p>
                  <button
                    onClick={handleSendToWhatsApp}
                    className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>KONFIRMASI KE WHATSAPP BAND</span>
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="text-xs font-tech text-neutral-400 hover:text-white underline"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRsvp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={rsvpForm.name}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                      placeholder="Masukkan nama Anda"
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        No. WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={rsvpForm.phone}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                        placeholder="Contoh: 08123456789"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Jumlah Tiket
                      </label>
                      <select
                        value={rsvpForm.ticketCount}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, ticketCount: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>{num} Tiket</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={rsvpForm.email}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={rsvpForm.notes}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, notes: e.target.value })}
                      placeholder="Pesan untuk personil Paranoid Noise..."
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white text-xs font-tech font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Kirim Reservasi Tiket'}
                    </button>
                  </div>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  )
}
