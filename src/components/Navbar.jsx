import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import '../style.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const loggedIn = localStorage.getItem('dreamWedding_loggedIn') === 'true'
    setIsLoggedIn(loggedIn)
  }, [location])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogoutClick = (e) => {
    e.preventDefault()
    closeMenu()
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    localStorage.removeItem('dreamWedding_loggedIn')
    localStorage.removeItem('dreamWedding_user')
    setIsLoggedIn(false)
    setShowLogoutModal(false)
    if (window.showToast) {
      window.showToast('You have been logged out successfully.', 'info')
    }
    window.location.href = '/'
  }

  const closeMenu = () => {
    if (window.innerWidth <= 768) {
      setIsMenuOpen(false)
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="logo">
            <img src="/images/logo.svg" alt="Dream Wedding Logo" />
          </Link>
          <button className="menu-toggle" aria-label="Toggle menu" onClick={toggleMenu}>
            <span>{isMenuOpen ? '\u2715' : '\u2630'}</span>
          </button>
          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <li><Link to="/" onClick={closeMenu}>Home</Link></li>
            <li><Link to="/about" onClick={closeMenu}>About</Link></li>
            <li><Link to="/services" onClick={closeMenu}>Services</Link></li>
            <li><Link to="/packages" onClick={closeMenu}>Packages</Link></li>
            <li><Link to="/gallery" onClick={closeMenu}>Gallery</Link></li>
            <li><Link to="/contact" onClick={closeMenu}>Contact</Link></li>
            <li><Link to="/bookings" onClick={closeMenu}>Bookings</Link></li>
            <li><Link to="/vendor" onClick={closeMenu}>Vendor Portal</Link></li>
            {!isLoggedIn && <li><Link to="/login" onClick={closeMenu} style={{ backgroundColor: '#b8860b', color: '#fff', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none' }}>Login</Link></li>}
            {isLoggedIn && <li><a href="#" onClick={handleLogoutClick} style={{ backgroundColor: '#b8860b', color: '#fff', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none' }}>Logout</a></li>}
          </ul>
        </div>
      </nav>

      {/* Premium Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="custom-confirm-overlay show" onClick={() => setShowLogoutModal(false)}>
          <div className="custom-confirm-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="custom-confirm-close"
              onClick={() => setShowLogoutModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="custom-confirm-icon-wrap">
              <div className="custom-confirm-icon">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </div>
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of your <strong>Dream Wedding</strong> account?</p>
            <div className="custom-confirm-hint">
              <i className="fa-solid fa-circle-info" style={{ color: '#b8860b' }}></i>
              <span>You can sign back in anytime to view your bookings.</span>
            </div>
            <div className="custom-confirm-btns">
              <button
                type="button"
                className="custom-confirm-btn custom-confirm-btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                <i className="fa-solid fa-xmark"></i> Stay Logged In
              </button>
              <button
                type="button"
                className="custom-confirm-btn custom-confirm-btn-confirm"
                onClick={confirmLogout}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
