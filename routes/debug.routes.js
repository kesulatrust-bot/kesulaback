import express from 'express';
import dns from 'node:dns/promises';
import net from 'node:net';
import { sendDiagnosticTestEmail, transporter } from '../services/email.service.js';

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
 * PHASE 10: RAW TCP & DNS CONNECTIVITY CHECK
 * Tests IPv4 DNS resolution and raw TCP socket connect to smtp.gmail.com:587 without auth.
 */
router.get('/smtp-check', requireAdminOrLocal, async (req, res) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const start = Date.now();

  let resolvedIps = [];
  try {
    resolvedIps = await dns.resolve4(host);
  } catch (err) {
    return res.status(500).json({
      status: 'DNS_FAILED',
      error: err.message,
      host
    });
  }

  const targetIp = resolvedIps[0];

  // Test Raw TCP Socket
  const socket = new net.Socket();
  socket.setTimeout(8000);

  socket.connect(port, targetIp, () => {
    const rtt = Date.now() - start;
    socket.destroy();
    return res.json({
      status: 'TCP_CONNECTED',
      host,
      port,
      resolvedIpv4: targetIp,
      allIps: resolvedIps,
      roundTripTimeMs: rtt,
      message: `Successfully connected to ${host} (${targetIp}:${port}) via IPv4 TCP socket.`
    });
  });

  socket.on('error', (err) => {
    socket.destroy();
    return res.status(500).json({
      status: 'TCP_CONNECT_FAILED',
      host,
      port,
      resolvedIpv4: targetIp,
      error: err.message,
      code: err.code
    });
  });

  socket.on('timeout', () => {
    socket.destroy();
    return res.status(504).json({
      status: 'TCP_TIMEOUT',
      host,
      port,
      resolvedIpv4: targetIp,
      error: 'Connection to SMTP port timed out after 8000ms.'
    });
  });
});

/**
 * PHASE 13 & 14: PROTECTED DIAGNOSTIC TEST EMAIL
 * Sends plain-text or minimal HTML to verify SMTP delivery in isolation.
 */
router.post('/test-email', requireAdminOrLocal, async (req, res) => {
  const { email, mode = 'plain' } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  try {
    const result = await sendDiagnosticTestEmail(email, mode);
    return res.json({
      success: result.accepted,
      mode,
      recipient: email,
      result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});

export default router;
