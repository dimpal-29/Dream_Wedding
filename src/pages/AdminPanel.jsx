import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi, usersApi, contactsApi, vendorsApi, reviewsApi, vendorTasksApi, getCustomerRevenue, getBookingVendorCost, parseRupeeAmount } from '../services/api'
import VendorTaskAssignment from './VendorTaskAssignment'
import '../admin.css'

function AdminPanel() {
  // Authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Sidebar navigation & layout state
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'all' | 'pending' | 'confirmed' | 'payments' | 'vendors' | 'vendor_mgmt' | 'task_assign' | 'users' | 'inquiries' | 'feedback'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'cards'

  // Data states (instantly load from localStorage if available)
  const [bookings, setBookings] = useState(() => {
    try {
      const local = localStorage.getItem('dw_bookings')
      return local ? JSON.parse(local) : []
    } catch {
      return []
    }
  })
  const [users, setUsers] = useState(() => {
    try {
      const local = localStorage.getItem('dw_users')
      return local ? JSON.parse(local) : []
    } catch {
      return []
    }
  })
  const [contacts, setContacts] = useState(() => {
    try {
      const local = localStorage.getItem('dw_contacts')
      return local ? JSON.parse(local) : []
    } catch {
      return []
    }
  })
  const [vendors, setVendors] = useState(() => {
    try {
      const local = localStorage.getItem('dw_vendors')
      return local ? JSON.parse(local) : []
    } catch {
      return []
    }
  })
  const [reviews, setReviews] = useState(() => {
    try {
      const local = localStorage.getItem('dw_reviews')
      return local ? JSON.parse(local) : []
    } catch {
      return []
    }
  })
  const [vendorTasks, setVendorTasks] = useState(() => {
    try {
      const local = localStorage.getItem('dw_vendorTasks')
      return local ? JSON.parse(local) : []
    } catch {
      return []
    }
  })

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'confirmed' | 'rejected' | 'advance_paid' | 'fully_paid'
  const [serviceFilter, setServiceFilter] = useState('all')
  const [actionMessage, setActionMessage] = useState('')

  // Feedback Management Filters & Modal States
  const [feedbackSearch, setFeedbackSearch] = useState('')
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all') // 'all' | '5' | '4' | '3' | '2' | '1'
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all') // 'all' | 'approved' | 'pending' | 'featured'
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [feedbackFormData, setFeedbackFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    date: '',
    coupleImg: '',
    text: '',
    status: 'approved',
    featured: true
  })

  // Selected booking for detailed modal
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Initial check on mount
  useEffect(() => {
    const logged = sessionStorage.getItem('dreamWedding_adminLoggedIn') === 'true'
    setIsAdminLoggedIn(logged)
    if (logged) {
      loadAllAdminData()
    }
  }, [])

  // Keep Vendor ↔ Admin task assignments synchronized live across tabs.
  // A vendor responding YES/NO (or a new vendor registering) in another tab
  // writes to localStorage; this listener reflects that here instantly
  // without touching customer booking/payment state.
  useEffect(() => {
    const handleStorageSync = (e) => {
      if (!e.key) return
      if (e.key === 'dw_vendorTasks') {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : []
          setVendorTasks(Array.isArray(updated) ? updated : [])
        } catch { /* ignore malformed payload */ }
      }
      if (e.key === 'dw_vendors') {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : []
          setVendors(Array.isArray(updated) ? updated : [])
        } catch { /* ignore malformed payload */ }
      }
    }
    window.addEventListener('storage', handleStorageSync)
    return () => window.removeEventListener('storage', handleStorageSync)
  }, [])

  // Update statusFilter when changing sidebar tab
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'pending') {
      setStatusFilter('pending')
    } else if (tab === 'confirmed') {
      setStatusFilter('confirmed')
    } else if (tab === 'all') {
      setStatusFilter('all')
    }
    // Close sidebar on mobile upon navigation
    setIsSidebarOpen(false)
  }

  // Load all bookings, users, and contacts
  const loadAllAdminData = async () => {
    try {
      // 1. Load Bookings
      let bData = await bookingsApi.getAll()
      if (!bData || bData.length === 0) {
        const local = localStorage.getItem('dw_bookings')
        if (local) bData = JSON.parse(local)
      }
      setBookings(Array.isArray(bData) ? bData : [])

      // 2. Load Users
      try {
        let uData = await usersApi.getAll()
        if (!uData || uData.length === 0) {
          const localUsers = localStorage.getItem('dw_users')
          if (localUsers) uData = JSON.parse(localUsers)
        }
        setUsers(Array.isArray(uData) ? uData : [])
      } catch (e) {
        const localUsers = localStorage.getItem('dw_users')
        if (localUsers) setUsers(JSON.parse(localUsers))
      }

      // 3. Load Contact messages
      try {
        let cData = await contactsApi.getAll()
        if (!cData || cData.length === 0) {
          const localContacts = localStorage.getItem('dw_contacts')
          if (localContacts) cData = JSON.parse(localContacts)
        }
        setContacts(Array.isArray(cData) ? cData : [])
      } catch (e) {
        const localContacts = localStorage.getItem('dw_contacts')
        if (localContacts) setContacts(JSON.parse(localContacts))
      }

      // 4. Load Vendors
      try {
        let vData = await vendorsApi.getAll()
        if (!vData || vData.length === 0) {
          const localVendors = localStorage.getItem('dw_vendors')
          if (localVendors) vData = JSON.parse(localVendors)
        }
        setVendors(Array.isArray(vData) ? vData : [])
      } catch (e) {
        const localVendors = localStorage.getItem('dw_vendors')
        if (localVendors) setVendors(JSON.parse(localVendors))
      }

      // 5. Load Customer Reviews / Feedbacks
      try {
        let rData = await reviewsApi.getAll()
        if (!rData || rData.length === 0) {
          const localReviews = localStorage.getItem('dw_reviews')
          if (localReviews) rData = JSON.parse(localReviews)
        }
        setReviews(Array.isArray(rData) ? rData : [])
      } catch (e) {
        const localReviews = localStorage.getItem('dw_reviews')
        if (localReviews) setReviews(JSON.parse(localReviews))
      }

      // 6. Load vendor task assignments (separate from payout allocations)
      try {
        let tData = await vendorTasksApi.getAll()
        if (!tData || tData.length === 0) {
          const localTasks = localStorage.getItem('dw_vendorTasks')
          if (localTasks) tData = JSON.parse(localTasks)
        }
        setVendorTasks(Array.isArray(tData) ? tData : [])
      } catch (e) {
        const localTasks = localStorage.getItem('dw_vendorTasks')
        if (localTasks) setVendorTasks(JSON.parse(localTasks))
      }
    } catch (err) {
      console.error('Error fetching admin data:', err)
      const local = localStorage.getItem('dw_bookings')
      if (local) setBookings(JSON.parse(local))
    }
  }

  // Admin login handler
  const handleAdminLogin = (e) => {
    e.preventDefault()
    setLoginError('')
    if (adminEmail.trim().toLowerCase() === 'admin@dreamwedding.com' && adminPassword === 'admin123') {
      sessionStorage.setItem('dreamWedding_adminLoggedIn', 'true')
      setIsAdminLoggedIn(true)
      loadAllAdminData()
    } else {
      setLoginError('Invalid admin email or password. Please try again.')
    }
  }

  const handleAdminLogout = async () => {
    const confirmed = window.showConfirm
      ? await window.showConfirm({
          title: 'Confirm Admin Logout',
          message: 'Are you sure you want to sign out of the <strong>Admin Control Panel</strong>?',
          confirmText: 'Yes, Sign Out',
          cancelText: 'Stay in Admin',
          icon: 'fa-solid fa-arrow-right-from-bracket'
        })
      : window.confirm('Are you sure you want to log out?')

    if (!confirmed) return

    sessionStorage.removeItem('dreamWedding_adminLoggedIn')
    setIsAdminLoggedIn(false)
    setAdminEmail('')
    setAdminPassword('')
  }

  // Toast notification helper
  const showNotification = (msg) => {
    setActionMessage(msg)
    setTimeout(() => setActionMessage(''), 4500)
  }

  // Update booking approval status (Pending / Confirmed / Rejected)
  const handleUpdateStatus = async (bookingId, newStatus) => {
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    const updated = {
      ...target,
      bookingStatus: newStatus,
      statusUpdatedAt: new Date().toISOString()
    }

    try {
      await bookingsApi.update(bookingId, updated)
    } catch (err) {
      console.warn('API sync warning, saving locally:', err)
    }

    const updatedList = bookings.map(b => String(b.id) === String(bookingId) ? updated : b)
    setBookings(updatedList)
    localStorage.setItem('dw_bookings', JSON.stringify(updatedList))

    // If modal is open for this booking, update it
    if (selectedBooking && String(selectedBooking.id) === String(bookingId)) {
      setSelectedBooking(updated)
    }

    if (newStatus === 'confirmed') {
      showNotification(`Booking #${bookingId} for ${target.name} is now CONFIRMED! Client can now pay the 50% advance.`)
    } else if (newStatus === 'rejected') {
      showNotification(`Booking #${bookingId} has been marked as REJECTED.`)
    } else {
      showNotification(`Booking #${bookingId} status reset to PENDING.`)
    }
  }

  // Toggle or record payment for a booking
  const handleTogglePayment = async (bookingId, phase) => {
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    let updated = { ...target }

    if (phase === 'advance') {
      const isPaid = !(target.advancePaid || target.paymentStatus === 'Advance Paid')
      updated.advancePaid = isPaid
      updated.advanceTxnId = isPaid ? (target.advanceTxnId || 'TXN_ADM_' + Date.now().toString().slice(-6)) : ''
      updated.paymentStatus = isPaid ? (target.balancePaid ? 'Fully Paid' : 'Advance Paid') : 'Pending Payment'
    } else if (phase === 'balance') {
      const isPaid = !target.balancePaid
      updated.balancePaid = isPaid
      updated.balanceTxnId = isPaid ? (target.balanceTxnId || 'TXN_BAL_' + Date.now().toString().slice(-6)) : ''
      updated.paymentStatus = isPaid ? 'Fully Paid' : (updated.advancePaid ? 'Advance Paid' : 'Pending Payment')
    }

    try {
      await bookingsApi.update(bookingId, updated)
    } catch (err) {
      console.warn('API sync warning:', err)
    }

    const updatedList = bookings.map(b => String(b.id) === String(bookingId) ? updated : b)
    setBookings(updatedList)
    localStorage.setItem('dw_bookings', JSON.stringify(updatedList))

    if (selectedBooking && String(selectedBooking.id) === String(bookingId)) {
      setSelectedBooking(updated)
    }

    showNotification(`Payment records updated for booking #${bookingId}`)
  }

  // Delete booking
  const handleDeleteBooking = async (bookingId) => {
    const confirmToast = document.createElement('div')
    confirmToast.className = 'dw-toast-item toast-error'
    confirmToast.style.cssText = 'min-width:300px;'
    confirmToast.innerHTML = `
      <span class="dw-toast-icon">🗑️</span>
      <div class="dw-toast-body">
        <div class="dw-toast-title">Delete Booking?</div>
        <div class="dw-toast-msg">Permanently delete booking #${bookingId}? This cannot be undone.</div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button id="adm-del-yes-${bookingId}" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:0.8rem;font-weight:600;">Delete</button>
          <button id="adm-del-no-${bookingId}" style="background:#eee;color:#333;border:none;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:0.8rem;">Cancel</button>
        </div>
      </div>
      <span class="dw-toast-progress toast-error" style="animation-duration:6000ms"></span>
    `
    const root = document.getElementById('dw-toast-root') || document.body
    root.appendChild(confirmToast)
    const dismiss = () => {
      confirmToast.classList.add('toast-exit')
      confirmToast.addEventListener('animationend', () => confirmToast.remove(), { once: true })
    }
    document.getElementById(`adm-del-yes-${bookingId}`)?.addEventListener('click', async () => {
      dismiss()
      try {
        await bookingsApi.delete(bookingId)
      } catch (err) {
        console.warn('API delete error, deleting locally:', err)
      }
      const filtered = bookings.filter(b => String(b.id) !== String(bookingId))
      setBookings(filtered)
      localStorage.setItem('dw_bookings', JSON.stringify(filtered))
      if (selectedBooking && String(selectedBooking.id) === String(bookingId)) {
        setSelectedBooking(null)
      }
      showNotification(`Booking #${bookingId} was successfully deleted.`)
    })
    document.getElementById(`adm-del-no-${bookingId}`)?.addEventListener('click', dismiss)
    setTimeout(dismiss, 6000)
  }

  // Delete contact message
  const handleDeleteContact = async (contactId) => {
    try {
      await contactsApi.delete(contactId)
    } catch (e) {}
    const filtered = contacts.filter(c => String(c.id) !== String(contactId))
    setContacts(filtered)
    localStorage.setItem('dw_contacts', JSON.stringify(filtered))
    showNotification('Contact message removed.')
  }

  // Toggle feedback visibility/approval status (Approved <-> Pending)
  const handleToggleReviewStatus = async (reviewId) => {
    const target = reviews.find(r => String(r.id) === String(reviewId))
    if (!target) return
    const currentStatus = target.status || 'approved'
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved'
    const updated = { ...target, status: newStatus }
    try {
      await reviewsApi.update(reviewId, updated)
    } catch (e) {}
    const updatedList = reviews.map(r => String(r.id) === String(reviewId) ? updated : r)
    setReviews(updatedList)
    localStorage.setItem('dw_reviews', JSON.stringify(updatedList))
    showNotification(newStatus === 'approved' ? 'Feedback marked as Approved (Visible on website).' : 'Feedback moved to Pending (Hidden).')
  }

  // Toggle featured on Homepage status
  const handleToggleReviewFeatured = async (reviewId) => {
    const target = reviews.find(r => String(r.id) === String(reviewId))
    if (!target) return
    const newFeatured = !target.featured
    const updated = { ...target, featured: newFeatured }
    try {
      await reviewsApi.update(reviewId, updated)
    } catch (e) {}
    const updatedList = reviews.map(r => String(r.id) === String(reviewId) ? updated : r)
    setReviews(updatedList)
    localStorage.setItem('dw_reviews', JSON.stringify(updatedList))
    showNotification(newFeatured ? 'Feedback marked as Featured on Homepage!' : 'Feedback removed from Homepage features.')
  }

  // Delete feedback review
  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.showConfirm
      ? await window.showConfirm({
          title: 'Delete Customer Review?',
          message: 'Are you sure you want to permanently delete this customer feedback? This action cannot be undone.',
          type: 'danger',
          confirmText: 'Delete Review',
          cancelText: 'Keep Review',
          icon: 'fa-solid fa-trash-can'
        })
      : window.confirm('Are you sure you want to permanently delete this customer feedback?')

    if (!confirmed) return

    try {
      await reviewsApi.delete(reviewId)
    } catch (e) {}
    const filtered = reviews.filter(r => String(r.id) !== String(reviewId))
    setReviews(filtered)
    localStorage.setItem('dw_reviews', JSON.stringify(filtered))
    showNotification('Customer feedback has been deleted.')
  }

  // Open feedback modal for add or edit
  const handleOpenFeedbackModal = (review = null) => {
    if (review) {
      setEditingFeedback(review)
      setFeedbackFormData({
        name: review.name || '',
        email: review.email || '',
        rating: Number(review.rating) || 5,
        date: review.date || '',
        coupleImg: review.coupleImg || '',
        text: review.text || '',
        status: review.status || 'approved',
        featured: Boolean(review.featured)
      })
    } else {
      setEditingFeedback(null)
      setFeedbackFormData({
        name: '',
        email: '',
        rating: 5,
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        coupleImg: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
        text: '',
        status: 'approved',
        featured: true
      })
    }
    setIsFeedbackModalOpen(true)
  }

  // Save feedback handler (Add or Edit)
  const handleSaveFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackFormData.name.trim() || !feedbackFormData.text.trim()) {
      showNotification('Please fill in client name and feedback message.')
      return
    }

    if (editingFeedback) {
      const updated = {
        ...editingFeedback,
        ...feedbackFormData,
        rating: Number(feedbackFormData.rating)
      }
      try {
        await reviewsApi.update(editingFeedback.id, updated)
      } catch (err) {}
      const updatedList = reviews.map(r => String(r.id) === String(editingFeedback.id) ? updated : r)
      setReviews(updatedList)
      localStorage.setItem('dw_reviews', JSON.stringify(updatedList))
      showNotification('Feedback successfully updated!')
    } else {
      const newReview = {
        ...feedbackFormData,
        id: 'rv_' + Date.now(),
        rating: Number(feedbackFormData.rating)
      }
      try {
        await reviewsApi.create(newReview)
      } catch (err) {}
      const updatedList = [newReview, ...reviews]
      setReviews(updatedList)
      localStorage.setItem('dw_reviews', JSON.stringify(updatedList))
      showNotification('New feedback added successfully!')
    }
    setIsFeedbackModalOpen(false)
  }

  // Filtered reviews memo
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const q = feedbackSearch.toLowerCase().trim()
      const matchesSearch = !q ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.text && r.text.toLowerCase().includes(q))

      const matchesRating = feedbackRatingFilter === 'all' ||
        Number(r.rating) === Number(feedbackRatingFilter)

      const rStatus = r.status || 'approved'
      const matchesStatus = feedbackStatusFilter === 'all' ||
        (feedbackStatusFilter === 'featured' ? Boolean(r.featured) : rStatus === feedbackStatusFilter)

      return matchesSearch && matchesRating && matchesStatus
    })
  }, [reviews, feedbackSearch, feedbackRatingFilter, feedbackStatusFilter])

  // Feedback statistics
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '0.0'
    const total = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0)
    return (total / reviews.length).toFixed(1)
  }, [reviews])

  const fiveStarReviewsCount = useMemo(() => {
    return reviews.filter(r => Number(r.rating) === 5).length
  }, [reviews])

  const featuredReviewsCount = useMemo(() => {
    return reviews.filter(r => Boolean(r.featured)).length
  }, [reviews])


  // Statistics
  const totalCount = bookings.length
  const pendingBookings = useMemo(() => {
    return bookings.filter(b => !b.bookingStatus || b.bookingStatus === 'pending')
  }, [bookings])
  const pendingCount = pendingBookings.length

  const confirmedBookings = useMemo(() => {
    return bookings.filter(b => b.bookingStatus === 'confirmed')
  }, [bookings])
  const confirmedCount = confirmedBookings.length

  const advancePaidCount = useMemo(() => {
    return bookings.filter(b => b.advancePaid || b.paymentStatus === 'Advance Paid').length
  }, [bookings])

  const fullyPaidCount = useMemo(() => {
    return bookings.filter(b => b.balancePaid || b.paymentStatus === 'Fully Paid' || b.paymentStatus === 'Paid').length
  }, [bookings])

  // Extract unique services for dropdown filter
  const serviceOptions = useMemo(() => {
    const set = new Set()
    bookings.forEach(b => {
      if (b.service) set.add(b.service)
    })
    return Array.from(set)
  }, [bookings])

  // Filtered bookings list based on search, status filter, and service filter
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.service && b.service.toLowerCase().includes(q)) ||
        (b.id && String(b.id).toLowerCase().includes(q)) ||
        (b.venue && b.venue.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (serviceFilter !== 'all' && b.service !== serviceFilter) {
        return false
      }

      if (statusFilter === 'pending') {
        return !b.bookingStatus || b.bookingStatus === 'pending'
      }
      if (statusFilter === 'confirmed') {
        return b.bookingStatus === 'confirmed'
      }
      if (statusFilter === 'rejected') {
        return b.bookingStatus === 'rejected'
      }
      if (statusFilter === 'advance_paid') {
        return b.advancePaid || b.paymentStatus === 'Advance Paid'
      }
      if (statusFilter === 'fully_paid') {
        return b.balancePaid || b.paymentStatus === 'Fully Paid' || b.paymentStatus === 'Paid'
      }
      return true
    })
  }, [bookings, searchQuery, statusFilter, serviceFilter])

  // Paid Bookings (bookings eligible for vendor allocation)
  const paidBookings = useMemo(() => {
    return bookings.filter(b => b.advancePaid || b.balancePaid || b.paymentStatus === 'Paid' || b.paymentStatus === 'Advance Paid' || b.paymentStatus === 'Fully Paid')
  }, [bookings])

  // Total Customer Revenue, Total Vendor Cost, Expected Profit
  const totalCustomerRevenue = useMemo(() => {
    return paidBookings.reduce((sum, b) => sum + getCustomerRevenue(b), 0)
  }, [paidBookings])

  const totalVendorCost = useMemo(() => {
    return paidBookings.reduce((sum, b) => sum + getBookingVendorCost(b), 0)
  }, [paidBookings])

  const expectedProfit = totalCustomerRevenue - totalVendorCost
  const profitMargin = totalCustomerRevenue > 0 ? Math.round((expectedProfit / totalCustomerRevenue) * 100) : 0

  // Remove a vendor from a booking (e.g. to undo a mistaken approval).
  // Vendors are attached to a booking only via the Assign & Approve Vendors
  // workflow (see VendorTaskAssignment) — there is no separate manual
  // allocation path anymore.
  const handleRemoveAllocation = async (bookingId, allocationId) => {
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    const updatedAllocations = (target.vendorAllocations || []).filter(a => a.allocationId !== allocationId)
    const updated = {
      ...target,
      vendorAllocations: updatedAllocations,
      updatedAt: new Date().toISOString()
    }

    const updatedList = bookings.map(b => String(b.id) === String(bookingId) ? updated : b)
    setBookings(updatedList)
    localStorage.setItem('dw_bookings', JSON.stringify(updatedList))

    if (selectedBooking && String(selectedBooking.id) === String(bookingId)) {
      setSelectedBooking(updated)
    }

    try {
      await bookingsApi.update(bookingId, updated)
    } catch (err) {
      console.warn('API sync warning:', err)
    }

    showNotification(`Vendor assignment removed from Booking #${String(bookingId).slice(-6)}`)
  }

  // Update Vendor Payout status
  const handleUpdateVendorPayout = async (bookingId, allocationId, newStatus) => {
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    const updatedAllocations = (target.vendorAllocations || []).map(alloc => {
      if (alloc.allocationId === allocationId) {
        return {
          ...alloc,
          payout: {
            ...alloc.payout,
            payoutStatus: newStatus,
            advancePaidAt: newStatus === 'Advance Paid' || newStatus === 'Fully Paid' ? (alloc.payout?.advancePaidAt || new Date().toISOString()) : null,
            fullyPaidAt: newStatus === 'Fully Paid' ? new Date().toISOString() : null
          }
        }
      }
      return alloc
    })

    const updated = {
      ...target,
      vendorAllocations: updatedAllocations,
      updatedAt: new Date().toISOString()
    }

    const updatedList = bookings.map(b => String(b.id) === String(bookingId) ? updated : b)
    setBookings(updatedList)
    localStorage.setItem('dw_bookings', JSON.stringify(updatedList))

    if (selectedBooking && String(selectedBooking.id) === String(bookingId)) {
      setSelectedBooking(updated)
    }

    try {
      await bookingsApi.update(bookingId, updated)
    } catch (err) {
      console.warn('API sync warning:', err)
    }

    showNotification(`Vendor payout marked as ${newStatus} for Booking #${String(bookingId).slice(-6)}`)
  }

  // ==============================================================
  // 1. LOGIN SCREEN (Uses Official Website Logo /images/logo.svg)
  // ==============================================================
  if (!isAdminLoggedIn) {
    return (
      <div className="dw-login-page">
        <div className="dw-login-card">
          <div className="dw-login-brand">
            <img src="/images/logo.svg" alt="Dream Wedding Logo" className="dw-login-brand-logo" />
            <span className="dw-login-badge">
              <i className="fa-solid fa-shield-halved" style={{ marginRight: '6px' }}></i> Admin Control Center
            </span>
            <p>Enter administrator credentials to manage reservations, approvals, and milestone payments.</p>
          </div>

          {loginError && (
            <div className="dw-login-alert-error">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div className="dw-form-group">
              <label>
                <i className="fa-solid fa-envelope"></i> Admin Email
              </label>
              <div className="dw-input-wrapper">
                <input
                  type="email"
                  required
                  placeholder="admin@dreamwedding.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="dw-form-group">
              <label>
                <i className="fa-solid fa-key"></i> Admin Password
              </label>
              <div className="dw-input-wrapper">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="dw-btn-login">
              <i className="fa-solid fa-lock-open"></i> Sign In to Admin Console
            </button>
          </form>

          <div className="dw-login-back">
            <Link to="/">
              <i className="fa-solid fa-arrow-left"></i> Return to Main Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ==============================================================
  // 2. MAIN ADMIN DASHBOARD (With Full Sidebar & Official Website Logo)
  // ==============================================================
  return (
    <div className="dw-admin-shell">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div className="dw-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* ------------------- SIDEBAR ------------------- */}
      <aside className={`dw-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Brand Header with Official Website Logo */}
        <div className="dw-sidebar-header">
          <Link to="/" className="dw-sidebar-brand" title="Visit Dream Wedding Homepage">
            <img src="/images/logo.svg" alt="Dream Wedding Logo" className="dw-sidebar-logo-img" />
            <span className="dw-sidebar-badge">
              <i className="fa-solid fa-lock" style={{ fontSize: '0.65rem' }}></i> Admin Console
            </span>
          </Link>
          <button className="dw-sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="dw-sidebar-nav">
          <ul className="dw-nav-list">
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-chart-pie"></i>
                  <span>Overview</span>
                </div>
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-calendar-check"></i>
                  <span>All Bookings</span>
                </div>
                <span className="dw-badge-pill dw-badge-neutral">{totalCount}</span>
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => handleTabChange('pending')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  <span>Pending Approvals</span>
                </div>
                {pendingCount > 0 && (
                  <span className="dw-badge-pill dw-badge-pending">{pendingCount}</span>
                )}
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'confirmed' ? 'active' : ''}`}
                onClick={() => handleTabChange('confirmed')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Confirmed</span>
                </div>
                <span className="dw-badge-pill dw-badge-confirmed">{confirmedCount}</span>
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
                onClick={() => handleTabChange('payments')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-credit-card"></i>
                  <span>Payments Tracker</span>
                </div>
                <span className="dw-badge-pill dw-badge-neutral">
                  {advancePaidCount + fullyPaidCount}
                </span>
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'vendor_mgmt' ? 'active' : ''}`}
                onClick={() => handleTabChange('vendor_mgmt')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-users-gear" style={{ color: '#d4af37' }}></i>
                  <span>Vendors</span>
                </div>
                <span className="dw-badge-pill dw-badge-neutral">{vendors.length}</span>
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'task_assign' ? 'active' : ''}`}
                onClick={() => handleTabChange('task_assign')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-clipboard-list" style={{ color: '#d4af37' }}></i>
                  <span>Assign &amp; Approve Vendors</span>
                </div>
                <span className="dw-badge-pill dw-badge-neutral">
                  {vendorTasks.filter(t => t.status === 'Pending' || t.status === 'Vendor Responded').length}
                </span>
              </div>
            </li>
          </ul>

          <div className="dw-nav-section-title">Management</div>
          <ul className="dw-nav-list">
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => handleTabChange('users')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-users"></i>
                  <span>Registered Clients</span>
                </div>
                <span className="dw-badge-pill dw-badge-neutral">{users.length}</span>
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'inquiries' ? 'active' : ''}`}
                onClick={() => handleTabChange('inquiries')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-envelope-open-text"></i>
                  <span>Inquiries</span>
                </div>
                <span className="dw-badge-pill dw-badge-neutral">{contacts.length}</span>
              </div>
            </li>
            <li>
              <div
                className={`dw-nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
                onClick={() => handleTabChange('feedback')}
              >
                <div className="dw-nav-item-left">
                  <i className="fa-solid fa-star" style={{ color: '#f59e0b' }}></i>
                  <span>Client Feedbacks</span>
                </div>
                <span className="dw-badge-pill dw-badge-neutral">{reviews.length}</span>
              </div>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer Links */}
        <div className="dw-sidebar-footer">
          <Link to="/" className="dw-sidebar-btn-link" title="Open live public website">
            <i className="fa-solid fa-globe" style={{ color: '#0284c7' }}></i>
            <span>Visit Live Website</span>
          </Link>
          <button className="dw-btn-logout-sidebar" onClick={handleAdminLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ------------------- MAIN WORKSPACE ------------------- */}
      <div className="dw-workspace">
        {/* Content Body */}
        <main className="dw-content">
          <button className="dw-mobile-toggle" onClick={() => setIsSidebarOpen(true)} style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-bars"></i>
          </button>
          {/* Action Notification Toast */}
          {actionMessage && (
            <div className="dw-toast">
              <i className="fa-solid fa-circle-check" style={{ fontSize: '1.2rem' }}></i>
              <span>{actionMessage}</span>
            </div>
          )}


              {/* ==============================================================
                  TAB 1: OVERVIEW DASHBOARD
                  ============================================================== */}
              {activeTab === 'overview' && (
                <>
                  {/* KPI Stat Cards */}
                  <div className="dw-stats-grid">
                    <div className="dw-stat-card card-total">
                      <div className="dw-stat-info">
                        <span className="dw-stat-label">Total Reservations</span>
                        <span className="dw-stat-number">{totalCount}</span>
                        <span className="dw-stat-subtext">All time bookings placed</span>
                      </div>
                      <div className="dw-stat-icon">
                        <i className="fa-solid fa-calendar-days"></i>
                      </div>
                    </div>

                    <div className="dw-stat-card card-pending">
                      <div className="dw-stat-info">
                        <span className="dw-stat-label">Awaiting Approval</span>
                        <span className="dw-stat-number">{pendingCount}</span>
                        <span className="dw-stat-subtext">Requires admin review</span>
                      </div>
                      <div className="dw-stat-icon">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </div>
                    </div>

                    <div className="dw-stat-card card-confirmed">
                      <div className="dw-stat-info">
                        <span className="dw-stat-label">Confirmed Bookings</span>
                        <span className="dw-stat-number">{confirmedCount}</span>
                        <span className="dw-stat-subtext">Ready / In-progress</span>
                      </div>
                      <div className="dw-stat-icon">
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                    </div>

                    <div className="dw-stat-card card-revenue">
                      <div className="dw-stat-info">
                        <span className="dw-stat-label">Paid Milestones</span>
                        <span className="dw-stat-number">{advancePaidCount + fullyPaidCount}</span>
                        <span className="dw-stat-subtext">{advancePaidCount} Advance &bull; {fullyPaidCount} Full</span>
                      </div>
                      <div className="dw-stat-icon">
                        <i className="fa-solid fa-indian-rupee-sign"></i>
                      </div>
                    </div>

                    <div className="dw-stat-card" style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b' }} onClick={() => handleTabChange('feedback')}>
                      <div className="dw-stat-info">
                        <span className="dw-stat-label">Client Feedbacks</span>
                        <span className="dw-stat-number">{reviews.length} <span style={{ fontSize: '0.88rem', color: '#d97706', fontWeight: 600 }}>({averageRating} ★)</span></span>
                        <span className="dw-stat-subtext">{featuredReviewsCount} Featured &bull; {fiveStarReviewsCount} 5-Star</span>
                      </div>
                      <div className="dw-stat-icon" style={{ color: '#d97706', background: '#fef3c7' }}>
                        <i className="fa-solid fa-star"></i>
                      </div>
                    </div>
                  </div>

                  {/* Admin Profit & Financial Analytics Banner */}
                  <div className="dw-profit-banner">
                    <div className="dw-profit-banner-header">
                      <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212, 175, 55, 0.2)', color: '#facc15', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          <i className="fa-solid fa-chart-line"></i> Financial Intelligence
                        </div>
                        <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.25rem', fontWeight: 800 }}>
                          Admin Revenue & Profit Analytics
                        </h3>
                      </div>
                      <div>
                        <button
                          className="dw-topbar-btn"
                          onClick={() => handleTabChange('vendors')}
                          style={{ background: '#b8860b', borderColor: '#b8860b', color: '#fff' }}
                        >
                          <i className="fa-solid fa-handshake" style={{ marginRight: '6px' }}></i> Manage Vendor Allocations
                        </button>
                      </div>
                    </div>

                    <div className="dw-profit-formula-strip">
                      <div className="dw-profit-node revenue">
                        <div className="dw-node-label">
                          <i className="fa-solid fa-wallet" style={{ color: '#38bdf8' }}></i> Customer Revenue
                        </div>
                        <div className="dw-node-val">
                          ₹{Number(totalCustomerRevenue).toLocaleString('en-IN')}
                        </div>
                        <div className="dw-node-sub">From {paidBookings.length} paid reservations</div>
                      </div>

                      <div className="dw-formula-op">−</div>

                      <div className="dw-profit-node cost">
                        <div className="dw-node-label">
                          <i className="fa-solid fa-handshake" style={{ color: '#f87171' }}></i> Total Vendor Cost
                        </div>
                        <div className="dw-node-val">
                          ₹{Number(totalVendorCost).toLocaleString('en-IN')}
                        </div>
                        <div className="dw-node-sub">Allocated wedding vendors</div>
                      </div>

                      <div className="dw-formula-op">=</div>

                      <div className="dw-profit-node profit">
                        <div className="dw-node-label">
                          <i className="fa-solid fa-sack-dollar" style={{ color: '#4ade80' }}></i> Expected Profit
                        </div>
                        <div className="dw-node-val" style={{ color: expectedProfit >= 0 ? '#4ade80' : '#f87171' }}>
                          ₹{Number(expectedProfit).toLocaleString('en-IN')}
                        </div>
                        <div className="dw-node-sub" style={{ color: '#86efac', fontWeight: 700 }}>
                          {profitMargin}% Expected Gross Margin
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Urgent Queue: Bookings Needing Approval */}
                  {pendingCount > 0 && (
                    <div className="dw-queue-section">
                      <div className="dw-queue-header">
                        <div className="dw-queue-title">
                          <i className="fa-solid fa-bell" style={{ color: '#d97706', fontSize: '1.2rem' }}></i>
                          <h3>Action Needed: Approvals Queue</h3>
                        </div>
                        <span className="dw-queue-tag">{pendingCount} Pending</span>
                      </div>

                      <div className="dw-queue-grid">
                        {pendingBookings.slice(0, 6).map((b) => (
                          <div key={b.id} className="dw-queue-card">
                            <div className="dw-queue-card-top">
                              <div className="dw-queue-client">
                                <h4>{b.name || 'Client Reservation'}</h4>
                                <span>{b.email} &bull; {b.phone || 'No phone'}</span>
                              </div>
                              <span className="dw-queue-service">{b.service}</span>
                            </div>

                            <div className="dw-queue-details">
                              <span><i className="fa-solid fa-calendar"></i> {b.date || 'TBD'}</span>
                              <span><i className="fa-solid fa-location-dot"></i> {b.venue || b.address || 'Venue TBD'}</span>
                              <span><i className="fa-solid fa-wallet"></i> {b.budget || 'Custom'}</span>
                            </div>

                            <div className="dw-queue-actions">
                              <button
                                className="dw-btn-approve-quick"
                                onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                title="Confirm and unlock payment for user"
                              >
                                <i className="fa-solid fa-check"></i> Approve
                              </button>
                              <button
                                className="dw-btn-reject-quick"
                                onClick={() => handleUpdateStatus(b.id, 'rejected')}
                              >
                                <i className="fa-solid fa-xmark"></i> Reject
                              </button>
                              <button
                                className="dw-btn-action"
                                onClick={() => setSelectedBooking(b)}
                                title="View details"
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Bookings Quick Table */}
                  <div className="dw-panel-card">
                    <div className="dw-panel-header">
                      <div className="dw-panel-title-area">
                        <i className="fa-solid fa-list-check" style={{ color: '#b8860b' }}></i>
                        <h3>Recent Client Reservations</h3>
                      </div>
                      <button
                        className="dw-topbar-btn"
                        onClick={() => handleTabChange('all')}
                      >
                        View All Bookings <i className="fa-solid fa-arrow-right" style={{ marginLeft: '4px' }}></i>
                      </button>
                    </div>

                    <div className="dw-table-wrapper">
                      <table className="dw-table">
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>Service & Event</th>
                            <th>Event Date</th>
                            <th>Budget</th>
                            <th>Approval Status</th>
                            <th>Payment</th>
                            <th>Quick Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.slice(0, 8).map((b) => {
                            const isConfirmed = b.bookingStatus === 'confirmed'
                            const isRejected = b.bookingStatus === 'rejected'
                            const isPending = !isConfirmed && !isRejected

                            const isFullyPaid = b.balancePaid || b.paymentStatus === 'Fully Paid' || b.paymentStatus === 'Paid'
                            const isAdvancePaid = !isFullyPaid && (b.advancePaid || b.paymentStatus === 'Advance Paid')

                            return (
                              <tr key={b.id} className={isPending ? 'row-needs-attention' : ''}>
                                <td>
                                  <div className="dw-cell-client">
                                    <div className="dw-client-avatar-mini">
                                      <i className="fa-solid fa-user"></i>
                                    </div>
                                    <div>
                                      <div className="dw-client-name">{b.name || 'Client'}</div>
                                      <div className="dw-client-sub">{b.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <strong>{b.service}</strong>
                                  <div className="dw-client-sub">{b.eventType || 'Wedding Event'}</div>
                                </td>
                                <td>{b.date || 'TBD'}</td>
                                <td>{b.budget || 'Custom'}</td>
                                <td>
                                  {isConfirmed && (
                                    <span className="dw-status-tag status-confirmed">
                                      <i className="fa-solid fa-circle-check"></i> Confirmed
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="dw-status-tag status-pending">
                                      <i className="fa-solid fa-clock"></i> Needs Approval
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="dw-status-tag status-rejected">
                                      <i className="fa-solid fa-ban"></i> Rejected
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {isFullyPaid && (
                                    <span className="dw-pay-tag pay-fully">
                                      <i className="fa-solid fa-receipt"></i> Fully Paid
                                    </span>
                                  )}
                                  {isAdvancePaid && (
                                    <span className="dw-pay-tag pay-advance">
                                      <i className="fa-solid fa-hourglass-half"></i> 50% Advance
                                    </span>
                                  )}
                                  {!isFullyPaid && !isAdvancePaid && (
                                    <span className="dw-pay-tag pay-unpaid">
                                      <i className="fa-solid fa-circle-xmark"></i> Unpaid
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div className="dw-actions-group">
                                    {isPending ? (
                                      <>
                                        <button
                                          className="dw-btn-action action-approve"
                                          onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                          title="Confirm booking"
                                        >
                                          <i className="fa-solid fa-check"></i>
                                        </button>
                                        <button
                                          className="dw-btn-action action-reject"
                                          onClick={() => handleUpdateStatus(b.id, 'rejected')}
                                          title="Reject booking"
                                        >
                                          <i className="fa-solid fa-xmark"></i>
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        className="dw-btn-action"
                                        onClick={() => handleUpdateStatus(b.id, 'pending')}
                                        title="Reset to Pending"
                                      >
                                        <i className="fa-solid fa-rotate-left"></i>
                                      </button>
                                    )}
                                    <button
                                      className="dw-btn-action"
                                      onClick={() => setSelectedBooking(b)}
                                      title="View Details Dossier"
                                    >
                                      <i className="fa-solid fa-eye"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ==============================================================
                  TAB 2: BOOKINGS LIST (ALL / PENDING / CONFIRMED / REJECTED)
                  ============================================================== */}
              {(activeTab === 'all' || activeTab === 'pending' || activeTab === 'confirmed') && (
                <div className="dw-panel-card">
                  {/* Toolbar */}
                  <div className="dw-panel-header">
                    <div className="dw-filter-pills">
                      <button
                        className={`dw-pill ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                      >
                        All ({totalCount})
                      </button>
                      <button
                        className={`dw-pill pill-pending ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                      >
                        <i className="fa-solid fa-clock"></i> Needs Approval ({pendingCount})
                      </button>
                      <button
                        className={`dw-pill pill-confirmed ${statusFilter === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('confirmed')}
                      >
                        <i className="fa-solid fa-circle-check"></i> Confirmed ({confirmedCount})
                      </button>
                      <button
                        className={`dw-pill ${statusFilter === 'advance_paid' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('advance_paid')}
                      >
                        <i className="fa-solid fa-hourglass-half"></i> 50% Advance ({advancePaidCount})
                      </button>
                      <button
                        className={`dw-pill ${statusFilter === 'fully_paid' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('fully_paid')}
                      >
                        <i className="fa-solid fa-receipt"></i> Fully Paid ({fullyPaidCount})
                      </button>
                      <button
                        className={`dw-pill ${statusFilter === 'rejected' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('rejected')}
                      >
                        <i className="fa-solid fa-ban"></i> Rejected
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Service Filter */}
                      {serviceOptions.length > 0 && (
                        <select
                          className="dw-topbar-btn"
                          value={serviceFilter}
                          onChange={(e) => setServiceFilter(e.target.value)}
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="all">All Services</option>
                          {serviceOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}

                      {/* View mode toggle */}
                      <div className="dw-view-switch">
                        <button
                          className={`dw-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                          onClick={() => setViewMode('table')}
                          title="Table View"
                        >
                          <i className="fa-solid fa-table-list"></i>
                        </button>
                        <button
                          className={`dw-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                          onClick={() => setViewMode('cards')}
                          title="Card Grid View"
                        >
                          <i className="fa-solid fa-grip"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Empty state */}
                  {filteredBookings.length === 0 ? (
                    <div className="dw-empty-state">
                      <div className="dw-empty-icon">
                        <i className="fa-solid fa-folder-open"></i>
                      </div>
                      <h3>No Bookings Found</h3>
                      <p>
                        {searchQuery || statusFilter !== 'all' || serviceFilter !== 'all'
                          ? 'No reservations matched your current filter criteria or search query.'
                          : 'No reservations have been registered yet.'}
                      </p>
                      {(searchQuery || statusFilter !== 'all' || serviceFilter !== 'all') && (
                        <button
                          className="dw-topbar-btn dw-topbar-btn-primary"
                          onClick={() => {
                            setSearchQuery('')
                            setStatusFilter('all')
                            setServiceFilter('all')
                          }}
                          style={{ margin: '0 auto' }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  ) : viewMode === 'table' ? (
                    /* ---------------- TABLE VIEW ---------------- */
                    <div className="dw-table-wrapper">
                      <table className="dw-table">
                        <thead>
                          <tr>
                            <th>ID & Client</th>
                            <th>Service & Event</th>
                            <th>Date & Venue</th>
                            <th>Budget</th>
                            <th>Approval Status</th>
                            <th>Payment Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookings.map((b) => {
                            const isConfirmed = b.bookingStatus === 'confirmed'
                            const isRejected = b.bookingStatus === 'rejected'
                            const isPending = !isConfirmed && !isRejected

                            const isFullyPaid = b.balancePaid || b.paymentStatus === 'Fully Paid' || b.paymentStatus === 'Paid'
                            const isAdvancePaid = !isFullyPaid && (b.advancePaid || b.paymentStatus === 'Advance Paid')

                            return (
                              <tr key={b.id} className={isPending ? 'row-needs-attention' : ''}>
                                <td>
                                  <div className="dw-cell-client">
                                    <div className="dw-client-avatar-mini">
                                      <i className="fa-solid fa-user"></i>
                                    </div>
                                    <div>
                                      <div className="dw-client-name">{b.name || 'Client'}</div>
                                      <div className="dw-client-sub">
                                        <span>#{String(b.id).slice(-6)}</span>
                                        <span>&bull;</span>
                                        <span>{b.email}</span>
                                      </div>
                                      {b.phone && <div className="dw-client-sub"><i className="fa-solid fa-phone" style={{ fontSize: '0.7rem' }}></i> {b.phone}</div>}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <strong>{b.service}</strong>
                                  <div className="dw-client-sub">{b.eventType || 'Wedding'}</div>
                                </td>
                                <td>
                                  <div><i className="fa-solid fa-calendar-day" style={{ color: '#b8860b', marginRight: '5px' }}></i> {b.date || 'TBD'}</div>
                                  <div className="dw-client-sub"><i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i> {b.venue || b.address || 'Venue TBD'}</div>
                                </td>
                                <td>
                                  <strong>{b.budget || 'Custom'}</strong>
                                  {b.guests && b.guests !== 'N/A' && (
                                    <div className="dw-client-sub">{b.guests} Guests</div>
                                  )}
                                </td>
                                <td>
                                  {isConfirmed && (
                                    <span className="dw-status-tag status-confirmed">
                                      <i className="fa-solid fa-circle-check"></i> Confirmed
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="dw-status-tag status-pending">
                                      <i className="fa-solid fa-clock"></i> Needs Approval
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="dw-status-tag status-rejected">
                                      <i className="fa-solid fa-ban"></i> Rejected
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {isFullyPaid && (
                                    <span className="dw-pay-tag pay-fully">
                                      <i className="fa-solid fa-receipt"></i> Fully Paid
                                    </span>
                                  )}
                                  {isAdvancePaid && (
                                    <span className="dw-pay-tag pay-advance">
                                      <i className="fa-solid fa-hourglass-half"></i> 50% Advance
                                    </span>
                                  )}
                                  {!isFullyPaid && !isAdvancePaid && (
                                    <span className="dw-pay-tag pay-unpaid">
                                      <i className="fa-solid fa-circle-xmark"></i> Unpaid
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div className="dw-actions-group">
                                    {isPending ? (
                                      <>
                                        <button
                                          className="dw-btn-action action-approve"
                                          onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                          title="Confirm and unlock payment for client"
                                        >
                                          <i className="fa-solid fa-check"></i>
                                        </button>
                                        <button
                                          className="dw-btn-action action-reject"
                                          onClick={() => handleUpdateStatus(b.id, 'rejected')}
                                          title="Reject booking"
                                        >
                                          <i className="fa-solid fa-xmark"></i>
                                        </button>
                                      </>
                                    ) : isConfirmed ? (
                                      <button
                                        className="dw-btn-action"
                                        onClick={() => handleUpdateStatus(b.id, 'pending')}
                                        title="Revert to Pending"
                                      >
                                        <i className="fa-solid fa-rotate-left"></i>
                                      </button>
                                    ) : (
                                      <button
                                        className="dw-btn-action action-approve"
                                        onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                        title="Re-approve booking"
                                      >
                                        <i className="fa-solid fa-check"></i>
                                      </button>
                                    )}

                                    <button
                                      className="dw-btn-action"
                                      onClick={() => setSelectedBooking(b)}
                                      title="View Full Booking Dossier"
                                    >
                                      <i className="fa-solid fa-eye"></i>
                                    </button>

                                    <button
                                      className="dw-btn-action action-delete"
                                      onClick={() => handleDeleteBooking(b.id)}
                                      title="Delete booking"
                                    >
                                      <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* ---------------- CARDS VIEW ---------------- */
                    <div className="dw-cards-grid">
                      {filteredBookings.map((b) => {
                        const isConfirmed = b.bookingStatus === 'confirmed'
                        const isRejected = b.bookingStatus === 'rejected'
                        const isPending = !isConfirmed && !isRejected

                        const isFullyPaid = b.balancePaid || b.paymentStatus === 'Fully Paid' || b.paymentStatus === 'Paid'
                        const isAdvancePaid = !isFullyPaid && (b.advancePaid || b.paymentStatus === 'Advance Paid')

                        return (
                          <div key={b.id} className={`dw-booking-card ${isPending ? 'card-pending' : ''}`}>
                            <div>
                              <div className="dw-bcard-header">
                                <div className="dw-bcard-client">
                                  <div className="dw-client-avatar-mini">
                                    <i className="fa-solid fa-user-tie"></i>
                                  </div>
                                  <div>
                                    <h4>{b.name || 'Client Reservation'}</h4>
                                    <div className="dw-client-sub">{b.email}</div>
                                    {b.phone && <div className="dw-client-sub">{b.phone}</div>}
                                  </div>
                                </div>

                                <div className="dw-bcard-badges">
                                  {isConfirmed && (
                                    <span className="dw-status-tag status-confirmed">
                                      <i className="fa-solid fa-circle-check"></i> Confirmed
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="dw-status-tag status-pending">
                                      <i className="fa-solid fa-clock"></i> Needs Approval
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="dw-status-tag status-rejected">
                                      <i className="fa-solid fa-ban"></i> Rejected
                                    </span>
                                  )}

                                  {isFullyPaid && (
                                    <span className="dw-pay-tag pay-fully">100% Fully Paid</span>
                                  )}
                                  {isAdvancePaid && (
                                    <span className="dw-pay-tag pay-advance">50% Advance Paid</span>
                                  )}
                                </div>
                              </div>

                              <div className="dw-bcard-service-strip">
                                <span className="dw-bcard-service-name">
                                  <i className="fa-solid fa-gem" style={{ color: '#b8860b' }}></i>
                                  {b.service}
                                </span>
                                <span className="dw-bcard-date">
                                  <i className="fa-solid fa-calendar"></i> {b.date || 'TBD'}
                                </span>
                              </div>

                              <div className="dw-bcard-info-grid">
                                <div className="dw-bcard-info-item">
                                  <span className="dw-bcard-info-label">Event Type</span>
                                  <span className="dw-bcard-info-val">{b.eventType || 'Wedding'}</span>
                                </div>
                                <div className="dw-bcard-info-item">
                                  <span className="dw-bcard-info-label">Guests</span>
                                  <span className="dw-bcard-info-val">{b.guests || 'Not specified'}</span>
                                </div>
                                <div className="dw-bcard-info-item">
                                  <span className="dw-bcard-info-label">Venue</span>
                                  <span className="dw-bcard-info-val">{b.venue || b.address || 'Venue TBD'}</span>
                                </div>
                                <div className="dw-bcard-info-item">
                                  <span className="dw-bcard-info-label">Budget</span>
                                  <span className="dw-bcard-info-val">{b.budget || 'Custom'}</span>
                                </div>
                              </div>

                              {b.notes && b.notes !== 'None' && (
                                <div className="dw-bcard-notes">
                                  &ldquo;{b.notes}&rdquo;
                                </div>
                              )}
                            </div>

                            <div className="dw-bcard-actions">
                              {isPending ? (
                                <>
                                  <button
                                    className="dw-btn-bcard-approve"
                                    onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                    title="Approve booking and unlock client payment"
                                  >
                                    <i className="fa-solid fa-check"></i> Approve
                                  </button>
                                  <button
                                    className="dw-btn-bcard-reject"
                                    onClick={() => handleUpdateStatus(b.id, 'rejected')}
                                  >
                                    <i className="fa-solid fa-xmark"></i> Reject
                                  </button>
                                </>
                              ) : isConfirmed ? (
                                <button
                                  className="dw-btn-bcard-revert"
                                  onClick={() => handleUpdateStatus(b.id, 'pending')}
                                >
                                  <i className="fa-solid fa-rotate-left"></i> Reset to Pending
                                </button>
                              ) : (
                                <button
                                  className="dw-btn-bcard-approve"
                                  onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                >
                                  <i className="fa-solid fa-check"></i> Re-approve
                                </button>
                              )}

                              <button
                                className="dw-btn-action"
                                onClick={() => setSelectedBooking(b)}
                                title="View Dossier"
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>

                              <button
                                className="dw-btn-action action-delete"
                                onClick={() => handleDeleteBooking(b.id)}
                                title="Delete"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ==============================================================
                  TAB 3: PAYMENTS TRACKER
                  ============================================================== */}
              {activeTab === 'payments' && (
                <div className="dw-panel-card">
                  <div className="dw-panel-header">
                    <div className="dw-panel-title-area">
                      <i className="fa-solid fa-credit-card" style={{ color: '#b8860b' }}></i>
                      <h3>Two-Phase Milestone Payments Tracker</h3>
                    </div>
                    <div className="dw-filter-pills">
                      <span className="dw-pill pill-confirmed">
                        <i className="fa-solid fa-check"></i> 50% Advance Paid: {advancePaidCount}
                      </span>
                      <span className="dw-pill active">
                        <i className="fa-solid fa-receipt"></i> Fully Paid: {fullyPaidCount}
                      </span>
                    </div>
                  </div>

                  <div className="dw-table-wrapper">
                    <table className="dw-table">
                      <thead>
                        <tr>
                          <th>Client & Booking</th>
                          <th>Service & Date</th>
                          <th>Total Budget</th>
                          <th>Phase 1 (50% Advance)</th>
                          <th>Phase 2 (Post-Event 50%)</th>
                          <th>Overall Payment Status</th>
                          <th>Admin Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b) => {
                          const isFullyPaid = b.balancePaid || b.paymentStatus === 'Fully Paid' || b.paymentStatus === 'Paid'
                          const isAdvancePaid = !isFullyPaid && (b.advancePaid || b.paymentStatus === 'Advance Paid')

                          return (
                            <tr key={b.id}>
                              <td>
                                <div className="dw-client-name">{b.name || 'Client'}</div>
                                <div className="dw-client-sub">#{String(b.id).slice(-6)} &bull; {b.email}</div>
                              </td>
                              <td>
                                <strong>{b.service}</strong>
                                <div className="dw-client-sub">{b.date || 'Date TBD'}</div>
                              </td>
                              <td>
                                <strong>{b.budget || 'Custom'}</strong>
                              </td>
                              <td>
                                {b.advancePaid || b.paymentStatus === 'Advance Paid' || isFullyPaid ? (
                                  <div>
                                    <span className="dw-pay-tag pay-fully">
                                      <i className="fa-solid fa-check"></i> Paid
                                    </span>
                                    <div className="dw-client-sub">
                                      <code>{b.advanceTxnId || b.transactionId || 'ADV_CONFIRMED'}</code>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="dw-pay-tag pay-unpaid">Awaiting 50%</span>
                                )}
                              </td>
                              <td>
                                {b.balancePaid || isFullyPaid ? (
                                  <div>
                                    <span className="dw-pay-tag pay-fully">
                                      <i className="fa-solid fa-check"></i> Paid
                                    </span>
                                    <div className="dw-client-sub">
                                      <code>{b.balanceTxnId || 'BAL_CONFIRMED'}</code>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="dw-pay-tag pay-unpaid">Pending Final</span>
                                )}
                              </td>
                              <td>
                                {isFullyPaid && (
                                  <span className="dw-status-tag status-confirmed">
                                    <i className="fa-solid fa-circle-check"></i> 100% Cleared
                                  </span>
                                )}
                                {isAdvancePaid && (
                                  <span className="dw-status-tag status-pending">
                                    <i className="fa-solid fa-hourglass-half"></i> 50% Received
                                  </span>
                                )}
                                {!isFullyPaid && !isAdvancePaid && (
                                  <span className="dw-status-tag status-rejected">
                                    <i className="fa-solid fa-clock"></i> Unpaid
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="dw-actions-group">
                                  <button
                                    className="dw-topbar-btn"
                                    style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                    onClick={() => handleTogglePayment(b.id, 'advance')}
                                    title="Toggle Advance Payment"
                                  >
                                    {b.advancePaid ? 'Revoke Adv' : 'Verify Adv'}
                                  </button>
                                  <button
                                    className="dw-topbar-btn"
                                    style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                    onClick={() => handleTogglePayment(b.id, 'balance')}
                                    title="Toggle Balance Payment"
                                  >
                                    {b.balancePaid ? 'Revoke Bal' : 'Verify Bal'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 4: CLIENTS & USERS
                  ============================================================== */}
              {activeTab === 'users' && (
                <div className="dw-panel-card">
                  <div className="dw-panel-header">
                    <div className="dw-panel-title-area">
                      <i className="fa-solid fa-users" style={{ color: '#b8860b' }}></i>
                      <h3>Registered Website Clients ({users.length})</h3>
                    </div>
                  </div>

                  <div className="dw-table-wrapper">
                    <table className="dw-table">
                      <thead>
                        <tr>
                          <th>User Details</th>
                          <th>Email Address</th>
                          <th>Phone Number</th>
                          <th>Bookings Count</th>
                          <th>Account Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const userBookings = bookings.filter(b => b.email && b.email.toLowerCase() === (u.email || '').toLowerCase())
                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="dw-cell-client">
                                  <div className="dw-client-avatar-mini">
                                    <i className="fa-solid fa-user"></i>
                                  </div>
                                  <div className="dw-client-name">{u.name || 'Registered User'}</div>
                                </div>
                              </td>
                              <td>{u.email}</td>
                              <td>{u.phone || 'Not provided'}</td>
                              <td>
                                <span className="dw-badge-pill dw-badge-neutral">
                                  {userBookings.length} {userBookings.length === 1 ? 'Booking' : 'Bookings'}
                                </span>
                              </td>
                              <td>
                                <span className="dw-status-tag status-confirmed">Client</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  TAB 6: VENDOR MANAGEMENT
                  ============================================================== */}
              {activeTab === 'vendor_mgmt' && (
                <div className="dw-panel-card">
                  <div className="dw-panel-header">
                    <div className="dw-panel-title-area">
                      <i className="fa-solid fa-users-gear" style={{ color: '#b8860b' }}></i>
                      <h3>Vendor Management ({vendors.length})</h3>
                    </div>
                    <div className="dw-filter-pills">
                      <span className="dw-pill pill-confirmed">
                        <i className="fa-solid fa-user-check"></i> Active: {vendors.filter(v => v.status !== 'Inactive').length}
                      </span>
                    </div>
                  </div>

                  {vendors.length === 0 ? (
                    <div className="dw-empty-state">
                      <div className="dw-empty-icon">
                        <i className="fa-solid fa-users-slash"></i>
                      </div>
                      <h3>No Vendors Registered</h3>
                      <p>Vendors who register through the vendor registration form will appear here.</p>
                    </div>
                  ) : (
                    <div className="dw-table-wrapper">
                      <table className="dw-table">
                        <thead>
                          <tr>
                            <th>Vendor Details</th>
                            <th>Service Category</th>
                            <th>Contact Information</th>
                            <th>Default Rate</th>
                            <th>Assigned Tasks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendors.map((v) => {
                            const assignedTasks = bookings.filter(b => 
                              b.vendorAllocations?.some(alloc => alloc.vendorId === v.id || alloc.vendorEmail === v.email)
                            )
                            const pendingTasks = assignedTasks.filter(b => 
                              b.vendorAllocations?.some(alloc => 
                                (alloc.vendorId === v.id || alloc.vendorEmail === v.email) && alloc.status === 'Pending'
                              )
                            ).length
                            const acceptedTasks = assignedTasks.filter(b => 
                              b.vendorAllocations?.some(alloc => 
                                (alloc.vendorId === v.id || alloc.vendorEmail === v.email) && alloc.status === 'Accepted'
                              )
                            ).length

                            return (
                              <tr key={v.id}>
                                <td>
                                  <div className="dw-cell-client">
                                    <div className="dw-client-avatar-mini">
                                      <i className="fa-solid fa-store"></i>
                                    </div>
                                    <div>
                                      <div className="dw-client-name">{v.name || 'Vendor'}</div>
                                      <div className="dw-client-sub">{v.businessName || 'Business Name'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="dw-badge-pill dw-badge-neutral">
                                    {v.service || 'General'}
                                  </span>
                                </td>
                                <td>
                                  <div>{v.email}</div>
                                  <div className="dw-client-sub">{v.phone || 'Not provided'}</div>
                                </td>
                                <td>
                                  <strong>₹{Number(v.defaultRate || 0).toLocaleString('en-IN')}</strong>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span className="dw-pill pill-pending" style={{ fontSize: '0.72rem' }}>
                                      {pendingTasks} Pending
                                    </span>
                                    <span className="dw-pill pill-confirmed" style={{ fontSize: '0.72rem' }}>
                                      {acceptedTasks} Accepted
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'task_assign' && (
                <VendorTaskAssignment
                  vendors={vendors}
                  users={users}
                  bookings={bookings}
                  setBookings={setBookings}
                  vendorTasks={vendorTasks}
                  setVendorTasks={setVendorTasks}
                  showNotification={showNotification}
                />
              )}

              {/* ==============================================================
                  TAB 5: INQUIRIES & MESSAGES
                  ============================================================== */}
              {activeTab === 'inquiries' && (
                <div className="dw-panel-card">
                  <div className="dw-panel-header">
                    <div className="dw-panel-title-area">
                      <i className="fa-solid fa-envelope-open-text" style={{ color: '#b8860b' }}></i>
                      <h3>Customer Contact Inquiries ({contacts.length})</h3>
                    </div>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="dw-empty-state">
                      <div className="dw-empty-icon">
                        <i className="fa-solid fa-inbox"></i>
                      </div>
                      <h3>No Inquiries Yet</h3>
                      <p>Messages submitted through the contact form will appear here.</p>
                    </div>
                  ) : (
                    <div className="dw-table-wrapper">
                      <table className="dw-table">
                        <thead>
                          <tr>
                            <th>Sender</th>
                            <th>Contact</th>
                            <th>Subject / Inquiry Message</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <strong>{c.name || 'Website Visitor'}</strong>
                              </td>
                              <td>
                                <div>{c.email}</div>
                                {c.phone && <div className="dw-client-sub">{c.phone}</div>}
                              </td>
                              <td>
                                <div style={{ maxWidth: '450px', whiteSpace: 'normal' }}>
                                  {c.message || c.subject || 'Inquiry message'}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="dw-btn-action action-delete"
                                  onClick={() => handleDeleteContact(c.id)}
                                  title="Delete Message"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ==============================================================
                  TAB 6: CUSTOMER FEEDBACK & REVIEWS MANAGEMENT
                  ============================================================== */}
              {activeTab === 'feedback' && (
                <div className="dw-panel-card">
                  <div className="dw-panel-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
                    <div className="dw-panel-title-area">
                      <i className="fa-solid fa-star" style={{ color: '#f59e0b' }}></i>
                      <h3>Customer Feedback & Reviews Management ({filteredReviews.length})</h3>
                    </div>
                    <button
                      type="button"
                      className="dw-topbar-btn dw-topbar-btn-primary"
                      onClick={() => handleOpenFeedbackModal()}
                      style={{ background: '#b8860b', borderColor: '#b8860b', color: '#fff' }}
                    >
                      <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Add New Feedback
                    </button>
                  </div>

                  {/* Top Stats Strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', padding: '20px 24px 10px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        <i className="fa-solid fa-comments"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Reviews</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>{reviews.length}</div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        <i className="fa-solid fa-star"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Avg Rating</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {averageRating} <span style={{ fontSize: '0.85rem' }}>★</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        <i className="fa-solid fa-award"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>5-Star Reviews</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>{fiveStarReviewsCount}</div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fdf4ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        <i className="fa-solid fa-house"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Featured on Home</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7e22ce' }}>{featuredReviewsCount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{ padding: '12px 24px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: '1 1 250px', position: 'relative' }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                      <input
                        type="text"
                        placeholder="Search by client name, email or message..."
                        value={feedbackSearch}
                        onChange={(e) => setFeedbackSearch(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}
                      />
                      {feedbackSearch && (
                        <button
                          type="button"
                          onClick={() => setFeedbackSearch('')}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      value={feedbackRatingFilter}
                      onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                      style={{ padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#fff', outline: 'none' }}
                    >
                      <option value="all">⭐ All Ratings</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                      <option value="2">⭐⭐ 2 Stars</option>
                      <option value="1">⭐ 1 Star</option>
                    </select>

                    <select
                      value={feedbackStatusFilter}
                      onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                      style={{ padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#fff', outline: 'none' }}
                    >
                      <option value="all">All Visibility</option>
                      <option value="approved">✓ Approved (Visible)</option>
                      <option value="pending">⏳ Pending (Hidden)</option>
                      <option value="featured">★ Featured on Home</option>
                    </select>

                    {(feedbackSearch || feedbackRatingFilter !== 'all' || feedbackStatusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackSearch('')
                          setFeedbackRatingFilter('all')
                          setFeedbackStatusFilter('all')
                        }}
                        style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {filteredReviews.length === 0 ? (
                    <div className="dw-empty-state">
                      <div className="dw-empty-icon">
                        <i className="fa-solid fa-comment-slash"></i>
                      </div>
                      <h3>No Feedback Reviews Found</h3>
                      <p>{feedbackSearch || feedbackRatingFilter !== 'all' || feedbackStatusFilter !== 'all' ? 'Try adjusting your search or filter options.' : 'No customer reviews recorded yet. You can add one using the button above.'}</p>
                    </div>
                  ) : (
                    <div className="dw-table-wrapper">
                      <table className="dw-table">
                        <thead>
                          <tr>
                            <th>Reviewer / Couple</th>
                            <th>Event Date</th>
                            <th>Rating</th>
                            <th>Feedback Message</th>
                            <th>Status & Visibility</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReviews.map((r) => {
                            const isApproved = (r.status || 'approved') === 'approved'
                            return (
                              <tr key={r.id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img
                                      src={r.coupleImg || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80'}
                                      alt={r.name}
                                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }}
                                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80' }}
                                    />
                                    <div>
                                      <strong>{r.name || 'Anonymous Client'}</strong>
                                      <div className="dw-client-sub">{r.email || 'No email provided'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 500 }}>
                                    {r.date || 'Not specified'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ color: '#f59e0b', fontSize: '0.88rem' }}>
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <i key={i} className={`fa-star ${i < (Number(r.rating) || 5) ? 'fa-solid' : 'fa-regular'}`} style={{ marginRight: '1px' }}></i>
                                      ))}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                                      {Number(r.rating) || 5}.0
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ maxWidth: '400px', whiteSpace: 'normal', color: '#334155', fontSize: '0.88rem', lineHeight: '1.45', fontStyle: 'italic', background: '#fafaf9', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #b8860b' }}>
                                    "{r.text || 'No review text provided.'}"
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                    <span
                                      className={`dw-badge-pill ${isApproved ? 'dw-badge-confirmed' : 'dw-badge-pending'}`}
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleToggleReviewStatus(r.id)}
                                      title="Click to toggle status"
                                    >
                                      {isApproved ? '✓ Approved' : '⏳ Pending'}
                                    </span>
                                    {r.featured && (
                                      <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        ★ Featured on Home
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                    {/* Toggle Visibility button */}
                                    <button
                                      type="button"
                                      className="dw-btn-action"
                                      onClick={() => handleToggleReviewStatus(r.id)}
                                      title={isApproved ? 'Hide from website' : 'Approve for website'}
                                      style={{ color: isApproved ? '#059669' : '#f59e0b', background: isApproved ? '#ecfdf5' : '#fef3c7', border: 'none' }}
                                    >
                                      <i className={`fa-solid ${isApproved ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                    </button>

                                    {/* Toggle Featured button */}
                                    <button
                                      type="button"
                                      className="dw-btn-action"
                                      onClick={() => handleToggleReviewFeatured(r.id)}
                                      title={r.featured ? 'Remove from Homepage Featured' : 'Feature on Homepage'}
                                      style={{ color: r.featured ? '#d97706' : '#94a3b8', background: r.featured ? '#fef3c7' : '#f1f5f9', border: 'none' }}
                                    >
                                      <i className={`fa-star ${r.featured ? 'fa-solid' : 'fa-regular'}`}></i>
                                    </button>

                                    {/* Edit button */}
                                    <button
                                      type="button"
                                      className="dw-btn-action"
                                      onClick={() => handleOpenFeedbackModal(r)}
                                      title="Edit Review"
                                      style={{ color: '#0284c7', background: '#f0f9ff', border: 'none' }}
                                    >
                                      <i className="fa-solid fa-pen-to-square"></i>
                                    </button>

                                    {/* Delete button */}
                                    <button
                                      type="button"
                                      className="dw-btn-action action-delete"
                                      onClick={() => handleDeleteReview(r.id)}
                                      title="Delete Feedback"
                                    >
                                      <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}


        </main>
      </div>

      {/* ==============================================================
          BOOKING DETAILS DOSSIER MODAL (With Official Website Logo)
          ============================================================== */}
      {selectedBooking && (
        <div className="dw-modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="dw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dw-modal-header">
              <div className="dw-modal-header-brand">
                <img src="/images/logo.svg" alt="Dream Wedding Logo" className="dw-modal-header-logo" />
                <h3>Booking Dossier <span>#{String(selectedBooking.id).slice(-8)}</span></h3>
              </div>
              <button className="dw-modal-close-btn" onClick={() => setSelectedBooking(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="dw-modal-body">
              {/* Client & Status Overview */}
              <div className="dw-modal-section">
                <div className="dw-modal-section-title">
                  <i className="fa-solid fa-user-check"></i> Reservation Overview
                </div>
                <div className="dw-modal-grid">
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Client Name</span>
                    <div className="dw-modal-val">{selectedBooking.name || 'Not provided'}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Email Address</span>
                    <div className="dw-modal-val">{selectedBooking.email}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Phone Number</span>
                    <div className="dw-modal-val">{selectedBooking.phone || 'Not provided'}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Booking Status</span>
                    <div className="dw-modal-val">
                      <span className={`dw-status-tag status-${selectedBooking.bookingStatus || 'pending'}`}>
                        {selectedBooking.bookingStatus ? selectedBooking.bookingStatus.toUpperCase() : 'PENDING'}
                      </span>
                    </div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Destination / City</span>
                    <div className="dw-modal-val">{selectedBooking.address || 'Ahmedabad (Headquarters)'}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Submission Date</span>
                    <div className="dw-modal-val">
                      {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service & Event Particulars */}
              <div className="dw-modal-section">
                <div className="dw-modal-section-title">
                  <i className="fa-solid fa-calendar-star"></i> Event Particulars
                </div>
                <div className="dw-modal-grid">
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Primary Service</span>
                    <div className="dw-modal-val" style={{ color: '#b8860b', fontWeight: 700 }}>
                      {selectedBooking.service}
                    </div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Event Date</span>
                    <div className="dw-modal-val">{selectedBooking.date || 'To be decided'}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Event Type</span>
                    <div className="dw-modal-val">{selectedBooking.eventType || 'Wedding Event'}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Venue</span>
                    <div className="dw-modal-val">{selectedBooking.venue || 'Indoor / Outdoor'}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Expected Guests</span>
                    <div className="dw-modal-val">{selectedBooking.guests || 'Not specified'}</div>
                  </div>
                  <div className="dw-modal-item">
                    <span className="dw-modal-label">Budget / Selected Tier</span>
                    <div className="dw-modal-val">{selectedBooking.budget || 'Custom'}</div>
                  </div>
                </div>
              </div>

              {/* Assigned Vendors Section in Modal */}
              <div className="dw-modal-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="dw-modal-section-title" style={{ margin: 0 }}>
                    <i className="fa-solid fa-handshake"></i> Assigned Wedding Vendors ({selectedBooking.vendorAllocations?.length || 0})
                  </div>
                  <button
                    className="dw-topbar-btn"
                    style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#b8860b', color: '#fff', borderColor: '#b8860b' }}
                    onClick={() => {
                      setSelectedBooking(null)
                      handleTabChange('task_assign')
                    }}
                  >
                    <i className="fa-solid fa-plus" style={{ marginRight: '4px' }}></i> Assign Vendor
                  </button>
                </div>

                {(!selectedBooking.vendorAllocations || selectedBooking.vendorAllocations.length === 0) ? (
                  <div style={{ padding: '16px', background: '#fafafa', border: '1px dashed #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                    No vendor confirmed yet for this wedding. Use &ldquo;Assign Vendor&rdquo; above to send this booking to the vendor task workflow.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedBooking.vendorAllocations.map(alloc => (
                      <div key={alloc.allocationId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong>{alloc.service}: {alloc.vendorName}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {alloc.vendorPhone} &bull; Total Payout: ₹{Number(alloc.payout?.totalCost || 0).toLocaleString('en-IN')} &bull; Status: <strong>{alloc.status || 'Pending'}</strong>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`dw-status-tag status-${alloc.status === 'Accepted' ? 'confirmed' : alloc.status === 'Declined' ? 'rejected' : 'pending'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                            {alloc.status || 'Pending'}
                          </span>
                          <button
                            className="dw-btn-action action-delete"
                            style={{ padding: '3px 6px', fontSize: '0.74rem' }}
                            onClick={() => handleRemoveAllocation(selectedBooking.id, alloc.allocationId)}
                            title="Remove this vendor"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dw-modal-footer">
              {selectedBooking.bookingStatus !== 'confirmed' ? (
                <button
                  className="dw-topbar-btn dw-topbar-btn-primary"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                >
                  <i className="fa-solid fa-check"></i> Confirm Booking (Unlock Payment)
                </button>
              ) : (
                <button
                  className="dw-topbar-btn"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'pending')}
                >
                  <i className="fa-solid fa-rotate-left"></i> Reset to Pending
                </button>
              )}

              {selectedBooking.bookingStatus !== 'rejected' && (
                <button
                  className="dw-btn-action action-reject"
                  style={{ width: 'auto', padding: '0 16px', borderRadius: '10px' }}
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'rejected')}
                >
                  <i className="fa-solid fa-ban" style={{ marginRight: '6px' }}></i> Reject
                </button>
              )}

              <button
                className="dw-topbar-btn"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER FEEDBACK MODAL */}
      {isFeedbackModalOpen && (
        <div className="dw-modal-backdrop" onClick={() => setIsFeedbackModalOpen(false)}>
          <div className="dw-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dw-modal-header">
              <div className="dw-modal-header-brand">
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef3c7', color: '#b8860b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <i className="fa-solid fa-star"></i>
                </div>
                <h3>
                  {editingFeedback ? 'Edit Customer Feedback' : 'Add New Customer Feedback'}
                  <span>{editingFeedback ? `Review ID: #${editingFeedback.id}` : 'Create a new client review or testimonial'}</span>
                </h3>
              </div>
              <button
                type="button"
                className="dw-modal-close-btn"
                onClick={() => setIsFeedbackModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="dw-form-label">Client / Couple Name: *</label>
                  <input
                    type="text"
                    required
                    className="dw-form-control"
                    placeholder="e.g. Arjun & Sneha"
                    value={feedbackFormData.name}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="dw-form-label">Email Address:</label>
                  <input
                    type="email"
                    className="dw-form-control"
                    placeholder="client@example.com"
                    value={feedbackFormData.email}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="dw-form-label">Star Rating (1 to 5):</label>
                  <select
                    className="dw-form-control"
                    value={feedbackFormData.rating}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 / 5 - Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 / 5 - Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3 / 5 - Average)</option>
                    <option value={2}>⭐⭐ (2 / 5 - Below Average)</option>
                    <option value={1}>⭐ (1 / 5 - Poor)</option>
                  </select>
                </div>
                <div>
                  <label className="dw-form-label">Wedding / Event Date:</label>
                  <input
                    type="text"
                    className="dw-form-control"
                    placeholder="e.g. December 2024"
                    value={feedbackFormData.date}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="dw-form-label">Couple / Client Photo URL:</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="url"
                    className="dw-form-control"
                    placeholder="https://images.unsplash.com/..."
                    value={feedbackFormData.coupleImg}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, coupleImg: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  {feedbackFormData.coupleImg && (
                    <img
                      src={feedbackFormData.coupleImg}
                      alt="Preview"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #cbd5e1' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="dw-form-label">Feedback / Testimonial Message: *</label>
                <textarea
                  required
                  rows={4}
                  className="dw-form-control"
                  placeholder="Share what the client experienced, service quality, decoration praise, etc."
                  value={feedbackFormData.text}
                  onChange={(e) => setFeedbackFormData(prev => ({ ...prev, text: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', background: '#fafafa', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div>
                  <label className="dw-form-label" style={{ marginBottom: '6px' }}>Visibility Status:</label>
                  <select
                    className="dw-form-control"
                    value={feedbackFormData.status}
                    onChange={(e) => setFeedbackFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="approved">✓ Approved (Show on website)</option>
                    <option value="pending">⏳ Pending (Keep hidden)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={feedbackFormData.featured}
                      onChange={(e) => setFeedbackFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: '#b8860b' }}
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="dw-topbar-btn"
                  onClick={() => setIsFeedbackModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dw-topbar-btn dw-topbar-btn-primary"
                  style={{ background: '#b8860b', borderColor: '#b8860b', color: '#fff' }}
                >
                  <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                  {editingFeedback ? 'Update Feedback' : 'Publish Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
