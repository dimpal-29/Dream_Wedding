import axios from 'axios'

const API_BASE_URL = 'https://dream-wedding-zasb.onrender.com';
const API_TIMEOUT = 10000; // 10 seconds for Render free-tier cold starts

export const jsonServer = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' }
})

// Helper function to read/write local fallback storage
function getLocalCollection(name, defaultData = []) {
  try {
    const raw = localStorage.getItem(`dw_${name}`)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading localStorage', e)
  }
  return defaultData
}

function saveLocalCollection(name, items) {
  try {
    localStorage.setItem(`dw_${name}`, JSON.stringify(items))
  } catch (e) {
    console.error('Error writing localStorage', e)
  }
}

export const INITIAL_VENDORS = [
  {
    id: 'vnd_photo_1',
    name: 'Royal Lens Studios',
    businessName: 'Royal Lens Studios',
    ownerName: 'Arjun Verma',
    service: 'Photography',
    category: 'photography',
    contactPerson: 'Arjun Verma',
    email: 'arjun@royallens.com',
    password: 'vendor123',
    phone: '+91 98234 56789',
    city: 'Ahmedabad / Mumbai',
    location: 'Ahmedabad / Mumbai',
    rating: 4.9,
    experience: '8+ Years',
    avatar: '📷',
    defaultRate: 40000,
    servicesOffered: ['Candid Photography', 'Cinematic Wedding Film', 'Drone Shoots', 'Pre-Wedding']
  },
  {
    id: 'vnd_decor_1',
    name: 'Mandap Crafts & Floral Dreams',
    businessName: 'Mandap Crafts & Floral Dreams',
    ownerName: 'Sunita Sharma',
    service: 'Decoration',
    category: 'decoration',
    contactPerson: 'Sunita Sharma',
    email: 'sunita@mandapcrafts.com',
    password: 'vendor123',
    phone: '+91 98765 43210',
    city: 'Ahmedabad / Surat',
    location: 'Ahmedabad / Surat',
    rating: 4.8,
    experience: '10+ Years',
    avatar: '🌸',
    defaultRate: 50000,
    servicesOffered: ['Royal Mandap Decor', 'Floral Entrance', 'Lighting Architecture', 'Theme Stages']
  },
  {
    id: 'vnd_cater_1',
    name: 'Shahi Rasoi Gourmet Caterers',
    businessName: 'Shahi Rasoi Gourmet Caterers',
    ownerName: 'Chef Rajesh Mehra',
    service: 'Catering',
    category: 'catering',
    contactPerson: 'Chef Rajesh Mehra',
    email: 'rajesh@shahirasoi.com',
    password: 'vendor123',
    phone: '+91 98111 22334',
    city: 'Ahmedabad / Vadodara',
    location: 'Ahmedabad / Vadodara',
    rating: 4.9,
    experience: '12+ Years',
    avatar: '🍽️',
    defaultRate: 60000,
    servicesOffered: ['Grand Royal Buffet', 'Multi-Cuisine Counter', 'Live Chaat Stations', 'Artisanal Desserts']
  },
  {
    id: 'vnd_makeup_1',
    name: 'Glamour Touch Bridal Studio',
    businessName: 'Glamour Touch Bridal Studio',
    ownerName: 'Pooja Bhatt',
    service: 'Makeup',
    category: 'makeup',
    contactPerson: 'Pooja Bhatt',
    email: 'pooja@glamourtouch.com',
    password: 'vendor123',
    phone: '+91 97222 33445',
    city: 'Ahmedabad',
    location: 'Ahmedabad',
    rating: 4.9,
    experience: '7+ Years',
    avatar: '💄',
    defaultRate: 25000,
    servicesOffered: ['Bridal HD Makeup', 'Airbrush Styling', 'Hair Couture', 'Saree Draping']
  },
  {
    id: 'vnd_dj_1',
    name: 'DJ Beats & Royal Dhol Tasha',
    businessName: 'DJ Beats & Royal Dhol Tasha',
    ownerName: 'Rohan Joshi',
    service: 'DJ',
    category: 'dj',
    contactPerson: 'Rohan Joshi',
    email: 'rohan@djbeats.com',
    password: 'vendor123',
    phone: '+91 99333 44556',
    city: 'Ahmedabad / Rajkot',
    location: 'Ahmedabad / Rajkot',
    rating: 4.8,
    experience: '6+ Years',
    avatar: '🎧',
    defaultRate: 30000,
    servicesOffered: ['Club DJ & Visuals', 'Punjabi Dhol Troupe', 'LED Truss Setup', 'Sangeet Choreography Sound']
  },
  {
    id: 'vnd_venue_1',
    name: 'Grand Royal Heritage Palace',
    businessName: 'Grand Royal Heritage Palace',
    ownerName: 'Vikram Singh',
    service: 'Venue',
    category: 'venue',
    contactPerson: 'Vikram Singh',
    email: 'vikram@grandheritage.com',
    password: 'vendor123',
    phone: '+91 96444 55667',
    city: 'Udaipur / Ahmedabad',
    location: 'Udaipur / Ahmedabad',
    rating: 5.0,
    experience: '15+ Years',
    avatar: '🏰',
    defaultRate: 100000,
    servicesOffered: ['Lush Banquet Lawns', 'Air-Conditioned Grand Hall', 'Luxury Bridal Suite', 'Guest Lodging']
  },
  {
    id: 'vnd_photo_2',
    name: 'Candid Moments Media',
    businessName: 'Candid Moments Media',
    ownerName: 'Karan Shah',
    service: 'Photography',
    category: 'photography',
    contactPerson: 'Karan Shah',
    email: 'karan@candidmoments.com',
    password: 'vendor123',
    phone: '+91 95555 66778',
    city: 'Ahmedabad',
    location: 'Ahmedabad',
    rating: 4.7,
    experience: '5+ Years',
    avatar: '📸',
    defaultRate: 35000,
    servicesOffered: ['Traditional Photo & Video', 'Teaser Reel Creation', 'Same-Day Highlights']
  },
  {
    id: 'vnd_decor_2',
    name: 'Royal Petals Decorators',
    businessName: 'Royal Petals Decorators',
    ownerName: 'Manish Patel',
    service: 'Decoration',
    category: 'decoration',
    contactPerson: 'Manish Patel',
    email: 'manish@royalpetals.com',
    password: 'vendor123',
    phone: '+91 94444 33221',
    city: 'Ahmedabad',
    location: 'Ahmedabad',
    rating: 4.7,
    experience: '9+ Years',
    avatar: '💐',
    defaultRate: 45000,
    servicesOffered: ['Eco-friendly Marigold Decor', 'Vibrant Haldi/Mehendi Setups', 'Fairy Lights Canopy']
  }
]


