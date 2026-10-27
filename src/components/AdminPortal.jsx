import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Unlock,
  Key,
  User,
  Shield,
  Palette,
  FileText,
  Users,
  Calendar,
  ShoppingBag,
  Disc,
  Phone,
  X,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Type,
  Inbox,
  Cloud,
  CloudOff,
  LoaderCircle,
  RefreshCw,
  Images
} from 'lucide-react'
import { useBandData } from '../context/BandDataContext'
import { deleteMedia } from '../lib/supabase'
import { OPEN_ADMIN_EVENT } from '../lib/adminEvents'
import { useModal } from '../lib/useModal'
import ThemeTab from './admin/ThemeTab'
import ImagesTab from './admin/ImagesTab'
import BioTab from './admin/BioTab'
import TextsTab from './admin/TextsTab'
import MembersTab from './admin/MembersTab'
import GigsTab from './admin/GigsTab'
import InboxTab from './admin/InboxTab'
import MerchTab from './admin/MerchTab'
import SinglesTab from './admin/SinglesTab'
import ContactTab from './admin/ContactTab'
import BackupTab from './admin/BackupTab'

const TABS = [
  ['theme', 'Theme & Look', Palette],
  ['images', 'Images & Backgrounds', Images],
  ['bio', 'Profile & Band Bio', FileText],
  ['texts', 'Site Texts', Type],
  ['members', 'Band Members', Users],
  ['gigs', 'Gigs & Tour Schedule', Calendar],
  ['rsvps', 'Ticket RSVPs', CheckCircle],
  ['bookings', 'Booking Requests', Inbox],
  ['merch', 'Merchandise', ShoppingBag],
  ['singles', 'Discography', Disc],
  ['contact', 'Contact & Social', Phone]
]

