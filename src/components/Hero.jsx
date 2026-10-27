import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Calendar, Zap, MessageSquare, Volume2 } from 'lucide-react'
import PunkBanner from './PunkBanner'
import { audioEngine } from '../utils/audioSynth'
import { useBandData } from '../context/BandDataContext'

const STOMP_RIFF_ID = 'featured'
const STOMP_RIFF_MS = 8000
const STOMP_FX_ID = 'stompbox'

export default function Hero({ onPlayFeaturedTrack }) {
  const { config, currentTheme } = useBandData()
  const { hero, members } = config
  const stompTimer = useRef(0)
  const customSound = Boolean(hero.stompSoundUrl)

  useEffect(() => () => clearTimeout(stompTimer.current), [])

  const playStompRiff = () => {
    audioEngine.playTrackRiff(STOMP_RIFF_ID, 'grunge_intro')
    stompTimer.current = window.setTimeout(() => {
      if (audioEngine.currentTrackId === STOMP_RIFF_ID) audioEngine.stop()
    }, STOMP_RIFF_MS)
  }

  // The logo works as a switch. With a sound uploaded in the admin (an MP3 or a WAV) it plays that sound to its end
  // or until the next click; otherwise it loops a synthesized riff, which also ends by itself after a few seconds.
  const handleStomp = async () => {
    audioEngine.playFootswitchClick()
    clearTimeout(stompTimer.current)
    if (customSound) {
      if (audioEngine.fxId === STOMP_FX_ID) {
        audioEngine.stopEffect()
        return
      }
      audioEngine.stop()
      try {
        await audioEngine.playEffect(STOMP_FX_ID, hero.stompSoundUrl)
      } catch {
        // a file that cannot be played (removed, blocked, damaged) must not leave the logo silent
        playStompRiff()
      }
      return
    }
    if (audioEngine.isPlaying && audioEngine.currentTrackId === STOMP_RIFF_ID) {
      audioEngine.stop()
      return
    }
    playStompRiff()
  }

  const glitchClass = config.theme.glitchIntensity === 'extreme'
    ? 'animate-pulse scale-102'
    : config.theme.glitchIntensity === 'off'
    ? ''
    : 'animate-glitch'

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-4 overflow-hidden">
      
      {/* Background Live Concert Photo with Vignette and Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src={config.images.heroBackground}
          alt="Paranoid Noise Live Concert"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center filter grayscale contrast-125 brightness-40 scale-105"
        />
        {/* Dark Grunge Gradient & Accent Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/80 to-black/60" />
        <div
          className="absolute inset-0 mix-blend-multiply opacity-60"
          style={{
            background: `radial-gradient(circle at center, transparent 30%, ${currentTheme.primaryColor}22 70%, #000 100%)`
          }}
        />
        <div
          className="absolute inset-0 bg-noise pointer-events-none"
          style={{ opacity: config.theme.noiseOpacity }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Underground Scene Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-950/80 border backdrop-blur-md mb-6 shadow-lg"
          style={{ borderColor: `${currentTheme.primaryColor}80` }}
        >
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: currentTheme.primaryColor }}
          />
          <Zap className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
          <span className="text-xs font-tech font-bold uppercase tracking-widest text-neutral-200">
            {hero.sceneBadge}
          </span>
        </motion.div>

        {/* Band Logo Stompbox Image with Glow and Motion */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-6 group cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={customSound ? 'Play or stop the stompbox sound' : 'Play or stop a guitar riff'}
          onClick={handleStomp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleStomp()
            }
          }}
          title={customSound ? 'Click the stompbox to play its sound (click again to stop it)' : 'Click the stompbox to play a guitar riff (click again to stop it)'}
        >
          {/* Backlight glow */}
          <div
            className="absolute -inset-4 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: `${currentTheme.primaryColor}40` }}
          />
          
          <div
            className={`relative w-44 sm:w-56 md:w-64 mx-auto p-2 bg-neutral-950/90 rounded-2xl border-2 transition-all duration-300 shadow-2xl hover:scale-105 ${glitchClass}`}
            style={{ borderColor: `${currentTheme.primaryColor}99` }}
          >
            <img
              src={config.images.logo}
              alt="Paranoid Noise Stompbox"
              decoding="async"
              className="w-full h-auto object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
            />
            {/* Quick interactive hint */}
            <div
              className="absolute bottom-1 right-2 bg-neutral-950/95 border text-[10px] font-tech font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-white"
              style={{ borderColor: currentTheme.primaryColor }}
            >
              <Volume2 className="w-3 h-3" style={{ color: currentTheme.primaryColor }} /> TEST STOMP FX
            </div>
          </div>
        </motion.div>

        {/* Main Headline Typography */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-wider text-white mb-2 leading-none"
        >
          {hero.title.includes('NOISE') ? (
            <>
              {hero.title.replace('NOISE', '').trim()}{' '}
              <span style={{ color: currentTheme.primaryColor }}>NOISE</span>
            </>
          ) : (
            hero.title
          )}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-grunge text-lg sm:text-2xl md:text-3xl text-neutral-300 max-w-3xl mb-4 tracking-wide"
        >
          {hero.tagline}
        </motion.p>

        {/* Personnel Lineup Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-tech text-neutral-400 mb-8 border-y border-neutral-800/80 py-2.5 max-w-2xl"
        >
          {members.map((member, idx) => (
            <React.Fragment key={member.id || idx}>
              <span className="text-white font-semibold flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                />
                {member.name.toUpperCase()} : {member.role}
              </span>
              {idx < members.length - 1 && (
                <span className="text-neutral-600 hidden sm:inline">&bull;</span>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Action Call to Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          {/* Play Music Button */}
          <button
            onClick={onPlayFeaturedTrack}
            style={{ backgroundColor: currentTheme.primaryColor }}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-white font-tech font-bold uppercase tracking-wider text-sm rounded-lg shadow-xl border border-white/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
            <span>LISTEN TO THE MUSIC &amp; DISCOGRAPHY</span>
          </button>

          {/* Tour Gigs Button */}
          <a
            href="#gigs"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white font-tech font-bold uppercase tracking-wider text-sm rounded-lg border border-neutral-700 hover:border-white/50 transition-all"
          >
            <Calendar className="w-4 h-4" style={{ color: currentTheme.primaryColor }} />
            <span>GIGS &amp; TICKETS</span>
          </a>

          {/* Booking Contact Button */}
          <a
            href="#booking"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-4 bg-transparent hover:bg-white/5 text-neutral-300 hover:text-white font-tech font-bold uppercase tracking-wider text-sm rounded-lg border border-neutral-800 hover:border-neutral-700 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-neutral-400" />
            <span>BOOKING INFO</span>
          </a>
        </motion.div>

      </div>

      {/* Punk banner: tape strips, a skate checkerboard and doodles that move on the beat */}
      <PunkBanner />

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
    </section>
  )
}
