import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import BandProfile from './components/BandProfile'
import Personnel from './components/Personnel'
import DiscographyPlayer from './components/DiscographyPlayer'
import EventSchedule from './components/EventSchedule'
import MerchStore from './components/MerchStore'
import ContactBooking from './components/ContactBooking'
import Footer from './components/Footer'
import AdminPortal from './components/AdminPortal'
import MobileNav from './components/MobileNav'
import ErrorBoundary from './components/ErrorBoundary'
import { audioEngine } from './utils/audioSynth'
import { useBandData } from './context/BandDataContext'

// The cart lives in the visitor's browser, so read it defensively
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('pn_cart') || '[]')
    return Array.isArray(saved)
      ? saved.filter((item) => item && typeof item === 'object' && Number.isFinite(item.quantity) && Number.isFinite(item.price))
      : []
  } catch {
    return []
  }
}

// After the shop changes (a new price or photo, a product taken off sale) an older cart has to follow it,
// otherwise a WhatsApp order could carry yesterday's price
function reconcileCart(cart, merch) {
  const products = new Map(merch.map((product) => [product.id, product]))
  const merged = new Map()
  for (const entry of cart) {
    const product = products.get(entry.id)
    if (!product) continue
    const selectedSize = product.sizes.includes(entry.selectedSize) ? entry.selectedSize : product.sizes[0]
    const key = `${product.id}|${selectedSize}`
    const quantity = (merged.get(key)?.quantity || 0) + entry.quantity
    merged.set(key, { ...product, selectedSize, quantity })
  }
  return [...merged.values()]
}

export default function App() {
  const { config, remoteStatus } = useBandData()
  const [cart, setCart] = useState(loadCart)
  const [isCartOpen, setIsCartOpen] = useState(false)
  // The pedal starts bypassed, so real songs sound like the recording until a visitor stomps it on
  const [distortionActive, setDistortionActive] = useState(false)
  // Each press of the hero's play button is a new request object, so it works again after a pause
  const [playRequest, setPlayRequest] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem('pn_cart', JSON.stringify(cart))
    } catch (e) {
      console.error(e)
    }
  }, [cart])

  // Follow the catalog once it is known for sure (not while the shared content is still loading, and not when
  // the server could not be reached, because then the catalog on screen may be an older copy)
  useEffect(() => {
    if (remoteStatus === 'loading' || remoteStatus === 'unavailable') return
    setCart((prev) => {
      const next = reconcileCart(prev, config.merch)
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next
    })
  }, [config.merch, remoteStatus])

  const handleToggleDistortion = () => {
    const nextState = !distortionActive
    setDistortionActive(nextState)
    audioEngine.setDistortionEnabled(nextState)
  }

  const handleAddToCart = (item) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        i => i.id === item.id && i.selectedSize === item.selectedSize
      )
      if (existingIdx > -1) {
        return prev.map((entry, idx) => (idx === existingIdx ? { ...entry, quantity: entry.quantity + 1 } : entry))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const handleUpdateCartQuantity = (itemId, size, qty) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === itemId && item.selectedSize === size) {
          return { ...item, quantity: qty }
        }
        return item
      })
    )
  }

  const handleRemoveFromCart = (itemId, size) => {
    setCart(prev =>
      prev.filter(item => !(item.id === itemId && item.selectedSize === size))
    )
  }

  const handlePlayFeaturedTrack = () => {
    const target = document.querySelector('#discography')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
    if (config.singles[0]) setPlayRequest({ trackId: config.singles[0].id })
  }

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 relative selection:bg-red-700 selection:text-white pb-16 lg:pb-0">

      {/* Top Navbar */}
      <ErrorBoundary>
        <Navbar
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          distortionActive={distortionActive}
          onToggleDistortion={handleToggleDistortion}
        />
      </ErrorBoundary>

      {/* Main Content Sections: each one fails on its own, so one bad value cannot blank the page */}
      <main>
        {/* 1. Hero Section */}
        <ErrorBoundary>
          <Hero onPlayFeaturedTrack={handlePlayFeaturedTrack} />
        </ErrorBoundary>

        {/* 2. Band Profile & Bio Section */}
        <ErrorBoundary>
          <BandProfile />
        </ErrorBoundary>

        {/* 3. Personnel / Members Section */}
        <ErrorBoundary>
          <Personnel />
        </ErrorBoundary>

        {/* 4. Discography & Interactive Stompbox Player */}
        <ErrorBoundary>
          <DiscographyPlayer
            playRequest={playRequest}
            distortionActive={distortionActive}
            onToggleDistortion={handleToggleDistortion}
          />
        </ErrorBoundary>

        {/* 5. Tour & Gigs Event Schedule */}
        <ErrorBoundary>
          <EventSchedule />
        </ErrorBoundary>

        {/* 6. Merchandise Store */}
        <ErrorBoundary>
          <MerchStore
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            isCartOpen={isCartOpen}
            onCloseCart={() => setIsCartOpen(false)}
          />
        </ErrorBoundary>

        {/* 7. Contact & Booking Inquiry */}
        <ErrorBoundary>
          <ContactBooking />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <ErrorBoundary>
        <Footer />
      </ErrorBoundary>

      {/* Bottom tab bar for phones and tablets */}
      <MobileNav />

      {/* Hidden Admin Portal at bottom-right corner */}
      <ErrorBoundary>
        <AdminPortal />
      </ErrorBoundary>

    </div>
  )
}
