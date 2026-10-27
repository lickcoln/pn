import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { PrimaryButton } from './ui'
import MediaField from '../MediaField'

export default function ThemeTab({ theme, themePresets, hero, updateTheme, onSaveHero, canUpload, onDiscard }) {
  const [heroForm, setHeroForm] = useState(hero)

  const handleSaveHero = (e) => {
    e.preventDefault()
    onSaveHero(heroForm, 'Hero headline & theme updated!')
  }

  // An uploaded sound is on the server already, so it saves this form right away
  const handleStompSound = (url, name) => {
    const next = { ...heroForm, stompSoundUrl: url, stompSoundName: name }
    setHeroForm(next)
    onSaveHero(next, url ? 'Stompbox sound updated!' : 'Stompbox sound removed!')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h4 className="font-bebas text-3xl text-white tracking-wide">
          THEME &amp; VISUAL SETTINGS
        </h4>
        <p className="text-xs font-tech text-neutral-400">
          Change the accent color scheme, the grunge noise grain intensity, and the hero banner style live.
        </p>
      </div>

      {/* Theme Presets */}
      <div className="space-y-3">
        <label className="block text-xs font-tech font-bold uppercase text-neutral-300">
          Choose a Rock Accent Color Preset:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(themePresets).map((preset) => {
            const isSelected = theme.preset === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateTheme({ preset: preset.id })}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'border-white bg-neutral-900 shadow-lg'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full border border-white/20 shrink-0 shadow-sm"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <div className="truncate">
                  <span className="font-tech text-xs font-bold text-white block truncate">
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {preset.primaryColor}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Visual Effects & Noise */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <span className="text-xs font-tech font-bold uppercase text-neutral-300 block">
          Grunge &amp; Distortion Effects:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="theme-noise" className="block text-[11px] font-tech text-neutral-400 mb-1">
              Background Noise Intensity
            </label>
            <input
              id="theme-noise"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={theme.noiseOpacity}
              onChange={(e) => updateTheme({ noiseOpacity: parseFloat(e.target.value) })}
              className="w-full accent-red-600"
            />
            <span className="text-[10px] font-mono text-neutral-400">
              {Math.round(theme.noiseOpacity * 100)}%
            </span>
          </div>

          <div>
            <label htmlFor="theme-glitch" className="block text-[11px] font-tech text-neutral-400 mb-1">
              Glitch Animation Intensity
            </label>
            <select
              id="theme-glitch"
              value={theme.glitchIntensity}
              onChange={(e) => updateTheme({ glitchIntensity: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-tech text-white"
            >
              <option value="off">Off</option>
              <option value="normal">Normal (Hover Only)</option>
              <option value="extreme">Extreme (Full Rock Chaos)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hero Banner Text */}
      <form onSubmit={handleSaveHero} className="space-y-4">
        <span className="text-xs font-tech font-bold uppercase text-neutral-300 block">
          Hero Banner Headline &amp; Tagline:
        </span>

        {[
          ['title', 'Hero Main Title'],
          ['tagline', 'Rock Tagline'],
          ['sceneBadge', 'Scene Badge Label']
        ].map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`hero-${key}`} className="block text-[11px] font-tech text-neutral-400 mb-1">
              {label}
            </label>
            <input
              id={`hero-${key}`}
              type="text"
              value={heroForm[key] ?? ''}
              onChange={(e) => setHeroForm({ ...heroForm, [key]: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 text-white text-xs font-tech"
            />
          </div>
        ))}

        <PrimaryButton icon={Save}>Save Theme &amp; Hero Settings</PrimaryButton>
      </form>

      {/* The sound of the stompbox logo on the home page */}
      <MediaField
        label="Stompbox sound (the logo on the home page)"
        hint="An MP3 or WAV file, up to 25 MB. Visitors hear it when they click the stompbox logo and can click again to stop it. Uploading saves it right away."
        kind="audio"
        wav
        emptyText="No sound yet. The logo plays a synthesized guitar riff instead."
        folder="audio/stompbox"
        value={heroForm.stompSoundUrl || ''}
        fileName={heroForm.stompSoundName}
        canUpload={canUpload}
        onChange={(url, meta) => handleStompSound(url, meta?.name || '')}
        onDiscard={onDiscard}
      />
    </div>
  )
}
