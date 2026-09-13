import { useEffect, useMemo, useState } from 'react'
import { vendorTasksApi, bookingsApi, VENDOR_TASK_STATUS } from '../services/api'

const SERVICE_OPTIONS = [
  'Photography',
  'Decoration',
  'Catering',
  'Makeup',
  'DJ',
  'Venue',
  'Mehendi',
  'Music',
  'Transport'
]

const EMPTY_FORM = {
  bookingId: '',
  vendorId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  service: 'Photography',
  eventDate: '',
  eventTime: '',
  venue: '',
  guests: '',
  requirements: ''
}

function statusPillClass(status) {
  if (status === VENDOR_TASK_STATUS.APPROVED) return 'dw-pill pill-confirmed'
  if (status === VENDOR_TASK_STATUS.REJECTED) return 'dw-pill pill-rejected'
  if (status === VENDOR_TASK_STATUS.VENDOR_RESPONDED) return 'dw-pill pill-advance'
  return 'dw-pill pill-pending'
}

function VendorTaskAssignment({ vendors = [], users = [], bookings = [], setBookings, vendorTasks = [], setVendorTasks, showNotification }) {
  const [taskFilter, setTaskFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [reassignTask, setReassignTask] = useState(null)
  const [reassignVendorId, setReassignVendorId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const activeVendors = useMemo(
    () => (vendors || []).filter(v => v.status !== 'Inactive'),
    [vendors]
  )

  // Bookings that still need a vendor confirmed (not yet confirmed/rejected).
  // Assigning a vendor to one of these, once approved, is what unlocks that
  // customer's payment via the existing booking confirmation flow.
  const assignableBookings = useMemo(
    () => (bookings || [])
      .filter(b => b.bookingStatus !== 'confirmed' && b.bookingStatus !== 'rejected')
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    [bookings]
  )

  // Lock background page scroll while the Assign/Reassign modal is open so the
  // mouse wheel scrolls the form itself instead of the admin page behind it.
  useEffect(() => {
    if (isAssignOpen || reassignTask) {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [isAssignOpen, reassignTask])

  const counts = useMemo(() => {
    const list = vendorTasks || []
    return {
      all: list.length,
      pending: list.filter(t => t.status === VENDOR_TASK_STATUS.PENDING).length,
      responded: list.filter(t => t.status === VENDOR_TASK_STATUS.VENDOR_RESPONDED).length,
      approved: list.filter(t => t.status === VENDOR_TASK_STATUS.APPROVED).length,
      rejected: list.filter(t => t.status === VENDOR_TASK_STATUS.REJECTED).length,
      yes: list.filter(t => t.vendorResponse === 'YES').length,
      no: list.filter(t => t.vendorResponse === 'NO').length
    }
  }, [vendorTasks])

  const filteredTasks = useMemo(() => {
    let list = [...(vendorTasks || [])]
    if (taskFilter === 'pending') list = list.filter(t => t.status === VENDOR_TASK_STATUS.PENDING)
    if (taskFilter === 'responded') list = list.filter(t => t.status === VENDOR_TASK_STATUS.VENDOR_RESPONDED)
    if (taskFilter === 'approved') list = list.filter(t => t.status === VENDOR_TASK_STATUS.APPROVED)
    if (taskFilter === 'rejected') list = list.filter(t => t.status === VENDOR_TASK_STATUS.REJECTED)
    if (taskFilter === 'yes') list = list.filter(t => t.vendorResponse === 'YES')
    if (taskFilter === 'no') list = list.filter(t => t.vendorResponse === 'NO')

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(t =>
        [t.customerName, t.customerEmail, t.vendorName, t.service, t.venue, t.customerPhone]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    }
    return list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  }, [vendorTasks, taskFilter, searchQuery])

  const persistList = (updatedList) => {
    setVendorTasks(updatedList)
    localStorage.setItem('dw_vendorTasks', JSON.stringify(updatedList))
  }

  const openAssignForVendor = (vendor) => {
    setForm({
      ...EMPTY_FORM,
      vendorId: vendor?.id || '',
      service: vendor?.service || 'Photography'
    })
    setIsAssignOpen(true)
  }

  const handleVendorChange = (vendorId) => {
    const selected = activeVendors.find(v => String(v.id) === String(vendorId))
    setForm(prev => ({
      ...prev,
      vendorId,
      service: selected?.service || prev.service
    }))
  }

  const handlePrefillCustomer = (userId) => {
    const user = users.find(u => String(u.id) === String(userId))
    if (!user) return
    setForm(prev => ({
      ...prev,
      customerName: user.name || '',
      customerEmail: user.email || '',
      customerPhone: user.phone || ''
    }))
  }

  const handlePrefillBooking = (bookingId) => {
    const booking = assignableBookings.find(b => String(b.id) === String(bookingId))
    if (!booking) {
      setForm(prev => ({ ...prev, bookingId: '' }))
      return
    }
    setForm(prev => ({
      ...prev,
      bookingId: booking.id,
      customerName: booking.name || prev.customerName,
      customerEmail: booking.email || prev.customerEmail,
      customerPhone: booking.phone || prev.customerPhone,
      venue: booking.venue || booking.address || prev.venue,
      guests: booking.guests || prev.guests,
      eventDate: booking.date || prev.eventDate,
      requirements: booking.customSummary || booking.notes || prev.requirements
    }))
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    const vendor = activeVendors.find(v => String(v.id) === String(form.vendorId))
    if (!vendor) {
      showNotification?.('Please select a registered vendor.')
      return
    }
    if (!form.bookingId) {
      showNotification?.('Please select the customer booking this task belongs to.')
      return
    }
    const existingActiveTask = (vendorTasks || []).find(
      t => String(t.bookingId) === String(form.bookingId) && t.status !== VENDOR_TASK_STATUS.REJECTED
    )
    if (existingActiveTask) {
      showNotification?.('This booking already has an active vendor task. Reject it before assigning a new one.')
      return
    }
    if (!form.customerName.trim() || !form.service.trim() || !form.eventDate) {
      showNotification?.('Customer name, service, and date are required.')
      return
    }

    setSaving(true)
    const newTask = {
      bookingId: form.bookingId,
      vendorId: vendor.id,
      vendorName: vendor.name || vendor.businessName,
      vendorEmail: vendor.email || '',
      vendorPhone: vendor.phone || '',
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      customerPhone: form.customerPhone.trim(),
      service: form.service,
      eventDate: form.eventDate,
      eventTime: form.eventTime,
      venue: form.venue.trim(),
      guests: form.guests.trim(),
      requirements: form.requirements.trim(),
      status: VENDOR_TASK_STATUS.PENDING,
      vendorResponse: null,
      vendorResponseNote: '',
      adminDecision: null,
      assignmentHistory: [],
      createdAt: new Date().toISOString(),
      respondedAt: null,
      decidedAt: null
    }

    try {
      const saved = await vendorTasksApi.create(newTask)
      persistList([...(vendorTasks || []).filter(t => t.id !== saved.id), saved])
      setIsAssignOpen(false)
      setForm(EMPTY_FORM)
      showNotification?.(`Assigned ${form.service} to ${vendor.name}. Status: Pending.`)
    } catch (err) {
      console.warn('Assign task failed:', err)
      showNotification?.('Could not save assignment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDecision = async (task, decision) => {
    if (task.vendorResponse !== 'YES') return
    const updated = {
      ...task,
      status: decision,
      adminDecision: decision,
      decidedAt: new Date().toISOString()
    }
    try {
      await vendorTasksApi.update(task.id, updated)
    } catch (err) {
      console.warn('Admin decision sync warning:', err)
    }
    persistList((vendorTasks || []).map(t => (String(t.id) === String(task.id) ? updated : t)))

    // Approving the vendor's response is what unlocks the customer's existing
    // payment flow: we confirm their booking (same bookingStatus the existing
    // User → Admin flow already checks) and attach the vendor's accepted
    // details so they show up once payment succeeds — no changes to the
    // User-side payment/booking code itself.
    if (decision === VENDOR_TASK_STATUS.APPROVED && task.bookingId) {
      const targetBooking = (bookings || []).find(b => String(b.id) === String(task.bookingId))
      if (targetBooking) {
        const newAllocation = {
          allocationId: 'alloc_' + Date.now() + Math.random().toString(36).substring(2, 6),
          vendorId: task.vendorId,
          vendorName: task.vendorName,
          vendorEmail: task.vendorEmail,
          vendorPhone: task.vendorPhone || '',
          service: task.service,
          requirements: task.vendorResponseNote || task.requirements || '',
          status: 'Accepted',
          assignedAt: task.createdAt,
          respondedAt: task.respondedAt || new Date().toISOString(),
          payout: {
            totalCost: Number(task.advanceAmount) || 0,
            advanceAmount: Number(task.advanceAmount) || 0,
            remainingAmount: 0,
            payoutStatus: 'Advance Paid',
            advancePaidAt: new Date().toISOString()
          }
        }
        const remainingAllocations = Array.isArray(targetBooking.vendorAllocations)
          ? targetBooking.vendorAllocations.filter(a => String(a.vendorId) !== String(task.vendorId))
          : []
        const updatedBooking = {
          ...targetBooking,
          bookingStatus: 'confirmed',
          statusUpdatedAt: new Date().toISOString(),
          vendorAllocations: [...remainingAllocations, newAllocation]
        }
        try {
          await bookingsApi.update(targetBooking.id, updatedBooking)
        } catch (err) {
          console.warn('Booking unlock sync warning:', err)
        }
        const updatedBookingsList = (bookings || []).map(b =>
          String(b.id) === String(targetBooking.id) ? updatedBooking : b
        )
        setBookings?.(updatedBookingsList)
        localStorage.setItem('dw_bookings', JSON.stringify(updatedBookingsList))
      }
    }

    showNotification?.(
      decision === VENDOR_TASK_STATUS.APPROVED
        ? `Approved. ${task.vendorName}'s response is confirmed — the customer's payment is now unlocked.`
        : `Rejected ${task.vendorName}'s response. Payment stays locked — assign another vendor when ready.`
    )
  }

  const handleReassign = async (e) => {
    e.preventDefault()
    if (!reassignTask) return
    const vendor = activeVendors.find(v => String(v.id) === String(reassignVendorId))
    if (!vendor) {
      showNotification?.('Select another vendor to reassign.')
      return
    }
    if (String(vendor.id) === String(reassignTask.vendorId)) {
      showNotification?.('Choose a different vendor than the one who declined.')
      return
    }

    const historyEntry = {
      vendorId: reassignTask.vendorId,
      vendorName: reassignTask.vendorName,
      vendorEmail: reassignTask.vendorEmail,
      vendorResponse: reassignTask.vendorResponse,
      vendorResponseNote: reassignTask.vendorResponseNote,
      declinedAt: reassignTask.respondedAt || new Date().toISOString()
    }

    const updated = {
      ...reassignTask,
      vendorId: vendor.id,
      vendorName: vendor.name || vendor.businessName,
      vendorEmail: vendor.email || '',
      vendorPhone: vendor.phone || '',
      status: VENDOR_TASK_STATUS.PENDING,
      vendorResponse: null,
      vendorResponseNote: '',
      adminDecision: null,
      respondedAt: null,
      decidedAt: null,
      reassignedAt: new Date().toISOString(),
      assignmentHistory: [...(reassignTask.assignmentHistory || []), historyEntry]
    }

    try {
      await vendorTasksApi.update(reassignTask.id, updated)
    } catch (err) {
      console.warn('Reassign sync warning:', err)
    }
    persistList((vendorTasks || []).map(t => (String(t.id) === String(reassignTask.id) ? updated : t)))
    setReassignTask(null)
    setReassignVendorId('')
    showNotification?.(`Reassigned to ${vendor.name}. Waiting for vendor response.`)
  }

  return (
    <div>
      <div className="dw-stats-grid" style={{ marginBottom: '18px' }}>
        <div className="dw-stat-card card-total">
          <div className="dw-stat-info">
            <span className="dw-stat-label">Registered Vendors</span>
            <span className="dw-stat-number">{activeVendors.length}</span>
            <span className="dw-stat-subtext">Available for assignment</span>
          </div>
          <div className="dw-stat-icon"><i className="fa-solid fa-store"></i></div>
        </div>
        <div className="dw-stat-card card-pending">
          <div className="dw-stat-info">
            <span className="dw-stat-label">Pending</span>
            <span className="dw-stat-number">{counts.pending}</span>
            <span className="dw-stat-subtext">Awaiting vendor YES/NO</span>
          </div>
          <div className="dw-stat-icon"><i className="fa-solid fa-hourglass-half"></i></div>
        </div>
        <div className="dw-stat-card card-confirmed">
          <div className="dw-stat-info">
            <span className="dw-stat-label">Vendor Responded</span>
            <span className="dw-stat-number">{counts.responded}</span>
            <span className="dw-stat-subtext">{counts.yes} YES · {counts.no} NO</span>
          </div>
          <div className="dw-stat-icon"><i className="fa-solid fa-comments"></i></div>
        </div>
        <div className="dw-stat-card card-revenue">
          <div className="dw-stat-info">
            <span className="dw-stat-label">Approved</span>
            <span className="dw-stat-number">{counts.approved}</span>
            <span className="dw-stat-subtext">{counts.rejected} rejected</span>
          </div>
          <div className="dw-stat-icon"><i className="fa-solid fa-clipboard-check"></i></div>
        </div>
      </div>

      <div className="dw-panel-card" style={{ marginBottom: '18px' }}>
        <div className="dw-panel-header">
          <div className="dw-panel-title-area">
            <i className="fa-solid fa-user-plus" style={{ color: '#b8860b' }}></i>
            <h3>Registered Vendors ({activeVendors.length})</h3>
          </div>
          <button
            type="button"
            className="dw-topbar-btn dw-topbar-btn-primary"
            style={{ background: '#b8860b', borderColor: '#b8860b', color: '#fff' }}
            onClick={() => {
              setForm(EMPTY_FORM)
              setIsAssignOpen(true)
            }}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>
            Assign Service / Task
          </button>
        </div>

        {activeVendors.length === 0 ? (
          <div className="dw-empty-state">
            <div className="dw-empty-icon"><i className="fa-solid fa-users-slash"></i></div>
            <h3>No vendors registered</h3>
            <p>Vendors who register through the vendor portal will appear here for task assignment.</p>
          </div>
        ) : (
          <div className="dw-table-wrapper">
            <table className="dw-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Service</th>
                  <th>Contact</th>
                  <th>Open Tasks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeVendors.map(v => {
                  const openCount = (vendorTasks || []).filter(
                    t => String(t.vendorId) === String(v.id) &&
                      t.status !== VENDOR_TASK_STATUS.REJECTED
                  ).length
                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="dw-cell-client">
                          <div className="dw-client-avatar-mini"><i className="fa-solid fa-store"></i></div>
                          <div>
                            <div className="dw-client-name">{v.name || v.businessName}</div>
                            <div className="dw-client-sub">{v.ownerName || v.contactPerson || 'Owner'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="dw-badge-pill dw-badge-neutral">{v.service || 'General'}</span></td>
                      <td>
                        <div>{v.email}</div>
                        <div className="dw-client-sub">{v.phone || 'Not provided'}</div>
                      </td>
                      <td>{openCount}</td>
                      <td>
                        <button
                          type="button"
                          className="dw-btn-action dw-btn-action-wide"
                          onClick={() => openAssignForVendor(v)}
                        >
                          <i className="fa-solid fa-clipboard-list"></i> Assign Task
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dw-panel-card">
        <div className="dw-panel-header">
          <div className="dw-panel-title-area">
            <i className="fa-solid fa-list-check" style={{ color: '#b8860b' }}></i>
            <h3>Assigned Tasks ({filteredTasks.length})</h3>
          </div>
          <div className="dw-filter-pills">
            {[
              ['all', `All (${counts.all})`],
              ['pending', `Pending (${counts.pending})`],
              ['responded', `Responded (${counts.responded})`],
              ['yes', `YES (${counts.yes})`],
              ['no', `NO (${counts.no})`],
              ['approved', `Approved (${counts.approved})`],
              ['rejected', `Rejected (${counts.rejected})`]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`dw-pill ${taskFilter === key ? 'active' : ''}`}
                onClick={() => setTaskFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 18px 12px' }}>
          <input
            type="search"
            className="dw-form-control"
            placeholder="Search customer, vendor, service, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredTasks.length === 0 ? (
          <div className="dw-empty-state">
            <div className="dw-empty-icon"><i className="fa-solid fa-clipboard"></i></div>
            <h3>No assignments yet</h3>
            <p>Assign a wedding service to a registered vendor. Status starts as Pending until they respond YES or NO.</p>
          </div>
        ) : (
          <div className="dw-table-wrapper">
            <table className="dw-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service / Event</th>
                  <th>Vendor</th>
                  <th>Vendor Response</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const canDecide = task.vendorResponse === 'YES' && !task.adminDecision
                  const canReassign =
                    (task.vendorResponse === 'NO' || task.adminDecision === VENDOR_TASK_STATUS.REJECTED) &&
                    task.status !== VENDOR_TASK_STATUS.APPROVED
                  return (
                    <tr key={task.id}>
                      <td>
                        <div className="dw-client-name">{task.customerName}</div>
                        <div className="dw-client-sub">{task.customerEmail || '—'} · {task.customerPhone || '—'}</div>
                      </td>
                      <td>
                        <div className="dw-client-name">{task.service}</div>
                        <div className="dw-client-sub">
                          {task.eventDate || 'Date TBD'}
                          {task.eventTime ? ` · ${task.eventTime}` : ''}
                          {task.venue ? ` · ${task.venue}` : ''}
                          {task.guests ? ` · ${task.guests} guests` : ''}
                        </div>
                        {task.requirements && (
                          <div className="dw-client-sub" style={{ marginTop: 4 }}>{task.requirements}</div>
                        )}
                      </td>
                      <td>
                        <div>{task.vendorName}</div>
                        <div className="dw-client-sub">{task.vendorEmail}</div>
                        {task.assignmentHistory?.length > 0 && (
                          <div className="dw-client-sub">
                            Previously declined: {task.assignmentHistory.map(h => h.vendorName).join(', ')}
                          </div>
                        )}
                      </td>
                      <td>
                        {!task.vendorResponse && <span className="dw-client-sub">Waiting…</span>}
                        {task.vendorResponse === 'YES' && (
                          <span className="dw-pill pill-confirmed">YES</span>
                        )}
                        {task.vendorResponse === 'NO' && (
                          <span className="dw-pill pill-rejected">NO</span>
                        )}
                        {task.vendorResponse === 'YES' && Number(task.advanceAmount) > 0 && (
                          <div className="dw-client-sub" style={{ marginTop: 4 }}>
                            Advance: <strong>₹{Number(task.advanceAmount).toLocaleString('en-IN')}</strong>
                          </div>
                        )}
                        {task.vendorResponseNote && (
                          <div className="dw-client-sub" style={{ marginTop: 4 }}>{task.vendorResponseNote}</div>
                        )}
                      </td>
                      <td>
                        <span className={statusPillClass(task.status)}>{task.status}</span>
                        {task.adminDecision && (
                          <div className="dw-client-sub" style={{ marginTop: 4 }}>Admin: {task.adminDecision}</div>
                        )}
                      </td>
                      <td>
                        <div className="dw-actions-group">
                          {canDecide && (
                            <>
                              <button
                                type="button"
                                className="dw-btn-action dw-btn-action-wide"
                                onClick={() => handleDecision(task, VENDOR_TASK_STATUS.APPROVED)}
                              >
                                <i className="fa-solid fa-check"></i> Approve
                              </button>
                              <button
                                type="button"
                                className="dw-btn-action dw-btn-action-wide action-delete"
                                onClick={() => handleDecision(task, VENDOR_TASK_STATUS.REJECTED)}
                              >
                                <i className="fa-solid fa-xmark"></i> Reject
                              </button>
                            </>
                          )}
                          {canReassign && (
                            <button
                              type="button"
                              className="dw-btn-action dw-btn-action-wide"
                              onClick={() => {
                                setReassignTask(task)
                                setReassignVendorId('')
                              }}
                            >
                              <i className="fa-solid fa-user-group"></i> Assign another vendor
                            </button>
                          )}
                          {!canDecide && !canReassign && (
                            <span className="dw-client-sub">No action</span>
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

      {isAssignOpen && (
        <div className="dw-modal-backdrop" onClick={() => setIsAssignOpen(false)}>
          <div className="dw-modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="dw-modal-header">
              <div className="dw-modal-header-brand">
                <h3>Assign <span>Wedding Task</span></h3>
              </div>
              <button type="button" className="dw-modal-close-btn" onClick={() => setIsAssignOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="dw-modal-body">
                <div className="dw-modal-section">
                  <div className="dw-modal-section-title">Vendor</div>
                  <label className="dw-form-label">Registered vendor *</label>
                  <select
                    className="dw-form-control"
                    required
                    value={form.vendorId}
                    onChange={(e) => handleVendorChange(e.target.value)}
                  >
                    <option value="">Select vendor</option>
                    {activeVendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name || v.businessName} — {v.service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dw-modal-section">
                  <div className="dw-modal-section-title">Customer booking</div>
                  <label className="dw-form-label">Booking to assign this vendor to *</label>
                  <select
                    className="dw-form-control"
                    required
                    value={form.bookingId}
                    onChange={(e) => handlePrefillBooking(e.target.value)}
                  >
                    <option value="">Select booking</option>
                    {assignableBookings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.service} — {b.date || 'date TBD'} (#{String(b.id).slice(-6)})
                      </option>
                    ))}
                  </select>
                  {assignableBookings.length === 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                      No bookings are currently waiting on a vendor. Bookings already confirmed or rejected don't need one.
                    </p>
                  )}
                  {users.length > 0 && (
                    <div style={{ margin: '12px 0' }}>
                      <label className="dw-form-label">Or prefill from registered client (optional)</label>
                      <select
                        className="dw-form-control"
                        defaultValue=""
                        onChange={(e) => handlePrefillCustomer(e.target.value)}
                      >
                        <option value="">Enter manually</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="dw-modal-grid">
                    <div>
                      <label className="dw-form-label">Customer name *</label>
                      <input
                        className="dw-form-control"
                        required
                        value={form.customerName}
                        onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="dw-form-label">Email</label>
                      <input
                        type="email"
                        className="dw-form-control"
                        value={form.customerEmail}
                        onChange={(e) => setForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="dw-form-label">Phone</label>
                      <input
                        className="dw-form-control"
                        value={form.customerPhone}
                        onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="dw-form-label">Guests</label>
                      <input
                        className="dw-form-control"
                        value={form.guests}
                        onChange={(e) => setForm(prev => ({ ...prev, guests: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="dw-modal-section">
                  <div className="dw-modal-section-title">Service &amp; event</div>
                  <div className="dw-modal-grid">
                    <div>
                      <label className="dw-form-label">Wedding service *</label>
                      <select
                        className="dw-form-control"
                        value={form.service}
                        onChange={(e) => setForm(prev => ({ ...prev, service: e.target.value }))}
                      >
                        {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="dw-form-label">Venue</label>
                      <input
                        className="dw-form-control"
                        value={form.venue}
                        onChange={(e) => setForm(prev => ({ ...prev, venue: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="dw-form-label">Date *</label>
                      <input
                        type="date"
                        className="dw-form-control"
                        required
                        value={form.eventDate}
                        onChange={(e) => setForm(prev => ({ ...prev, eventDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="dw-form-label">Time</label>
                      <input
                        type="time"
                        className="dw-form-control"
                        value={form.eventTime}
                        onChange={(e) => setForm(prev => ({ ...prev, eventTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label className="dw-form-label">Requirements</label>
                    <textarea
                      className="dw-form-control"
                      rows={3}
                      value={form.requirements}
                      onChange={(e) => setForm(prev => ({ ...prev, requirements: e.target.value }))}
                      placeholder="Special requests, theme, coverage notes..."
                    />
                  </div>
                </div>
              </div>
              <div className="dw-modal-footer">
                <button type="button" className="dw-topbar-btn" onClick={() => setIsAssignOpen(false)}>Cancel</button>
                <button
                  type="submit"
                  className="dw-topbar-btn dw-topbar-btn-primary"
                  style={{ background: '#b8860b', borderColor: '#b8860b', color: '#fff' }}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reassignTask && (
        <div className="dw-modal-backdrop" onClick={() => setReassignTask(null)}>
          <div className="dw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dw-modal-header">
              <div className="dw-modal-header-brand">
                <h3>Assign <span>another vendor</span></h3>
              </div>
              <button type="button" className="dw-modal-close-btn" onClick={() => setReassignTask(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleReassign}>
              <div className="dw-modal-body">
                <p style={{ marginTop: 0, color: '#475569' }}>
                  <strong>{reassignTask.vendorName}</strong> responded <strong>NO</strong> to {reassignTask.service} for {reassignTask.customerName}.
                  Customer details stay the same; only the vendor changes. Status returns to Pending.
                </p>
                <label className="dw-form-label">New vendor *</label>
                <select
                  className="dw-form-control"
                  required
                  value={reassignVendorId}
                  onChange={(e) => setReassignVendorId(e.target.value)}
                >
                  <option value="">Select vendor</option>
                  {activeVendors
                    .filter(v => String(v.id) !== String(reassignTask.vendorId))
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name || v.businessName} — {v.service}
                      </option>
                    ))}
                </select>
              </div>
              <div className="dw-modal-footer">
                <button type="button" className="dw-topbar-btn" onClick={() => setReassignTask(null)}>Cancel</button>
                <button
                  type="submit"
                  className="dw-topbar-btn dw-topbar-btn-primary"
                  style={{ background: '#b8860b', borderColor: '#b8860b', color: '#fff' }}
                >
                  Reassign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorTaskAssignment
