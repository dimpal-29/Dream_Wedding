import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../style.css'
import '../home.css'
import { reviewsApi } from '../services/api'

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Feedback State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    date: '',
    rating: 5,
    coupleImg: '',
    text: ''
  })
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    reviewsApi.getAll().then(list => {
      if (Array.isArray(list) && list.length > 0) {
        const approved = list.filter(r => r.status !== 'pending')
        const itemsToDisplay = approved.length > 0 ? approved : list
        setTestimonials(itemsToDisplay.map(r => ({
          img: r.coupleImg || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
          text: r.text,
          author: r.name,
          role: r.date
        })))
      }
    }).catch(() => {})
  }, [])

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target
    setFeedbackForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setFeedbackSubmitting(true)

    const newReview = {
      name: feedbackForm.name,
      email: feedbackForm.email,
      coupleImg: feedbackForm.coupleImg || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
      rating: parseInt(feedbackForm.rating, 10) || 5,
      text: feedbackForm.text,
      date: feedbackForm.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    try {
      await reviewsApi.create(newReview)
    } catch (err) {
      console.warn('API review save fallback:', err)
    }

    // Add to testimonials list so the newly submitted feedback appears immediately
    setTestimonials(prev => [
      {
        img: newReview.coupleImg,
        text: newReview.text,
        author: newReview.name,
        role: newReview.date
      },
      ...prev
    ])

    setFeedbackSubmitting(false)
    setFeedbackSuccess(true)
    setTimeout(() => {
      setFeedbackSuccess(false)
      setIsFeedbackOpen(false)
      setFeedbackForm({
        name: '',
        email: '',
        date: '',
        rating: 5,
        coupleImg: '',
        text: ''
      })
    }, 2500)
  }

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
      quote: '"A successful marriage requires falling in love many times, always with the same person."',
      subtitle: '— Mignon McLaughlin'
    },
    {
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80',
      quote: '"Love is composed of a single soul inhabiting two bodies."',
      subtitle: '— Aristotle'
    },
    {
      image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1920&q=80',
      quote: '"The best thing to hold onto in life is each other."',
      subtitle: '— Audrey Hepburn'
    },
    {
      image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1920&q=80',
      quote: '"Two souls with but a single thought, two hearts that beat as one."',
      subtitle: '— John Keats'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  return (
    <>
      {/* Hero Slider */}
      <section className="hero-slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            <div className="slide-overlay">
              <p className="slide-quote">{slide.quote}</p>
              <span className="slide-subtitle">{slide.subtitle}</span>
            </div>
          </div>
        ))}
        <div className="slider-arrows">
          <button className="slider-arrow prev" aria-label="Previous slide" onClick={prevSlide}>
            &#10094;
          </button>
          <button className="slider-arrow next" aria-label="Next slide" onClick={nextSlide}>
            &#10095;
          </button>
        </div>
        <div className="slider-controls">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            ></span>
          ))}
        </div>
      </section>

      {/* Services Overview */}
      <section className="services-overview">
        <div className="container">
          <div className="section-title">
            <h2>Our Services</h2>
            <p>Everything you need for your dream wedding, all in one place</p>
          </div>
          <div className="services-cards-grid">
            <Link to="/service-detail?category=wedding-ceremony" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800&q=80" alt="Wedding Ceremony" />
                </div>
                <div className="service-card-text">
                  <h3>WEDDING CEREMONY</h3>
                  <p>Experience the magic of traditional rituals. From Haldi to Reception, we manage every ceremony with care.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=ring-ceremony" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80" alt="Ring Ceremony" />
                </div>
                <div className="service-card-text">
                  <h3>RING CEREMONY</h3>
                  <p>Take the next step together. Our ring ceremonies create the perfect moment to begin your journey as one.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=pre-wedding" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80" alt="Photography and Videography" />
                </div>
                <div className="service-card-text">
                  <h3>PHOTOGRAPHY & VIDEOGRAPHY</h3>
                  <p>Capture every moment beautifully. Our services preserve your special memories forever.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=music-night" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80" alt="Music Night" />
                </div>
                <div className="service-card-text">
                  <h3>MUSIC NIGHT</h3>
                  <p>From sangeet to reception, our live bands and DJs create unforgettable celebrations.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=decoration" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80" alt="Decoration" />
                </div>
                <div className="service-card-text">
                  <h3>DECORATION</h3>
                  <p>Transform your venue into a dream. From floral mandaps to elegant draping, we create breathtaking setups.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=destination" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" alt="Destination" />
                </div>
                <div className="service-card-text">
                  <h3>DESTINATION WEDDING</h3>
                  <p>Beach, hills, or heritage—we make your dream location wedding come true.</p>
                </div>
              </div>
            </Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link to="/services" className="btn btn-primary">View Services</Link>
          </div>
        </div>
      </section>

      {/* Packages Banner */}
      <section className="packages-banner">
        <div className="packages-banner-overlay">
          <div className="container">
            <div className="packages-banner-content">
              <span className="packages-banner-tag">Exclusive Offerings</span>
              <h2>Wedding Packages</h2>
              <p>
                From intimate ceremonies to grand celebrations, discover our thoughtfully crafted wedding packages tailored to make your special day seamless, unforgettable, and truly yours.
              </p>
              <div className="packages-banner-btn-wrapper">
                <Link to="/packages" className="packages-banner-btn">
                  View Packages
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Home Gallery */}
      <section className="home-gallery">
        <div className="container">
          <div className="section-title">
            <h2>Our Wedding Couples</h2>
            <p>Glimpse into the magical weddings we've created</p>
          </div>
          <div className="home-gallery-grid">
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple1.png" alt="Arjun + Sneha" />
              <div className="home-gallery-overlay">
                <span>Arjun + Sneha</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple2.png" alt="Rohan + Priya" />
              <div className="home-gallery-overlay">
                <span>Rohan + Priya</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple3.png" alt="Kabir + Zara" />
              <div className="home-gallery-overlay">
                <span>Kabir + Zara</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple4.png" alt="Vikram + Kavya" />
              <div className="home-gallery-overlay">
                <span>Vikram + Kavya</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple5.png" alt="Siddharth + Aditi" />
              <div className="home-gallery-overlay">
                <span>Siddharth + Aditi</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple6.png" alt="Ishaan + Meera" />
              <div className="home-gallery-overlay">
                <span>Ishaan + Meera</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple7.jpeg" alt="Ankit + Pooja" />
              <div className="home-gallery-overlay">
                <span>Ankit + Pooja</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/images.jpeg" alt="Karan + Anjali" />
              <div className="home-gallery-overlay">
                <span>Karan + Anjali</span>
              </div>
            </Link>
            <Link to="/gallery" className="home-gallery-item">
              <img src="/images/couple8.jpeg" alt="Suresh + Lakshmi" />
              <div className="home-gallery-overlay">
                <span>Suresh + Lakshmi</span>
              </div>
            </Link>
          </div>
          <div className="home-gallery-cta">
            <Link to="/gallery" className="btn btn-primary">View Full Gallery</Link>
          </div>
        </div>
      </section>

      {/* Feedback Banner (Directly Above Testimonials) */}
      <section className="feedback-banner">
        <div className="feedback-banner-overlay">
          <div className="container">
            <div className="feedback-banner-content">
              <span className="feedback-badge">✨ Your Voice Matters</span>
              <h2>Were We Part of Your Special Day?</h2>
              <p>
                We would love to hear your story! Share your wedding experience with Dream Wedding and inspire couples planning their dream celebration.
              </p>
              <button 
                type="button" 
                className="feedback-open-btn"
                onClick={() => setIsFeedbackOpen(true)}
              >
                ✍️ Share Your Feedback
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Modal Form */}
      {isFeedbackOpen && (
        <div className="feedback-modal-backdrop" onClick={() => setIsFeedbackOpen(false)}>
          <div className="feedback-modal-box" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              className="feedback-modal-close" 
              onClick={() => setIsFeedbackOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="feedback-modal-header">
              <span className="feedback-modal-tag">Review & Experience</span>
              <h3>Share Your Feedback</h3>
              <p>Tell us about your wedding journey with Dream Wedding</p>
            </div>

            {feedbackSuccess ? (
              <div className="feedback-success-msg">
                <div className="feedback-success-icon">🎉</div>
                <h4>Thank You So Much!</h4>
                <p>Your feedback has been submitted successfully and added to our wedding stories!</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                <div className="form-group">
                  <label>Couple's Names *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Rohan & Priya"
                    value={feedbackForm.name}
                    onChange={handleFeedbackChange}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="your@email.com"
                      value={feedbackForm.email}
                      onChange={handleFeedbackChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Wedding Date / Month</label>
                    <input
                      type="text"
                      name="date"
                      placeholder="e.g. December 2024"
                      value={feedbackForm.date}
                      onChange={handleFeedbackChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Rating *</label>
                  <div className="star-rating-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${feedbackForm.rating >= star ? 'active' : ''}`}
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                      >
                        ★
                      </button>
                    ))}
                    <span className="star-text">{feedbackForm.rating} / 5 Stars</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Couple Photo URL (optional)</label>
                  <input
                    type="url"
                    name="coupleImg"
                    placeholder="https://example.com/photo.jpg"
                    value={feedbackForm.coupleImg}
                    onChange={handleFeedbackChange}
                  />
                </div>

                <div className="form-group">
                  <label>Your Feedback / Story *</label>
                  <textarea
                    name="text"
                    required
                    rows="4"
                    placeholder="Share how our team helped create your memorable day..."
                    value={feedbackForm.text}
                    onChange={handleFeedbackChange}
                  ></textarea>
                </div>

                <div className="feedback-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={feedbackSubmitting}>
                    {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsFeedbackOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <div className="section-title">
            <h2>What Our Couples Say</h2>
            <p>Real stories from couples who chose Dream Wedding</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((item, idx) => (
              <div className="testimonial-card" key={idx}>
                <div className="testimonial-couple-img">
                  <img src={item.img} alt={item.author} />
                </div>
                <p className="testimonial-text">{item.text}</p>
                <div className="testimonial-author">{item.author}</div>
                <div className="testimonial-role">{item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Plan Your Dream Wedding?</h2>
          <p>Book a consultation today and let us help you create unforgettable memories.</p>
          <div className="cta-buttons">
            <Link to="/book-now" className="btn">Book Now</Link>
            <Link to="/login" className="btn btn-cta-secondary">Login</Link>
            <Link to="/registration" className="btn btn-cta-secondary">Registration</Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
