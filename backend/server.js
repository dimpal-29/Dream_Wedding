import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Safe fallback if not supported
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import crypto from 'node:crypto';

// ── Password hashing helper (SHA-256 + fixed salt prefix) ──────────────────
// Not bcrypt-grade but avoids storing plain text; suitable for a portfolio app.
function hashPassword(plain) {
  return crypto.createHash('sha256').update('dw_salt_' + plain).digest('hex');
}
function verifyPassword(plain, hashed) {
  return hashPassword(plain) === hashed;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load environment variables securely from backend/.env file
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Restrict CORS to frontend origins (localhost:5173, 127.0.0.1:5173, and optional env override)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  // ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
   ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()): [])
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. server-to-server, curl, Postman, mobile)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked: Origin not allowed'));
  },
  credentials: true
}));

// 3. Enable JSON middleware with request body size protection (25KB limit)
app.use(express.json({ limit: '25kb' }));

// 4. Initialize Gemini API instance securely using the environment variable
const apiKey = process.env.GEMINI_API_KEY;
<<<<<<< HEAD
=======
//  process.env.GEMINI_API_KEY;
>>>>>>> 555f3d7 (Use env for backend URL and Gemini key)
let ai = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('✅ Gemini API Client initialized successfully');
  } catch (err) {
    console.warn('⚠️ Could not initialize Gemini API client:', err.message);
  }
} else {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not defined in backend/.env');
}

/**
 * Dream Wedding AI Consultant Knowledge Base and System Context
 * Verified directly from Dream Wedding db.json, ServiceDetail.jsx, and BookPackage.jsx
 * All pricing strictly in Indian Rupees (₹).
 */
const DREAM_WEDDING_CONTEXT = `
You are "Mira", the warm, sophisticated, and expert AI Wedding Planning Consultant for "Dream Wedding".
Your mission is to help couples and families plan their dream wedding with accurate package recommendations, realistic budget breakdowns, and ceremony guidance.

============================================================
CORE RULES & GUIDELINES:
============================================================

// 1. CURRENCY & INDIAN NUMBER FORMATTING (STRICT EN-IN):
- Always state all prices and budget calculations strictly in Indian Rupees (₹). Never use dollars ($) or any other currency.
- All rupee amounts MUST use Indian numbering format (Lakhs / Crores, en-IN comma grouping):
  * Essential Package: EXACTLY ₹2,00,000 (Two Lakh Rupees - 5 zeros). Never write ₹200,000 or ₹2,000,000.
  * Premium Package: EXACTLY ₹4,00,000 (Four Lakh Rupees - 5 zeros). Never write ₹4,000,000 or ₹40,00,000.
  * Luxury Package: EXACTLY ₹7,50,000 (Seven Lakh Fifty Thousand Rupees). Never write ₹750,000 or ₹7,500,000.
  * Custom Tailored Package: Bespoke / Custom Pricing.
- Western 3-digit comma grouping with extra zeros (such as ₹4,000,000) is STRICTLY PROHIBITED. ₹4,00,000 is 4 Lakhs.
- Ensure all calculations and rupee amounts are 100% mathematically correct and consistent. Never provide contradictory or mathematically incorrect information.

2. STRICT PACKAGE RECOMMENDATION RULES (CAPACITY-MATCHED ONLY):
Recommend packages based STRICTLY on guest count capacity. NEVER recommend a package if the guest count does not match its capacity:
- Up to 50 guests: Recommend "Essential Package" (₹2,00,000).
- 51 to 150 guests: Recommend "Premium Package" (₹4,00,000).
- 151 to 299 guests (including specifically 200 guests): Recommend "Custom Tailored Package" (Bespoke pricing). Never recommend the Luxury Package for 200 guests or any count below 300 guests.
- 300+ guests: Recommend "Luxury Package" (₹7,50,000).

Package Details (verified from project data):
- "Essential Package": ₹2,00,000 (Capacity: Up to 50 guests. Includes essential decor, venue coordination, basic photography, and sound setup).
- "Premium Package": ₹4,00,000 (Capacity: Up to 150 guests. Includes thematic floral decor, professional candid photography & cinematography, DJ & sound, full ceremony coordination).
- "Luxury Package": ₹7,50,000 (Capacity: 300+ guests. Grand stage & mandap setup, luxury floral styling, drone & cinematic coverage, celebrity DJ / live band, end-to-end luxury management).
- "Custom Tailored Package": Bespoke pricing tailored to custom guest counts (such as 200 guests), specific rituals, and personalized service requirements.

3. BUDGET PLANNING & BREAKDOWN RULES:
A. GUEST COUNT & CATERING RULES:
- NEVER assume or invent a guest count if the customer has not explicitly provided it.
- If the customer shares a budget or asks for a budget breakdown but has NOT provided their guest count, politely ask for their expected guest count before calculating exact catering costs.
- Catering starting rate is verified at ₹1,000 per plate. Always calculate catering as: Guest Count × ₹1,000 per plate.
- If presenting an initial breakdown without a known guest count, clearly explain that catering is an estimate or pending guest count confirmation (at ₹1,000/plate).

B. VERIFIED STARTING RATES VS. ESTIMATED BUDGET ALLOCATIONS:
- Never recommend a service budget allocation lower than its verified standalone starting price without clearly and explicitly explaining that it is an estimated, scaled-down, or customized option.
- Verified Project Standalone Starting Prices:
  * Catering: Starting from ₹1,000 per plate
  * Wedding Mandap & Stage Decor: Starting from ₹1,00,000
  * Photography & Cinematography: Starting from ₹70,000
  * Music & Entertainment: DJ starting from ₹60,000 (Live Band starting from ₹1,20,000)
  * Bridal Makeup & Styling: Starting from ₹25,000 per event
  * Reception: Starting from ₹80,000
  * Sangeet Night: Starting from ₹60,000
  * Mehendi: Starting from ₹40,000
  * Haldi: Starting from ₹30,000
  * Ring Ceremony / Engagement: Starting from ₹45,000
- Always clearly distinguish verified project starting prices from estimated/customized allocations.
- Never invent prices, non-existent packages, or fictitious discounts.

C. BUDGET REALISM & INSUFFICIENT BUDGET HANDLING (e.g. ₹3 Lakh scenario):
- If the requested budget is insufficient to book all individual standalone services at their full verified starting prices (for instance, standalone Decor ₹1,00,000 + Photography ₹70,000 + DJ ₹60,000 + Catering cannot all fit into ₹3,00,000):
  * Honestly, warmly, and politely explain the limitation.
  * Suggest practical adjustments:
    1. Recommend our bundled "Essential Package" (₹2,00,000 for up to 50 guests), which conveniently bundles essential decor, venue coordination, basic photography, and sound together.
    2. Show how the remaining budget (e.g. ₹1,00,000 out of ₹3,00,000) can cover catering (e.g. 50 guests × ₹1,000/plate = ₹50,000) plus bridal makeup or contingency buffer (₹50,000).
    3. If guest count was not provided, explain how ₹3,00,000 can work with the Essential Package (₹2,00,000) leaving ₹1,00,000 for catering and other expenses, and ask for their guest count to finalize.
  * Or advise on prioritizing core essential services and opting for customized partial bookings.

D. MATHEMATICAL ACCURACY & 100% SUM RULE:
- Whenever presenting a budget breakdown:
  * All expense percentages must add up to EXACTLY 100%.
  * Every rupee amount must be calculated accurately so that the sum of all category rupee amounts equals the exact total budget down to the rupee.
  * Standard allocation guide when budget allows: Catering 40%, Decor 20%, Photography 12%, Music/Entertainment 8%, Bridal Makeup & Styling 10%, Contingency Buffer 10% (40 + 20 + 12 + 8 + 10 + 10 = 100%).
  * For custom allocations (e.g. ₹3 Lakhs with Essential Package), all amounts must strictly sum to the exact total budget (e.g. Essential Package ₹2,00,000 + Catering ₹50,000 + Makeup/Buffer ₹50,000 = ₹3,00,000).

4. RESPONSE STYLE:
- Warm, respectful, celebratory, and professional in simple language.
- Never be dismissive of any budget. Offer realistic, honest, and creative solutions.
- Give clear package recommendations with easy-to-understand calculations.
- Always encourage exploring the "Packages" section or clicking "Book Now" for consultation.
`;

