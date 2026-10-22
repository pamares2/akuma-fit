import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registro del Service Worker para soporte de app instalable (PWA)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.debug('ServiceWorker registration error:', err);
        });
    });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
