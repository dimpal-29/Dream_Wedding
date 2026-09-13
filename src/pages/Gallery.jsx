import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../style.css'
import '../gallery.css'
import { reviewsApi } from '../services/api'

function Gallery() {
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    coupleImg: '',
    rating: '5',
    text: ''
  })
  const [message, setMessage] = useState('')
  const [activeStory, setActiveStory] = useState(null)

  const blogStories = [
    {
      id: 1,
      title: 'Ring Ceremony : Arjun + Sneha',
      date: '11 Dec',
      image: '/images/blog1.jpg',
      story: `Arjun and Sneha's love story began in college, where a chance encounter in the library turned into hours of conversation that neither wanted to end. Three years later, Arjun knew it was time.\n\nThe ring ceremony was held at The Grand Palace Banquets, adorned with cascading white roses and soft golden fairy lights. As the sun dipped below the horizon, the venue transformed into a magical wonderland.\n\nSneha walked down the aisle in a stunning pastel pink lehenga, her eyes glistening with happy tears. When Arjun slipped the diamond ring onto her finger, the crowd erupted in applause. Their families, who had traveled from across the country, blessed the couple with love and prayers.\n\nThe evening was filled with traditional rituals, heartfelt speeches from friends, and a surprise dance performance by the couple's college friends.\n\nDream Wedding handled every detail with precision \u2014 from the floral arrangements to the live classical music, ensuring that this night would be etched in everyone's memory forever.`
    },
    {
      id: 2,
      title: 'Wedding Ceremony : Rohan + Priya',
      date: '25 July',
      image: '/images/blog2.jpeg',
      story: `Rohan and Priya's wedding was nothing short of a royal affair. Having dated for five years, the couple wanted a grand traditional wedding that honored both their families' heritage.\n\nThe three-day celebration kicked off with a vibrant Mehndi ceremony at Priya's family home, where the courtyard was transformed with marigold canopies and colorful Rajasthani drapes. The Sangeet night featured choreographed dances from both families.\n\nOn the wedding day, the mandap was set up under a canopy of 10,000 roses. Rohan arrived on a decorated mare, accompanied by a dhol band and fireworks. Priya's bridal entry in a deep red Sabyasachi lehenga left everyone breathless.\n\nThe pheras were performed as the evening sky turned gold. Tears of joy, laughter, and endless blessings marked every moment.\n\nThe reception that followed was a glamorous affair with a five-course gourmet dinner, a live band, and a specially designed wedding cake that stood five tiers tall. Over 800 guests attended, making it the most talked-about wedding of the season.\n\nDream Wedding coordinated every element seamlessly \u2014 from the baraat procession to the bidaai, ensuring that Rohan and Priya's big day was truly a dream come true.`
    },
    {
      id: 3,
      title: 'Reception : Kabir + Zara',
      date: '3 Feb',
      image: '/images/couple.jpeg',
      story: `Kabir and Zara's reception was an enchanting evening under the stars that guests still talk about. After a private nikah ceremony with close family, the couple wanted their reception to be an inclusive, joyful celebration for all their loved ones.\n\nThe outdoor venue was set up in a sprawling farmhouse garden, with crystal chandeliers hanging from the old oak trees and pathways lit with hundreds of candles. The theme was "Starlit Garden" \u2014 a blend of rustic charm and modern elegance.\n\nZara made a stunning entrance in a champagne gold gown, while Kabir complemented her in a classic black tuxedo. Their first dance to \"Perfect\" by Ed Sheeran had the entire crowd swaying.\n\nThe evening featured a live jazz band, a photo booth with quirky props, and a dessert bar with 20 different options. The highlight was a surprise fireworks display choreographed to the couple's favorite song.\n\nFriends delivered heartwarming speeches, recounting stories of how Kabir and Zara met at a friend's destination wedding \u2014 proving that weddings truly do bring people together.\n\nAs the night wound down, guests released sky lanterns, each carrying a wish for the newlyweds. It was a picture-perfect ending to a picture-perfect love story.\n\nDream Wedding brought their vision to life, managing everything from the d\u00e9cor and catering to the entertainment and logistics, making sure every moment was magical.`
    }
  ]

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const data = await reviewsApi.getAll()
      setReviews(data)
    } catch (error) {
      console.error('Failed to load reviews:', error)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()

    if (!reviewForm.name || !reviewForm.email || !reviewForm.text) {
      setMessage('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(reviewForm.email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    const newReview = {
      name: reviewForm.name,
      email: reviewForm.email,
      coupleImg: reviewForm.coupleImg || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
      rating: parseInt(reviewForm.rating, 10),
      text: reviewForm.text,
      date: new Date().toLocaleDateString()
    }

    try {
      await reviewsApi.create(newReview)
      setReviewForm({
        name: '',
        email: '',
        coupleImg: '',
        rating: '5',
        text: ''
      })
      setMessage('Thank you for your review!')
      loadReviews()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to submit review. Please try again.')
    }
  }

  const handleInputChange = (e) => {
    setReviewForm({
      ...reviewForm,
      [e.target.name]: e.target.value
    })
  }

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Our Gallery</h1>
          <p>Glimpse into the magical weddings we've created</p>
        </div>
      </section>

      {/* FROM THE BLOG */}
      <section className="blog-section">
        <div className="container">
          <div className="section-header">
            <h2>FROM THE BLOG</h2>
          </div>
          <div className="blog-list">
            <article className="blog-card">
              <div className="blog-card-image">
                <img src="/images/blog1.jpg" alt="Ring ceremony" />
                <div className="blog-date-badge">11 Dec</div>
              </div>
              <div className="blog-card-content">
                <p className="blog-author">Post by Dream Wedding</p>
                <h3>Ring ceremony : Arjun + Sneha</h3>
                <p className="blog-desc">A beautiful moment when two hearts become one. The ring exchange ceremony celebrated with elegance and joy.</p>
                <button className="blog-read-story-btn" onClick={() => setActiveStory(blogStories[0])}>
                  <i className="fa-solid fa-book-open" style={{ marginRight: '6px' }}></i> Read Full Story
                </button>
              </div>
            </article>
            <article className="blog-card">
              <div className="blog-card-image">
                <img src="/images/blog2.jpeg" alt="Wedding ceremony" />
                <div className="blog-date-badge">25 July</div>
              </div>
              <div className="blog-card-content">
                <p className="blog-author">Post by Dream Wedding</p>
                <h3>Wedding ceremony: Rohan + Priya</h3>
                <p className="blog-desc">A grand traditional wedding celebration. Every detail crafted with love for the perfect beginning of their journey.</p>
                <button className="blog-read-story-btn" onClick={() => setActiveStory(blogStories[1])}>
                  <i className="fa-solid fa-book-open" style={{ marginRight: '6px' }}></i> Read Full Story
                </button>
              </div>
            </article>
            <article className="blog-card">
              <div className="blog-card-image">
                <img src="/images/couple.jpeg" alt="Reception" />
                <div className="blog-date-badge">3 Feb</div>
              </div>
              <div className="blog-card-content">
                <p className="blog-author">Post by Dream Wedding</p>
                <h3>Reception : Kabir + Zara</h3>
                <p className="blog-desc">An unforgettable reception under the stars. Dance, music, and celebration as family and friends came together.</p>
                <button className="blog-read-story-btn" onClick={() => setActiveStory(blogStories[2])}>
                  <i className="fa-solid fa-book-open" style={{ marginRight: '6px' }}></i> Read Full Story
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* What Our BRIDES Say */}
      <section className="brides-section">
        <div className="section-header">
          <h2>What Our BRIDES Say</h2>
        </div>
        <div className="container">
          <div className="brides-grid">
            <div className="bride-card">
              <div className="bride-photo">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80" alt="Sarah" />
              </div>
              <div className="bride-content">
                <p className="bride-quote">"Every detail was perfect. Dream Wedding turned our vision into reality. I couldn't have asked for a more beautiful day."</p>
                <p className="bride-name">Sarah</p>
              </div>
            </div>
            <div className="bride-card">
              <div className="bride-photo">
                <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80" alt="Emily" />
              </div>
              <div className="bride-content">
                <p className="bride-quote">"The decoration was breathtaking and the team was so supportive. My wedding day was a dream come true."</p>
                <p className="bride-name">Emily</p>
              </div>
            </div>
            <div className="bride-card">
              <div className="bride-photo">
                <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80" alt="Jessica" />
              </div>
              <div className="bride-content">
                <p className="bride-quote">"From the first consultation to the last dance, everything exceeded our expectations. Highly recommend Dream Wedding!"</p>
                <p className="bride-name">Jessica</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Our GROOMS Say */}
      <section className="grooms-section">
        <div className="section-header">
          <h2>What Our GROOMS Say</h2>
        </div>
        <div className="container">
          <div className="grooms-grid">
            <div className="groom-card">
              <div className="groom-photo">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" alt="Michael" />
              </div>
              <div className="groom-content">
                <p className="groom-quote">"Dream Wedding made our day absolutely perfect. The team was professional and every detail exceeded our expectations."</p>
                <p className="groom-name">Michael</p>
              </div>
            </div>
            <div className="groom-card">
              <div className="groom-photo">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" alt="James" />
              </div>
              <div className="groom-content">
                <p className="groom-quote">"From planning to execution, everything was flawless. Our guests are still talking about how beautiful the wedding was."</p>
                <p className="groom-name">James</p>
              </div>
            </div>
            <div className="groom-card">
              <div className="groom-photo">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80" alt="David" />
              </div>
              <div className="groom-content">
                <p className="groom-quote">"The photographers captured every moment beautifully. We relive our wedding day every time we look at the photos."</p>
                <p className="groom-name">David</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid - Couple Photos */}
      <section className="gallery-section">
        <div className="section-header">
          <h2>Our Wedding Couples</h2>
        </div>
        <div className="container">
          <div className="gallery-grid">
            {/* 1. Western / Church Garden Wedding */}
            <div className="gallery-item">
              <img src="/images/couple1.png" alt="Church Garden Wedding" />
              <div className="gallery-overlay">
                <span>Church Garden Wedding</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Ethan & Sophia</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Garden Altar Vows</p>
                <p>"Exchanging our vows under the stone floral arch surrounded by blooming white roses felt like a true fairytale!"</p>
              </div>
            </div>

            {/* 2. Royal Indian Varmala */}
            <div className="gallery-item">
              <img src="/images/couple2.png" alt="Royal Indian Varmala" />
              <div className="gallery-overlay">
                <span>Royal Indian Varmala</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Raj & Ananya</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Varmala Ceremony</p>
                <p>"Exchanging rose garlands under the glowing chandeliers with rose petals showering down was unforgettable!"</p>
              </div>
            </div>

            {/* 3. Sunset Beach Wedding */}
            <div className="gallery-item">
              <img src="/images/couple3.png" alt="Sunset Beach Wedding" />
              <div className="gallery-overlay">
                <span>Sunset Beach Wedding</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Liam & Olivia</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Beachside Vows</p>
                <p>"Walking barefoot in the surf during sunset and whispering our vows to the rhythm of ocean waves."</p>
              </div>
            </div>

            {/* 4. European Outdoor Aisle Ceremony */}
            <div className="gallery-item">
              <img src="/images/couple4.png" alt="Outdoor Aisle & Confetti" />
              <div className="gallery-overlay">
                <span>Outdoor Aisle & Confetti</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Lucas & Charlotte</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Confetti Aisle Walk</p>
                <p>"Walking down the flower-lined aisle under a shower of white petals right after our 'I do' moment!"</p>
              </div>
            </div>

            {/* 5. Grand Ballroom Reception */}
            <div className="gallery-item">
              <img src="/images/couple5.png" alt="Grand Ballroom Reception" />
              <div className="gallery-overlay">
                <span>Grand Ballroom Reception</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Alexander & Isabella</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the First Dance</p>
                <p>"Stepping onto the ballroom floor beneath the grand crystal chandelier for our first dance was pure magic."</p>
              </div>
            </div>

            {/* 6. Vibrant Sangeet Night */}
            <div className="gallery-item">
              <img src="/images/couple6.png" alt="Vibrant Sangeet Night" />
              <div className="gallery-overlay">
                <span>Vibrant Sangeet Night</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Kabir & Simran</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Sangeet Dance Night</p>
                <p>"Our choreographed dance performance on the illuminated stage had the whole family cheering all night!"</p>
              </div>
            </div>

            {/* 7. Pastel Heritage Wedding */}
            <div className="gallery-item">
              <img src="/images/couple7.jpeg" alt="Pastel Heritage Wedding" />
              <div className="gallery-overlay">
                <span>Pastel Heritage Wedding</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Dev & Ishita</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Royal Phere Rituals</p>
                <p>"That tender moment right after our sacred phere — draped in matching blush pinks with blessings all around."</p>
              </div>
            </div>

            {/* 8. Haldi & Mehndi Fun */}
            <div className="gallery-item">
              <img src="/images/couple8.jpeg" alt="Haldi & Mehndi Moments" />
              <div className="gallery-overlay">
                <span>Haldi & Mehndi Moments</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Aman & Natasha</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Haldi & Mehndi Fun</p>
                <p>"Sitting on the lush lawn laughing together while he lovingly fixed my maang tikka amidst dhol beats!"</p>
              </div>
            </div>

            {/* 9. Vintage Cathedral Portrait */}
            <div className="gallery-item">
              <img src="/images/images.jpeg" alt="Vintage Cathedral Portrait" />
              <div className="gallery-overlay">
                <span>Vintage Cathedral Portrait</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Julian & Clara</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Cathedral Staircase Shoot</p>
                <p>"Capturing our portraits on the historic marble stairs in our classic gown and tuxedo was timeless."</p>
              </div>
            </div>

            {/* 10. Royal Indian Vivah */}
            <div className="gallery-item">
              <img src="/images/1.jpg" alt="Royal Vivah Rituals" />
              <div className="gallery-overlay">
                <span>Royal Vivah Rituals</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Vikram & Pooja</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Sacred Vivah Mantras</p>
                <p>"Touching foreheads as the Vedic mantras echoed around the sacred fire — our eternal union blessed forever."</p>
              </div>
            </div>

            {/* 11. South Indian Muhurtham */}
            <div className="gallery-item">
              <img src="/images/couple10.jpg" alt="South Indian Muhurtham" />
              <div className="gallery-overlay">
                <span>South Indian Muhurtham</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Karthik & Revathi</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Muhurtham Ritual</p>
                <p>"Draped in pure Kanjivaram silk and fresh jasmine gajra, celebrating our union with timeless traditions."</p>
              </div>
            </div>

            {/* 12. Maharashtrian Lagna */}
            <div className="gallery-item">
              <img src="/images/couple9-1.jpg" alt="Maharashtrian Lagna" />
              <div className="gallery-overlay">
                <span>Maharashtrian Lagna</span>
              </div>
              <div className="couple-hover-popup">
                <h4>Siddharth & Tanvi</h4>
                <p className="fav-function"><i className="fa-solid fa-heart" style={{ color: '#e74c3c', marginRight: '5px' }}></i> Loved the Mundavalya Ritual</p>
                <p>"Tying the pearl Mundavalya and sharing our first joyous laughter together as husband and wife in Marathi style."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback/Review Section */}
      <section className="gallery-feedback">
        <div className="section-header">
          <h2>Share Your Experience</h2>
          <p>Tell us about your Dream Wedding experience or leave a review</p>
        </div>
        <div className="container">
          <form id="galleryReviewForm" className="review-form" onSubmit={handleReviewSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reviewName">Your Name (Couple) *</label>
                <input type="text" id="reviewName" name="name" required placeholder="John & Jane" value={reviewForm.name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="reviewEmail">Email *</label>
                <input type="email" id="reviewEmail" name="email" required placeholder="your@email.com" value={reviewForm.email} onChange={handleInputChange} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reviewCoupleImg">Couple Photo URL (optional)</label>
              <input type="url" id="reviewCoupleImg" name="coupleImg" placeholder="https://example.com/your-photo.jpg" value={reviewForm.coupleImg} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="reviewRating">Rating</label>
              <select id="reviewRating" name="rating" value={reviewForm.rating} onChange={handleInputChange}>
                <option value="5">5 Stars - Excellent</option>
                <option value="4">4 Stars - Very Good</option>
                <option value="3">3 Stars - Good</option>
                <option value="2">2 Stars - Fair</option>
                <option value="1">1 Star - Poor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reviewText">Your Review *</label>
              <textarea id="reviewText" name="text" required placeholder="Share your wedding experience with us..." value={reviewForm.text} onChange={handleInputChange}></textarea>
            </div>
            <div id="reviewMessage" className="form-message">{message}</div>
            <button type="submit" className="btn btn-primary">Submit Review</button>
          </form>
          <div id="reviewsList" className="reviews-list">
            {reviews.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888' }}>No reviews yet. Be the first to share your experience!</p>
            ) : (
              reviews.map((review, index) => (
                <div key={review.id || index} className="review-item">
                  <div className="review-couple-img">
                    <img src={review.coupleImg} alt={review.name} />
                  </div>
                  <div className="review-item-body">
                    <div className="review-item-header">
                      <span className="review-author">{review.name}</span>
                      <span className="review-rating">{renderStars(review.rating)}</span>
                    </div>
                    <p className="review-text">{review.text}</p>
                    <small style={{ color: '#888' }}>{review.date}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Story Modal */}
      {activeStory && (
        <div className="story-modal-overlay" onClick={() => setActiveStory(null)}>
          <div className="story-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="story-modal-close" onClick={() => setActiveStory(null)}>&times;</button>
            <div className="story-modal-img-wrap">
              <img src={activeStory.image} alt={activeStory.title} className="story-modal-img" />
            </div>
            <div className="story-modal-header-info">
              <span className="story-date-tag">{activeStory.date}</span>
              <h2>{activeStory.title}</h2>
            </div>
            <div className="story-modal-content">
              {activeStory.story.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Gallery
