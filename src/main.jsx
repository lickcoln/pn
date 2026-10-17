import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { BandDataProvider } from './context/BandDataContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary page>
      {/* visitors who asked their system for less motion get no sliding or fading animations */}
      <MotionConfig reducedMotion="user">
        <BandDataProvider>
          <App />
        </BandDataProvider>
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
)
