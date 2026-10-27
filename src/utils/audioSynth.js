// Web Audio engine: a synthesized guitar-riff preview, real MP3 playback, and one shared effects
// chain (stompbox pedal + three-band equalizer). Every setting is a percentage from 0 to 100.
//
//   riff voices -> amp (always-on distortion) -> cab (lowpass) -> riff trim --+
//                                                                             +-> pedal (gain) -> tone
//   MP3 <audio> element -> media source --------------------------------------+
//
//   tone -> EQ (bass, mid, treble) -> analyser -> master level -> limiter -> speakers

const clamp = (percent) => Math.min(100, Math.max(0, Number(percent) || 0))

export const DEFAULT_AUDIO_SETTINGS = { drive: 50, tone: 75, level: 80, bass: 50, mid: 50, treble: 50 }

// EQ: 0% = 12 dB cut, 50% = flat, 100% = 12 dB boost
export const EQ_RANGE_DB = 12
export const percentToDb = (percent) => ((clamp(percent) - 50) / 50) * EQ_RANGE_DB

// TONE: 0% = dark (400 Hz), 100% = fully open (20 kHz), spaced the way the ear hears pitch
export const toneToHz = (percent) => 400 * Math.pow(50, clamp(percent) / 100)

const EQ_BANDS = {
  bass: { type: 'lowshelf', frequency: 120 },
  mid: { type: 'peaking', frequency: 1000, Q: 0.9 },
  treble: { type: 'highshelf', frequency: 6000 }
}

// The pedal: soft clipping that normalizes to full scale, so it never gets louder than the input peaks
function pedalCurve(percent) {
  const amount = clamp(percent) / 100
  const k = 1 + amount * amount * 60
  const samples = 2048
  const norm = Math.tanh(k)
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1
    curve[i] = Math.tanh(k * x) / norm
  }
  return curve
}

// The riff's own guitar amp: heavy fixed distortion (the original curve)
function ampCurve(amount) {
  const k = Math.max(1, amount * 2)
  const samples = 44100
  const deg = Math.PI / 180
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
  }
  return curve
}

class AudioEngine {
  constructor() {
    this.ctx = null
    this.settings = { ...DEFAULT_AUDIO_SETTINGS }
    this.distortionEnabled = false // is the pedal engaged?
    this.mode = null // 'riff' | 'song' | null
    this.currentTrackId = null
    this.isPlaying = false
    this.activeOscillators = []
    this.intervalId = null
    this.audioEl = null
    this.songUrl = ''
    // A short sound effect (the stompbox sound, a member's signature sound) has its own <audio> element, so it
    // never disturbs the song player; fxId says which one is playing right now
    this.fxEl = null
    this.fxId = null
    this.fxUrl = ''
    this.fxTimer = 0
    this.listeners = new Set()
  }

  /** Listen to the MP3 player: { type: 'time' | 'state' | 'ended' | 'error', ... }. Returns an unsubscribe function. */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(event) {
    this.listeners.forEach((listener) => listener(event))
  }

  // Must run from a click or tap: browsers only start audio after a user gesture
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()
      this.ctx = ctx

      // Riff voices: guitar amp and speaker cabinet, then a trim so riffs sit at the old loudness
      this.ampNode = ctx.createWaveShaper()
      this.ampNode.curve = ampCurve(75)
      this.ampNode.oversample = '4x'
      this.cabNode = ctx.createBiquadFilter()
      this.cabNode.type = 'lowpass'
      this.cabNode.frequency.value = 3600
      this.riffTrim = ctx.createGain()
      this.riffTrim.gain.value = 0.45

      // Shared by riffs and songs
      this.pedalNode = ctx.createWaveShaper()
      this.pedalMakeup = ctx.createGain()
      this.toneNode = ctx.createBiquadFilter()
      this.toneNode.type = 'lowpass'
      this.toneNode.Q.value = 0.707
      this.eq = {}
      Object.entries(EQ_BANDS).forEach(([name, band]) => {
        const filter = ctx.createBiquadFilter()
        filter.type = band.type
        filter.frequency.value = band.frequency
        if (band.Q) filter.Q.value = band.Q
        this.eq[name] = filter
      })

      // Analyser for the real-time visualizer
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 64

      // A finer spectrum for the equalizer strip at the bottom of the page: 64 points cannot tell a kick drum from
      // a bass guitar, 1024 of them can. It listens next to the analyser above and passes nothing on.
      this.spectrum = ctx.createAnalyser()
      this.spectrum.fftSize = 2048
      this.spectrum.smoothingTimeConstant = 0.5
      this.spectrum.minDecibels = -90
      this.spectrum.maxDecibels = -25

      this.masterGain = ctx.createGain()
      // A gentle limiter so an EQ boost cannot clip the speakers
      this.limiter = ctx.createDynamicsCompressor()
      this.limiter.threshold.value = -3
      this.limiter.knee.value = 0
      this.limiter.ratio.value = 20
      this.limiter.attack.value = 0.003
      this.limiter.release.value = 0.1

