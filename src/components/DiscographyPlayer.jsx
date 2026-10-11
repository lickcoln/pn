import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Disc, ExternalLink, Radio, Volume2, Sparkles, Sliders, Music, Zap, Flame } from 'lucide-react'
import { SINGLES_DISCOGRAPHY, BAND_CONTACT } from '../data/bandData'
import { audioEngine } from '../utils/audioSynth'

export default function DiscographyPlayer({ activeTrackId, onTrackSelect, distortionActive, onToggleDistortion }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(SINGLES_DISCOGRAPHY[0])
  const [driveLevel, setDriveLevel] = useState(75)
  const [toneLevel, setToneLevel] = useState(60)
  const [volumeLevel, setVolumeLevel] = useState(80)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  // Sync with prop when selected from elsewhere
  useEffect(() => {
    if (activeTrackId) {
      const found = SINGLES_DISCOGRAPHY.find(t => t.id === activeTrackId)
      if (found) {
        handlePlayTrack(found)
      }
    }
  }, [activeTrackId])

  // Canvas Audio Visualizer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dataArray = new Uint8Array(32)

    const render = () => {
      animationRef.current = requestAnimationFrame(render)
      audioEngine.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / 32) * 1.5
      let x = 0

      for (let i = 0; i < 32; i++) {
        let barHeight = isPlaying ? (dataArray[i] / 255) * canvas.height * 0.9 : Math.sin(Date.now() / 400 + i * 0.4) * 6 + 8
        if (barHeight < 4) barHeight = 4

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0)
        grad.addColorStop(0, '#7f1d1d')
        grad.addColorStop(0.5, '#dc2626')
        grad.addColorStop(1, '#ffffff')

        ctx.fillStyle = grad
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight)
        x += barWidth
      }
    }

    render()
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

  const handlePlayTrack = (track) => {
    if (currentTrack.id === track.id && isPlaying) {
      audioEngine.stop()
      setIsPlaying(false)
    } else {
      setCurrentTrack(track)
      audioEngine.playTrackRiff(track.id, track.riffType)
      setIsPlaying(true)
      if (onTrackSelect) onTrackSelect(track.id)
    }
  }

  const handleStop = () => {
    audioEngine.stop()
    setIsPlaying(false)
  }

  return (
    <section id="discography" className="py-24 bg-[#070707] relative overflow-hidden border-t border-neutral-900">
      
      {/* Background Graphic Art */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <img
          src="/images/band_photo_17_1792x1024.jpg"
          alt="Grunge Artwork"
          className="w-full h-full object-cover filter grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707] via-transparent to-[#070707]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 font-tech text-xs uppercase font-bold tracking-widest mb-3">
            <Disc className="w-3.5 h-3.5 text-red-500 animate-spin" /> DISKOGRAFI RESMI (2021 - 2022)
          </div>
          <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
            SINGLES &amp; <span className="text-red-600">STOMPBOX PLAYER</span>
          </h2>
          <p className="font-tech text-sm text-neutral-400 mt-2">
            7 single karya Paranoid Noise yang merefleksikan amarah, keresahan, dan energi Seattle sound di kancah underground.
          </p>
        </div>

        {/* Interactive Stompbox Simulator & Real-time Player Console */}
        <div className="mb-20 max-w-4xl mx-auto bg-neutral-950/95 border-2 border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
          
          {/* Subtle Grunge Bolt Accents */}
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-700" />
            <span className="text-[10px] font-tech text-neutral-500 uppercase">MODEL: PN-OVERDRIVE-90S</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-4">
            
            {/* Left: Pedal Knobs and Controls */}
            <div className="md:col-span-5 flex flex-col items-center border-b md:border-b-0 md:border-r border-neutral-800 pb-6 md:pb-0 md:pr-8">
              
              {/* LED Indicator Light */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                    distortionActive
                      ? 'bg-red-500 border-red-300 shadow-[0_0_20px_#ef4444] animate-pulse'
                      : 'bg-neutral-800 border-neutral-700 shadow-inner'
                  }`}
                />
                <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-neutral-400 mt-1">
                  OVERDRIVE {distortionActive ? 'ENGAGED' : 'BYPASS'}
                </span>
              </div>

              {/* 3 Knobs: GAIN, TONE, LEVEL */}
              <div className="grid grid-cols-3 gap-4 w-full mb-8 text-center">
                
                {/* Gain Knob */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-full bg-gradient-to-b from-neutral-800 to-neutral-950 border-2 border-neutral-700 relative shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                    style={{ transform: `rotate(${(driveLevel - 50) * 2.5}deg)` }}
                    onClick={() => {
                      const next = driveLevel >= 100 ? 25 : driveLevel + 25
                      setDriveLevel(next)
                      audioEngine.setDrive(next)
                    }}
                    title="Klik untuk atur Drive"
                  >
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-red-500 rounded-full" />
                  </div>
                  <span className="text-[10px] font-tech font-bold text-neutral-300 uppercase mt-2">GAIN</span>
                  <span className="text-[9px] font-mono text-red-400">{driveLevel}%</span>
                </div>

                {/* Tone Knob */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-full bg-gradient-to-b from-neutral-800 to-neutral-950 border-2 border-neutral-700 relative shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                    style={{ transform: `rotate(${(toneLevel - 50) * 2.5}deg)` }}
                    onClick={() => {
                      const next = toneLevel >= 100 ? 25 : toneLevel + 25
                      setToneLevel(next)
                    }}
                    title="Klik untuk atur Tone"
                  >
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-white rounded-full" />
                  </div>
                  <span className="text-[10px] font-tech font-bold text-neutral-300 uppercase mt-2">TONE</span>
                  <span className="text-[9px] font-mono text-neutral-400">{toneLevel}%</span>
                </div>

                {/* Level Knob */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-full bg-gradient-to-b from-neutral-800 to-neutral-950 border-2 border-neutral-700 relative shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                    style={{ transform: `rotate(${(volumeLevel - 50) * 2.5}deg)` }}
                    onClick={() => {
                      const next = volumeLevel >= 100 ? 25 : volumeLevel + 25
                      setVolumeLevel(next)
                      audioEngine.setVolume(next / 100)
                    }}
                    title="Klik untuk atur Level Volume"
                  >
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-red-500 rounded-full" />
                  </div>
                  <span className="text-[10px] font-tech font-bold text-neutral-300 uppercase mt-2">LEVEL</span>
                  <span className="text-[9px] font-mono text-red-400">{volumeLevel}%</span>
                </div>

              </div>

              {/* Big Chrome Footswitch Stomp Button */}
              <button
                onClick={() => {
                  audioEngine.playFootswitchClick()
                  onToggleDistortion()
                }}
                className="w-20 h-20 rounded-full bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-600 border-4 border-neutral-800 shadow-[0_8px_15px_rgba(0,0,0,0.8)] active:translate-y-1 transition-all flex items-center justify-center group stompbox-button cursor-pointer"
                title="Stomp Footswitch!"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-900 border border-neutral-500 flex items-center justify-center">
                  <Flame className={`w-6 h-6 transition-colors ${distortionActive ? 'text-red-500' : 'text-neutral-400'}`} />
                </div>
              </button>
              <span className="text-[10px] font-tech font-bold text-neutral-400 uppercase mt-2">
                FOOTSWITCH (STOMP)
              </span>

            </div>

            {/* Right: Now Playing Screen & Waveform Visualizer */}
            <div className="md:col-span-7 flex flex-col justify-between h-full">
              
              <div className="p-4 rounded-xl bg-black border border-neutral-800 mb-4">
                <div className="flex items-center justify-between text-xs font-tech text-neutral-400 mb-2">
                  <span className="flex items-center gap-1.5 text-red-500">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    NOW PLAYING RIFF PREVIEW
                  </span>
                  <span>{currentTrack.releaseDate}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0">
                    <img
                      src={currentTrack.coverArt}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bebas text-3xl text-white tracking-wide leading-none">
                      {currentTrack.title}
                    </h4>
                    <p className="text-xs font-tech text-neutral-400 line-clamp-1 mt-1">
                      {currentTrack.description}
                    </p>
                  </div>
                </div>

                {/* Canvas Visualizer */}
                <div className="mt-4 pt-3 border-t border-neutral-900">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={48}
                    className="w-full h-12 bg-neutral-950 rounded border border-neutral-900"
                  />
                </div>
              </div>

              {/* Player Controls & External Streaming */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => handlePlayTrack(currentTrack)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-950/60"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" /> HENTIKAN PREVIEW
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" /> PUTAR PREVIEW ({currentTrack.title})
                    </>
                  )}
                </button>

                {/* Direct Platform Links */}
                <div className="flex items-center gap-2">
                  <a
                    href={currentTrack.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-green-400 hover:text-green-300 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors"
                    title="Dengarkan di Spotify"
                  >
                    <span>Spotify</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={currentTrack.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-red-500 hover:text-red-400 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors"
                    title="Tonton di YouTube"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={currentTrack.soundcloudUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-orange-400 hover:text-orange-300 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors"
                    title="Dengarkan di SoundCloud"
                  >
                    <span>SoundCloud</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* 7 Singles Discography Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {SINGLES_DISCOGRAPHY.map((track, idx) => {
            const isThisTrackPlaying = isPlaying && currentTrack.id === track.id

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={`relative rounded-2xl bg-neutral-950/90 border p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1.5 shadow-xl ${
                  isThisTrackPlaying
                    ? 'border-red-600 shadow-red-950/40 bg-neutral-900/90'
                    : 'border-neutral-800/90 hover:border-neutral-700'
                }`}
              >
                <div>
                  
                  {/* Single Cover Art Card */}
                  <div className="relative rounded-xl overflow-hidden aspect-square border border-neutral-800 mb-4 bg-black group-hover:border-red-600/70 transition-colors">
                    <img
                      src={track.coverArt}
                      alt={track.title}
                      className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                    />
                    
                    {/* Dark gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Play/Pause Overlay Button */}
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className={`absolute inset-0 flex items-center justify-center transition-all ${
                        isThisTrackPlaying
                          ? 'bg-black/40 opacity-100'
                          : 'bg-black/50 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
                        {isThisTrackPlaying ? (
                          <Pause className="w-6 h-6 fill-white" />
                        ) : (
                          <Play className="w-6 h-6 fill-white ml-1" />
                        )}
                      </div>
                    </button>

                    {/* Release Date Badge */}
                    <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded border border-neutral-800 text-[10px] font-tech font-bold uppercase tracking-wider text-red-400">
                      {track.releaseDate}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-neutral-300 bg-black/70 px-2 py-0.5 rounded">
                      SINGLE #{idx + 1}
                    </div>
                  </div>

                  {/* Track Title */}
                  <h3 className="font-bebas text-3xl text-white tracking-wide group-hover:text-red-500 transition-colors leading-tight mb-2">
                    {track.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs font-tech text-neutral-400 line-clamp-3 leading-relaxed mb-4">
                    {track.description}
                  </p>

                </div>

                {/* Footer Buttons for This Single */}
                <div className="pt-3 border-t border-neutral-900 flex items-center justify-between text-xs font-tech">
                  <button
                    onClick={() => handlePlayTrack(track)}
                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {isThisTrackPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isThisTrackPlaying ? 'Pause Riff' : 'Preview Riff'}</span>
                  </button>

                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-500 hover:text-green-400 transition-colors flex items-center gap-1"
                    title="Spotify"
                  >
                    <span>Spotify</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
