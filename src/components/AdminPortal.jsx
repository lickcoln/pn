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
  RefreshCw
} from 'lucide-react'
import { useBandData } from '../context/BandDataContext'
import { listBookingInquiries, listTicketRsvps } from '../lib/supabase'

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
    resetToDefaults,
    importConfig,
    remoteStatus,
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
    ? 'Menghubungkan ke server...'
    : usesSupabaseLogin ? 'Akun admin Supabase' : null
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
    status: 'Tiket Tersedia',
    price: 'Rp 50.000',
    description: '',
    mapsUrl: ''
  })
  const [showAddGig, setShowAddGig] = useState(false)

  const [newMerch, setNewMerch] = useState({
    name: '',
    price: 150000,
    priceFormatted: 'Rp 150.000',
    category: 'Apparel',
    sizes: 'S, M, L, XL',
    stock: 'Tersedia',
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
      setLoginError('Username atau Password salah! (Cek kembali username: paranoidnoise & password: pn2026)')
    }
  }

  const handleLogout = () => {
    setLegacyAdmin(false)
    sessionStorage.removeItem('pn_admin_session')
    if (usesSupabaseLogin) adminLogout()
    setShowDashboard(false)
  }

  const notifySaved = (msg = 'Perubahan berhasil disimpan & diterapkan!') => {
    setSaveNotification(msg)
    setTimeout(() => setSaveNotification(''), 3000)
  }

  // Save Handlers
  const handleSaveHeroAndTheme = (e) => {
    e.preventDefault()
    updateHero(heroForm)
    notifySaved('Hero headline & tema berhasil diperbarui!')
  }

  const handleSaveBio = (e) => {
    e.preventDefault()
    updateBio(bioText)
    notifySaved('Profil & Bio band berhasil diperbarui!')
  }

  const handleSaveMembers = (e) => {
    e.preventDefault()
    updateMembers(membersList)
    notifySaved('Data personil band berhasil diperbarui!')
  }

  const handleMemberChange = (index, field, value) => {
    const updated = [...membersList]
    updated[index] = { ...updated[index], [field]: value }
    setMembersList(updated)
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
      status: 'Tiket Tersedia',
      price: 'Rp 50.000',
      description: '',
      mapsUrl: ''
    })
    notifySaved('Jadwal gig baru berhasil ditambahkan!')
  }

  const handleDeleteGig = (id) => {
    if (window.confirm('Yakin ingin menghapus jadwal gig ini?')) {
      const updated = gigsList.filter(g => g.id !== id)
      setGigsList(updated)
      updateGigs(updated)
      notifySaved('Jadwal gig berhasil dihapus!')
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
      priceFormatted: 'Rp 150.000',
      category: 'Apparel',
      sizes: 'S, M, L, XL',
      stock: 'Tersedia',
      description: '',
      image: '/logo.png'
    })
    notifySaved('Produk merchandise baru berhasil ditambahkan!')
  }

  const handleDeleteMerch = (id) => {
    if (window.confirm('Yakin ingin menghapus merchandise ini?')) {
      const updated = merchList.filter(m => m.id !== id)
      setMerchList(updated)
      updateMerch(updated)
      notifySaved('Merchandise berhasil dihapus!')
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
    notifySaved('Data diskografi & lagu berhasil diperbarui!')
  }

  // Contact handlers
  const handleSaveContact = (e) => {
    e.preventDefault()
    updateContact(contactForm)
    notifySaved('Kontak & link media sosial berhasil diperbarui!')
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
        notifySaved('Konfigurasi berhasil diimpor!')
      } else {
        alert('Gagal mengimpor file: ' + result.error)
      }
    }
    reader.readAsText(file)
  }

  const handleResetDefaults = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan semua data & tema ke pengaturan awal pabrik Paranoid Noise?')) {
      resetToDefaults()
      notifySaved('Data & tema telah dikembalikan ke default!')
    }
  }

  return (
    <>
      {/* 1. Subtle & Hidden Access Button in Bottom-Right Corner */}
      <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2">
        {isAdmin && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowDashboard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/90 border border-red-600 text-red-200 text-xs font-tech font-bold uppercase shadow-lg shadow-red-950/60 hover:bg-red-900 transition-all cursor-pointer"
            title="Buka Control Panel Administrator"
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
          title={isAdmin ? 'Admin Mode Aktif (Klik untuk Buka Panel)' : 'Akses Tersembunyi Administrator (PN)'}
          aria-label="Akses Admin"
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
                Masukkan kredensial administrator untuk mengelola konten, jadwal tour, merchandise, personil, dan tema website.
              </p>

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
                      placeholder={usesSupabaseLogin ? 'Masukkan email admin' : 'Masukkan username'}
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
                      placeholder="Masukkan password"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-tech text-neutral-500">
                    {loginHint ?? <>Akses: <code>paranoidnoise</code></>}
                  </span>
                  <button
                    type="submit"
                    disabled={remoteStatus === 'loading' || loggingIn}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/60"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{loggingIn ? 'Memeriksa...' : 'Masuk Administrator'}</span>
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
                      Login sebagai: <strong className="text-neutral-200">{usesSupabaseLogin ? adminUser?.email : 'paranoidnoise'}</strong> &bull; Ubah tampilan, informasi, dan tema live.
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
                    title="Tutup Panel & Lihat Website"
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
                    <strong>Sukses:</strong> {saveNotification}
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
                    {syncState.status === 'saving' && 'Menyimpan ke server...'}
                    {syncState.status === 'saved' && 'Tersimpan di server dan langsung terlihat oleh semua pengunjung.'}
                    {syncState.status === 'error' && `Gagal menyimpan ke server: ${syncState.error}`}
                    {syncState.status === 'idle' && 'Terhubung ke server: perubahan otomatis tersimpan dan terlihat oleh semua pengunjung.'}
                  </span>
                  {syncState.status === 'error' && (
                    <button
                      onClick={retryPublish}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-red-100 font-bold uppercase shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Coba lagi
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-b px-6 py-2 text-xs font-tech flex items-center gap-2 shrink-0 bg-amber-950/50 border-amber-900 text-amber-300">
                  <CloudOff className="w-4 h-4 shrink-0" />
                  Mode lokal: perubahan hanya tersimpan di browser ini dan tidak terlihat oleh pengunjung lain.
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
                    <span>Tema &amp; Tampilan</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bio')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'bio' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Profil &amp; Bio Band</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('members')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'members' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Personil Band</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('gigs')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'gigs' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Jadwal Gigs &amp; Tour</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('rsvps')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'rsvps' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Data Tiket RSVP</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'bookings' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span>Data Booking Gig</span>
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
                    <span>Diskografi Lagu</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-colors shrink-0 text-left ${
                      activeTab === 'contact' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Kontak &amp; Sosmed</span>
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
                          PENGATURAN TEMA &amp; TEMPLATE VISUAL
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Ubah skema warna aksen, intensitas noise grain grunge, dan gaya hero banner secara live.
                        </p>
                      </div>

                      {/* Theme Presets */}
                      <div className="space-y-3">
                        <label className="block text-xs font-tech font-bold uppercase text-neutral-300">
                          Pilih Preset Warna Aksen Rock:
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
                          Efek Grunge &amp; Distorsi:
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-tech text-neutral-400 mb-1">
                              Intensitas Noise Background
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
                              Intensitas Animasi Glitch
                            </label>
                            <select
                              value={config.theme.glitchIntensity}
                              onChange={(e) => updateTheme({ glitchIntensity: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-tech text-white"
                            >
                              <option value="off">Off (Mati)</option>
                              <option value="normal">Normal (Hover Only)</option>
                              <option value="extreme">Extreme (Full Rock Chaos)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Hero Banner Text */}
                      <form onSubmit={handleSaveHeroAndTheme} className="space-y-4">
                        <span className="text-xs font-tech font-bold uppercase text-neutral-300 block">
                          Headline &amp; Tagline Hero Banner:
                        </span>

                        <div>
                          <label className="block text-[11px] font-tech text-neutral-400 mb-1">
                            Judul Utama Hero
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
                            Tagline Rock
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
                          <Save className="w-4 h-4" /> Simpan Pengaturan Tema &amp; Hero
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 2: BIO & STORY */}
                  {activeTab === 'bio' && (
                    <form onSubmit={handleSaveBio} className="space-y-6 max-w-3xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          EDIT PROFIL &amp; KETERANGAN BAND
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Ubah deskripsi narasi profil band yang ditampilkan di bagian "ABOUT PARANOID NOISE".
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-tech font-bold uppercase text-neutral-300 mb-1.5">
                          Paragraf Profil Resmi Band:
                        </label>
                        <textarea
                          rows={10}
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 text-white text-xs font-tech leading-relaxed resize-y"
                        />
                        <div className="flex justify-between text-[11px] font-tech text-neutral-500 mt-1">
                          <span>{bioText.length} karakter</span>
                          <button
                            type="button"
                            onClick={() => setBioText(BAND_BIO)}
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            Reset ke Teks Asli
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                      >
                        <Save className="w-4 h-4" /> Simpan Perubahan Profil
                      </button>
                    </form>
                  )}

                  {/* TAB 3: MEMBERS */}
                  {activeTab === 'members' && (
                    <form onSubmit={handleSaveMembers} className="space-y-6 max-w-4xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          EDIT INFORMASI PERSONIL BAND
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Ubah nama, peran instrumen, gear weaponry, dan deskripsi personil (Arief, Ganjar, Kimao).
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-tech font-semibold text-neutral-300 mb-1">
                                  Nama Personil
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
                                  Peran &amp; Instrumen
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
                                Gear &amp; Weaponry (Instrumen yang dipakai)
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
                                Deskripsi Karakter Musik
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
                                Kutipan / Quotes
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
                        <Save className="w-4 h-4" /> Simpan Data Personil
                      </button>
                    </form>
                  )}

                  {/* TAB 4: GIGS & TOUR */}
                  {activeTab === 'gigs' && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bebas text-3xl text-white tracking-wide">
                            MANAJEMEN JADWAL GIGS &amp; TOUR
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Tambah, edit, atau hapus jadwal pertunjukan panggung Paranoid Noise.
                          </p>
                        </div>

                        <button
                          onClick={() => setShowAddGig(!showAddGig)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{showAddGig ? 'Batal Tambah' : 'Tambah Jadwal Gig'}</span>
                        </button>
                      </div>

                      {/* Add Gig Form */}
                      {showAddGig && (
                        <form onSubmit={handleAddNewGig} className="p-5 rounded-2xl bg-neutral-900 border border-red-700/80 space-y-4">
                          <h5 className="font-bebas text-2xl text-white tracking-wide">
                            TAMBAH JADWAL GIG BARU
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Nama Acara *</label>
                              <input
                                type="text"
                                required
                                value={newGig.title}
                                onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                                placeholder="Contoh: Bandung Rockfest 2026"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Tanggal (Contoh: 15 NOVEMBER 2026) *</label>
                              <input
                                type="text"
                                required
                                value={newGig.date}
                                onChange={(e) => setNewGig({ ...newGig, date: e.target.value })}
                                placeholder="TANGGAL BULAN TAHUN"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Venue / Tempat *</label>
                              <input
                                type="text"
                                required
                                value={newGig.venue}
                                onChange={(e) => setNewGig({ ...newGig, venue: e.target.value })}
                                placeholder="Nama venue"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Kota *</label>
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
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Harga Tiket</label>
                              <input
                                type="text"
                                value={newGig.price}
                                onChange={(e) => setNewGig({ ...newGig, price: e.target.value })}
                                placeholder="Rp 50.000 / Free Entry"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Status Tiket</label>
                              <input
                                type="text"
                                value={newGig.status}
                                onChange={(e) => setNewGig({ ...newGig, status: e.target.value })}
                                placeholder="Tiket Tersedia / Presale 1 / Sold Out"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Link Google Maps (Opsional)</label>
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
                            <label className="block text-[11px] font-tech text-neutral-300 mb-1">Deskripsi Singkat</label>
                            <input
                              type="text"
                              value={newGig.description}
                              onChange={(e) => setNewGig({ ...newGig, description: e.target.value })}
                              placeholder="Keterangan singkat tentang gig..."
                              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                          >
                            <Plus className="w-4 h-4" /> Simpan &amp; Tayangkan Jadwal Gig
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
                              title="Hapus Gig"
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
                            DATA RESERVASI TIKET DARI PENONTON
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Daftar penonton yang melakukan reservasi tiket / RSVP melalui website.
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
                          <span>Gagal memuat data dari server: {inboxError}</span>
                        </div>
                      )}

                      {rsvpsList.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500 font-tech">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Belum ada data reservasi tiket baru dari pengunjung.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rsvpsList.map((rsvp, idx) => (
                            <div key={rsvp.id ?? idx} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-tech space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">{rsvp.fan_name}</span>
                                <span className="text-red-400 font-bold">{rsvp.ticket_count} Tiket</span>
                              </div>
                              <div className="text-neutral-400">
                                Event: <strong className="text-neutral-200">{rsvp.event_title}</strong>
                              </div>
                              <div className="text-neutral-400 flex flex-wrap gap-4 pt-1">
                                <span>No. WA: <strong>{rsvp.fan_phone}</strong></span>
                                <span>Email: <strong>{rsvp.fan_email || '-'}</strong></span>
                                <span>Tgl: {new Date(rsvp.created_at).toLocaleString('id-ID')}</span>
                              </div>
                              {rsvp.notes && (
                                <div className="text-neutral-500 italic pt-1">
                                  Catatan: "{rsvp.notes}"
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
                            PENGAJUAN BOOKING DARI PROMOTOR / EO
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Pengajuan booking panggung yang masuk lewat formulir di website.
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
                          <span>Gagal memuat data dari server: {inboxError}</span>
                        </div>
                      )}

                      {bookingsList.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500 font-tech">
                          <Inbox className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Belum ada pengajuan booking dari promotor / EO.</p>
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
                                Penyelenggara: <strong className="text-neutral-200">{booking.organizer_name}</strong>
                                {' '}&bull; {booking.city}{booking.venue ? `, ${booking.venue}` : ''}
                              </div>
                              <div className="text-neutral-400 flex flex-wrap gap-4 pt-1">
                                <span>No. WA: <strong>{booking.phone}</strong></span>
                                <span>Email: <strong>{booking.email}</strong></span>
                                {booking.event_type && <span>Jenis: {booking.event_type}</span>}
                                {booking.budget_estimate && <span>Budget: {booking.budget_estimate}</span>}
                                <span>Tgl: {new Date(booking.created_at).toLocaleString('id-ID')}</span>
                              </div>
                              {booking.message && (
                                <div className="text-neutral-500 italic pt-1">
                                  Pesan: "{booking.message}"
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
                            MANAJEMEN OFFICIAL MERCHANDISE
                          </h4>
                          <p className="text-xs font-tech text-neutral-400">
                            Kelola katalog produk, harga, stok, dan deskripsi merchandise Paranoid Noise.
                          </p>
                        </div>

                        <button
                          onClick={() => setShowAddMerch(!showAddMerch)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{showAddMerch ? 'Batal Tambah' : 'Tambah Merchandise'}</span>
                        </button>
                      </div>

                      {/* Add Merch Form */}
                      {showAddMerch && (
                        <form onSubmit={handleAddNewMerch} className="p-5 rounded-2xl bg-neutral-900 border border-red-700/80 space-y-4">
                          <h5 className="font-bebas text-2xl text-white tracking-wide">
                            TAMBAH PRODUK MERCHANDISE BARU
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Nama Produk *</label>
                              <input
                                type="text"
                                required
                                value={newMerch.name}
                                onChange={(e) => setNewMerch({ ...newMerch, name: e.target.value })}
                                placeholder="Contoh: PN Grunge Skull T-Shirt"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Harga (Angka IDR) *</label>
                              <input
                                type="number"
                                required
                                value={newMerch.price}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0
                                  setNewMerch({
                                    ...newMerch,
                                    price: val,
                                    priceFormatted: `Rp ${val.toLocaleString('id-ID')}`
                                  })
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Kategori</label>
                              <input
                                type="text"
                                value={newMerch.category}
                                onChange={(e) => setNewMerch({ ...newMerch, category: e.target.value })}
                                placeholder="Apparel / Aksesoris / Audio"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Pilihan Ukuran (Pisahkan Koma)</label>
                              <input
                                type="text"
                                value={newMerch.sizes}
                                onChange={(e) => setNewMerch({ ...newMerch, sizes: e.target.value })}
                                placeholder="S, M, L, XL, XXL"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-tech text-neutral-300 mb-1">Status Stok</label>
                              <input
                                type="text"
                                value={newMerch.stock}
                                onChange={(e) => setNewMerch({ ...newMerch, stock: e.target.value })}
                                placeholder="Tersedia / Sisa 10 Pcs"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-tech text-neutral-300 mb-1">Deskripsi Produk</label>
                            <textarea
                              rows={2}
                              value={newMerch.description}
                              onChange={(e) => setNewMerch({ ...newMerch, description: e.target.value })}
                              placeholder="Keterangan bahan kain, sablon, dll..."
                              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                          >
                            <Plus className="w-4 h-4" /> Simpan Produk Merchandise
                          </button>
                        </form>
                      )}

                      {/* Merch List */}
                      <div className="space-y-3">
                        {merchList.map((m) => (
                          <div
                            key={m.id}
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
                              title="Hapus Merchandise"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                          EDIT DISKOGRAFI 7 SINGLES RESMI
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Ubah judul, tanggal rilis, deskripsi, dan link streaming (Spotify, YouTube, SoundCloud).
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Judul Lagu</label>
                                <input
                                  type="text"
                                  value={s.title}
                                  onChange={(e) => handleSingleChange(idx, 'title', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Tanggal Rilis</label>
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
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Link Spotify</label>
                                <input
                                  type="url"
                                  value={s.spotifyUrl}
                                  onChange={(e) => handleSingleChange(idx, 'spotifyUrl', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Link YouTube</label>
                                <input
                                  type="url"
                                  value={s.youtubeUrl}
                                  onChange={(e) => handleSingleChange(idx, 'youtubeUrl', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-tech text-neutral-400 mb-1">Link SoundCloud</label>
                                <input
                                  type="url"
                                  value={s.soundcloudUrl}
                                  onChange={(e) => handleSingleChange(idx, 'soundcloudUrl', e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-tech text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-tech text-neutral-400 mb-1">Deskripsi Single</label>
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
                        <Save className="w-4 h-4" /> Simpan Data Diskografi
                      </button>
                    </form>
                  )}

                  {/* TAB 8: CONTACT & SOCIAL */}
                  {activeTab === 'contact' && (
                    <form onSubmit={handleSaveContact} className="space-y-6 max-w-3xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          EDIT KONTAK &amp; LINK MEDIA SOSIAL
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Perbarui kontak WhatsApp booking, email, dan link akun resmi Paranoid Noise.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">Nomor WhatsApp Tampilan</label>
                          <input
                            type="text"
                            value={contactForm.whatsappDisplay}
                            onChange={(e) => setContactForm({ ...contactForm, whatsappDisplay: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">Nomor WhatsApp Raw (Format: 628xxxxxxxxxx)</label>
                          <input
                            type="text"
                            value={contactForm.whatsappRaw}
                            onChange={(e) => setContactForm({ ...contactForm, whatsappRaw: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-tech text-neutral-300 mb-1">Email Resmi Band</label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">URL Instagram</label>
                          <input
                            type="url"
                            value={contactForm.instagram}
                            onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">URL Spotify</label>
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
                          <label className="block text-xs font-tech text-neutral-300 mb-1">URL YouTube</label>
                          <input
                            type="url"
                            value={contactForm.youtube}
                            onChange={(e) => setContactForm({ ...contactForm, youtube: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-tech text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-tech text-neutral-300 mb-1">URL SoundCloud</label>
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
                        <Save className="w-4 h-4" /> Simpan Kontak &amp; Sosmed
                      </button>
                    </form>
                  )}

                  {/* TAB 9: BACKUP & RESET */}
                  {activeTab === 'backup' && (
                    <div className="space-y-6 max-w-3xl">
                      <div>
                        <h4 className="font-bebas text-3xl text-white tracking-wide">
                          BACKUP DATA &amp; RESET KE DEFAULT
                        </h4>
                        <p className="text-xs font-tech text-neutral-400">
                          Ekspor salinan cadangan konfigurasi website ke file JSON, atau pulihkan ke kondisi bawaan awal.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                          <Download className="w-8 h-8 text-red-500" />
                          <h5 className="font-bebas text-2xl text-white tracking-wide">EKSPOR BACKUP JSON</h5>
                          <p className="text-xs font-tech text-neutral-400">
                            Unduh seluruh konfigurasi tema, bio, personil, gigs, dan merch dalam satu file JSON.
                          </p>
                          <button
                            onClick={handleExportJson}
                            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Unduh File Backup
                          </button>
                        </div>

                        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                          <Upload className="w-8 h-8 text-neutral-400" />
                          <h5 className="font-bebas text-2xl text-white tracking-wide">IMPOR BACKUP JSON</h5>
                          <p className="text-xs font-tech text-neutral-400">
                            Unggah file JSON backup untuk memulihkan seluruh pengaturan website.
                          </p>
                          <label className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" /> Pilih File JSON
                            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-red-950/40 border border-red-900/60 space-y-3">
                        <div className="flex items-center gap-2 text-red-400 font-tech font-bold text-xs uppercase">
                          <AlertTriangle className="w-4 h-4" /> Reset Pabrik (Factory Reset)
                        </div>
                        <p className="text-xs font-tech text-neutral-300">
                          Mengembalikan seluruh teks profil, daftar single lagu, personil trio, jadwal event, dan tema warna ke pengaturan asli Paranoid Noise.
                        </p>
                        <button
                          onClick={handleResetDefaults}
                          className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" /> Reset ke Default Paranoid Noise
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
