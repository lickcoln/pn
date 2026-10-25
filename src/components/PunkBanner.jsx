import React, { useEffect, useRef, useState } from 'react'
import { useBandData } from '../context/BandDataContext'

// Words come from config.texts.tickerText, separated by a bullet, a bar or a new line
const splitPhrases = (text) => String(text || '').split(/\s*[•|\n]\s*/).map((word) => word.trim()).filter(Boolean)

// One half of a strip has to be wider than the screen, so the phrases repeat until there are enough
const MIN_ITEMS = 10
const fill = (phrases) => {
  const items = []
  while (items.length < MIN_ITEMS) items.push(...phrases)
  return items
}

function Star({ color, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon
        points="12,1.5 15,8.6 22.5,9.2 16.8,14.2 18.6,21.8 12,17.8 5.4,21.8 7.2,14.2 1.5,9.2 9,8.6"
        fill={color}
        stroke="#000"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Bolt({ color, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon points="14,0.8 3.5,14 10.5,14 8,23.2 20.5,8.6 13.2,8.6" fill={color} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// A grinning face with crossed-out eyes
function Smiley({ color, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill={color} stroke="#000" strokeWidth="1.6" />
      <path d="M6.6 7.6l3.2 3.2M9.8 7.6l-3.2 3.2M14.2 7.6l3.2 3.2M17.4 7.6l-3.2 3.2" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.2 14.2q5.8 6.4 11.6 0z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// A strip of tape with words that scroll forever. The words are written twice and the strip slides by exactly
// one copy, so the loop has no visible seam.
function Strip({ items, back, speed, tapeClass, wordClass, starColor, className, style }) {
  return (
    <div className={`absolute left-[-5%] w-[110%] overflow-hidden ${tapeClass} ${className}`} style={style}>
      <div className={`flex w-max items-center will-change-transform ${back ? 'pn-marquee-back' : 'pn-marquee'}`} style={{ '--pn-speed': speed }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {items.map((word, index) => (
              <React.Fragment key={index}>
                <span className={`px-4 sm:px-6 py-1.5 font-bebas text-3xl sm:text-5xl leading-none tracking-wider whitespace-nowrap ${wordClass}`}>
                  {word}
                </span>
                <Star color={starColor} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PunkBanner() {
  const { config, currentTheme } = useBandData()
  const color = currentTheme.primaryColor
  const phrases = splitPhrases(config.texts.tickerText)
  const ref = useRef(null)
  const [visible, setVisible] = useState(true)

  // Nothing moves while the banner is scrolled out of sight
  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [phrases.length])

  if (phrases.length === 0) return null
  const forward = fill(phrases)
  const backward = fill([...phrases].reverse())

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="punk-banner"
      className={`relative z-10 w-full mt-10 sm:mt-14 h-44 sm:h-60 select-none pointer-events-none ${visible ? '' : 'pn-paused'}`}
    >
      {/* two strips of tape crossing each other */}
      <Strip
        items={forward}
        speed="34s"
        tapeClass="border-y-4 border-black shadow-[0_8px_0_rgba(0,0,0,0.55)]"
        wordClass="text-black"
        starColor="#0a0a0a"
        className="top-6 sm:top-10 -rotate-2"
        style={{ backgroundColor: color }}
      />
      <Strip
        items={backward}
        back
        speed="44s"
        tapeClass="border-y-2 border-white/30 bg-neutral-950"
        wordClass="text-white"
        starColor={color}
        className="top-[4.9rem] sm:top-[7.4rem] rotate-1"
      />

      {/* a moving skate checkerboard along the bottom */}
      <div
        className="pn-checker absolute inset-x-0 bottom-0 h-4 sm:h-5"
        style={{ backgroundImage: `repeating-conic-gradient(${color} 0 25%, #0a0a0a 0 50%)`, backgroundSize: '28px 28px' }}
      />

      {/* doodles that bounce on the beat */}
      <div className="pn-wiggle absolute left-[5%] top-0 w-9 sm:w-14 z-20">
        <Bolt color={color} className="pn-flicker w-full" />
      </div>
      <div className="pn-pogo absolute right-[7%] top-0 w-11 sm:w-16 z-20">
        <Smiley color={color} className="w-full" />
      </div>
      <div className="pn-wiggle absolute left-[46%] -top-1 w-7 sm:w-10 z-20" style={{ animationDelay: '-0.4s' }}>
        <Star color="#fff" className="w-full" />
      </div>
      <div className="pn-wiggle absolute right-[30%] bottom-5 sm:bottom-7 w-8 sm:w-11 z-20" style={{ animationDelay: '-0.7s' }}>
        <Bolt color="#fff" className="pn-flicker w-full" />
      </div>
      <div className="pn-pogo absolute left-[22%] bottom-4 sm:bottom-6 w-8 sm:w-11 z-20" style={{ animationDelay: '-0.45s' }}>
        <Star color={color} className="w-full" />
      </div>
    </div>
  )
}