      this.ampNode.connect(this.cabNode)
      this.cabNode.connect(this.riffTrim)
      this.riffTrim.connect(this.pedalNode)
      this.pedalNode.connect(this.pedalMakeup)
      this.pedalMakeup.connect(this.toneNode)
      this.toneNode.connect(this.eq.bass)
      this.eq.bass.connect(this.eq.mid)
      this.eq.mid.connect(this.eq.treble)
      this.eq.treble.connect(this.analyser)
      this.eq.treble.connect(this.spectrum)
      this.analyser.connect(this.masterGain)
      this.masterGain.connect(this.limiter)
      this.limiter.connect(ctx.destination)

      this.applySettings()
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  // Pushes the stored percentages into the audio nodes (also called by init, so sliders can move before the first play)
  applySettings() {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const { drive, tone, level, bass, mid, treble } = this.settings
    const engaged = this.distortionEnabled

    if (engaged && drive > 0) {
      this.pedalNode.curve = pedalCurve(drive)
      this.pedalNode.oversample = '4x'
      this.pedalMakeup.gain.setTargetAtTime(1 / (1 + 1.5 * (drive / 100)), now, 0.015)
    } else {
      this.pedalNode.curve = null // bypass: the signal passes through untouched
      this.pedalNode.oversample = 'none'
      this.pedalMakeup.gain.setTargetAtTime(1, now, 0.015)
    }

    this.toneNode.frequency.setTargetAtTime(engaged ? toneToHz(tone) : 20000, now, 0.015)
    this.eq.bass.gain.setTargetAtTime(percentToDb(bass), now, 0.015)
    this.eq.mid.gain.setTargetAtTime(percentToDb(mid), now, 0.015)
    this.eq.treble.gain.setTargetAtTime(percentToDb(treble), now, 0.015)
    this.masterGain.gain.setTargetAtTime(clamp(level) / 100, now, 0.015)
  }

  getSettings() {
    return { ...this.settings }
  }

  /** name: 'drive' | 'tone' | 'level' | 'bass' | 'mid' | 'treble', value: 0-100 */
  setSetting(name, value) {
    if (!(name in this.settings)) return
    this.settings[name] = clamp(value)
    this.applySettings()
  }

  setSettings(values) {
    Object.entries(values || {}).forEach(([name, value]) => {
      if (name in this.settings) this.settings[name] = clamp(value)
    })
    this.applySettings()
  }

  // Footswitch: engage or bypass the pedal (gain and tone)
  setDistortionEnabled(enabled) {
    this.distortionEnabled = enabled
    this.applySettings()
  }

