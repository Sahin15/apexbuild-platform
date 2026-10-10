import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex-sw-update-available', {
        detail: { reload: () => updateSW(true) }
      }));
    }
  },
  onOfflineReady() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('apex-sw-offline-ready'));
    }
    console.log('App is ready to work offline.');
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </React.StrictMode>,
)
