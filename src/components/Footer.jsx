import { Link } from 'react-router-dom'
import '../style.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <Link to="/" className="footer-logo">
              <img src="/images/logo.svg" alt="Dream Wedding Logo" />
            </Link>
            <p>Making your special day extraordinary since 2010.</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/services">Services</Link>
            <Link to="/packages">Packages</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>123 Wedding Lane, Dream City</p>
            <p>Phone: (555) 123-4567</p>
            <p>Email: info@dreamwedding.com</p>
          </div>
          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="#" aria-label="Facebook">
                <img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" />
              </a>
              <a href="#" aria-label="Instagram">
                <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" />
              </a>
              <a href="#" aria-label="Pinterest">
                <img src="https://cdn.simpleicons.org/pinterest/BD081C" alt="Pinterest" />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Dream Wedding. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
