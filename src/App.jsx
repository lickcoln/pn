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
import { audioEngine } from './utils/audioSynth'

export default function App() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pn_cart') || '[]')
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [distortionActive, setDistortionActive] = useState(true)
  const [activeTrackId, setActiveTrackId] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem('pn_cart', JSON.stringify(cart))
    } catch (e) {
      console.error(e)
    }
  }, [cart])

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
        const copy = [...prev]
        copy[existingIdx].quantity += 1
        return copy
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
    setActiveTrackId('mesin-waktu')
  }

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 relative selection:bg-red-700 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        distortionActive={distortionActive}
        onToggleDistortion={handleToggleDistortion}
      />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero Section */}
        <Hero onPlayFeaturedTrack={handlePlayFeaturedTrack} />

        {/* 2. Band Profile & Bio Section */}
        <BandProfile />

        {/* 3. Personnel / Members Section */}
        <Personnel />

        {/* 4. Discography & Interactive Stompbox Player */}
        <DiscographyPlayer
          activeTrackId={activeTrackId}
          onTrackSelect={(id) => setActiveTrackId(id)}
          distortionActive={distortionActive}
          onToggleDistortion={handleToggleDistortion}
        />

        {/* 5. Tour & Gigs Event Schedule */}
        <EventSchedule />

        {/* 6. Merchandise Store */}
        <MerchStore
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateCartQuantity={handleUpdateCartQuantity}
          onRemoveFromCart={handleRemoveFromCart}
          isCartOpen={isCartOpen}
          onCloseCart={() => setIsCartOpen(false)}
        />

        {/* 7. Contact & Booking Inquiry */}
        <ContactBooking />
      </main>

      {/* Footer */}
      <Footer />

    </div>
  )
}
