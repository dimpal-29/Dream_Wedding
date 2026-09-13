import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import '../style.css'
import '../bookings.css'
import { bookingsApi } from '../services/api'

// Helper to determine the service category
function detectServiceCategory(serviceName = '', categoryParam = '') {
  if (categoryParam) {
    if (categoryParam === 'pre-wedding') return 'photography';
    if (categoryParam === 'decoration') return 'decoration';
    if (categoryParam === 'music-night') return 'music';
    if (categoryParam === 'destination') return 'destination';
    if (categoryParam === 'catering') return 'catering';
    if (categoryParam === 'makeup-styling') return 'makeup';
    if (categoryParam === 'ring-ceremony') return 'ring-ceremony';
    if (categoryParam === 'wedding-ceremony' || categoryParam === 'all-weddings') return 'wedding-ceremony';
    return categoryParam;
  }

  const s = (serviceName || '').toLowerCase();
  if (s.includes('photo') || s.includes('video') || s.includes('shoot') || s.includes('camera') || s.includes('pre-wedding')) return 'photography';
  if (s.includes('decor') || s.includes('mandap') || s.includes('flower') || s.includes('balloon') || s.includes('stage') || s.includes('entrance')) return 'decoration';
  if (s.includes('dj') || s.includes('music') || s.includes('band') || s.includes('sound') || s.includes('dance') || s.includes('choreograph') || s.includes('anchor') || s.includes('host') || s.includes('sangeet')) return 'music';
  if (s.includes('destination') || s.includes('travel') || s.includes('hotel') || s.includes('resort')) return 'destination';
  if (s.includes('cater') || s.includes('buffet') || s.includes('food') || s.includes('cake') || s.includes('dessert') || s.includes('dinner')) return 'catering';
  if (s.includes('makeup') || s.includes('mehndi') || s.includes('mehendi') || s.includes('hair') || s.includes('groom') || s.includes('styling')) return 'makeup';
  if (s.includes('ring') || s.includes('engagement')) return 'ring-ceremony';
  if (s.includes('haldi') || s.includes('reception') || s.includes('wedding') || s.includes('ceremony')) return 'wedding-ceremony';
  return 'general';
}