const tabButtonClass = (active) =>
  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
    active ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
  }`

// A tab keeps its own unsaved draft. It starts over only when the saved data it edits changes (after its own
// save, an import or a reset), so saving or uploading in one tab never wipes what was typed in another.
const versionOf = (value) => JSON.stringify(value)

export default function AdminPortal() {
  const {
    config,
    themePresets,
    updateTheme,
    updateHero,
    updateBio,
    updateTexts,
    updateMembers,
    updateSingles,
    updateGigs,
    updateMerch,
    updateContact,
    updateImages,
    resetToDefaults,
    importConfig,
    getConfig,
    remoteStatus,
    remoteReason,
    liveStatus,
    liveEcho,
    adminUser,
    syncState,
    adminLogin,
    adminLogout,
    retryPublish
  } = useBandData()

  const [legacyAdmin, setLegacyAdmin] = useState(() => {
    return sessionStorage.getItem('pn_admin_session') === 'true'
  })
  // Once supabase-admin.sql has been applied ('ready'), admin means a Supabase admin session;
  // before that, the local-only login below keeps working
  const usesSupabaseLogin = remoteStatus === 'ready'
  const isAdmin = usesSupabaseLogin ? Boolean(adminUser) : legacyAdmin
  const loginHint = remoteStatus === 'loading'
    ? 'Connecting to the server...'
    : usesSupabaseLogin ? 'Supabase admin account' : null
  // Supabase is set up but this browser cannot reach it (offline, ad blocker, VPN or network block)
  const serverUnreachable = remoteStatus === 'unavailable' && remoteReason === 'network'
  // Photos and songs go to Supabase Storage, which needs the shared mode and an admin session
  const canUpload = usesSupabaseLogin && Boolean(adminUser)

  // A replaced upload is removed from storage after a short delay (the new link has to be published
  // first), and only when nothing in the saved content still points to it
  const discardOldMedia = (url) => {
    if (!url) return
    setTimeout(() => {
      if (!JSON.stringify(getConfig()).includes(url)) deleteMedia(url)
    }, 12000)
  }
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [activeTab, setActiveTab] = useState('theme')
  const [saveNotification, setSaveNotification] = useState('')

  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  useModal(showLoginModal, () => setShowLoginModal(false))
  // The panel only locks the page behind it. Escape does not close it: it is a big editing surface, and an
  // accidental Escape would throw away what was typed.
  useModal(showDashboard && isAdmin, () => {})

  // Keyboard shortcut Ctrl + Shift + A, and the "Admin login" link in the footer (a second way in for a phone,
  // next to the green dot in the corner)
  useEffect(() => {
    const toggleAdmin = () => {
      if (isAdmin) {
        setShowDashboard(prev => !prev)
      } else {
        setShowLoginModal(true)
      }
    }
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        toggleAdmin()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener(OPEN_ADMIN_EVENT, toggleAdmin)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener(OPEN_ADMIN_EVENT, toggleAdmin)
    }
  }, [isAdmin])

  // Handle Login Authentication
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (usesSupabaseLogin) {
      setLoggingIn(true)
      const result = await adminLogin(username.trim(), password)
      setLoggingIn(false)
      if (result.success) {
        setShowLoginModal(false)
        setShowDashboard(true)
        setUsername('')
        setPassword('')
      } else {
        setLoginError(result.error)
      }
      return
    }

    // Local-only login, used until the shared content table exists (supabase-admin.sql)
    // Exact credentials requested by user
    if (username.trim() === 'paranoidnoise' && password.trim() === 'pn2026') {
      setLegacyAdmin(true)
      sessionStorage.setItem('pn_admin_session', 'true')
      setShowLoginModal(false)
      setShowDashboard(true)
      setUsername('')
      setPassword('')
    } else {
      setLoginError('Wrong username or password! (Check again: username paranoidnoise & password pn2026)')
    }
  }

  const handleLogout = () => {
    setLegacyAdmin(false)
    sessionStorage.removeItem('pn_admin_session')
    if (usesSupabaseLogin) adminLogout()
    setShowDashboard(false)
  }

  const notifySaved = (msg = 'Changes saved & applied!') => {
    setSaveNotification(msg)
    setTimeout(() => setSaveNotification(''), 3000)
  }

  // A tab hands its new data and an optional message; saving applies it for everyone and shows the message
  const saver = (update) => (value, message) => {
    update(value)
    if (message) notifySaved(message)
  }

  return (
    <>
      {/* 1. Access button in the bottom-right corner: a faint lock on large screens, a small green dot on a phone
          (just above the tab bar, whose height grows with the safe area of an iPhone) */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-3 right-3 z-40 flex items-center gap-2">
        {isAdmin && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowDashboard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/90 border border-red-600 text-red-200 text-xs font-tech font-bold uppercase shadow-lg shadow-red-950/60 hover:bg-red-900 transition-all cursor-pointer"
            title="Open the administrator control panel"
          >
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">ADMIN CMS</span>
          </motion.button>
        )}

        <button
          onClick={() => {
            if (isAdmin) {
              setShowDashboard(true)
            } else {
              setShowLoginModal(true)
            }
          }}
          className={`rounded-full transition-all duration-300 cursor-pointer ${
            isAdmin
              ? 'p-2 border bg-neutral-900 border-red-600 text-red-400 opacity-90 hover:opacity-100 shadow-md shadow-red-950/50'
              : 'flex items-center justify-center w-9 h-9 lg:w-auto lg:h-auto lg:p-2 lg:border lg:bg-black/40 lg:border-neutral-800 text-neutral-600 hover:text-neutral-300 lg:opacity-30 lg:hover:opacity-90'
          }`}
          title={isAdmin ? 'Admin mode is on (click to open the panel)' : 'Administrator access'}
          aria-label="Admin access"
        >
          {isAdmin ? (
            <Unlock className="w-4 h-4" />
          ) : (
            <>
              <Lock className="hidden lg:block w-4 h-4" />
              {/* the phone version: a plain green dot with a soft glow, easy to see on a dark page but only 12 px wide
                  (the button around it is 36 px so a finger can hit it without covering much of the page) */}
              <span
                data-testid="admin-dot"
                aria-hidden="true"
                className="lg:hidden block w-3 h-3 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.22),0_0_10px_rgba(34,197,94,0.85)]"
              />
            </>
          )}
        </button>
      </div>

      {/* 2. Admin Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Administrator login"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-neutral-950 border-2 border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl text-left"
              >
                <button
                  onClick={() => setShowLoginModal(false)}
                  aria-label="Close"
                  className="absolute top-4 right-4 p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4 pr-10">
                  <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wide leading-none">
                      ADMINISTRATOR LOGIN
                    </h3>
                    <span className="text-[10px] font-tech text-neutral-400 uppercase tracking-widest">
                      PARANOID NOISE MANAGEMENT
                    </span>
                  </div>
                </div>

                <p className="text-xs font-tech text-neutral-400 mb-6">
                  Enter your administrator credentials to manage the website content, tour schedule, merchandise, band members, and theme.
                </p>

                {serverUnreachable && (
                  <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-xs font-tech text-amber-200 mb-4 flex items-start gap-2">
                    <CloudOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      This browser cannot reach the server. Turn off ad-blocker or privacy extensions and any VPN for this
                      site, or try another network, then reload the page. The local login below only changes what you see
                      in this browser.
                    </span>
                  </div>
                )}

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-700/80 text-xs font-tech text-red-200 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="admin-login-name" className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                      {usesSupabaseLogin ? 'Email' : 'Username'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-login-name"
                        type={usesSupabaseLogin ? 'email' : 'text'}
                        required
                        autoFocus
                        autoComplete={usesSupabaseLogin ? 'email' : 'username'}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={usesSupabaseLogin ? 'Enter the admin email' : 'Enter your username'}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-login-password" className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-login-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-tech text-neutral-500">
                      {loginHint ?? <>Access: <code>paranoidnoise</code></>}
                    </span>
                    <button
                      type="submit"
                      disabled={remoteStatus === 'loading' || loggingIn}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/60"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{loggingIn ? 'Checking...' : 'Sign In as Administrator'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Admin CMS Control Panel (Full Dashboard Modal) */}
      <AnimatePresence>
        {showDashboard && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-lg">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Administrator control panel"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border-2 border-neutral-800 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left"
            >
              {/* Dashboard Top Header */}
              <div className="p-4 sm:p-6 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-700 flex items-center justify-center">
                    <img src="/logo.png" alt="PN" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wider leading-none">
                        PARANOID NOISE CMS CONTROL PANEL
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-tech font-bold uppercase">
                        ADMIN
                      </span>
                    </div>
                    <span className="text-xs font-tech text-neutral-400">
                      Signed in as: <strong className="text-neutral-200">{usesSupabaseLogin ? adminUser?.email : 'paranoidnoise'}</strong> &bull; Edit the look, information, and theme live.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-tech font-bold uppercase transition-colors"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setShowDashboard(false)}
                    aria-label="Close the panel"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title="Close the panel & view the website"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notification Banner */}
              {saveNotification && (
                <div role="status" className="bg-green-950/80 border-b border-green-800 px-6 py-2.5 text-xs font-tech text-green-300 flex items-center justify-between animate-fadeIn shrink-0">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <strong>Success:</strong> {saveNotification}
                  </span>
                  <button onClick={() => setSaveNotification('')} aria-label="Dismiss" className="text-green-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Where edits go: shared with every visitor (Supabase) or this browser only */}
              {usesSupabaseLogin ? (
                <div className={`border-b px-6 py-2 text-xs font-tech shrink-0 ${
                  syncState.status === 'error'
                    ? 'bg-red-950/70 border-red-900 text-red-200'
                    : syncState.status === 'saved'
                      ? 'bg-green-950/50 border-green-900 text-green-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      {syncState.status === 'saving' ? (
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                      ) : syncState.status === 'error' ? (
                        <CloudOff className="w-4 h-4" />
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                      {syncState.status === 'saving' && 'Saving to the server...'}
                      {syncState.status === 'saved' && 'Saved to the server and live for every visitor.'}
                      {syncState.status === 'error' && `Could not save to the server: ${syncState.error}`}
                      {syncState.status === 'idle' && 'Connected to the server: changes are saved automatically and live for every visitor.'}
                    </span>
                    {syncState.status === 'error' && (
                      <button
                        onClick={retryPublish}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-red-100 font-bold uppercase shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try again
                      </button>
                    )}
                  </div>
                  {/* How fast the pages that are open right now catch up (see supabase-realtime.sql) */}
                  {liveStatus === 'live' && liveEcho !== 'missing' && (
                    <p className="mt-1 text-[11px] opacity-80">
                      Instant updates are on{liveEcho === 'confirmed' ? ' (confirmed by your last save)' : ''}: visitors who have the site open see your changes within a second or two, without refreshing.
                    </p>
                  )}
                  {liveStatus === 'live' && liveEcho === 'missing' && (
                    <p className="mt-1 text-[11px] text-amber-300">
                      Live updates are connected, but your last save did not come back through them, so visitors who have the site open may need a couple of minutes to see changes. Run supabase-realtime.sql once in the Supabase SQL Editor, then reload this page.
                    </p>
                  )}
                  {liveStatus === 'polling' && (
                    <p className="mt-1 text-[11px] text-amber-300">
                      Instant updates are off, so visitors who have the site open catch up within about 30 seconds. To make it instant, run supabase-realtime.sql once in the Supabase SQL Editor.
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-b px-6 py-2 text-xs font-tech flex items-center gap-2 shrink-0 bg-amber-950/50 border-amber-900 text-amber-300">
                  <CloudOff className="w-4 h-4 shrink-0" />
                  {serverUnreachable
                    ? 'Cannot reach the server from this browser, so changes stay in this browser only. Check your ad blocker, VPN or network, then reload.'
                    : 'Local mode: changes are only saved in this browser and other visitors cannot see them.'}
                </div>
              )}

              {/* Dashboard Layout: Sidebar Tabs + Content Area */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* Sidebar Navigation Tabs */}
                <div className="w-full md:w-56 bg-neutral-900/60 border-r border-neutral-800 p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0">
                  {TABS.map(([id, label, Icon]) => (
                    <button key={id} onClick={() => setActiveTab(id)} className={tabButtonClass(activeTab === id)}>
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => setActiveTab('backup')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left mt-auto ${
                      activeTab === 'backup' ? 'bg-neutral-800 text-white border border-neutral-700' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Backup &amp; Reset</span>
                  </button>
                </div>

                {/* Main Content Form Area. Every tab stays mounted and the inactive ones are only hidden, so what
                    was typed in a tab is still there when the admin comes back to it. */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-neutral-950">
                  <div hidden={activeTab !== 'theme'}>
                    <ThemeTab
                      key={versionOf(config.hero)}
                      theme={config.theme}
                      themePresets={themePresets}
                      hero={config.hero}
                      updateTheme={updateTheme}
                      onSaveHero={saver(updateHero)}
                    />
                  </div>

                  <div hidden={activeTab !== 'images'}>
                    <ImagesTab
                      images={config.images}
                      canUpload={canUpload}
                      updateImages={updateImages}
                      onDiscard={discardOldMedia}
                      goToTab={setActiveTab}
                    />
                  </div>

                  <div hidden={activeTab !== 'bio'}>
                    <BioTab key={config.bio} bio={config.bio} onSave={saver(updateBio)} />
                  </div>

                  <div hidden={activeTab !== 'texts'}>
                    <TextsTab key={versionOf(config.texts)} texts={config.texts} onSave={saver(updateTexts)} />
                  </div>

                  <div hidden={activeTab !== 'members'}>
                    <MembersTab
                      key={versionOf(config.members)}
                      members={config.members}
                      onSave={saver(updateMembers)}
                      canUpload={canUpload}
                      onDiscard={discardOldMedia}
                    />
                  </div>

                  <div hidden={activeTab !== 'gigs'}>
                    <GigsTab key={versionOf(config.gigs)} gigs={config.gigs} onSave={saver(updateGigs)} />
                  </div>

                  <div hidden={activeTab !== 'rsvps'}>
                    <InboxTab kind="rsvps" active={activeTab === 'rsvps'} usesSupabaseLogin={usesSupabaseLogin} />
                  </div>

                  <div hidden={activeTab !== 'bookings'}>
                    <InboxTab kind="bookings" active={activeTab === 'bookings'} usesSupabaseLogin={usesSupabaseLogin} />
                  </div>

                  <div hidden={activeTab !== 'merch'}>
                    <MerchTab
                      key={versionOf(config.merch)}
                      merch={config.merch}
                      onSave={saver(updateMerch)}
                      canUpload={canUpload}
                      onDiscard={discardOldMedia}
                    />
                  </div>

                  <div hidden={activeTab !== 'singles'}>
                    <SinglesTab
                      key={versionOf(config.singles)}
                      singles={config.singles}
                      onSave={saver(updateSingles)}
                      canUpload={canUpload}
                      onDiscard={discardOldMedia}
                    />
                  </div>

                  <div hidden={activeTab !== 'contact'}>
                    <ContactTab key={versionOf(config.contact)} contact={config.contact} onSave={saver(updateContact)} />
                  </div>

                  <div hidden={activeTab !== 'backup'}>
                    <BackupTab
                      config={config}
                      importConfig={importConfig}
                      resetToDefaults={resetToDefaults}
                      notify={notifySaved}
                    />
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
