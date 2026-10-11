import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag, Radio, Volume2, VolumeX, Flame } from 'lucide-react'
import { audioEngine } from '../utils/audioSynth'

export default function Navbar({ cartCount, onOpenCart, distortionActive, onToggleDistortion }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'PROFIL', href: '#profile' },
    { name: 'PERSONIL', href: '#personnel' },
    { name: 'DISCOGRAPHY', href: '#discography' },
    { name: 'JADWAL GIGS', href: '#gigs' },
    { name: 'MERCHANDISE', href: '#merch' },
    { name: 'BOOKING & KONTAK', href: '#booking' }
  ]

  const handleLinkClick = (e, href) => {
    e.preventDefault()
    setIsOpen(false)
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-red-950/60 shadow-2xl shadow-red-950/20 py-2.5'
          : 'bg-gradient-to-b from-black/95 via-black/70 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo with Stompbox mark */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900/80 p-0.5 group-hover:border-red-600 transition-colors">
              <img
                src="/logo.png"
                alt="Paranoid Noise Logo"
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex flex-col text-left">
              <span className="font-bebas text-2xl sm:text-3xl tracking-wider text-white group-hover:text-red-500 transition-colors leading-none">
                PARANOID NOISE
              </span>
              <span className="text-[10px] tracking-widest text-neutral-400 uppercase font-tech">
                JAKARTA PUNK ROCK &bull; 90'S GRUNGE
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-xs uppercase tracking-widest font-tech font-semibold text-neutral-300 hover:text-white hover:text-red-400 relative py-1 transition-colors group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Interactive Distortion Stompbox Switch */}
            <button
              onClick={() => {
                audioEngine.playFootswitchClick()
                onToggleDistortion()
              }}
              title="Toggle Guitar Distortion Overdrive FX"
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-tech font-bold uppercase tracking-wider transition-all stompbox-button ${
                distortionActive
                  ? 'border-red-600 bg-red-950/40 text-red-300 shadow-md shadow-red-900/40'
                  : 'border-neutral-800 bg-neutral-900/70 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  distortionActive
                    ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse'
                    : 'bg-neutral-600'
                }`}
              />
              <Flame className={`w-3.5 h-3.5 ${distortionActive ? 'text-red-500' : 'text-neutral-500'}`} />
              <span className="text-[11px]">DISTORTION {distortionActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 hover:border-red-600/70 text-neutral-300 hover:text-white transition-colors"
              title="Keranjang Merchandise"
              aria-label="Buka Keranjang"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-neutral-950/98 border-b border-red-950/80 px-4 pt-3 pb-6 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="px-3 py-2.5 rounded-md text-sm font-tech font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-red-950/30 hover:border-l-4 hover:border-red-600 transition-all text-left flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <span className="text-neutral-600 text-xs">&rarr;</span>
                </a>
              ))}

              {/* Mobile Stompbox FX Button */}
              <div className="pt-2 border-t border-neutral-900 flex items-center justify-between px-3">
                <span className="text-xs font-tech text-neutral-400 uppercase">Gitar Overdrive FX:</span>
                <button
                  onClick={() => {
                    audioEngine.playFootswitchClick()
                    onToggleDistortion()
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-tech font-bold uppercase ${
                    distortionActive
                      ? 'border-red-600 bg-red-950/50 text-red-300'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      distortionActive ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-neutral-600'
                    }`}
                  />
                  <span>DISTORTION {distortionActive ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Mobile Social Links */}
              <div className="flex items-center justify-center gap-4 pt-3 text-xs text-neutral-400 font-tech">
                <a
                  href="https://instagram.com/paranoid.noise"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-400 transition-colors"
                >
                  Instagram
                </a>
                <span>&bull;</span>
                <a
                  href="https://open.spotify.com/artist/paranoidnoise"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-400 transition-colors"
                >
                  Spotify
                </a>
                <span>&bull;</span>
                <a
                  href="https://youtube.com/@paranoid.noise"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-400 transition-colors"
                >
                  YouTube
                </a>
                <span>&bull;</span>
                <a
                  href="https://soundcloud.com/paranoidnoise"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-400 transition-colors"
                >
                  SoundCloud
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
