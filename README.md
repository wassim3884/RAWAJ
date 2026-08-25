# رواج (Rawaj) — Single-Vendor Affiliate Lead Platform

A full-stack platform where **you (the admin)** manage the product catalog, and **affiliates** promote your products anywhere online. When an affiliate finds a buyer, they submit the buyer's info through the platform — you call to confirm, and handle payment on delivery (COD). Built with React/Next.js, Tailwind CSS, Node/Express, and PostgreSQL.

## How it works

1. **Admin adds products** — title, price, commission %, stock, images. Products go live immediately (no multi-vendor moderation queue).
2. **Affiliate browses the catalog**, requests approval to promote a product, and shares it anywhere (social media, WhatsApp, etc.) using their own words/photos — there's no public storefront checkout in this model.
3. **Affiliate finds a buyer** and comes back to the platform to **submit an order**: buyer's name, phone, wilaya (province), delivery type (home/office), and notes. The platform shows a live price breakdown — **product price + affiliate commission + delivery fee = total the buyer pays on delivery.**
4. **Admin calls the buyer** to confirm the order, then moves it through statuses: `pending → confirmed → processing → shipped → delivered` (or `no_answer` / `cancelled` / `refunded` if it falls through).
5. **Commission is confirmed once the order is marked `delivered`**, moving from the affiliate's pending balance to their withdrawable balance.
6. **Affiliate withdraws** via BaridiMob, Flexy, RedotPay, or bank transfer; admin approves and marks paid.

