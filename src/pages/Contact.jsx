import { useState } from 'react'
import '../style.css'
import '../contact.css'
import { contactsApi } from '../services/api'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { name, email, phone, subject, message: msg } = formData

    if (!name || !email || !subject || !msg) {
      setMessage('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    if (msg.length < 20) {
      setMessage('Message must be at least 20 characters.')
      return
    }

    try {
      await contactsApi.create({
        name,
        email,
        phone,
        subject,
        message: msg,
        createdAt: new Date().toISOString()
      })
      setMessage('Thank you! Your message has been sent. We will get back to you soon.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      setMessage('Failed to send message. Please try again.')
    }
  }

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p>Have questions about our services or ready to start planning? Reach out and we'll get back to you within 24 hours.</p>
              <div className="info-item">
                <strong>Address</strong>
                <p>123 Wedding Lane, Dream City, DC 12345</p>
              </div>
              <div className="info-item">
                <strong>Phone</strong>
                <p>(555) 123-4567</p>
              </div>
              <div className="info-item">
                <strong>Email</strong>
                <p>info@dreamwedding.com</p>
              </div>
              <div className="info-item">
                <strong>Hours</strong>
                <p>Mon - Fri: 9:00 AM - 6:00 PM<br />Sat: 10:00 AM - 4:00 PM</p>
              </div>
            </div>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="contactName">Your Name *</label>
                <input type="text" id="contactName" name="name" required placeholder="Full name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="contactEmail">Email *</label>
                <input type="email" id="contactEmail" name="email" required placeholder="your@email.com" value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="contactPhone">Phone</label>
                <input type="tel" id="contactPhone" name="phone" placeholder="(555) 000-0000" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="contactSubject">Subject *</label>
                <select id="contactSubject" name="subject" required value={formData.subject} onChange={handleChange}>
                  <option value="">Select a subject</option>
                  <option value="booking">Booking Inquiry</option>
                  <option value="package">Package Information</option>
                  <option value="custom">Custom Request</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="contactMessage">Message *</label>
                <textarea id="contactMessage" name="message" required placeholder="Tell us about your wedding plans..." value={formData.message} onChange={handleChange}></textarea>
              </div>
              <div className="form-message">{message}</div>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact
