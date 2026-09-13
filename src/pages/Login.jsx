import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import '../style.css'
import '../auth.css'
import { usersApi } from '../services/api'

function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
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

    const { email, password } = formData

    if (!email || !password) {
      window.showToast('Please enter both email and password.', 'warning')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      window.showToast('Please enter a valid email address.', 'warning')
      return
    }

    try {
      const users = await usersApi.getAll()
      const user = users.find(u => u.email === email && u.password === password)

      if (!user) {
        window.showToast('Invalid email or password. Please try again.', 'error')
        return
      }

      localStorage.setItem('dreamWedding_loggedIn', 'true')
      localStorage.setItem('dreamWedding_user', JSON.stringify(user))
      window.showToast(`Welcome back, ${user.name || 'User'}! Redirecting...`, 'success', 2000)

      const redirect = searchParams.get('redirect') || '/'
      setTimeout(() => {
        navigate(redirect)
      }, 1500)
    } catch (error) {
      window.showToast('Login failed. Please try again.', 'error')
    }
  }

  return (
    <>
      {/* Auth Section */}
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-card">
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Login to access your wedding planning dashboard</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">Email *</label>
                <input type="email" id="loginEmail" name="email" required placeholder="your@email.com" value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">Password *</label>
                <input type="password" id="loginPassword" name="password" required placeholder="Enter your password" minLength="6" value={formData.password} onChange={handleChange} />
              </div>
              <div className="form-group form-check">
                <label>
                  <input type="checkbox" id="loginRemember" name="remember" checked={formData.remember} onChange={handleChange} /> Remember me
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-block">Login</button>
              <p className="auth-link">Don't have an account? <a href="/registration">Register here</a></p>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default Login

