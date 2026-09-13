import { useState } from 'react'
import '../style.css'
import '../about.css'

function About() {
  const [selectedMember, setSelectedMember] = useState(null)

  const teamMembers = [
    {
      id: 'maria',
      name: 'Maria Thompson',
      role: 'Founder & Lead Planner',
      specialty: '💍 Royal & Destination Weddings',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
      experience: '14+ Years',
      weddings: '750+ Celebrations',
      shortBio: '14+ years of creating unforgettable fairy-tale weddings with heartfelt elegance.',
      fullStory: `Maria's passion began in 2010 when she coordinated her sister's destination wedding in Udaipur. Witnessing the magic of two families uniting amidst flowers, music, and royal architecture inspired her to launch Dream Wedding. Over the past 14 years, she has orchestrated intimate royal palace celebrations, beachside vows, and grand city ballroom events. Her superpower is understanding each couple's personal love story and transforming subtle emotional moments into once-in-a-lifetime experiences.`,
      philosophy: `"Your wedding isn't just a lavish event; it is the grand opening chapter of your greatest adventure together. Every small glance, every flower, and every melody should feel authentically yours."`
    },
    {
      id: 'david',
      name: 'David Reynolds',
      role: 'Creative Director',
      specialty: '🌸 Theme & Stage Decor',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80',
      experience: '10+ Years',
      weddings: '500+ Unique Sets',
      shortBio: 'Transforms ordinary spaces into breathtaking floral wonderlands and mandap designs.',
      fullStory: `With a master's background in fine arts and architectural spatial design, David perceives banquet halls, open lawns, and palace courtyards as blank canvases. He specializes in bespoke floral mandaps, fairy-light canopies, glass walkways, and grand thematic stages. He stays ahead of international wedding design trends, hand-selecting floral imports, custom draperies, and kinetic ambient lighting to create breathtaking atmospheres.`,
      philosophy: `"Great wedding design must evoke profound emotion. When you and your guests step into the venue, the atmosphere should take your breath away like stepping into a romantic dream."`
    },
    {
      id: 'aarohi',
      name: 'Aarohi Sharma',
      role: 'Senior Event Coordinator',
      specialty: '✨ Hospitality & Rituals',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80',
      experience: '8+ Years',
      weddings: '400+ Ceremonies',
      shortBio: 'Ensures smooth hospitality, timely rituals, and seamless logistics on your special day.',
      fullStory: `Aarohi is the reassuring heartbeat behind every high-energy celebration. Having successfully coordinated mega-weddings with guest lists exceeding 1,500 people, she effortlessly manages Haldi, Mehndi, Sangeet, Muhurat timings, VIP logistics, and emergency wardrobe touch-ups. Her calm demeanor and warm empathy ensure that both sets of parents and the couple remain completely relaxed, laughing and savoring every precious second.`,
      philosophy: `"Flawless coordination is invisible. When logistics flow effortlessly behind the scenes, families can fully immerse themselves in joy, rituals, and unforgettable memories."`
    },
    {
      id: 'vikram',
      name: 'Vikram Malhotra',
      role: 'Head of Photography',
      specialty: '📸 Cinematic Photography',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80',
      experience: '9+ Years',
      weddings: '600+ Love Stories',
      shortBio: 'Captures candid, heartfelt emotions and cinematic memories that last forever.',
      fullStory: `Vikram is an award-winning wedding cinematographer who believes that the true beauty of a wedding lies in unscripted moments: the bride's father wiping away a hidden tear, a tender glance exchanged across a crowded dance floor, or bursts of spontaneous laughter during the vows. Equipped with cinema-grade cameras and aerial drones, Vikram and his crew produce timeless films that couples re-watch on every anniversary.`,
      philosophy: `"We don't stage poses; we capture genuine heartbeats. Our goal is that decades from now, you will look back at your wedding photos and instantly feel that exact same flutter in your heart."`
    }
  ]

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Our Story</h1>
          <p>Creating dream weddings since 2010</p>
        </div>
      </section>

      {/* About Content */}
      <section className="about-content">
        <div className="container">
          <div className="about-grid">
            <div className="about-image">
              <img src="https://www.shutterstock.com/image-photo/diverse-couple-happy-coworkers-standing-600nw-2695542391.jpg" alt="Dream Wedding team" />
            </div>
            <div className="about-text">
              <h2>Where Love Meets Perfection</h2>
              <p>Dream Wedding was born from a simple belief: every couple deserves a wedding day that reflects their unique love story. Founded in 2010 by wedding enthusiast Maria Thompson, our company began as a small boutique service and has grown into a full-scale wedding planning powerhouse.</p>
              <p>Our journey started when Maria planned her own sister's wedding. The joy of bringing a vision to life—the flowers, the music, the magic of that first dance—inspired her to help other couples experience the same perfection. Today, our team of over 50 dedicated professionals has orchestrated more than 2,000 weddings.</p>
            </div>
          </div>

          <div className="story-section">
            <h2>Our Philosophy</h2>
            <p className="story-lead">We believe that your wedding day should be as unique as your love story. Our approach blends creativity with meticulous planning, ensuring every detail exceeds your expectations while you focus on what matters most—celebrating your love.</p>
          </div>

          <div className="values-grid">
            <div className="value-card">
              <div className="value-image">
                <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80" alt="Passion" />
              </div>
              <h3>Passion</h3>
              <p>We pour our hearts into every wedding we plan. Your joy is our inspiration.</p>
            </div>
            <div className="value-card">
              <div className="value-image">
                <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" alt="Excellence" />
              </div>
              <h3>Excellence</h3>
              <p>From the smallest detail to the grandest moment, we deliver only the best.</p>
            </div>
            <div className="value-card">
              <div className="value-image">
                <img src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=400&q=80" alt="Trust" />
              </div>
              <h3>Trust</h3>
              <p>We build lasting relationships with our couples through transparency and reliability.</p>
            </div>
          </div>

          {/* Our Team Section */}
          <div className="our-team-section">
            <div className="team-section-header">
              <span className="team-badge">Meet the Experts</span>
              <h2>Our Team</h2>
              <p>The passionate planners, visionary designers, and coordinators dedicated to crafting your dream celebration. Click on any member to read their story!</p>
            </div>
            <div className="team-grid">
              {teamMembers.map((member) => (
                <div 
                  className="team-card" 
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  title={`Click to read ${member.name}'s story`}
                >
                  <div className="team-image-wrapper">
                    <img src={member.image} alt={member.name} />
                  </div>
                  <div className="team-info">
                    <span className="team-role">{member.role}</span>
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-bio">{member.shortBio}</p>
                    <span className="team-specialty">{member.specialty}</span>
                    <span className="team-read-story-btn">
                      Read Full Story &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Member Story Modal */}
          {selectedMember && (
            <div 
              className="team-modal-backdrop"
              onClick={() => setSelectedMember(null)}
            >
              <div 
                className="team-modal-box"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  type="button"
                  className="team-modal-close"
                  onClick={() => setSelectedMember(null)}
                  aria-label="Close"
                >
                  &times;
                </button>

                <div className="team-modal-header">
                  <img 
                    src={selectedMember.image} 
                    alt={selectedMember.name} 
                    className="team-modal-img" 
                  />
                  <div className="team-modal-intro">
                    <span className="team-modal-role">{selectedMember.role}</span>
                    <h3>{selectedMember.name}</h3>
                    <div className="team-modal-stats">
                      <span className="team-modal-stat-pill">⏳ {selectedMember.experience}</span>
                      <span className="team-modal-stat-pill">🎉 {selectedMember.weddings}</span>
                      <span className="team-modal-stat-pill">{selectedMember.specialty}</span>
                    </div>
                  </div>
                </div>

                <div className="team-modal-body">
                  <h4>📖 The Journey & Passion</h4>
                  <p className="team-modal-story-text">
                    {selectedMember.fullStory}
                  </p>

                  <div className="team-modal-quote">
                    <strong>My Wedding Philosophy:</strong>
                    <p>{selectedMember.philosophy}</p>
                  </div>
                </div>

                <div className="team-modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setSelectedMember(null)}
                  >
                    Close Story
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="about-gallery">
            <h2>Moments We've Created</h2>
            <div className="gallery-grid">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWG9dNpnVQIBtojyZqH--4vYvM7FVLV9F73Q&s" alt="Wedding ceremony" />
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnrDb_u5fKFyG7xtn7TqAvN8VLL8TBUyLaDQ&s" alt="Wedding reception" />
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiao719lqvQiCpNmeHMKMcgeu7F3MjEzgQGw&s" alt="Wedding decor" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default About