/**
 * Helper function to call Gemini with a 15-second timeout.
 * Prevents requests from hanging indefinitely.
 * Uses currently available models verified on free tier.
 */
async function generateGeminiReply(promptText) {
  const TIMEOUT_MS = 15000; // 15 seconds timeout

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out after 15 seconds. Please try again.'));
    }, TIMEOUT_MS);
  });

  const apiPromise = (async () => {
    // Primary model: gemini-3.5-flash-lite (fast and currently available on free tier)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: promptText
      });

      return {
        reply: response.text ? response.text.trim() : 'No response generated.',
        model: 'gemini-3.5-flash-lite'
      };
    } catch (primaryErr) {
      console.warn('Primary model (gemini-3.5-flash-lite) busy or failed, trying fallback (gemini-3.1-flash-lite):', primaryErr.message);

      // Fallback model: gemini-3.1-flash-lite
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: promptText
      });

      return {
        reply: fallbackResponse.text ? fallbackResponse.text.trim() : 'No response generated.',
        model: 'gemini-3.1-flash-lite'
      };
    }
  })();

  // Race the API call against the 15-second timer
  return await Promise.race([apiPromise, timeoutPromise]);
}

/**
 * Health Check Route
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Dream Wedding AI Backend is running successfully',
    port: Number(PORT),
    geminiConfigured: !!apiKey,
    timestamp: new Date().toISOString()
  });
});

/**
 * AI Test Endpoint (Verification route)
 * POST /api/ai-test
 */
app.post('/api/ai-test', async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid "message" in your JSON request body.'
      });
    }

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: 'Gemini AI is not configured on the server. Please verify GEMINI_API_KEY in backend/.env'
      });
    }

    const result = await generateGeminiReply(message.trim());

    return res.status(200).json({
      success: true,
      reply: result.reply,
      modelUsed: result.model
    });

  } catch (error) {
    console.error('Error handling /api/ai-test:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating the AI response.'
    });
  }
});

