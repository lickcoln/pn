import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MessageSquare, Send, CheckCircle, Download, Radio, ShieldCheck } from 'lucide-react'
import { InstagramIcon, YoutubeIcon, SpotifyIcon, SoundCloudIcon } from './SocialIcons'
import { submitBookingInquiry } from '../lib/supabase'
import { useBandData } from '../context/BandDataContext'

export default function ContactBooking() {
  const { config, currentTheme } = useBandData()
  const contact = config.contact
  const [formData, setFormData] = useState({
    organizerName: '',
    eventName: '',
    eventDate: '',
    city: '',
    venue: '',
    eventType: 'Festival / Gig',
    budgetEstimate: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      organizer_name: formData.organizerName,
      event_name: formData.eventName,
      event_date: formData.eventDate,
      city: formData.city,
      venue: formData.venue,
      event_type: formData.eventType,
      budget_estimate: formData.budgetEstimate,
      email: formData.email,
      phone: formData.phone,
      message: formData.message
    }

    try {
      await submitBookingInquiry(payload)
      setIsSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendToWhatsAppDirect = () => {
    const text = `Halo Paranoid Noise Management! Saya ingin mengajukan booking gig:\n\n*Penyelenggara:* ${formData.organizerName}\n*Nama Acara:* ${formData.eventName}\n*Tanggal:* ${formData.eventDate}\n*Kota & Venue:* ${formData.city} / ${formData.venue}\n*Jenis Acara:* ${formData.eventType}\n*Budget/Penawaran:* ${formData.budgetEstimate || '-'}\n*Kontak:* ${formData.phone} (${formData.email})\n*Pesan:* ${formData.message || '-'}\n\nMohon info ketersediaan jadwal dan technical rider. Terima kasih!`
    const url = `https://wa.me/${contact.whatsappRaw}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <section id="booking" className="py-24 bg-[#050505] relative overflow-hidden border-t border-neutral-900">
      
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 font-tech text-xs uppercase font-bold tracking-widest mb-3">
            <Mail className="w-3.5 h-3.5 text-red-500" /> CONTACT &amp; BOOKING MANAGEMENT
          </div>
          <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
            HUBUNGI <span className="text-red-600">PARANOID NOISE</span>
          </h2>
          <p className="font-tech text-sm text-neutral-400 mt-2">
            Untuk keperluan booking jadwal panggung, media interview, kolaborasi, dan kurasi festival musik.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Direct Contacts & Rider Download */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-6"
          >
            
            {/* Booking Card */}
            <div className="p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-xl space-y-6">
              <h3 className="font-bebas text-3xl text-white tracking-wide">
                BOOKING HOTLINE &amp; MEDIA
              </h3>

              {/* WhatsApp Contact */}
              <a
                href={`https://wa.me/${contact.whatsappRaw}?text=${encodeURIComponent('Halo Paranoid Noise! Saya ingin menanyakan jadwal booking band.')}`}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-green-600/80 flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-green-950/60 border border-green-800 flex items-center justify-center text-green-400 group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-neutral-400 block">
                    WHATSAPP RESMI:
                  </span>
                  <span className="font-tech text-base font-bold text-white group-hover:text-green-400 transition-colors">
                    {contact.whatsappDisplay}
                  </span>
                </div>
              </a>

              {/* Email Contact */}
              <a
                href={`mailto:${contact.email}?subject=Booking Inquiry Paranoid Noise`}
                className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-red-600/80 flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-neutral-400 block">
                    EMAIL RESMI BAND:
                  </span>
                  <span className="font-tech text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate block">
                    {contact.email}
                  </span>
                </div>
              </a>

              {/* Technical Rider Download */}
              <div className="pt-4 border-t border-neutral-900">
                <span className="text-xs font-tech font-bold uppercase text-neutral-300 block mb-2">
                  Technical Rider &amp; Press Kit:
                </span>
                <a
                  href="/band/band_rock_8_1254x1254.png"
                  download="Paranoid_Noise_EPK_Rider.png"
                  className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-600 text-neutral-200 hover:text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-red-500" />
                  <span>UNDUH TECHNICAL RIDER &amp; EPK</span>
                </a>
              </div>

            </div>

            {/* Official Social Media Channels Card */}
            <div className="p-6 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-xl space-y-4">
              <span className="text-xs font-tech font-bold uppercase tracking-widest text-red-500 block">
                IKUTI KANAL RESMI:
              </span>

              <div className="grid grid-cols-2 gap-3 font-tech text-xs">
                
                {/* Instagram */}
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-pink-600/70 text-neutral-300 hover:text-pink-400 flex items-center gap-2.5 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-500" />
                  <div className="truncate">
                    <span className="block font-bold">Instagram</span>
                    <span className="text-[10px] text-neutral-500">@paranoid.noise</span>
                  </div>
                </a>

                {/* Spotify */}
                <a
                  href={contact.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-green-600/70 text-neutral-300 hover:text-green-400 flex items-center gap-2.5 transition-colors"
                >
                  <SpotifyIcon className="w-4 h-4 text-green-500" />
                  <div className="truncate">
                    <span className="block font-bold">Spotify</span>
                    <span className="text-[10px] text-neutral-500">Paranoid Noise</span>
                  </div>
                </a>

                {/* YouTube */}
                <a
                  href={contact.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-red-600/70 text-neutral-300 hover:text-red-400 flex items-center gap-2.5 transition-colors"
                >
                  <YoutubeIcon className="w-4 h-4 text-red-500" />
                  <div className="truncate">
                    <span className="block font-bold">YouTube</span>
                    <span className="text-[10px] text-neutral-500">@paranoid.noise</span>
                  </div>
                </a>

                {/* SoundCloud */}
                <a
                  href={contact.soundcloud}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-orange-600/70 text-neutral-300 hover:text-orange-400 flex items-center gap-2.5 transition-colors"
                >
                  <SoundCloudIcon className="w-4 h-4 text-orange-500" />
                  <div className="truncate">
                    <span className="block font-bold">SoundCloud</span>
                    <span className="text-[10px] text-neutral-500">Paranoid Noise</span>
                  </div>
                </a>

              </div>
            </div>

          </motion.div>

          {/* Right Column: Interactive Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="p-8 rounded-2xl bg-neutral-950/95 border-2 border-neutral-800/90 shadow-2xl relative">
              
              <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide mb-2">
                FORMULIR PENGAJUAN GIGS / EVENT
              </h3>
              <p className="font-tech text-xs text-neutral-400 mb-6">
                Isi data di bawah ini untuk mengundang Paranoid Noise. Tim kami akan segera menanggapi proposal Anda.
              </p>

              {isSuccess ? (
                <div className="p-8 rounded-2xl bg-neutral-900 border border-green-700 text-center space-y-4">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                  <h4 className="font-bebas text-3xl text-white tracking-wide">
                    PROPOSAL BOOKING TERKIRIM!
                  </h4>
                  <p className="font-tech text-xs sm:text-sm text-neutral-300 max-w-md mx-auto">
                    Data booking telah tersimpan. Untuk respon prioritas tercepat, kirimkan juga langsung ke WhatsApp resmi kami:
                  </p>
                  <button
                    onClick={handleSendToWhatsAppDirect}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shadow-xl"
                  >
                    <Send className="w-4 h-4" />
                    <span>KIRIM FORMAT KE WHATSAPP BAND</span>
                  </button>
                  <div>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-xs font-tech text-neutral-400 hover:text-white underline mt-2"
                    >
                      Kirim Formulir Lain
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Nama Penyelenggara / EO *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.organizerName}
                        onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                        placeholder="Contoh: Kolektif Rock Jakarta"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Nama Event / Festival *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.eventName}
                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                        placeholder="Contoh: Grunge Rebellion 2026"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Tanggal Acara *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Kota *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Jakarta / Bandung / dll"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Nama Venue / Lokasi
                      </label>
                      <input
                        type="text"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="Gedung / Club / Studio"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Jenis Acara
                      </label>
                      <select
                        value={formData.eventType}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      >
                        <option value="Festival Musik">Festival Musik</option>
                        <option value="Underground Club Gig">Underground Club Gig</option>
                        <option value="Pensi Kampus / Sekolah">Pensi Kampus / Sekolah</option>
                        <option value="Showcase Band">Showcase Band</option>
                        <option value="Tour Kota / Regional">Tour Kota / Regional</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Estimasi Budget / Penawaran (IDR)
                      </label>
                      <input
                        type="text"
                        value={formData.budgetEstimate}
                        onChange={(e) => setFormData({ ...formData, budgetEstimate: e.target.value })}
                        placeholder="Contoh: Negotiable / Rp ..."
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        No. WhatsApp Kontak *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                        Email Resmi *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="organizer@gmail.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                      Catatan / Kebutuhan Tambahan
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tuliskan durasi manggung yang diinginkan, lineup band lain, atau akomodasi..."
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-950/60"
                    >
                      {isSubmitting ? 'Mengirim Proposal...' : 'KIRIM PROPOSAL BOOKING'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendToWhatsAppDirect}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-green-400" />
                      <span>KIRIM VIA WHATSAPP LANGSUNG</span>
                    </button>
                  </div>

                </form>
              )}

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  )
}
