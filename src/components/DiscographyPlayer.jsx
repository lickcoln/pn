import React, { useState, useEffect, useRef, useId } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Disc, ExternalLink, Flame, RotateCcw, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { audioEngine, DEFAULT_AUDIO_SETTINGS } from '../utils/audioSynth'
import { externalUrl } from '../lib/contactInfo'
import { useBandData } from '../context/BandDataContext'

const SETTINGS_KEY = 'pn_player_settings'

const PEDAL_SLIDERS = [
  { key: 'drive', label: 'Gain' },
  { key: 'tone', label: 'Tone' }
]

const EQ_SLIDERS = [
  { key: 'bass', label: 'Bass' },
  { key: 'mid', label: 'Mid' },
  { key: 'treble', label: 'Treble' }
]

const PLATFORM_LINKS = [
  { key: 'spotifyUrl', label: 'Spotify', title: 'Listen on Spotify', className: 'text-green-400 hover:text-green-300' },
  { key: 'youtubeUrl', label: 'YouTube', title: 'Watch on YouTube', className: 'text-red-500 hover:text-red-400' },
  { key: 'soundcloudUrl', label: 'SoundCloud', title: 'Listen on SoundCloud', className: 'text-orange-400 hover:text-orange-300' }
]

// Remembered slider positions come from the visitor's browser, so every value is checked before it is trusted
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    return Object.fromEntries(
      Object.entries(DEFAULT_AUDIO_SETTINGS).map(([key, fallback]) => {
        const value = Number(saved?.[key])
        return [key, saved?.[key] != null && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback]
      })
    )
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

// A year range for the badge, read from the singles themselves so it never goes out of date
function releaseYears(singles) {
  const years = singles
    .map((single) => Number((`${single.year} ${single.releaseDate}`.match(/\b(19|20)\d{2}\b/) || [])[0]))
    .filter(Boolean)
  if (years.length === 0) return ''
  const first = Math.min(...years)
  const last = Math.max(...years)
  return first === last ? `${first}` : `${first} - ${last}`
}

