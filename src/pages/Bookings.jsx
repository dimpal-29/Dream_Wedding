import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../style.css'
import '../bookings.css'
import { bookingsApi } from '../services/api'

// Helper function to pick relevant Font Awesome icon
function getServiceIcon(service = '', category = '') {
  const s = (service + ' ' + category).toLowerCase()
  if (s.includes('photo') || s.includes('video') || s.includes('shoot') || s.includes('camera')) {
    return <i className="fa-solid fa-camera-retro"></i>
  }
  if (s.includes('decor') || s.includes('mandap') || s.includes('flower') || s.includes('balloon')) {
    return <i className="fa-solid fa-spa"></i>
  }
  if (s.includes('music') || s.includes('dj') || s.includes('sound') || s.includes('sangeet')) {
    return <i className="fa-solid fa-music"></i>
  }
  if (s.includes('destination') || s.includes('resort') || s.includes('beach') || s.includes('travel')) {
    return <i className="fa-solid fa-umbrella-beach"></i>
  }
  if (s.includes('cater') || s.includes('buffet') || s.includes('food') || s.includes('cake')) {
    return <i className="fa-solid fa-utensils"></i>
  }
  if (s.includes('makeup') || s.includes('styling') || s.includes('bridal') || s.includes('mehndi')) {
    return <i className="fa-solid fa-wand-magic-sparkles"></i>
  }
  if (s.includes('ring') || s.includes('engagement')) {
    return <i className="fa-solid fa-gem"></i>
  }
  if (s.includes('package') || s.includes('luxury') || s.includes('premium')) {
    return <i className="fa-solid fa-crown"></i>
  }
  return <i className="fa-solid fa-champagne-glasses"></i>
}

