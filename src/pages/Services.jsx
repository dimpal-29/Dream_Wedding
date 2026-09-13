import { Link } from 'react-router-dom'
import '../style.css'
import '../services.css'

function Services() {
  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Our Services</h1>
          <p>Comprehensive wedding services tailored to your vision</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="services-grid-section">
        <div className="container">
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
                  <p>Take the next step together. Our ring ceremonies create the perfect moment to exchange vows and begin your journey as one.</p>
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
                  <p>Capture every moment beautifully. Our photography and videography services preserve your special memories forever.</p>
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
                  <p>Music is a great uniter. From sangeet to reception, our live bands and DJs create unforgettable celebrations.</p>
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
                  <p>Destination weddings in paradise. Beach, hills, or heritage—we make your dream location wedding come true.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=makeup-styling" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80" alt="Makeup and Styling" />
                </div>
                <div className="service-card-text">
                  <h3>MAKEUP &amp; STYLING</h3>
                  <p>Expert bridal and groom makeup, hairstyling, and touch-up services that keep you picture-perfect throughout every ceremony.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=honeymoon" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80" alt="Honeymoon" />
                </div>
                <div className="service-card-text">
                  <h3>HONEYMOON</h3>
                  <p>Begin your forever with the perfect getaway. We plan romantic honeymoon packages tailored for you.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=catering" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80" alt="Catering" />
                </div>
                <div className="service-card-text">
                  <h3>CATERING</h3>
                  <p>Exquisite menus for every palate. From plated dinners to buffets, we cater to make your feast memorable.</p>
                </div>
              </div>
            </Link>
            <Link to="/service-detail?category=all-weddings" className="service-card-link">
              <div className="service-card-new">
                <div className="service-card-img">
                  <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80" alt="All Types of Weddings" />
                </div>
                <div className="service-card-text">
                  <h3>ALL TYPES OF WEDDINGS</h3>
                  <p>Traditional, contemporary, fusion—we plan every type of wedding. Tell us your vision and we'll bring it to life.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Packages Banner (Card Shaped within Container) */}
      <section className="services-packages-banner-section">
        <div className="container">
          <div className="services-packages-banner-card">
            <div className="services-packages-banner-content">
              <span className="services-packages-badge">✨ All-Inclusive Packages</span>
              <h2>Looking For Complete Wedding Packages?</h2>
              <p>
                Discover our curated packages crafted to make your dream celebration effortless. From intimate ceremonies to royal extravaganzas, explore our all-in-one plans.
              </p>
              <Link to="/packages" className="services-packages-btn">
                🎁 View Wedding Packages
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Services
