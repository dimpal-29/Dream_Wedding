import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { vendorAuthApi } from '../services/api'
import '../vendor.css'

function VendorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const vendor = await vendorAuthApi.login(email, password)
      if (window.showToast) {
        window.showToast(`Welcome back, ${vendor.name}!`, 'success')
      }
      navigate('/vendor')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
      if (window.showToast) {
        window.showToast(err.message || 'Login failed', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vauth-page">
      <div className="vauth-card">
        {/* Brand Header */}
        <div className="vauth-brand-center">
          <Link to="/" title="Go to Homepage">
            <img src="/images/logo.svg" alt="Dream Wedding" className="vauth-form-logo" />
          </Link>
          <span className="vauth-brand-badge">
            <i className="fa-solid fa-handshake"></i> Vendor Partner Portal
          </span>
        </div>

        <div className="vauth-card-header">
          <h2>Vendor Login</h2>
          <p>Access your vendor dashboard</p>
        </div>

        {error && (
          <div className="vauth-alert vauth-alert-error">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="vauth-form">
          <div className="vauth-form-group">
            <label>Email Address</label>
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
            <label>Password</label>
            <div className="vauth-input-wrapper">
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="vauth-btn vauth-btn-primary" disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Sign In'}
          </button>
        </form>

        <div className="vauth-card-footer">

          <p>
            New vendor? <Link to="/vendor/register">Register your business</Link>
          </p>
          <Link to="/" className="vauth-back-link">
            <i className="fa-solid fa-arrow-left"></i> Back to Website
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VendorLogin
