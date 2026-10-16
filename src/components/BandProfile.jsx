import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Zap, MapPin, Music } from 'lucide-react'
import { useBandData } from '../context/BandDataContext'

export default function BandProfile() {
  const { config, currentTheme } = useBandData()
  const { bio } = config

  const sonicPillars = [
    {
      title: 'Gritty Distortion Riffs',
      subtitle: 'Nirvana & Seattle Sound',
      desc: 'Riff gitar sarat distorsi dan fuzz tebal yang berakar pada tradisi alternative rock 90-an.',
      icon: Flame
    },
    {
      title: 'Explosive Grunge Rhythms',
      subtitle: 'Deep Emotional Intensity',
      desc: 'Hentakan drum menggelegar dan ritme dinamis yang mencengkeram emosi penonton dari awal hingga akhir.',
      icon: Zap
    },
    {
      title: 'Indonesian Underground Spirit',
      subtitle: 'Bekasi - Jakarta - Bandung',
      desc: 'Ditempa di panggung-panggung independen, gig klub sempit hingga panggung festival bergengsi.',
      icon: MapPin
    },
    {
      title: 'Alienation & Rebellion',
      subtitle: 'Raw Youth Vulnerability',
      desc: 'Lirik tanpa kompromi yang menyuarakan keresahan batin, alienasi, dan keraguan diri generasi muda.',
      icon: Music
    }
  ]

  return (
    <section id="profile" className="py-24 bg-[#080808] relative overflow-hidden border-t border-neutral-900">
      
      {/* Background Decorative Accents */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: currentTheme.primaryColor }}
      />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-neutral-900/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-neutral-800">
          <div>
            <div
              className="flex items-center gap-2 font-tech font-bold text-xs uppercase tracking-widest mb-2"
              style={{ color: currentTheme.primaryColor }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTheme.primaryColor }}
              />{' '}
              PROFIL &amp; SEJARAH BAND
            </div>
            <h2 className="font-bebas text-4xl sm:text-6xl md:text-7xl tracking-wider text-white">
              ABOUT <span style={{ color: currentTheme.primaryColor }}>PARANOID NOISE</span>
            </h2>
          </div>
          <p className="mt-4 md:mt-0 font-tech text-sm text-neutral-400 max-w-md">
            Unit punk rock &amp; 90’s grunge trio asal Jakarta yang menyulut panggung underground dengan energi mentah dan distorsi tanpa ampun.
          </p>
        </div>

        {/* Grid: Story & Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          
          {/* Left Column: Official Band Bio */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="relative p-8 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 shadow-2xl backdrop-blur-sm">
              <div className="absolute top-4 right-4 text-neutral-800 font-bebas text-6xl select-none">
                #PN
              </div>

              {/* Quote Mark */}
              <div
                className="font-grunge text-3xl mb-3"
                style={{ color: currentTheme.primaryColor }}
              >
                &ldquo;
              </div>

              {/* The User-Provided Band Profile Text */}
              <p
                className="text-neutral-300 font-sans text-base sm:text-lg leading-relaxed text-justify first-letter:text-5xl first-letter:font-bebas first-letter:mr-2 first-letter:float-left"
                style={{ '--first-color': currentTheme.primaryColor }}
              >
                {bio}
              </p>

              <div
                className="font-grunge text-3xl text-right mt-1"
                style={{ color: currentTheme.primaryColor }}
              >
                &rdquo;
              </div>

              {/* Footnote Badge */}
              <div className="mt-6 pt-4 border-t border-neutral-900 flex flex-wrap items-center justify-between text-xs font-tech text-neutral-400">
                <span
                  className="font-bold uppercase"
                  style={{ color: currentTheme.primaryColor }}
                >
                  &bull; JAKARTA INDONESIA UNDERGROUND
                </span>
                <span>ORIGIN: BEKASI - JAKARTA - BANDUNG</span>
              </div>
            </div>

            {/* Stage Montage Banner */}
            <div className="relative rounded-xl overflow-hidden border border-neutral-800 group">
              <img
                src="/band/band_rock_10_1270x763.png"
                alt="Paranoid Noise Gig Montage"
                className="w-full h-48 object-cover filter grayscale contrast-125 brightness-75 group-hover:scale-105 group-hover:brightness-90 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end p-4">
                <div className="text-xs font-tech font-semibold text-neutral-200">
                  <span
                    className="font-bold uppercase"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    LIVE CIRCUITS:
                  </span>{' '}
                  Hard Rock Cafe, Authenticity Stage, Underground Clubs across Java
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Live Photo & Marshall Gear Stack */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Live Trio Stage Photo */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-neutral-800 shadow-2xl group">
              <img
                src="/band/band_rock_3_1269x1269.png"
                alt="Paranoid Noise Live on Stage"
                className="w-full h-auto object-cover filter grayscale contrast-125 group-hover:contrast-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <span
                  className="font-grunge text-lg"
                  style={{ color: currentTheme.primaryColor }}
                >
                  EXPLOSIVE LIVE ENERGY
                </span>
                <span className="font-tech text-xs text-neutral-300">
                  Arief, Ganjar, &amp; Kimao menghajar panggung tanpa kompromi.
                </span>
              </div>
            </div>

            {/* Gear & Noise Identity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative rounded-xl overflow-hidden border border-neutral-800 group h-36">
                <img
                  src="/band/band_rock_7_1269x1267.png"
                  alt="Marshall Amplifiers Gear"
                  className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 text-center">
                  <span className="font-bebas text-lg text-white tracking-wider">MARSHALL STACKS &amp; FUZZ</span>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-neutral-800 group h-36">
                <img
                  src="/band/band_rock_2_1247x690.png"
                  alt="Rehearsal Jam Room"
                  className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 text-center">
                  <span className="font-bebas text-lg text-white tracking-wider">MAPEX DRUMS &amp; SEATTLE RIFFS</span>
                </div>
              </div>
            </div>

          </motion.div>

        </div>

        {/* 4 Sonic Pillars Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sonicPillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all duration-300 group hover:-translate-y-1 shadow-lg"
              >
                <div
                  className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 transition-colors"
                  style={{ borderColor: `${currentTheme.primaryColor}50` }}
                >
                  <Icon className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
                </div>
                <div
                  className="text-[10px] font-tech font-bold uppercase tracking-widest mb-1"
                  style={{ color: currentTheme.primaryColor }}
                >
                  {pillar.subtitle}
                </div>
                <h3 className="font-bebas text-2xl text-white tracking-wide mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs font-tech text-neutral-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