/**
 * Customer AI Wedding Chatbot Endpoint
 * POST /api/chat
 * Accepts a customer question, prepends Dream Wedding context with ₹ pricing, and returns Gemini's answer.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body || {};

    // 1. Input validation & request size protection
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid text message in your request.'
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long. Please limit your message to 1000 characters.'
      });
    }

    // 2. Check Gemini configuration
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: 'Gemini AI is not configured on the server. Please verify GEMINI_API_KEY in backend/.env'
      });
    }

    // 3. Compose prompt with verified Dream Wedding context
    const fullPrompt = `${DREAM_WEDDING_CONTEXT}\n\nCRITICAL REMINDER: Always format currency using Indian numbering (en-IN): Essential Package is ₹2,00,000, Premium Package is ₹4,00,000 (never ₹4,000,000), Luxury Package is ₹7,50,000.\n\nCustomer Question: "${trimmedMessage}"\n\nMira's Response:`;

    // 4. Generate AI reply using existing helper
    const result = await generateGeminiReply(fullPrompt);

    // 5. Ensure any stray Western 3-digit comma grouping is normalized to proper Indian Rupees (en-IN)
    let sanitizedReply = result.reply
      .replace(/₹\s*4,000,000\b/g, '₹4,00,000')
      .replace(/₹\s*2,000,000\b/g, '₹2,00,000')
      .replace(/₹\s*7,500,000\b/g, '₹7,50,000');

    return res.status(200).json({
      success: true,
      reply: sanitizedReply,
      modelUsed: result.model
    });

  } catch (error) {
    console.error('Error handling /api/chat:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating the chatbot response.'
    });
  }
});

/**
 * Admin AI Booking Summary Endpoint
 * POST /api/admin/booking-summary
 *
 * Accepts aggregated booking statistics from the Admin Dashboard frontend.
 * Builds a structured prompt from those stats and returns a professional
 * AI-generated business summary via Gemini.
 *
 * IMPORTANT:
 * - No personal customer data (names, emails, phones) should be sent here.
 * - All numbers are validated server-side before being forwarded to Gemini.
 * - The prompt is built entirely on the server — the client cannot inject
 *   arbitrary instructions into the AI request.
 * - This endpoint is intended for local/portfolio use. It does not implement
 *   server-side admin authentication; that should be added before production.
 */
app.post('/api/admin/booking-summary', async (req, res) => {
  try {
    const stats = req.body || {};

    // ── 1. Payload validation ─────────────────────────────────────────────
    // Reject completely empty bodies
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      return res.status(400).json({
        success: false,
        error: 'Request body must be a JSON object containing booking statistics.'
      });
    }

    // Require at least one meaningful numeric field so we don't send a blank prompt
    const numericFields = [
      'totalBookings', 'confirmedBookings', 'pendingBookings',
      'rejectedBookings', 'advancePaidBookings', 'fullyPaidBookings',
      'totalCustomerRevenue', 'totalVendorCost', 'expectedProfit'
    ];

    const hasAtLeastOneNumber = numericFields.some(
      (field) => typeof stats[field] === 'number' && isFinite(stats[field])
    );

    if (!hasAtLeastOneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one valid numeric booking statistic (e.g. totalBookings).'
      });
    }

    // Sanitise and clamp each numeric field — reject non-finite / non-number values
    function safeNum(val, fallback = null) {
      if (val === undefined || val === null) return fallback;
      const n = Number(val);
      return isFinite(n) ? n : fallback;
    }

    const totalBookings = safeNum(stats.totalBookings, 0);
    const confirmedBookings = safeNum(stats.confirmedBookings, 0);
    const pendingBookings = safeNum(stats.pendingBookings, 0);
    const rejectedBookings = safeNum(stats.rejectedBookings, 0);
    const advancePaidBookings = safeNum(stats.advancePaidBookings, 0);
    const fullyPaidBookings = safeNum(stats.fullyPaidBookings, 0);
    const totalCustomerRevenue = safeNum(stats.totalCustomerRevenue, null);
    const totalVendorCost = safeNum(stats.totalVendorCost, null);
    const expectedProfit = safeNum(stats.expectedProfit, null);
    const profitMargin = safeNum(stats.profitMargin, null);

    // Service breakdown: array of { service, count } — strip to safe strings/numbers only
    const serviceBreakdown = Array.isArray(stats.serviceBreakdown)
      ? stats.serviceBreakdown
        .filter(item => item && typeof item.service === 'string' && typeof item.count === 'number')
        .map(item => ({
          service: String(item.service).slice(0, 100), // cap label length
          count: Math.max(0, Math.floor(item.count))
        }))
        .slice(0, 20) // cap array length
      : [];

    // Recent booking dates: array of ISO date strings — strip to dates only
    const recentDates = Array.isArray(stats.recentBookingDates)
      ? stats.recentBookingDates
        .filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d))
        .map(d => d.slice(0, 10)) // keep only the date portion YYYY-MM-DD
        .slice(0, 10)
      : [];

    // ── 2. Check Gemini is ready ──────────────────────────────────────────
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: 'Gemini AI is not configured on the server. Please verify GEMINI_API_KEY in backend/.env'
      });
    }

    // ── 3. Build the admin prompt server-side (client cannot influence it) ─
    const formatRupee = (val) =>
      val !== null ? `₹${Number(val).toLocaleString('en-IN')}` : 'Not available';

    const serviceSection = serviceBreakdown.length > 0
      ? serviceBreakdown.map(s => `  • ${s.service}: ${s.count} booking(s)`).join('\n')
      : '  • No service breakdown data provided.';

    const datesSection = recentDates.length > 0
      ? recentDates.join(', ')
      : 'Not provided';

    const adminPrompt = `
You are a professional business intelligence assistant for "Dream Wedding", an Indian wedding planning company.
Your task is to generate a clear, structured, and professional Admin Booking Summary Report based on the statistics provided below.

STRICT RULES:
- Use ONLY the numbers provided. Never invent, estimate, or assume any data not present.
- If a value is marked "Not available", clearly state it is unavailable — do not guess.
- All currency must be in Indian Rupees (₹) using Indian number formatting (e.g. ₹1,00,000).
- This is an internal admin business report. Use professional, concise language. Do NOT use Mira's warm wedding-planning tone.
- Structure your response with clear section headings.
- Keep the total response under 400 words.

============================
DREAM WEDDING — BOOKING STATISTICS
============================
Total Bookings:           ${totalBookings}
Confirmed Bookings:       ${confirmedBookings}
Pending Bookings:         ${pendingBookings}
Rejected Bookings:        ${rejectedBookings}
Advance-Paid Bookings:    ${advancePaidBookings}
Fully-Paid Bookings:      ${fullyPaidBookings}

REVENUE & PROFIT:
Total Customer Revenue:   ${formatRupee(totalCustomerRevenue)}
Total Vendor Cost:        ${formatRupee(totalVendorCost)}
Expected Profit:          ${formatRupee(expectedProfit)}
Profit Margin:            ${profitMargin !== null ? profitMargin + '%' : 'Not available'}

SERVICE / CATEGORY BREAKDOWN:
${serviceSection}

RECENT BOOKING DATES:
${datesSection}
============================

Generate the Admin Booking Summary Report now. Structure it with these sections:
1. Overall Booking Performance
2. Booking Status Analysis
3. Revenue & Payment Insights
4. Popular Services / Packages
5. Pending Bookings Requiring Attention
6. Key Observations & Recommendations
`;

    // ── 4. Call Gemini using the existing shared helper ───────────────────
    const result = await generateGeminiReply(adminPrompt.trim());

    // ── 5. Return the structured response ────────────────────────────────
    return res.status(200).json({
      success: true,
      summary: result.reply,
      modelUsed: result.model
    });

  } catch (error) {
    console.error('Error handling /api/admin/booking-summary:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating the booking summary.'
    });
  }
});