// Initial seed data from db.json if not present
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('dw_users')) {
    saveLocalCollection('users', [
      {
        id: 'I7SNrkgdzM8',
        name: 'Dimpal Narkhede',
        email: 'd@gmail.com',
        phone: '9638521478',
        password: '123456'
      }
    ])
  }
  if (!localStorage.getItem('dw_vendors')) {
    saveLocalCollection('vendors', INITIAL_VENDORS)
  } else {
    // Migration: patch existing vendors with missing auth fields (password, businessName, etc.)
    try {
      const existing = JSON.parse(localStorage.getItem('dw_vendors') || '[]')
      const needsMigration = existing.some(v => !v.password || !v.businessName)
      if (needsMigration) {
        const merged = existing.map(v => {
          const seed = INITIAL_VENDORS.find(s => s.id === v.id)
          if (seed) {
            return {
              ...seed,   // base seed fields (includes password, businessName, etc.)
              ...v,      // existing fields override (preserves any custom changes)
              password:     v.password     || seed.password,
              businessName: v.businessName || seed.businessName || v.name,
              ownerName:    v.ownerName    || seed.ownerName    || v.contactPerson,
              location:     v.location     || seed.location     || v.city,
            }
          }
          // Non-seed vendor (custom registered): keep as-is, just ensure businessName
          return {
            ...v,
            businessName: v.businessName || v.name,
            ownerName:    v.ownerName    || v.contactPerson,
          }
        })
        saveLocalCollection('vendors', merged)
      }
    } catch (e) { /* ignore migration errors */ }
  }

  if (!localStorage.getItem('dw_bookings')) {
    saveLocalCollection('bookings', [
      {
        id: '0Pisd1Bq0KM',
        name: 'Dimpal Narkhede',
        email: 'd@gmail.com',
        phone: '9638521478',
        service: 'Cake Arrangement & Photography',
        category: 'ring-ceremony',
        customSummary: 'Event: Ring Ceremony | Venue: Indoor Banquet Hall | Guests: 162',
        eventType: 'Ring Ceremony',
        venue: 'Indoor Banquet Hall',
        budget: '₹1,00,000',
        address: 'Ahmedabad',
        date: '2026-09-23',
        guests: '162',
        notes: 'Grand floral backdrop and continuous event photography required.',
        createdAt: '2026-09-08T06:58:55.459Z',
        bookingStatus: 'confirmed',
        paymentStatus: 'Fully Paid',
        advancePaid: true,
        balancePaid: true,
        paidAmount: '₹1,00,000',
        advanceAmount: '₹50,000',
        balanceAmount: '₹50,000',
        paymentMethod: 'UPI',
        transactionId: 'TXN_DW52403504',
        advanceTxnId: 'TXN_DW52403504',
        balanceTxnId: 'TXN_DW84729112',
        paidAt: '2026-09-08T07:26:45.010Z',
        vendorAllocations: [
          {
            allocationId: 'alloc_demo_1',
            vendorId: 'vnd_photo_1',
            vendorName: 'Royal Lens Studios',
            vendorEmail: 'arjun@royallens.com',
            vendorPhone: '+91 98234 56789',
            service: 'Photography',
            requirements: 'Ring ceremony stage shoot, candid couple portraits, 4K reel delivery within 48 hours.',
            status: 'Accepted',
            assignedAt: '2026-09-08T08:00:00.000Z',
            respondedAt: '2026-09-08T08:30:00.000Z',
            payout: {
              totalCost: 40000,
              advanceAmount: 20000,
              remainingAmount: 20000,
              payoutStatus: 'Advance Paid',
              advancePaidAt: '2026-09-08T10:00:00.000Z',
              advanceTxnId: 'VND_TXN_ADV_98421',
              fullyPaidAt: null,
              balanceTxnId: null
            }
          },
          {
            allocationId: 'alloc_demo_2',
            vendorId: 'vnd_cater_1',
            vendorName: 'Shahi Rasoi Gourmet Caterers',
            vendorEmail: 'rajesh@shahirasoi.com',
            vendorPhone: '+91 98111 22334',
            service: 'Catering',
            requirements: 'Dessert counter, signature cake setup, and high tea snacks for 160 guests.',
            status: 'Pending',
            assignedAt: '2026-09-08T09:15:00.000Z',
            payout: {
              totalCost: 35000,
              advanceAmount: 17500,
              remainingAmount: 17500,
              payoutStatus: 'Pending',
              advancePaidAt: null,
              fullyPaidAt: null
            }
          }
        ]
      },
      {
        id: 'v9OOOLRiW68',
        name: 'Dimpal Narkhede',
        email: 'd@gmail.com',
        phone: '9638521478',
        service: 'Luxury Grand Wedding Package',
        bookingType: 'package',
        category: 'package',
        customSummary: 'Package: Luxury Package | Event: Wedding & Reception | Guests: 300 | Venue: Indoor Grand Hall',
        eventType: 'Wedding & Reception',
        venue: 'Indoor Grand Banquet Hall',
        address: 'Ahmedabad',
        budget: '₹2,50,000',
        date: '2026-10-15',
        guests: '300',
        notes: 'Full turnkey wedding execution. Requires decoration, DJ music, catering, and bridal styling.',
        createdAt: '2026-09-08T06:59:45.240Z',
        bookingStatus: 'confirmed',
        paymentStatus: 'Advance Paid',
        advancePaid: true,
        balancePaid: false,
        paidAmount: '₹1,25,000',
        advanceAmount: '₹1,25,000',
        balanceAmount: '₹1,25,000',
        paymentMethod: 'UPI',
        transactionId: 'TXN_DW58473418',
        advanceTxnId: 'TXN_DW58473418',
        paidAt: '2026-09-08T09:07:54.922Z',
        vendorAllocations: [
          {
            allocationId: 'alloc_demo_3',
            vendorId: 'vnd_decor_1',
            vendorName: 'Mandap Crafts & Floral Dreams',
            vendorEmail: 'sunita@mandapcrafts.com',
            vendorPhone: '+91 98765 43210',
            service: 'Decoration',
            requirements: 'Royal palace mandap theme with pastel exotic flowers, entrance arches, and fairy lights.',
            status: 'Accepted',
            assignedAt: '2026-09-08T10:00:00.000Z',
            respondedAt: '2026-09-08T10:45:00.000Z',
            payout: {
              totalCost: 50000,
              advanceAmount: 25000,
              remainingAmount: 25000,
              payoutStatus: 'Advance Paid',
              advancePaidAt: '2026-09-08T11:00:00.000Z',
              advanceTxnId: 'VND_TXN_ADV_55102'
            }
          }
        ]
      },
      {
        id: 'RtbcW3YBgOQ',
        name: 'Dimpal Narkhede',
        email: 'd@gmail.com',
        phone: '9638521478',
        service: 'Pre-Wedding Shoot & Video',
        eventType: 'Pre-Wedding',
        venue: 'Heritage Resort Lawn',
        budget: '₹80,000',
        address: 'Ahmedabad',
        date: '2026-09-28',
        guests: '50',
        notes: 'Sunset lighting and drone coverage required.',
        createdAt: '2026-09-07T07:19:09.725Z',
        bookingStatus: 'confirmed',
        paymentStatus: 'Advance Paid',
        advancePaid: true,
        balancePaid: false,
        paidAmount: '₹40,000',
        advanceAmount: '₹40,000',
        balanceAmount: '₹40,000',
        paymentMethod: 'UPI',
        transactionId: 'TXN_DW3391028',
        advanceTxnId: 'TXN_DW3391028',
        paidAt: '2026-09-07T08:15:00.000Z',
        vendorAllocations: []
      }
    ])
  }
}

