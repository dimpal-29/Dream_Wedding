import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { vendorAuthApi, bookingsApi, vendorsApi, vendorTasksApi, VENDOR_TASK_STATUS } from '../services/api'
import '../vendor.css'

function VendorPortal() {
  const navigate = useNavigate()

  // State
  const [vendor, setVendor] = useState(null)
  const [bookings, setBookings] = useState([])
  const [vendorTasks, setVendorTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'tasks' | 'payouts' | 'profile'
  const [taskFilter, setTaskFilter] = useState('all') // 'all' | 'pending' | 'accepted' | 'completed' | 'declined'
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Modals & Action States
  const [selectedTask, setSelectedTask] = useState(null)
  const [declinePromptId, setDeclinePromptId] = useState(null)
  const [declineReason, setDeclineReason] = useState('')
  const [acceptPromptId, setAcceptPromptId] = useState(null)
  const [acceptAdvanceAmount, setAcceptAdvanceAmount] = useState('')
  const [acceptDescription, setAcceptDescription] = useState('')

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    defaultRate: 0,
    experience: '',
    bio: '',
    servicesOffered: []
  })
  const [newServiceTag, setNewServiceTag] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const freshVendor = await vendorAuthApi.refreshSession()
        if (freshVendor) {
          setVendor(freshVendor)
          setProfileForm({
            businessName: freshVendor.businessName || freshVendor.name || '',
            ownerName: freshVendor.ownerName || freshVendor.contactPerson || '',
            phone: freshVendor.phone || '',
            email: freshVendor.email || '',
            city: freshVendor.city || freshVendor.location || '',
            defaultRate: freshVendor.defaultRate || 0,
            experience: freshVendor.experience || '5+ Years',
            bio: freshVendor.bio || '',
            servicesOffered: Array.isArray(freshVendor.servicesOffered)
              ? freshVendor.servicesOffered
              : ['Candid Photography', 'Drone Shoots', 'Cinematic Film']
          })
        }

        let bList = await bookingsApi.getAll()
        if (!bList || bList.length === 0) {
          const raw = localStorage.getItem('dw_bookings')
          if (raw) bList = JSON.parse(raw)
        }
        setBookings(Array.isArray(bList) ? bList : [])

        const taskList = await vendorTasksApi.getAll()
        setVendorTasks(Array.isArray(taskList) ? taskList : [])
      } catch (err) {
        console.error('Error initializing vendor portal:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // 1b. Keep task list synchronized live if the Admin approves/rejects/
  // reassigns a task in another tab. Only touches vendorTasks — customer
  // booking/payment state is untouched.
  useEffect(() => {
    const handleStorageSync = (e) => {
      if (e.key !== 'dw_vendorTasks') return
      try {
        const updated = e.newValue ? JSON.parse(e.newValue) : []
        setVendorTasks(Array.isArray(updated) ? updated : [])
      } catch { /* ignore malformed payload */ }
    }
    window.addEventListener('storage', handleStorageSync)
    return () => window.removeEventListener('storage', handleStorageSync)
  }, [])

  // 2. Extract Assigned Bookings for this Vendor
  const assignedBookings = useMemo(() => {
    if (!vendor) return []
    const list = []
    bookings.forEach(b => {
      if (Array.isArray(b.vendorAllocations)) {
        b.vendorAllocations.forEach(alloc => {
          const matchId = alloc.vendorId && String(alloc.vendorId) === String(vendor.id)
          const matchEmail =
            alloc.vendorEmail &&
            vendor.email &&
            alloc.vendorEmail.toLowerCase() === vendor.email.toLowerCase()
          const matchName =
            alloc.vendorName &&
            vendor.name &&
            alloc.vendorName.toLowerCase() === vendor.name.toLowerCase()

          if (matchId || matchEmail || matchName) {
            list.push({ ...b, currentAllocation: alloc })
          }
        })
      }
    })
    return list
  }, [bookings, vendor])

  const myAdminTasks = useMemo(() => {
    if (!vendor) return []
    return (vendorTasks || []).filter(t => {
      const matchId = t.vendorId && String(t.vendorId) === String(vendor.id)
      const matchEmail =
        t.vendorEmail &&
        vendor.email &&
        t.vendorEmail.toLowerCase() === vendor.email.toLowerCase()
      return matchId || matchEmail
    })
  }, [vendorTasks, vendor])

  const pendingAdminTasks = useMemo(
    () => myAdminTasks.filter(t => t.status === VENDOR_TASK_STATUS.PENDING && !t.vendorResponse),
    [myAdminTasks]
  )

  // 3. Metric Calculations
  const pendingTasks = useMemo(
    () => assignedBookings.filter(b => (b.currentAllocation.status || 'Pending') === 'Pending'),
    [assignedBookings]
  )

  const acceptedTasks = useMemo(
    () => assignedBookings.filter(b => b.currentAllocation.status === 'Accepted'),
    [assignedBookings]
  )

  const completedTasks = useMemo(
    () => assignedBookings.filter(b => b.currentAllocation.status === 'Completed'),
    [assignedBookings]
  )

  const declinedTasks = useMemo(
    () => assignedBookings.filter(b => b.currentAllocation.status === 'Declined'),
    [assignedBookings]
  )

  // Financial Totals
  const totalEarnings = useMemo(() => {
    return assignedBookings.reduce((sum, b) => {
      if (b.currentAllocation.status === 'Declined') return sum
      return sum + Number(b.currentAllocation.payout?.totalCost || 0)
    }, 0)
  }, [assignedBookings])

  const totalAdvance = useMemo(() => {
    return assignedBookings.reduce((sum, b) => {
      if (b.currentAllocation.status === 'Declined') return sum
      return sum + Number(b.currentAllocation.payout?.advanceAmount || 0)
    }, 0)
  }, [assignedBookings])

  const totalRemaining = useMemo(() => {
    return assignedBookings.reduce((sum, b) => {
      if (b.currentAllocation.status === 'Declined') return sum
      if (b.currentAllocation.status === 'Completed') return sum
      return sum + Number(b.currentAllocation.payout?.remainingAmount || 0)
    }, 0)
  }, [assignedBookings])

  // Filtered and Searched Bookings for Tasks Tab
  const filteredTasks = useMemo(() => {
    let list = assignedBookings

    if (taskFilter === 'pending') {
      list = list.filter(b => (b.currentAllocation.status || 'Pending') === 'Pending')
    } else if (taskFilter === 'accepted') {
      list = list.filter(b => b.currentAllocation.status === 'Accepted')
    } else if (taskFilter === 'completed') {
      list = list.filter(b => b.currentAllocation.status === 'Completed')
    } else if (taskFilter === 'declined') {
      list = list.filter(b => b.currentAllocation.status === 'Declined')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(b => {
        const client = (b.name || '').toLowerCase()
        const venue = (b.venue || b.address || '').toLowerCase()
        const service = (b.currentAllocation?.service || '').toLowerCase()
        const phone = (b.phone || '').toLowerCase()
        const date = (b.date || '').toLowerCase()
        return (
          client.includes(q) ||
          venue.includes(q) ||
          service.includes(q) ||
          phone.includes(q) ||
          date.includes(q)
        )
      })
    }

    return list
  }, [assignedBookings, taskFilter, searchQuery])

  // 4. Action Handlers: Accept Task
  const handleAccept = async (bookingId, allocationId) => {
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    const updatedAllocations = (target.vendorAllocations || []).map(alloc => {
      if (alloc.allocationId === allocationId) {
        return {
          ...alloc,
          status: 'Accepted',
          respondedAt: new Date().toISOString()
        }
      }
      return alloc
    })

    const updated = {
      ...target,
      vendorAllocations: updatedAllocations,
      updatedAt: new Date().toISOString()
    }

    const updatedList = bookings.map(b => (String(b.id) === String(bookingId) ? updated : b))
    setBookings(updatedList)
    localStorage.setItem('dw_bookings', JSON.stringify(updatedList))

    try {
      await bookingsApi.update(bookingId, updated)
    } catch (err) {
      console.warn('API sync warning:', err)
    }

    if (selectedTask && String(selectedTask.id) === String(bookingId)) {
      setSelectedTask(null)
    }

    if (window.showToast) {
      window.showToast('Task accepted successfully!', 'success')
    }
  }

  // 5. Action Handlers: Decline Task
  const handleDecline = async (bookingId, allocationId) => {
    if (!declineReason.trim()) {
      if (window.showToast) {
        window.showToast('Please provide a reason for declining', 'warning')
      }
      return
    }

    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    const updatedAllocations = (target.vendorAllocations || []).map(alloc => {
      if (alloc.allocationId === allocationId) {
        return {
          ...alloc,
          status: 'Declined',
          declineReason: declineReason,
          respondedAt: new Date().toISOString()
        }
      }
      return alloc
    })

    const updated = {
      ...target,
      vendorAllocations: updatedAllocations,
      updatedAt: new Date().toISOString()
    }

    const updatedList = bookings.map(b => (String(b.id) === String(bookingId) ? updated : b))
    setBookings(updatedList)
    localStorage.setItem('dw_bookings', JSON.stringify(updatedList))

    try {
      await bookingsApi.update(bookingId, updated)
    } catch (err) {
      console.warn('API sync warning:', err)
    }

    setDeclinePromptId(null)
    setDeclineReason('')
    if (selectedTask && String(selectedTask.id) === String(bookingId)) {
      setSelectedTask(null)
    }

    if (window.showToast) {
      window.showToast('Task declined.', 'info')
    }
  }

  const handleAdminTaskRespond = async (taskId, response) => {
    const target = vendorTasks.find(t => String(t.id) === String(taskId))
    if (!target) return
    if (response === 'NO' && !declineReason.trim()) {
      if (window.showToast) {
        window.showToast('Please provide a short reason for declining', 'warning')
      }
      return
    }
    if (response === 'YES' && (!acceptAdvanceAmount || Number(acceptAdvanceAmount) <= 0)) {
      if (window.showToast) {
        window.showToast('Please enter the advance amount for this booking', 'warning')
      }
      return
    }
    const updated = {
      ...target,
      vendorResponse: response,
      vendorResponseNote: response === 'NO' ? declineReason.trim() : acceptDescription.trim(),
      advanceAmount: response === 'YES' ? Number(acceptAdvanceAmount) || 0 : target.advanceAmount || 0,
      status: VENDOR_TASK_STATUS.VENDOR_RESPONDED,
      respondedAt: new Date().toISOString()
    }
    const updatedList = vendorTasks.map(t => (String(t.id) === String(taskId) ? updated : t))
    setVendorTasks(updatedList)
    localStorage.setItem('dw_vendorTasks', JSON.stringify(updatedList))
    try {
      await vendorTasksApi.update(taskId, updated)
    } catch (err) {
      console.warn('Admin task response sync warning:', err)
    }
    setDeclinePromptId(null)
    setDeclineReason('')
    setAcceptPromptId(null)
    setAcceptAdvanceAmount('')
    setAcceptDescription('')
    if (window.showToast) {
      window.showToast(
        response === 'YES'
          ? 'Accepted — sent to admin for approval.'
          : 'You declined this assignment.',
        response === 'YES' ? 'success' : 'info'
      )
    }
  }

  // 6. Action Handlers: Mark as Completed
  const handleMarkCompleted = async (bookingId, allocationId) => {
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    const updatedAllocations = (target.vendorAllocations || []).map(alloc => {
      if (alloc.allocationId === allocationId) {
        return {
          ...alloc,
          status: 'Completed',
          completedAt: new Date().toISOString(),
          payout: {
            ...alloc.payout,
            payoutStatus: 'Fully Paid'
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

    const updatedList = bookings.map(b => (String(b.id) === String(bookingId) ? updated : b))
    setBookings(updatedList)
    localStorage.setItem('dw_bookings', JSON.stringify(updatedList))

    try {
      await bookingsApi.update(bookingId, updated)
    } catch (err) {
      console.warn('API sync warning:', err)
    }

    if (selectedTask && String(selectedTask.id) === String(bookingId)) {
      setSelectedTask(null)
    }

    if (window.showToast) {
      window.showToast('Congratulations! Service marked as Completed.', 'success')
    }
  }

  // 7. Toggle Vendor Availability
  const handleToggleAvailability = async () => {
    if (!vendor) return
    const newStatus = vendor.isAvailable === false ? true : false
    const updatedVendor = { ...vendor, isAvailable: newStatus }
    setVendor(updatedVendor)
    localStorage.setItem('dw_vendor_session', JSON.stringify(updatedVendor))

    try {
      await vendorsApi.update(vendor.id, updatedVendor)
    } catch (e) {
      console.warn('Vendor status update sync:', e)
    }

    if (window.showToast) {
      window.showToast(
        newStatus ? 'Your status is now set to: Available' : 'Your status is now set to: Busy / On Leave',
        'info'
      )
    }
  }

  // 8. Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!vendor) return
    setIsSavingProfile(true)

    const updatedVendor = {
      ...vendor,
      name: profileForm.businessName,
      businessName: profileForm.businessName,
      ownerName: profileForm.ownerName,
      contactPerson: profileForm.ownerName,
      phone: profileForm.phone,
      email: profileForm.email,
      city: profileForm.city,
      location: profileForm.city,
      defaultRate: Number(profileForm.defaultRate) || 0,
      experience: profileForm.experience,
      bio: profileForm.bio,
      servicesOffered: profileForm.servicesOffered
    }

    setVendor(updatedVendor)
    localStorage.setItem('dw_vendor_session', JSON.stringify(updatedVendor))

    try {
      await vendorsApi.update(vendor.id, updatedVendor)
    } catch (err) {
      console.warn('Profile save sync:', err)
    }

    setIsSavingProfile(false)
    if (window.showToast) {
      window.showToast('Profile updated successfully!', 'success')
    }
  }

  const handleAddServiceTag = () => {
    if (!newServiceTag.trim()) return
    if (!profileForm.servicesOffered.includes(newServiceTag.trim())) {
      setProfileForm(prev => ({
        ...prev,
        servicesOffered: [...prev.servicesOffered, newServiceTag.trim()]
      }))
    }
    setNewServiceTag('')
  }

  const handleRemoveServiceTag = (tag) => {
    setProfileForm(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.filter(t => t !== tag)
    }))
  }

  // 9. Logout
  const handleLogout = async () => {
    const confirmed = window.showConfirm
      ? await window.showConfirm({
          title: 'Confirm Vendor Logout',
          message: 'Are you sure you want to sign out of the <strong>Vendor Portal</strong>?',
          hint: '<i class="fa-solid fa-circle-info" style="color:#b8860b"></i> You will need your vendor credentials to sign back in.',
          confirmText: 'Yes, Sign Out',
          cancelText: 'Stay in Portal',
          icon: 'fa-solid fa-arrow-right-from-bracket'
        })
      : window.confirm('Are you sure you want to log out?')

    if (!confirmed) return

    vendorAuthApi.logout()
    if (window.showToast) {
      window.showToast('Logged out successfully', 'info')
    }
    navigate('/vendor/login')
  }

  // Loading State
  if (loading) {
    return (
      <div className="vdb-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="vportal-spinner" style={{ margin: '0 auto 16px' }}></div>
          <h3 style={{ color: '#1e293b' }}>Loading Vendor Dashboard...</h3>
        </div>
      </div>
    )
  }

  // Session Not Found / Expired
  if (!vendor) {
    return (
      <div className="vdb-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="vdb-card" style={{ maxWidth: 450, textAlign: 'center', margin: 20 }}>
          <div style={{ fontSize: '3rem', color: '#ef4444', marginBottom: 12 }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Vendor Session Expired</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            Please log in with your vendor partner account to access the dashboard.
          </p>
          <Link to="/vendor/login" className="vdb-btn vdb-btn-accept" style={{ justifyContent: 'center', padding: '12px 24px' }}>
            Go to Vendor Login
          </Link>
        </div>
      </div>
    )
  }

  const isAvailable = vendor.isAvailable !== false

  return (
    <div className="vdb-shell">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div className="vdb-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* ============================================================== */}
      {/* 1. SIDEBAR NAVIGATION                                           */}
      {/* ============================================================== */}
      <aside className={`vdb-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="vdb-sidebar-header">
          <Link to="/" className="vdb-brand-link" title="Visit Dream Wedding Homepage">
            <img src="/images/logo.svg" alt="Dream Wedding" className="vdb-logo" />
            <span className="vdb-badge-tag">
              <i className="fa-solid fa-handshake"></i> Partner
            </span>
          </Link>
          <button className="vdb-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Vendor Profile Mini Card */}
        <div className="vdb-vendor-mini-profile">
          <div className="vdb-vendor-avatar">{vendor.avatar || '🏢'}</div>
          <div className="vdb-vendor-info">
            <h4 className="vdb-vendor-title">{vendor.businessName || vendor.name}</h4>
            <div className="vdb-vendor-subtitle">
              <span className={`vdb-status-dot ${isAvailable ? 'available' : 'busy'}`}></span>
              <span>{isAvailable ? 'Available' : 'Busy / On Leave'}</span>
              <span>&bull; {vendor.service || 'Vendor'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="vdb-sidebar-nav">
          <ul className="vdb-nav-list">
            <li>
              <div
                className={`vdb-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('overview')
                  setIsSidebarOpen(false)
                }}
              >
                <div className="vdb-nav-item-left">
                  <i className="fa-solid fa-chart-pie"></i>
                  <span>Overview</span>
                </div>
              </div>
            </li>

            <li>
              <div
                className={`vdb-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('tasks')
                  setIsSidebarOpen(false)
                }}
              >
                <div className="vdb-nav-item-left">
                  <i className="fa-solid fa-calendar-check"></i>
                  <span>My Tasks & Orders</span>
                </div>
                {pendingTasks.length > 0 ? (
                  <span className="vdb-nav-badge pending">{pendingTasks.length} new</span>
                ) : (
                  <span className="vdb-nav-badge neutral">{assignedBookings.length}</span>
                )}
              </div>
            </li>

            <li>
              <div
                className={`vdb-nav-item ${activeTab === 'payouts' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('payouts')
                  setIsSidebarOpen(false)
                }}
              >
                <div className="vdb-nav-item-left">
                  <i className="fa-solid fa-wallet"></i>
                  <span>Earnings & Payouts</span>
                </div>
              </div>
            </li>

            <li>
              <div
                className={`vdb-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('profile')
                  setIsSidebarOpen(false)
                }}
              >
                <div className="vdb-nav-item-left">
                  <i className="fa-solid fa-store"></i>
                  <span>Profile & Services</span>
                </div>
              </div>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="vdb-sidebar-footer">
          <Link to="/" className="vdb-btn-link" target="_blank" rel="noopener noreferrer">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span>View Live Website</span>
          </Link>
          <button className="vdb-btn-logout" onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN CONTENT AREA                                            */}
      {/* ============================================================== */}
      <div className="vdb-main">
        {/* Sticky Topbar */}
        <header className="vdb-topbar">
          <div className="vdb-topbar-left">
            <button className="vdb-hamburger" onClick={() => setIsSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <h2 className="vdb-page-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'tasks' && 'My Bookings & Tasks'}
              {activeTab === 'payouts' && 'Earnings & Payout Ledger'}
              {activeTab === 'profile' && 'Vendor Profile & Services'}
            </h2>
          </div>

          <div className="vdb-topbar-right">
            {/* Quick Availability Toggle */}
            <button
              className={`vdb-avail-toggle-btn ${isAvailable ? 'available' : 'busy'}`}
              onClick={handleToggleAvailability}
              title="Click to toggle your availability status for new assignments"
            >
              <span className={`vdb-status-dot ${isAvailable ? 'available' : 'busy'}`}></span>
              <span>{isAvailable ? 'Available for Orders' : 'Marked as Busy'}</span>
            </button>

            {/* Profile Avatar Chip */}
            <div className="vdb-topbar-profile-chip">
              <div className="vdb-chip-avatar">{vendor.avatar || '🏢'}</div>
              <span className="vdb-chip-name">{vendor.businessName || vendor.name}</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="vdb-content">
          {/* ============================================================ */}
          {/* TAB 1: OVERVIEW DASHBOARD                                    */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div>
              {pendingAdminTasks.length > 0 && (
                <div className="vdb-alert-banner" style={{ marginBottom: 16 }}>
                  <div className="vdb-alert-left">
                    <div className="vdb-alert-icon">
                      <i className="fa-solid fa-clipboard-list"></i>
                    </div>
                    <div className="vdb-alert-text">
                      <h4>Admin assigned {pendingAdminTasks.length} wedding task(s) — respond YES or NO</h4>
                      <p>These assignments are separate from payout bookings. Admin will approve or reassign after your response.</p>
                    </div>
                  </div>
                  <button
                    className="vdb-alert-action-btn"
                    onClick={() => setActiveTab('tasks')}
                  >
                    Review Assignments <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              )}

              {/* Urgent Action Alert if any tasks are Pending */}
              {pendingTasks.length > 0 && (
                <div className="vdb-alert-banner">
                  <div className="vdb-alert-left">
                    <div className="vdb-alert-icon">
                      <i className="fa-solid fa-bell"></i>
                    </div>
                    <div className="vdb-alert-text">
                      <h4>Action Required: {pendingTasks.length} Booking Assignment(s) Awaiting Response</h4>
                      <p>
                        Dream Wedding admin has allocated new wedding events to your team. Please review requirements and accept to lock in the dates.
                      </p>
                    </div>
                  </div>
                  <button
                    className="vdb-alert-action-btn"
                    onClick={() => {
                      setActiveTab('tasks')
                      setTaskFilter('pending')
                    }}
                  >
                    Review Pending Tasks <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              )}

              {/* Welcome Banner */}
              <div className="vdb-welcome-banner">
                <div>
                  <span className="vdb-welcome-tag">
                    <i className="fa-solid fa-gem"></i> Official Partner Portal
                  </span>
                  <h1 className="vdb-welcome-title">
                    Welcome back, {vendor.businessName || vendor.name}!
                  </h1>
                  <p className="vdb-welcome-sub">
                    Manage your assigned wedding services, review customer requirements, track contract advances and remaining payouts in real-time.
                  </p>
                </div>
                <div className="vdb-welcome-actions">
                  <button
                    className="vdb-welcome-btn primary"
                    onClick={() => {
                      setActiveTab('tasks')
                      setTaskFilter('all')
                    }}
                  >
                    <i className="fa-solid fa-list-check"></i> View All Orders
                  </button>
                  <button
                    className="vdb-welcome-btn secondary"
                    onClick={() => setActiveTab('profile')}
                  >
                    <i className="fa-solid fa-gear"></i> Manage Profile
                  </button>
                </div>
              </div>

              {/* KPI Metrics Cards Grid */}
              <div className="vdb-stats-grid">
                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon total">
                    <i className="fa-solid fa-calendar-check"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">{assignedBookings.length}</div>
                    <div className="vdb-stat-label">Total Assigned</div>
                  </div>
                </div>

                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon pending">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">{pendingTasks.length}</div>
                    <div className="vdb-stat-label">Pending Response</div>
                  </div>
                </div>

                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon accepted">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">{acceptedTasks.length}</div>
                    <div className="vdb-stat-label">Active / Accepted</div>
                  </div>
                </div>

                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon completed">
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">{completedTasks.length}</div>
                    <div className="vdb-stat-label">Completed Events</div>
                  </div>
                </div>

                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon earnings">
                    <i className="fa-solid fa-wallet"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">
                      ₹{totalEarnings.toLocaleString('en-IN')}
                    </div>
                    <div className="vdb-stat-label">Total Contract Value</div>
                  </div>
                </div>

                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon balance">
                    <i className="fa-solid fa-hand-holding-dollar"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">
                      ₹{totalRemaining.toLocaleString('en-IN')}
                    </div>
                    <div className="vdb-stat-label">Balance Receivable</div>
                  </div>
                </div>
              </div>

              {/* 2-Column Split Section */}
              <div className="vdb-two-cols">
                {/* Left: Recent Assigned Bookings */}
                <div className="vdb-card">
                  <div className="vdb-card-header">
                    <h3>
                      <i className="fa-solid fa-bolt"></i> Recent Assigned Bookings
                    </h3>
                    <button
                      className="vdb-btn-view-all"
                      onClick={() => {
                        setActiveTab('tasks')
                        setTaskFilter('all')
                      }}
                    >
                      View All ({assignedBookings.length}) &rarr;
                    </button>
                  </div>

                  {assignedBookings.length === 0 ? (
                    <div className="vdb-empty" style={{ padding: '40px 20px' }}>
                      <div className="vdb-empty-icon">📭</div>
                      <h4>No tasks assigned yet</h4>
                      <p>When the admin allocates wedding services to you, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="vdb-mini-task-list">
                      {assignedBookings.slice(0, 4).map(booking => {
                        const alloc = booking.currentAllocation
                        const status = alloc.status || 'Pending'
                        const payout = alloc.payout || { totalCost: 0 }

                        return (
                          <div key={`${booking.id}-${alloc.allocationId}`} className="vdb-mini-task-item">
                            <div className="vdb-mini-task-left">
                              <div className="vdb-service-icon-box">{vendor.avatar || '✨'}</div>
                              <div>
                                <h4 className="vdb-mini-client-name">{booking.name || 'Client Event'}</h4>
                                <div className="vdb-mini-meta">
                                  <span>
                                    <i className="fa-solid fa-calendar"></i> {booking.date || 'TBD'}
                                  </span>
                                  <span>
                                    <i className="fa-solid fa-location-dot"></i>{' '}
                                    {booking.venue || booking.address || 'Ahmedabad'}
                                  </span>
                                  <span style={{ fontWeight: 700, color: '#b8860b' }}>
                                    ₹{Number(payout.totalCost || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="vdb-mini-task-right">
                              <span className={`vdb-pill ${status.toLowerCase()}`}>{status}</span>
                              <button
                                className="vdb-btn vdb-btn-details"
                                onClick={() => setSelectedTask(booking)}
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Payout Breakdown & Guidelines */}
                <div className="vdb-card">
                  <div className="vdb-card-header">
                    <h3>
                      <i className="fa-solid fa-chart-line"></i> Payout Health & Guidelines
                    </h3>
                  </div>

                  {/* Advance vs Remaining Progress */}
                  <div className="vdb-progress-box">
                    <div className="vdb-progress-row">
                      <span>Advance Received: ₹{totalAdvance.toLocaleString('en-IN')}</span>
                      <span>
                        {totalEarnings > 0 ? Math.round((totalAdvance / totalEarnings) * 100) : 0}%
                      </span>
                    </div>
                    <div className="vdb-progress-bar-bg">
                      <div
                        className="vdb-progress-bar-fill"
                        style={{
                          width: `${totalEarnings > 0 ? Math.min(100, Math.round((totalAdvance / totalEarnings) * 100)) : 0}%`
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        color: '#64748b',
                        marginTop: 6
                      }}
                    >
                      <span>Contract: ₹{totalEarnings.toLocaleString('en-IN')}</span>
                      <span>Due: ₹{totalRemaining.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Quick Guidelines */}
                  <ul className="vdb-quick-tips">
                    <li className="vdb-quick-tip-item">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>
                        <strong>Accept Early:</strong> Respond to pending allocations within 12 hours so the client receives prompt booking confirmation.
                      </span>
                    </li>
                    <li className="vdb-quick-tip-item">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>
                        <strong>Client Coordination:</strong> Verify wedding venue access details 48 hours prior to the event date.
                      </span>
                    </li>
                    <li className="vdb-quick-tip-item">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>
                        <strong>Automated Settlement:</strong> Mark completed tasks immediately after the event to release remaining balances directly to your bank.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: MY BOOKINGS & TASKS                                   */}
          {/* ============================================================ */}
          {activeTab === 'tasks' && (
            <div>
              {myAdminTasks.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>
                    Admin Task Assignments ({myAdminTasks.length})
                  </h3>
                  <div className="vdb-tasks-grid">
                    {myAdminTasks.map(task => {
                      const waiting = task.status === VENDOR_TASK_STATUS.PENDING && !task.vendorResponse
                      return (
                        <div key={task.id} className="vdb-task-card">
                          <div className="vdb-task-card-top">
                            <div>
                              <span className="vdb-task-service-badge">
                                <i className="fa-solid fa-star"></i> {task.service}
                              </span>
                              <h3 className="vdb-task-client">{task.customerName}</h3>
                              <div className="vdb-task-event-meta">
                                <span>
                                  <i className="fa-solid fa-calendar" style={{ color: '#b8860b' }}></i>{' '}
                                  {task.eventDate || 'TBD'}{task.eventTime ? ` · ${task.eventTime}` : ''}
                                </span>
                                <span>
                                  <i className="fa-solid fa-location-dot" style={{ color: '#b8860b' }}></i>{' '}
                                  {task.venue || 'Venue TBD'}
                                </span>
                                {task.guests && (
                                  <span>
                                    <i className="fa-solid fa-users" style={{ color: '#b8860b' }}></i> {task.guests} guests
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`vdb-pill ${(task.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="vdb-task-card-body">
                            <div className="vdb-task-req-box">
                              <strong>Requirements:</strong>
                              {task.requirements || 'No extra notes.'}
                            </div>
                            <div className="vdb-task-req-box" style={{ marginTop: 8 }}>
                              <strong>Customer:</strong> {task.customerEmail || '—'} · {task.customerPhone || '—'}
                            </div>
                            {task.vendorResponse && (
                              <div className="vdb-task-req-box" style={{ marginTop: 8 }}>
                                <strong>Your response:</strong> {task.vendorResponse}
                                {task.vendorResponse === 'YES' && Number(task.advanceAmount) > 0 && (
                                  <> · Advance: ₹{Number(task.advanceAmount).toLocaleString('en-IN')}</>
                                )}
                                {task.vendorResponseNote && <> · {task.vendorResponseNote}</>}
                                {task.adminDecision ? ` · Admin: ${task.adminDecision}` : ' · Awaiting admin decision'}
                              </div>
                            )}
                          </div>
                          {waiting && (
                            <div className="vdb-task-card-footer">
                              <button
                                className="vdb-btn vdb-btn-accept"
                                onClick={() => {
                                  setDeclinePromptId(null)
                                  setDeclineReason('')
                                  setAcceptPromptId(`admin-${task.id}`)
                                  setAcceptAdvanceAmount('')
                                  setAcceptDescription('')
                                }}
                              >
                                <i className="fa-solid fa-check"></i> YES
                              </button>
                              <button
                                className="vdb-btn vdb-btn-decline"
                                onClick={() => {
                                  setAcceptPromptId(null)
                                  setAcceptAdvanceAmount('')
                                  setAcceptDescription('')
                                  setDeclinePromptId(`admin-${task.id}`)
                                }}
                              >
                                <i className="fa-solid fa-xmark"></i> NO
                              </button>
                            </div>
                          )}
                          {acceptPromptId === `admin-${task.id}` && (
                            <div className="vportal-decline-prompt">
                              <h5>Confirm acceptance</h5>
                              <label className="dw-form-label" style={{ display: 'block', marginBottom: 4 }}>
                                Advance amount (₹) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                className="dw-form-control"
                                style={{ marginBottom: 10 }}
                                value={acceptAdvanceAmount}
                                onChange={e => setAcceptAdvanceAmount(e.target.value)}
                                placeholder="e.g. 20000"
                              />
                              <label className="dw-form-label" style={{ display: 'block', marginBottom: 4 }}>
                                Short description
                              </label>
                              <textarea
                                value={acceptDescription}
                                onChange={e => setAcceptDescription(e.target.value)}
                                placeholder="e.g. Confirmed for the full evening, includes drone coverage."
                                rows="2"
                              ></textarea>
                              <div className="vportal-decline-actions">
                                <button
                                  className="vportal-btn vportal-btn-cancel"
                                  onClick={() => {
                                    setAcceptPromptId(null)
                                    setAcceptAdvanceAmount('')
                                    setAcceptDescription('')
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="vportal-btn vportal-btn-confirm-decline"
                                  style={{ background: '#15803d' }}
                                  onClick={() => handleAdminTaskRespond(task.id, 'YES')}
                                >
                                  Confirm YES
                                </button>
                              </div>
                            </div>
                          )}
                          {declinePromptId === `admin-${task.id}` && (
                            <div className="vportal-decline-prompt">
                              <h5>Reason for declining this assignment</h5>
                              <textarea
                                value={declineReason}
                                onChange={e => setDeclineReason(e.target.value)}
                                placeholder="e.g. Schedule conflict, fully booked..."
                                rows="3"
                              ></textarea>
                              <div className="vportal-decline-actions">
                                <button
                                  className="vportal-btn vportal-btn-cancel"
                                  onClick={() => {
                                    setDeclinePromptId(null)
                                    setDeclineReason('')
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="vportal-btn vportal-btn-confirm-decline"
                                  onClick={() => handleAdminTaskRespond(task.id, 'NO')}
                                >
                                  Confirm NO
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="vdb-toolbar">
                {/* Status Filter Tabs */}
                <div className="vdb-tabs-filter">
                  <button
                    className={`vdb-tab-btn ${taskFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('all')}
                  >
                    All ({assignedBookings.length})
                  </button>
                  <button
                    className={`vdb-tab-btn ${taskFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('pending')}
                  >
                    Pending ({pendingTasks.length})
                  </button>
                  <button
                    className={`vdb-tab-btn ${taskFilter === 'accepted' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('accepted')}
                  >
                    Accepted ({acceptedTasks.length})
                  </button>
                  <button
                    className={`vdb-tab-btn ${taskFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('completed')}
                  >
                    Completed ({completedTasks.length})
                  </button>
                  <button
                    className={`vdb-tab-btn ${taskFilter === 'declined' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('declined')}
                  >
                    Declined ({declinedTasks.length})
                  </button>
                </div>

                {/* Search & View Mode Switch */}
                <div className="vdb-toolbar-actions">
                  <div className="vdb-search-wrap">
                    <i className="fa-solid fa-magnifying-glass vdb-search-icon"></i>
                    <input
                      type="text"
                      className="vdb-search-input"
                      placeholder="Search client, venue, date..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="vdb-view-toggle">
                    <button
                      className={`vdb-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setViewMode('cards')}
                      title="Card Grid View"
                    >
                      <i className="fa-solid fa-grip"></i>
                    </button>
                    <button
                      className={`vdb-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    >
                      <i className="fa-solid fa-table-list"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Empty State */}
              {filteredTasks.length === 0 ? (
                <div className="vdb-empty">
                  <div className="vdb-empty-icon">🔍</div>
                  <h4>No tasks matching your filter</h4>
                  <p>Try switching filter tabs or clearing your search term.</p>
                </div>
              ) : viewMode === 'cards' ? (
                /* Card Grid View */
                <div className="vdb-tasks-grid">
                  {filteredTasks.map(booking => {
                    const alloc = booking.currentAllocation
                    const payout = alloc.payout || { totalCost: 0, advanceAmount: 0, remainingAmount: 0 }
                    const isPending = alloc.status === 'Pending'
                    const isAccepted = alloc.status === 'Accepted'
                    const isCompleted = alloc.status === 'Completed'
                    const isDeclined = alloc.status === 'Declined'

                    return (
                      <div key={`${booking.id}-${alloc.allocationId}`} className="vdb-task-card">
                        <div className="vdb-task-card-top">
                          <div>
                            <span className="vdb-task-service-badge">
                              <i className="fa-solid fa-star"></i> {alloc.service || vendor.service}
                            </span>
                            <h3 className="vdb-task-client">{booking.name || 'Client Event'}</h3>
                            <div className="vdb-task-event-meta">
                              <span>
                                <i className="fa-solid fa-calendar" style={{ color: '#b8860b' }}></i>{' '}
                                {booking.date || 'TBD'}
                              </span>
                              <span>
                                <i className="fa-solid fa-location-dot" style={{ color: '#b8860b' }}></i>{' '}
                                {booking.venue || booking.address || 'Venue TBD'}
                              </span>
                            </div>
                          </div>
                          <span className={`vdb-pill ${(alloc.status || 'Pending').toLowerCase()}`}>
                            {alloc.status || 'Pending'}
                          </span>
                        </div>

                        <div className="vdb-task-card-body">
                          <div className="vdb-task-req-box">
                            <strong>Service Brief:</strong>
                            {alloc.requirements || 'Standard service requested as per wedding package.'}
                          </div>

                          <div className="vdb-task-payout-box">
                            <div className="vdb-payout-item">
                              <span className="lbl">Total Fee</span>
                              <span className="val highlight">
                                ₹{Number(payout.totalCost || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="vdb-payout-item">
                              <span className="lbl">Advance</span>
                              <span className="val">
                                ₹{Number(payout.advanceAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="vdb-payout-item">
                              <span className="lbl">Remaining</span>
                              <span className="val">
                                ₹{Number(payout.remainingAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="vdb-task-card-footer">
                          <button
                            className="vdb-btn vdb-btn-details"
                            onClick={() => setSelectedTask(booking)}
                          >
                            <i className="fa-solid fa-eye"></i> Details
                          </button>

                          {isPending && (
                            <>
                              <button
                                className="vdb-btn vdb-btn-accept"
                                onClick={() => handleAccept(booking.id, alloc.allocationId)}
                              >
                                <i className="fa-solid fa-check"></i> Accept Task
                              </button>
                              <button
                                className="vdb-btn vdb-btn-decline"
                                onClick={() => setDeclinePromptId(alloc.allocationId)}
                              >
                                <i className="fa-solid fa-xmark"></i> Decline
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <button
                              className="vdb-btn vdb-btn-complete"
                              onClick={() => handleMarkCompleted(booking.id, alloc.allocationId)}
                            >
                              <i className="fa-solid fa-flag-checkered"></i> Mark Completed
                            </button>
                          )}
                        </div>

                        {/* Inline Decline Prompt */}
                        {declinePromptId === alloc.allocationId && (
                          <div className="vportal-decline-prompt">
                            <h5>Reason for declining this booking</h5>
                            <textarea
                              value={declineReason}
                              onChange={e => setDeclineReason(e.target.value)}
                              placeholder="e.g. Schedule conflict, fully booked for this date..."
                              rows="3"
                            ></textarea>
                            <div className="vportal-decline-actions">
                              <button
                                className="vportal-btn vportal-btn-cancel"
                                onClick={() => {
                                  setDeclinePromptId(null)
                                  setDeclineReason('')
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                className="vportal-btn vportal-btn-confirm-decline"
                                onClick={() => handleDecline(booking.id, alloc.allocationId)}
                              >
                                Confirm Decline
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Table View */
                <div className="vdb-table-wrap">
                  <table className="vdb-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Client</th>
                        <th>Service</th>
                        <th>Event Date</th>
                        <th>Venue</th>
                        <th>Payout</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(booking => {
                        const alloc = booking.currentAllocation
                        const payout = alloc.payout || { totalCost: 0 }
                        const isPending = alloc.status === 'Pending'
                        const isAccepted = alloc.status === 'Accepted'

                        return (
                          <tr key={`${booking.id}-${alloc.allocationId}`}>
                            <td style={{ fontWeight: 700, color: '#b8860b' }}>#{booking.id}</td>
                            <td>
                              <strong>{booking.name || 'Client'}</strong>
                              {booking.phone && (
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  {booking.phone}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="vdb-badge-tag">{alloc.service}</span>
                            </td>
                            <td>{booking.date || 'TBD'}</td>
                            <td>{booking.venue || booking.address || 'Ahmedabad'}</td>
                            <td style={{ fontWeight: 700 }}>
                              ₹{Number(payout.totalCost || 0).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className={`vdb-pill ${(alloc.status || 'Pending').toLowerCase()}`}>
                                {alloc.status || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  className="vdb-btn vdb-btn-details"
                                  onClick={() => setSelectedTask(booking)}
                                  title="View Full Details"
                                >
                                  <i className="fa-solid fa-eye"></i>
                                </button>
                                {isPending && (
                                  <>
                                    <button
                                      className="vdb-btn vdb-btn-accept"
                                      onClick={() => handleAccept(booking.id, alloc.allocationId)}
                                      title="Accept Task"
                                    >
                                      <i className="fa-solid fa-check"></i>
                                    </button>
                                    <button
                                      className="vdb-btn vdb-btn-decline"
                                      onClick={() => setDeclinePromptId(alloc.allocationId)}
                                      title="Decline Task"
                                    >
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  </>
                                )}
                                {isAccepted && (
                                  <button
                                    className="vdb-btn vdb-btn-complete"
                                    onClick={() => handleMarkCompleted(booking.id, alloc.allocationId)}
                                    title="Mark Completed"
                                  >
                                    <i className="fa-solid fa-flag-checkered"></i>
                                  </button>
                                )}
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

          {/* ============================================================ */}
          {/* TAB 3: EARNINGS & PAYOUTS                                     */}
          {/* ============================================================ */}
          {activeTab === 'payouts' && (
            <div>
              {/* Financial Metrics */}
              <div className="vdb-stats-grid">
                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon earnings">
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">₹{totalEarnings.toLocaleString('en-IN')}</div>
                    <div className="vdb-stat-label">Total Contract Payout</div>
                  </div>
                </div>

                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon accepted">
                    <i className="fa-solid fa-building-columns"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">₹{totalAdvance.toLocaleString('en-IN')}</div>
                    <div className="vdb-stat-label">Advance Disbursed</div>
                  </div>
                </div>

                <div className="vdb-stat-card">
                  <div className="vdb-stat-icon balance">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </div>
                  <div className="vdb-stat-details">
                    <div className="vdb-stat-number">₹{totalRemaining.toLocaleString('en-IN')}</div>
                    <div className="vdb-stat-label">Remaining Balance Due</div>
                  </div>
                </div>
              </div>

              {/* Payout Ledger Table */}
              <div className="vdb-card" style={{ marginBottom: 28 }}>
                <div className="vdb-card-header">
                  <h3>
                    <i className="fa-solid fa-receipt"></i> Contract Payout Ledger
                  </h3>
                </div>

                {assignedBookings.length === 0 ? (
                  <div className="vdb-empty">
                    <div className="vdb-empty-icon">💳</div>
                    <h4>No payout records yet</h4>
                    <p>When tasks are allocated, their payment schedules will appear in this ledger.</p>
                  </div>
                ) : (
                  <div className="vdb-table-wrap">
                    <table className="vdb-table">
                      <thead>
                        <tr>
                          <th>Booking</th>
                          <th>Client Name</th>
                          <th>Event Date</th>
                          <th>Service Allocated</th>
                          <th>Total Fee</th>
                          <th>Advance Amount</th>
                          <th>Remaining Due</th>
                          <th>Payout Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedBookings.map(b => {
                          const alloc = b.currentAllocation
                          const payout = alloc.payout || { totalCost: 0, advanceAmount: 0, remainingAmount: 0 }
                          const isDeclined = alloc.status === 'Declined'

                          return (
                            <tr key={`${b.id}-${alloc.allocationId}`}>
                              <td style={{ fontWeight: 700, color: '#b8860b' }}>#{b.id}</td>
                              <td>
                                <strong>{b.name || 'Client'}</strong>
                              </td>
                              <td>{b.date || 'TBD'}</td>
                              <td>{alloc.service}</td>
                              <td style={{ fontWeight: 700 }}>
                                ₹{Number(payout.totalCost || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={{ color: '#10b981', fontWeight: 600 }}>
                                ₹{Number(payout.advanceAmount || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={{ color: isDeclined ? '#64748b' : '#ef4444', fontWeight: 600 }}>
                                {isDeclined ? '₹0' : `₹${Number(payout.remainingAmount || 0).toLocaleString('en-IN')}`}
                              </td>
                              <td>
                                <span
                                  className={`vdb-pill ${
                                    isDeclined
                                      ? 'declined'
                                      : alloc.status === 'Completed'
                                      ? 'completed'
                                      : 'pending'
                                  }`}
                                >
                                  {isDeclined
                                    ? 'Cancelled'
                                    : alloc.status === 'Completed'
                                    ? 'Fully Settled'
                                    : payout.payoutStatus || 'Advance Paid'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Settlement & Banking Information Card */}
              <div className="vdb-card">
                <div className="vdb-card-header">
                  <h3>
                    <i className="fa-solid fa-shield-halved"></i> Payment & Settlement Terms
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  <div style={{ background: '#faf8f5', padding: 18, borderRadius: 14, border: '1px solid #ede7dc' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Direct Bank Transfer</h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                      Advances are credited within 24 hours of task acceptance. Final balance is automatically transferred upon event completion verification.
                    </p>
                  </div>
                  <div style={{ background: '#faf8f5', padding: 18, borderRadius: 14, border: '1px solid #ede7dc' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Vendor Support Desk</h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                      Have questions regarding invoices or tax deductions? Contact Dream Wedding Partner Desk at{' '}
                      <strong>support@dreamwedding.com</strong> or call <strong>+91 98765 43210</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: PROFILE & SERVICES                                    */}
          {/* ============================================================ */}
          {activeTab === 'profile' && (
            <div className="vdb-profile-grid">
              {/* Left Profile Summary Card */}
              <div className="vdb-profile-summary-card">
                <div className="vdb-profile-avatar-large">{vendor.avatar || '🏢'}</div>
                <h3 className="vdb-profile-title">{vendor.businessName || vendor.name}</h3>
                <span className="vdb-profile-badge">{vendor.service || 'Service Partner'}</span>

                <div className="vdb-profile-meta-list">
                  <div className="vdb-profile-meta-item">
                    <span className="label">Owner / Lead:</span>
                    <span className="val">{vendor.ownerName || vendor.contactPerson || 'Arjun Verma'}</span>
                  </div>
                  <div className="vdb-profile-meta-item">
                    <span className="label">Operating Cities:</span>
                    <span className="val">{vendor.city || vendor.location || 'Ahmedabad'}</span>
                  </div>
                  <div className="vdb-profile-meta-item">
                    <span className="label">Rating:</span>
                    <span className="val" style={{ color: '#b8860b' }}>
                      ⭐ {vendor.rating || '4.9'} / 5.0
                    </span>
                  </div>
                  <div className="vdb-profile-meta-item">
                    <span className="label">Experience:</span>
                    <span className="val">{vendor.experience || '8+ Years'}</span>
                  </div>
                  <div className="vdb-profile-meta-item">
                    <span className="label">Base Rate:</span>
                    <span className="val" style={{ color: '#10b981' }}>
                      ₹{Number(vendor.defaultRate || 40000).toLocaleString('en-IN')} / event
                    </span>
                  </div>
                  <div className="vdb-profile-meta-item">
                    <span className="label">Availability:</span>
                    <span className="val" style={{ color: isAvailable ? '#10b981' : '#f59e0b' }}>
                      {isAvailable ? '🟢 Accepting Bookings' : '🟡 On Leave'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Edit Form */}
              <div className="vdb-form-card">
                <div className="vdb-card-header">
                  <h3>
                    <i className="fa-solid fa-pen-to-square"></i> Edit Business Profile
                  </h3>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className="vdb-form-row">
                    <div className="vdb-form-group">
                      <label>Business / Brand Name</label>
                      <input
                        type="text"
                        className="vdb-form-input"
                        value={profileForm.businessName}
                        onChange={e => setProfileForm({ ...profileForm, businessName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="vdb-form-group">
                      <label>Contact Person / Owner</label>
                      <input
                        type="text"
                        className="vdb-form-input"
                        value={profileForm.ownerName}
                        onChange={e => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="vdb-form-row">
                    <div className="vdb-form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        className="vdb-form-input"
                        value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="vdb-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className="vdb-form-input"
                        value={profileForm.email}
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="vdb-form-row">
                    <div className="vdb-form-group">
                      <label>City & Coverage Area</label>
                      <input
                        type="text"
                        className="vdb-form-input"
                        value={profileForm.city}
                        onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                        placeholder="e.g. Ahmedabad / Vadodara / Udaipur"
                      />
                    </div>

                    <div className="vdb-form-group">
                      <label>Base Rate per Event (₹)</label>
                      <input
                        type="number"
                        className="vdb-form-input"
                        value={profileForm.defaultRate}
                        onChange={e => setProfileForm({ ...profileForm, defaultRate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Services Offered Tags */}
                  <div className="vdb-form-group">
                    <label>Specialized Services Offered</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="vdb-form-input"
                        placeholder="e.g. Cinematic Video, Drone Shoots, Pre-Wedding"
                        value={newServiceTag}
                        onChange={e => setNewServiceTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddServiceTag()
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="vdb-btn vdb-btn-details"
                        onClick={handleAddServiceTag}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Add Tag
                      </button>
                    </div>

                    <div className="vdb-services-tags">
                      {profileForm.servicesOffered.map((tag, idx) => (
                        <span key={idx} className="vdb-service-tag">
                          {tag}
                          <button
                            type="button"
                            className="vdb-tag-remove"
                            onClick={() => handleRemoveServiceTag(tag)}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="vdb-form-group">
                    <label>About & Equipment Brief</label>
                    <textarea
                      className="vdb-form-textarea"
                      rows="3"
                      placeholder="Describe your equipment, team size, awards, or wedding specialties..."
                      value={profileForm.bio}
                      onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                    ></textarea>
                  </div>

                  <button type="submit" className="vdb-btn-save" disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <span>Saving Changes...</span>
                    ) : (
                      <span>
                        <i className="fa-solid fa-floppy-disk"></i> Save Profile Details
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* 3. TASK DETAIL MODAL                                           */}
      {/* ============================================================== */}
      {selectedTask && (
        <div className="vdb-modal-backdrop" onClick={() => setSelectedTask(null)}>
          <div className="vdb-modal" onClick={e => e.stopPropagation()}>
            <div className="vdb-modal-header">
              <div>
                <span className="vdb-badge-tag">
                  {selectedTask.currentAllocation?.service || vendor.service}
                </span>
                <h3 style={{ marginTop: 4 }}>{selectedTask.name || 'Client Event Details'}</h3>
              </div>
              <button className="vdb-modal-close-btn" onClick={() => setSelectedTask(null)}>
                ✕
              </button>
            </div>

            <div className="vdb-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>CLIENT NAME</span>
                  <strong>{selectedTask.name || 'Not specified'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>CONTACT PHONE</span>
                  <strong>{selectedTask.phone || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>EVENT DATE</span>
                  <strong>{selectedTask.date || 'To be decided'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>GUEST COUNT</span>
                  <strong>{selectedTask.guests || '100 - 300 Guests'}</strong>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>VENUE / LOCATION</span>
                <strong>{selectedTask.venue || selectedTask.address || 'Ahmedabad, Gujarat'}</strong>
              </div>

              <div
                style={{
                  background: '#faf8f5',
                  padding: 14,
                  borderRadius: 12,
                  border: '1px solid #ebd9b3',
                  marginBottom: 18
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#b8860b', fontWeight: 700, display: 'block' }}>
                  ADMIN & CLIENT REQUIREMENTS
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#334155' }}>
                  {selectedTask.currentAllocation?.requirements || 'Standard wedding package execution.'}
                </p>
              </div>

              {/* Financial Box */}
              <div className="vdb-task-payout-box" style={{ marginBottom: 12 }}>
                <div className="vdb-payout-item">
                  <span className="lbl">Total Contract</span>
                  <span className="val highlight">
                    ₹{Number(selectedTask.currentAllocation?.payout?.totalCost || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="vdb-payout-item">
                  <span className="lbl">Advance Paid</span>
                  <span className="val" style={{ color: '#10b981' }}>
                    ₹{Number(selectedTask.currentAllocation?.payout?.advanceAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="vdb-payout-item">
                  <span className="lbl">Remaining Due</span>
                  <span className="val" style={{ color: '#ef4444' }}>
                    ₹{Number(selectedTask.currentAllocation?.payout?.remainingAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="vdb-modal-footer">
              {selectedTask.currentAllocation?.status === 'Pending' && (
                <>
                  <button
                    className="vdb-btn vdb-btn-accept"
                    onClick={() =>
                      handleAccept(selectedTask.id, selectedTask.currentAllocation.allocationId)
                    }
                  >
                    <i className="fa-solid fa-check"></i> Accept This Task
                  </button>
                  <button
                    className="vdb-btn vdb-btn-decline"
                    onClick={() => {
                      setDeclinePromptId(selectedTask.currentAllocation.allocationId)
                      setSelectedTask(null)
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i> Decline
                  </button>
                </>
              )}

              {selectedTask.currentAllocation?.status === 'Accepted' && (
                <button
                  className="vdb-btn vdb-btn-complete"
                  onClick={() =>
                    handleMarkCompleted(selectedTask.id, selectedTask.currentAllocation.allocationId)
                  }
                >
                  <i className="fa-solid fa-flag-checkered"></i> Mark Service as Completed
                </button>
              )}

              <button className="vdb-btn vdb-btn-details" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorPortal
