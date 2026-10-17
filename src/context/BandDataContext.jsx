import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  BAND_BIO,
  BAND_MEMBERS,
  SINGLES_DISCOGRAPHY,
  TOUR_EVENTS,
  MERCH_ITEMS,
  BAND_CONTACT,
  SITE_IMAGES
} from '../data/bandData'
import { CONTENT_VERSION, migrateLegacyContent } from '../lib/contentMigration'
import { sanitizeConfig } from '../lib/sanitizeConfig'
import {
  isSupabaseConfigured,
  supabase,
  isAdminUser,
  fetchSiteContent,
  saveSiteContent,
  deleteSiteContent,
  adminSignIn,
  adminSignOut
} from '../lib/supabase'

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
  contact: BAND_CONTACT,
  images: SITE_IMAGES,
  contentVersion: CONTENT_VERSION
}

// Where config lives in this browser. LOCAL_KEY holds admin edits while there is no shared content;
// it is only written after an admin edit, never on load, so a visitor never freezes a snapshot that
// would shadow later deploys of bandData.js. CACHE_KEY remembers the last shared content fetched
// from Supabase so returning visitors get a fast first paint.
const LOCAL_KEY = 'pn_live_band_config'
const CACHE_KEY = 'pn_site_content_cache'
const PUBLISH_DELAY_MS = 700

// Saved or published content may predate newer fields (fill the gaps from the defaults) or the
// current default copy (swap items that were never edited, see contentMigration.js)
function mergeConfig(saved) {
  const migrated = migrateLegacyContent(saved, DEFAULT_CONFIG)
  // anything that is not a plain object (null, a string, a list) is treated as "nothing saved"
  const content = migrated && typeof migrated === 'object' && !Array.isArray(migrated) ? migrated : {}
  // sanitizeConfig makes sure a badly shaped value cannot break a component
  return sanitizeConfig({
    ...DEFAULT_CONFIG,
    ...content,
    theme: { ...DEFAULT_CONFIG.theme, ...(content.theme || {}) },
    hero: { ...DEFAULT_CONFIG.hero, ...(content.hero || {}) },
    contact: { ...DEFAULT_CONFIG.contact, ...(content.contact || {}) },
    images: { ...DEFAULT_CONFIG.images, ...(content.images || {}) },
    contentVersion: CONTENT_VERSION
  }, DEFAULT_CONFIG, Object.keys(THEME_PRESETS))
}

function readStored(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? mergeConfig(JSON.parse(raw)) : null
  } catch (e) {
    console.warn('Failed to parse saved band config:', e)
    return null
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

function removeStored(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error('Failed to clear localStorage:', e)
  }
}

const BandDataContext = createContext(null)

