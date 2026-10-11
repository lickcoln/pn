// Web Audio API Grunge Guitar Synthesizer & Stompbox Simulator

class AudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.distortionNode = null
    this.filterNode = null
    this.analyser = null
    this.isPlaying = false
    this.currentTrackId = null
    this.distortionEnabled = true
    this.driveAmount = 50
    this.activeOscillators = []
    this.intervalId = null
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.ctx = new AudioContext()

      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.35

      // Distortion waveshaper
      this.distortionNode = this.ctx.createWaveShaper()
      this.updateDistortionCurve(this.driveAmount)

      // Guitar cabinet emulation filter
      this.filterNode = this.ctx.createBiquadFilter()
      this.filterNode.type = 'lowpass'
      this.filterNode.frequency.value = 3500

      // Analyser for real-time visualizer
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 64

      // Chain: Sources -> Distortion -> Filter -> Analyser -> Master Gain -> Destination
      this.distortionNode.connect(this.filterNode)
      this.filterNode.connect(this.analyser)
      this.analyser.connect(this.masterGain)
      this.masterGain.connect(this.ctx.destination)
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  updateDistortionCurve(amount) {
    if (!this.distortionNode) return
    const k = Math.max(1, amount * 2)
    const n_samples = 44100
    const curve = new Float32Array(n_samples)
    const deg = Math.PI / 180

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
    }
    this.distortionNode.curve = curve
    this.distortionNode.oversample = '4x'
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

  setDrive(amount) {
    this.driveAmount = amount
    this.updateDistortionCurve(amount)
  }

  setVolume(vol) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime)
    }
  }

  setDistortionEnabled(enabled) {
    this.distortionEnabled = enabled
    this.updateDistortionCurve(enabled ? this.driveAmount : 1)
    if (this.filterNode && this.ctx) {
      this.filterNode.frequency.setValueAtTime(enabled ? 3600 : 7000, this.ctx.currentTime)
    }
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
      oscGain.connect(this.distortionNode)

      osc.start(now)
      osc.stop(now + duration)
      this.activeOscillators.push(osc)
    })
  }

  // Play a looped grunge punk riff for a track
  playTrackRiff(trackId, riffType) {
    this.stop()
    this.init()
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

  stop() {
    this.isPlaying = false
    this.currentTrackId = null
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.activeOscillators.forEach(osc => {
      try { osc.stop() } catch (e) {}
    })
    this.activeOscillators = []
  }

  getByteFrequencyData(array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array)
    }
  }
}

export const audioEngine = new AudioEngine()