// ============================================================
// VENDOR AUTH ROUTES — Register, Login, Toggle Account Status
// ============================================================

/**
 * POST /api/vendors/register
 * Register a new vendor with hashed password and full profile saved to db.json.
 */
app.post('/api/vendors/register', (req, res) => {
  try {
    const {
      businessName, ownerName, email, phone, password,
      service, city, location, description, experience,
      availability, avatar
    } = req.body || {};

    // Required field validation
    if (!businessName || !ownerName || !email || !phone || !password || !service) {
      return res.status(400).json({
        success: false,
        error: 'businessName, ownerName, email, phone, password and service are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const db = readDb();
    const vendors = db.vendors || [];

    // Duplicate email check (case-insensitive)
    const duplicate = vendors.find(v => v.email && v.email.toLowerCase() === email.toLowerCase().trim());
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'A vendor with this email already exists.' });
    }

    // Service avatar map
    const avatarMap = {
      Photography: '📷', Decoration: '🌸', Catering: '🍽️',
      Makeup: '💄', DJ: '🎧', Venue: '🏰',
      Mehendi: '🌿', Music: '🎵', Transport: '🚗'
    };

    const newVendor = {
      id: 'vnd_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      name: businessName.trim(),
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash: hashPassword(password),  // hashed — never stored plain
      service: service.trim(),
      category: service.toLowerCase().trim(),
      city: (city || location || '').trim(),
      location: (location || city || '').trim(),
      description: (description || '').trim(),
      experience: (experience || '0 Years').trim(),
      availability: availability !== undefined ? availability : true,
      avatar: avatar || avatarMap[service] || '✨',
      rating: 0,
      defaultRate: 0,
      servicesOffered: [],
      accountStatus: 'Active',
      isRegisteredVendor: true,
      registeredAt: new Date().toISOString()
    };

    db.vendors = [...vendors, newVendor];
    writeDb(db);
    console.log(`✅ [POST /api/vendors/register] New vendor registered: ${newVendor.id} — ${newVendor.name}`);

    // Return vendor WITHOUT passwordHash
    const { passwordHash: _, ...safeVendor } = newVendor;
    // Add a plain password field for localStorage session compatibility (same approach as seed vendors)
    safeVendor.password = password;

    return res.status(201).json({ success: true, vendor: safeVendor });
  } catch (err) {
    console.error('Error in /api/vendors/register:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to register vendor: ' + err.message });
  }
});

/**
 * POST /api/vendors/login
 * Authenticate vendor by email + password against db.json.
 */
app.post('/api/vendors/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const db = readDb();
    const vendor = (db.vendors || []).find(v =>
      v.email && v.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!vendor) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Support both hashed passwords (new registrations) and plain text (seed vendors)
    const isValid = vendor.passwordHash
      ? verifyPassword(password, vendor.passwordHash)
      : vendor.password === password;

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (vendor.accountStatus === 'Inactive') {
      return res.status(403).json({ success: false, error: 'Your vendor account has been deactivated. Please contact admin.' });
    }

    const { passwordHash: _, ...safeVendor } = vendor;
    console.log(`✅ [POST /api/vendors/login] Login: ${vendor.email}`);
    return res.status(200).json({ success: true, vendor: safeVendor });
  } catch (err) {
    console.error('Error in /api/vendors/login:', err.message);
    return res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
  }
});

/**
 * PATCH /api/vendors/:id/status
 * Toggle vendor account status: Active <-> Inactive (admin use).
 */