// Reliable API call helper with 10s timeout and detailed error messages
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  }

  try {
    const response = await fetch(url, config)
    clearTimeout(timeoutId)
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`API Error [${options.method || 'GET'} ${endpoint}]: HTTP ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`)
    }
    const text = await response.text()
    return text ? JSON.parse(text) : {}
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Users API: Render API as primary source of truth, localStorage as resilient cache/fallback
export const usersApi = {
  getAll: async () => {
    try {
      const data = await apiCall('/users')
      if (Array.isArray(data)) {
        saveLocalCollection('users', data)
        return data
      }
    } catch (err) {
      console.error('API Error [GET /users] - falling back to local storage cache:', err)
    }
    return getLocalCollection('users')
  },
  getById: async (id) => {
    try {
      const data = await apiCall(`/users/${id}`)
      if (data && data.id) return data
    } catch (err) {
      console.error(`API Error [GET /users/${id}] - falling back to local storage cache:`, err)
    }
    const list = getLocalCollection('users')
    return list.find(u => String(u.id) === String(id)) || null
  },
  create: async (user) => {
    const newUser = {
      ...user,
      id: user.id || 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6)
    }
    let saved = newUser
    try {
      saved = await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      })
    } catch (err) {
      console.error('API Error [POST /users] - saving to local cache fallback:', err)
    }
    const result = saved || newUser
    const list = getLocalCollection('users')
    saveLocalCollection('users', [...list.filter(u => String(u.id) !== String(result.id)), result])
    return result
  },
  update: async (id, user) => {
    const updated = { ...user, id }
    let saved = updated
    try {
      saved = await apiCall(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error(`API Error [PUT /users/${id}] - updating local cache fallback:`, err)
    }
    const result = saved || updated
    const list = getLocalCollection('users')
    saveLocalCollection('users', list.map(u => String(u.id) === String(id) ? result : u))
    return result
  },
  delete: async (id) => {
    try {
      await apiCall(`/users/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(`API Error [DELETE /users/${id}] - removing from local cache fallback:`, err)
    }
    const list = getLocalCollection('users')
    saveLocalCollection('users', list.filter(u => String(u.id) !== String(id)))
    return { success: true }
  },
}

// Bookings API: Render API as primary source of truth, localStorage as resilient cache/fallback
export const bookingsApi = {
  getAll: async () => {
    try {
      const data = await apiCall('/bookings')
      if (Array.isArray(data)) {
        saveLocalCollection('bookings', data)
        return data
      }
    } catch (err) {
      console.error('API Error [GET /bookings] - falling back to local storage cache:', err)
    }
    return getLocalCollection('bookings')
  },
  getById: async (id) => {
    try {
      const data = await apiCall(`/bookings/${id}`)
      if (data && data.id) return data
    } catch (err) {
      console.error(`API Error [GET /bookings/${id}] - falling back to local storage cache:`, err)
    }
    const list = getLocalCollection('bookings')
    return list.find(b => String(b.id) === String(id)) || null
  },
  create: async (booking) => {
    const newBooking = {
      ...booking,
      id: booking.id || 'bk_' + Date.now() + Math.random().toString(36).substring(2, 6),
      createdAt: booking.createdAt || new Date().toISOString()
    }
    let saved = newBooking
    try {
      saved = await apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify(newBooking),
      })
    } catch (err) {
      console.error('API Error [POST /bookings] - saving to local cache fallback:', err)
    }
    const result = saved || newBooking
    const list = getLocalCollection('bookings')
    saveLocalCollection('bookings', [...list.filter(b => String(b.id) !== String(result.id)), result])
    return result
  },
  update: async (id, booking) => {
    const updated = { ...booking, id }
    let saved = updated
    try {
      saved = await apiCall(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error(`API Error [PUT /bookings/${id}] - updating local cache fallback:`, err)
    }
    const result = saved || updated
    const list = getLocalCollection('bookings')
    saveLocalCollection('bookings', list.map(b => String(b.id) === String(id) ? result : b))
    return result
  },
  delete: async (id) => {
    try {
      await apiCall(`/bookings/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(`API Error [DELETE /bookings/${id}] - removing from local cache fallback:`, err)
    }
    const list = getLocalCollection('bookings')
    saveLocalCollection('bookings', list.filter(b => String(b.id) !== String(id)))
    return { success: true }
  },
}

// Contacts API: Render API as primary source of truth, localStorage as resilient cache/fallback
export const contactsApi = {
  getAll: async () => {
    try {
      const data = await apiCall('/contacts')
      if (Array.isArray(data)) {
        saveLocalCollection('contacts', data)
        return data
      }
    } catch (err) {
      console.error('API Error [GET /contacts] - falling back to local storage cache:', err)
    }
    return getLocalCollection('contacts')
  },
  getById: async (id) => {
    try {
      const data = await apiCall(`/contacts/${id}`)
      if (data && data.id) return data
    } catch (err) {
      console.error(`API Error [GET /contacts/${id}] - falling back to local storage cache:`, err)
    }
    const list = getLocalCollection('contacts')
    return list.find(c => String(c.id) === String(id)) || null
  },
  create: async (contact) => {
    const newContact = {
      ...contact,
      id: contact.id || 'ct_' + Date.now() + Math.random().toString(36).substring(2, 6),
      createdAt: contact.createdAt || new Date().toISOString()
    }
    let saved = newContact
    try {
      saved = await apiCall('/contacts', {
        method: 'POST',
        body: JSON.stringify(newContact),
      })
    } catch (err) {
      console.error('API Error [POST /contacts] - saving to local cache fallback:', err)
    }
    const result = saved || newContact
    const list = getLocalCollection('contacts')
    saveLocalCollection('contacts', [...list.filter(c => String(c.id) !== String(result.id)), result])
    return result
  },
  update: async (id, contact) => {
    const updated = { ...contact, id }
    let saved = updated
    try {
      saved = await apiCall(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error(`API Error [PUT /contacts/${id}] - updating local cache fallback:`, err)
    }
    const result = saved || updated
    const list = getLocalCollection('contacts')
    saveLocalCollection('contacts', list.map(c => String(c.id) === String(id) ? result : c))
    return result
  },
  delete: async (id) => {
    try {
      await apiCall(`/contacts/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(`API Error [DELETE /contacts/${id}] - removing from local cache fallback:`, err)
    }
    const list = getLocalCollection('contacts')
    saveLocalCollection('contacts', list.filter(c => String(c.id) !== String(id)))
    return { success: true }
  },
}

// Initial Reviews / Feedbacks
export const INITIAL_REVIEWS = [
  {
    id: 'rv_1',
    name: 'Sarah & Michael',
    email: 'sarah.m@example.com',
    coupleImg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWPfYEum55_klPefJd9j91urbCYvo51j78qQ&s',
    rating: 5,
    text: "Dream Wedding made our day absolutely perfect. The decoration was breathtaking and the team was so professional. We couldn't have asked for more!",
    date: 'June 2024',
    status: 'approved',
    featured: true
  },
  {
    id: 'rv_2',
    name: 'Harsh & Nehal',
    email: 'harsh.nehal@gmail.com',
    coupleImg: 'https://img.weddingbazaar.com/photos/pictures/005/302/747/new_medium/tejas_jagtap_photography_.jpg?1668173568',
    rating: 5,
    text: "From the first consultation to the last dance, everything was flawless. The catering was delicious and our guests are still talking about it. Highly recommend!",
    date: 'August 2024',
    status: 'approved',
    featured: true
  },
  {
    id: 'rv_3',
    name: 'Jessica & Varsha',
    email: 'jessica.varsha@outlook.com',
    coupleImg: 'https://www.azafashions.com/blog/wp-content/uploads/2025/10/featured.jpg',
    rating: 5,
    text: "The photographers captured every moment beautifully. We relive our wedding day every time we look at the photos. Thank you Dream Wedding!",
    date: 'October 2024',
    status: 'approved',
    featured: true
  },
  {
    id: 'rv_4',
    name: 'Pooja & Vikram',
    email: 'pooja.vikram@gmail.com',
    coupleImg: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    rating: 4,
    text: "Great experience overall! The venue setup was magical and stage coordination was prompt. Would definitely recommend them to friends and family.",
    date: 'December 2024',
    status: 'approved',
    featured: false
  },
  {
    id: 'rv_5',
    name: 'Ananya & Rohan',
    email: 'ananya.rohan@gmail.com',
    coupleImg: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
    rating: 5,
    text: "Outstanding planning! They managed every vendor seamlessly and made our sangeet and reception stress-free and unforgettable.",
    date: 'January 2025',
    status: 'pending',
    featured: false
  }
]

// Reviews API: Render API as primary source of truth, localStorage as resilient cache/fallback
export const reviewsApi = {
  getAll: async () => {
    try {
      const data = await apiCall('/reviews')
      if (Array.isArray(data) && data.length > 0) {
        saveLocalCollection('reviews', data)
        return data
      }
      if (Array.isArray(data) && data.length === 0) {
        const local = getLocalCollection('reviews', INITIAL_REVIEWS)
        return local
      }
    } catch (err) {
      console.error('API Error [GET /reviews] - falling back to local storage cache:', err)
    }
    let local = getLocalCollection('reviews')
    if (!local || local.length === 0) {
      saveLocalCollection('reviews', INITIAL_REVIEWS)
      local = INITIAL_REVIEWS
    }
    return local
  },
  getById: async (id) => {
    try {
      const data = await apiCall(`/reviews/${id}`)
      if (data && data.id) return data
    } catch (err) {
      console.error(`API Error [GET /reviews/${id}] - falling back to local storage cache:`, err)
    }
    const list = getLocalCollection('reviews', INITIAL_REVIEWS)
    return list.find(r => String(r.id) === String(id)) || null
  },
  create: async (review) => {
    const newReview = {
      ...review,
      id: review.id || 'rv_' + Date.now() + Math.random().toString(36).substring(2, 6),
      createdAt: review.createdAt || new Date().toISOString()
    }
    let saved = newReview
    try {
      saved = await apiCall('/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
      })
    } catch (err) {
      console.error('API Error [POST /reviews] - saving to local cache fallback:', err)
    }
    const result = saved || newReview
    const list = getLocalCollection('reviews', INITIAL_REVIEWS)
    saveLocalCollection('reviews', [result, ...list.filter(r => String(r.id) !== String(result.id))])
    return result
  },
  update: async (id, review) => {
    const updated = { ...review, id }
    let saved = updated
    try {
      saved = await apiCall(`/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error(`API Error [PUT /reviews/${id}] - updating local cache fallback:`, err)
    }
    const result = saved || updated
    const list = getLocalCollection('reviews', INITIAL_REVIEWS)
    saveLocalCollection('reviews', list.map(r => String(r.id) === String(id) ? result : r))
    return result
  },
  delete: async (id) => {
    try {
      await apiCall(`/reviews/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(`API Error [DELETE /reviews/${id}] - removing from local cache fallback:`, err)
    }
    const list = getLocalCollection('reviews', INITIAL_REVIEWS)
    saveLocalCollection('reviews', list.filter(r => String(r.id) !== String(id)))
    return { success: true }
  },
}

// Vendors API: Render API (/vendors) as primary source of truth, localStorage as resilient cache/fallback
export const vendorsApi = {
  getAll: async () => {
    try {
      const data = await apiCall('/vendors')
      if (Array.isArray(data) && data.length > 0) {
        saveLocalCollection('vendors', data)
        return data
      }
    } catch (err) {
      console.error('API Error [GET /vendors] - falling back to local storage cache:', err)
    }
    let local = getLocalCollection('vendors')
    if (!local || local.length === 0) {
      saveLocalCollection('vendors', INITIAL_VENDORS)
      local = INITIAL_VENDORS
    }
    return local
  },
  getById: async (id) => {
    try {
      const data = await apiCall(`/vendors/${id}`)
      if (data && data.id) return data
    } catch (err) {
      console.error(`API Error [GET /vendors/${id}] - checking local storage cache:`, err)
    }
    const list = await vendorsApi.getAll()
    return list.find(v => String(v.id) === String(id)) || null
  },
  create: async (vendor) => {
    const newVendor = {
      ...vendor,
      id: vendor.id || 'vnd_' + Date.now() + Math.random().toString(36).substring(2, 6)
    }
    let saved = newVendor
    try {
      saved = await apiCall('/vendors', {
        method: 'POST',
        body: JSON.stringify(newVendor),
      })
    } catch (err) {
      console.error('API Error [POST /vendors] - saving to local storage fallback:', err)
    }
    const result = saved || newVendor
    const list = getLocalCollection('vendors')
    saveLocalCollection('vendors', [...list.filter(v => String(v.id) !== String(result.id)), result])
    return result
  },
  update: async (id, vendor) => {
    const updated = { ...vendor, id }
    let saved = updated
    try {
      saved = await apiCall(`/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error(`API Error [PUT /vendors/${id}] - updating local storage fallback:`, err)
    }
    const result = saved || updated
    const list = getLocalCollection('vendors')
    saveLocalCollection('vendors', list.map(v => String(v.id) === String(id) ? result : v))
    return result
  },
  delete: async (id) => {
    try {
      await apiCall(`/vendors/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(`API Error [DELETE /vendors/${id}] - removing from local storage fallback:`, err)
    }
    const list = getLocalCollection('vendors')
    saveLocalCollection('vendors', list.filter(v => String(v.id) !== String(id)))
    return { success: true }
  }
}

export const VENDOR_TASK_STATUS = {
  PENDING: 'Pending',
  VENDOR_RESPONDED: 'Vendor Responded',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
}

export const INITIAL_VENDOR_TASKS = [
  {
    id: 'vt_demo_1',
    vendorId: 'vnd_photo_1',
    vendorName: 'Royal Lens Studios',
    vendorEmail: 'arjun@royallens.com',
    customerName: 'Dimpal Narkhede',
    customerEmail: 'd@gmail.com',
    customerPhone: '9638521478',
    service: 'Photography',
    eventDate: '2026-09-23',
    eventTime: '18:00',
    venue: 'Indoor Banquet Hall, Ahmedabad',
    guests: '162',
    requirements: 'Ring ceremony stage shoot, candid couple portraits, 4K reel within 48 hours.',
    status: VENDOR_TASK_STATUS.PENDING,
    vendorResponse: null,
    vendorResponseNote: '',
    adminDecision: null,
    assignmentHistory: [],
    createdAt: '2026-09-12T10:00:00.000Z',
    respondedAt: null,
    decidedAt: null
  }
]

if (typeof window !== 'undefined' && !localStorage.getItem('dw_vendorTasks')) {
  saveLocalCollection('vendorTasks', INITIAL_VENDOR_TASKS)
}

// Vendor Tasks API: Render API (/vendorTasks) as primary source of truth, localStorage as resilient cache/fallback
export const vendorTasksApi = {
  getAll: async () => {
    try {
      const data = await apiCall('/vendorTasks')
      if (Array.isArray(data) && data.length > 0) {
        saveLocalCollection('vendorTasks', data)
        return data
      }
    } catch (err) {
      console.error('API Error [GET /vendorTasks] - falling back to local storage cache:', err)
    }
    let local = getLocalCollection('vendorTasks')
    if (!local || local.length === 0) {
      saveLocalCollection('vendorTasks', INITIAL_VENDOR_TASKS)
      local = INITIAL_VENDOR_TASKS
    }
    return local
  },
  getById: async (id) => {
    try {
      const data = await apiCall(`/vendorTasks/${id}`)
      if (data && data.id) return data
    } catch (err) {
      console.error(`API Error [GET /vendorTasks/${id}] - checking local storage cache:`, err)
    }
    const list = getLocalCollection('vendorTasks', INITIAL_VENDOR_TASKS)
    return list.find(t => String(t.id) === String(id)) || null
  },
  getByVendorId: async (vendorId) => {
    const list = await vendorTasksApi.getAll()
    return list.filter(t => String(t.vendorId) === String(vendorId))
  },
  create: async (task) => {
    const newTask = {
      ...task,
      id: task.id || 'vt_' + Date.now() + Math.random().toString(36).substring(2, 6),
      createdAt: task.createdAt || new Date().toISOString()
    }
    let saved = newTask
    try {
      saved = await apiCall('/vendorTasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
      })
    } catch (err) {
      console.error('API Error [POST /vendorTasks] - saving to local storage fallback:', err)
    }
    const result = saved || newTask
    const list = getLocalCollection('vendorTasks', INITIAL_VENDOR_TASKS)
    saveLocalCollection('vendorTasks', [...list.filter(t => String(t.id) !== String(result.id)), result])
    return result
  },
  update: async (id, task) => {
    const updated = { ...task, id }
    let saved = updated
    try {
      saved = await apiCall(`/vendorTasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error(`API Error [PUT /vendorTasks/${id}] - updating local storage fallback:`, err)
    }
    const result = saved || updated
    const list = getLocalCollection('vendorTasks', INITIAL_VENDOR_TASKS)
    saveLocalCollection('vendorTasks', list.map(t => String(t.id) === String(id) ? result : t))
    return result
  },
  delete: async (id) => {
    try {
      await apiCall(`/vendorTasks/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(`API Error [DELETE /vendorTasks/${id}] - removing from local storage fallback:`, err)
    }
    const list = getLocalCollection('vendorTasks', INITIAL_VENDOR_TASKS)
    saveLocalCollection('vendorTasks', list.filter(t => String(t.id) !== String(id)))
    return { success: true }
  }
}

// ── Vendor Authentication API ──────────────────────────────────────────────
export const vendorAuthApi = {
  /**
   * Register a new vendor. Saves them to dw_vendors with hashed-style password.
   */
  register: async (vendorData) => {
    const list = await vendorsApi.getAll()
    // Check for duplicate email
    const existing = list.find(v => v.email && v.email.toLowerCase() === vendorData.email.toLowerCase())
    if (existing) {
      throw new Error('A vendor with this email already exists.')
    }
    const newVendor = {
      id: 'vnd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: vendorData.businessName || vendorData.name,
      businessName: vendorData.businessName,
      ownerName: vendorData.ownerName,
      email: vendorData.email.toLowerCase().trim(),
      phone: vendorData.phone,
      password: vendorData.password, // stored plain for localStorage approach (same as usersApi)
      service: vendorData.service,
      category: (vendorData.service || '').toLowerCase(),
      city: vendorData.city || vendorData.location || '',
      location: vendorData.location || vendorData.city || '',
      avatar: vendorData.avatar || getServiceAvatar(vendorData.service),
      rating: 0,
      experience: '0 Years',
      defaultRate: 0,
      servicesOffered: [],
      registeredAt: new Date().toISOString(),
      isRegisteredVendor: true
    }
    await vendorsApi.create(newVendor)
    return newVendor
  },

  /**
   * Login a vendor by email and password.
   */
  login: async (email, password) => {
    const list = await vendorsApi.getAll()
    const vendor = list.find(
      v => v.email && v.email.toLowerCase() === email.toLowerCase().trim() && v.password === password
    )
    if (!vendor) {
      throw new Error('Invalid email or password.')
    }
    localStorage.setItem('dw_vendor_loggedIn', 'true')
    localStorage.setItem('dw_vendor_session', JSON.stringify(vendor))
    return vendor
  },

  /**
   * Logout the currently logged-in vendor.
   */
  logout: () => {
    localStorage.removeItem('dw_vendor_loggedIn')
    localStorage.removeItem('dw_vendor_session')
  },

  /**
   * Get the currently logged-in vendor from session.
   */
  getLoggedInVendor: () => {
    try {
      const raw = localStorage.getItem('dw_vendor_session')
      if (raw) return JSON.parse(raw)
    } catch (e) { /* ignore */ }
    return null
  },

  /**
   * Check if a vendor is currently logged in.
   */
  isLoggedIn: () => {
    return localStorage.getItem('dw_vendor_loggedIn') === 'true'
  },

  /**
   * Refresh session from localStorage (in case vendor data was updated).
   */
  refreshSession: async () => {
    const session = vendorAuthApi.getLoggedInVendor()
    if (!session) return null
    const fresh = await vendorsApi.getById(session.id)
    if (fresh) {
      localStorage.setItem('dw_vendor_session', JSON.stringify(fresh))
      return fresh
    }
    return session
  }
}

function getServiceAvatar(service) {
  const map = {
    Photography: '📷', Decoration: '🌸', Catering: '🍽️',
    Makeup: '💄', DJ: '🎧', Venue: '🏰',
    Mehendi: '🌿', Music: '🎵', Transport: '🚗'
  }
  return map[service] || '✨'
}

// Helpers for vendor allocation and profit calculation
export function parseRupeeAmount(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  const cleaned = String(val).replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export function getCustomerRevenue(booking) {
  if (!booking) return 0
  if (booking.customerRevenue) return Number(booking.customerRevenue)
  if (booking.paidAmount) {
    const amt = parseRupeeAmount(booking.paidAmount)
    if (amt > 0) return amt
  }
  const adv = parseRupeeAmount(booking.advanceAmount)
  const bal = parseRupeeAmount(booking.balanceAmount)
  if (adv + bal > 0) return adv + bal
  if (adv > 0) return adv * 2

  if (booking.budget) {
    const b = String(booking.budget).toLowerCase()
    if (b.includes('under 1 lakh')) return 80000
    if (b.includes('1-3 lakh') || b.includes('1-3')) return 200000
    if (b.includes('3-5 lakh') || b.includes('3-5')) return 400000
    if (b.includes('5-10 lakh') || b.includes('5-10')) return 750000
    if (b.includes('10+ lakh') || b.includes('10+')) return 1200000
    const parsed = parseRupeeAmount(booking.budget)
    if (parsed > 0) return parsed
  }
  return 100000
}

export function getBookingVendorCost(booking) {
  if (!booking || !Array.isArray(booking.vendorAllocations)) return 0
  return booking.vendorAllocations.reduce((acc, alloc) => {
    const cost = alloc.payout?.totalCost || 0
    return acc + Number(cost)
  }, 0)
}

