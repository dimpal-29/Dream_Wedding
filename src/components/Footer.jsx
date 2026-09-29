import { Link } from 'react-router-dom'
import '../style.css'

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-content">
          {/* Section 1: Brand & Tagline */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo" aria-label="Dream Wedding Home">
              <img src="/images/logo.svg" alt="Dream Wedding Logo" />
            </Link>
            <p className="footer-desc">
              Crafting unforgettable wedding celebrations since 2010. Handcrafted luxury, bespoke styling, and timeless memories.
            </p>
            <div className="footer-badge">
              <span className="footer-badge-dot"></span>
              <span>Award-Winning Wedding Planners</span>
            </div>
          </div>

          {/* Section 2: Quick Links */}
          <div className="footer-section footer-links-section">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-nav-list">
              <li>
                <Link to="/" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>Services</span>
                </Link>
              </li>
              <li>
                <Link to="/packages" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>Packages</span>
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>Gallery</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>Bookings</span>
                </Link>
              </li>
              <li>
                <Link to="/vendor/login" className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  <span>Vendor Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3: Contact Info (Interactive Links on Mobile) */}
          <div className="footer-section footer-contact-section">
            <h3 className="footer-heading">Contact Us</h3>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <span className="contact-icon" aria-hidden="true">📍</span>
                <div className="contact-item-text">
                  <span className="contact-label">Location</span>
                  <span>123 Wedding Lane, Dream City, CA 90210</span>
                </div>
              </div>
              <a href="tel:+15551234567" className="footer-contact-item footer-interactive-link" aria-label="Call Dream Wedding">
                <span className="contact-icon" aria-hidden="true">📞</span>
                <div className="contact-item-text">
                  <span className="contact-label">Phone (Tap to call)</span>
                  <span className="contact-value">(555) 123-4567</span>
                </div>
              </a>
              <a href="mailto:info@dreamwedding.com" className="footer-contact-item footer-interactive-link" aria-label="Email Dream Wedding">
                <span className="contact-icon" aria-hidden="true">✉️</span>
                <div className="contact-item-text">
                  <span className="contact-label">Email (Tap to message)</span>
                  <span className="contact-value">info@dreamwedding.com</span>
                </div>
              </a>
              <div className="footer-contact-item">
                <span className="contact-icon" aria-hidden="true">🕒</span>
                <div className="contact-item-text">
                  <span className="contact-label">Working Hours</span>
                  <span>Mon – Sat: 9:00 AM – 7:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Social & Back to Top */}
          <div className="footer-section footer-social-section">
            <h3 className="footer-heading">Follow Us</h3>
            <p className="footer-social-desc">
              Discover real wedding stories, daily decor inspiration, and behind-the-scenes magic.
            </p>
            <div className="footer-social-row">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="footer-social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="footer-social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="footer-social-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>

            {/* Back to Top */}
            <button
              type="button"
              className="footer-btt-btn"
              onClick={scrollToTop}
              aria-label="Scroll back to top of page"
            >
              <span className="footer-btt-icon" aria-hidden="true">↑</span>
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <p className="footer-copy">
              &copy; {new Date().getFullYear()} Dream Wedding. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/about">About Us</Link>
              <span className="footer-dot">•</span>
              <Link to="/contact">Support</Link>
              <span className="footer-dot">•</span>
              <Link to="/packages">Packages</Link>
              <span className="footer-dot">•</span>
              <Link to="/vendor/login">Vendors</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
