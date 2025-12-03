import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './sentry' // Initialize Sentry for error tracking
import { initPWA } from './registerServiceWorker' // Initialize PWA

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Initialize PWA features
initPWA()
