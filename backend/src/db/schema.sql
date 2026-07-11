-- ============================================================
-- RAWAJ AFFILIATE MARKETING PLATFORM — POSTGRESQL SCHEMA
-- ============================================================

-- NOTE ON ROLES: this platform is single-vendor. Only the admin (store owner)
-- creates and manages products. 'seller' is kept in the enum only for schema
-- compatibility; no registration flow issues it anymore (see products.routes.js).
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'affiliate', 'customer');
CREATE TYPE product_status AS ENUM ('draft', 'pending', 'active', 'rejected', 'out_of_stock', 'coming_soon');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Lead-order lifecycle:
--   pending    -> affiliate just submitted the lead, awaiting admin's confirmation call
--   confirmed  -> admin called the buyer and confirmed the order
--   no_answer  -> admin could not reach the buyer (retry later)
--   processing -> order is being prepared for shipment
--   shipped    -> handed to the delivery company
--   delivered  -> delivered & collected (COD) — this confirms the affiliate's commission
--   cancelled  -> buyer declined / order cancelled
--   refunded   -> returned after delivery
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'no_answer', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('cod', 'baridimob', 'flexy', 'redotpay', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'failed', 'refunded');
-- Withdrawal lifecycle (shown to affiliates in plain language):
--   pending       -> في الانتظار: just submitted, not yet looked at
--   under_review  -> يتم التحقق: admin is verifying the payout details
--   approved      -> مؤكدة/جاهزة: confirmed, will be paid within 48 hours
--   paid          -> المدفوعة: money sent
--   rejected      -> رُفض الطلب (balance is refunded automatically)
CREATE TYPE withdrawal_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'paid');
CREATE TYPE commission_status AS ENUM ('pending', 'confirmed', 'paid', 'cancelled');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'dashboard');
CREATE TYPE delivery_type AS ENUM ('home', 'office'); -- توصيل للمنزل أو للمكتب (stopdesk)

-- ---------------------------------------------------------
-- USERS (admin, seller, affiliate, customer all live here)
-- ---------------------------------------------------------
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    full_name           VARCHAR(150) NOT NULL,
    email               VARCHAR(150) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    role                user_role NOT NULL DEFAULT 'customer',
    phone               VARCHAR(30),
    avatar_url          TEXT,
    language            VARCHAR(5) DEFAULT 'en',   -- en | fr | ar
    is_email_verified   BOOLEAN DEFAULT FALSE,
    email_verify_token  VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Extra profile info per role (1-1 tables keep `users` lean)