Only two roles are used day-to-day: **Admin** and **Affiliate**. (`seller` and `customer` remain in the DB's `user_role` enum only for schema flexibility — no registration flow issues them.)

---

## 1. What's fully implemented

| Area | Status |
|---|---|
| JWT auth (affiliate self-registration, admin created via seed) | ✅ Full |
| **Mandatory login + verified email required to see anything** (products, categories, dashboards all gated) | ✅ Full |
| Admin: add/edit/delete products (single-vendor catalog, multi-image, categories) | ✅ Full |
| **Product categories** (clothing, sports, seasonal, etc. — filterable everywhere) | ✅ Full |
| **Manually curated "Most Popular" homepage section** (admin toggles a star per product) | ✅ Full |
| **"Coming Soon" products** — affiliates click "مهتم", admin sees interest count, everyone interested gets notified on launch | ✅ Full |
| **Back-in-stock alerts** — out-of-stock products are never deleted, just relabeled; affiliates subscribe and get notified on restock | ✅ Full |
| **Wishlist ("قائمة الحفظ")** — affiliates save products to promote later | ✅ Full |
| **Ready-made marketing kit per product** — ad titles, ad copy, video/image links, and platform-specific Facebook/Instagram/TikTok posts, admin-managed and affiliate-viewable with one-click copy | ✅ Full |
| Affiliate: browse catalog by category, request approval | ✅ Full |
| **Affiliate lead-order submission**: buyer name/phone/wilaya/notes + live price breakdown (product + commission + delivery) | ✅ Full |
| **Wilaya-based delivery pricing** (58 Algerian provinces seeded, admin-editable home/office rates) | ✅ Full |
| Admin call-confirmation queue (pending → confirmed → processing → shipped → delivered / no_answer / cancelled / refunded) | ✅ Full |
| Commission ledger — confirmed only on `delivered`, cancelled on `cancelled`/`no_answer`/`refunded` | ✅ Full |
| Withdrawals via **BaridiMob, Flexy, RedotPay** — admin approve/reject/pay, balance locking | ✅ Full |
| **VIP program**: unlocks at 30+ delivered orders, admin grants/revokes, VIP-only discounted prices, an independent landing-page storefront per VIP affiliate at `/store/:slug`, and an admin-editable resources hub (best sellers, marketing tips, ready landing images) | ✅ Full |
| **Wholesale catalog** — public searchable page + Telegram channel banner for merchants buying in bulk; admin manages the catalog | ✅ Full |
| **Installable PWA + push notifications** — "Add to Home Screen", push alerts for new orders (admin), commission confirmed (affiliate), new product launched, and restock | ✅ Full |
| Admin: affiliate management, analytics, categories, delivery rates, site settings | ✅ Full |
| Dark/light mode, responsive layout, i18n scaffold (en/fr/ar) with RTL | ✅ Full |

### On the native mobile app request

A true native iOS/Android app that's downloadable from the Play Store isn't something buildable inside this format — it needs native build tooling, signing certificates, and a store review process outside this environment. What's implemented instead is a **PWA (Progressive Web App)**: installable as a home-screen icon from the browser, works like an app, and sends real push notifications via the Web Push API (see `backend/src/utils/push.js` and `frontend/public/sw.js`). If a real native listing is needed later, this same codebase can be wrapped with a tool like Capacitor without rewriting the app.

### Intentionally left as extension points

- **Blog / FAQ / legal pages CMS UI** → `blog_posts`, `faqs` tables exist; reuse `admin.controller.js`'s `site_settings` pattern for simple CRUD routes.
- **Coupons UI** → `coupons` table exists; add an admin CRUD screen like `pages/admin/delivery-rates.js`.
- **Banners UI** → `banners` table exists; same pattern as coupons.
- **SMS notifications** → `notification_channel` enum supports `'sms'`; the push infrastructure (`utils/push.js`) is a template for wiring in an SMS gateway alongside it.

---

## 2. Architecture

```
rawaj-platform/
├── backend/                  Express REST API
│   └── src/
│       ├── config/db.js      PostgreSQL connection pool
│       ├── middleware/       auth.js (JWT), roleCheck.js (RBAC), validate.js
│       ├── controllers/      business logic — auth, product, affiliate, order, wilaya, withdrawal, admin
│       ├── routes/           thin route → controller wiring
│       ├── utils/            jwt.js, email.js, commission.js
│       └── db/               schema.sql, seed.js, migrate.js
│
└── frontend/                 Next.js app (pages router)
    ├── pages/
    │   ├── index.js           Home
    │   ├── login.js / register.js   (affiliate self-registration)
    │   ├── products/[slug].js Product detail
    │   ├── affiliate/          Dashboard, browse, links, submit-order, orders, earnings
    │   └── admin/               Dashboard, products, orders (call queue), delivery-rates, users, settings
    ├── components/            Navbar, Footer, ProductCard, DashboardSidebar
    ├── context/               AuthContext, ThemeContext
    └── lib/api.js             Axios client w/ auto token refresh
```

**Why this structure:** controllers hold all business logic and are framework-agnostic-ish (easy to unit test); routes are declarative and only wire middleware + controller; the DB access layer is a thin `pg` wrapper rather than a heavy ORM, which keeps the SQL — and therefore the commission-calculation correctness — fully visible and auditable.

---

## 3. Affiliate flow, explained

1. Affiliate requests to promote a product → `affiliate_product_requests`.
2. On approval, `ensureAffiliateLink()` generates a unique `short_code` → `affiliate_links`. Useful for tracking clicks if the affiliate shares a direct link; it's optional if they only share photos/screenshots and take orders manually.
3. Anyone visiting `GET /r/:shortCode`: a click is logged (`link_clicks`), an attribution cookie is set, and the visitor is redirected to the product page — same as a normal affiliate link, kept for affiliates who do share trackable links.
4. **When the affiliate has a real buyer**, they go to **Submit Order** in their dashboard and enter: product, buyer name, buyer phone, wilaya, delivery type (home/office), and notes. The page shows a live breakdown:
   `final_total = product.price + (product.price × commission_percent / 100) + wilaya.delivery_fee`
   This is exactly what the affiliate should quote the buyer before submitting.
5. The order is created with `order_status = 'pending'` and a `commissions` row with `status = 'pending'`, added to the affiliate's `pending_balance`.
6. **Admin calls the buyer** from the Orders queue (`/admin/orders`) and updates the status:
   - `confirmed` → stock is decremented (reserved) only at this point, not before — so unanswered leads never lock up inventory.
   - `no_answer` / `cancelled` / `refunded` → the pending commission is cancelled, nothing is paid.
   - `delivered` → the commission is confirmed and moved from `pending_balance` to the affiliate's spendable `balance`.
7. Affiliate withdraws from `balance` via `/api/withdrawals` (BaridiMob / Flexy / RedotPay / bank transfer); admin approves/rejects/marks paid.

---

## 4. Wilaya delivery pricing

Algeria's 58 wilayas are seeded with placeholder rates (`600` home / `400` office in `seed.js` — adjust to your real delivery company's pricing). Manage them anytime from **Admin → Delivery Rates**; affiliates see the live rate whenever they open **Submit Order**, so their quotes to buyers are always current.

