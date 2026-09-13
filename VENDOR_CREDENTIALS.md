# Dream Wedding — Vendor Login Credentials

Yeh file un sabhi vendors ki login details (email + password) list karti hai jo
project ke saath pre-registered hain (`src/services/api.js` → `INITIAL_VENDORS`),
taaki testing ke liye Vendor Portal (`/vendor/login`) mein login kiya ja sake.

> Vendor login yahan se hota hai: **`/vendor/login`**
> Naya vendor khud register kar sakta hai: **`/vendor/register`**
> (Registration ke waqt entered gaya email/password hi uska login hoga —
> woh yahan is file mein automatically add nahi hota.)

## Pre-Registered (Seed) Vendors

| # | Business Name | Service | Vendor ID | Email | Password |
|---|----------------|--------------|----------------|--------------------------------|------------|
| 1 | Royal Lens Studios | Photography | `vnd_photo_1` | arjun@royallens.com | vendor123 |
| 2 | Mandap Crafts & Floral Dreams | Decoration | `vnd_decor_1` | sunita@mandapcrafts.com | vendor123 |
| 3 | Shahi Rasoi Gourmet Caterers | Catering | `vnd_cater_1` | rajesh@shahirasoi.com | vendor123 |
| 4 | Glamour Touch Bridal Studio | Makeup | `vnd_makeup_1` | pooja@glamourtouch.com | vendor123 |
| 5 | DJ Beats & Royal Dhol Tasha | DJ | `vnd_dj_1` | rohan@djbeats.com | vendor123 |
| 6 | Grand Royal Heritage Palace | Venue | `vnd_venue_1` | vikram@grandheritage.com | vendor123 |
| 7 | Candid Moments Media | Photography | `vnd_photo_2` | karan@candidmoments.com | vendor123 |
| 8 | Royal Petals Decorators | Decoration | `vnd_decor_2` | manish@royalpetals.com | vendor123 |

**Admin login (for reference):**
- URL: `/admin`
- Email: `admin@dreamwedding.com`
- Password: `admin123`

## Notes

- Yeh sab vendors first app-load par automatically `localStorage` (key: `dw_vendors`)
  mein seed ho jaate hain — koi extra setup nahi chahiye.
- Agar koi naya vendor `/vendor/register` se sign up karta hai, uska record bhi
  isi `dw_vendors` list mein add ho jaata hai with a unique auto-generated
  `vendorId` (format: `vnd_<timestamp>_<random>`), aur uska email/password
  wahi hoga jo usne registration form mein bhara tha.
- Agar browser ka `localStorage` clear kar diya jaaye, toh yeh 8 seed vendors
  dobara automatically restore ho jaate hain (from `INITIAL_VENDORS` in
  `src/services/api.js`), lekin koi bhi naya self-registered vendor localStorage
  clear hone par delete ho jaayega (kyunki yeh sirf browser mein store hota hai).