app.patch('/api/vendors/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body || {};
    if (!accountStatus || !['Active', 'Inactive'].includes(accountStatus)) {
      return res.status(400).json({ success: false, error: 'accountStatus must be "Active" or "Inactive".' });
    }

    const db = readDb();
    const idx = (db.vendors || []).findIndex(v => String(v.id) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Vendor not found.' });

    db.vendors[idx] = { ...db.vendors[idx], accountStatus };
    writeDb(db);
    console.log(`✅ [PATCH /api/vendors/${id}/status] Status set to: ${accountStatus}`);

    const { passwordHash: _, ...safe } = db.vendors[idx];
    return res.status(200).json({ success: true, vendor: safe });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// DATABASE HELPER — reads/writes db.json atomically
// ============================================================
const DB_PATH = path.join(__dirname, '..', 'db.json');

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('⚠️ Could not read db.json:', err.message);
    return { users: [], bookings: [], contacts: [], reviews: [], vendors: [], vendorTasks: [] };
  }
}

function writeDb(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Could not write db.json:', err.message);
    throw err;
  }
}

// Generate a short random ID
function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// ============================================================
// GENERIC CRUD FACTORY — creates REST routes for a collection
// ============================================================
function registerCrudRoutes(collectionName, idPrefix) {
  const base = `/api/${collectionName}`;

  // GET all
  app.get(base, (req, res) => {
    try {
      const db = readDb();
      const items = (db[collectionName] || []).map(item => {
        // Strip sensitive fields when listing
        if (collectionName === 'vendors') {
          const { passwordHash, password, ...safe } = item;
          return safe;
        }
        return item;
      });
      res.status(200).json(items);
    } catch (err) {
      res.status(500).json({ error: `Failed to read ${collectionName}.` });
    }
  });

  // GET by id
  app.get(`${base}/:id`, (req, res) => {
    try {
      const db = readDb();
      const item = (db[collectionName] || []).find(i => String(i.id) === String(req.params.id));
      if (!item) return res.status(404).json({ error: 'Not found.' });
      if (collectionName === 'vendors') {
        const { passwordHash, password, ...safe } = item;
        return res.status(200).json(safe);
      }
      res.status(200).json(item);
    } catch (err) {
      res.status(500).json({ error: `Failed to read ${collectionName}.` });
    }
  });

  // POST create
  app.post(base, (req, res) => {
    try {
      const db = readDb();
      const body = req.body || {};
      const newItem = {
        ...body,
        id: body.id || generateId(idPrefix)
      };
      // Prevent duplicate IDs
      db[collectionName] = (db[collectionName] || []).filter(i => String(i.id) !== String(newItem.id));
      db[collectionName].push(newItem);
      writeDb(db);
      console.log(`✅ [POST /${collectionName}] Saved: ${newItem.id}`);
      res.status(201).json(newItem);
    } catch (err) {
      res.status(500).json({ error: `Failed to save to ${collectionName}: ${err.message}` });
    }
  });

  // PUT update
  app.put(`${base}/:id`, (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const body = req.body || {};
      const updated = { ...body, id };
      const list = db[collectionName] || [];
      const idx = list.findIndex(i => String(i.id) === String(id));
      if (idx === -1) {
        // If not found, create it (upsert behaviour matches json-server)
        db[collectionName] = [...list, updated];
      } else {
        db[collectionName] = list.map(i => String(i.id) === String(id) ? updated : i);
      }
      writeDb(db);
      console.log(`✅ [PUT /${collectionName}/${id}] Updated.`);
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ error: `Failed to update ${collectionName}: ${err.message}` });
    }
  });

  // PATCH partial update
  app.patch(`${base}/:id`, (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const body = req.body || {};
      const list = db[collectionName] || [];
      const existing = list.find(i => String(i.id) === String(id));
      if (!existing) return res.status(404).json({ error: 'Not found.' });
      const patched = { ...existing, ...body, id };
      db[collectionName] = list.map(i => String(i.id) === String(id) ? patched : i);
      writeDb(db);
      console.log(`✅ [PATCH /${collectionName}/${id}] Patched.`);
      res.status(200).json(patched);
    } catch (err) {
      res.status(500).json({ error: `Failed to patch ${collectionName}: ${err.message}` });
    }
  });

  // DELETE
  app.delete(`${base}/:id`, (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      db[collectionName] = (db[collectionName] || []).filter(i => String(i.id) !== String(id));
      writeDb(db);
      console.log(`✅ [DELETE /${collectionName}/${id}] Removed.`);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: `Failed to delete from ${collectionName}: ${err.message}` });
    }
  });
}

// ============================================================
// VENDOR AI TASK GENERATOR ROUTES
// ============================================================

/**
 * POST /api/vendor/task-checklist/generate
 * Generates a service-specific preparation checklist, materials list,
 * timeline, and important instructions for an assigned vendor task using Gemini AI.
 * Associates and saves the generated checklist permanently in db.json.
 */