function Bookings() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('dreamWedding_loggedIn') === 'true'
  })
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('dreamWedding_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  const [bookings, setBookings] = useState(() => {
    try {
      const logged = localStorage.getItem('dreamWedding_loggedIn') === 'true'
      if (!logged) return []
      const user = JSON.parse(localStorage.getItem('dreamWedding_user') || '{}')
      const local = localStorage.getItem('dw_bookings')
      if (local && user.email) {
        return JSON.parse(local).filter(b => b.email && b.email.toLowerCase() === user.email.toLowerCase())
      }
      return []
    } catch {
      return []
    }
  })

  // State for Editing a Booking
  const [editingBooking, setEditingBooking] = useState(null)
  const [editFormData, setEditFormData] = useState({
    service: '',
    date: '',
    eventType: '',
    guests: '',
    venue: '',
    budget: '',
    notes: ''
  })
  const [editSaving, setEditSaving] = useState(false)

  // State for Payment Modal (50% Advance & 50% Post-Event Split)
  const [payingBooking, setPayingBooking] = useState(null)
  const [payPhase, setPayPhase] = useState('advance') // 'advance' | 'balance' | 'view_advance' | 'view_full'
  const [payMethod, setPayMethod] = useState('upi') // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('')
  const [cardData, setCardData] = useState({ number: '', name: '', exp: '', cvv: '' })
  const [bankName, setBankName] = useState('HDFC Bank')
  const [payStatus, setPayStatus] = useState('idle') // 'idle' | 'processing' | 'success' | 'receipt'
  const [lastTxn, setLastTxn] = useState(null)

  useEffect(() => {
    const loggedIn = localStorage.getItem('dreamWedding_loggedIn') === 'true'
    setIsLoggedIn(loggedIn)

    if (loggedIn) {
      const user = JSON.parse(localStorage.getItem('dreamWedding_user') || '{}')
      setCurrentUser(user)
      if (user.email) {
        loadBookings(user.email)
      }
    }
  }, [])

  const loadBookings = async (userEmail) => {
    try {
      const allBookings = await bookingsApi.getAll()
      const userBookings = allBookings.filter(b =>
        b.email && b.email.toLowerCase() === userEmail.toLowerCase()
      )
      setBookings(userBookings)
    } catch (error) {
      console.error('Failed to load bookings:', error)
    }
  }

  const handleDeleteBooking = async (id, serviceName) => {
    // Show a toast confirm — clicking the action button confirms
    const confirmToast = document.createElement('div')
    confirmToast.className = 'dw-toast-item toast-warning'
    confirmToast.style.cssText = 'min-width:300px;'
    confirmToast.innerHTML = `
      <span class="dw-toast-icon">⚠️</span>
      <div class="dw-toast-body">
        <div class="dw-toast-title">Cancel Booking?</div>
        <div class="dw-toast-msg">Are you sure you want to cancel "${serviceName || 'this service'}"?</div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button id="toast-confirm-yes-${id}" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:0.8rem;font-weight:600;">Yes, Cancel</button>
          <button id="toast-confirm-no-${id}" style="background:#eee;color:#333;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:0.8rem;">Keep</button>
        </div>
      </div>
      <span class="dw-toast-progress toast-warning" style="animation-duration:8000ms"></span>
    `
    const root = document.getElementById('dw-toast-root') || document.body
    root.appendChild(confirmToast)
    const dismiss = () => {
      confirmToast.classList.add('toast-exit')
      confirmToast.addEventListener('animationend', () => confirmToast.remove(), { once: true })
    }
    document.getElementById(`toast-confirm-yes-${id}`)?.addEventListener('click', async () => {
      dismiss()
      try {
        await bookingsApi.delete(id)
        loadBookings(currentUser.email)
        window.showToast('Booking cancelled successfully.', 'success')
      } catch (error) {
        window.showToast('Failed to cancel booking. Please try again.', 'error')
      }
    })
    document.getElementById(`toast-confirm-no-${id}`)?.addEventListener('click', dismiss)
    setTimeout(dismiss, 8000)
  }

  // --- EDIT MODAL HANDLERS ---
  const handleOpenEdit = (booking) => {
    setEditingBooking(booking)
    setEditFormData({
      service: booking.service || '',
      date: booking.date || '',
      eventType: booking.eventType || 'Wedding',
      guests: booking.guests === 'N/A' ? '' : (booking.guests || ''),
      venue: booking.venue === 'N/A' ? '' : (booking.venue || ''),
      budget: booking.budget === 'N/A' ? '' : (booking.budget || ''),
      notes: booking.notes === 'None' ? '' : (booking.notes || '')
    })
  }

  const handleCloseEdit = () => {
    setEditingBooking(null)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editFormData.service || !editFormData.date) {
      window.showToast('Service name and date are required.', 'warning')
      return
    }

    setEditSaving(true)
    try {
      const updatedBooking = {
        ...editingBooking,
        service: editFormData.service,
        date: editFormData.date,
        eventType: editFormData.eventType || 'Wedding',
        guests: editFormData.guests || 'N/A',
        venue: editFormData.venue || 'N/A',
        budget: editFormData.budget || 'N/A',
        notes: editFormData.notes || 'None',
        updatedAt: new Date().toISOString()
      }

      await bookingsApi.update(editingBooking.id, updatedBooking)
      
      // Update local storage
      const localList = JSON.parse(localStorage.getItem('dw_bookings') || '[]')
      const syncList = localList.map(b => String(b.id) === String(editingBooking.id) ? updatedBooking : b)
      localStorage.setItem('dw_bookings', JSON.stringify(syncList))

      setEditingBooking(null)
      loadBookings(currentUser.email)
      window.showToast('Booking updated successfully!', 'success')
    } catch (error) {
      console.error('Update error:', error)
      window.showToast('Failed to update booking. Please try again.', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  // --- PAYMENT MODAL HANDLERS (50/50 Split & Admin Gate) ---
  const handleOpenPayment = (booking, phase = 'advance') => {
    // Admin gate check
    if (booking.bookingStatus !== 'confirmed') {
      window.showToast('Your booking is pending availability confirmation. Once confirmed, payment will be enabled.', 'warning', 5000)
      return
    }

    setPayingBooking(booking)
    setPayPhase(phase)
    if (phase === 'view_full' || phase === 'view_advance') {
      setPayStatus('receipt')
    } else {
      setPayStatus('idle')
    }
    setPayMethod('upi')
    setUpiId(currentUser?.email ? `${currentUser.email.split('@')[0]}@okaxis` : 'client@okhdfcbank')
  }

  const handleClosePayment = () => {
    setPayingBooking(null)
    setPayStatus('idle')
    setLastTxn(null)
  }

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    setPayStatus('processing')

    const isPayingBalance = payPhase === 'balance' || (payingBooking.advancePaid && !payingBooking.balancePaid)
    const phaseTitle = isPayingBalance ? '50% Balance Payment (Post-Event)' : '50% Advance Payment'
    const amountFormatted = '₹25,000'
    const txnId = (isPayingBalance ? 'TXN_BAL_' : 'TXN_ADV_') + Date.now().toString().slice(-8)

    setTimeout(async () => {
      try {
        let updatedBooking
        if (isPayingBalance) {
          updatedBooking = {
            ...payingBooking,
            paymentStatus: 'Fully Paid',
            advancePaid: true,
            balancePaid: true,
            balanceAmount: amountFormatted,
            balanceTxnId: txnId,
            balanceMethod: payMethod.toUpperCase(),
            balancePaidAt: new Date().toISOString()
          }
        } else {
          updatedBooking = {
            ...payingBooking,
            paymentStatus: 'Advance Paid',
            advancePaid: true,
            balancePaid: false,
            advanceAmount: amountFormatted,
            advanceTxnId: txnId,
            advanceMethod: payMethod.toUpperCase(),
            advancePaidAt: new Date().toISOString(),
            transactionId: txnId // backward compatibility
          }
        }

        await bookingsApi.update(payingBooking.id, updatedBooking)

        // Sync local storage
        const localList = JSON.parse(localStorage.getItem('dw_bookings') || '[]')
        const syncList = localList.map(b => String(b.id) === String(payingBooking.id) ? updatedBooking : b)
        localStorage.setItem('dw_bookings', JSON.stringify(syncList))

        setLastTxn({
          id: txnId,
          phase: phaseTitle,
          amount: amountFormatted,
          isBalance: isPayingBalance,
          method: payMethod.toUpperCase(),
          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        })
        setPayingBooking(updatedBooking)
        setPayStatus('success')
        loadBookings(currentUser.email)
      } catch (err) {
        console.error('Payment save error:', err)
        setPayStatus('idle')
        window.showToast('Payment recording failed. Please try again.', 'error')
      }
    }, 1400)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date to be finalized'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (!isLoggedIn) {
    return (
      <section className="booking-section">
        <div className="container">
          <div className="login-required-msg" style={{ display: 'block' }}>
            <div className="login-required-box">
              <i className="fa-solid fa-lock" style={{ fontSize: '2.5rem', color: '#d4af37', marginBottom: '15px', display: 'block' }}></i>
              <h2>Login Required</h2>
              <p>You need to login to view your personal bookings. Please login or create an account first.</p>
              <div className="login-required-btns">
                <a href="/login" className="btn btn-primary"><i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i> Login</a>
                <a href="/registration" className="btn btn-secondary"><i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i> Register</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const filteredBookings = bookings

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>My Bookings Dashboard</h1>
          <p>Manage, review, track admin approval, and securely pay for your wedding reservations</p>
        </div>
      </section>

      {/* Bookings Section */}
      <section className="booking-section" style={{ background: '#fdfbf7', minHeight: '650px', padding: '50px 0' }}>
        <div className="container">
          <div className="bookings-dashboard-wrapper">

            {/* User Greeting & Stats Bar */}
            <div className="user-dashboard-banner">
              <div className="user-banner-left">
                <div className="user-avatar-gold">
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <h2>Welcome back, {currentUser?.name || 'Valued Client'}!</h2>
                  <p className="user-banner-subtitle">
                    <i className="fa-solid fa-envelope" style={{ marginRight: '6px', color: '#d4af37' }}></i>
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="modern-bookings-container">
              {filteredBookings.length === 0 ? (
                <div className="empty-bookings-card">
                  <div className="empty-icon-box">
                    <i className="fa-solid fa-champagne-glasses" style={{ color: '#d4af37' }}></i>
                  </div>
                  <h3>No Wedding Bookings Found</h3>
                  <p>You haven't reserved any wedding services or packages yet. Start exploring our exclusive offerings to create your dream day!</p>
                  <div className="empty-actions">
                    <Link to="/services" className="btn btn-primary"><i className="fa-solid fa-magnifying-glass" style={{ marginRight: '6px' }}></i> Browse Services</Link>
                    <Link to="/packages" className="btn btn-secondary"><i className="fa-solid fa-crown" style={{ marginRight: '6px' }}></i> Explore Packages</Link>
                  </div>
                </div>
              ) : (
                filteredBookings.map((booking, idx) => {
                  const isConfirmed = booking.bookingStatus === 'confirmed'
                  const isRejected = booking.bookingStatus === 'rejected'
                  const isPending = !isConfirmed && !isRejected

                  const isFullyPaid = booking.balancePaid || booking.paymentStatus === 'Fully Paid' || booking.paymentStatus === 'Paid'
                  const isAdvancePaid = !isFullyPaid && (booking.advancePaid || booking.paymentStatus === 'Advance Paid')
                  const isUnpaid = !isFullyPaid && !isAdvancePaid

                  return (
                    <div className="modern-booking-card" key={booking.id || idx}>
                      {/* Card Header: Service name & Badges */}
                      <div className="booking-card-header">
                        <div className="service-title-wrap">
                          <span className="service-category-icon">
                            {getServiceIcon(booking.service, booking.category)}
                          </span>
                          <div>
                            <h3 className="booking-service-name">{booking.service || 'Wedding Service'}</h3>
                            <span className="booking-id-tag">REF: #{String(booking.id || idx + 1).slice(-7).toUpperCase()}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Payment Status Badge */}
                          {isFullyPaid && (
                            <div className="payment-status-badge paid">
                              <i className="fa-solid fa-check-double"></i> 100% Fully Paid
                            </div>
                          )}
                          {isAdvancePaid && (
                            <div className="payment-status-badge advance">
                              <i className="fa-solid fa-hourglass-half"></i> 50% Advance Paid
                            </div>
                          )}
                          {isUnpaid && (
                            <div className="payment-status-badge pending">
                              <i className="fa-solid fa-clock"></i> Payment Pending
                            </div>
                          )}

                          {/* Booking Status Badge */}
                          {isConfirmed && (
                            <div className="booking-status-badge confirmed">
                              <span className="status-dot green"></span> ✓ Availability Confirmed
                            </div>
                          )}
                          {isPending && (
                            <div className="booking-status-badge pending-admin">
                              <span className="status-dot amber"></span> 🟡 Pending Confirmation
                            </div>
                          )}
                          {isRejected && (
                            <div className="booking-status-badge rejected">
                              <i className="fa-solid fa-ban"></i> Booking Unavailable
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Event Date Highlight Bar */}
                      <div className="booking-date-banner">
                        <div className="date-banner-left">
                          <span className="calendar-icon">
                            <i className="fa-solid fa-calendar-days" style={{ color: '#b8860b' }}></i>
                          </span>
                          <div>
                            <strong className="event-date-text">{formatDate(booking.date)}</strong>
                            <span className="event-date-sub">Preferred Event / Shoot Date</span>
                          </div>
                        </div>
                        {booking.budget && booking.budget !== 'N/A' && (
                          <div className="budget-tag-pill">
                            <i className="fa-solid fa-indian-rupee-sign" style={{ color: '#b8860b', marginRight: '4px' }}></i> <span>Budget:</span> <strong>{booking.budget}</strong>
                          </div>
                        )}
                      </div>

                      {/* Highlights Chip Grid */}
                      <div className="booking-details-grid">
                        <div className="booking-chip">
                          <span className="chip-label">
                            <i className="fa-solid fa-users" style={{ marginRight: '5px', color: '#b8860b' }}></i> Estimated Guests
                          </span>
                          <strong className="chip-val">{booking.guests && booking.guests !== 'N/A' ? `${booking.guests} Guests` : 'Not specified'}</strong>
                        </div>

                        <div className="booking-chip">
                          <span className="chip-label">
                            <i className="fa-solid fa-location-dot" style={{ marginRight: '5px', color: '#b8860b' }}></i> Venue / City
                          </span>
                          <strong className="chip-val">{booking.venue && booking.venue !== 'N/A' ? booking.venue : (booking.address && booking.address !== 'N/A' ? booking.address : 'Venue TBD')}</strong>
                        </div>

                        <div className="booking-chip">
                          <span className="chip-label">
                            <i className="fa-solid fa-ring" style={{ marginRight: '5px', color: '#d4af37' }}></i> Event Ceremony
                          </span>
                          <strong className="chip-val">{booking.eventType && booking.eventType !== 'N/A' ? booking.eventType : 'Wedding'}</strong>
                        </div>

                        <div className="booking-chip">
                          <span className="chip-label">
                            <i className="fa-solid fa-user" style={{ marginRight: '5px', color: '#b8860b' }}></i> Reserved For
                          </span>
                          <strong className="chip-val">{booking.name || currentUser?.name}</strong>
                        </div>
                      </div>

                      {/* Custom Summary */}
                      {booking.customSummary && (
                        <div className="booking-custom-summary-box">
                          <span className="summary-label">
                            <i className="fa-solid fa-list-check" style={{ marginRight: '5px' }}></i> Service Specifications:
                          </span>
                          <p className="summary-text">{booking.customSummary}</p>
                        </div>
                      )}

                      {/* Additional Notes */}
                      {booking.notes && booking.notes !== 'None' && !booking.notes.startsWith('[Custom Info:') && (
                        <div className="booking-notes-box">
                          <span className="summary-label">
                            <i className="fa-solid fa-note-sticky" style={{ marginRight: '5px' }}></i> Client Note / Request:
                          </span>
                          <p className="summary-text">{booking.notes.replace(/\s*\[Custom Info:[^\]]*\]/g, '').replace(/\s*\[Package Info:[^\]]*\]/g, '')}</p>
                        </div>
                      )}

                     

                      {/* Availability Confirmed Info Banner */}
                      {isConfirmed && !isAdvancePaid && !isFullyPaid && (
                        <div className="availability-confirmed-banner">
                          <div className="confirmed-banner-icon">✓</div>
                          <div className="confirmed-banner-body">
                            <strong>Availability Confirmed</strong>
                            <p>Your event is available. You can now complete your payment.</p>
                          </div>
                        </div>
                      )}

                      {/* 50/50 Payment Progress Visual Strip (if confirmed or paid) */}
                      {isConfirmed && (
                        <div className="payment-split-progress-bar">
                          <div className={`split-step ${isAdvancePaid || isFullyPaid ? 'completed' : 'active'}`}>
                            <div className="step-circle">
                              {isAdvancePaid || isFullyPaid ? <i className="fa-solid fa-check"></i> : '1'}
                            </div>
                            <div className="step-info">
                              <span className="step-title">Phase 1: 50% Advance</span>
                              <span className="step-status">
                                {isAdvancePaid || isFullyPaid ? `Paid (TXN: ${booking.advanceTxnId || booking.transactionId || 'Done'})` : 'Pay to Lock Booking'}
                              </span>
                            </div>
                          </div>

                          <div className={`split-connector ${isFullyPaid ? 'active' : ''}`}></div>

                          <div className={`split-step ${isFullyPaid ? 'completed' : isAdvancePaid ? 'active' : 'upcoming'}`}>
                            <div className="step-circle">
                              {isFullyPaid ? <i className="fa-solid fa-check"></i> : '2'}
                            </div>
                            <div className="step-info">
                              <span className="step-title">Phase 2: 50% Balance</span>
                              <span className="step-status">
                                {isFullyPaid ? `Settled (TXN: ${booking.balanceTxnId})` : 'Payable After Event'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assigned Wedding Vendors (Shown after customer payment & vendor allocation) */}
                      {(isAdvancePaid || isFullyPaid || booking.paymentStatus === 'Paid') && Array.isArray(booking.vendorAllocations) && booking.vendorAllocations.length > 0 && (
                        <div className="booking-assigned-vendors-section">
                          <div className="assigned-vendors-header">
                            <div className="assigned-vendors-title">
                              <i className="fa-solid fa-people-roof" style={{ color: '#b8860b' }}></i>
                              <strong>Your Assigned Wedding Team & Vendors</strong>
                            </div>
                            <span className="assigned-vendors-pill">
                              {booking.vendorAllocations.length} Specialist{booking.vendorAllocations.length > 1 ? 's' : ''} Dedicated
                            </span>
                          </div>

                          <div className="assigned-vendors-grid">
                            {booking.vendorAllocations.map((alloc) => {
                              const isAccepted = alloc.status === 'Accepted'
                              const isDeclined = alloc.status === 'Declined'
                              const isPending = !isAccepted && !isDeclined

                              return (
                                <div className="assigned-vendor-item" key={alloc.allocationId || alloc.vendorId}>
                                  <div className="assigned-vendor-icon">
                                    {alloc.service === 'Photography' ? '📷' :
                                     alloc.service === 'Decoration' ? '🌸' :
                                     alloc.service === 'Catering' ? '🍽️' :
                                     alloc.service === 'Makeup' ? '💄' :
                                     alloc.service === 'DJ' ? '🎧' :
                                     alloc.service === 'Venue' ? '🏰' : '✨'}
                                  </div>

                                  <div className="assigned-vendor-content">
                                    <div className="assigned-vendor-top">
                                      <span className="assigned-vendor-service">{alloc.service}</span>
                                      {isAccepted && (
                                        <span className="assigned-vendor-status confirmed">
                                          <i className="fa-solid fa-circle-check"></i> Confirmed by Vendor
                                        </span>
                                      )}
                                      {isPending && (
                                        <span className="assigned-vendor-status pending">
                                          <i className="fa-solid fa-hourglass-half"></i> Awaiting Vendor Confirmation
                                        </span>
                                      )}
                                      {isDeclined && (
                                        <span className="assigned-vendor-status reallocating">
                                          <i className="fa-solid fa-clock-rotate-left"></i> Reallocating Team
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="assigned-vendor-name">{alloc.vendorName}</h4>

                                    <div className="assigned-vendor-contact">
                                      {alloc.vendorPhone && (
                                        <span><i className="fa-solid fa-phone" style={{ color: '#b8860b' }}></i> {alloc.vendorPhone}</span>
                                      )}
                                      {alloc.vendorEmail && (
                                        <span><i className="fa-solid fa-envelope" style={{ color: '#b8860b' }}></i> {alloc.vendorEmail}</span>
                                      )}
                                    </div>

                                    {alloc.requirements && (
                                      <div className="assigned-vendor-notes">
                                        <i className="fa-solid fa-clipboard-check" style={{ color: '#d97706', marginRight: '4px' }}></i>
                                        <span>{alloc.requirements}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Card Footer: Action Buttons */}
                      <div className="booking-card-footer">
                        <div className="booking-contact-pills">
                          <span><i className="fa-solid fa-envelope" style={{ color: '#b8860b', marginRight: '4px' }}></i> {booking.email}</span>
                          {booking.phone && <span><i className="fa-solid fa-phone" style={{ color: '#b8860b', marginRight: '4px' }}></i> {booking.phone}</span>}
                        </div>

                        <div className="booking-action-buttons">
                          <button
                            type="button"
                            className="btn-edit-booking"
                            onClick={() => handleOpenEdit(booking)}
                            title="Edit this booking details"
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Edit
                          </button>

                          {/* PAYMENT BUTTON WITH ADMIN GATE & 50/50 SPLIT */}
                          {isRejected ? (
                            <button
                              type="button"
                              className="btn-pay-locked"
                              disabled
                              title="This booking is not available"
                            >
                              <i className="fa-solid fa-ban"></i> Unavailable
                            </button>
                          ) : isPending ? (
                            <button
                              type="button"
                              className="btn-pay-locked"
                              onClick={() => window.showToast('Payment is locked pending availability confirmation. You will be notified once your booking is confirmed.', 'warning', 5000)}
                              title="Payment will be enabled once availability is confirmed"
                            >
                              <i className="fa-solid fa-lock"></i> 🔒 Payment Locked
                            </button>
                          ) : isFullyPaid ? (
                            <button
                              type="button"
                              className="btn-payment-done"
                              onClick={() => handleOpenPayment(booking, 'view_full')}
                              title="View Full Payment Receipt"
                            >
                              <i className="fa-solid fa-receipt"></i> Full Receipt (100% Paid)
                            </button>
                          ) : isAdvancePaid ? (
                            <>
                              <button
                                type="button"
                                className="btn-print-receipt"
                                onClick={() => handleOpenPayment(booking, 'view_advance')}
                                title="View Advance Payment Receipt"
                              >
                                <i className="fa-solid fa-file-invoice-dollar"></i> Advance Receipt
                              </button>
                              <button
                                type="button"
                                className="btn-pay-balance"
                                onClick={() => handleOpenPayment(booking, 'balance')}
                                title="Pay remaining 50% balance after your event"
                              >
                                <i className="fa-solid fa-hand-holding-dollar"></i> Pay Balance (50%)
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn-pay-now"
                              onClick={() => handleOpenPayment(booking, 'advance')}
                              title="Pay 50% Advance to confirm your booking"
                            >
                              <i className="fa-solid fa-credit-card"></i> Pay 50% Advance
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-cancel-booking"
                            onClick={() => handleDeleteBooking(booking.id, booking.service)}
                            title="Cancel this reservation"
                          >
                            <i className="fa-solid fa-trash-can"></i> Cancel
                          </button>
                        </div>


                      {/* Payment Locked Info Banner — shown while pending */}
                      {isPending && (
                        <div className="payment-locked-banner">
                          <div className="locked-banner-icon">🔒</div>
                          <div className="locked-banner-body">
                            <strong>Payment Locked</strong>
                            <p>Your booking request has been received successfully. We will confirm availability within 2–3 days. Once availability is confirmed, the payment option will be enabled.</p>
                          </div>
                        </div>
                      )}
                      {isRejected && (
                          <div className="booking-inline-note rejected-note">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span>This date or service is currently <strong>not available</strong>. Please contact us or book a different date.</span>
                          </div>
                        )}

                    </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EDIT MODAL */}
      {editingBooking && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="edit-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa-solid fa-pen-to-square" style={{ color: '#d4af37', marginRight: '8px' }}></i> Edit Reservation</h3>
              <button type="button" className="close-modal-btn" onClick={handleCloseEdit}>&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="edit-booking-form">
              <div className="form-group">
                <label>Service / Package Name *</label>
                <input
                  type="text"
                  name="service"
                  required
                  value={editFormData.service}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Preferred Event Date *</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={editFormData.date}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Event Ceremony</label>
                <select name="eventType" value={editFormData.eventType} onChange={handleEditChange}>
                  <option value="Wedding">Wedding Ceremony</option>
                  <option value="Engagement">Engagement / Ring Ceremony</option>
                  <option value="Sangeet">Sangeet & Mehendi</option>
                  <option value="Reception">Wedding Reception</option>
                  <option value="Pre-Wedding">Pre-Wedding Shoot</option>
                  <option value="Other">Other Celebration</option>
                </select>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Estimated Guests</label>
                  <input
                    type="number"
                    name="guests"
                    placeholder="e.g. 250"
                    value={editFormData.guests}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Venue / City</label>
                  <input
                    type="text"
                    name="venue"
                    placeholder="e.g. Udaipur Resort"
                    value={editFormData.venue}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Estimated Budget</label>
                <input
                  type="text"
                  name="budget"
                  placeholder="e.g. 3-5 Lakhs"
                  value={editFormData.budget}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Special Instructions / Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Add any additional requirements..."
                  value={editFormData.notes}
                  onChange={handleEditChange}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEdit} disabled={editSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL (50/50 SPLIT & RECEIPT) */}
      {payingBooking && (
        <div className="modal-overlay" onClick={handleClosePayment}>
          <div className="payment-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-shield-halved" style={{ color: '#d4af37', marginRight: '8px' }}></i>
                {payStatus === 'receipt'
                  ? 'Payment Receipt & History'
                  : payStatus === 'success'
                  ? 'Payment Successful'
                  : payPhase === 'balance'
                  ? 'Pay 50% Balance (Post-Event)'
                  : 'Pay 50% Advance Payment'}
              </h3>
              <button type="button" className="close-modal-btn" onClick={handleClosePayment}>&times;</button>
            </div>

            {/* RECEIPT VIEW (VIEWING PAST RECEIPT) */}
            {payStatus === 'receipt' ? (
              <div className="payment-receipt-view">
                <div className="receipt-success-badge">
                  <i className="fa-solid fa-file-invoice-dollar" style={{ fontSize: '3rem', color: '#27ae60', marginBottom: '10px', display: 'block' }}></i>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', color: '#2b241c' }}>Official Payment Statement</h4>
                  <p style={{ margin: 0, color: '#665544', fontSize: '0.9rem' }}>
                    Dream Wedding Luxury Events & Services
                  </p>
                </div>

                {/* Split phases summary in receipt */}
                <div className="receipt-split-box">
                  <div className={`receipt-phase-card ${payingBooking.advancePaid || payingBooking.paymentStatus === 'Paid' ? 'paid' : ''}`}>
                    <div className="phase-card-top">
                      <strong>Phase 1: 50% Advance</strong>
                      <span className="badge-paid-pill"><i className="fa-solid fa-check"></i> Paid</span>
                    </div>
                    <div className="phase-card-details">
                      <div>Amount: <strong>{payingBooking.advanceAmount || payingBooking.paidAmount || '₹25,000'}</strong></div>
                      <div>TXN: <code>{payingBooking.advanceTxnId || payingBooking.transactionId || 'TXN_ADV'}</code></div>
                      {payingBooking.advancePaidAt && <div>Date: <small>{new Date(payingBooking.advancePaidAt).toLocaleDateString()}</small></div>}
                    </div>
                  </div>

                  <div className={`receipt-phase-card ${payingBooking.balancePaid || payingBooking.paymentStatus === 'Fully Paid' ? 'paid' : 'pending'}`}>
                    <div className="phase-card-top">
                      <strong>Phase 2: 50% Post-Event Balance</strong>
                      {payingBooking.balancePaid || payingBooking.paymentStatus === 'Fully Paid' ? (
                        <span className="badge-paid-pill"><i className="fa-solid fa-check"></i> Paid</span>
                      ) : (
                        <span className="badge-due-pill"><i className="fa-solid fa-clock"></i> Due After Event</span>
                      )}
                    </div>
                    <div className="phase-card-details">
                      <div>Amount: <strong>{payingBooking.balanceAmount || '₹25,000'}</strong></div>
                      {payingBooking.balanceTxnId ? (
                        <div>TXN: <code>{payingBooking.balanceTxnId}</code></div>
                      ) : (
                        <div>Status: <span style={{ color: '#b8860b' }}>Payable after event completion</span></div>
                      )}
                      {payingBooking.balancePaidAt && <div>Date: <small>{new Date(payingBooking.balancePaidAt).toLocaleDateString()}</small></div>}
                    </div>
                  </div>
                </div>

                <div className="receipt-details-list" style={{ marginTop: '16px' }}>
                  <div className="receipt-row">
                    <span>Reserved Service:</span>
                    <strong>{payingBooking.service}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Event Date:</span>
                    <strong>{formatDate(payingBooking.date)}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Client Name:</span>
                    <strong>{payingBooking.name || currentUser?.name}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Client Email:</span>
                    <strong>{payingBooking.email}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Admin Approval:</span>
                    <strong style={{ color: '#27ae60' }}><i className="fa-solid fa-circle-check"></i> Confirmed & Verified</strong>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '24px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                    <i className="fa-solid fa-print" style={{ marginRight: '6px' }}></i> Print Receipt
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleClosePayment}>
                    <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> Done
                  </button>
                </div>
              </div>
            ) : payStatus === 'success' ? (
              /* SUCCESS VIEW AFTER TRANSACTION */
              <div className="payment-receipt-view">
                <div className="receipt-success-badge">
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '3.5rem', color: '#27ae60', marginBottom: '10px', display: 'block' }}></i>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#2b241c' }}>
                    {lastTxn?.isBalance ? '50% Balance Payment Received!' : '50% Advance Payment Successful!'}
                  </h4>
                  <p style={{ margin: 0, color: '#665544', fontSize: '0.92rem' }}>
                    {lastTxn?.isBalance
                      ? 'All dues are now fully cleared. Your event reservation is 100% settled!'
                      : 'Your dates are locked! The remaining 50% balance is payable after your event.'}
                  </p>
                </div>

                <div className="receipt-details-list">
                  <div className="receipt-row">
                    <span>Payment Phase:</span>
                    <strong style={{ color: '#b8860b' }}>{lastTxn?.phase}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Transaction ID:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#b8860b' }}>{lastTxn?.id}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Amount Paid:</span>
                    <strong style={{ color: '#27ae60', fontSize: '1.1rem' }}>{lastTxn?.amount}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Payment Method:</span>
                    <strong>{lastTxn?.method}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Service:</span>
                    <strong>{payingBooking.service}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Transaction Date:</span>
                    <strong>{lastTxn?.date}</strong>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '24px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                    <i className="fa-solid fa-print" style={{ marginRight: '6px' }}></i> Print Receipt
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleClosePayment}>
                    <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> Done
                  </button>
                </div>
              </div>
            ) : (
              /* PAYMENT FORM (50% ADVANCE OR 50% BALANCE) */
              <form onSubmit={handleProcessPayment} className="payment-form">
                {/* 50/50 Split Educational Box */}
                <div className="pay-phase-info-box">
                  <div className={`pay-phase-step ${payPhase === 'balance' ? 'completed' : 'active'}`}>
                    <div className="phase-badge">Phase 1</div>
                    <strong>50% Advance Deposit</strong>
                    <small>{payPhase === 'balance' ? '✓ Paid & Locked' : 'Pay now to confirm booking'}</small>
                  </div>
                  <div className="pay-phase-divider">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                  <div className={`pay-phase-step ${payPhase === 'balance' ? 'active' : 'upcoming'}`}>
                    <div className="phase-badge">Phase 2</div>
                    <strong>50% Post-Event Balance</strong>
                    <small>{payPhase === 'balance' ? 'Pay now after event' : 'Pay after event completion'}</small>
                  </div>
                </div>

                {/* Service Summary Strip */}
                <div className="payment-summary-strip">
                  <div>
                    <span className="pay-label">
                      {payPhase === 'balance' ? 'Post-Event Settlement' : 'Service Reservation'}
                    </span>
                    <strong className="pay-service-name">{payingBooking.service}</strong>
                    <span className="pay-date-txt">
                      <i className="fa-solid fa-calendar-days" style={{ marginRight: '5px', color: '#b8860b' }}></i> {formatDate(payingBooking.date)}
                    </span>
                  </div>
                  <div className="pay-amount-box">
                    <span className="pay-label">Amount Due Today</span>
                    <span className="pay-amount-val">₹25,000</span>
                    <small style={{ display: 'block', color: '#776655', fontSize: '0.78rem' }}>
                      (50% {payPhase === 'balance' ? 'Balance' : 'Advance'})
                    </small>
                  </div>
                </div>

                {/* Method Navigation Tabs */}
                <div className="payment-method-nav">
                  <button
                    type="button"
                    className={`pay-method-pill ${payMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setPayMethod('upi')}
                  >
                    <i className="fa-solid fa-mobile-screen-button" style={{ marginRight: '6px' }}></i> UPI / QR
                  </button>
                  <button
                    type="button"
                    className={`pay-method-pill ${payMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPayMethod('card')}
                  >
                    <i className="fa-regular fa-credit-card" style={{ marginRight: '6px' }}></i> Debit / Credit Card
                  </button>
                  <button
                    type="button"
                    className={`pay-method-pill ${payMethod === 'netbanking' ? 'active' : ''}`}
                    onClick={() => setPayMethod('netbanking')}
                  >
                    <i className="fa-solid fa-building-columns" style={{ marginRight: '6px' }}></i> Net Banking
                  </button>
                </div>

                {/* UPI Content */}
                {payMethod === 'upi' && (
                  <div className="pay-method-content">
                    <div className="upi-options-box">
                      <div className="form-group">
                        <label>Enter Virtual Payment Address (UPI ID) *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. yourname@oksbi / 9876543210@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                      <div className="quick-upi-chips">
                        <span onClick={() => setUpiId((currentUser?.email?.split('@')[0] || 'user') + '@okaxis')}>@okaxis</span>
                        <span onClick={() => setUpiId((currentUser?.email?.split('@')[0] || 'user') + '@okhdfcbank')}>@okhdfcbank</span>
                        <span onClick={() => setUpiId((currentUser?.phone || '9876543210') + '@paytm')}>@paytm</span>
                        <span onClick={() => setUpiId((currentUser?.phone || '9876543210') + '@ybl')}>@ybl</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                {payMethod === 'card' && (
                  <div className="pay-method-content">
                    <div className="form-group">
                      <label>Card Number *</label>
                      <input
                        type="text"
                        maxLength="19"
                        required
                        placeholder="4532 •••• •••• 8920"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      />
                    </div>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Cardholder Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Name on card"
                          value={cardData.name || currentUser?.name || ''}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Expiry (MM/YY) *</label>
                        <input
                          type="text"
                          maxLength="5"
                          required
                          placeholder="MM/YY"
                          value={cardData.exp}
                          onChange={(e) => setCardData({ ...cardData, exp: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV *</label>
                        <input
                          type="password"
                          maxLength="3"
                          required
                          placeholder="•••"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking Content */}
                {payMethod === 'netbanking' && (
                  <div className="pay-method-content">
                    <div className="form-group">
                      <label>Select Your Bank *</label>
                      <select value={bankName} onChange={(e) => setBankName(e.target.value)}>
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        <option value="Punjab National Bank">Punjab National Bank</option>
                      </select>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#777', margin: '6px 0 0 0' }}>
                      <i className="fa-solid fa-lock" style={{ marginRight: '5px', color: '#27ae60' }}></i> You will be securely redirected to your bank portal to authorize this payment.
                    </p>
                  </div>
                )}

                <div className="modal-footer" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleClosePayment} disabled={payStatus === 'processing'}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-submit-pay"
                    disabled={payStatus === 'processing'}
                    style={{ minWidth: '220px' }}
                  >
                    {payStatus === 'processing' ? (
                      <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Processing Payment...</span>
                    ) : (
                      <span>
                        <i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i>
                        {payPhase === 'balance' ? 'Pay 50% Balance (₹25,000)' : 'Pay 50% Advance (₹25,000)'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Bookings
