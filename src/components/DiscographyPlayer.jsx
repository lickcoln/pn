import React, { useState, useEffect, useRef, useId } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Disc, ExternalLink, Flame, RotateCcw } from 'lucide-react'
import { audioEngine, DEFAULT_AUDIO_SETTINGS } from '../utils/audioSynth'
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

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    return { ...DEFAULT_AUDIO_SETTINGS, ...(saved || {}) }
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
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

export default function DiscographyPlayer({ activeTrackId, onTrackSelect, distortionActive, onToggleDistortion }) {
  const { config } = useBandData()
  const singles = config.singles
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(singles[0] || {})
  const [settings, setSettings] = useState(loadSettings)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })
  const [playError, setPlayError] = useState('')
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const isSong = Boolean(currentTrack.audioUrl)

  // Keep currentTrack synchronized if singles list changes (for example after an admin edit)
  useEffect(() => {
    if (singles.length === 0) return
    const fresh = singles.find(s => s.id === currentTrack.id)
    if (!fresh) {
      setCurrentTrack(singles[0])
    } else if (fresh !== currentTrack) {
      setCurrentTrack(fresh)
    }
  }, [singles])

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

  // Always plays the track: the real MP3 when one was uploaded, otherwise the synthesized riff preview
  const startTrack = async (track) => {
    if (track.id !== currentTrack.id) setProgress({ current: 0, duration: 0 })
    setCurrentTrack(track)
    setPlayError('')
    setIsPlaying(true)
    if (onTrackSelect) onTrackSelect(track.id)

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
    if (currentTrack.id === track.id && isPlaying) {
      if (audioEngine.mode === 'song') audioEngine.pauseSong()
      else audioEngine.stop()
      setIsPlaying(false)
    } else {
      startTrack(track)
    }
  }

  // Sync with prop when a track is selected from elsewhere (the hero button)
  useEffect(() => {
    if (!activeTrackId) return
    const found = singles.find(t => t.id === activeTrackId)
    if (found && !(isPlaying && currentTrack.id === found.id)) {
      startTrack(found)
    }
  }, [activeTrackId])

  const changeSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    audioEngine.setSetting(key, value)
  }

  const resetSettings = () => {
    setSettings({ ...DEFAULT_AUDIO_SETTINGS })
    audioEngine.setSettings(DEFAULT_AUDIO_SETTINGS)
  }

  return (
    <section id="discography" className="py-24 bg-[#070707] relative overflow-hidden border-t border-neutral-900">

      {/* Background Graphic Art */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <img
          src={config.images.discographyBackground}
          alt="Grunge Artwork"
          className="w-full h-full object-cover filter grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707] via-transparent to-[#070707]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 font-tech text-xs uppercase font-bold tracking-widest mb-3">
            <Disc className="w-3.5 h-3.5 text-red-500 animate-spin" /> OFFICIAL DISCOGRAPHY (2021 - 2022)
          </div>
          <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
            SINGLES &amp; <span className="text-red-600">STOMPBOX PLAYER</span>
          </h2>
          <p className="font-tech text-sm text-neutral-400 mt-2">
            {singles.length} singles by Paranoid Noise that reflect the anger, restlessness, and Seattle-sound energy of the underground scene.
          </p>
        </div>

        {/* Interactive Stompbox Simulator & Real-time Player Console */}
        <div className="mb-20 max-w-4xl mx-auto bg-neutral-950/95 border-2 border-neutral-800 rounded-3xl p-5 sm:p-10 shadow-2xl relative">

          {/* Subtle Grunge Bolt Accents */}
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-700" />
            <span className="text-[10px] font-tech text-neutral-500 uppercase">MODEL: PN-OVERDRIVE-90S</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mt-6">

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
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bebas text-3xl text-white tracking-wide leading-none">
                      {currentTrack.title}
                    </h4>
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

                {/* Direct Platform Links */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={currentTrack.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-green-400 hover:text-green-300 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors"
                    title="Listen on Spotify"
                  >
                    <span>Spotify</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={currentTrack.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-red-500 hover:text-red-400 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors"
                    title="Watch on YouTube"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={currentTrack.soundcloudUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-orange-400 hover:text-orange-300 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors"
                    title="Listen on SoundCloud"
                  >
                    <span>SoundCloud</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>

            {/* Left (second on phones): Pedal, Equalizer and Level sliders */}
            <div className="md:col-span-5 md:order-1 flex flex-col gap-5 border-t md:border-t-0 md:border-r border-neutral-800 pt-6 md:pt-0 md:pr-8">

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
                className="self-start flex items-center gap-1.5 text-[11px] font-tech font-bold uppercase text-neutral-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset all sliders
              </button>

            </div>

          </div>
        </div>

        {/* Singles Discography Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {singles.map((track, idx) => {
            const isThisTrackPlaying = isPlaying && currentTrack.id === track.id
            const hasSong = Boolean(track.audioUrl)

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
                      onClick={() => togglePlay(track)}
                      aria-label={`${isThisTrackPlaying ? 'Pause' : 'Play'} ${track.title}`}
                      className={`absolute inset-0 flex items-center justify-center transition-all ${
                        isThisTrackPlaying
                          ? 'bg-black/40 opacity-100'
                          : 'bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
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

                    {hasSong && (
                      <div className="absolute top-2.5 right-2.5 bg-red-600 px-2 py-1 rounded text-[10px] font-tech font-bold uppercase tracking-wider text-white">
                        MP3
                      </div>
                    )}

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
                    onClick={() => togglePlay(track)}
                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5 transition-colors py-1"
                  >
                    {isThisTrackPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isThisTrackPlaying ? 'Pause' : hasSong ? 'Play song' : 'Play riff preview'}</span>
                  </button>

                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-500 hover:text-green-400 transition-colors flex items-center gap-1 py-1"
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
