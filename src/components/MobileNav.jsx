import React, { useEffect, useState } from 'react'
import { Home, Info, Users, Music, Calendar, ShoppingBag, Mail, ArrowUp } from 'lucide-react'
import { useBandData } from '../context/BandDataContext'

// One tap to any section, so nobody has to scroll the whole page on a phone
const SECTIONS = [
  { id: 'hero', label: 'Home', icon: Home },
  { id: 'profile', label: 'About', icon: Info },
  { id: 'personnel', label: 'Band', icon: Users },
  { id: 'discography', label: 'Music', icon: Music },
  { id: 'gigs', label: 'Gigs', icon: Calendar },
  { id: 'merch', label: 'Merch', icon: ShoppingBag },
  { id: 'booking', label: 'Contact', icon: Mail }
]

const SHOW_TOP_BUTTON_AFTER_PX = 700

// The section that crosses the middle of the screen is the one being read
function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )
    SECTIONS.forEach(({ id }) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [])

  return [active, setActive]
}

export default function MobileNav() {
  const { currentTheme } = useBandData()
  const [active, setActive] = useActiveSection()
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > SHOW_TOP_BUTTON_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (id) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="lg:hidden fixed right-3 bottom-[8.25rem] z-40 w-11 h-11 rounded-full bg-neutral-900/95 border border-neutral-700 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowUp className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
        </button>
      )}

      <nav
        aria-label="Sections"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-md border-t border-red-950/70 pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex">
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <li key={id} className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => goTo(id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-full flex flex-col items-center gap-0.5 pt-2 pb-1.5 border-t-2 text-[9px] font-tech font-bold uppercase tracking-wide transition-colors ${
                    isActive ? 'text-white' : 'border-transparent text-neutral-500 active:text-neutral-200'
                  }`}
                  style={isActive ? { borderTopColor: currentTheme.primaryColor } : undefined}
                >
                  <Icon className="w-5 h-5" style={isActive ? { color: currentTheme.primaryColor } : undefined} />
                  <span className="truncate max-w-full">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
