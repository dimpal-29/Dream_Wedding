import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import '../style.css'
import '../bookings.css'
import { bookingsApi } from '../services/api'

const PACKAGE_DETAILS = {
  'Essential Package': {
    name: 'Essential Package',
    price: '$2,499 Starting',
    guests: 'Up to 50 Guests',
    desc: 'Perfect for intimate gatherings with close family and friends.',
    features: [
      'Basic floral decoration & mandap setup',
      'Up to 50 guests capacity management',
      '4-hour photography coverage',
      'Buffet-style catering service',
      'Basic sound system',
      '1 dedicated event coordinator'
    ]
  },
  'Premium Package': {
    name: 'Premium Package',
    price: '$4,999 Starting',
    guests: 'Up to 150 Guests',
    badge: 'Most Popular',
    desc: 'Our complete and most popular celebration package with luxury styling.',
    features: [
      'Full venue & thematic mandap decoration',
      'Up to 150 guests capacity',
      '8-hour photography + cinematic videography',
      'Plated dinner dining service',
      'Live band or professional DJ setup',
      'Premium floral arrangements',
      '2 dedicated event coordinators'
    ]
  },
  'Luxury Package': {
    name: 'Luxury Package',
    price: '$8,999 Starting',
    guests: '300+ Guests',
    badge: 'Royal Experience',
    desc: 'The ultimate royal grand wedding experience with bespoke planning.',
    features: [
      'Luxury bespoke decoration & architectural lighting',
      '300+ guests capacity management',
      'Full-day photography, drone & cinema coverage',
      'Premium 5-course gourmet meal',
      'Open bar & cocktail lounge setup',
      'Live band + DJ combo',
      'Wedding cake & dessert bar',
      'Full dedicated planning & concierge team'
    ]
  },
  'Custom Package': {
    name: 'Custom Tailored Package',
    price: 'Custom Quote',
    guests: 'Flexible',
    desc: 'Every wedding is unique. Tailored to your specific dream vision and budget.',
    features: [
      'Customized guest capacity',
      'Select any combination of decor, catering & media',
      'Destination wedding logistics included',
      'Personal wedding director'
    ]
  }
}