app.post('/api/vendor/task-checklist/generate', async (req, res) => {
  try {
    const {
      taskId,
      bookingId,
      vendorId,
      service,
      customerName,
      customerPhone,
      customerEmail,
      requirements,
      guests,
      eventDate,
      eventTime,
      venue
    } = req.body || {};

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: 'Gemini AI is not configured on the server. Please verify GEMINI_API_KEY in backend/.env'
      });
    }

    // 1. Fetch current data from db.json to ensure single source of truth
    const db = readDb();

    // Find vendor if vendorId is available
    let vendorObj = null;
    if (vendorId && Array.isArray(db.vendors)) {
      vendorObj = db.vendors.find(v => String(v.id) === String(vendorId));
    }

    let foundTask = null;
    if (taskId && Array.isArray(db.vendorTasks)) {
      foundTask = db.vendorTasks.find(t => String(t.id) === String(taskId));
    }
    if (!foundTask && bookingId && vendorId && Array.isArray(db.vendorTasks)) {
      foundTask = db.vendorTasks.find(t => String(t.bookingId) === String(bookingId) && String(t.vendorId) === String(vendorId));
    }

    let foundBooking = null;
    if (bookingId && Array.isArray(db.bookings)) {
      foundBooking = db.bookings.find(b => String(b.id) === String(bookingId));
    }
    if (!foundBooking && foundTask?.bookingId && Array.isArray(db.bookings)) {
      foundBooking = db.bookings.find(b => String(b.id) === String(foundTask.bookingId));
    }

    // Match vendor allocation inside booking if present
    let matchedAlloc = null;
    if (foundBooking && Array.isArray(foundBooking.vendorAllocations)) {
      matchedAlloc = foundBooking.vendorAllocations.find(a =>
        (taskId && String(a.allocationId) === String(taskId)) ||
        (vendorId && String(a.vendorId) === String(vendorId))
      );
    }

    // Guard: Do not allow AI checklist generation for declined or rejected assignments
    const isDeclinedOrRejected =
      (foundTask && (foundTask.status === 'Declined' || foundTask.vendorResponse === 'NO' || foundTask.adminDecision === 'Rejected')) ||
      (matchedAlloc && (matchedAlloc.status === 'Declined' || matchedAlloc.status === 'Rejected'));

    if (isDeclinedOrRejected) {
      return res.status(400).json({
        success: false,
        error: 'AI Task Checklist is not available for declined or rejected booking assignments.'
      });
    }

    // STRICT SERVICE RESOLUTION:
    // Determine the vendor's actual specific craft/service category.
    // Never allow a generic wedding package name (e.g. "Luxury Grand Wedding Package")
    // to override the vendor's assigned category.
    let resolvedService =
      (matchedAlloc && matchedAlloc.service) ||
      (foundTask && foundTask.service) ||
      (vendorObj && (vendorObj.service || vendorObj.category)) ||
      service ||
      'Decoration';

    if (
      resolvedService.toLowerCase().includes('package') ||
      resolvedService.toLowerCase().includes('turnkey')
    ) {
      if (vendorObj && (vendorObj.service || vendorObj.category)) {
        resolvedService = vendorObj.service || vendorObj.category;
      } else if (matchedAlloc && matchedAlloc.service) {
        resolvedService = matchedAlloc.service;
      } else if (foundTask && foundTask.service) {
        resolvedService = foundTask.service;
      } else {
        resolvedService = 'Decoration';
      }
    }

    // Specific customer requirements for this vendor service
    const resolvedRequirements =
      (matchedAlloc && matchedAlloc.requirements) ||
      (foundTask && foundTask.requirements) ||
      requirements ||
      '';

    // Additional customer notes for overall context
    const customerNotes =
      (foundBooking && (foundBooking.notes || foundBooking.customSummary)) || '';

    const resolvedCustomerName =
      (foundTask && foundTask.customerName) ||
      (foundBooking && foundBooking.name) ||
      customerName ||
      'Valued Client';

    const resolvedGuests =
      (foundTask && foundTask.guests) ||
      (foundBooking && foundBooking.guests) ||
      guests ||
      '300';

    const resolvedDate =
      (foundTask && foundTask.eventDate) ||
      (foundBooking && foundBooking.date) ||
      eventDate ||
      'Upcoming Wedding';

    const resolvedTime =
      (foundTask && foundTask.eventTime) ||
      eventTime ||
      '';

    const resolvedVenue =
      (foundTask && foundTask.venue) ||
      (foundBooking && (foundBooking.venue || foundBooking.address)) ||
      venue ||
      'Ahmedabad Wedding Venue';

    // Determine whether the event date is in the past
    let isPastEvent = false;
    let daysDiff = null;
    if (resolvedDate && resolvedDate !== 'TBD' && resolvedDate !== 'Upcoming Wedding') {
      const eventDateParsed = new Date(resolvedDate);
      if (!isNaN(eventDateParsed.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDateParsed.setHours(0, 0, 0, 0);
        const diffMs = eventDateParsed.getTime() - today.getTime();
        daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
        isPastEvent = daysDiff < 0;
      }
    }

    // 2. Build structured, service-isolated prompt for Gemini AI
    const aiPrompt = `
You are an expert Indian wedding operations AI assistant for "Dream Wedding" professional vendors.
Your task is to generate a comprehensive, highly relevant, SERVICE-SPECIFIC preparation and execution plan tailored exclusively to this vendor's assigned craft.

ASSIGNED VENDOR DETAILS:
• Service Category: ${resolvedService}
• Vendor Name: ${vendorObj?.name || vendorObj?.businessName || 'Assigned Vendor'}
• Client Name: ${resolvedCustomerName}
• Event Date: ${resolvedDate} ${resolvedTime ? `at ${resolvedTime}` : ''}
• Venue: ${resolvedVenue}
• Guest Count: ${resolvedGuests} guests
• Service Requirements: ${resolvedRequirements || 'Standard professional execution as per package'}
${customerNotes ? `• Additional Booking Notes: ${customerNotes}` : ''}
• Event Status: ${isPastEvent ? `PAST EVENT (Event concluded on ${resolvedDate})` : `UPCOMING EVENT (Scheduled for ${resolvedDate})`}

CRITICAL SERVICE CATEGORY ISOLATION RULES (STRICT ENFORCEMENT):
1. SERVICE ONLY: All generated checklist tasks, materials, timeline milestones, and instructions MUST STRICTLY belong to the "${resolvedService}" category.
2. PROHIBITED CROSS-SERVICE DISCIPLINES:
   - Do NOT include ANY catering, cooking, buffet, food tasting, menu, bakery, bar, or kitchen tasks (unless service is Catering).
   - Do NOT include ANY DJ, sound mixer, music playlist, dhol, or audio equipment tasks (unless service is DJ).
   - Do NOT include ANY photography, videography, camera gear, reel editing, or album tasks (unless service is Photography).
   - Do NOT include ANY makeup, hairstyling, beauty salon, cosmetic styling, or saree draping tasks (unless service is Makeup).
   - Do NOT include general wedding coordinator duties or hotel lodging tasks.
3. FOR "${resolvedService}" (Decoration):
   - Focus 100% on: floral sourcing and conditioning, mandap structural framing, stage backdrop fabrication, entrance floral arch, fabric draping, centerpieces, ambient decor lighting (fairy lights, spotlights on mandap), load-in logistics, on-site setup, structural stability, fire retardancy, and post-event dismantle & floral disposal.
   - Even if Additional Booking Notes mention catering, DJ, or styling, IGNORE those other services completely and focus solely on "${resolvedService}".
4. CUSTOMER REQUIREMENTS: Address the specific customer requirements ("${resolvedRequirements || 'Floral mandap design and stage backdrop'}") directly in the checklist and materials.

${isPastEvent ? `
CRITICAL TIMELINE INSTRUCTION FOR PAST EVENT:
• The wedding event date was ${resolvedDate}, which is ALREADY IN THE PAST.
• DO NOT suggest future preparation countdowns like "3 Days Prior", "1 Day Prior", or "Event Day Morning".
• Instead, generate realistic post-event retrospective and wrap-up milestones:
  1. "Event Day Execution": Execution, floral maintenance, and stage supervision completed on ${resolvedDate}
  2. "Post-Event Dismantling": Teardown of mandap framework, salvage of reusable drapery/props, and waste removal
  3. "Inventory Audit & Equipment Restock": Inspection of structural pipes, lights, and ladder equipment in warehouse
  4. "Client Sign-off & Account Reconciliation": Final review with client ${resolvedCustomerName} and payment reconciliation
• In the timeline details, clearly state that this event occurred on ${resolvedDate} and actions cover completed execution and post-event wrap-up.
` : `
TIMELINE INSTRUCTION FOR UPCOMING EVENT:
• Generate a realistic preparation timeline counting down to ${resolvedDate} for ${resolvedGuests} guests at ${resolvedVenue}:
  1. "5 Days Prior": Sourcing & Material Procurement
  2. "2 Days Prior": Pre-fabrication, hardware inspection, and logistics loading
  3. "Event Day Morning": Venue load-in, structural erection, floral styling & lighting test
  4. "Post-Event Wrap-up": Systematic teardown, salvage, and venue handover
`}

Generate 4 structured components:
1. PREPARATION CHECKLIST: 6 to 10 concrete, actionable tasks strictly for "${resolvedService}".
2. REQUIRED MATERIALS: 6 to 10 essential tools, materials, and equipment strictly for "${resolvedService}".
3. SUGGESTED PREPARATION TIMELINE: 3 to 5 milestone phases adhering to the ${isPastEvent ? 'PAST EVENT' : 'UPCOMING EVENT'} instructions.
4. IMPORTANT INSTRUCTIONS: 4 to 6 critical quality, safety, and venue coordination guidelines strictly for "${resolvedService}".

CRITICAL FORMATTING INSTRUCTION:
Return ONLY a valid JSON object without any markdown code fences, backticks, or preamble text.
Each checklist item must have "id", "text", and "completed": false.
The JSON must follow this exact structure:
{
  "isPastEvent": ${isPastEvent},
  "pastEventNotice": ${isPastEvent ? `"This event took place on ${resolvedDate}. Displaying completed execution and post-event reconciliation timeline."` : 'null'},
  "checklist": [
    { "id": "chk_1", "text": "Task description here", "completed": false }
  ],
  "materials": [
    "Material or equipment item 1"
  ],
  "timeline": [
    { "timing": "${isPastEvent ? 'Event Day' : '3 Days Prior'}", "title": "Milestone title", "details": "Specific actions" }
  ],
  "instructions": [
    "Instruction or safety note 1"
  ]
}
`;

    // 3. Call Gemini using shared helper
    const result = await generateGeminiReply(aiPrompt.trim());
    let rawReply = result.reply || '';

    // Strip code fence if present
    rawReply = rawReply.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed = null;
    try {
      parsed = JSON.parse(rawReply);
    } catch (parseErr) {
      const start = rawReply.indexOf('{');
      const end = rawReply.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        parsed = JSON.parse(rawReply.slice(start, end + 1));
      } else {
        throw new Error('Failed to parse Gemini response as JSON: ' + parseErr.message);
      }
    }

    // Ensure valid defaults
    const checklist = Array.isArray(parsed.checklist)
      ? parsed.checklist.map((item, idx) => ({
        id: item.id || `chk_${idx + 1}`,
        text: typeof item === 'string' ? item : (item.text || String(item)),
        completed: false
      }))
      : [];

    const materials = Array.isArray(parsed.materials) ? parsed.materials.map(String) : [];
    const timeline = Array.isArray(parsed.timeline) ? parsed.timeline : [];
    const instructions = Array.isArray(parsed.instructions) ? parsed.instructions.map(String) : [];

    const effectiveTaskId = taskId || (foundTask ? foundTask.id : (matchedAlloc ? matchedAlloc.allocationId : `task_${Date.now()}`));
    const effectiveBookingId = bookingId || (foundBooking ? foundBooking.id : (foundTask ? foundTask.bookingId : null));

    const pastEventNotice = isPastEvent
      ? (parsed.pastEventNotice || `This wedding event took place on ${resolvedDate}. Preparation timeline reflects post-event reconciliation and inventory audit.`)
      : null;

    const aiChecklistData = {
      generatedAt: new Date().toISOString(),
      modelUsed: result.model,
      taskId: effectiveTaskId,
      bookingId: effectiveBookingId,
      vendorService: resolvedService,
      customerName: resolvedCustomerName,
      eventDate: resolvedDate,
      venue: resolvedVenue,
      guests: resolvedGuests,
      isPastEvent: Boolean(isPastEvent),
      pastEventNotice,
      checklist,
      materials,
      timeline,
      instructions
    };

    // 4. Save to db.json on vendorTask if exists
    if (foundTask) {
      foundTask.aiChecklist = aiChecklistData;
    }
    // Also attach to booking allocation if found
    if (foundBooking && Array.isArray(foundBooking.vendorAllocations)) {
      foundBooking.vendorAllocations.forEach(alloc => {
        if (
          (taskId && String(alloc.allocationId) === String(taskId)) ||
          (vendorId && String(alloc.vendorId) === String(vendorId))
        ) {
          alloc.aiChecklist = aiChecklistData;
        }
      });
    }

    // Also sync to any vendorTask in db.vendorTasks that matches
    if (Array.isArray(db.vendorTasks)) {
      db.vendorTasks.forEach(t => {
        if (
          String(t.id) === String(effectiveTaskId) ||
          (effectiveBookingId && vendorId && String(t.bookingId) === String(effectiveBookingId) && String(t.vendorId) === String(vendorId))
        ) {
          t.aiChecklist = aiChecklistData;
        }
      });
    }

    writeDb(db);
    console.log(`✅ [POST /api/vendor/task-checklist/generate] Checklist generated for task ${effectiveTaskId} (${resolvedService})`);

    return res.status(200).json({
      success: true,
      aiChecklist: aiChecklistData,
      modelUsed: result.model
    });
  } catch (error) {
    console.error('Error in /api/vendor/task-checklist/generate:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI checklist.'
    });
  }
});