function BookNow() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Current active service category
  const [category, setCategory] = useState('general')

  const [formData, setFormData] = useState({
    // Common user details
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    budget: '',
    address: '',
    notes: '',

    // Photography specific
    shootType: 'Pre-Wedding Shoot',
    shootDuration: 'Full Day (8-10 Hours)',
    shootLocation: '',
    deliverables: 'Cinematic Teaser + 4K Video + Edited Photos',

    // Decoration specific
    decorType: 'Mandap & Vow Stage',
    venueSpace: 'Indoor Banquet Hall',
    colorTheme: '',

    // Music Night specific
    musicType: 'Club-Style DJ Setup with Visuals',
    performanceDuration: 'Evening Party (3-4 Hours)',
    soundSetup: 'Standard DJ & Sound Console',

    // Destination Wedding specific
    destinationCity: 'Udaipur, Rajasthan',
    eventDays: '3 Days / 2 Nights',
    stayRequired: 'Yes - Full Resort / Hotel Booking Required',

    // Catering specific
    diningStyle: 'Grand Buffet Spread',
    cuisinePreference: 'Multi-Cuisine (North & South Indian + Continental)',

    // Makeup specific
    stylingService: 'Bridal HD / Airbrush Makeup',
    personCount: 'Bride Only',
    makeupLocation: 'At Wedding Venue / Hotel Room',

    // Ceremonies / General
    eventType: 'Wedding',
    venue: 'Indoor',
    guests: ''
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

    // Prefill from URL params
    const serviceParam = searchParams.get('service') || ''
    const eventTypeParam = searchParams.get('eventType') || ''
    const categoryParam = searchParams.get('category') || ''

    const detected = detectServiceCategory(serviceParam, categoryParam)
    setCategory(detected)

    setFormData(prev => ({
      ...prev,
      service: serviceParam,
      eventType: eventTypeParam || prev.eventType
    }))
  }, [searchParams])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'service') {
        const newCategory = detectServiceCategory(value, '')
        setCategory(newCategory)
      }
      return updated
    })
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLoggedIn) {
      navigate('/login?redirect=' + encodeURIComponent('/book-now' + window.location.search))
      return
    }

    const { name, email, phone, service, date } = formData
    const finalService = service || (category ? `${category.toUpperCase()} Service Booking` : 'Wedding Service Booking')

    // Common validations
    if (!name || !email || !phone || !date) {
      setMessage('Please fill in your name, email, phone, and preferred date.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    // Service-specific validations
    if (['destination', 'catering', 'wedding-ceremony', 'ring-ceremony', 'general'].includes(category)) {
      if (!formData.guests) {
        setMessage('Please specify the approximate number of guests.')
        return
      }
    }

    if (category === 'photography' && !formData.shootLocation) {
      setMessage('Please enter your preferred shoot location or city.')
      return
    }

    if (currentUser) {
      if (currentUser.email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
        setMessage('Email must match your registered account.')
        return
      }
    }

    // Compile dynamic booking info based on category
    let customSummary = ''
    if (category === 'photography') {
      customSummary = `Shoot: ${formData.shootType} | Duration: ${formData.shootDuration} | Location: ${formData.shootLocation} | Deliverables: ${formData.deliverables}`
    } else if (category === 'decoration') {
      customSummary = `Decor: ${formData.decorType} | Venue: ${formData.venueSpace} | Theme: ${formData.colorTheme || 'Not specified'}`
    } else if (category === 'music') {
      customSummary = `Music: ${formData.musicType} | Duration: ${formData.performanceDuration} | Setup: ${formData.soundSetup}`
    } else if (category === 'destination') {
      customSummary = `Destination: ${formData.destinationCity} | Duration: ${formData.eventDays} | Stay: ${formData.stayRequired} | Guests: ${formData.guests}`
    } else if (category === 'catering') {
      customSummary = `Dining: ${formData.diningStyle} | Cuisine: ${formData.cuisinePreference} | Plates/Guests: ${formData.guests}`
    } else if (category === 'makeup') {
      customSummary = `Styling: ${formData.stylingService} | Persons: ${formData.personCount} | Location: ${formData.makeupLocation}`
    } else {
      customSummary = `Event: ${formData.eventType || 'Wedding'} | Venue: ${formData.venue || 'Indoor'} | Guests: ${formData.guests || 'N/A'}`
    }

    const booking = {
      name,
      email,
      phone,
      service: finalService,
      category,
      customSummary,
      eventType: formData.eventType || category,
      venue: formData.venueSpace || formData.venue || formData.shootLocation || formData.destinationCity || 'N/A',
      budget: formData.budget || 'N/A',
      address: formData.address || 'N/A',
      date,
      guests: formData.guests || 'N/A',
      notes: formData.notes ? `${formData.notes} [Custom Info: ${customSummary}]` : customSummary,
      bookingStatus: 'pending',
      paymentStatus: 'Unpaid',
      advancePaid: false,
      balancePaid: false,
      createdAt: new Date().toISOString()
    }

    try {
      // Try API, fallback to direct localStorage save
      let saved = null
      try {
        saved = await bookingsApi.create(booking)
      } catch (apiErr) {
        console.warn('API unavailable, saving locally:', apiErr)
      }

      if (!saved) {
        // Direct localStorage fallback
        const newBooking = {
          ...booking,
          id: 'bk_' + Date.now() + Math.random().toString(36).substring(2, 6)
        }
        const existing = JSON.parse(localStorage.getItem('dw_bookings') || '[]')
        localStorage.setItem('dw_bookings', JSON.stringify([...existing, newBooking]))
        saved = newBooking
      }

      setMessage('🎉 Booking submitted successfully! Redirecting to your bookings...')
      setTimeout(() => {
        navigate('/bookings')
      }, 1500)
    } catch (error) {
      console.error('Booking error:', error)
      // Last resort: save directly
      try {
        const newBooking = {
          ...booking,
          id: 'bk_' + Date.now() + Math.random().toString(36).substring(2, 6)
        }
        const existing = JSON.parse(localStorage.getItem('dw_bookings') || '[]')
        localStorage.setItem('dw_bookings', JSON.stringify([...existing, newBooking]))
        setMessage('🎉 Booking submitted successfully! Redirecting to your bookings...')
        setTimeout(() => navigate('/bookings'), 1500)
      } catch (e) {
        setMessage('Something went wrong. Please refresh and try again.')
      }
    }
  }

  if (!isLoggedIn) {
    return (
      <section className="booking-section">
        <div className="container">
          <div className="login-required-msg" style={{ display: 'block' }}>
            <div className="login-required-box">
              <h2>Login Required</h2>
              <p>You need to login to make a booking. Please login or create an account first.</p>
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
          <h1>Book a Service</h1>
          <p>Customized booking form tailored specifically to your chosen service</p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="booking-section">
        <div className="container">
          <div className="book-now-form-wrapper">
            <form className="booking-form book-now-form" onSubmit={handleSubmit}>
              <h2>
                {category === 'photography' && '📸 Photography & Video Booking'}
                {category === 'decoration' && '🌸 Wedding Decoration Booking'}
                {category === 'music' && '🎵 Music & Entertainment Booking'}
                {category === 'destination' && '🏖️ Destination Wedding Booking'}
                {category === 'catering' && '🍽️ Catering & Food Experience Booking'}
                {category === 'makeup' && '💄 Bridal Makeup & Styling Booking'}
                {category === 'ring-ceremony' && '💍 Ring Ceremony Booking'}
                {category === 'wedding-ceremony' && '👑 Wedding Ceremony Booking'}
                {category === 'general' && '✨ Wedding Service Booking'}
              </h2>


              {/* Client Info (Pre-filled for logged in users) */}
              <div className="form-group">
                <label htmlFor="bookingName">Full Name *</label>
                <input type="text" id="bookingName" name="name" required placeholder="Your full name" value={formData.name} onChange={handleChange} readOnly style={{ backgroundColor: '#f4f4f4', color: '#777', cursor: 'not-allowed' }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bookingEmail">Email *</label>
                  <input type="email" id="bookingEmail" name="email" required placeholder="your@email.com" value={formData.email} onChange={handleChange} readOnly style={{ backgroundColor: '#f4f4f4', color: '#777', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="bookingPhone">Phone *</label>
                  <input type="tel" id="bookingPhone" name="phone" required placeholder="(555) 000-0000" value={formData.phone} onChange={handleChange} readOnly style={{ backgroundColor: '#f4f4f4', color: '#777', cursor: 'not-allowed' }} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bookingService">Service Title / Name *</label>
                <input
                  type="text"
                  id="bookingService"
                  name="service"
                  required
                  placeholder="e.g. Pre-Wedding Photoshoot, Floral Mandap Decor, DJ & Sound Console, Bridal Styling"
                  value={formData.service}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookingDate">Preferred Event / Shoot Date *</label>
                <input type="date" id="bookingDate" name="date" required value={formData.date} onChange={handleChange} />
              </div>

              {/* ============================================================== */}
              {/* DYNAMIC SERVICE SPECIFIC SECTIONS                              */}
              {/* ============================================================== */}

              {/* 1. PHOTOGRAPHY & VIDEOGRAPHY */}
              {category === 'photography' && (
                <div className="dynamic-service-box">
                  <span className="dynamic-service-badge">Photography Requirements</span>
                  <h3>📸 Photoshoot & Media Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Shoot Type *</label>
                      <select name="shootType" value={formData.shootType} onChange={handleChange}>
                        <option value="Pre-Wedding Photoshoot">Pre-Wedding Photoshoot</option>
                        <option value="Cinematic Video Shoot">Cinematic Video Shoot</option>
                        <option value="Full Wedding Day Candid + Traditional">Full Wedding Day Candid + Traditional</option>
                        <option value="Pre + Post Wedding Combo">Pre + Post Wedding Combo</option>
                        <option value="Drone & Cinematic Highlights">Drone & Cinematic Highlights</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Coverage Duration *</label>
                      <select name="shootDuration" value={formData.shootDuration} onChange={handleChange}>
                        <option value="Half Day (4-5 Hours)">Half Day (4-5 Hours)</option>
                        <option value="Full Day (8-10 Hours)">Full Day (8-10 Hours)</option>
                        <option value="2 Days (Sangeet + Wedding)">2 Days (Sangeet + Wedding)</option>
                        <option value="3+ Days Multi-Event">3+ Days Multi-Event</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Preferred Shoot Location / City *</label>
                    <input type="text" name="shootLocation" required placeholder="e.g. Udaipur Palaces, Outdoor Beach Resort, Studio" value={formData.shootLocation} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Deliverables Preference</label>
                    <select name="deliverables" value={formData.deliverables} onChange={handleChange}>
                      <option value="Cinematic Teaser + 4K Video + Edited Photos">Cinematic Teaser + 4K Video + Edited Photos</option>
                      <option value="Traditional Album + Full Length Video">Traditional Album + Full Length Video</option>
                      <option value="Raw Footage + Edited Highlights Reel">Raw Footage + Edited Highlights Reel</option>
                      <option value="All-Inclusive Photo Album, Drone Film & Teasers">All-Inclusive Photo Album, Drone Film & Teasers</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 2. DECORATION */}
              {category === 'decoration' && (
                <div className="dynamic-service-box">
                  <span className="dynamic-service-badge">Decoration Specifications</span>
                  <h3>🌸 Decoration & Venue Styling</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Decor Focus *</label>
                      <select name="decorType" value={formData.decorType} onChange={handleChange}>
                        <option value="Mandap & Vow Stage">Mandap & Vow Stage</option>
                        <option value="Reception Grand Backdrop">Reception Grand Backdrop</option>
                        <option value="Floral Entrance Pathway">Floral Entrance Pathway</option>
                        <option value="Haldi & Mehndi Yellow Theme">Haldi & Mehndi Yellow Theme</option>
                        <option value="Full Venue Luxury Thematic Decor">Full Venue Luxury Thematic Decor</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Venue Space Type *</label>
                      <select name="venueSpace" value={formData.venueSpace} onChange={handleChange}>
                        <option value="Indoor Banquet Hall">Indoor Banquet Hall</option>
                        <option value="Open Lawn / Farmhouse">Open Lawn / Farmhouse</option>
                        <option value="Poolside Setup">Poolside Setup</option>
                        <option value="Beachfront / Sand">Beachfront / Sand</option>
                        <option value="Courtyard / Private Home">Courtyard / Private Home</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Color Palette / Theme Preference</label>
                    <input type="text" name="colorTheme" placeholder="e.g. Pastel Pink & Gold, Royal Crimson, White Flora & Fairy Lights" value={formData.colorTheme} onChange={handleChange} />
                  </div>
                </div>
              )}

              {/* 3. MUSIC & DJ */}
              {category === 'music' && (
                <div className="dynamic-service-box">
                  <span className="dynamic-service-badge">Music & Sound Specifications</span>
                  <h3>🎵 Music & Entertainment Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Performance Type *</label>
                      <select name="musicType" value={formData.musicType} onChange={handleChange}>
                        <option value="Club-Style DJ Setup with Visuals">Club-Style DJ Setup with Visuals</option>
                        <option value="Live Sufi / Bollywood Band">Live Sufi / Bollywood Band</option>
                        <option value="Family Sangeet Choreography">Family Sangeet Choreography</option>
                        <option value="Live Dhol & Punjabi Troupe">Live Dhol & Punjabi Troupe</option>
                        <option value="Emcee / Anchor & Game Host">Emcee / Anchor & Game Host</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Performance Duration *</label>
                      <select name="performanceDuration" value={formData.performanceDuration} onChange={handleChange}>
                        <option value="Evening Party (3-4 Hours)">Evening Party (3-4 Hours)</option>
                        <option value="Late Night Sangeet (5-6 Hours)">Late Night Sangeet (5-6 Hours)</option>
                        <option value="Full Day Music Flow">Full Day Music Flow</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Stage & Sound Setup</label>
                    <select name="soundSetup" value={formData.soundSetup} onChange={handleChange}>
                      <option value="Standard DJ & Sound Console">Standard DJ & Sound Console</option>
                      <option value="Concert Trussing & Moving Heads Lights">Concert Trussing & Moving Heads Lights</option>
                      <option value="LED Video Wall + Interactive Dance Floor">LED Video Wall + Interactive Dance Floor</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 4. DESTINATION WEDDING */}
              {category === 'destination' && (
                <div className="dynamic-service-box">
                  <span className="dynamic-service-badge">Destination Details</span>
                  <h3>🏖️ Destination & Hospitality Specifications</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Preferred Destination *</label>
                      <select name="destinationCity" value={formData.destinationCity} onChange={handleChange}>
                        <option value="Udaipur, Rajasthan">Udaipur, Rajasthan (Royal Palaces)</option>
                        <option value="Goa Beaches">Goa Beaches (Seaside Vows)</option>
                        <option value="Jaipur Heritage">Jaipur Heritage (Forts & Haveli)</option>
                        <option value="Kerala Backwaters">Kerala Backwaters (Scenic & Tropical)</option>
                        <option value="Hill Station (Mussoorie/Shimla)">Hill Station (Mussoorie / Shimla)</option>
                        <option value="International (Dubai, Thailand)">International (Dubai, Thailand, Bali)</option>
                        <option value="Other Destination">Other Destination</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Event Duration *</label>
                      <select name="eventDays" value={formData.eventDays} onChange={handleChange}>
                        <option value="2 Days / 1 Night">2 Days / 1 Night</option>
                        <option value="3 Days / 2 Nights">3 Days / 2 Nights</option>
                        <option value="4+ Days Grand Destination">4+ Days Grand Destination</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Approx Guests Traveling *</label>
                      <input type="number" name="guests" min="10" max="1500" required placeholder="e.g. 150 guests" value={formData.guests} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Accommodation / Stay Required *</label>
                      <select name="stayRequired" value={formData.stayRequired} onChange={handleChange}>
                        <option value="Yes - Full Resort / Hotel Booking Required">Yes - Full Resort / Hotel Booking</option>
                        <option value="Yes - 20-50 Rooms Block Required">Yes - 20 to 50 Rooms Block</option>
                        <option value="No - Stay Arranged Privately">No - Stay Arranged Privately</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CATERING */}
              {category === 'catering' && (
                <div className="dynamic-service-box">
                  <span className="dynamic-service-badge">Catering Specifications</span>
                  <h3>🍽️ Dining & Menu Preferences</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Dining Style *</label>
                      <select name="diningStyle" value={formData.diningStyle} onChange={handleChange}>
                        <option value="Grand Buffet Spread">Grand Buffet Spread</option>
                        <option value="Live Interactive Food Counters">Live Interactive Food Counters (Chaat, Pasta, Grills)</option>
                        <option value="Plated Sit-Down Dinner">Plated Sit-Down Dinner</option>
                        <option value="Cocktail Snacks & Drinks">Cocktail Snacks & Drinks</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Expected Guests / Plates *</label>
                      <input type="number" name="guests" min="20" max="2000" required placeholder="Number of guests" value={formData.guests} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cuisine Preference *</label>
                    <select name="cuisinePreference" value={formData.cuisinePreference} onChange={handleChange}>
                      <option value="Pure Vegetarian">Pure Vegetarian Special</option>
                      <option value="Multi-Cuisine (North & South Indian + Continental)">Multi-Cuisine (North & South Indian + Continental)</option>
                      <option value="Royal Mughlai & Indian">Royal Mughlai & Indian</option>
                      <option value="Jain Food Options Available">Jain Food Options Available</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 6. MAKEUP & STYLING */}
              {category === 'makeup' && (
                <div className="dynamic-service-box">
                  <span className="dynamic-service-badge">Styling Specifications</span>
                  <h3>💄 Makeup & Styling Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Service Needed *</label>
                      <select name="stylingService" value={formData.stylingService} onChange={handleChange}>
                        <option value="Bridal HD / Airbrush Makeup">Bridal HD / Airbrush Makeup</option>
                        <option value="Groom Styling & Grooming">Groom Styling & Grooming</option>
                        <option value="Bridal Mehndi + Family Mehndi">Bridal Mehndi + Family Mehndi</option>
                        <option value="Hair Styling & Saree/Dupatta Draping">Hair Styling & Saree / Dupatta Draping</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Number of Persons *</label>
                      <select name="personCount" value={formData.personCount} onChange={handleChange}>
                        <option value="Bride Only">Bride Only</option>
                        <option value="Bride + 2-3 Family Members">Bride + 2-3 Family Members</option>
                        <option value="Bridal Party / Group (5+ Persons)">Bridal Party / Group (5+ Persons)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Location Preference</label>
                    <select name="makeupLocation" value={formData.makeupLocation} onChange={handleChange}>
                      <option value="At Wedding Venue / Hotel Room">At Wedding Venue / Hotel Room</option>
                      <option value="At Bridal Home">At Bridal Home</option>
                      <option value="Visit Our Styling Studio">Visit Our Styling Studio</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 7. CEREMONIES & GENERAL WEDDING */}
              {['wedding-ceremony', 'ring-ceremony', 'general'].includes(category) && (
                <div className="dynamic-service-box">
                  <span className="dynamic-service-badge">Event Logistics</span>
                  <h3>💍 Ceremony & Venue Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bookingEventType">Event Type *</label>
                      <select id="bookingEventType" name="eventType" required value={formData.eventType} onChange={handleChange}>
                        <option value="Wedding">Wedding</option>
                        <option value="Ring Ceremony">Ring Ceremony / Engagement</option>
                        <option value="Reception">Reception</option>
                        <option value="Sangeet">Sangeet</option>
                        <option value="Mehendi">Mehendi</option>
                        <option value="Haldi">Haldi</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="bookingVenue">Venue Preference</label>
                      <select id="bookingVenue" name="venue" value={formData.venue} onChange={handleChange}>
                        <option value="Indoor Banquet Hall">Indoor Banquet Hall</option>
                        <option value="Outdoor Lawn">Outdoor Lawn</option>
                        <option value="Garden Resort">Garden Resort</option>
                        <option value="Beachfront">Beachfront</option>
                        <option value="Palace / Heritage Hotel">Palace / Heritage Hotel</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="bookingGuests">Approximate Number of Guests *</label>
                    <input type="number" id="bookingGuests" name="guests" min="1" max="2500" required placeholder="Approximate guest count" value={formData.guests} onChange={handleChange} />
                  </div>
                </div>
              )}

              {/* Common Budget & Location Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bookingBudget">Budget Range</label>
                  <select id="bookingBudget" name="budget" value={formData.budget} onChange={handleChange}>
                    <option value="">Select budget range</option>
                    <option value="Under 1 Lakh">Under ₹1 Lakh</option>
                    <option value="1-3 Lakhs">₹1 - ₹3 Lakhs</option>
                    <option value="3-5 Lakhs">₹3 - ₹5 Lakhs</option>
                    <option value="5-10 Lakhs">₹5 - ₹10 Lakhs</option>
                    <option value="Above 10 Lakhs">Above ₹10 Lakhs</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="bookingAddress">City / Venue Address</label>
                  <input type="text" id="bookingAddress" name="address" placeholder="Event location or venue address" value={formData.address} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bookingNotes">Additional Notes or Special Requests</label>
                <textarea id="bookingNotes" name="notes" placeholder="Tell us about special requests, themes, timings, or specific preferences..." value={formData.notes} onChange={handleChange}></textarea>
              </div>

              <div className="form-message">{message}</div>
              <button type="submit" className="btn btn-primary">Submit Booking</button>
              <a href="/bookings" className="btn btn-secondary" style={{ marginLeft: '10px' }}>View My Bookings</a>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default BookNow
