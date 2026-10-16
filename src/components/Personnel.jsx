import React from 'react'
import { motion } from 'framer-motion'
import { Volume2, Flame } from 'lucide-react'
import { useBandData } from '../context/BandDataContext'
import { audioEngine } from '../utils/audioSynth'

export default function Personnel() {
  const { config, currentTheme } = useBandData()
  const { members } = config

  const handleTestInstrument = (id) => {
    audioEngine.playFootswitchClick()
    if (id === 'arief') {
      audioEngine.playRockChord(146.83, 0.4)
      setTimeout(() => audioEngine.playRockChord(174.61, 0.4), 200)
      setTimeout(() => audioEngine.playRockChord(196.0, 0.6), 400)
    } else if (id === 'ganjar') {
      audioEngine.playRockChord(73.42, 0.5)
      setTimeout(() => audioEngine.playRockChord(87.31, 0.5), 250)
      setTimeout(() => audioEngine.playRockChord(98.0, 0.7), 500)
    } else if (id === 'kimao') {
      audioEngine.playRockChord(110.0, 0.2)
      setTimeout(() => audioEngine.playRockChord(130.81, 0.2), 150)
      setTimeout(() => audioEngine.playRockChord(146.83, 0.5), 300)
    } else {
      audioEngine.playRockChord(130.81, 0.5)
    }
  }

  return (
    <section id="personnel" className="py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-neutral-900">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ backgroundColor: currentTheme.primaryColor }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border text-xs font-tech uppercase font-bold tracking-widest mb-3"
            style={{
              borderColor: `${currentTheme.primaryColor}60`,
              color: currentTheme.primaryColor
            }}
          >
            <Flame className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} /> LINEUP PERSONIL
          </div>
          <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
            THE <span style={{ color: currentTheme.primaryColor }}>PUNK ROCK TRIO</span>
          </h2>
          <p className="font-tech text-sm text-neutral-400 mt-2">
            Tiga pilar di balik kekacauan sonik dan ledakan energi Paranoid Noise di atas panggung.
          </p>
        </div>

        {/* Full Band Lineup Portrait Banner */}
        <div className="relative mb-16 rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl group max-w-5xl mx-auto">
          <img
            src="/band/band_rock_8_1254x1254.png"
            alt="Paranoid Noise Trio"
            className="w-full h-80 sm:h-96 md:h-[460px] object-cover object-center filter grayscale contrast-125 brightness-90 group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
            <span
              className="font-grunge text-xl sm:text-2xl mb-1"
              style={{ color: currentTheme.primaryColor }}
            >
              PARANOID NOISE OFFICIAL LINEUP
            </span>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-tech text-neutral-200">
              {members.map((member) => (
                <span
                  key={member.id}
                  className="bg-black/75 px-3 py-1 rounded border border-neutral-700 backdrop-blur-md"
                >
                  <strong className="text-white">{member.name}</strong> &bull; {member.role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Members Individual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {members.map((member, idx) => (
            <motion.div
              key={member.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="relative rounded-2xl bg-neutral-950/90 border border-neutral-800 hover:border-neutral-700 transition-all duration-300 p-6 flex flex-col justify-between group hover:-translate-y-2 shadow-2xl"
              style={{
                boxShadow: member.id === 'kimao' ? `0 10px 30px ${currentTheme.primaryColor}22` : undefined
              }}
            >
              <div>
                
                {/* Member Avatar & Instrument Badge */}
                <div className="relative mb-6 rounded-xl overflow-hidden aspect-square border border-neutral-800 bg-neutral-900 group-hover:border-neutral-700 transition-colors">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = member.fallbackImage || '/logo.png'
                    }}
                  />
                  
                  {/* Instrument Badge Pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span
                      className="px-3 py-1 rounded-md bg-black/85 backdrop-blur-md border border-neutral-700 text-[11px] font-tech font-bold uppercase tracking-wider"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      {member.role}
                    </span>
                    <button
                      onClick={() => handleTestInstrument(member.id)}
                      className="p-1.5 rounded-md bg-neutral-900 border border-neutral-700 hover:border-white text-white transition-colors cursor-pointer"
                      title={`Dengarkan suara instrumen ${member.name}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
                    </button>
                  </div>
                </div>

                {/* Member Name */}
                <div className="flex items-baseline justify-between mb-2">
                  <h3
                    className="font-bebas text-4xl text-white tracking-wider transition-colors group-hover:text-red-400"
                  >
                    {member.name}
                  </h3>
                  <span className="text-xs font-tech font-bold uppercase tracking-wider text-neutral-500">
                    {member.id === 'kimao' ? 'DRUMMER & BEAT' : member.id === 'arief' ? 'FRONTMAN' : member.id === 'ganjar' ? 'BASSIST' : 'MUSICIAN'}
                  </span>
                </div>

                {/* Role Description */}
                <p className="text-xs font-tech text-neutral-300 leading-relaxed mb-4">
                  {member.description}
                </p>

                {/* Gear Specs */}
                {member.gear && (
                  <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800/80 mb-4 text-[11px] font-tech">
                    <span
                      className="font-bold uppercase block mb-1"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      Gear &amp; Weaponry:
                    </span>
                    <span className="text-neutral-400">{member.gear}</span>
                  </div>
                )}

              </div>

              {/* Member Quote */}
              {member.quote && (
                <div className="pt-4 border-t border-neutral-900 text-xs italic font-serif text-neutral-400 flex items-start gap-2">
                  <span
                    className="font-grunge text-lg leading-none"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    &ldquo;
                  </span>
                  <span>{member.quote}</span>
                </div>
              )}

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
