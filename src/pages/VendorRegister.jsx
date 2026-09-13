import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { vendorAuthApi } from '../services/api'
import '../vendor.css'

function VendorRegister() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Step 1: Business Details
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')

  // Step 2: Service & Password
  const [service, setService] = useState('Photography')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const serviceOptions = [
    'Photography',
    'Decoration',
    'Catering',
    'Makeup',
    'DJ',
    'Venue',
    'Mehendi',
    'Music',
    'Transport'
  ]

  const handleStep1Next = (e) => {
    e.preventDefault()
    if (!businessName || !ownerName || !email || !phone) {
      setError('Please fill in all required fields')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const vendorData = {
        businessName,
        ownerName,
        email,
        phone,
        city,
        location,
        service,
        password
      }

      const vendor = await vendorAuthApi.register(vendorData)

      // Auto-login after registration
      await vendorAuthApi.login(email, password)

      if (window.showToast) {
        window.showToast(`Welcome, ${vendor.name}! Registration successful.`, 'success')
      }
      navigate('/vendor')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
      if (window.showToast) {
        window.showToast(err.message || 'Registration failed', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vauth-page">
      <div className="vauth-card register-card">
        {/* Brand Header */}
        <div className="vauth-brand-center">
          <Link to="/" title="Go to Homepage">
            <img src="/images/logo.svg" alt="Dream Wedding" className="vauth-form-logo" />
          </Link>
          <span className="vauth-brand-badge">
            <i className="fa-solid fa-handshake"></i> Vendor Partner Registration
          </span>
        </div>

        <div className="vauth-card-header">
          <h2>Vendor Registration</h2>
          <p>
            Step {step} of 2: {step === 1 ? 'Business & Contact Details' : 'Service Category & Password'}
          </p>
          {/* Progress Bar */}
          <div className="vauth-progress">
            <div
              className="vauth-progress-bar"
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="vauth-alert vauth-alert-error">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1Next} className="vauth-form">
            <div className="vauth-form-group">
              <label>Business / Brand Name *</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-store"></i>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Royal Lens Studios"
                  required
                />
              </div>
            </div>

            <div className="vauth-form-group">
              <label>Owner / Contact Person *</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-user"></i>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="vauth-form-group">
              <label>Email Address *</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  required
                />
              </div>
            </div>

            <div className="vauth-form-group">
              <label>Phone Number *</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-phone"></i>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div className="vauth-form-group">
              <label>City / Base Location</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-location-dot"></i>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Ahmedabad, Surat, Mumbai"
                />
              </div>
            </div>

            <button type="submit" className="vauth-btn vauth-btn-primary">
              Continue to Step 2 <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="vauth-form">
            <div className="vauth-form-group">
              <label>Primary Service Category *</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-briefcase"></i>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  required
                >
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vauth-form-group">
              <label>Create Password * (min 6 chars)</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength="6"
                  required
                />
              </div>
            </div>

            <div className="vauth-form-group">
              <label>Confirm Password *</label>
              <div className="vauth-input-wrapper">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Registration Summary Box */}
            <div className="vauth-summary">
              <h4>Review Details:</h4>
              <div className="vauth-summary-item">
                <span>Business:</span>
                <strong>{businessName}</strong>
              </div>
              <div className="vauth-summary-item">
                <span>Contact:</span>
                <strong>{ownerName}</strong>
              </div>
              <div className="vauth-summary-item">
                <span>Email:</span>
                <strong>{email}</strong>
              </div>
              <div className="vauth-summary-item">
                <span>Phone:</span>
                <strong>{phone}</strong>
              </div>
              <div className="vauth-summary-item">
                <span>Location:</span>
                <strong>{city || location || 'Not specified'}</strong>
              </div>
            </div>

            <div className="vauth-form-actions">
              <button
                type="button"
                className="vauth-btn vauth-btn-secondary"
                onClick={() => setStep(1)}
              >
                <i className="fa-solid fa-arrow-left"></i> Back
              </button>
              <button type="submit" className="vauth-btn vauth-btn-primary" disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <div className="vauth-card-footer">
          <p>
            Already registered? <Link to="/vendor/login">Sign in to your account</Link>
          </p>
          <Link to="/" className="vauth-back-link">
            <i className="fa-solid fa-arrow-left"></i> Back to Website
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VendorRegister
