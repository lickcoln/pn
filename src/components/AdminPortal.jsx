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
  Save,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Sliders,
  Sparkles,
  Flame,
  Inbox,
  Cloud,
  CloudOff,
  LoaderCircle,
  RefreshCw,
  Images
} from 'lucide-react'
import { useBandData } from '../context/BandDataContext'
import { listBookingInquiries, listTicketRsvps, deleteMedia } from '../lib/supabase'
import { BAND_MEMBERS, SINGLES_DISCOGRAPHY, MERCH_ITEMS, IMAGE_SLOTS } from '../data/bandData'
import MediaField from './MediaField'

// The shipped default of one field of a list item (so "Reset" can bring it back); '' for items the admin added
const defaultOf = (defaults, id, field) => defaults.find((item) => item.id === id)?.[field] || ''

export default function AdminPortal() {
  const {
    config,
    currentTheme,
    themePresets,
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
    getConfig,
    remoteStatus,
    remoteReason,
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

  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Temporary edit states
  const [heroForm, setHeroForm] = useState(config.hero)
  const [bioText, setBioText] = useState(config.bio)
  const [membersList, setMembersList] = useState(config.members)
  const [gigsList, setGigsList] = useState(config.gigs)
  const [merchList, setMerchList] = useState(config.merch)
  const [singlesList, setSinglesList] = useState(config.singles)
  const [contactForm, setContactForm] = useState(config.contact)
  const [saveNotification, setSaveNotification] = useState('')

  // Sub-forms for adding new items
  const [newGig, setNewGig] = useState({
    title: '',
    date: '',
    time: '19:00 WIB',
    venue: '',
    city: '',
    category: 'Club Gig',
    status: 'Tickets Available',
    price: 'IDR 50,000',
    description: '',
    mapsUrl: ''
  })
  const [showAddGig, setShowAddGig] = useState(false)

  const [newMerch, setNewMerch] = useState({
    name: '',
    price: 150000,
    priceFormatted: 'IDR 150,000',
    category: 'Apparel',
    sizes: 'S, M, L, XL',
    stock: 'In Stock',
    description: '',
    image: '/logo.png'
  })
  const [showAddMerch, setShowAddMerch] = useState(false)

  // Fan RSVPs and booking inquiries: read from Supabase for a Supabase admin, otherwise from
  // the localStorage fallback of this browser
  const [rsvpsList, setRsvpsList] = useState([])
  const [bookingsList, setBookingsList] = useState([])
  const [inboxError, setInboxError] = useState('')

  // Keep local forms in sync when config updates
  useEffect(() => {
    setHeroForm(config.hero)
    setBioText(config.bio)
    setMembersList(config.members)
    setGigsList(config.gigs)
    setMerchList(config.merch)
    setSinglesList(config.singles)
    setContactForm(config.contact)
  }, [config])

  // Keyboard shortcut Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        if (isAdmin) {
          setShowDashboard(prev => !prev)
        } else {
          setShowLoginModal(true)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAdmin])

  // Load RSVPs and booking inquiries
  const loadSubmissions = async (fetchRemote, localKey, setList) => {
    setInboxError('')
    if (usesSupabaseLogin) {
      const result = await fetchRemote()
      setList(result.data)
      if (!result.success) setInboxError(result.error)
      return
    }
    try {
      setList(JSON.parse(localStorage.getItem(localKey) || '[]'))
    } catch {
      setList([])
    }
  }

  const loadRsvps = () => loadSubmissions(listTicketRsvps, 'pn_rsvps', setRsvpsList)
  const loadBookings = () => loadSubmissions(listBookingInquiries, 'pn_bookings', setBookingsList)

  useEffect(() => {
    if (activeTab === 'rsvps') {
      loadRsvps()
    }
    if (activeTab === 'bookings') {
      loadBookings()
    }
  }, [activeTab])

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

  // Save Handlers
  const handleSaveHeroAndTheme = (e) => {
    e.preventDefault()
    updateHero(heroForm)
    notifySaved('Hero headline & theme updated!')
  }

  const handleSaveBio = (e) => {
    e.preventDefault()
    updateBio(bioText)
    notifySaved('Band profile & bio updated!')
  }

  const handleSaveMembers = (e) => {
    e.preventDefault()
    updateMembers(membersList)
    notifySaved('Band member details updated!')
  }

  const handleMemberChange = (index, field, value) => {
    const updated = [...membersList]
    updated[index] = { ...updated[index], [field]: value }
    setMembersList(updated)
  }

  // Uploaded photos and songs are on the server already, so these save the form right away
  const handleMemberPhoto = (id, url) => {
    const updated = membersList.map((m) => (m.id === id ? { ...m, image: url } : m))
    setMembersList(updated)
    updateMembers(updated)
  }

  const handleMerchImage = (id, url) => {
    const updated = merchList.map((m) => (m.id === id ? { ...m, image: url } : m))
    setMerchList(updated)
    updateMerch(updated)
  }

  const handleSingleMedia = (index, patch) => {
    const updated = singlesList.map((s, i) => (i === index ? { ...s, ...patch } : s))
    setSinglesList(updated)
    updateSingles(updated)
  }

  // Gigs handlers
  const handleAddNewGig = (e) => {
    e.preventDefault()
    const gigToAdd = {
      ...newGig,
      id: `gig-${Date.now()}`
    }
    const updated = [gigToAdd, ...gigsList]
    setGigsList(updated)
    updateGigs(updated)
    setShowAddGig(false)
    setNewGig({
      title: '',
      date: '',
      time: '19:00 WIB',
      venue: '',
      city: '',
      category: 'Club Gig',
      status: 'Tickets Available',
      price: 'IDR 50,000',
      description: '',
      mapsUrl: ''
    })
    notifySaved('New gig added to the schedule!')
  }

  const handleDeleteGig = (id) => {
    if (window.confirm('Are you sure you want to delete this gig?')) {
      const updated = gigsList.filter(g => g.id !== id)
      setGigsList(updated)
      updateGigs(updated)
      notifySaved('Gig deleted!')
    }
  }

  // Merch handlers
  const handleAddNewMerch = (e) => {
    e.preventDefault()
    const merchToAdd = {
      ...newMerch,
      id: `merch-${Date.now()}`,
      sizes: newMerch.sizes.split(',').map(s => s.trim()).filter(Boolean)
    }
    const updated = [merchToAdd, ...merchList]
    setMerchList(updated)
    updateMerch(updated)
    setShowAddMerch(false)
    setNewMerch({
      name: '',
      price: 150000,
      priceFormatted: 'IDR 150,000',
      category: 'Apparel',
      sizes: 'S, M, L, XL',
      stock: 'In Stock',
      description: '',
      image: '/logo.png'
    })
    notifySaved('New merchandise product added!')
  }

  const handleDeleteMerch = (id) => {
    if (window.confirm('Are you sure you want to delete this merchandise?')) {
      const updated = merchList.filter(m => m.id !== id)
      setMerchList(updated)
      updateMerch(updated)
      notifySaved('Merchandise deleted!')
    }
  }

  // Singles handlers
  const handleSingleChange = (index, field, value) => {
    const updated = [...singlesList]
    updated[index] = { ...updated[index], [field]: value }
    setSinglesList(updated)
  }

  const handleSaveSingles = (e) => {
    e.preventDefault()
    updateSingles(singlesList)
    notifySaved('Discography & songs updated!')
  }

  // Contact handlers
  const handleSaveContact = (e) => {
    e.preventDefault()
    updateContact(contactForm)
    notifySaved('Contact details & social links updated!')
  }

  // Export / Import
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `paranoid_noise_backup_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleImportJson = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = importConfig(event.target.result)
      if (result.success) {
        notifySaved('Configuration imported!')
      } else {
        alert('Could not import the file: ' + result.error)
      }
    }
    reader.readAsText(file)
  }

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to restore all content, images and the theme to the original Paranoid Noise defaults? With the shared server mode this also removes the content published for every visitor.')) {
      resetToDefaults()
      notifySaved('Content & theme restored to the defaults!')
    }
  }

  return (
    <>
      {/* 1. Subtle & Hidden Access Button in Bottom-Right Corner */}
      <div className="fixed bottom-[4.75rem] lg:bottom-3 right-3 z-40 flex items-center gap-2">
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
          className={`p-2 rounded-full border transition-all duration-300 cursor-pointer ${
            isAdmin
              ? 'bg-neutral-900 border-red-600 text-red-400 opacity-90 hover:opacity-100 shadow-md shadow-red-950/50'
              : 'bg-black/40 border-neutral-800 text-neutral-600 hover:text-neutral-300 opacity-30 hover:opacity-90'
          }`}
          title={isAdmin ? 'Admin mode is on (click to open the panel)' : 'Hidden administrator access (PN)'}
          aria-label="Admin access"
        >
          {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Admin Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-950 border-2 border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl text-left"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
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
                  <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                    {usesSupabaseLogin ? 'Email' : 'Username'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={usesSupabaseLogin ? 'email' : 'text'}
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={usesSupabaseLogin ? 'Enter the admin email' : 'Enter your username'}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
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
        )}
      </AnimatePresence>

      {/* 3. Admin CMS Control Panel (Full Dashboard Modal) */}
      <AnimatePresence>
        {showDashboard && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-lg">
            <motion.div
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
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title="Close the panel & view the website"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notification Banner */}
              {saveNotification && (
                <div className="bg-green-950/80 border-b border-green-800 px-6 py-2.5 text-xs font-tech text-green-300 flex items-center justify-between animate-fadeIn shrink-0">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <strong>Success:</strong> {saveNotification}
                  </span>
                  <button onClick={() => setSaveNotification('')} className="text-green-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Where edits go: shared with every visitor (Supabase) or this browser only */}
              {usesSupabaseLogin ? (
                <div className={`border-b px-6 py-2 text-xs font-tech flex items-center justify-between gap-3 shrink-0 ${
                  syncState.status === 'error'
                    ? 'bg-red-950/70 border-red-900 text-red-200'
                    : syncState.status === 'saved'
                      ? 'bg-green-950/50 border-green-900 text-green-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                }`}>
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
                  <button
                    onClick={() => setActiveTab('theme')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'theme' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span>Theme &amp; Look</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('images')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'images' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Images className="w-4 h-4" />
                    <span>Images &amp; Backgrounds</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bio')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'bio' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Profile &amp; Band Bio</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('members')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'members' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Band Members</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('gigs')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'gigs' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Gigs &amp; Tour Schedule</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('rsvps')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'rsvps' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Ticket RSVPs</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'bookings' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span>Booking Requests</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('merch')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'merch' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Merchandise</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('singles')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'singles' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Disc className="w-4 h-4" />
                    <span>Discography</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'contact' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact &amp; Social</span>
                  </button>

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

                {/* Main Content Form Area */}
                <div className="flex-1 p-6 overflow-y-auto bg-neutral-950">
                  
                  {/* TAB 1: THEME & TEMPLATE */}
                  {activeTab === 'theme' && (
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
                            const isSelected = config.theme.preset === preset.id
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
                            <label className="block text-[11px] font-tech text-neutral-400 mb-1">
                              Background Noise Intensity
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={config.theme.noiseOpacity}
                              onChange={(e) => updateTheme({ noiseOpacity: parseFloat(e.target.value) })}
                              className="w-full accent-red-600"
                            />
                            <span className="text-[10px] font-mono text-neutral-400">
                              {Math.round(config.theme.noiseOpacity * 100)}%
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-tech text-neutral-400 mb-1">
                              Glitch Animation Intensity
                            </label>
                            <select
                              value={config.theme.glitchIntensity}
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
                      <form onSubmit={handleSaveHeroAndTheme} className="space-y-4">
                        <span className="text-xs font-tech font-bold uppercase text-neutral-300 block">
                          Hero Banner Headline &amp; Tagline:
                        </span>

                        <div>
                          <label className="block text-[11px] font-tech text-neutral-400 mb-1">
                            Hero Main Title
                          </label>
                          <input
                            type="text"
                            value={heroForm.title}
                            onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 text-white text-xs font-tech"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-tech text-neutral-400 mb-1">
                            Rock Tagline
                          </label>
                          <input
                            type="text"
                            value={heroForm.tagline}
                            onChange={(e) => setHeroForm({ ...heroForm, tagline: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 text-white text-xs font-tech"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-tech text-neutral-400 mb-1">
                            Scene Badge Label
                          </label>
                          <input
                            type="text"
                            value={heroForm.sceneBadge}
                            onChange={(e) => setHeroForm({ ...heroForm, sceneBadge: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 text-white text-xs font-tech"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                        >
                          <Save className="w-4 h-4" /> Save Theme &amp; Hero Settings
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 1b: IMAGES & BACKGROUNDS */}
                  {activeTab === 'images' && (
                    <div className="space-y-8 max-w-4xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          IMAGES &amp; BACKGROUNDS
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Replace any photo on the website, including the logo and the background images. Pick a photo
                          from your device and it goes live for every visitor right away. Large photos are shrunk
                          automatically before they are uploaded.
                        </p>
                      </div>

                      {!canUpload && (
                        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-xs font-tech text-amber-200 flex items-start gap-2">
                          <CloudOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            Uploading needs the shared server mode and the Supabase admin sign-in (see supabase-admin.sql and
                            supabase-media.sql). Until then you can still point an image to a web link with "Use a link".
                          </span>
                        </div>
                      )}

                      {['Logo', 'Backgrounds', 'Photos', 'Downloads'].map((group) => (
                        <div key={group} className="space-y-3">
                          <h5 className="font-bebas text-2xl text-white tracking-wider border-b border-neutral-800 pb-1">
                            {group.toUpperCase()}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {IMAGE_SLOTS.filter((slot) => slot.group === group).map((slot) => (
                              <MediaField
                                key={slot.key}
                                label={slot.label}
                                hint={slot.where}
                                folder={`images/${slot.key}`}
                                value={config.images[slot.key]}
                                fallback={slot.fallback}
                                maxEdge={slot.maxEdge}
                                canUpload={canUpload}
                                onChange={(url) => updateImages({ [slot.key]: url })}
                                onDiscard={discardOldMedia}
                              />
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs font-tech text-neutral-400 space-y-2">
                        <p>
                          <strong className="text-neutral-200">More photos live in their own tabs:</strong> each band member's
                          photo, the cover art and MP3 of every single, and the product photos of the merchandise.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ['members', 'Member photos'],
                            ['singles', 'Cover art & songs'],
                            ['merch', 'Merchandise photos']
                          ].map(([tab, text]) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setActiveTab(tab)}
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold"
                            >
                              {text}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BIO & STORY */}
                  {activeTab === 'bio' && (
                    <form onSubmit={handleSaveBio} className="space-y-6 max-w-3xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          EDIT BAND PROFILE &amp; STORY
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Edit the band story shown in the "ABOUT PARANOID NOISE" section.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-tech font-bold uppercase text-neutral-300 mb-1.5">
                          Official Band Profile Text:
                        </label>
                        <textarea
                          rows={10}
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 text-white text-xs font-tech leading-relaxed resize-y"
                        />
                        <div className="flex justify-between text-[11px] font-tech text-neutral-500 mt-1">
                          <span>{bioText.length} characters</span>
                          <button
                            type="button"
                            onClick={() => setBioText(BAND_BIO)}
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            Reset to the Original Text
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                      >
                        <Save className="w-4 h-4" /> Save Profile Changes
                      </button>
                    </form>
                  )}

                  {/* TAB 3: MEMBERS */}
                  {activeTab === 'members' && (
                    <form onSubmit={handleSaveMembers} className="space-y-6 max-w-4xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          EDIT BAND MEMBER INFORMATION
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Edit each member's name, role, gear, description, and photo.
                        </p>
                      </div>

                      <div className="space-y-6">
                        {membersList.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4"
                          >
                            <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                              <img src={m.image} alt={m.name} className="w-12 h-12 rounded-lg object-cover border border-neutral-700" />
                              <div>
                                <h5 className="font-bebas text-2xl text-white tracking-wider leading-none">
                                  {m.name} &bull; <span className="text-red-500">{m.role}</span>
                                </h5>
                                <span className="text-[11px] font-tech text-neutral-400">ID: {m.id}</span>
                              </div>
                            </div>

                            <MediaField
                              label="Member photo"
                              hint="Shown on the member card. Uploading saves this form."
                              folder={`images/members/${m.id}`}
                              value={m.image}
                              fallback={defaultOf(BAND_MEMBERS, m.id, 'image')}
                              maxEdge={1200}
                              compact
                              canUpload={canUpload}
                              onChange={(url) => handleMemberPhoto(m.id, url)}
                              onDiscard={discardOldMedia}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-tech font-semibold text-neutral-300 mb-1">
                                  Member Name
                                </label>
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-tech font-semibold text-neutral-300 mb-1">
                                  Role &amp; Instrument
                                </label>
                                <input
                                  type="text"
                                  value={m.role}
                                  onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech font-semibold text-neutral-300 mb-1">
                                Gear &amp; Weaponry (instruments used)
                              </label>
                              <input
                                type="text"
                                value={m.gear}
                                onChange={(e) => handleMemberChange(idx, 'gear', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech font-semibold text-neutral-300 mb-1">
                                Musical Character Description
                              </label>
                              <textarea
                                rows={2}
                                value={m.description}
                                onChange={(e) => handleMemberChange(idx, 'description', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech font-semibold text-neutral-300 mb-1">
                                Quote
                              </label>
                              <input
                                type="text"
                                value={m.quote}
                                onChange={(e) => handleMemberChange(idx, 'quote', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                      >
                        <Save className="w-4 h-4" /> Save Member Details
                      </button>
                    </form>
                  )}

                  {/* TAB 4: GIGS & TOUR */}
                  {activeTab === 'gigs' && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bebas text-3xl text-white tracking-wide">
                            GIGS &amp; TOUR SCHEDULE MANAGEMENT
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Add or delete Paranoid Noise live show dates.
                          </p>
                        </div>

                        <button
                          onClick={() => setShowAddGig(!showAddGig)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{showAddGig ? 'Cancel' : 'Add Gig'}</span>
                        </button>
                      </div>

                      {/* Add Gig Form */}
                      {showAddGig && (
                        <form onSubmit={handleAddNewGig} className="p-5 rounded-2xl bg-neutral-900 border border-red-700/80 space-y-4">
                          <h5 className="font-bebas text-2xl text-white tracking-wide">
                            ADD A NEW GIG
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Event Name *</label>
                              <input
                                type="text"
                                required
                                value={newGig.title}
                                onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                                placeholder="e.g. Bandung Rockfest 2026"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Date (e.g. 15 NOVEMBER 2026) *</label>
                              <input
                                type="text"
                                required
                                value={newGig.date}
                                onChange={(e) => setNewGig({ ...newGig, date: e.target.value })}
                                placeholder="DAY MONTH YEAR"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Venue / Location *</label>
                              <input
                                type="text"
                                required
                                value={newGig.venue}
                                onChange={(e) => setNewGig({ ...newGig, venue: e.target.value })}
                                placeholder="Venue name"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">City *</label>
                              <input
                                type="text"
                                required
                                value={newGig.city}
                                onChange={(e) => setNewGig({ ...newGig, city: e.target.value })}
                                placeholder="Jakarta / Bandung"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Ticket Price</label>
                              <input
                                type="text"
                                value={newGig.price}
                                onChange={(e) => setNewGig({ ...newGig, price: e.target.value })}
                                placeholder="IDR 50,000 / Free Entry"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Ticket Status</label>
                              <input
                                type="text"
                                value={newGig.status}
                                onChange={(e) => setNewGig({ ...newGig, status: e.target.value })}
                                placeholder="Tickets Available / Presale 1 / Sold Out"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Google Maps Link (Optional)</label>
                              <input
                                type="url"
                                value={newGig.mapsUrl}
                                onChange={(e) => setNewGig({ ...newGig, mapsUrl: e.target.value })}
                                placeholder="https://maps.google.com/..."
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-tech text-neutral-300 mb-1">Short Description</label>
                            <input
                              type="text"
                              value={newGig.description}
                              onChange={(e) => setNewGig({ ...newGig, description: e.target.value })}
                              placeholder="A short note about the gig..."
                              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                          >
                            <Plus className="w-4 h-4" /> Save &amp; Publish Gig
                          </button>
                        </form>
                      )}

                      {/* Gigs List */}
                      <div className="space-y-3">
                        {gigsList.map((g) => (
                          <div
                            key={g.id}
                            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-[10px] font-tech font-bold text-red-400">
                                  {g.status}
                                </span>
                                <span className="text-xs font-mono text-neutral-400">{g.date} ({g.price})</span>
                              </div>
                              <h5 className="font-bebas text-2xl text-white tracking-wide">{g.title}</h5>
                              <span className="text-xs font-tech text-neutral-400">
                                {g.venue}, {g.city}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteGig(g.id)}
                              className="p-2 rounded-lg bg-neutral-800 text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
                              title="Delete gig"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: RSVPs LIST */}
                  {activeTab === 'rsvps' && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bebas text-3xl text-white tracking-wide">
                            TICKET RESERVATIONS FROM FANS
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Fans who reserved tickets / RSVP'd through the website.
                          </p>
                        </div>
                        <button
                          onClick={loadRsvps}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-tech text-neutral-200"
                        >
                          Refresh Data
                        </button>
                      </div>

                      {inboxError && (
                        <div className="p-3 rounded-xl bg-red-950/70 border border-red-700/80 text-xs font-tech text-red-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>Could not load the data from the server: {inboxError}</span>
                        </div>
                      )}

                      {rsvpsList.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500 font-tech">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No ticket reservations from visitors yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rsvpsList.map((rsvp, idx) => (
                            <div key={rsvp.id ?? idx} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-tech space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">{rsvp.fan_name}</span>
                                <span className="text-red-400 font-bold">{rsvp.ticket_count} {rsvp.ticket_count === 1 ? 'Ticket' : 'Tickets'}</span>
                              </div>
                              <div className="text-neutral-400">
                                Event: <strong className="text-neutral-200">{rsvp.event_title}</strong>
                              </div>
                              <div className="text-neutral-400 flex flex-wrap gap-4 pt-1">
                                <span>WhatsApp: <strong>{rsvp.fan_phone}</strong></span>
                                <span>Email: <strong>{rsvp.fan_email || '-'}</strong></span>
                                <span>Date: {new Date(rsvp.created_at).toLocaleString('en-GB')}</span>
                              </div>
                              {rsvp.notes && (
                                <div className="text-neutral-500 italic pt-1">
                                  Notes: "{rsvp.notes}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5b: BOOKING INQUIRIES */}
                  {activeTab === 'bookings' && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bebas text-3xl text-white tracking-wide">
                            BOOKING REQUESTS FROM PROMOTERS / ORGANIZERS
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Stage booking requests sent through the website form.
                          </p>
                        </div>
                        <button
                          onClick={loadBookings}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-tech text-neutral-200"
                        >
                          Refresh Data
                        </button>
                      </div>

                      {inboxError && (
                        <div className="p-3 rounded-xl bg-red-950/70 border border-red-700/80 text-xs font-tech text-red-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>Could not load the data from the server: {inboxError}</span>
                        </div>
                      )}

                      {bookingsList.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500 font-tech">
                          <Inbox className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No booking requests from promoters / organizers yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {bookingsList.map((booking, idx) => (
                            <div key={booking.id ?? idx} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-tech space-y-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-white text-sm">{booking.event_name}</span>
                                <span className="text-red-400 font-bold shrink-0">{booking.event_date}</span>
                              </div>
                              <div className="text-neutral-400">
                                Organizer: <strong className="text-neutral-200">{booking.organizer_name}</strong>
                                {' '}&bull; {booking.city}{booking.venue ? `, ${booking.venue}` : ''}
                              </div>
                              <div className="text-neutral-400 flex flex-wrap gap-4 pt-1">
                                <span>WhatsApp: <strong>{booking.phone}</strong></span>
                                <span>Email: <strong>{booking.email}</strong></span>
                                {booking.event_type && <span>Type: {booking.event_type}</span>}
                                {booking.budget_estimate && <span>Budget: {booking.budget_estimate}</span>}
                                <span>Date: {new Date(booking.created_at).toLocaleString('en-GB')}</span>
                              </div>
                              {booking.message && (
                                <div className="text-neutral-500 italic pt-1">
                                  Message: "{booking.message}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: MERCHANDISE */}
                  {activeTab === 'merch' && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bebas text-3xl text-white tracking-wide">
                            OFFICIAL MERCHANDISE MANAGEMENT
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Manage the product catalog, prices, stock, and descriptions of the Paranoid Noise merchandise.
                          </p>
                        </div>

                        <button
                          onClick={() => setShowAddMerch(!showAddMerch)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{showAddMerch ? 'Cancel' : 'Add Merchandise'}</span>
                        </button>
                      </div>

                      {/* Add Merch Form */}
                      {showAddMerch && (
                        <form onSubmit={handleAddNewMerch} className="p-5 rounded-2xl bg-neutral-900 border border-red-700/80 space-y-4">
                          <h5 className="font-bebas text-2xl text-white tracking-wide">
                            ADD A NEW MERCHANDISE PRODUCT
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Product Name *</label>
                              <input
                                type="text"
                                required
                                value={newMerch.name}
                                onChange={(e) => setNewMerch({ ...newMerch, name: e.target.value })}
                                placeholder="e.g. PN Grunge Skull T-Shirt"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Price (IDR, numbers only) *</label>
                              <input
                                type="number"
                                required
                                value={newMerch.price}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0
                                  setNewMerch({
                                    ...newMerch,
                                    price: val,
                                    priceFormatted: `IDR ${val.toLocaleString('en-US')}`
                                  })
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Category</label>
                              <input
                                type="text"
                                value={newMerch.category}
                                onChange={(e) => setNewMerch({ ...newMerch, category: e.target.value })}
                                placeholder="Apparel / Accessories / Audio"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Size Options (comma separated)</label>
                              <input
                                type="text"
                                value={newMerch.sizes}
                                onChange={(e) => setNewMerch({ ...newMerch, sizes: e.target.value })}
                                placeholder="S, M, L, XL, XXL"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Stock Status</label>
                              <input
                                type="text"
                                value={newMerch.stock}
                                onChange={(e) => setNewMerch({ ...newMerch, stock: e.target.value })}
                                placeholder="In Stock / Only 10 Left"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-tech text-neutral-300 mb-1">Product Description</label>
                            <textarea
                              rows={2}
                              value={newMerch.description}
                              onChange={(e) => setNewMerch({ ...newMerch, description: e.target.value })}
                              placeholder="Fabric, printing, and other details..."
                              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white resize-none"
                            />
                          </div>

                          <MediaField
                            label="Product photo"
                            hint="Shown on the product card and in the cart."
                            folder="images/merch"
                            value={newMerch.image}
                            maxEdge={1200}
                            compact
                            canUpload={canUpload}
                            onChange={(url) => setNewMerch({ ...newMerch, image: url })}
                            onDiscard={discardOldMedia}
                          />

                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                          >
                            <Plus className="w-4 h-4" /> Save Merchandise Product
                          </button>
                        </form>
                      )}

                      {/* Merch List */}
                      <div className="space-y-3">
                        {merchList.map((m) => (
                          <div key={m.id} className="space-y-2">
                          <div
                            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <img src={m.image} alt={m.name} className="w-12 h-12 object-contain bg-black rounded p-1 border border-neutral-800" />
                              <div>
                                <h5 className="font-bebas text-2xl text-white tracking-wide leading-none">{m.name}</h5>
                                <span className="text-xs font-tech text-red-400 font-bold">{m.priceFormatted}</span>
                                <span className="text-[11px] font-tech text-neutral-400 ml-2">({m.stock})</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteMerch(m.id)}
                              className="p-2 rounded-lg bg-neutral-800 text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
                              title="Delete merchandise"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <MediaField
                            label="Product photo"
                            hint="Uploading saves this list."
                            folder="images/merch"
                            value={m.image}
                            fallback={defaultOf(MERCH_ITEMS, m.id, 'image')}
                            maxEdge={1200}
                            compact
                            canUpload={canUpload}
                            onChange={(url) => handleMerchImage(m.id, url)}
                            onDiscard={discardOldMedia}
                          />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 7: SINGLES */}
                  {activeTab === 'singles' && (
                    <form onSubmit={handleSaveSingles} className="space-y-6 max-w-4xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          EDIT THE OFFICIAL DISCOGRAPHY
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Edit titles, release dates, descriptions, streaming links (Spotify, YouTube, SoundCloud), cover art, and the MP3 of each single.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {singlesList.map((s, idx) => (
                          <div key={s.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bebas text-2xl text-white tracking-wide">
                                #{idx + 1}. {s.title}
                              </h5>
                              <span className="text-xs font-mono text-neutral-400">{s.releaseDate}</span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              <MediaField
                                label="Cover art"
                                hint="Uploading saves this form."
                                folder={`images/covers/${s.id}`}
                                value={s.coverArt}
                                fallback={defaultOf(SINGLES_DISCOGRAPHY, s.id, 'coverArt')}
                                maxEdge={1200}
                                compact
                                canUpload={canUpload}
                                onChange={(url) => handleSingleMedia(idx, { coverArt: url })}
                                onDiscard={discardOldMedia}
                              />
                              <MediaField
                                label="Song (MP3)"
                                hint="Visitors play this file on the website, up to 25 MB."
                                kind="audio"
                                folder={`songs/${s.id}`}
                                value={s.audioUrl || ''}
                                fileName={s.audioName}
                                canUpload={canUpload}
                                onChange={(url, meta) => handleSingleMedia(idx, { audioUrl: url, audioName: meta?.name || '' })}
                                onDiscard={discardOldMedia}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Song Title</label>
                                <input
                                  type="text"
                                  value={s.title}
                                  onChange={(e) => handleSingleChange(idx, 'title', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Release Date</label>
                                <input
                                  type="text"
                                  value={s.releaseDate}
                                  onChange={(e) => handleSingleChange(idx, 'releaseDate', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Spotify Link</label>
                                <input
                                  type="url"
                                  value={s.spotifyUrl}
                                  onChange={(e) => handleSingleChange(idx, 'spotifyUrl', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">YouTube Link</label>
                                <input
                                  type="url"
                                  value={s.youtubeUrl}
                                  onChange={(e) => handleSingleChange(idx, 'youtubeUrl', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">SoundCloud Link</label>
                                <input
                                  type="url"
                                  value={s.soundcloudUrl}
                                  onChange={(e) => handleSingleChange(idx, 'soundcloudUrl', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-tech text-neutral-400 mb-1">Single Description</label>
                              <input
                                type="text"
                                value={s.description}
                                onChange={(e) => handleSingleChange(idx, 'description', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                      >
                        <Save className="w-4 h-4" /> Save Discography
                      </button>
                    </form>
                  )}

                  {/* TAB 8: CONTACT & SOCIAL */}
                  {activeTab === 'contact' && (
                    <form onSubmit={handleSaveContact} className="space-y-6 max-w-3xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          EDIT CONTACT DETAILS &amp; SOCIAL LINKS
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Update the booking WhatsApp number, email, and official Paranoid Noise account links.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">WhatsApp Number (as displayed)</label>
                          <input
                            type="text"
                            value={contactForm.whatsappDisplay}
                            onChange={(e) => setContactForm({ ...contactForm, whatsappDisplay: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">WhatsApp Number for the link (format: 628xxxxxxxxxx)</label>
                          <input
                            type="text"
                            value={contactForm.whatsappRaw}
                            onChange={(e) => setContactForm({ ...contactForm, whatsappRaw: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-tech text-neutral-300 mb-1">Official Band Email</label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">Instagram URL</label>
                          <input
                            type="url"
                            value={contactForm.instagram}
                            onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">Spotify URL</label>
                          <input
                            type="url"
                            value={contactForm.spotify}
                            onChange={(e) => setContactForm({ ...contactForm, spotify: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">YouTube URL</label>
                          <input
                            type="url"
                            value={contactForm.youtube}
                            onChange={(e) => setContactForm({ ...contactForm, youtube: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">SoundCloud URL</label>
                          <input
                            type="url"
                            value={contactForm.soundcloud}
                            onChange={(e) => setContactForm({ ...contactForm, soundcloud: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                      >
                        <Save className="w-4 h-4" /> Save Contact &amp; Social Links
                      </button>
                    </form>
                  )}

                  {/* TAB 9: BACKUP & RESET */}
                  {activeTab === 'backup' && (
                    <div className="space-y-6 max-w-3xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          BACKUP DATA &amp; RESET TO DEFAULT
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Export a backup copy of the website settings to a JSON file, or restore the original defaults.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                          <Download className="w-8 h-8 text-red-500" />
                          <h5 className="font-bebas text-2xl text-white tracking-wide">EXPORT JSON BACKUP</h5>
                          <p className="text-xs font-tech text-neutral-400">
                            Download the whole theme, bio, member, gig, and merch configuration as one JSON file.
                          </p>
                          <button
                            onClick={handleExportJson}
                            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download Backup File
                          </button>
                        </div>

                        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                          <Upload className="w-8 h-8 text-neutral-400" />
                          <h5 className="font-bebas text-2xl text-white tracking-wide">IMPORT JSON BACKUP</h5>
                          <p className="text-xs font-tech text-neutral-400">
                            Upload a JSON backup file to restore all website settings.
                          </p>
                          <label className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" /> Choose JSON File
                            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-red-950/40 border border-red-900/60 space-y-3">
                        <div className="flex items-center gap-2 text-red-400 font-tech font-bold text-xs uppercase">
                          <AlertTriangle className="w-4 h-4" /> Factory Reset
                        </div>
                        <p className="text-xs font-tech text-neutral-300">
                          Restores the profile text, singles, band members, event schedule, images, and color theme to the original Paranoid Noise defaults. With the shared server mode this removes the content published for every visitor.
                        </p>
                        <button
                          onClick={handleResetDefaults}
                          className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" /> Reset to Paranoid Noise Defaults
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
