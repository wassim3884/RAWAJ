require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const affiliateRoutes = require('./routes/affiliate.routes');
const orderRoutes = require('./routes/orders.routes');
const withdrawalRoutes = require('./routes/withdrawals.routes');
const adminRoutes = require('./routes/admin.routes');
const categoryRoutes = require('./routes/categories.routes');
const notificationRoutes = require('./routes/notifications.routes');
const wilayaRoutes = require('./routes/wilayas.routes');
const wholesaleRoutes = require('./routes/wholesale.routes');
const vipRoutes = require('./routes/vip.routes');
const storeRoutes = require('./routes/store.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const pushRoutes = require('./routes/push.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Basic rate limiting on auth endpoints to slow brute-force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/auth', authLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wilayas', wilayaRoutes);
app.use('/api/wholesale', wholesaleRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/push', pushRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Rawaj API running on port ${PORT}`));

module.exports = app;
