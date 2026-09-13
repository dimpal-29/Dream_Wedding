import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { vendorAuthApi } from './services/api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Packages from './pages/Packages'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Registration from './pages/Registration'
import BookNow from './pages/BookNow'
import BookPackage from './pages/BookPackage'
import Bookings from './pages/Bookings'
import AdminPanel from './pages/AdminPanel'
import VendorPortal from './pages/VendorPortal'
import VendorLogin from './pages/VendorLogin'
import VendorRegister from './pages/VendorRegister'

/* ─── Toast Icons ─── */
const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  default: '🔔',
}
const TOAST_TITLES = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  default: 'Notice',
}

/* ─── ToastHost: mounts toast container & registers window.showToast ─── */
function ToastHost() {
  const rootRef = useRef(null)

  useEffect(() => {
    // Create container if not present
    let el = document.getElementById('dw-toast-root')
    if (!el) {
      el = document.createElement('div')
      el.id = 'dw-toast-root'
      document.body.appendChild(el)
    }
    rootRef.current = el

    // Register global showToast
    window.showToast = (message = '', type = 'default', duration = 4000) => {
      const t = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'default'
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)

      const item = document.createElement('div')
      item.className = `dw-toast-item toast-${t}`
      item.id = id
      item.innerHTML = `
        <span class="dw-toast-icon">${TOAST_ICONS[t]}</span>
        <div class="dw-toast-body">
          <div class="dw-toast-title">${TOAST_TITLES[t]}</div>
          <div class="dw-toast-msg">${message}</div>
        </div>
        <button class="dw-toast-close" aria-label="Close">✕</button>
        <span class="dw-toast-progress toast-${t}" style="animation-duration:${duration}ms"></span>
      `

      const dismiss = () => {
        item.classList.add('toast-exit')
        item.addEventListener('animationend', () => item.remove(), { once: true })
      }

      item.querySelector('.dw-toast-close').addEventListener('click', dismiss)
      el.appendChild(item)
      setTimeout(dismiss, duration)
    }

    // Register global showConfirm with luxury modal styling
    window.showConfirm = ({
      title = 'Are you sure?',
      message = 'Please confirm this action.',
      hint = '',
      confirmText = 'Yes, Proceed',
      cancelText = 'Cancel',
      type = 'warning',
      icon = 'fa-solid fa-triangle-exclamation'
    } = {}) => {
      return new Promise((resolve) => {
        const overlay = document.createElement('div')
        overlay.className = 'custom-confirm-overlay show'
        overlay.innerHTML = `
          <div class="custom-confirm-box" onclick="event.stopPropagation()">
            <button type="button" class="custom-confirm-close" id="dw-confirm-x" aria-label="Close">&times;</button>
            <div class="custom-confirm-icon-wrap">
              <div class="custom-confirm-icon ${type === 'danger' ? 'danger' : ''}">
                <i class="${icon}"></i>
              </div>
            </div>
            <h3>${title}</h3>
            <p>${message}</p>
            ${hint ? `<div class="custom-confirm-hint">${hint}</div>` : ''}
            <div class="custom-confirm-btns">
              <button type="button" class="custom-confirm-btn custom-confirm-btn-cancel" id="dw-confirm-cancel">
                <i class="fa-solid fa-xmark"></i> ${cancelText}
              </button>
              <button type="button" class="custom-confirm-btn ${type === 'danger' ? 'custom-confirm-btn-danger' : 'custom-confirm-btn-confirm'}" id="dw-confirm-ok">
                <i class="fa-solid fa-check"></i> ${confirmText}
              </button>
            </div>
          </div>
        `
        document.body.appendChild(overlay)

        let closed = false
        const close = (result) => {
          if (closed) return
          closed = true
          overlay.classList.remove('show')
          setTimeout(() => overlay.remove(), 250)
          resolve(result)
        }

        overlay.addEventListener('click', () => close(false))
        overlay.querySelector('#dw-confirm-x')?.addEventListener('click', () => close(false))
        overlay.querySelector('#dw-confirm-cancel')?.addEventListener('click', () => close(false))
        overlay.querySelector('#dw-confirm-ok')?.addEventListener('click', () => close(true))
      })
    }

    return () => {
      delete window.showToast
      delete window.showConfirm
    }
  }, [])

  return null
}

// Guard: Redirect to vendor login if not authenticated
function ProtectedVendorRoute({ children }) {
  if (!vendorAuthApi.isLoggedIn()) {
    return <Navigate to="/vendor/login" replace />
  }
  return children
}

function AppContent() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const isVendorAuth = location.pathname.startsWith('/vendor')

  return (
    <div className={`app ${isAdmin ? 'admin-layout-root' : ''}`}>
      {!isAdmin && !isVendorAuth && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/service-detail" element={<ServiceDetail />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/book-now" element={<BookNow />} />
        <Route path="/book-package" element={<BookPackage />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/vendor" element={<ProtectedVendorRoute><VendorPortal /></ProtectedVendorRoute>} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
      </Routes>
      {!isAdmin && !isVendorAuth && <Footer />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <AppContent />
    </BrowserRouter>
  )
}

export default App