---

## 5. Getting started

### Backend
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, SMTP, etc.
npm install
createdb rawaj           # or use your existing Postgres instance
npm run migrate           # applies schema.sql
npm run seed               # creates admin user + wilayas + sample categories/testimonials/FAQs
npm run dev                 # http://localhost:5000
```
Default admin login after seeding: `admin@rawaj.com` / `Admin@12345` — **change this immediately in production.**

To enable push notifications, generate VAPID keys and add them to `.env`:
```bash
npx web-push generate-vapid-keys
# paste the output into VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in backend/.env
```
Without these, the platform still works fully — affiliates and admins just won't get push alerts on their installed PWA (dashboard notifications still work regardless).

### Frontend
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
npm run dev                 # http://localhost:3000
```

---

## 6. Key environment variables (backend/.env)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Sign access/refresh tokens — use long random strings in production |
| `CLIENT_URL` | Used for CORS and building email verification / redirect links |
| `AFFILIATE_COOKIE_DAYS` | Attribution window for trackable affiliate links |
| `SMTP_*`, `EMAIL_FROM` | Transactional email (verification, notifications) |

Since payment is COD (collected by your delivery company) and affiliate payouts go through BaridiMob/Flexy/RedotPay/bank transfer rather than a card gateway, no payment-provider API keys are required to run this as-is.

---

## 7. Database schema highlights

See `backend/src/db/schema.sql` for the full DDL. Notable design choices:

- **Single `users` table** with a `role` enum (`admin`, `affiliate` used day-to-day) plus a 1:1 `affiliate_profiles` table for balance/referral-code fields.
- **`wilayas`** holds per-province home/office delivery fees, editable from Admin → Delivery Rates, read by affiliates when quoting buyers.
- **`orders` stores buyer info directly** (name, phone, wilaya, notes) rather than linking to a customer account — buyers never register; the affiliate submits on their behalf.
- **`order_items` stores commission_percent and commission_amount at time of sale** (not a live join to `products`), so historical commissions stay correct even if you later change a product's rate.
- **`commissions` is a separate ledger table** from `order_items` so status transitions (pending → confirmed → paid → cancelled) are auditable independent of the order itself.
- **`link_clicks` is append-only** — never updated — so you can rebuild any analytics window without losing raw data.

---

## 8. Security notes

- Passwords hashed with bcrypt (cost factor 12).
- JWT access tokens are short-lived; refresh tokens rotate via `/api/auth/refresh`.
- `helmet()` and rate limiting are enabled on `/api/auth/*`.
- All money-moving endpoints (`withdrawals`, `order status → delivered`) run inside SQL transactions with `FOR UPDATE` row locks to prevent race conditions (e.g., double-withdrawal of the same balance).
- Role checks (`requireRole`) are enforced server-side on every mutating route — the frontend hiding a button is not treated as security.
- Stock is only decremented once an order is `confirmed` by the admin's call — never at submission time — so a flood of unanswered leads can't lock up inventory.

---

## 9. Suggested next steps

1. Replace the placeholder wilaya delivery fees (seeded at 600/400) with your real delivery company's rates from Admin → Delivery Rates.
2. Add S3/Cloudinary image upload instead of raw image URLs for products.
3. Add integration tests around `order.controller.js` — it's the highest-value file to cover, since a bug there means either double-paying or under-paying affiliates.
4. Add SMS notifications (e.g., via an SMS gateway) to alert the affiliate when their submitted order changes status.
5. Consider adding a "callback requested" reminder queue so leads with `no_answer` get retried instead of silently dropped.
