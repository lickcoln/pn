import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  BAND_BIO,
  BAND_MEMBERS,
  SINGLES_DISCOGRAPHY,
  TOUR_EVENTS,
  MERCH_ITEMS,
  BAND_CONTACT
} from '../data/bandData'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export const THEME_PRESETS = {
  crimson: {
    id: 'crimson',
    name: 'Crimson Grunge (Default Red)',
    primaryColor: '#dc2626',
    primaryHover: '#ef4444',
    glowColor: 'rgba(220, 38, 38, 0.5)',
    bgGradient: 'from-red-950/40 via-black to-black',
    accentText: 'text-red-500',
    accentBg: 'bg-red-600',
    accentBorder: 'border-red-600'
  },
  burgundy: {
    id: 'burgundy',
    name: 'Blood Wine Burgundy',
    primaryColor: '#991b1b',
    primaryHover: '#b91c1c',
    glowColor: 'rgba(153, 27, 27, 0.6)',
    bgGradient: 'from-stone-950 via-red-950/30 to-black',
    accentText: 'text-red-600',
    accentBg: 'bg-red-700',
    accentBorder: 'border-red-800'
  },
  neonGreen: {
    id: 'neonGreen',
    name: 'Toxic Acid Grunge (Green)',
    primaryColor: '#22c55e',
    primaryHover: '#4ade80',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    bgGradient: 'from-emerald-950/40 via-black to-black',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-600',
    accentBorder: 'border-emerald-600'
  },
  purple: {
    id: 'purple',
    name: 'Seattle Cyber Distortion (Purple)',
    primaryColor: '#a855f7',
    primaryHover: '#c084fc',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    bgGradient: 'from-purple-950/40 via-black to-black',
    accentText: 'text-purple-400',
    accentBg: 'bg-purple-600',
    accentBorder: 'border-purple-600'
  },
  silver: {
    id: 'silver',
    name: 'Monochromatic Punk Silver',
    primaryColor: '#e5e5e5',
    primaryHover: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.4)',
    bgGradient: 'from-neutral-900/60 via-black to-black',
    accentText: 'text-neutral-200',
    accentBg: 'bg-neutral-200 text-black',
    accentBorder: 'border-neutral-400'
  },
  amber: {
    id: 'amber',
    name: 'Distortion Amber Orange',
    primaryColor: '#f97316',
    primaryHover: '#fb923c',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    bgGradient: 'from-orange-950/40 via-black to-black',
    accentText: 'text-orange-400',
    accentBg: 'bg-orange-600',
    accentBorder: 'border-orange-600'
  }
}

const DEFAULT_CONFIG = {
  theme: {
    preset: 'crimson',
    noiseOpacity: 0.35,
    glitchIntensity: 'normal', // 'off', 'normal', 'extreme'
    heroStyle: 'classic' // 'classic', 'compact'
  },
  hero: {
    title: 'PARANOID NOISE',
    tagline: 'RAW ENERGY. EXPLOSIVE CHAOS. UNAPOLOGETIC ROCK.',
    sceneBadge: 'JAKARTA UNDERGROUND • EST. 2021'
  },
  bio: BAND_BIO,
  members: BAND_MEMBERS,
  singles: SINGLES_DISCOGRAPHY,
  gigs: TOUR_EVENTS,
  merch: MERCH_ITEMS,
  contact: BAND_CONTACT
}

const BandDataContext = createContext(null)

export function BandDataProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('pn_live_band_config')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          theme: { ...DEFAULT_CONFIG.theme, ...(parsed.theme || {}) },
          hero: { ...DEFAULT_CONFIG.hero, ...(parsed.hero || {}) },
          contact: { ...DEFAULT_CONFIG.contact, ...(parsed.contact || {}) }
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved band config:', e)
    }
    return DEFAULT_CONFIG
  })

  // Apply theme accent color dynamically to CSS root variables
  useEffect(() => {
    const preset = THEME_PRESETS[config.theme.preset] || THEME_PRESETS.crimson
    const root = document.documentElement
    root.style.setProperty('--primary-rock', preset.primaryColor)
    root.style.setProperty('--primary-rock-hover', preset.primaryHover)
    root.style.setProperty('--primary-rock-glow', preset.glowColor)

    try {
      localStorage.setItem('pn_live_band_config', JSON.stringify(config))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [config])

  const updateTheme = (themeUpdates) => {
    setConfig(prev => ({
      ...prev,
      theme: { ...prev.theme, ...themeUpdates }
    }))
  }

  const updateHero = (heroUpdates) => {
    setConfig(prev => ({
      ...prev,
      hero: { ...prev.hero, ...heroUpdates }
    }))
  }

  const updateBio = (newBio) => {
    setConfig(prev => ({ ...prev, bio: newBio }))
  }

  const updateMembers = (newMembers) => {
    setConfig(prev => ({ ...prev, members: newMembers }))
  }

  const updateSingles = (newSingles) => {
    setConfig(prev => ({ ...prev, singles: newSingles }))
  }

  const updateGigs = (newGigs) => {
    setConfig(prev => ({ ...prev, gigs: newGigs }))
  }

  const updateMerch = (newMerch) => {
    setConfig(prev => ({ ...prev, merch: newMerch }))
  }

  const updateContact = (newContact) => {
    setConfig(prev => ({
      ...prev,
      contact: { ...prev.contact, ...newContact }
    }))
  }

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem('pn_live_band_config')
  }

  const importConfig = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString)
      setConfig({
        ...DEFAULT_CONFIG,
        ...parsed
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const currentTheme = THEME_PRESETS[config.theme.preset] || THEME_PRESETS.crimson

  return (
    <BandDataContext.Provider
      value={{
        config,
        currentTheme,
        themePresets: THEME_PRESETS,
        updateTheme,
        updateHero,
        updateBio,
        updateMembers,
        updateSingles,
        updateGigs,
        updateMerch,
        updateContact,
        resetToDefaults,
        importConfig
      }}
    >
      {children}
    </BandDataContext.Provider>
  )
}

export function useBandData() {
  const context = useContext(BandDataContext)
  if (!context) {
    throw new Error('useBandData must be used within BandDataProvider')
  }
  return context
}