function BookPackage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const initialPackage = searchParams.get('package') || 'Premium Package'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedPackage: initialPackage,
    eventType: 'Wedding & Reception',
    guests: '150',
    date: '',
    venue: 'Indoor Banquet Hall',
    address: '',
    notes: ''
  })

  const [message, setMessage] = useState('')

  useEffect(() => {
    const loggedIn = localStorage.getItem('dreamWedding_loggedIn') === 'true'
    setIsLoggedIn(loggedIn)

    if (loggedIn) {
      const user = JSON.parse(localStorage.getItem('dreamWedding_user') || '{}')
      setCurrentUser(user)
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }))
    }

    const pkgParam = searchParams.get('package')
    if (pkgParam) {
      setFormData(prev => ({
        ...prev,
        selectedPackage: pkgParam,
        guests: pkgParam === 'Essential Package' ? '50' : (pkgParam === 'Luxury Package' ? '300' : '150')
      }))
    }
  }, [searchParams])

  const handlePackageSelect = (pkgKey) => {
    setFormData(prev => {
      const updated = { ...prev, selectedPackage: pkgKey }
      if (pkgKey === 'Essential Package') updated.guests = '50'
      if (pkgKey === 'Premium Package') updated.guests = '150'
      if (pkgKey === 'Luxury Package') updated.guests = '300'
      if (pkgKey === 'Custom Package' && (!prev.guests || prev.guests === '50')) updated.guests = '200'
      return updated
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'selectedPackage') {
        if (value === 'Essential Package') updated.guests = '50'
        if (value === 'Premium Package') updated.guests = '150'
        if (value === 'Luxury Package') updated.guests = '300'
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLoggedIn) {
      navigate('/login?redirect=' + encodeURIComponent('/book-package' + window.location.search))
      return
    }

    const { name, email, phone, selectedPackage, date, guests } = formData

    if (!name || !email || !phone || !date || !guests) {
      setMessage('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    if (currentUser) {
      if (currentUser.email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
        setMessage('Email must match your registered account.')
        return
      }
    }

    const packageInfo = PACKAGE_DETAILS[selectedPackage] || {}
    const customSummary = `Package: ${selectedPackage} (${packageInfo.price || ''}) | Event: ${formData.eventType} | Guests: ${formData.guests} | Venue: ${formData.venue}`

    const booking = {
      name,
      email,
      phone,
      service: selectedPackage,
      bookingType: 'package',
      category: 'package',
      customSummary,
      eventType: formData.eventType,
      venue: formData.venue,
      address: formData.address || 'N/A',
      budget: packageInfo.price || 'N/A',
      date,
      guests,
      notes: formData.notes ? `${formData.notes} [Package Info: ${customSummary}]` : customSummary,
      bookingStatus: 'pending',
      paymentStatus: 'Unpaid',
      advancePaid: false,
      balancePaid: false,
      createdAt: new Date().toISOString()
    }

    try {
      await bookingsApi.create(booking)
      setMessage('🎉 Package booking submitted successfully! Redirecting to your bookings...')
      setTimeout(() => {
        navigate('/bookings')
      }, 1500)
    } catch (error) {
      setMessage('Failed to create booking. Please try again.')
    }
  }

  const currentPkg = PACKAGE_DETAILS[formData.selectedPackage] || PACKAGE_DETAILS['Premium Package']

  if (!isLoggedIn) {
    return (
      <section className="booking-section">
        <div className="container">
          <div className="login-required-msg" style={{ display: 'block' }}>
            <div className="login-required-box">
              <h2>Login Required</h2>
              <p>Please login to your account to book a wedding package.</p>
              <div className="login-required-btns">
                <a href="/login" className="btn btn-primary">Login</a>
                <a href="/registration" className="btn btn-secondary">Register</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Wedding Package Reservation</h1>
          <p>Confirm your all-inclusive package for an extraordinary, royal celebration</p>
        </div>
      </section>

      {/* Package Booking Form */}
      <section className="booking-section">
        <div className="container">
          <div className="package-reservation-wrapper">
            <form className="package-reservation-card" onSubmit={handleSubmit}>
              
              {/* Form Royal Header */}
              <div className="package-form-header">
                <span className="royal-badge">👑 Royal Wedding Reservation</span>
                <h2>Book Your Wedding Celebration</h2>
                <p>Select your preferred package below to instantly view all inclusions, pricing, and personalize your event details.</p>
              </div>

              {/* ============================================================== */}
              {/* 1. SELECT OR CHANGE PACKAGE (FIRST)                            */}
              {/* ============================================================== */}
              <div className="form-step-title">
                <span className="step-num-badge">1</span>
                <span>Select or Change Wedding Package</span>
              </div>

              <div className="package-cards-grid">
                {/* Essential Card */}
                <div 
                  className={`package-select-card ${formData.selectedPackage === 'Essential Package' ? 'active' : ''}`}
                  onClick={() => handlePackageSelect('Essential Package')}
                >
                  <span className="package-card-icon">🌸</span>
                  <div className="package-card-name">Essential</div>
                  <div className="package-card-price">$2,499</div>
                  <div className="package-card-guests">Up to 50 Guests</div>
                  <div className="package-card-check">✓</div>
                </div>

                {/* Premium Card */}
                <div 
                  className={`package-select-card ${formData.selectedPackage === 'Premium Package' ? 'active' : ''}`}
                  onClick={() => handlePackageSelect('Premium Package')}
                >
                  <span className="package-card-ribbon">Most Popular</span>
                  <span className="package-card-icon">💎</span>
                  <div className="package-card-name">Premium</div>
                  <div className="package-card-price">$4,999</div>
                  <div className="package-card-guests">Up to 150 Guests</div>
                  <div className="package-card-check">✓</div>
                </div>

                {/* Luxury Card */}
                <div 
                  className={`package-select-card ${formData.selectedPackage === 'Luxury Package' ? 'active' : ''}`}
                  onClick={() => handlePackageSelect('Luxury Package')}
                >
                  <span className="package-card-ribbon">Royal Luxury</span>
                  <span className="package-card-icon">👑</span>
                  <div className="package-card-name">Luxury</div>
                  <div className="package-card-price">$8,999</div>
                  <div className="package-card-guests">300+ Guests</div>
                  <div className="package-card-check">✓</div>
                </div>

                {/* Custom Card */}
                <div 
                  className={`package-select-card ${formData.selectedPackage === 'Custom Package' ? 'active' : ''}`}
                  onClick={() => handlePackageSelect('Custom Package')}
                >
                  <span className="package-card-ribbon">Bespoke</span>
                  <span className="package-card-icon">✨</span>
                  <div className="package-card-name">Custom</div>
                  <div className="package-card-price">Tailored Quote</div>
                  <div className="package-card-guests">Flexible Capacity</div>
                  <div className="package-card-check">✓</div>
                </div>
              </div>

              {/* Accessible Dropdown Selector */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.85rem', color: '#6d5b4a', fontWeight: 600 }}>
                  Or Choose from dropdown:
                </label>
                <select 
                  name="selectedPackage" 
                  value={formData.selectedPackage} 
                  onChange={handleChange}
                  style={{ background: '#faf8f5', borderColor: '#e4d8c2', fontWeight: 600 }}
                >
                  <option value="Essential Package">Essential Package ($2,499) — Up to 50 Guests</option>
                  <option value="Premium Package">Premium Package ($4,999) — Up to 150 Guests (Most Popular)</option>
                  <option value="Luxury Package">Luxury Package ($8,999) — 300+ Guests (Royal All-Inclusive)</option>
                  <option value="Custom Package">Custom Tailored Wedding Package (Bespoke Quote)</option>
                </select>
              </div>

              {/* ============================================================== */}
              {/* 2. SELECTED PACKAGE DETAILS & INCLUSIONS (SECOND)             */}
              {/* ============================================================== */}
              <div className="form-step-title">
                <span className="step-num-badge">2</span>
                <span>Package Inclusions & Detailed Overview</span>
              </div>

              <div className="package-spotlight-box">
                <div className="spotlight-top-bar">
                  <div className="spotlight-title-group">
                    <h3>{currentPkg.name}</h3>
                    <p>{currentPkg.desc}</p>
                  </div>
                  <div className="spotlight-meta-tags">
                    <span className="spotlight-price-badge">{currentPkg.price}</span>
                    <span className="spotlight-guest-badge">👥 {currentPkg.guests}</span>
                  </div>
                </div>

                <div className="spotlight-features-title">
                  <span>✨ Guaranteed Package Inclusions:</span>
                </div>

                <div className="spotlight-features-grid">
                  {currentPkg.features.map((feat, i) => (
                    <div key={i} className="spotlight-feature-pill">
                      <span className="spotlight-feature-icon">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="package-form-divider" />

              {/* ============================================================== */}
              {/* 3. EVENT & CLIENT RESERVATION DETAILS (THIRD)                  */}
              {/* ============================================================== */}
              <div className="form-step-title">
                <span className="step-num-badge">3</span>
                <span>Contact & Event Details</span>
              </div>

              {/* Client Info (Pre-filled for logged in users) */}
              <div className="form-group">
                <label htmlFor="bookingName">Full Name *</label>
                <input 
                  type="text" 
                  id="bookingName" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                  readOnly 
                  style={{ backgroundColor: '#f5f3ef', color: '#555', cursor: 'not-allowed', border: '1px solid #ddd6c7' }} 
                />
                <span className="field-locked-note">🔒 Auto-verified from your registered account</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bookingEmail">Email Address *</label>
                  <input 
                    type="email" 
                    id="bookingEmail" 
                    name="email" 
                    required 
                    value={formData.email} 
                    onChange={handleChange} 
                    readOnly 
                    style={{ backgroundColor: '#f5f3ef', color: '#555', cursor: 'not-allowed', border: '1px solid #ddd6c7' }} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bookingPhone">Phone Number *</label>
                  <input 
                    type="tel" 
                    id="bookingPhone" 
                    name="phone" 
                    required 
                    value={formData.phone} 
                    onChange={handleChange} 
                    readOnly 
                    style={{ backgroundColor: '#f5f3ef', color: '#555', cursor: 'not-allowed', border: '1px solid #ddd6c7' }} 
                  />
                </div>
              </div>

              {/* Event Specifics */}
              <div className="form-row">
                <div className="form-group">
                  <label>Wedding Event Type *</label>
                  <select name="eventType" value={formData.eventType} onChange={handleChange}>
                    <option value="Wedding & Reception">Wedding & Reception</option>
                    <option value="Full 3-Day Wedding (Haldi, Sangeet, Wedding)">Full 3-Day Wedding (Haldi, Sangeet, Wedding)</option>
                    <option value="Ring Ceremony & Sangeet">Ring Ceremony & Sangeet</option>
                    <option value="Royal Destination Wedding">Royal Destination Wedding</option>
                    <option value="Intimate Mandap Wedding">Intimate Mandap Wedding</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expected Guest Count *</label>
                  <input 
                    type="number" 
                    name="guests" 
                    min="10" 
                    max="5000" 
                    required 
                    placeholder="e.g. 150" 
                    value={formData.guests} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preferred Wedding Date *</label>
                  <input type="date" name="date" required value={formData.date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Venue Type Preference</label>
                  <select name="venue" value={formData.venue} onChange={handleChange}>
                    <option value="Indoor Banquet Hall">Indoor Luxury Banquet Hall</option>
                    <option value="Outdoor Palace / Royal Lawn">Outdoor Palace / Royal Lawn</option>
                    <option value="Beachfront Luxury Resort">Beachfront Luxury Resort</option>
                    <option value="Heritage Destination Fort / Hotel">Heritage Destination Fort / Hotel</option>
                    <option value="Private Farmhouse / Estate">Private Farmhouse / Estate</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Event City / Venue Address</label>
                <input 
                  type="text" 
                  name="address" 
                  placeholder="e.g. The Oberoi Udaivilas, Udaipur, Rajasthan" 
                  value={formData.address} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label>Special Requests or Bespoke Inclusions</label>
                <textarea 
                  name="notes" 
                  rows="3"
                  placeholder="Mention custom color themes, specific floral preferences, live artist preferences, or catering dietary restrictions..." 
                  value={formData.notes} 
                  onChange={handleChange}
                ></textarea>
              </div>

              {message && (
                <div className="form-message" style={{ 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  background: message.includes('🎉') ? '#e8f8f0' : '#fef0f0',
                  color: message.includes('🎉') ? '#1e7e44' : '#c0392b',
                  fontWeight: 600,
                  marginBottom: '18px'
                }}>
                  {message}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                <button type="submit" className="package-submit-btn">
                  Confirm Package Reservation ➔
                </button>
                <a href="/bookings" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                  View My Bookings
                </a>
              </div>

              <div className="package-switch-box">
                <span>Looking to book an individual service instead (like DJ, Photography, or Decor)?</span>
                <Link to="/book-now">Book an Individual Service →</Link>
              </div>

            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default BookPackage