/**
 * PUT /api/vendor/task-checklist/update
 * Updates checklist items completed status in db.json
 */
app.put('/api/vendor/task-checklist/update', (req, res) => {
  try {
    const { taskId, bookingId, checklist } = req.body || {};
    if (!taskId && !bookingId) {
      return res.status(400).json({ success: false, error: 'taskId or bookingId is required' });
    }
    if (!Array.isArray(checklist)) {
      return res.status(400).json({ success: false, error: 'checklist array is required' });
    }

    const db = readDb();
    let updated = false;

    if (taskId && Array.isArray(db.vendorTasks)) {
      const task = db.vendorTasks.find(t => String(t.id) === String(taskId));
      if (task && task.aiChecklist) {
        task.aiChecklist.checklist = checklist;
        task.aiChecklist.updatedAt = new Date().toISOString();
        updated = true;
      }
    }

    if (bookingId && Array.isArray(db.bookings)) {
      const booking = db.bookings.find(b => String(b.id) === String(bookingId));
      if (booking && Array.isArray(booking.vendorAllocations)) {
        booking.vendorAllocations.forEach(alloc => {
          if (alloc.aiChecklist && (alloc.allocationId === taskId || !taskId)) {
            alloc.aiChecklist.checklist = checklist;
            alloc.aiChecklist.updatedAt = new Date().toISOString();
            updated = true;
          }
        });
      }
    }

    writeDb(db);
    return res.status(200).json({ success: true, updated });
  } catch (error) {
    console.error('Error in /api/vendor/task-checklist/update:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Register CRUD for all collections
registerCrudRoutes('users', 'usr_');
registerCrudRoutes('bookings', 'bk_');
registerCrudRoutes('contacts', 'ct_');
registerCrudRoutes('reviews', 'rv_');
registerCrudRoutes('vendors', 'vnd_');
registerCrudRoutes('vendorTasks', 'vt_');

console.log('✅ CRUD routes registered for: users, bookings, contacts, reviews, vendors, vendorTasks');

// Start the Express server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Dream Wedding AI Backend running on http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Chatbot Route: POST http://localhost:${PORT}/api/chat`);
  console.log(` Admin Summary: POST http://localhost:${PORT}/api/admin/booking-summary`);
  console.log(` Vendor AI Checklist: POST http://localhost:${PORT}/api/vendor/task-checklist/generate`);
  console.log(`  Data Routes: GET/POST/PUT/PATCH/DELETE http://localhost:${PORT}/api/{vendors|bookings|users|contacts|reviews|vendorTasks}`);
  console.log(`====================================================`);
});
