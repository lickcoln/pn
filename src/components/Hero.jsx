import React from 'react'
import { motion } from 'framer-motion'
import { Play, Calendar, Zap, MessageSquare, Volume2, ShieldAlert } from 'lucide-react'
import { audioEngine } from '../utils/audioSynth'

export default function Hero({ onPlayFeaturedTrack }) {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
      
      {/* Background Live Concert Photo with Vignette and Dark Red Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src="/band/band_rock_9_1264x840.png"
          alt="Paranoid Noise Live Concert"
          className="w-full h-full object-cover object-center filter grayscale contrast-125 brightness-40 scale-105"
        />
        {/* Dark Grunge Gradient & Red Accent Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/80 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 via-transparent to-red-950/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Underground Scene Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-700/50 backdrop-blur-md mb-6 shadow-lg shadow-red-950/40"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-tech font-bold uppercase tracking-widest text-red-200">
            JAKARTA UNDERGROUND &bull; EST. 2021
          </span>
        </motion.div>

        {/* Band Logo Stompbox Image with Glow and Motion */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-6 group cursor-pointer"
          onClick={() => {
            audioEngine.playFootswitchClick()
            audioEngine.playTrackRiff('featured', 'grunge_intro')
          }}
          title="Klik Stompbox untuk Play Riff Gitar!"
        >
          {/* Neon backlight glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-red-700/30 via-red-600/20 to-red-900/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative w-44 sm:w-56 md:w-64 mx-auto p-2 bg-neutral-950/90 rounded-2xl border-2 border-neutral-700 group-hover:border-red-600 transition-all duration-300 shadow-2xl hover:scale-105">
            <img
              src="/logo.png"
              alt="Paranoid Noise Stompbox"
              className="w-full h-auto object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] animate-glitch"
            />
            {/* Quick interactive hint */}
            <div className="absolute bottom-1 right-2 bg-red-950/90 border border-red-800 text-[10px] font-tech font-bold text-red-300 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-red-400" /> TEST STOMP FX
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
          PARANOID <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-400">NOISE</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-grunge text-lg sm:text-2xl md:text-3xl text-neutral-300 max-w-3xl mb-4 tracking-wide"
        >
          RAW ENERGY. EXPLOSIVE CHAOS. UNAPOLOGETIC ROCK.
        </motion.p>

        {/* Personnel Lineup Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-tech text-neutral-400 mb-8 border-y border-neutral-800/80 py-2.5 max-w-2xl"
        >
          <span className="text-white font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> ARIEF : Guitar, Vocals
          </span>
          <span className="text-neutral-600 hidden sm:inline">&bull;</span>
          <span className="text-white font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> GANJAR : Bass
          </span>
          <span className="text-neutral-600 hidden sm:inline">&bull;</span>
          <span className="text-white font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> KIMAO : Drum
          </span>
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
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-tech font-bold uppercase tracking-wider text-sm rounded-lg shadow-xl shadow-red-950/60 border border-red-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
            <span>DENGARKAN MUSIK & DISCOGRAPHY</span>
          </button>

          {/* Tour Gigs Button */}
          <a
            href="#gigs"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white font-tech font-bold uppercase tracking-wider text-sm rounded-lg border border-neutral-700 hover:border-red-600 transition-all"
          >
            <Calendar className="w-4 h-4 text-red-500" />
            <span>JADWAL GIGS & TIKET</span>
          </a>

          {/* Booking Contact Button */}
          <a
            href="#booking"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-4 bg-transparent hover:bg-red-950/20 text-neutral-300 hover:text-red-400 font-tech font-bold uppercase tracking-wider text-sm rounded-lg border border-neutral-800 hover:border-red-900 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-neutral-400 group-hover:text-red-400" />
            <span>BOOKING INFO</span>
          </a>
        </motion.div>

        {/* Live Underground Stats & Ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left"
        >
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="font-bebas text-3xl text-red-500 tracking-wider">7 SINGLES</div>
            <div className="text-xs font-tech text-neutral-400 uppercase">Resmi Dirilis</div>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="font-bebas text-3xl text-white tracking-wider">TRIO POWER</div>
            <div className="text-xs font-tech text-neutral-400 uppercase">Guitar, Bass, Drum</div>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="font-bebas text-3xl text-red-500 tracking-wider">90'S ROOTS</div>
            <div className="text-xs font-tech text-neutral-400 uppercase">Seattle Sound & Grunge</div>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="font-bebas text-3xl text-white tracking-wider">DIY SCENE</div>
            <div className="text-xs font-tech text-neutral-400 uppercase">Jakarta Underground</div>
          </div>
        </motion.div>

      </div>

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
    </section>
  )
}
