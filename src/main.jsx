import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BandDataProvider } from './context/BandDataContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BandDataProvider>
      <App />
    </BandDataProvider>
  </StrictMode>,
)
