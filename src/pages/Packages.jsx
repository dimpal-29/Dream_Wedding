import { Link } from 'react-router-dom'
import '../style.css'
import '../packages.css'

function Packages() {
  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Wedding Packages</h1>
          <p>Choose the perfect package for your dream celebration</p>
        </div>
      </section>

      {/* Packages */}
      <section className="packages-section">
        <div className="container">
          <div className="packages-grid">
            <div className="package-box">
              <div className="package-header">
                <h3>Essential</h3>
                <p className="package-desc">Perfect for intimate gatherings</p>
                <div className="package-price">$2,499</div>
                <p className="package-note">Starting price</p>
              </div>
              <ul className="package-features">
                <li>Basic floral decoration</li>
                <li>Up to 50 guests</li>
                <li>4-hour photography coverage</li>
                <li>Buffet-style catering</li>
                <li>Basic sound system</li>
                <li>1 coordinator</li>
              </ul>
              <Link to="/book-package?package=Essential%20Package" className="btn btn-secondary">Select Package</Link>
            </div>

            <div className="package-box featured">
              <div className="featured-badge">Most Popular</div>
              <div className="package-header">
                <h3>Premium</h3>
                <p className="package-desc">Our most popular choice</p>
                <div className="package-price">$4,999</div>
                <p className="package-note">Starting price</p>
              </div>
              <ul className="package-features">
                <li>Full venue decoration</li>
                <li>Up to 150 guests</li>
                <li>8-hour photography + videography</li>
                <li>Plated dinner service</li>
                <li>Live band or DJ</li>
                <li>Premium floral arrangements</li>
                <li>2 coordinators</li>
              </ul>
              <Link to="/book-package?package=Premium%20Package" className="btn btn-primary">Select Package</Link>
            </div>

            <div className="package-box">
              <div className="package-header">
                <h3>Luxury</h3>
                <p className="package-desc">The ultimate experience</p>
                <div className="package-price">$8,999</div>
                <p className="package-note">Starting price</p>
              </div>
              <ul className="package-features">
                <li>Luxury decoration & design</li>
                <li>300+ guests capacity</li>
                <li>Full-day photography & videography</li>
                <li>Premium 5-course meal</li>
                <li>Open bar & cocktail hour</li>
                <li>Live band + DJ combo</li>
                <li>Wedding cake & dessert bar</li>
                <li>Dedicated planning team</li>
              </ul>
              <Link to="/book-package?package=Luxury%20Package" className="btn btn-secondary">Select Package</Link>
            </div>
          </div>

          <div className="custom-package">
            <h2>Need a Custom Package?</h2>
            <p>Every wedding is unique. Contact us to create a tailored package that fits your vision and budget.</p>
            <Link to="/contact" className="btn btn-primary">Get a Quote</Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Packages
