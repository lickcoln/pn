import React, { useEffect, useRef } from 'react'
import { audioEngine } from '../utils/audioSynth'
import { useBandData } from '../context/BandDataContext'

// An LED-style equalizer across the bottom of the page.
//  - while a song or riff plays it shows the real spectrum of that sound (bass on the left, treble on the right)
//  - otherwise it plays a punk-tempo "air band" of its own: kick drum on the low bars, snare in the middle, hi-hats up high
//  - it also follows the pointer (the bars rise to the height of the cursor or finger) and jumps like a power chord on a click
// It only draws while it is on screen, and stands still for people who asked their system for less motion.

const SEGMENT = 5 // height of one lit block, in CSS pixels
const SEGMENT_GAP = 2
const BAR_GAP = 3
const BAR_PITCH = 11 // the width one bar (with its gap) would like to have
const MIN_BARS = 28
const MAX_BARS = 120
const LOW_HZ = 45
const HIGH_HZ = 15000
const BPM = 156 // fast punk

const clamp01 = (value) => Math.min(1, Math.max(0, value))

function toRgb(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
  const n = match ? parseInt(match[1], 16) : 0xdc2626
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = (a, b, t) => a.map((value, i) => Math.round(value + (b[i] - value) * t))
const rgba = (rgb, alpha = 1) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`

// Colour of the block on row `r` of `rows`: deep colour at the bottom, the theme colour in the middle, white-hot at the top
function rowColor(base, r, rows) {
  const f = rows > 1 ? r / (rows - 1) : 0
  if (f < 0.5) return rgba(mix(base, [0, 0, 0], 0.35 * (1 - f / 0.5)))
  if (f < 0.78) return rgba(base)
  if (f < 0.92) return rgba(mix(base, [255, 255, 255], 0.45))
  return rgba([255, 255, 255])
}

// A cheap flicker per bar, between 0 and 1, so the bars never move in lockstep
const flicker = (i, t) => 0.5 + 0.5 * Math.sin(t * (9 + (i % 7)) + i * 12.9898) * Math.sin(t * (5 + (i % 5)) + i * 4.1414)

// The level (0-1) of bar i (at position p from 0 to 1 across the strip) in the strip's own song at time t
function idleLevel(t, i, p) {
  const b = (t * BPM) / 60 // beats
  const kick = Math.exp(-7 * (b % 2)) // beats 1 and 3
  const snare = Math.exp(-8 * ((b + 1) % 2)) // beats 2 and 4
  const hat = Math.exp(-16 * ((b * 2) % 1)) // every half beat
  const surge = 0.65 + 0.35 * Math.sin(t * 0.35) ** 2 // the "song" swells and eases off
  const wLow = clamp01(1 - p / 0.34)
  const wHigh = clamp01((p - 0.5) / 0.5)
  const wMid = clamp01(1 - wLow - wHigh)
  const j = flicker(i, t)
  const value = 0.12 + 0.16 * j + wLow * (0.75 * kick + 0.1 * j) + wMid * (0.55 * snare + 0.3 * j * surge) + wHigh * (0.5 * hat + 0.2 * j)
  return clamp01(value * (0.8 + 0.2 * surge))
}

// Level (0-1) of the real spectrum at position p of the strip, log-spaced from LOW_HZ to HIGH_HZ
function spectrumLevel(spectrum, binHz, p, nextP) {
  const from = LOW_HZ * (HIGH_HZ / LOW_HZ) ** p
  const to = LOW_HZ * (HIGH_HZ / LOW_HZ) ** nextP
  const a = from / binHz
  const b = Math.max(a, to / binHz)
  // the largest value among the bins this bar covers; a bar narrower than a bin reads between two bins
  const first = Math.floor(a)
  const last = Math.min(spectrum.length - 1, Math.ceil(b))
  let peak = 0
  for (let k = first; k <= last; k += 1) peak = Math.max(peak, spectrum[k] || 0)
  if (last - first <= 1) {
    const w = a - first
    peak = (spectrum[first] || 0) * (1 - w) + (spectrum[Math.min(spectrum.length - 1, first + 1)] || 0) * w
  }
  // treble carries less energy than bass in real music, so lift it a little; a touch of curve makes the peaks punchier
  const tilt = 1 + p * 0.7
  return clamp01((peak / 255) ** 1.35 * tilt)
}

export default function RockEqualizer() {
  const { currentTheme } = useBandData()
  const color = currentTheme.primaryColor
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const base = toRgb(color)
    const spectrum = new Uint8Array(audioEngine.spectrum ? audioEngine.spectrum.frequencyBinCount : 1024)
    const levels = new Float32Array(MAX_BARS)
    const peaks = new Float32Array(MAX_BARS)
    const peakUntil = new Float64Array(MAX_BARS)
    const ghost = document.createElement('canvas')

    let width = 0
    let height = 0
    let dpr = 1
    let bars = MIN_BARS
    let rows = 1
    let barWidth = 4
    let idleBlend = 1 // 1 = the strip's own song, 0 = the real audio
    let pointer = { x: 0, y: 0, strength: 0, inside: false }
    let hit = 0
    let last = 0
    let frame = 0
    let visible = true
    let still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const layout = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      if (!width || !height) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ghost.width = canvas.width
      ghost.height = canvas.height
      bars = Math.max(MIN_BARS, Math.min(MAX_BARS, Math.round(width / BAR_PITCH)))
      barWidth = (width - BAR_GAP * (bars - 1)) / bars
      rows = Math.max(1, Math.floor((height + SEGMENT_GAP) / (SEGMENT + SEGMENT_GAP)))

      // the dim, unlit blocks are drawn once and copied every frame
      const g = ghost.getContext('2d')
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, width, height)
      g.fillStyle = rgba(base, 0.08)
      for (let i = 0; i < bars; i += 1) {
        const x = i * (barWidth + BAR_GAP)
        for (let r = 0; r < rows; r += 1) g.fillRect(x, height - (r + 1) * SEGMENT - r * SEGMENT_GAP, barWidth, SEGMENT)
      }
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(ghost, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (let i = 0; i < bars; i += 1) {
        const x = i * (barWidth + BAR_GAP)
        const lit = Math.round(levels[i] * rows)
        for (let r = 0; r < lit; r += 1) {
          ctx.fillStyle = rowColor(base, r, rows)
          ctx.fillRect(x, height - (r + 1) * SEGMENT - r * SEGMENT_GAP, barWidth, SEGMENT)
        }
        const capRow = Math.min(rows - 1, Math.round(peaks[i] * rows))
        if (capRow >= lit && capRow > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)'
          ctx.fillRect(x, height - (capRow + 1) * SEGMENT - capRow * SEGMENT_GAP, barWidth, SEGMENT)
        }
      }
    }

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      const t = now / 1000
      const sounding = audioEngine.isSounding()
      const binHz = sounding ? audioEngine.getSpectrum(spectrum) : 0
      const live = sounding && binHz > 0
      const mode = live ? 'music' : 'idle'
      if (canvas.dataset.mode !== mode) canvas.dataset.mode = mode

      idleBlend += ((live ? 0 : 1) - idleBlend) * Math.min(1, dt * 4)
      pointer.strength += ((pointer.inside ? 1 : 0) - pointer.strength) * Math.min(1, dt * 6)
      hit = Math.max(0, hit - dt * 2.2)
      const pointerBar = (pointer.x / width) * bars
      const pointerHeight = clamp01(1 - pointer.y / height)

      for (let i = 0; i < bars; i += 1) {
        const p = i / (bars - 1)
        let value = idleLevel(t, i, p) * 0.9 * idleBlend
        if (live) value += spectrumLevel(spectrum, binHz, p, (i + 1) / (bars - 1)) * (1 - idleBlend)
        if (pointer.strength > 0.01) {
          const d = i - pointerBar
          value = Math.max(value, Math.exp(-(d * d) / 50) * pointerHeight * pointer.strength * (0.85 + 0.15 * flicker(i, t)))
        }
        if (hit > 0) value = Math.max(value, hit ** 0.6 * (1 - p * 0.3) * (0.85 + 0.15 * flicker(i, t)))
        value = clamp01(value)

        // punchy: a bar jumps up fast and falls back more slowly
        levels[i] += (value - levels[i]) * (1 - Math.exp(-dt * (value > levels[i] ? 40 : 11)))
        if (levels[i] >= peaks[i]) {
          peaks[i] = levels[i]
          peakUntil[i] = now + 420
        } else if (now > peakUntil[i]) {
          peaks[i] = Math.max(levels[i], peaks[i] - dt * 0.9)
        }
      }
      draw()
    }

    const loop = (now) => {
      frame = visible && !still ? requestAnimationFrame(loop) : 0
      step(now)
    }
    const start = () => {
      if (!frame && visible && !still && width) {
        last = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }
    // a still strip is drawn once (the strip's own song, frozen on a loud moment), and again after a resize
    const paintStill = () => {
      for (let i = 0; i < bars; i += 1) {
        const level = idleLevel(0.02, i, i / (bars - 1)) * 0.9
        levels[i] = level
        peaks[i] = level
      }
      draw()
    }

    const onPointer = (event) => {
      const box = canvas.getBoundingClientRect()
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top, strength: pointer.strength, inside: true }
    }
    const onLeave = () => {
      pointer.inside = false
    }
    const onDown = (event) => {
      onPointer(event)
      hit = 1
    }
    const onResize = () => {
      layout()
      if (still && width) paintStill()
    }
    const onMotionChange = (event) => {
      still = event.matches
      if (still) {
        cancelAnimationFrame(frame)
        frame = 0
        if (width) paintStill()
      } else {
        start()
      }
    }

    layout()
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(canvas)
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    })
    visibility.observe(canvas)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', onMotionChange)
    canvas.addEventListener('pointermove', onPointer)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointercancel', onLeave)

    if (still && width) paintStill()
    else start()

    return () => {
      cancelAnimationFrame(frame)
      frame = 0
      resizeObserver.disconnect()
      visibility.disconnect()
      motion.removeEventListener('change', onMotionChange)
      canvas.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointercancel', onLeave)
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      data-testid="rock-eq"
      aria-hidden="true"
      className="block w-full h-24 sm:h-32 touch-pan-y"
    />
  )
}
