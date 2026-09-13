import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import '../style.css'
import '../auth.css'
import { usersApi } from '../services/api'

function Registration() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false
  })

  useEffect(() => {
    const loggedIn = localStorage.getItem('dreamWedding_loggedIn') === 'true'
    if (loggedIn) {
      const redirect = searchParams.get('redirect') || '/'
      navigate(redirect)
    }
  }, [searchParams, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { firstName, lastName, email, phone, password, confirmPassword, terms } = formData

    if (!firstName || !lastName || !email || !password || !confirmPassword || !terms) {
      window.showToast('Please fill in all required fields and agree to terms.', 'warning')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      window.showToast('Please enter a valid email address.', 'warning')
      return
    }

    if (password.length < 6) {
      window.showToast('Password must be at least 6 characters.', 'warning')
      return
    }

    if (password !== confirmPassword) {
      window.showToast('Passwords do not match. Please check again.', 'error')
      return
    }

    const newUser = {
      name: `${firstName} ${lastName}`,
      email,
      phone,
      password
    }

    try {
      const users = await usersApi.getAll()
      const existingUser = users.find(u => u.email === email)

      if (existingUser) {
        window.showToast('This email is already registered. Please login instead.', 'warning')
        return
      }

      await usersApi.create(newUser)
      window.showToast(`Account created successfully! Welcome, ${firstName}! Redirecting to login...`, 'success', 3000)

      const redirect = searchParams.get('redirect')
      const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
      
      setTimeout(() => {
        navigate(loginUrl)
      }, 2000)
    } catch (error) {
      window.showToast('Registration failed. Please try again.', 'error')
    }
  }

  return (
    <>
      {/* Auth Section */}
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card">
            <h1>Create Account</h1>
            <p className="auth-subtitle">Join Dream Wedding to manage your bookings</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="regFirstName">First Name *</label>
                  <input type="text" id="regFirstName" name="firstName" required placeholder="First name" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="regLastName">Last Name *</label>
                  <input type="text" id="regLastName" name="lastName" required placeholder="Last name" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="regEmail">Email *</label>
                <input type="email" id="regEmail" name="email" required placeholder="your@email.com" value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="regPhone">Phone</label>
                <input type="tel" id="regPhone" name="phone" placeholder="(555) 000-0000" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="regPassword">Password *</label>
                <input type="password" id="regPassword" name="password" required placeholder="Min 6 characters" minLength="6" value={formData.password} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="regConfirmPassword">Confirm Password *</label>
                <input type="password" id="regConfirmPassword" name="confirmPassword" required placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} />
              </div>
              <div className="form-group form-check">
                <label>
                  <input type="checkbox" id="regTerms" name="terms" required checked={formData.terms} onChange={handleChange} /> I agree to the terms and conditions
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-block">Register</button>
              <p className="auth-link">Already have an account? <a href="/login">Login here</a></p>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default Registration

