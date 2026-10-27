import React from 'react'
import { ArrowUp, Phone, Mail } from 'lucide-react'
import { SOCIAL_STYLES } from './socialStyles'
import { formatWhatsApp, socialChannels, whatsappLink } from '../lib/contactInfo'
import { useBandData } from '../context/BandDataContext'

const THIS_YEAR = new Date().getFullYear()

export default function Footer() {
  const { config, currentTheme } = useBandData()
  const { contact, members, texts } = config
  const channels = socialChannels(contact)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-black border-t border-neutral-900 py-10 sm:py-16 relative overflow-hidden">
      
      {/* Background Accent */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: currentTheme.primaryColor }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 pb-8 sm:pb-12 border-b border-neutral-900">
          
          {/* Logo & Bio Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 p-1 flex items-center justify-center">
                <img src={config.images.logo} alt="Paranoid Noise" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bebas text-3xl tracking-wider text-white block leading-none">
                  {texts.siteName}
                </span>
                {texts.footerGenre && (
                  <span className="text-[10px] font-tech text-neutral-400 tracking-widest uppercase">
                    {texts.footerGenre}
                  </span>
                )}
              </div>
            </div>

            {texts.footerAbout && (
              <p className="text-xs font-tech text-neutral-400 leading-relaxed max-w-sm">
                {texts.footerAbout}
              </p>
            )}

            <div className="text-xs font-tech text-neutral-500">
              <span className="text-neutral-300 font-bold">Lineup:</span>{' '}
              {members.map(m => `${m.name} (${m.role})`).join(' • ')}
            </div>
          </div>

          {/* Quick Nav Links (phones already have the tab bar at the bottom) */}
          <div className="hidden md:block md:col-span-3 space-y-3 font-tech text-xs">
            <span className="text-white font-bold uppercase tracking-wider block text-sm font-bebas">
              SITE MENU
            </span>
            <ul className="space-y-2 text-neutral-400">
              <li><a href="#profile" className="hover:text-red-400 transition-colors">Band Profile &amp; History</a></li>
              <li><a href="#personnel" className="hover:text-red-400 transition-colors">Band Lineup</a></li>
              <li><a href="#discography" className="hover:text-red-400 transition-colors">Singles &amp; Stompbox Player</a></li>
              <li><a href="#gigs" className="hover:text-red-400 transition-colors">Gigs &amp; Tickets</a></li>
              <li><a href="#merch" className="hover:text-red-400 transition-colors">Official Merchandise</a></li>
              <li><a href="#booking" className="hover:text-red-400 transition-colors">Booking &amp; Management Contact</a></li>
            </ul>
          </div>

          {/* Social Channels & Contacts */}
          <div className="md:col-span-4 space-y-4">
            <span className="text-white font-bold uppercase tracking-wider block text-sm font-bebas">
              OFFICIAL CHANNELS
            </span>

            <div className="flex flex-wrap gap-2.5">
              {channels.map(({ key, label, url, handle }) => {
                const { Icon, hoverClass } = SOCIAL_STYLES[key]
                const name = handle === label ? label : `${label} ${handle}`
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 transition-colors ${hoverClass}`}
                    title={name}
                    aria-label={name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}

              <a
                href={whatsappLink(contact.whatsappRaw)}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-green-400 hover:border-green-600/70 transition-colors"
                title="WhatsApp Band"
                aria-label="WhatsApp the band"
              >
                <Phone className="w-5 h-5" />
              </a>

              <a
                href={`mailto:${contact.email}`}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-red-400 hover:border-red-600/70 transition-colors"
                title="Email Band"
                aria-label="Email the band"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>

            <div className="pt-2 text-xs font-tech text-neutral-400 space-y-1">
              <div><strong className="text-neutral-200">Email:</strong> {contact.email}</div>
              <div><strong className="text-neutral-200">WhatsApp:</strong> {formatWhatsApp(contact.whatsappRaw)}</div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-tech text-neutral-500">
          <div>
            &copy; {THIS_YEAR} {texts.siteName}. All Rights Reserved. Built for the Indonesian Underground.
          </div>

          {/* Scroll To Top Button (centred under the text on a phone, at the right edge beside it on a wide screen) */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-600 text-neutral-300 hover:text-white transition-colors"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>

      </div>
    </footer>
  )
}