// A slider with an exact percentage you can also type in
function ParamSlider({ label, value, onChange, dimmed = false, flatAt50 = false }) {
  const id = useId()
  const setValue = (raw) => onChange(Math.min(100, Math.max(0, Math.round(Number(raw) || 0))))

  return (
    <div className={`space-y-1 transition-opacity ${dimmed ? 'opacity-55' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-tech font-bold uppercase tracking-wider text-neutral-300">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="numeric"
            aria-label={`${label} percent`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-14 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 focus:border-red-600 focus:outline-none text-right text-xs font-mono text-white"
          />
          <span className="text-[11px] font-mono text-neutral-500">%</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pn-range w-full"
        style={{ '--fill': `${value}%` }}
      />
      {flatAt50 && (
        <div className="flex justify-between text-[9px] font-mono text-neutral-600 leading-none">
          <span>cut</span>
          <span>flat 50%</span>
          <span>boost</span>
        </div>
      )}
    </div>
  )
}

export default function DiscographyPlayer({ playRequest, distortionActive, onToggleDistortion }) {
  const { config } = useBandData()
  const singles = config.singles
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })
  const [playError, setPlayError] = useState('')
  // On phones the sliders start folded away so the songs are not pushed off the screen
  const [mixerOpen, setMixerOpen] = useState(false)
  const canvasRef = useRef(null)

  // Looked up on every render, so the console follows an edited single and never points at a deleted one
  const currentTrack = singles.find((single) => single.id === currentId) ?? singles[0] ?? null
  const hasTracks = currentTrack !== null
  const isSong = Boolean(currentTrack?.audioUrl)
  const years = releaseYears(singles)

  // Slider settings are remembered between visits and always pushed to the audio engine
  useEffect(() => {
    audioEngine.setSettings(settings)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (e) {
      console.error(e)
    }
  }, [settings])

  // Events from the MP3 player: progress, ended, errors
  useEffect(() => {
    return audioEngine.subscribe((event) => {
      if (audioEngine.mode !== 'song') return
      if (event.type === 'time') {
        setProgress({ current: event.current, duration: event.duration })
      } else if (event.type === 'state') {
        setIsPlaying(event.playing)
      } else if (event.type === 'ended') {
        setIsPlaying(false)
        setProgress((p) => ({ ...p, current: 0 }))
      } else if (event.type === 'error') {
        setIsPlaying(false)
        setPlayError('This song could not be played. Please try again later.')
      }
    })
  }, [])

  // Canvas Audio Visualizer. It only animates while it is on screen, so a phone is not drawing 60 frames a
  // second for a spectrum nobody can see.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const dataArray = new Uint8Array(32)
    let frame = 0
    let visible = true

    const render = () => {
      if (!visible) {
        frame = 0
        return
      }
      frame = requestAnimationFrame(render)
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

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !frame) render()
    })
    observer.observe(canvas)
    render()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      frame = 0
    }
  }, [isPlaying, hasTracks])

  // Always plays the track: the real MP3 when one was uploaded, otherwise the synthesized riff preview
  const startTrack = async (track) => {
    if (track.id !== currentTrack?.id) setProgress({ current: 0, duration: 0 })
    setCurrentId(track.id)
    setPlayError('')
    setIsPlaying(true)

    if (!track.audioUrl) {
      audioEngine.playTrackRiff(track.id, track.riffType)
      return
    }

    try {
      await audioEngine.playSong(track.id, track.audioUrl)
    } catch (err) {
      setIsPlaying(false)
      setPlayError(
        err?.name === 'NotAllowedError'
          ? 'Your browser blocked autoplay. Press play again.'
          : 'This song could not be played. Please try again later.'
      )
    }
  }

  // The play/pause buttons: pause when this track is playing, otherwise start it
  const togglePlay = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      if (audioEngine.mode === 'song') audioEngine.pauseSong()
      else audioEngine.stop()
      setIsPlaying(false)
    } else {
      startTrack(track)
    }
  }

  // The hero's "play" button asks for a track; every press is a new request object, so pressing it
  // again after pausing works too
  useEffect(() => {
    if (!playRequest) return
    const found = singles.find((single) => single.id === playRequest.trackId)
    if (found && !(isPlaying && currentTrack?.id === found.id)) {
      startTrack(found)
    }
  }, [playRequest])

  const changeSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    audioEngine.setSetting(key, value)
  }

  const resetSettings = () => {
    setSettings({ ...DEFAULT_AUDIO_SETTINGS })
    audioEngine.setSettings(DEFAULT_AUDIO_SETTINGS)
  }

  return (
    <section id="discography" className="py-16 sm:py-24 bg-[#070707] relative overflow-hidden border-t border-neutral-900">

      {/* Background Graphic Art */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" aria-hidden="true">
        <img
          src={config.images.discographyBackground}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover filter grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707] via-transparent to-[#070707]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 font-tech text-xs uppercase font-bold tracking-widest mb-3">
            <Disc className="w-3.5 h-3.5 text-red-500 animate-spin" /> OFFICIAL DISCOGRAPHY{years ? ` (${years})` : ''}
          </div>
          <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
            SINGLES &amp; <span className="text-red-600">STOMPBOX PLAYER</span>
          </h2>
          <p className="font-tech text-sm text-neutral-400 mt-2">
            {singles.length === 0
              ? 'New music is on the way.'
              : `${singles.length} ${singles.length === 1 ? 'single' : 'singles'} by Paranoid Noise that reflect the anger, restlessness, and Seattle-sound energy of the underground scene.`}
          </p>
        </div>

        {/* Interactive Stompbox Simulator & Real-time Player Console */}
        {hasTracks && (
          <div className="mb-10 sm:mb-20 max-w-4xl mx-auto bg-neutral-950/95 border-2 border-neutral-800 rounded-3xl p-4 sm:p-10 shadow-2xl relative">

            {/* Subtle Grunge Bolt Accents */}
            <div className="absolute top-4 left-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-700" />
              <span className="text-[10px] font-tech text-neutral-500 uppercase">MODEL: PN-OVERDRIVE-90S</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start mt-6">

              {/* Right (first on phones): Now Playing Screen & Waveform Visualizer */}
              <div className="md:col-span-7 md:order-2 flex flex-col gap-4">

                <div className="p-4 rounded-xl bg-black border border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-tech text-neutral-400 mb-2">
                    <span className="flex items-center gap-1.5 text-red-500">
                      <span className={`w-2 h-2 rounded-full bg-red-500 ${isPlaying ? 'animate-ping' : ''}`} />
                      {isSong ? 'NOW PLAYING' : 'GUITAR RIFF PREVIEW'}
                    </span>
                    <span>{currentTrack.releaseDate}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0">
                      <img
                        src={currentTrack.coverArt}
                        alt={currentTrack.title}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bebas text-3xl text-white tracking-wide leading-none">
                        {currentTrack.title}
                      </h3>
                      <p className="text-xs font-tech text-neutral-400 line-clamp-2 mt-1">
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
                      aria-hidden="true"
                      className="w-full h-12 bg-neutral-950 rounded border border-neutral-900"
                    />
                  </div>

                  {/* Seek bar (songs only) */}
                  {isSong && (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="w-10 text-right text-[11px] font-mono text-neutral-400">
                        {formatTime(progress.current)}
                      </span>
                      <input
                        type="range"
                        aria-label="Seek"
                        min="0"
                        max={progress.duration || 1}
                        step="0.1"
                        value={Math.min(progress.current, progress.duration || 1)}
                        disabled={!progress.duration}
                        onChange={(e) => {
                          const seconds = Number(e.target.value)
                          setProgress((p) => ({ ...p, current: seconds }))
                          audioEngine.seek(seconds)
                        }}
                        className="pn-range grow"
                        style={{ '--fill': `${progress.duration ? (progress.current / progress.duration) * 100 : 0}%` }}
                      />
                      <span className="w-10 text-[11px] font-mono text-neutral-400">
                        {formatTime(progress.duration)}
                      </span>
                    </div>
                  )}

                  {playError && (
                    <p role="alert" className="mt-3 text-xs font-tech text-red-300">{playError}</p>
                  )}
                </div>

                {/* Player Controls & External Streaming */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => togglePlay(currentTrack)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-950/60"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" /> PAUSE
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" /> {isSong ? 'PLAY SONG' : 'PLAY RIFF PREVIEW'}
                      </>
                    )}
                  </button>

                  {/* Direct Platform Links (a platform without a link is left out) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {PLATFORM_LINKS.map(({ key, label, title, className }) => {
                      const url = externalUrl(currentTrack[key])
                      if (!url) return null
                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className={`px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors ${className}`}
                          title={title}
                        >
                          <span>{label}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Left (second on phones): Pedal, Equalizer and Level sliders */}
              <div className="md:col-span-5 md:order-1 flex flex-col gap-5 border-t md:border-t-0 md:border-r border-neutral-800 pt-5 md:pt-0 md:pr-8">

                {/* LED Indicator Light & Footswitch */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      audioEngine.playFootswitchClick()
                      onToggleDistortion()
                    }}
                    aria-label={distortionActive ? 'Bypass the overdrive pedal' : 'Engage the overdrive pedal'}
                    aria-pressed={distortionActive}
                    className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-600 border-4 border-neutral-800 shadow-[0_8px_15px_rgba(0,0,0,0.8)] active:translate-y-1 transition-all flex items-center justify-center stompbox-button cursor-pointer"
                    title="Stomp Footswitch!"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-900 border border-neutral-500 flex items-center justify-center">
                      <Flame className={`w-5 h-5 transition-colors ${distortionActive ? 'text-red-500' : 'text-neutral-400'}`} />
                    </div>
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                          distortionActive
                            ? 'bg-red-500 border-red-300 shadow-[0_0_14px_#ef4444] animate-pulse'
                            : 'bg-neutral-800 border-neutral-700 shadow-inner'
                        }`}
                      />
                      <span className="text-[11px] font-tech font-bold uppercase tracking-widest text-neutral-300">
                        OVERDRIVE {distortionActive ? 'ENGAGED' : 'BYPASS'}
                      </span>
                    </div>
                    <span className="text-[10px] font-tech text-neutral-500 block mt-1">
                      Footswitch: tap to turn the pedal on or off
                    </span>
                  </div>
                </div>

                {/* Phones: the sliders open and close with this button. Larger screens always show them. */}
                <button
                  type="button"
                  onClick={() => setMixerOpen((open) => !open)}
                  aria-expanded={mixerOpen}
                  aria-controls="pn-mixer"
                  className="md:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-tech font-bold uppercase tracking-wider text-neutral-200"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-red-500" /> Sound settings: pedal &amp; equalizer
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mixerOpen ? 'rotate-180' : ''}`} />
                </button>

                <div id="pn-mixer" className={`${mixerOpen ? 'flex' : 'hidden'} md:flex flex-col gap-5`}>

                  {/* Pedal: Gain & Tone (only audible while the pedal is engaged) */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-red-400 block">
                      PEDAL
                    </span>
                    {PEDAL_SLIDERS.map(({ key, label }) => (
                      <ParamSlider
                        key={key}
                        label={label}
                        value={settings[key]}
                        onChange={(value) => changeSetting(key, value)}
                        dimmed={!distortionActive}
                      />
                    ))}
                    {!distortionActive && (
                      <p className="text-[10px] font-tech text-neutral-500">
                        The pedal is off. Stomp the footswitch to hear Gain and Tone.
                      </p>
                    )}
                  </div>

                  {/* Equalizer */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-red-400 block">
                      EQUALIZER
                    </span>
                    {EQ_SLIDERS.map(({ key, label }) => (
                      <ParamSlider
                        key={key}
                        label={label}
                        value={settings[key]}
                        onChange={(value) => changeSetting(key, value)}
                        flatAt50
                      />
                    ))}
                  </div>

                  {/* Output level */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-red-400 block">
                      OUTPUT
                    </span>
                    <ParamSlider
                      label="Level"
                      value={settings.level}
                      onChange={(value) => changeSetting('level', value)}
                    />
                  </div>

                  <button
                    onClick={resetSettings}
                    className="self-start flex items-center gap-1.5 py-1 text-[11px] font-tech font-bold uppercase text-neutral-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset all sliders
                  </button>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* Singles: compact rows on phones, cover cards from the sm breakpoint up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {singles.map((track, idx) => {
            const isThisTrackPlaying = isPlaying && currentTrack?.id === track.id
            const hasSong = Boolean(track.audioUrl)
            const listenOn = PLATFORM_LINKS.map((platform) => ({ ...platform, url: externalUrl(track[platform.key]) })).find((platform) => platform.url)

            return (
              <motion.article
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(idx, 5) * 0.08 }}
                className={`relative rounded-2xl bg-neutral-950/90 border p-3 sm:p-5 grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 sm:flex sm:flex-col sm:justify-between sm:gap-x-0 transition-all duration-300 group sm:hover:-translate-y-1.5 shadow-xl ${
                  isThisTrackPlaying
                    ? 'border-red-600 shadow-red-950/40 bg-neutral-900/90'
                    : 'border-neutral-800/90 hover:border-neutral-700'
                }`}
              >
                {/* Single Cover Art */}
                <div className="relative self-start rounded-xl overflow-hidden aspect-square border border-neutral-800 sm:mb-4 bg-black group-hover:border-red-600/70 transition-colors">
                  <img
                    src={track.coverArt}
                    alt={track.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                  />

                  {/* Dark gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Play/Pause Overlay Button: always visible on touch screens, which have no hover */}
                  <button
                    onClick={() => togglePlay(track)}
                    aria-label={`${isThisTrackPlaying ? 'Pause' : 'Play'} ${track.title}`}
                    className={`absolute inset-0 flex items-center justify-center transition-all ${
                      isThisTrackPlaying
                        ? 'bg-black/40 opacity-100'
                        : 'bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 pointer-coarse:bg-black/35'
                    }`}
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
                      {isThisTrackPlaying ? (
                        <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5 sm:ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Release Date Badge */}
                  <div className="hidden sm:block absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded border border-neutral-800 text-[10px] font-tech font-bold uppercase tracking-wider text-red-400">
                    {track.releaseDate}
                  </div>

                  {hasSong && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 bg-red-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-tech font-bold uppercase tracking-wider text-white">
                      MP3
                    </div>
                  )}

                  <div className="hidden sm:block absolute bottom-2.5 right-2.5 text-[10px] font-mono text-neutral-300 bg-black/70 px-2 py-0.5 rounded">
                    SINGLE #{idx + 1}
                  </div>
                </div>

                <div className="flex flex-col min-w-0 sm:grow sm:justify-between">
                  <div>
                    {/* The date badge on the cover is hidden on phones, so it is written out here */}
                    <p className="sm:hidden text-[10px] font-tech font-bold uppercase tracking-wider text-red-400">
                      {track.releaseDate}
                    </p>

                    {/* Track Title */}
                    <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wide group-hover:text-red-500 transition-colors leading-tight sm:mb-2">
                      {track.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs font-tech text-neutral-400 line-clamp-2 sm:line-clamp-3 leading-relaxed sm:mb-4">
                      {track.description}
                    </p>
                  </div>

                  {/* Footer Buttons for This Single */}
                  <div className="mt-1 sm:mt-0 sm:pt-3 sm:border-t border-neutral-900 flex items-center justify-between gap-3 text-xs font-tech">
                    <button
                      onClick={() => togglePlay(track)}
                      className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 transition-colors py-2"
                    >
                      {isThisTrackPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isThisTrackPlaying ? 'Pause' : hasSong ? 'Play song' : 'Play riff preview'}</span>
                    </button>

                    {listenOn && (
                      <a
                        href={listenOn.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1 py-2"
                        title={listenOn.title}
                      >
                        <span>{listenOn.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

              </motion.article>
            )
          })}
        </div>

      </div>
    </section>
  )
}