export function BandDataProvider({ children }) {
  const [config, setConfig] = useState(
    () => (isSupabaseConfigured && readStored(CACHE_KEY)) || readStored(LOCAL_KEY) || DEFAULT_CONFIG
  )
  // 'off': no Supabase env | 'loading': checking site_content | 'ready': shared content is active
  // | 'unavailable': unreachable, or supabase-admin.sql not run yet (admin edits stay in this browser)
  const [remoteStatus, setRemoteStatus] = useState(isSupabaseConfigured ? 'loading' : 'off')
  // Why the content is 'unavailable': 'missing' (SQL not run yet) or 'network' (server unreachable)
  const [remoteReason, setRemoteReason] = useState('')
  const [adminUser, setAdminUser] = useState(null)
  const [syncState, setSyncState] = useState({ status: 'idle', error: '' })

  // Latest config, so edits made in the same tick build on each other, and the pending publish
  const configRef = useRef(config)
  const publishTimer = useRef(null)

  // Apply theme accent color dynamically to CSS root variables
  useEffect(() => {
    const preset = THEME_PRESETS[config.theme.preset] || THEME_PRESETS.crimson
    const root = document.documentElement
    root.style.setProperty('--primary-rock', preset.primaryColor)
    root.style.setProperty('--primary-rock-hover', preset.primaryHover)
    root.style.setProperty('--primary-rock-glow', preset.glowColor)
  }, [config.theme.preset])

  // The browser tab icon follows the logo
  useEffect(() => {
    const icon = document.querySelector('link[rel="icon"]')
    if (icon && config.images.logo) icon.href = config.images.logo
  }, [config.images.logo])

  // Shared content from Supabase wins over local copies once the site_content table exists
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    fetchSiteContent().then(({ status, reason, config: remote }) => {
      if (cancelled) return
      setRemoteStatus(status)
      setRemoteReason(reason || '')
      if (status !== 'ready') return

      const next = remote ? mergeConfig(remote) : DEFAULT_CONFIG
      configRef.current = next
      setConfig(next)
      if (remote) writeStored(CACHE_KEY, remote)
      else removeStored(CACHE_KEY)
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Track the Supabase admin session (it persists across reloads)
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminUser(isAdminUser(session?.user) ? session.user : null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const publish = async (next) => {
    setSyncState({ status: 'saving', error: '' })
    const result = await saveSiteContent(next)
    if (result.success) {
      writeStored(CACHE_KEY, next)
      setSyncState({ status: 'saved', error: '' })
    } else {
      setSyncState({ status: 'error', error: result.error })
    }
  }

  // Persist an admin edit: shared with every visitor when signed in to Supabase as admin,
  // otherwise kept in this browser only. Nothing is written before an admin edit happens.
  const persistEdit = (next) => {
    if (remoteStatus !== 'ready') {
      writeStored(LOCAL_KEY, next)
      return
    }
    if (!adminUser) return
    clearTimeout(publishTimer.current)
    publishTimer.current = setTimeout(() => publish(next), PUBLISH_DELAY_MS)
  }

  const commit = (updater) => {
    const next = typeof updater === 'function' ? updater(configRef.current) : updater
    configRef.current = next
    setConfig(next)
    persistEdit(next)
  }

  const updateTheme = (themeUpdates) => {
    commit(prev => ({
      ...prev,
      theme: { ...prev.theme, ...themeUpdates }
    }))
  }

  const updateHero = (heroUpdates) => {
    commit(prev => ({
      ...prev,
      hero: { ...prev.hero, ...heroUpdates }
    }))
  }

  const updateBio = (newBio) => {
    commit(prev => ({ ...prev, bio: newBio }))
  }

  const updateMembers = (newMembers) => {
    commit(prev => ({ ...prev, members: newMembers }))
  }

  const updateSingles = (newSingles) => {
    commit(prev => ({ ...prev, singles: newSingles }))
  }

  const updateGigs = (newGigs) => {
    commit(prev => ({ ...prev, gigs: newGigs }))
  }

  const updateMerch = (newMerch) => {
    commit(prev => ({ ...prev, merch: newMerch }))
  }

  const updateContact = (newContact) => {
    commit(prev => ({
      ...prev,
      contact: { ...prev.contact, ...newContact }
    }))
  }

  // One or more of the site-wide image slots (see IMAGE_SLOTS in bandData.js)
  const updateImages = (imageUpdates) => {
    commit(prev => ({
      ...prev,
      images: { ...prev.images, ...imageUpdates }
    }))
  }

  // With shared content this deletes the published row, so the site returns to bandData.js
  const resetToDefaults = async () => {
    clearTimeout(publishTimer.current)
    configRef.current = DEFAULT_CONFIG
    setConfig(DEFAULT_CONFIG)
    removeStored(LOCAL_KEY)

    if (remoteStatus === 'ready' && adminUser) {
      setSyncState({ status: 'saving', error: '' })
      const result = await deleteSiteContent()
      if (result.success) {
        removeStored(CACHE_KEY)
        setSyncState({ status: 'saved', error: '' })
      } else {
        setSyncState({ status: 'error', error: result.error })
      }
    }
  }

  const importConfig = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString)
      if (!parsed || typeof parsed !== 'object') throw new Error('This file is not a valid backup')
      commit(mergeConfig(parsed))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const retryPublish = () => publish(configRef.current)

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
        updateImages,
        resetToDefaults,
        importConfig,
        getConfig: () => configRef.current,
        remoteStatus,
        remoteReason,
        adminUser,
        syncState,
        adminLogin: adminSignIn,
        adminLogout: adminSignOut,
        retryPublish
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
