import express from 'express';
import { sendMail } from '../services/email.service.js';

const router = express.Router();

/**
 * Protected Debug Middleware (Requires ADMIN_SECRET_KEY or allows test/dev)
 */
const requireAdminOrLocal = (req, res, next) => {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  const expectedKey = process.env.ADMIN_API_KEY || 'kesula-admin-test-2026';
  
  if (process.env.NODE_ENV !== 'production' || authHeader === expectedKey || authHeader === `Bearer ${expectedKey}`) {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized diagnostic request. Provide valid x-admin-key.' });
};

/**
 * RESEND API STATUS & CONNECTIVITY CHECK
 * Tests Resend API connectivity over Port 443 HTTPS REST
 */
router.get('/resend-check', requireAdminOrLocal, async (req, res) => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const resendFrom = process.env.RESEND_FROM || 'Kesula Charitable Trust <contact@kesulatrust.org>';
  const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'kesulatrust@gmail.com';

  if (!apiKey) {
    return res.status(500).json({
      status: 'RESEND_NOT_CONFIGURED',
      error: 'RESEND_API_KEY environment variable is not set.'
    });
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.resend.com/api-keys', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const rtt = Date.now() - start;

    return res.json({
      status: response.ok ? 'RESEND_CONNECTED' : 'RESEND_API_ERROR',
      statusCode: response.status,
      roundTripTimeMs: rtt,
      sender: resendFrom,
      adminEmailRecipient: adminEmail,
      apiKeyPrefix: apiKey.slice(0, 6) + '...' + apiKey.slice(-4)
    });
  } catch (err) {
    return res.status(500).json({
      status: 'RESEND_CONNECT_FAILED',
      error: err.message
    });
  }
});

/**
 * PROTECTED DIAGNOSTIC TEST EMAIL VIA RESEND
 */
router.post('/test-email', requireAdminOrLocal, async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #8a3004;">Kesula Charitable Trust - Resend Diagnostic Verification</h2>
        <p>This is a live diagnostic verification email dispatched via <strong>Resend HTTPS REST API (Port 443)</strong>.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
      </div>
    `;

    const result = await sendMail(email, 'Resend Diagnostic Test - Kesula Trust', html, [], 'diagnostic-test');

    return res.json({
      success: result.success,
      recipient: email,
      provider: result.provider,
      messageId: result.messageId || null,
      error: result.error || null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