  // Realistic mechanical footswitch click
  playFootswitchClick() {
    this.init()
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08)

    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.09)
  }

  // Play a powerful rock chord (Root, 5th, Octave)
  playRockChord(baseFreq, duration = 0.5) {
    this.init()
    const now = this.ctx.currentTime

    // Power chord notes: base, 5th (base * 1.498), octave (base * 2)
    const freqs = [baseFreq, baseFreq * 1.4983, baseFreq * 2]

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const oscGain = this.ctx.createGain()

      osc.type = idx === 0 ? 'sawtooth' : 'triangle'
      osc.frequency.setValueAtTime(freq, now)

      // Slight detune for raw grunge thickness
      osc.detune.setValueAtTime((Math.random() - 0.5) * 12, now)

      oscGain.gain.setValueAtTime(0.25, now)
      oscGain.gain.exponentialRampToValueAtTime(0.005, now + duration)

      osc.connect(oscGain)
      oscGain.connect(this.ampNode)

      osc.start(now)
      osc.stop(now + duration)
      this.activeOscillators.push(osc)
    })
  }

  // Play a looped grunge punk riff for a track (the preview used when a single has no MP3 yet)
  playTrackRiff(trackId, riffType) {
    this.stop()
    this.init()
    this.mode = 'riff'
    this.isPlaying = true
    this.currentTrackId = trackId

    // Define punk chord progressions (Drop D style frequencies: D3=146.8, F3=174.6, G3=196, Bb3=233, C3=130.8)
    let chords = [146.83, 146.83, 174.61, 196.0, 146.83]
    let beatTime = 420

    if (riffType === 'fast_punk') {
      chords = [164.81, 196.0, 220.0, 246.94]
      beatTime = 280
    } else if (riffType === 'heavy_grunge') {
      chords = [110.0, 110.0, 130.81, 146.83, 123.47]
      beatTime = 520
    } else if (riffType === 'quiet_loud') {
      chords = [130.81, 146.83, 174.61, 196.0]
      beatTime = 480
    } else if (riffType === 'melodic_grunge') {
      chords = [174.61, 196.0, 146.83, 220.0]
      beatTime = 380
    }

    let chordIdx = 0
    this.playRockChord(chords[0], beatTime / 1000 * 0.95)

    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return
      chordIdx = (chordIdx + 1) % chords.length
      this.playRockChord(chords[chordIdx], beatTime / 1000 * 0.9)
    }, beatTime)
  }

  // One <audio> element for every song, routed through the same effects chain as the riffs
  ensureSongElement() {
    if (this.audioEl) return this.audioEl

    const el = new Audio()
    // Needed so the Web Audio graph may read the file (the storage server allows it)
    el.crossOrigin = 'anonymous'
    el.preload = 'auto'

    const time = () => this.emit({ type: 'time', current: el.currentTime, duration: Number.isFinite(el.duration) ? el.duration : 0 })
    el.addEventListener('timeupdate', time)
    el.addEventListener('loadedmetadata', time)
    el.addEventListener('play', () => this.emit({ type: 'state', playing: true }))
    el.addEventListener('pause', () => this.emit({ type: 'state', playing: false }))
    el.addEventListener('ended', () => {
      this.isPlaying = false
      this.emit({ type: 'ended' })
    })
    el.addEventListener('error', () => {
      this.isPlaying = false
      this.emit({ type: 'error' })
    })

    this.mediaSource = this.ctx.createMediaElementSource(el)
    this.mediaSource.connect(this.pedalNode)
    this.audioEl = el
    return el
  }

  /** Play an MP3 from the start, or resume it when it is the same song and was paused. Rejects when the browser refuses to play. */
  async playSong(trackId, url) {
    this.stopRiff()
    this.init()
    const el = this.ensureSongElement()

    // A new song, or the same one after a failed load, is (re)loaded; otherwise this resumes where it paused
    if (this.songUrl !== url || el.error) {
      this.songUrl = url
      el.src = url
    }
    this.mode = 'song'
    this.currentTrackId = trackId

    await el.play()
    this.isPlaying = true
  }

  pauseSong() {
    if (this.audioEl) this.audioEl.pause()
    this.isPlaying = false
  }

  seek(seconds) {
    if (this.audioEl && Number.isFinite(seconds)) this.audioEl.currentTime = Math.max(0, seconds)
  }

  stopRiff() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.activeOscillators.forEach(osc => {
      try { osc.stop() } catch { /* already stopped */ }
    })
    this.activeOscillators = []
  }

  // Stops whatever is playing: the riff loop, or the song (rewound to the start), or a sound effect
  stop() {
    this.isPlaying = false
    this.currentTrackId = null
    this.stopRiff()
    if (this.audioEl) {
      this.audioEl.pause()
      this.audioEl.currentTime = 0
    }
    this.stopEffect()
  }

  ensureEffectElement() {
    if (this.fxEl) return this.fxEl
    const el = new Audio()
    // Needed so the Web Audio graph may read the file (the storage server allows it)
    el.crossOrigin = 'anonymous'
    el.preload = 'auto'
    el.addEventListener('ended', () => this.stopEffect())
    el.addEventListener('error', () => this.stopEffect())
    this.effectSource = this.ctx.createMediaElementSource(el)
    this.effectSource.connect(this.pedalNode)
    this.fxEl = el
    return el
  }

  /**
   * Play an uploaded sound once from the start (MP3 or WAV), through the same effects chain as the songs.
   * `maxSeconds` cuts it off at that length. Starting another effect replaces the one that was playing.
   * Rejects when the browser refuses to play it, so the caller can fall back to a synthesized sound.
   */
  async playEffect(id, url, { maxSeconds = 0 } = {}) {
    this.init()
    const el = this.ensureEffectElement()
    this.stopEffect()
    if (this.fxUrl !== url || el.error) {
      this.fxUrl = url
      el.src = url
    }
    el.currentTime = 0
    this.fxId = id
    try {
      await el.play()
    } catch (err) {
      if (this.fxId === id) this.fxId = null
      throw err
    }
    // it may have been stopped or replaced while it was loading
    if (this.fxId !== id) {
      el.pause()
      return
    }
    this.emit({ type: 'effect', id, playing: true })
    if (maxSeconds > 0) {
      this.fxTimer = window.setTimeout(() => {
        if (this.fxId === id) this.stopEffect()
      }, maxSeconds * 1000)
    }
  }

  stopEffect() {
    clearTimeout(this.fxTimer)
    this.fxTimer = 0
    if (this.fxEl) {
      this.fxEl.pause()
      this.fxEl.currentTime = 0
    }
    if (this.fxId !== null) {
      const id = this.fxId
      this.fxId = null
      this.emit({ type: 'effect', id, playing: false })
    }
  }

  getByteFrequencyData(array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array)
    }
  }

  /** True while something can actually be heard: a riff is looping, or the song element is running (not paused, not ended). */
  isSounding() {
    if (this.fxId !== null && this.fxEl && !this.fxEl.paused) return true
    if (!this.isPlaying) return false
    if (this.mode !== 'song') return true
    return Boolean(this.audioEl) && !this.audioEl.paused && !this.audioEl.ended
  }

  /**
   * The fine spectrum (1024 values, 0-255, from 0 Hz to half the sample rate) for the equalizer strip. Returns the
   * width of one value in Hz, or 0 when the audio engine has not started yet (browsers only start it from a click).
   */
  getSpectrum(array) {
    if (!this.spectrum || !this.ctx) return 0
    this.spectrum.getByteFrequencyData(array)
    return this.ctx.sampleRate / this.spectrum.fftSize
  }
}

export const audioEngine = new AudioEngine()
