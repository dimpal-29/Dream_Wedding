import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { vendorAuthApi, bookingsApi, vendorsApi, vendorTasksApi, vendorAiApi, VENDOR_TASK_STATUS } from '../services/api'
import '../vendor.css'

function VendorPortal() {
  const navigate = useNavigate()

  // State
  const [vendor, setVendor] = useState(null)
  const [bookings, setBookings] = useState([])
  const [vendorTasks, setVendorTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'tasks' | 'ai-tasks' | 'payouts' | 'profile'
  const [taskFilter, setTaskFilter] = useState('all') // 'all' | 'pending' | 'accepted' | 'completed' | 'declined'
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // AI Task Generator State
  const [aiSelectedBookingId, setAiSelectedBookingId] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiChecklistMap, setAiChecklistMap] = useState({})

  // Modals & Action States
  const [selectedTask, setSelectedTask] = useState(null)
  const [declinePromptId, setDeclinePromptId] = useState(null)
  const [declineReason, setDeclineReason] = useState('')
  const [acceptPromptId, setAcceptPromptId] = useState(null)
  const [acceptTotalAmount, setAcceptTotalAmount] = useState('')
  const [acceptAdvanceAmount, setAcceptAdvanceAmount] = useState('')
  const [acceptRemainingAmount, setAcceptRemainingAmount] = useState('')
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

        // Normalize API response – handle both plain arrays and {data:[]} shapes
        let bListRaw = await bookingsApi.getAll()
        let bList = Array.isArray(bListRaw)
          ? bListRaw
          : (bListRaw?.data && Array.isArray(bListRaw.data) ? bListRaw.data : [])
        if (bList.length === 0) {
          try {
            const raw = localStorage.getItem('dw_bookings')
            if (raw) {
              const parsed = JSON.parse(raw)
              bList = Array.isArray(parsed) ? parsed : []
            }
          } catch { /* ignore */ }
        }
        setBookings(bList)

        const taskListRaw = await vendorTasksApi.getAll()
        const taskList = Array.isArray(taskListRaw)
          ? taskListRaw
          : (taskListRaw?.data && Array.isArray(taskListRaw.data) ? taskListRaw.data : [])
        setVendorTasks(taskList)
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

  // 2. Extract and Consolidate Assigned Bookings & Tasks for this Vendor
  // A single booking-service assignment has exactly ONE unified card with its
  // current active status (Workflow: Pending → Accepted → Completed; Declined is terminal).
  const allTasks = useMemo(() => {
    if (!vendor) return []

    const assignmentMap = new Map()

    const getAssignmentKey = (bId, vId, service, altId) => {
      const normBooking = bId ? String(bId).trim() : ''
      const normVendor = vId ? String(vId).trim() : ''
      const normService = service ? String(service).trim().toLowerCase() : ''
      if (normBooking) {
        return `b_${normBooking}__v_${normVendor}__s_${normService}`
      }
      return `task_${altId || 'unknown'}`
    }

    // 1. Process bookings and their vendorAllocations
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
            const key = getAssignmentKey(
              b.id,
              vendor.id,
              alloc.service || b.service || vendor.service,
              alloc.allocationId
            )

            const rawPayout = alloc.payout || {
              totalCost: 0,
              advanceAmount: 0,
              remainingAmount: 0,
              payoutStatus: 'Pending'
            }

            const item = {
              id: b.id,
              bookingId: b.id,
              _isAdminTask: false,
              _adminTaskId: null,
              allocationId: alloc.allocationId,
              name: b.name || 'Client Event',
              email: b.email || '',
              phone: b.phone || '',
              date: b.date || '',
              eventTime: b.eventTime || '',
              venue: b.venue || b.address || '',
              guests: b.guests || '',
              service: alloc.service || b.service || vendor.service || 'Decoration',
              notes: alloc.requirements || b.notes || b.customSummary || '',
              vendorAllocations: b.vendorAllocations || [],
              currentAllocation: {
                allocationId: alloc.allocationId,
                service: alloc.service || b.service || vendor.service || 'Decoration',
                status: alloc.status || 'Pending',
                vendorId: alloc.vendorId || vendor.id,
                requirements: alloc.requirements || b.notes || b.customSummary || '',
                payout: rawPayout,
                aiChecklist: alloc.aiChecklist || null
              },
              rawBooking: b,
              rawTask: null
            }

            assignmentMap.set(key, item)
          }
        })
      }
    })

    // 2. Process admin assigned tasks from vendorTasks
    const relevantTasks = (vendorTasks || []).filter(t => {
      const matchId = t.vendorId && String(t.vendorId) === String(vendor.id)
      const matchEmail =
        t.vendorEmail &&
        vendor.email &&
        t.vendorEmail.toLowerCase() === vendor.email.toLowerCase()
      return matchId || matchEmail
    })

    relevantTasks.forEach(t => {
      const taskService = t.service || vendor.service || 'Decoration'
      const key = getAssignmentKey(t.bookingId, vendor.id, taskService, t.id)

      let taskStatus = 'Pending'
      if (t.status === 'Completed' || t.adminDecision === 'Completed') {
        taskStatus = 'Completed'
      } else if (t.vendorResponse === 'YES') {
        taskStatus = t.adminDecision === VENDOR_TASK_STATUS.APPROVED ? 'Accepted' : 'Pending'
      } else if (t.vendorResponse === 'NO' || t.adminDecision === VENDOR_TASK_STATUS.REJECTED) {
        taskStatus = 'Declined'
      } else if (t.status === 'Approved') {
        taskStatus = 'Accepted'
      }

      const existing = assignmentMap.get(key)
      if (existing) {
        existing._adminTaskId = t.id
        existing.rawTask = t
        if (t.eventTime && !existing.eventTime) existing.eventTime = t.eventTime
        if (t.venue && !existing.venue) existing.venue = t.venue
        if (t.guests && !existing.guests) existing.guests = t.guests
        if (t.aiChecklist && !existing.currentAllocation.aiChecklist) {
          existing.currentAllocation.aiChecklist = t.aiChecklist
        }

        // Status hierarchy: Completed > Accepted > Declined / Pending
        const currentAllocStatus = existing.currentAllocation.status
        if (currentAllocStatus === 'Completed' || taskStatus === 'Completed') {
          existing.currentAllocation.status = 'Completed'
        } else if (currentAllocStatus === 'Accepted' || taskStatus === 'Accepted') {
          existing.currentAllocation.status = 'Accepted'
        } else if (currentAllocStatus === 'Declined' && taskStatus !== 'Accepted' && taskStatus !== 'Completed') {
          existing.currentAllocation.status = 'Declined'
        } else if (taskStatus === 'Declined' && currentAllocStatus !== 'Accepted' && currentAllocStatus !== 'Completed') {
          existing.currentAllocation.status = 'Declined'
        } else {
          existing.currentAllocation.status = currentAllocStatus || taskStatus || 'Pending'
        }

        const currentPayout = existing.currentAllocation.payout || {}
        const total = Number(currentPayout.totalCost) || Number(t.totalCost) || (Number(t.advanceAmount || 0) + Number(t.remainingAmount || 0)) || Number(currentPayout.advanceAmount || 0) || Number(t.advanceAmount || 0) || 0
        const adv = Number(currentPayout.advanceAmount) || Number(t.advanceAmount) || 0
        const rem = Number(currentPayout.remainingAmount) || Number(t.remainingAmount) || (total > adv ? total - adv : 0)
        const pStatus = currentPayout.payoutStatus || t.payoutStatus || 'Pending'

        existing.currentAllocation.payout = {
          totalCost: total,
          advanceAmount: adv,
          remainingAmount: rem,
          payoutStatus: pStatus,
          advancePaidAt: currentPayout.advancePaidAt || t.advancePaidAt || null,
          fullyPaidAt: currentPayout.fullyPaidAt || t.fullyPaidAt || null
        }
      } else {
        const total = Number(t.totalCost) || (Number(t.advanceAmount || 0) + Number(t.remainingAmount || 0)) || Number(t.advanceAmount) || 0
        const adv = Number(t.advanceAmount) || 0
        const rem = Number(t.remainingAmount) || (total > adv ? total - adv : 0)
        const pStatus = t.payoutStatus || 'Pending'

        const item = {
          id: t.bookingId || `admtask_${t.id}`,
          bookingId: t.bookingId || null,
          _isAdminTask: true,
          _adminTaskId: t.id,
          allocationId: t.id,
          name: t.customerName || 'Client Event',
          email: t.customerEmail || '',
          phone: t.customerPhone || '',
          date: t.eventDate || '',
          eventTime: t.eventTime || '',
          venue: t.venue || '',
          guests: t.guests || '',
          service: taskService,
          notes: t.requirements || '',
          vendorAllocations: [],
          currentAllocation: {
            allocationId: t.id,
            service: taskService,
            status: taskStatus,
            vendorId: t.vendorId,
            requirements: t.requirements || '',
            payout: {
              totalCost: total,
              advanceAmount: adv,
              remainingAmount: rem,
              payoutStatus: pStatus,
              advancePaidAt: t.advancePaidAt || null,
              fullyPaidAt: t.fullyPaidAt || null
            },
            aiChecklist: t.aiChecklist || null
          },
          rawBooking: null,
          rawTask: t
        }
        assignmentMap.set(key, item)
      }
    })

    return Array.from(assignmentMap.values())
  }, [bookings, vendorTasks, vendor])

  // Backward-compatible alias for other tabs (e.g. Overview & Payouts)
  const assignedBookings = allTasks

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

  // 3. Metric Calculations — strictly based on deduplicated unique assignments
  const pendingTasks = useMemo(
    () => allTasks.filter(b => (b.currentAllocation?.status || 'Pending') === 'Pending'),
    [allTasks]
  )

  const acceptedTasks = useMemo(
    () => allTasks.filter(b => b.currentAllocation?.status === 'Accepted'),
    [allTasks]
  )

  const completedTasks = useMemo(
    () => allTasks.filter(b => b.currentAllocation?.status === 'Completed'),
    [allTasks]
  )

  const declinedTasks = useMemo(
    () => allTasks.filter(b => b.currentAllocation?.status === 'Declined'),
    [allTasks]
  )

  // Financial Totals across all unique active assignments
  const totalEarnings = useMemo(() => {
    return allTasks.reduce((sum, b) => {
      if (b.currentAllocation?.status === 'Declined') return sum
      return sum + Number(b.currentAllocation?.payout?.totalCost || 0)
    }, 0)
  }, [allTasks])

  const totalAdvance = useMemo(() => {
    return allTasks.reduce((sum, b) => {
      if (b.currentAllocation?.status === 'Declined') return sum
      const pStatus = b.currentAllocation?.payout?.payoutStatus
      if (pStatus === 'Advance Paid' || pStatus === 'Fully Paid') {
        return sum + Number(b.currentAllocation?.payout?.advanceAmount || 0)
      }
      return sum
    }, 0)
  }, [allTasks])

  const totalRemaining = useMemo(() => {
    return allTasks.reduce((sum, b) => {
      if (b.currentAllocation?.status === 'Declined') return sum
      const pStatus = b.currentAllocation?.payout?.payoutStatus
      if (pStatus === 'Fully Paid') return sum
      return sum + Number(b.currentAllocation?.payout?.remainingAmount || 0)
    }, 0)
  }, [allTasks])

  // Filtered and Searched Bookings for Tasks Tab
  const filteredTasks = useMemo(() => {
    let list = allTasks

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
  }, [allTasks, taskFilter, searchQuery])

  // AI Task Generator: Eligible bookings (strictly excluding declined / rejected tasks)
  const eligibleAiBookings = useMemo(() => {
    return allTasks.filter(b => {
      const status = (b.currentAllocation?.status || '').toLowerCase()
      return status !== 'declined' && status !== 'rejected'
    })
  }, [allTasks])

  const selectedAiBooking = useMemo(() => {
    if (!eligibleAiBookings.length) return null
    if (!aiSelectedBookingId) return eligibleAiBookings[0]
    return (
      eligibleAiBookings.find(b => String(b.id) === String(aiSelectedBookingId)) ||
      eligibleAiBookings[0]
    )
  }, [eligibleAiBookings, aiSelectedBookingId])

  const currentChecklist = useMemo(() => {
    if (!selectedAiBooking) return null
    const key = selectedAiBooking.id
    const taskId = selectedAiBooking._adminTaskId || selectedAiBooking.currentAllocation?.allocationId
    return aiChecklistMap[key] || (taskId && aiChecklistMap[taskId]) || null
  }, [selectedAiBooking, aiChecklistMap])

  const { completedCount, totalCount, completionPct } = useMemo(() => {
    const list = currentChecklist?.checklist || []
    const total = list.length
    const completed = list.filter(i => i.completed).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completedCount: completed, totalCount: total, completionPct: pct }
  }, [currentChecklist])

  // Sync AI Checklists from vendorTasks, bookings, and localStorage
  useEffect(() => {
    if (!vendor) return
    try {
      const map = {}

      // Read cached checklists from localStorage
      try {
        const local = localStorage.getItem(`dw_ai_checklists_${vendor.id}`)
        if (local) {
          Object.assign(map, JSON.parse(local))
        }
      } catch { /* ignore */ }

      // Normalize to safe arrays defensively – guard against truthy non-arrays
      const safeVendorTasks = Array.isArray(vendorTasks) ? vendorTasks : []
      const safeBookings = Array.isArray(bookings) ? bookings : []

      // Read checklists from vendorTasks in db.json
      safeVendorTasks.forEach(t => {
        if (t && t.aiChecklist) {
          if (t.bookingId) map[t.bookingId] = t.aiChecklist
          map[t.id] = t.aiChecklist
        }
      })

      // Read checklists from bookings vendorAllocations in db.json
      safeBookings.forEach(b => {
        if (b && Array.isArray(b.vendorAllocations)) {
          b.vendorAllocations.forEach(alloc => {
            if (alloc && alloc.aiChecklist) {
              map[b.id] = alloc.aiChecklist
              if (alloc.allocationId) map[alloc.allocationId] = alloc.aiChecklist
            }
          })
        }
      })

      setAiChecklistMap(prev => ({ ...prev, ...map }))
    } catch (err) {
      console.warn('AI checklist sync error (non-fatal):', err)
    }
  }, [vendorTasks, bookings, vendor])

  // Generate AI checklist using backend Gemini AI endpoint
  const handleGenerateAiChecklist = async (targetBooking) => {
    if (!targetBooking) return
    setAiLoading(true)
    setAiError('')

    const alloc = targetBooking.currentAllocation || {}
    const taskId = targetBooking._adminTaskId || alloc.allocationId || `task_${targetBooking.id}`
    const bookingId = targetBooking.id && !String(targetBooking.id).startsWith('admtask_') ? targetBooking.id : (targetBooking.bookingId || null)

    const allocService = alloc.service && !alloc.service.toLowerCase().includes('package') ? alloc.service : null
    const targetService = targetBooking.service && !targetBooking.service.toLowerCase().includes('package') ? targetBooking.service : null
    const effectiveService = allocService || vendor?.service || targetService || 'Decoration'

    const payload = {
      taskId,
      bookingId,
      vendorId: vendor?.id,
      service: effectiveService,
      customerName: targetBooking.name || 'Wedding Client',
      customerPhone: targetBooking.phone || '',
      customerEmail: targetBooking.email || '',
      requirements: alloc.requirements || targetBooking.notes || targetBooking.customSummary || '',
      guests: targetBooking.guests || '200',
      eventDate: targetBooking.date || 'TBD',
      eventTime: targetBooking.eventTime || '',
      venue: targetBooking.venue || targetBooking.address || 'Ahmedabad'
    }

    try {
      const res = await vendorAiApi.generateChecklist(payload)
      if (res?.success && res.aiChecklist) {
        const key = bookingId || taskId
        setAiChecklistMap(prev => {
          const updated = {
            ...prev,
            [key]: res.aiChecklist,
            [taskId]: res.aiChecklist
          }
          if (bookingId) updated[bookingId] = res.aiChecklist
          try {
            if (vendor?.id) {
              localStorage.setItem(`dw_ai_checklists_${vendor.id}`, JSON.stringify(updated))
            }
          } catch { /* ignore */ }
          return updated
        })

        if (window.showToast) {
          window.showToast('AI Preparation Checklist generated successfully!', 'success')
        }
      }
    } catch (err) {
      console.error('Error generating AI checklist:', err)
      setAiError(err.message || 'Failed to generate AI preparation checklist. Please ensure the backend is running.')
    } finally {
      setAiLoading(false)
    }
  }

  // Toggle checklist item completion
  const handleToggleChecklistItem = async (bookingKey, taskId, itemId) => {
    const currentChecklistObj = aiChecklistMap[bookingKey] || aiChecklistMap[taskId]
    if (!currentChecklistObj || !Array.isArray(currentChecklistObj.checklist)) return

    const updatedChecklist = currentChecklistObj.checklist.map(item => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed }
      }
      return item
    })

    const updatedChecklistObj = {
      ...currentChecklistObj,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString()
    }

    setAiChecklistMap(prev => {
      const next = {
        ...prev,
        [bookingKey]: updatedChecklistObj,
        [taskId]: updatedChecklistObj
      }
      try {
        if (vendor?.id) {
          localStorage.setItem(`dw_ai_checklists_${vendor.id}`, JSON.stringify(next))
        }
      } catch { /* ignore */ }
      return next
    })

    try {
      await vendorAiApi.updateChecklist({
        taskId,
        bookingId: String(bookingKey).startsWith('admtask_') ? null : bookingKey,
        checklist: updatedChecklist
      })
    } catch (err) {
      console.warn('Could not persist checklist item state to backend:', err.message)
    }
  }

  // Mark all / reset checklist items
  const handleToggleAllTasks = async (markCompleted) => {
    if (!selectedAiBooking || !currentChecklist || !Array.isArray(currentChecklist.checklist)) return
    const updatedChecklist = currentChecklist.checklist.map(i => ({ ...i, completed: markCompleted }))
    const bKey = selectedAiBooking.id
    const taskId = currentChecklist.taskId || selectedAiBooking._adminTaskId
    const updatedObj = { ...currentChecklist, checklist: updatedChecklist, updatedAt: new Date().toISOString() }

    setAiChecklistMap(prev => {
      const next = { ...prev, [bKey]: updatedObj }
      if (taskId) next[taskId] = updatedObj
      try {
        if (vendor?.id) localStorage.setItem(`dw_ai_checklists_${vendor.id}`, JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })

    try {
      await vendorAiApi.updateChecklist({
        taskId,
        bookingId: String(bKey).startsWith('admtask_') ? null : bKey,
        checklist: updatedChecklist
      })
    } catch (err) {
      console.warn('Could not persist all items toggle:', err.message)
    }
  }

  // 4. Action Handlers: Accept Task
  const handleAccept = async (bookingId, allocationId) => {
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (!target) return

    const totalProp = Number(acceptTotalAmount) || (Number(acceptAdvanceAmount || 0) + Number(acceptRemainingAmount || 0))
    const advProp = Number(acceptAdvanceAmount) || 0
    const remProp = Number(acceptRemainingAmount) || (totalProp > advProp ? totalProp - advProp : 0)

    const updatedAllocations = (target.vendorAllocations || []).map(alloc => {
      if (alloc.allocationId === allocationId) {
        const prevPayout = alloc.payout || {}
        return {
          ...alloc,
          status: 'Accepted',
          respondedAt: new Date().toISOString(),
          vendorResponseNote: acceptDescription.trim() || alloc.vendorResponseNote || '',
          payout: {
            totalCost: totalProp || prevPayout.totalCost || advProp || 0,
            advanceAmount: advProp || prevPayout.advanceAmount || 0,
            remainingAmount: remProp || prevPayout.remainingAmount || 0,
            payoutStatus: prevPayout.payoutStatus || 'Pending',
            advancePaidAt: prevPayout.advancePaidAt || null,
            fullyPaidAt: prevPayout.fullyPaidAt || null
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

    setAcceptPromptId(null)
    setAcceptTotalAmount('')
    setAcceptAdvanceAmount('')
    setAcceptRemainingAmount('')
    setAcceptDescription('')

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
    const totalProp = Number(acceptTotalAmount) || (Number(acceptAdvanceAmount || 0) + Number(acceptRemainingAmount || 0))
    const advProp = Number(acceptAdvanceAmount) || 0
    const remProp = Number(acceptRemainingAmount) || (totalProp > advProp ? totalProp - advProp : 0)

    const updated = {
      ...target,
      vendorResponse: response,
      vendorResponseNote: response === 'NO' ? declineReason.trim() : acceptDescription.trim(),
      totalCost: response === 'YES' ? (totalProp || advProp || target.totalCost || 0) : target.totalCost || 0,
      advanceAmount: response === 'YES' ? (advProp || target.advanceAmount || 0) : target.advanceAmount || 0,
      remainingAmount: response === 'YES' ? (remProp || target.remainingAmount || 0) : target.remainingAmount || 0,
      payoutStatus: target.payoutStatus || 'Pending',
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
    setAcceptTotalAmount('')
    setAcceptAdvanceAmount('')
    setAcceptRemainingAmount('')
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
    // 1. Update in bookings collection if booking exists
    const target = bookings.find(b => String(b.id) === String(bookingId))
    if (target) {
      const updatedAllocations = (target.vendorAllocations || []).map(alloc => {
        if (
          alloc.allocationId === allocationId ||
          (alloc.vendorId && String(alloc.vendorId) === String(vendor?.id))
        ) {
          return {
            ...alloc,
            status: 'Completed',
            completedAt: new Date().toISOString()
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
    }

    // 2. Also synchronize vendorTasks in db.json so admin and vendor portals stay 100% in sync
    const matchedTask = (vendorTasks || []).find(
      t => String(t.bookingId) === String(bookingId) || String(t.id) === String(allocationId)
    )
    if (matchedTask) {
      const updatedTask = {
        ...matchedTask,
        status: 'Completed',
        adminDecision: 'Completed',
        completedAt: new Date().toISOString()
      }
      const updatedTasksList = (vendorTasks || []).map(t =>
        String(t.id) === String(matchedTask.id) ? updatedTask : t
      )
      setVendorTasks(updatedTasksList)
      localStorage.setItem('dw_vendorTasks', JSON.stringify(updatedTasksList))

      try {
        await vendorTasksApi.update(matchedTask.id, updatedTask)
      } catch (err) {
        console.warn('VendorTask sync warning:', err)
      }
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
                className={`vdb-nav-item ${activeTab === 'ai-tasks' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('ai-tasks')
                  setIsSidebarOpen(false)
                }}
              >
                <div className="vdb-nav-item-left">
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#8b5cf6' }}></i>
                  <span>AI Task Generator</span>
                </div>
                <span className="vdb-nav-badge" style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', color: '#fff', fontSize: '0.68rem', padding: '2px 7px' }}>AI</span>
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
              {activeTab === 'ai-tasks' && 'AI Task Generator & Preparation Checklist'}
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
              {/* Action Required: Notification banner if there are new pending assignments awaiting vendor response */}
              {pendingAdminTasks.length > 0 && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                    border: '1.5px solid #fde68a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: '#f59e0b',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.15rem',
                        flexShrink: 0
                      }}
                    >
                      <i className="fa-solid fa-bell"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#92400e', fontWeight: 800 }}>
                        {pendingAdminTasks.length} New Assignment{pendingAdminTasks.length > 1 ? 's' : ''} Awaiting Your Response
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#b45309' }}>
                        Admin has assigned wedding bookings to your studio. Review details and confirm acceptance below.
                      </p>
                    </div>
                  </div>
                  <button
                    className="vdb-btn"
                    onClick={() => setTaskFilter('pending')}
                    style={{
                      background: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      padding: '8px 16px',
                      borderRadius: 8
                    }}
                  >
                    Filter Pending Tasks ({pendingAdminTasks.length})
                  </button>
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
                    All ({allTasks.length})
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
                      type="button"
                      className={`vdb-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setViewMode('cards')}
                      title="Column (Card Grid) View"
                    >
                      <i className="fa-solid fa-table-cells-large"></i>
                      <span>Column View</span>
                    </button>
                    <button
                      type="button"
                      className={`vdb-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                      title="Row (List / Table) View"
                    >
                      <i className="fa-solid fa-bars"></i>
                      <span>Row View</span>
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
                    const alloc = booking.currentAllocation || {}
                    const payout = alloc.payout || { totalCost: 0, advanceAmount: 0, remainingAmount: 0 }
                    const isPending = alloc.status === 'Pending'
                    const isAccepted = alloc.status === 'Accepted'
                    const isCompleted = alloc.status === 'Completed'
                    const isDeclined = alloc.status === 'Declined'
                    const adminTaskId = booking._adminTaskId || alloc.allocationId
                    const promptKey = adminTaskId || booking.id
                    const isAdvancePaid = payout.payoutStatus === 'Advance Paid' || payout.payoutStatus === 'Fully Paid' || !!payout.advancePaidAt
                    const isFullyPaid = payout.payoutStatus === 'Fully Paid' || !!payout.fullyPaidAt

                    return (
                      <div key={`${booking.id}-${alloc.allocationId || 'alloc'}`} className="vdb-task-card">
                        {/* 1. Header: Service Category & Current Status */}
                        <div className="vdb-task-card-top">
                          <div>
                            <span className="vdb-task-service-badge">
                              <i className="fa-solid fa-wand-magic-sparkles"></i> {alloc.service || vendor.service}
                            </span>
                            <h3 className="vdb-task-client">{booking.name || 'Client Event'}</h3>
                            <div className="vdb-task-event-meta">
                              <span>
                                <i className="fa-solid fa-calendar" style={{ color: '#b8860b' }}></i>{' '}
                                {booking.date || 'TBD'}{booking.eventTime ? ` · ${booking.eventTime}` : ''}
                              </span>
                              <span>
                                <i className="fa-solid fa-location-dot" style={{ color: '#b8860b' }}></i>{' '}
                                {booking.venue || booking.address || 'Venue TBD'}
                              </span>
                              {booking.guests && (
                                <span>
                                  <i className="fa-solid fa-users" style={{ color: '#b8860b' }}></i>{' '}
                                  {booking.guests} Guests
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`vdb-pill ${(alloc.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                            {isCompleted && <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }}></i>}
                            {isAccepted && <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }}></i>}
                            {isPending && <i className="fa-solid fa-clock" style={{ marginRight: 4 }}></i>}
                            {isDeclined && <i className="fa-solid fa-circle-xmark" style={{ marginRight: 4 }}></i>}
                            {alloc.status || 'Pending'}
                          </span>
                        </div>

                        {/* 2. Body: Customer Requirements & Contract Value */}
                        <div className="vdb-task-card-body">
                          <div className="vdb-task-req-box">
                            <strong>
                              <i className="fa-solid fa-file-lines" style={{ marginRight: 5, color: '#b8860b' }}></i>
                              Customer Requirements:
                            </strong>
                            <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.45, color: '#334155' }}>
                              {alloc.requirements || booking.notes || 'Standard wedding service requested as per package.'}
                            </p>
                          </div>

                          <div className="vdb-task-payout-box" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                            <div className="vdb-payout-item">
                              <span className="lbl">Contract Value</span>
                              <span className="val highlight">
                                ₹{Number(payout.totalCost || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="vdb-payout-item">
                              <span className="lbl">Advance</span>
                              <span className="val" style={{ color: isAdvancePaid ? '#15803d' : '#b45309' }}>
                                ₹{Number(payout.advanceAmount || 0).toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: isAdvancePaid ? '#15803d' : '#d97706', fontWeight: 600 }}>
                                {isAdvancePaid ? '✓ Received' : '⏳ Pending'}
                              </span>
                            </div>
                            <div className="vdb-payout-item">
                              <span className="lbl">Remaining</span>
                              <span className="val" style={{ color: isFullyPaid ? '#15803d' : '#64748b' }}>
                                ₹{Number(payout.remainingAmount != null ? payout.remainingAmount : Math.max(0, (payout.totalCost || 0) - (payout.advanceAmount || 0))).toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: isFullyPaid ? '#15803d' : '#d97706', fontWeight: 600 }}>
                                {isFullyPaid ? '✓ Paid' : '⏳ Pending'}
                              </span>
                            </div>
                            <div className="vdb-payout-item">
                              <span className="lbl">Payout Status</span>
                              <span
                                className="val"
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: isDeclined ? '#64748b' : (isFullyPaid ? '#15803d' : (isAdvancePaid ? '#0369a1' : '#b45309'))
                                }}
                              >
                                {isDeclined ? 'Cancelled' : (isFullyPaid ? 'Fully Paid' : (isAdvancePaid ? 'Advance Received' : 'Advance Pending'))}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Footer: Details, AI Checklist & Status-driven Actions */}
                        <div className="vdb-task-card-footer">
                          <button
                            className="vdb-btn vdb-btn-details"
                            onClick={() => setSelectedTask(booking)}
                          >
                            <i className="fa-solid fa-eye"></i> View Details
                          </button>

                          {/* Do not suggest AI checklist for declined or rejected tasks */}
                          {!isDeclined && alloc.status !== 'Rejected' && (
                            <button
                              className="vdb-btn"
                              onClick={() => {
                                setAiSelectedBookingId(booking.id)
                                setActiveTab('ai-tasks')
                              }}
                              style={{
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1px solid #ddd6fe',
                                fontWeight: 600
                              }}
                              title="Generate or view AI Preparation Checklist"
                            >
                              <i className="fa-solid fa-wand-magic-sparkles"></i> AI Checklist
                            </button>
                          )}

                          {/* Actionable buttons according to current status */}
                          {isPending && (
                            <>
                              <button
                                className="vdb-btn vdb-btn-accept"
                                onClick={() => {
                                  setDeclinePromptId(null)
                                  setDeclineReason('')
                                  setAcceptPromptId(promptKey)
                                  setAcceptTotalAmount(payout.totalCost ? String(payout.totalCost) : '')
                                  setAcceptAdvanceAmount(payout.advanceAmount ? String(payout.advanceAmount) : '')
                                  setAcceptRemainingAmount(payout.remainingAmount != null ? String(payout.remainingAmount) : (payout.totalCost ? String(Math.max(0, (payout.totalCost || 0) - (payout.advanceAmount || 0))) : ''))
                                  setAcceptDescription('')
                                }}
                              >
                                <i className="fa-solid fa-check"></i> Accept Task
                              </button>
                              <button
                                className="vdb-btn vdb-btn-decline"
                                onClick={() => {
                                  setAcceptPromptId(null)
                                  setAcceptAdvanceAmount('')
                                  setAcceptDescription('')
                                  setDeclinePromptId(promptKey)
                                }}
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

                          {isCompleted && (
                            <span
                              style={{
                                color: '#16a34a',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                background: '#f0fdf4',
                                borderRadius: 8,
                                border: '1px solid #bbf7d0'
                              }}
                            >
                              <i className="fa-solid fa-circle-check"></i> Completed
                            </span>
                          )}

                          {isDeclined && (
                            <span
                              style={{
                                color: '#b91c1c',
                                fontWeight: 600,
                                fontSize: '0.84rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                background: '#fef2f2',
                                borderRadius: 8,
                                border: '1px solid #fecaca'
                              }}
                            >
                              <i className="fa-solid fa-circle-xmark"></i> Declined
                            </span>
                          )}
                        </div>

                        {/* Accept confirmation prompt */}
                        {acceptPromptId === promptKey && (
                          <div className="vportal-decline-prompt" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 16 }}>
                            <h5 style={{ marginTop: 0, marginBottom: 12, color: '#1e293b' }}>Confirm Acceptance & Advance Terms</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                              <div>
                                <label className="dw-form-label" style={{ display: 'block', marginBottom: 4, fontSize: '0.82rem' }}>
                                  Total Contract Value (₹) *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  className="dw-form-control"
                                  value={acceptTotalAmount}
                                  onChange={e => {
                                    const tot = e.target.value
                                    setAcceptTotalAmount(tot)
                                    const adv = Number(acceptAdvanceAmount) || 0
                                    if (tot !== '') {
                                      setAcceptRemainingAmount(String(Math.max(0, Number(tot) - adv)))
                                    }
                                  }}
                                  placeholder="e.g. 40000"
                                />
                              </div>
                              <div>
                                <label className="dw-form-label" style={{ display: 'block', marginBottom: 4, fontSize: '0.82rem' }}>
                                  Advance Amount (₹) *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  className="dw-form-control"
                                  value={acceptAdvanceAmount}
                                  onChange={e => {
                                    const adv = e.target.value
                                    setAcceptAdvanceAmount(adv)
                                    const tot = Number(acceptTotalAmount) || 0
                                    if (adv !== '') {
                                      setAcceptRemainingAmount(String(Math.max(0, tot - Number(adv))))
                                    }
                                  }}
                                  placeholder="e.g. 10000"
                                />
                              </div>
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              <label className="dw-form-label" style={{ display: 'block', marginBottom: 4, fontSize: '0.82rem' }}>
                                Remaining Balance (₹) (Auto-calculated)
                              </label>
                              <input
                                type="number"
                                readOnly
                                className="dw-form-control"
                                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                                value={acceptRemainingAmount}
                              />
                            </div>
                            <label className="dw-form-label" style={{ display: 'block', marginBottom: 4, fontSize: '0.82rem' }}>
                              Short description / Confirmation note
                            </label>
                            <textarea
                              className="dw-form-control"
                              style={{ width: '100%', marginBottom: 10 }}
                              value={acceptDescription}
                              onChange={e => setAcceptDescription(e.target.value)}
                              placeholder="e.g. Confirmed for the full wedding ceremony execution."
                              rows="2"
                            ></textarea>
                            <div className="vportal-decline-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button
                                className="vportal-btn vportal-btn-cancel"
                                onClick={() => {
                                  setAcceptPromptId(null)
                                  setAcceptTotalAmount('')
                                  setAcceptAdvanceAmount('')
                                  setAcceptRemainingAmount('')
                                  setAcceptDescription('')
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                className="vportal-btn vportal-btn-confirm-decline"
                                style={{ background: '#15803d', color: '#fff' }}
                                onClick={() => {
                                  if (booking._adminTaskId) {
                                    handleAdminTaskRespond(booking._adminTaskId, 'YES')
                                  } else {
                                    handleAccept(booking.id, alloc.allocationId)
                                  }
                                }}
                              >
                                Confirm Acceptance
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Decline prompt */}
                        {declinePromptId === promptKey && (
                          <div className="vportal-decline-prompt">
                            <h5>Reason for Declining this Assignment</h5>
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
                                onClick={() => {
                                  if (booking._adminTaskId) {
                                    handleAdminTaskRespond(booking._adminTaskId, 'NO')
                                  } else {
                                    handleDecline(booking.id, alloc.allocationId)
                                  }
                                }}
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
                        <th>Requirements</th>
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
                        const isDeclined = alloc.status === 'Declined' || alloc.status === 'Rejected'
                        const isCompleted = alloc.status === 'Completed'
                        const isAdminTask = !!booking._isAdminTask
                        const adminTaskId = booking._adminTaskId
                        const isAdvancePaid = payout.payoutStatus === 'Advance Paid' || payout.payoutStatus === 'Fully Paid' || !!payout.advancePaidAt
                        const isFullyPaid = payout.payoutStatus === 'Fully Paid' || !!payout.fullyPaidAt

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
                            <td style={{ maxWidth: 220 }}>
                              <div
                                style={{
                                  fontSize: '0.82rem',
                                  color: '#475569',
                                  lineHeight: 1.35,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                                title={alloc.requirements || booking.notes || 'Standard wedding service'}
                              >
                                {alloc.requirements || booking.notes || 'Standard wedding service requested as per package.'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>
                                ₹{Number(payout.totalCost || 0).toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: isAdvancePaid ? '#15803d' : '#b45309', fontWeight: 500 }}>
                                Adv: ₹{Number(payout.advanceAmount || 0).toLocaleString('en-IN')} ({isAdvancePaid ? 'Recv' : 'Pend'})
                              </div>
                              <div style={{ fontSize: '0.74rem', color: isFullyPaid ? '#15803d' : '#64748b', fontWeight: 500 }}>
                                Rem: ₹{Number(payout.remainingAmount != null ? payout.remainingAmount : Math.max(0, (payout.totalCost || 0) - (payout.advanceAmount || 0))).toLocaleString('en-IN')}
                              </div>
                            </td>
                            <td>
                              <div>
                                <span className={`vdb-pill ${(alloc.status || 'Pending').toLowerCase()}`}>
                                  {alloc.status || 'Pending'}
                                </span>
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <span
                                  className="vdb-pill"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    background: isDeclined ? '#f1f5f9' : (isFullyPaid ? '#dcfce7' : (isAdvancePaid ? '#e0f2fe' : '#fef3c7')),
                                    color: isDeclined ? '#64748b' : (isFullyPaid ? '#15803d' : (isAdvancePaid ? '#0369a1' : '#b45309'))
                                  }}
                                >
                                  {isDeclined ? 'Cancelled' : (isFullyPaid ? 'Fully Paid' : (isAdvancePaid ? 'Advance Received' : 'Advance Pending'))}
                                </span>
                              </div>
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
                                {!isDeclined && alloc.status !== 'Rejected' && (
                                  <button
                                    className="vdb-btn"
                                    onClick={() => {
                                      setAiSelectedBookingId(booking.id)
                                      setActiveTab('ai-tasks')
                                    }}
                                    style={{
                                      background: '#f5f3ff',
                                      color: '#7c3aed',
                                      border: '1px solid #ddd6fe'
                                    }}
                                    title="AI Preparation Checklist"
                                  >
                                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                                  </button>
                                )}
                                {isPending && (
                                  <>
                                    <button
                                      className="vdb-btn vdb-btn-accept"
                                      onClick={() => {
                                        setDeclinePromptId(null)
                                        setDeclineReason('')
                                        const promptKey = adminTaskId || booking.id
                                        setAcceptPromptId(promptKey)
                                        setAcceptTotalAmount(payout.totalCost ? String(payout.totalCost) : '')
                                        setAcceptAdvanceAmount(payout.advanceAmount ? String(payout.advanceAmount) : '')
                                        setAcceptRemainingAmount(payout.remainingAmount != null ? String(payout.remainingAmount) : (payout.totalCost ? String(Math.max(0, (payout.totalCost || 0) - (payout.advanceAmount || 0))) : ''))
                                        setAcceptDescription('')
                                        setViewMode('cards')
                                      }}
                                      title="Accept Task"
                                    >
                                      <i className="fa-solid fa-check"></i>
                                    </button>
                                    <button
                                      className="vdb-btn vdb-btn-decline"
                                      onClick={() => {
                                        setAcceptPromptId(null)
                                        setAcceptTotalAmount('')
                                        setAcceptAdvanceAmount('')
                                        setAcceptRemainingAmount('')
                                        setAcceptDescription('')
                                        setDeclinePromptId(adminTaskId || booking.id)
                                        setViewMode('cards')
                                      }}
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
          {/* TAB: AI TASK GENERATOR & PREPARATION CHECKLIST               */}
          {/* ============================================================ */}
          {activeTab === 'ai-tasks' && (
            <div className="vdb-ai-section">
              {/* Header Hero Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
                  borderRadius: 16,
                  padding: '24px 28px',
                  color: '#fff',
                  marginBottom: 24,
                  boxShadow: '0 8px 24px rgba(76, 29, 149, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div style={{ maxWidth: 640 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(255,255,255,0.15)',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: 10,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#fbbf24' }}></i>
                    <span>Powered by Gemini AI</span>
                  </div>
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: '#fff'
                    }}
                  >
                    AI Task Generator & Preparation Checklist
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    Generate service-specific execution checklists, required materials, preparation timelines, and crucial event instructions tailored to your actual wedding booking details.
                  </p>
                </div>

                {selectedAiBooking && (
                  <button
                    className="vdb-btn"
                    disabled={aiLoading}
                    onClick={() => handleGenerateAiChecklist(selectedAiBooking)}
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      color: '#0f172a',
                      fontWeight: 700,
                      padding: '12px 22px',
                      borderRadius: 12,
                      border: 'none',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {aiLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        {currentChecklist ? 'Regenerate AI Checklist' : 'Generate AI Checklist'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* No Assigned Bookings State */}
              {eligibleAiBookings.length === 0 ? (
                <div className="vdb-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
                  <h3 style={{ margin: '0 0 8px' }}>No Active Assigned Bookings Available</h3>
                  <p style={{ color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
                    AI Checklist generation is available for active, accepted, or confirmed bookings. Declined and rejected assignments are excluded.
                  </p>
                </div>
              ) : (
                <>
                  {/* Booking Selector Toolbar */}
                  <div className="vdb-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                          <i className="fa-solid fa-bookmark" style={{ color: '#b8860b', marginRight: 6 }}></i>
                          Select Assigned Booking:
                        </span>
                        <select
                          className="dw-form-control"
                          style={{ minWidth: 280, maxWidth: 480, padding: '8px 12px', fontSize: '0.9rem' }}
                          value={selectedAiBooking?.id || ''}
                          onChange={e => setAiSelectedBookingId(e.target.value)}
                        >
                          {eligibleAiBookings.map(b => {
                            const bKey = b.id
                            const hasCl = !!(aiChecklistMap[bKey] || (b._adminTaskId && aiChecklistMap[b._adminTaskId]))
                            return (
                              <option key={bKey} value={bKey}>
                                {b.name || 'Client'} — {b.currentAllocation?.service || b.service || vendor.service} ({b.date || 'TBD'}) {hasCl ? '✓ [AI Checklist Ready]' : ''}
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      {/* Quick Status Pill */}
                      {selectedAiBooking && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`vdb-pill ${(selectedAiBooking.currentAllocation?.status || 'Pending').toLowerCase()}`}>
                            {selectedAiBooking.currentAllocation?.status || 'Pending'}
                          </span>
                          {currentChecklist && (
                            <span
                              style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: '0.78rem',
                                fontWeight: 600
                              }}
                            >
                              <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }}></i>
                              Checklist Active
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Brief Card */}
                  {selectedAiBooking && (
                    <div
                      className="vdb-card"
                      style={{ padding: '18px 22px', marginBottom: 24, borderLeft: '4px solid #b8860b' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 12
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span className="vdb-task-service-badge" style={{ margin: 0 }}>
                              <i className="fa-solid fa-star"></i>{' '}
                              {selectedAiBooking.currentAllocation?.service || selectedAiBooking.service || vendor.service}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Booking #{selectedAiBooking.id}
                            </span>
                          </div>
                          <h3 style={{ margin: '4px 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                            {selectedAiBooking.name}
                          </h3>
                          <div className="vdb-task-event-meta" style={{ marginTop: 4 }}>
                            <span>
                              <i className="fa-solid fa-calendar" style={{ color: '#b8860b' }}></i>{' '}
                              {selectedAiBooking.date || 'TBD'}
                            </span>
                            <span>
                              <i className="fa-solid fa-location-dot" style={{ color: '#b8860b' }}></i>{' '}
                              {selectedAiBooking.venue || selectedAiBooking.address || 'Venue TBD'}
                            </span>
                            <span>
                              <i className="fa-solid fa-users" style={{ color: '#b8860b' }}></i>{' '}
                              {selectedAiBooking.guests || '—'} Guests
                            </span>
                            {selectedAiBooking.phone && (
                              <span>
                                <i className="fa-solid fa-phone" style={{ color: '#b8860b' }}></i>{' '}
                                {selectedAiBooking.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', minWidth: 160 }}>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: '#64748b',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          >
                            Assigned Payout
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b8860b' }}>
                            ₹{Number(selectedAiBooking.currentAllocation?.payout?.totalCost || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Requirements box */}
                      {(selectedAiBooking.currentAllocation?.requirements || selectedAiBooking.notes || selectedAiBooking.customSummary) && (
                        <div className="vdb-task-req-box" style={{ marginTop: 14 }}>
                          <strong>Customer Requirements & Event Notes:</strong>
                          {selectedAiBooking.currentAllocation?.requirements || selectedAiBooking.notes || selectedAiBooking.customSummary}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading State Banner */}
                  {aiLoading && (
                    <div
                      className="vdb-card"
                      style={{
                        padding: '40px 24px',
                        textAlign: 'center',
                        marginBottom: 24,
                        border: '1px dashed #8b5cf6'
                      }}
                    >
                      <div style={{ fontSize: '2.5rem', color: '#8b5cf6', marginBottom: 14 }}>
                        <i className="fa-solid fa-wand-magic-sparkles fa-bounce"></i>
                      </div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#1e1b4b' }}>
                        Gemini AI is analyzing booking details & generating checklist...
                      </h4>
                      <p style={{ color: '#64748b', margin: '0 auto', maxWidth: 520, fontSize: '0.88rem' }}>
                        Synthesizing service requirements, guest count, venue dimensions, materials, and timing milestones to create an actionable vendor preparation plan.
                      </p>
                    </div>
                  )}

                  {/* Error State Banner */}
                  {aiError && !aiLoading && (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        padding: '16px 20px',
                        borderRadius: 12,
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '1.2rem', color: '#dc2626' }}></i>
                        <div>
                          <strong>Error generating AI checklist:</strong>
                          <div style={{ fontSize: '0.88rem', marginTop: 2 }}>{aiError}</div>
                        </div>
                      </div>
                      <button
                        className="vdb-btn"
                        onClick={() => handleGenerateAiChecklist(selectedAiBooking)}
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: 8,
                          fontSize: '0.82rem'
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Empty state when no checklist is generated yet for selected booking */}
                  {!currentChecklist && !aiLoading && !aiError && selectedAiBooking && (
                    <div className="vdb-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: '50%',
                          background: '#ede9fe',
                          color: '#7c3aed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          margin: '0 auto 16px'
                        }}
                      >
                        <i className="fa-solid fa-sparkles"></i>
                      </div>
                      <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#0f172a' }}>
                        No Preparation Checklist Generated Yet
                      </h3>
                      <p style={{ color: '#64748b', maxWidth: 520, margin: '0 auto 20px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        Click below to have Gemini AI analyze <strong>{selectedAiBooking.name}</strong>'s booking for <strong>{selectedAiBooking.currentAllocation?.service || vendor.service}</strong> and generate a service-specific preparation checklist, materials list, timeline, and safety guidelines.
                      </p>
                      <button
                        className="vdb-btn"
                        onClick={() => handleGenerateAiChecklist(selectedAiBooking)}
                        style={{
                          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          padding: '12px 24px',
                          borderRadius: 12,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: '0.95rem',
                          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                        }}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        Generate AI Preparation Checklist
                      </button>
                    </div>
                  )}

                  {/* Active Generated AI Checklist Content */}
                  {currentChecklist && !aiLoading && (
                    <div>
                      {/* Checklist Progress Overview */}
                      <div className="vdb-card" style={{ padding: '18px 22px', marginBottom: 24 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10,
                            flexWrap: 'wrap',
                            gap: 10
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                                Checklist Execution Progress
                              </h4>
                              {currentChecklist.modelUsed && (
                                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 12 }}>
                                  via {currentChecklist.modelUsed}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 3 }}>
                              {completedCount} of {totalCount} tasks completed ({completionPct}%)
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="vdb-btn vdb-btn-details"
                              onClick={() => handleToggleAllTasks(true)}
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              <i className="fa-solid fa-check-double"></i> Mark All Done
                            </button>
                            <button
                              className="vdb-btn vdb-btn-details"
                              onClick={() => handleToggleAllTasks(false)}
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              <i className="fa-solid fa-rotate-left"></i> Reset
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${completionPct}%`,
                              height: '100%',
                              background: completionPct === 100 ? '#10b981' : 'linear-gradient(90deg, #7c3aed, #fbbf24)',
                              transition: 'width 0.3s ease'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* GRID: Section 1 Checklist + Section 2 Materials */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
                        {/* 1. PREPARATION CHECKLIST */}
                        <div className="vdb-card" style={{ padding: '22px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: '#ede9fe',
                                color: '#7c3aed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="fa-solid fa-list-check"></i>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                              1. Preparation Checklist ({currentChecklist.checklist?.length || 0})
                            </h4>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(currentChecklist.checklist || []).map(item => (
                              <label
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 12,
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  background: item.completed ? '#f0fdf4' : '#f8fafc',
                                  border: `1px solid ${item.completed ? '#bbf7d0' : '#e2e8f0'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!item.completed}
                                  onChange={() => handleToggleChecklistItem(selectedAiBooking.id, currentChecklist.taskId, item.id)}
                                  style={{ marginTop: 3, width: 17, height: 17, accentColor: '#10b981', cursor: 'pointer' }}
                                />
                                <span
                                  style={{
                                    fontSize: '0.9rem',
                                    color: item.completed ? '#166534' : '#1e293b',
                                    textDecoration: item.completed ? 'line-through' : 'none',
                                    lineHeight: 1.4
                                  }}
                                >
                                  {item.text}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* 2. REQUIRED MATERIALS & TOOLS */}
                        <div className="vdb-card" style={{ padding: '22px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: '#fef3c7',
                                color: '#b45309',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="fa-solid fa-box-open"></i>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                              2. Required Materials & Equipment ({currentChecklist.materials?.length || 0})
                            </h4>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {(currentChecklist.materials || []).map((mat, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  color: '#92400e',
                                  padding: '7px 12px',
                                  borderRadius: 8,
                                  fontSize: '0.86rem',
                                  fontWeight: 500
                                }}
                              >
                                <i className="fa-solid fa-check" style={{ fontSize: '0.75rem', color: '#d97706' }}></i>
                                <span>{mat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* GRID: Section 3 Timeline + Section 4 Instructions */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
                        {/* 3. SUGGESTED PREPARATION TIMELINE */}
                        <div className="vdb-card" style={{ padding: '22px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: '#e0f2fe',
                                color: '#0369a1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="fa-solid fa-clock"></i>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                              3. Suggested Preparation Timeline
                            </h4>
                          </div>

                          {/* Appropriate past event notice if event date has concluded */}
                          {(currentChecklist.isPastEvent || currentChecklist.pastEventNotice || (selectedAiBooking?.date && new Date(selectedAiBooking.date) < new Date(new Date().setHours(0,0,0,0)))) && (
                            <div
                              style={{
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: 10,
                                padding: '10px 14px',
                                marginBottom: 14,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                fontSize: '0.84rem',
                                color: '#92400e'
                              }}
                            >
                              <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '1rem', color: '#d97706', flexShrink: 0 }}></i>
                              <div>
                                <strong>Event Concluded ({selectedAiBooking?.date || currentChecklist.eventDate}):</strong>{' '}
                                {currentChecklist.pastEventNotice || 'This event date has already passed. The timeline displays completed execution and post-event wrap-up & reconciliation milestones.'}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {(currentChecklist.timeline || []).map((stage, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 10,
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderLeft: '4px solid #0284c7'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                                    {stage.title}
                                  </span>
                                  <span
                                    style={{
                                      background: '#e0f2fe',
                                      color: '#0369a1',
                                      padding: '2px 8px',
                                      borderRadius: 12,
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    {stage.timing}
                                  </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>
                                  {stage.details}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. IMPORTANT INSTRUCTIONS */}
                        <div className="vdb-card" style={{ padding: '22px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                              4. Important Instructions & Guidelines
                            </h4>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(currentChecklist.instructions || []).map((inst, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  padding: '10px 12px',
                                  borderRadius: 8,
                                  background: '#fff1f2',
                                  border: '1px solid #fecdd3',
                                  fontSize: '0.86rem',
                                  color: '#881337',
                                  lineHeight: 1.4
                                }}
                              >
                                <i className="fa-solid fa-shield-halved" style={{ marginTop: 2, color: '#e11d48' }}></i>
                                <span>{inst}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
                          const isAdvPaid = payout.payoutStatus === 'Advance Paid' || payout.payoutStatus === 'Fully Paid' || !!payout.advancePaidAt
                          const isFullPaid = payout.payoutStatus === 'Fully Paid' || !!payout.fullyPaidAt

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
                              <td style={{ color: isAdvPaid ? '#10b981' : '#b45309', fontWeight: 600 }}>
                                ₹{Number(payout.advanceAmount || 0).toLocaleString('en-IN')}
                                <span style={{ fontSize: '0.72rem', display: 'block', color: isAdvPaid ? '#15803d' : '#d97706' }}>
                                  {isAdvPaid ? '✓ Received' : '⏳ Pending'}
                                </span>
                              </td>
                              <td style={{ color: isDeclined ? '#64748b' : (isFullPaid ? '#10b981' : '#ef4444'), fontWeight: 600 }}>
                                {isDeclined ? '₹0' : (isFullPaid ? '₹0' : `₹${Number(payout.remainingAmount != null ? payout.remainingAmount : Math.max(0, (payout.totalCost || 0) - (payout.advanceAmount || 0))).toLocaleString('en-IN')}`)}
                                {!isDeclined && (
                                  <span style={{ fontSize: '0.72rem', display: 'block', color: isFullPaid ? '#15803d' : '#d97706' }}>
                                    {isFullPaid ? '✓ Paid' : '⏳ Pending'}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`vdb-pill ${
                                    isDeclined
                                      ? 'declined'
                                      : isFullPaid
                                      ? 'completed'
                                      : 'pending'
                                  }`}
                                  style={isAdvPaid && !isFullPaid && !isDeclined ? { background: '#e0f2fe', color: '#0369a1' } : {}}
                                >
                                  {isDeclined
                                    ? 'Cancelled'
                                    : isFullPaid
                                    ? 'Fully Paid'
                                    : (isAdvPaid ? 'Advance Received' : 'Advance Pending')}
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
              {(() => {
                const modalPayout = selectedTask.currentAllocation?.payout || {}
                const isModalAdvPaid = modalPayout.payoutStatus === 'Advance Paid' || modalPayout.payoutStatus === 'Fully Paid' || !!modalPayout.advancePaidAt
                const isModalFullPaid = modalPayout.payoutStatus === 'Fully Paid' || !!modalPayout.fullyPaidAt
                const isModalDeclined = selectedTask.currentAllocation?.status === 'Declined' || selectedTask.currentAllocation?.status === 'Rejected'
                return (
                  <div className="vdb-task-payout-box" style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                    <div className="vdb-payout-item">
                      <span className="lbl">Total Contract</span>
                      <span className="val highlight">
                        ₹{Number(modalPayout.totalCost || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="vdb-payout-item">
                      <span className="lbl">Advance</span>
                      <span className="val" style={{ color: isModalAdvPaid ? '#10b981' : '#b45309' }}>
                        ₹{Number(modalPayout.advanceAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: isModalAdvPaid ? '#15803d' : '#d97706', fontWeight: 600 }}>
                        {isModalAdvPaid ? '✓ Received' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="vdb-payout-item">
                      <span className="lbl">Remaining</span>
                      <span className="val" style={{ color: isModalFullPaid ? '#10b981' : '#ef4444' }}>
                        ₹{Number(modalPayout.remainingAmount != null ? modalPayout.remainingAmount : Math.max(0, (modalPayout.totalCost || 0) - (modalPayout.advanceAmount || 0))).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: isModalFullPaid ? '#15803d' : '#d97706', fontWeight: 600 }}>
                        {isModalFullPaid ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="vdb-payout-item">
                      <span className="lbl">Payout Status</span>
                      <span className="val" style={{ fontSize: '0.82rem', fontWeight: 700, color: isModalDeclined ? '#64748b' : (isModalFullPaid ? '#10b981' : (isModalAdvPaid ? '#0284c7' : '#b45309')) }}>
                        {isModalDeclined ? 'Cancelled' : (isModalFullPaid ? 'Fully Paid' : (isModalAdvPaid ? 'Advance Received' : 'Advance Pending'))}
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="vdb-modal-footer">
              {selectedTask.currentAllocation?.status === 'Pending' && (
                <>
                  <button
                    className="vdb-btn vdb-btn-accept"
                    onClick={() => {
                      const promptKey = selectedTask._adminTaskId || selectedTask.currentAllocation.allocationId || selectedTask.id
                      setAcceptPromptId(promptKey)
                      const modalPayout = selectedTask.currentAllocation?.payout || {}
                      setAcceptTotalAmount(modalPayout.totalCost ? String(modalPayout.totalCost) : '')
                      setAcceptAdvanceAmount(modalPayout.advanceAmount ? String(modalPayout.advanceAmount) : '')
                      setAcceptRemainingAmount(modalPayout.remainingAmount != null ? String(modalPayout.remainingAmount) : (modalPayout.totalCost ? String(Math.max(0, (modalPayout.totalCost || 0) - (modalPayout.advanceAmount || 0))) : ''))
                      setAcceptDescription('')
                      setSelectedTask(null)
                      setViewMode('cards')
                    }}
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

              {/* Only show AI Checklist button for non-declined/non-rejected tasks */}
              {selectedTask.currentAllocation?.status !== 'Declined' &&
                selectedTask.currentAllocation?.status !== 'Rejected' && (
                  <button
                    className="vdb-btn"
                    onClick={() => {
                      setAiSelectedBookingId(selectedTask.id)
                      setSelectedTask(null)
                      setActiveTab('ai-tasks')
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Open AI Checklist
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
