import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Force Node.js to resolve IPv4 addresses first (fixes Render ENETUNREACH on IPv6)
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import { generalApiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import paymentRoutes from './routes/payment.routes.js';
import contactRoutes from './routes/contact.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import debugRoutes from './routes/debug.routes.js';

// Environment Validation
const requiredEnvVars = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && process.env.NODE_ENV === 'production') {
    console.error(`[FATAL] Missing required environment variable in production: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

// Security & Middleware
app.use(helmet()); 
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Resilient Universal CORS Setup
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());

// Apply global rate limiter
app.use('/api/', generalApiLimiter);

// Health check & version endpoints
app.get('/api/ping', (req, res) => res.status(200).json({ status: 'awake', service: 'kesula-backend' }));
app.get('/ping', (req, res) => res.status(200).json({ status: 'awake', service: 'kesula-backend' }));
app.get('/api/version', (req, res) => res.status(200).json({ version: '2.1.0', commit: 'prod-architecture-v2', timestamp: new Date().toISOString() }));

// Mount Routes
app.use('/api', paymentRoutes);
app.use('/api', contactRoutes);
app.use('/api', membershipRoutes);
app.use('/api/debug', debugRoutes);
app.use('/', membershipRoutes); // Also mount at root for flexibility

// Centralized Error Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
}

export default app;
