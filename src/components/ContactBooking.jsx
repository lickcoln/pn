import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Send, Download } from 'lucide-react'
import { SOCIAL_STYLES } from './socialStyles'
import FormResult from './FormResult'
import Field from './FormField'
import { submitBookingInquiry } from '../lib/supabase'
import { formatWhatsApp, socialChannels, whatsappLink } from '../lib/contactInfo'
import { todayIso } from '../lib/gigs'
import { useBandData } from '../context/BandDataContext'

const EMPTY_FORM = {
  organizerName: '',
  eventName: '',
  eventDate: '',
  city: '',
  venue: '',
  eventType: 'Music Festival',
  budgetEstimate: '',
  email: '',
  phone: '',
  message: ''
}

export default function ContactBooking() {
  const { config } = useBandData()
  const contact = config.contact
  const channels = socialChannels(contact)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // null while the form is open, then { delivered } once the visitor has pressed send
  const [result, setResult] = useState(null)
  const cardRef = useRef(null)

  // The form is long, so on a phone the answer would appear above the visitor's screen
  useEffect(() => {
    if (result) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [result])

  const bind = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))
  })

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
      const outcome = await submitBookingInquiry(payload)
      setResult({ delivered: outcome.mode === 'supabase' })
    } catch (err) {
      console.error(err)
      setResult({ delivered: false })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendToWhatsAppDirect = () => {
    const text = `Hello Paranoid Noise Management! I would like to submit a gig booking request:\n\n*Organizer:* ${formData.organizerName}\n*Event name:* ${formData.eventName}\n*Date:* ${formData.eventDate}\n*City & venue:* ${formData.city} / ${formData.venue}\n*Event type:* ${formData.eventType}\n*Budget/offer:* ${formData.budgetEstimate || '-'}\n*Contact:* ${formData.phone} (${formData.email})\n*Message:* ${formData.message || '-'}\n\nPlease let me know your availability and the technical rider. Thank you!`
    window.open(whatsappLink(contact.whatsappRaw, text), '_blank')
  }

  // The `download` attribute is ignored for files hosted on another domain (like the uploaded
  // press kit), so fetch the file and save it from memory instead
  const pressKitUrl = config.images.pressKit
  const handleDownloadPressKit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(pressKitUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const extension = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Paranoid_Noise_EPK_Rider.${extension}`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      window.open(pressKitUrl, '_blank')
    }
  }

  return (
    <section id="booking" className="py-16 sm:py-24 bg-[#050505] relative overflow-hidden border-t border-neutral-900">

      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 font-tech text-xs uppercase font-bold tracking-widest mb-3">
            <Mail className="w-3.5 h-3.5 text-red-500" /> CONTACT &amp; BOOKING MANAGEMENT
          </div>
          <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
            CONTACT <span className="text-red-600">PARANOID NOISE</span>
          </h2>
          {config.texts.bookingIntro && (
            <p className="font-tech text-sm text-neutral-400 mt-2 text-balance">
              {config.texts.bookingIntro}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Left Column: Direct Contacts & Rider Download */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-6"
          >

            {/* Booking Card */}
            <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-xl space-y-6">
              <h3 className="font-bebas text-3xl text-white tracking-wide">
                BOOKING HOTLINE &amp; MEDIA
              </h3>

              {/* WhatsApp Contact */}
              <a
                href={whatsappLink(contact.whatsappRaw, 'Hello Paranoid Noise! I would like to ask about booking the band.')}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-green-600/80 flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-green-950/60 border border-green-800 flex items-center justify-center text-green-400 group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-neutral-400 block">
                    OFFICIAL WHATSAPP:
                  </span>
                  <span className="font-tech text-base font-bold text-white group-hover:text-green-400 transition-colors">
                    {formatWhatsApp(contact.whatsappRaw)}
                  </span>
                </div>
              </a>

              {/* Email Contact */}
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent('Booking Inquiry Paranoid Noise')}`}
                className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-red-600/80 flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-neutral-400 block">
                    OFFICIAL BAND EMAIL:
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
                  href={pressKitUrl}
                  onClick={handleDownloadPressKit}
                  className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-600 text-neutral-200 hover:text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-red-500" />
                  <span>DOWNLOAD TECHNICAL RIDER &amp; EPK</span>
                </a>
              </div>

            </div>

            {/* Official Social Media Channels Card (a channel without a link is left out) */}
            {channels.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-xl space-y-4">
                <span className="text-xs font-tech font-bold uppercase tracking-widest text-red-500 block">
                  FOLLOW OUR OFFICIAL CHANNELS:
                </span>

                <div className="grid grid-cols-2 gap-3 font-tech text-xs">
                  {channels.map(({ key, label, url, handle }) => {
                    const { Icon, iconClass, hoverClass } = SOCIAL_STYLES[key]
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className={`p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-2.5 transition-colors ${hoverClass}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
                        <div className="min-w-0">
                          <span className="block font-bold">{label}</span>
                          <span className="block truncate text-[10px] text-neutral-500">{handle}</span>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

          </motion.div>

          {/* Right Column: Interactive Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div ref={cardRef} className="p-5 sm:p-8 rounded-2xl bg-neutral-950/95 border-2 border-neutral-800/90 shadow-2xl relative">

              <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide mb-2">
                GIG / EVENT BOOKING FORM
              </h3>
              <p className="font-tech text-xs text-neutral-400 mb-6">
                Fill in the details below to invite Paranoid Noise. Our team will respond to your proposal shortly.
              </p>

              {result ? (
                <FormResult
                  delivered={result.delivered}
                  sentTitle="BOOKING PROPOSAL SENT!"
                  sentText="Your booking details have been delivered to the band's management. For the fastest priority response, also send them directly to our official WhatsApp:"
                  failedText="We could not reach our server, so the band has not received your proposal. Please send it through WhatsApp instead. Your details are already filled in:"
                  onWhatsApp={handleSendToWhatsAppDirect}
                  whatsAppLabel="SEND DETAILS TO BAND WHATSAPP"
                  onBack={() => {
                    if (result.delivered) setFormData(EMPTY_FORM)
                    setResult(null)
                  }}
                  backLabel={result.delivered ? 'Send another form' : 'Back to the form'}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Organizer / Event Organizer Name *"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="e.g. Jakarta Rock Collective"
                      {...bind('organizerName')}
                    />
                    <Field
                      label="Event / Festival Name *"
                      type="text"
                      required
                      placeholder="e.g. Grunge Rebellion 2026"
                      {...bind('eventName')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Event Date *" type="date" required min={todayIso()} {...bind('eventDate')} />
                    <Field
                      label="City *"
                      type="text"
                      required
                      autoComplete="address-level2"
                      placeholder="Jakarta / Bandung / etc."
                      {...bind('city')}
                    />
                    <Field label="Venue Name / Location" type="text" placeholder="Hall / Club / Studio" {...bind('venue')} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Event Type" as="select" {...bind('eventType')}>
                      <option value="Music Festival">Music Festival</option>
                      <option value="Underground Club Gig">Underground Club Gig</option>
                      <option value="Campus / School Event">Campus / School Event</option>
                      <option value="Band Showcase">Band Showcase</option>
                      <option value="City / Regional Tour">City / Regional Tour</option>
                      <option value="Other">Other</option>
                    </Field>
                    <Field
                      label="Budget / Offer Estimate (IDR)"
                      type="text"
                      placeholder="e.g. Negotiable / IDR ..."
                      {...bind('budgetEstimate')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Contact WhatsApp Number *"
                      type="tel"
                      inputMode="tel"
                      required
                      autoComplete="tel"
                      placeholder="08xxxxxxxxxx"
                      {...bind('phone')}
                    />
                    <Field
                      label="Official Email *"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="organizer@gmail.com"
                      {...bind('email')}
                    />
                  </div>

                  <Field
                    label="Notes / Additional Requirements"
                    as="textarea"
                    rows={3}
                    className="resize-none"
                    placeholder="Tell us the set length you want, the other bands on the lineup, or accommodation..."
                    {...bind('message')}
                  />

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-wait text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-950/60"
                    >
                      {isSubmitting ? 'Sending Proposal...' : 'SEND BOOKING PROPOSAL'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendToWhatsAppDirect}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-green-400" />
                      <span>SEND DIRECTLY VIA WHATSAPP</span>
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
