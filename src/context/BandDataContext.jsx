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
import { CONTENT_VERSION, migrateLegacyContent, stableStringify } from '../lib/contentMigration'
import { sanitizeConfig } from '../lib/sanitizeConfig'
import { startLiveContent, stampOf } from '../lib/liveContent'
import {
  isSupabaseConfigured,
  supabase,
  isAdminUser,
  fetchSiteContent,
  fetchSiteContentVersion,
  subscribeToSiteContent,
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
const ECHO_WAIT_MS = 6000

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

// The local-only admin login (used while the shared content is unreachable) leaves this flag, see AdminPortal
function inLocalAdminSession() {
  try {
    return sessionStorage.getItem('pn_admin_session') === 'true'
  } catch {
    return false
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
  // How other open pages get the admin's changes: 'off' | 'connecting' | 'live' (pushed within a second or two)
  // | 'polling' (live updates are not set up, so pages check about every 30 seconds)
  const [liveStatus, setLiveStatus] = useState('off')
  // Did the admin's last save come back through the live connection? 'unknown' until it does or fails to within
  // a few seconds. That proves (or disproves) that live updates really reach pages, see supabase-realtime.sql.
  const [liveEcho, setLiveEcho] = useState('unknown')

  // Latest config, so edits made in the same tick build on each other, and the pending publish
  const configRef = useRef(config)
  const publishTimer = useRef(null)
  // The published version (see stampOf) this page shows, or null when nothing is published
  const versionRef = useRef(null)
  // True from an admin edit until it is saved on the server. While it is true, content arriving from the server
  // is ignored, otherwise a change made elsewhere could wipe an edit that has not been saved yet.
  const dirtyRef = useRef(false)
  const editCount = useRef(0)
  // Bookkeeping for liveEcho: the version of the admin's latest save, the latest version the server pushed,
  // the status as the live connection last reported it, and the timer that gives up waiting
  const lastPublishStamp = useRef(null)
  const echoSeen = useRef(null)
  const liveStatusRef = useRef('off')
  const echoTimer = useRef(0)

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
    if (!isSupabaseConfigured) return undefined
    let cancelled = false
    let retryTimer = 0
    let attempts = 0

    const load = () => {
      fetchSiteContent().then(({ status, reason, config: remote, updatedAt }) => {
        if (cancelled) return
        setRemoteStatus(status)
        setRemoteReason(reason || '')

        // The server could not be reached (a weak connection, a moment offline): keep trying quietly, so a
        // visitor does not stay on stale content for the whole visit. An admin working in the local-only mode
        // is left alone, because switching them to the server login in the middle of their work would confuse.
        if (status === 'unavailable' && reason === 'network' && !inLocalAdminSession()) {
          retryTimer = window.setTimeout(load, Math.min(60000, 8000 * 2 ** attempts))
          attempts += 1
          return
        }
        if (status !== 'ready') return

        const next = remote ? mergeConfig(remote) : DEFAULT_CONFIG
        configRef.current = next
        versionRef.current = remote ? stampOf(updatedAt) : null
        setConfig(next)
        if (remote) writeStored(CACHE_KEY, remote)
        else removeStored(CACHE_KEY)
      })
    }
    load()

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
    }
  }, [])

  // Live updates: while the shared content is active, whatever the admin publishes reaches this page by itself
  useEffect(() => {
    if (remoteStatus !== 'ready') return undefined

    const applyRemote = (remote, updatedAt) => {
      if (dirtyRef.current) return // unsaved edits of this admin win over what arrives
      versionRef.current = remote ? stampOf(updatedAt) : null
      if (remote) writeStored(CACHE_KEY, remote)
      else removeStored(CACHE_KEY)

      const next = remote ? mergeConfig(remote) : DEFAULT_CONFIG
      if (stableStringify(next) === stableStringify(configRef.current)) return // nothing on screen would change
      configRef.current = next
      setConfig(next)
    }

    const stop = startLiveContent({
      api: { fetchVersion: fetchSiteContentVersion, fetchContent: fetchSiteContent, subscribe: subscribeToSiteContent },
      getVersion: () => versionRef.current,
      onRemote: applyRemote,
      onStatus: (status) => {
        liveStatusRef.current = status
        setLiveStatus(status)
      },
      onEvent: (stamp) => {
        echoSeen.current = stamp
        if (stamp !== null && stamp === lastPublishStamp.current) {
          clearTimeout(echoTimer.current)
          setLiveEcho('confirmed')
        }
      }
    })
    return () => {
      stop()
      clearTimeout(echoTimer.current)
      liveStatusRef.current = 'off'
      setLiveStatus('off')
    }
  }, [remoteStatus])

  // Track the Supabase admin session (it persists across reloads)
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const admin = isAdminUser(session?.user)
      setAdminUser(admin ? session.user : null)
      // someone who is no longer the admin has no edits left to protect
      if (!admin) dirtyRef.current = false
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // A save made while live updates are connected must come back through them within a few seconds
  const expectEcho = (stamp) => {
    clearTimeout(echoTimer.current)
    if (echoSeen.current === stamp) {
      setLiveEcho('confirmed')
      return
    }
    if (liveStatusRef.current !== 'live') return
    echoTimer.current = window.setTimeout(() => {
      if (echoSeen.current !== stamp) setLiveEcho('missing')
    }, ECHO_WAIT_MS)
  }

  const publish = async (next) => {
    const editsAtStart = editCount.current
    // the version this save will have on the server, noted before the request so its echo can be recognised
    const updatedAt = new Date().toISOString()
    lastPublishStamp.current = stampOf(updatedAt)
    setLiveEcho('unknown')
    setSyncState({ status: 'saving', error: '' })
    const result = await saveSiteContent(next, updatedAt)
    if (result.success) {
      writeStored(CACHE_KEY, next)
      // this is the version the server now holds, so its live update coming back changes nothing
      versionRef.current = stampOf(result.updatedAt)
      expectEcho(versionRef.current)
      // an edit made while this one was being saved is still waiting, and keeps its protection
      if (editCount.current === editsAtStart) dirtyRef.current = false
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
    dirtyRef.current = true
    editCount.current += 1
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
        versionRef.current = null
        dirtyRef.current = false
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
        liveStatus,
        liveEcho,
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