CREATE TABLE seller_profiles (
    user_id             BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    store_name          VARCHAR(150) NOT NULL,
    store_slug          VARCHAR(160) UNIQUE NOT NULL,
    store_description   TEXT,
    store_logo_url      TEXT,
    business_address    TEXT,
    tax_id              VARCHAR(50),
    is_verified         BOOLEAN DEFAULT FALSE,
    balance             NUMERIC(12,2) DEFAULT 0,      -- available for withdrawal
    total_earnings      NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE affiliate_profiles (
    user_id             BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    referral_code       VARCHAR(20) UNIQUE NOT NULL,   -- e.g. AFF-7K2P9X
    website_url         TEXT,
    social_links        JSONB DEFAULT '{}',
    balance             NUMERIC(12,2) DEFAULT 0,       -- confirmed, unpaid
    pending_balance      NUMERIC(12,2) DEFAULT 0,       -- awaiting order confirmation
    total_earnings      NUMERIC(12,2) DEFAULT 0,
    payout_method       JSONB DEFAULT '{}',             -- baridimob/flexy/redotpay phone or account id
    is_vip              BOOLEAN DEFAULT FALSE,          -- unlocked at 30+ delivered orders, granted by admin
    vip_since           TIMESTAMP
);

-- ---------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------
CREATE TABLE categories (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(120) UNIQUE NOT NULL,
    icon_url            TEXT,
    parent_id           INTEGER REFERENCES categories(id),
    is_active           BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------
-- WILAYAS (Algerian provinces) — delivery pricing reference
-- Affiliates read this table to quote accurate delivery fees
-- to their buyers before submitting a lead order.
-- ---------------------------------------------------------
CREATE TABLE wilayas (
    id                  SERIAL PRIMARY KEY,
    code                VARCHAR(4) UNIQUE,          -- e.g. '16' for Algiers
    name_ar             VARCHAR(100) NOT NULL,
    name_fr             VARCHAR(100) NOT NULL,
    delivery_fee_home   NUMERIC(8,2) NOT NULL DEFAULT 0,  -- توصيل للمنزل
    delivery_fee_office NUMERIC(8,2) NOT NULL DEFAULT 0,  -- توصيل للمكتب (stopdesk)
    is_active           BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------
CREATE TABLE products (
    id                  BIGSERIAL PRIMARY KEY,
    seller_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id         INTEGER REFERENCES categories(id),
    title               VARCHAR(200) NOT NULL,
    slug                VARCHAR(220) UNIQUE NOT NULL,
    description         TEXT,
    price               NUMERIC(10,2) NOT NULL,
    compare_at_price    NUMERIC(10,2),
    commission_percent  NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    stock_quantity      INTEGER NOT NULL DEFAULT 0,
    sku                 VARCHAR(60),
    shipping_info       JSONB DEFAULT '{}',   -- {weight, dimensions, fee, regions}
    status              product_status DEFAULT 'pending',
    requires_approval   BOOLEAN DEFAULT TRUE, -- affiliate must request approval to promote
    is_featured         BOOLEAN DEFAULT FALSE,  -- manually curated "best sellers" shown on homepage
    featured_order      INTEGER DEFAULT 0,      -- lower = shown first among featured products
    vip_price           NUMERIC(10,2),           -- discounted price shown only to VIP affiliates
    views_count         INTEGER DEFAULT 0,
    sales_count         INTEGER DEFAULT 0,
    avg_rating          NUMERIC(2,1) DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url           TEXT NOT NULL,
    sort_order          INTEGER DEFAULT 0,
    is_primary          BOOLEAN DEFAULT FALSE
);

CREATE TABLE product_reviews (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id         BIGINT NOT NULL REFERENCES users(id),
    rating              SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment             TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- AFFILIATE <-> PRODUCT APPROVAL
-- (the old trackable-link system was removed — affiliates submit
-- orders manually via the "Submit Order" form instead of sharing links)
-- ---------------------------------------------------------
CREATE TABLE affiliate_product_requests (
    id                  BIGSERIAL PRIMARY KEY,
    affiliate_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    status              approval_status DEFAULT 'pending',
    requested_at        TIMESTAMP DEFAULT NOW(),
    decided_at          TIMESTAMP,
    UNIQUE (affiliate_id, product_id)
);

CREATE TABLE coupons (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(30) UNIQUE NOT NULL,
    affiliate_id        BIGINT REFERENCES users(id) ON DELETE CASCADE,
    product_id          BIGINT REFERENCES products(id) ON DELETE CASCADE, -- null = store-wide
    discount_percent    NUMERIC(5,2),
    discount_amount     NUMERIC(10,2),
    usage_limit         INTEGER,
    usage_count         INTEGER DEFAULT 0,
    expires_at          TIMESTAMP,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- ORDERS ("leads") — submitted by an affiliate on behalf of a buyer
-- they found on an external platform. The admin calls the buyer to
-- confirm before the order moves forward.
-- ---------------------------------------------------------
CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(30) UNIQUE NOT NULL,

    affiliate_id        BIGINT NOT NULL REFERENCES users(id),

    -- buyer info, entered by the affiliate from their conversation with the customer
    buyer_name          VARCHAR(150) NOT NULL,
    buyer_phone         VARCHAR(30) NOT NULL,
    wilaya_id           INTEGER NOT NULL REFERENCES wilayas(id),
    delivery_type       delivery_type NOT NULL DEFAULT 'home',
    notes               TEXT,

    payment_method      payment_method NOT NULL DEFAULT 'cod',
    payment_status      payment_status DEFAULT 'unpaid',
    order_status        order_status DEFAULT 'pending',

    -- price breakdown — final_total is exactly what the buyer pays
    product_price       NUMERIC(10,2) NOT NULL,
    commission_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee        NUMERIC(8,2) NOT NULL DEFAULT 0,
    final_total         NUMERIC(12,2) NOT NULL,

    admin_call_status   VARCHAR(30),   -- 'answered' | 'no_answer' | 'callback_requested' ...
    failure_reason       TEXT,          -- shown to the affiliate when status is no_answer/cancelled/refunded
    tracking_number     VARCHAR(80),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          BIGINT NOT NULL REFERENCES products(id),
    affiliate_id        BIGINT REFERENCES users(id),
    quantity            INTEGER NOT NULL DEFAULT 1,
    unit_price          NUMERIC(10,2) NOT NULL,
    commission_percent  NUMERIC(5,2) NOT NULL,
    commission_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
    line_total          NUMERIC(12,2) NOT NULL
);

-- Commission ledger — one row per order_item once commission is calculated
CREATE TABLE commissions (
    id                  BIGSERIAL PRIMARY KEY,
    order_item_id       BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    affiliate_id        BIGINT NOT NULL REFERENCES users(id),
    amount              NUMERIC(10,2) NOT NULL,
    status              commission_status DEFAULT 'pending', -- pending until order delivered/confirmed
    created_at          TIMESTAMP DEFAULT NOW(),
    confirmed_at        TIMESTAMP,
    paid_at             TIMESTAMP
);

-- ---------------------------------------------------------
-- WITHDRAWALS (sellers + affiliates)
-- ---------------------------------------------------------
CREATE TABLE withdrawal_requests (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount              NUMERIC(12,2) NOT NULL,
    method              VARCHAR(30) NOT NULL,   -- baridimob | flexy | redotpay
    payout_details      JSONB DEFAULT '{}',
    status              withdrawal_status DEFAULT 'pending',
    admin_note          TEXT,
    requested_at        TIMESTAMP DEFAULT NOW(),
    approved_at         TIMESTAMP,   -- payment is due within 48h of this timestamp
    processed_at        TIMESTAMP    -- set when marked 'paid'
);

-- ---------------------------------------------------------
-- WISHLIST / COMPARISON
-- ---------------------------------------------------------
CREATE TABLE wishlists (
    user_id             BIGINT REFERENCES users(id) ON DELETE CASCADE,
    product_id          BIGINT REFERENCES products(id) ON DELETE CASCADE,
    added_at            TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- ---------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------
CREATE TABLE notifications (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel             notification_channel DEFAULT 'dashboard',
    title               VARCHAR(200) NOT NULL,
    message             TEXT NOT NULL,
    is_read             BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- CMS / SETTINGS (homepage content, banners, blog, static pages)
-- ---------------------------------------------------------
CREATE TABLE site_settings (
    key                 VARCHAR(100) PRIMARY KEY,
    value               JSONB NOT NULL
);

CREATE TABLE banners (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(150),
    image_url           TEXT NOT NULL,
    link_url            TEXT,
    position            VARCHAR(30) DEFAULT 'homepage_hero',
    sort_order          INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE blog_posts (
    id                  BIGSERIAL PRIMARY KEY,
    author_id           BIGINT REFERENCES users(id),
    title               VARCHAR(220) NOT NULL,
    slug                VARCHAR(240) UNIQUE NOT NULL,
    cover_image_url     TEXT,
    content             TEXT NOT NULL,
    is_published        BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE testimonials (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(120) NOT NULL,
    role                VARCHAR(120),
    avatar_url          TEXT,
    quote               TEXT NOT NULL,
    rating              SMALLINT DEFAULT 5,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE faqs (
    id                  SERIAL PRIMARY KEY,
    question            VARCHAR(300) NOT NULL,
    answer              TEXT NOT NULL,
    sort_order          INTEGER DEFAULT 0
);

-- ---------------------------------------------------------
-- VIP STORES — unlocked once an affiliate hits 30+ delivered orders
-- and is granted VIP status by the admin. Each VIP affiliate gets one
-- independent landing-page storefront at /store/:store_slug.
-- ---------------------------------------------------------
CREATE TABLE vip_stores (
    affiliate_id        BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    store_slug           VARCHAR(160) UNIQUE NOT NULL,
    headline             VARCHAR(200) NOT NULL DEFAULT 'متجري الإلكتروني',
    subheadline          TEXT,
    banner_url           TEXT,
    contact_phone        VARCHAR(30),
    contact_telegram     VARCHAR(120),
    product_ids          JSONB DEFAULT '[]',   -- ordered array of product ids featured on this store
    is_active            BOOLEAN DEFAULT TRUE,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- WHOLESALE PRODUCTS — a separate catalog the admin curates for
-- merchants buying in bulk. Advertised via a Telegram channel
-- (see site_settings key 'wholesale_telegram_url'); this table
-- backs the searchable /wholesale page on the website itself.
-- ---------------------------------------------------------
CREATE TABLE wholesale_products (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    image_url           TEXT,
    wholesale_price     NUMERIC(10,2) NOT NULL,
    min_order_quantity  INTEGER NOT NULL DEFAULT 1,
    category_id         INTEGER REFERENCES categories(id),
    source_notes        TEXT,     -- admin's private notes on where/how this was sourced
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- MARKETING KIT — ready-made assets per product so affiliates
-- don't have to create ad content from scratch.
-- ---------------------------------------------------------
CREATE TABLE product_marketing_assets (
    product_id          BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    ad_titles           JSONB DEFAULT '[]',   -- array of ready headline options
    video_urls          JSONB DEFAULT '[]',   -- array of video links (uploaded or hosted elsewhere)
    image_urls          JSONB DEFAULT '[]',   -- professional product photos, separate from product_images
    ad_copy_variants     JSONB DEFAULT '[]',   -- array of ready ad-text variants
    facebook_post        TEXT,                -- ready-to-publish Facebook/Meta Ads post
    instagram_post       TEXT,
    tiktok_post          TEXT,
    updated_at           TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- "COMING SOON" PRODUCT INTEREST — affiliates click "مهتم" on
-- upcoming products; when the admin publishes it, everyone who
-- clicked gets notified automatically.
-- ---------------------------------------------------------
CREATE TABLE product_interests (
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    affiliate_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at           TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (product_id, affiliate_id)
);

-- ---------------------------------------------------------
-- BACK-IN-STOCK NOTIFICATIONS — affiliate subscribes to be
-- notified when an out-of-stock product is restocked.
-- ---------------------------------------------------------
CREATE TABLE stock_notifications (
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    affiliate_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at           TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (product_id, affiliate_id)
);

-- ---------------------------------------------------------
-- WEB PUSH SUBSCRIPTIONS — powers push notifications for the
-- installable PWA (new order / commission confirmed / new product).
-- ---------------------------------------------------------
CREATE TABLE push_subscriptions (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint             TEXT NOT NULL UNIQUE,
    keys                 JSONB NOT NULL,   -- { p256dh, auth } from the browser's PushSubscription
    created_at           TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured, featured_order);
CREATE INDEX idx_orders_affiliate ON orders(affiliate_id);
CREATE INDEX idx_orders_wilaya ON orders(wilaya_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_affiliate ON order_items(affiliate_id);
CREATE INDEX idx_commissions_affiliate ON commissions(affiliate_id, status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_wholesale_products_category ON wholesale_products(category_id);
CREATE INDEX idx_product_interests_product ON product_interests(product_id);
CREATE INDEX idx_stock_notifications_product ON stock_notifications(product_id);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
