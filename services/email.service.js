import nodemailer from 'nodemailer';
import dns from 'node:dns';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Force Node.js to prioritize IPv4 address resolution (fixes Render IPv6 ENETUNREACH)
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import {
  paymentSuccessTemplate,
  memberWelcomeTemplate,
  memberActiveTemplate,
  adminNotificationTemplate
} from '../utils/templates.js';

import { enquiryReceivedTemplate } from '../utils/templates-enquiry.js';
import { generateMemberIdCardPdf, getImageBuffer } from './idCard.service.js';

dotenv.config();

// --------------------------------------------------
// PATHS
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PNG_BACKEND = path.resolve(
  __dirname,
  '..',
  'public',
  'images',
  'logo.png'
);

const LOGO_PNG_FRONTEND = path.resolve(
  __dirname,
  '..',
  '..',
  'frontend',
  'public',
  'images',
  'logo.png'
);

const LOGO_WEBP_FRONTEND = path.resolve(
  __dirname,
  '..',
  '..',
  'frontend',
  'public',
  'images',
  'logo.webp'
);

const getValidLogoPath = () => {
  if (fs.existsSync(LOGO_PNG_BACKEND)) return LOGO_PNG_BACKEND;
  if (fs.existsSync(LOGO_PNG_FRONTEND)) return LOGO_PNG_FRONTEND;
  if (fs.existsSync(LOGO_WEBP_FRONTEND)) return LOGO_WEBP_FRONTEND;

  return null;
};

// --------------------------------------------------
// ENV CONFIG
// --------------------------------------------------

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// --------------------------------------------------
// SMTP CONFIG
// --------------------------------------------------

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || 'kesulatrust@gmail.com';

const rawPass = process.env.SMTP_PASS || '';
const smtpPass = rawPass.replace(/\s+/g, '').replace(/^"|"$/g, '');

const mailFrom = process.env.MAIL_FROM_ADDRESS || smtpUser;

// --------------------------------------------------
// REUSABLE RESILIENT SMTP TRANSPORTER (STRICT IPv4 FOR RENDER)
// --------------------------------------------------

// Custom DNS lookup that strictly returns IPv4 address only (never IPv6)
const ipv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { family: 4, all: false }, (err, address) => {
    if (err) {
      // Fallback to direct resolve4 if lookup fails
      dns.resolve4(hostname, (rErr, addresses) => {
        if (rErr || !addresses || addresses.length === 0) return callback(err || rErr);
        callback(null, addresses[0], 4);
      });
      return;
    }
    callback(null, address, 4);
  });
};

export const transporter = nodemailer.createTransport({
  host: smtpHost.includes('gmail') ? 'smtp.gmail.com' : smtpHost,
  port: 465,
  secure: true,
  family: 4,
  dnsLookup: ipv4Lookup,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  pool: false, // Fresh IPv4 connection prevents dead socket timeouts on cloud containers
  connectionTimeout: 25000,
  greetingTimeout: 15000,
  socketTimeout: 35000
});

const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const resendFrom = process.env.RESEND_FROM || 'Kesula Charitable Trust <onboarding@resend.dev>';

// --------------------------------------------------
// STARTUP EMAIL DIAGNOSTICS
// --------------------------------------------------

const runStartupDiagnostics = async () => {
  if (resendApiKey) {
    console.log('[EMAIL SERVICE] ✅ Resend HTTPS API configured & ready as primary email provider (Port 443).');
    return;
  }

  let resolvedIps = [];
  try {
    resolvedIps = await dns.promises.resolve4(smtpHost);
  } catch (dnsErr) {
    // Silent
  }

  if (smtpPass) {
    try {
      await transporter.verify();
      console.log('[SMTP VERIFY SUCCESS] Transporter connection verified and ready.');
    } catch (verifyError) {
      console.error('[SMTP VERIFY FAILED]', verifyError.message);
    }
  }
};

runStartupDiagnostics();

// --------------------------------------------------
// SEND MAIL (HYBRID: RESEND HTTPS API + SMTP FALLBACK)
// --------------------------------------------------

const sendViaResendHttp = async (to, subject, html, customAttachments = []) => {
  const formattedAttachments = customAttachments.map(att => {
    let content = att.content;
    if (Buffer.isBuffer(content)) {
      content = content.toString('base64');
    }
    return {
      filename: att.filename,
      content: content
    };
  });

  const payload = {
    from: resendFrom,
    to: [to],
    subject: subject,
    html: html
  };

  if (formattedAttachments.length > 0) {
    payload.attachments = formattedAttachments;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }

  return {
    success: true,
    accepted: true,
    messageId: data.id,
    provider: 'resend_https'
  };
};

export const sendMail = async (to, subject, html, customAttachments = []) => {
  console.log(`[EMAIL SERVICE] Dispatching email to: "${to}" | Subject: "${subject}"`);

  // 1. Try Resend HTTPS API if API Key is configured (Preferred on Render / Cloud)
  if (resendApiKey) {
    try {
      const resendResult = await sendViaResendHttp(to, subject, html, customAttachments);
      console.log('[RESEND HTTPS ACCEPTED]', { to, messageId: resendResult.messageId });
      return resendResult;
    } catch (resendError) {
      console.error('[RESEND HTTPS FAILED, FALLING BACK TO SMTP]:', resendError.message);
    }
  }

  // 2. Fallback to Direct SMTP
  const mailOptions = {
    from: `Kesula Charitable Trust <${mailFrom}>`,
    to,
    subject,
    html,
    attachments: []
  };

  if (Array.isArray(customAttachments) && customAttachments.length > 0) {
    mailOptions.attachments.push(...customAttachments);
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP ACCEPTED]', {
      to,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      response: info.response,
      envelope: info.envelope
    });

    return {
      success: true,
      accepted: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('[SMTP REJECTED]', {
      to,
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });

    return {
      success: false,
      accepted: false,
      error: error.message,
      code: error.code
    };
  }
};

// --------------------------------------------------
// DONATION EMAIL
// --------------------------------------------------

export const sendPaymentSuccessEmail = async (
  email,
  name,
  amount,
  details = {}
) => {

  const html = paymentSuccessTemplate(
    name,
    amount,
    details
  );

  const donorResult = await sendMail(
    email,
    'Thank You for Your Donation - Kesula Charitable Trust',
    html
  );

  const adminEmail =
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER;

  const adminHtml = adminNotificationTemplate(
    'New Donation',
    `Received ₹${amount} from ${name} (${email}).`
  );

  const adminResult = await sendMail(
    adminEmail,
    'New Donation Received',
    adminHtml
  );

  return {
    success: donorResult.accepted && adminResult.accepted,
    status: (donorResult.accepted && adminResult.accepted) ? 'SUCCESS' : (donorResult.accepted || adminResult.accepted) ? 'PARTIAL_SUCCESS' : 'FAILED',
    donorEmail: donorResult,
    adminEmail: adminResult
  };
};

// --------------------------------------------------
// MEMBER WELCOME EMAIL
// --------------------------------------------------

export const sendMemberWelcomeEmail = async (
  email,
  name,
  details = {}
) => {
  const html = memberWelcomeTemplate(name, details);

  const memberResult = await sendMail(
    email,
    'Membership Application Received - Kesula Charitable Trust',
    html
  );

  const adminEmail = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
  const adminHtml = adminNotificationTemplate(
    'New Membership Application',
    `${name} (${email}) has applied for membership.`,
    details
  );

  const adminResult = await sendMail(
    adminEmail,
    'New Membership Application',
    adminHtml
  );

  return {
    success: memberResult.accepted && adminResult.accepted,
    status: (memberResult.accepted && adminResult.accepted) ? 'SUCCESS' : (memberResult.accepted || adminResult.accepted) ? 'PARTIAL_SUCCESS' : 'FAILED',
    memberEmail: memberResult,
    adminEmail: adminResult
  };
};

// --------------------------------------------------
// MEMBER ACTIVE EMAIL
// --------------------------------------------------

export const sendMemberActiveEmail = async (
  email,
  name,
  details = {}
) => {
  const memberId = details.id 
    ? `KCT-${String(details.id).slice(0, 8).toUpperCase()}` 
    : (details.memberId || `KCT-MEM-${Math.floor(100000 + Math.random() * 900000)}`);

  console.log(`[EMAIL SERVICE] 📧 sendMemberActiveEmail called for "${email}"`, { name, memberId });

  const customAttachments = [];
  let photoBuffer = null;

  // 1. Process Member Photo
  const photoSource = details.photoUrl || details.photo_url || details.photo || details.avatar_url || '';
  if (photoSource) {
    photoBuffer = await getImageBuffer(photoSource);
    if (photoBuffer) {
      customAttachments.push({
        filename: 'member-photo.jpg',
        content: photoBuffer,
        cid: 'memberphoto'
      });
    }
  }

  // 2. Generate Print-Ready Vector PDF ID Card
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateMemberIdCardPdf({
      ...details,
      id: details.id || memberId,
      fullName: name,
      email
    });

    if (pdfBuffer) {
      customAttachments.push({
        filename: `Kesula-Member-${memberId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }
  } catch (pdfErr) {
    console.error('[EMAIL SERVICE] Failed generating ID Card PDF attachment:', pdfErr);
  }

  // 3. Render Email HTML Template
  const html = memberActiveTemplate(
    name,
    {
      ...details,
      memberId,
      hasPhotoAttachment: Boolean(photoBuffer),
      publicPhotoUrl: (photoSource && (photoSource.startsWith('http://') || photoSource.startsWith('https://'))) ? photoSource : ''
    }
  );

  const result = await sendMail(
    email,
    'Welcome to Kesula Charitable Trust - Official Member ID Card Included',
    html,
    customAttachments
  );

  return {
    success: result.accepted,
    status: result.accepted ? 'SUCCESS' : 'FAILED',
    memberEmail: result,
    idCardAttachment: Boolean(pdfBuffer),
    photoAttached: Boolean(photoBuffer)
  };
};

// --------------------------------------------------
// ENQUIRY EMAIL
// --------------------------------------------------

export const sendEnquiryEmail = async (
  email,
  name,
  details = {}
) => {
  const html = enquiryReceivedTemplate(name);

  const userResult = await sendMail(
    email,
    'Enquiry Received - Kesula Charitable Trust',
    html
  );

  const adminEmail = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
  const adminHtml = adminNotificationTemplate(
    'New General Enquiry',
    `Received a new enquiry from ${name} (${email}). Please check the admin dashboard for details.`,
    details
  );

  const adminResult = await sendMail(
    adminEmail,
    'New General Enquiry',
    adminHtml
  );

  return {
    success: userResult.accepted && adminResult.accepted,
    status: (userResult.accepted && adminResult.accepted) ? 'SUCCESS' : (userResult.accepted || adminResult.accepted) ? 'PARTIAL_SUCCESS' : 'FAILED',
    userEmail: userResult,
    adminEmail: adminResult
  };
};

// --------------------------------------------------
// DIAGNOSTIC TEST EMAIL (ISOLATED PLAIN-TEXT / SIMPLE HTML)
// --------------------------------------------------

export const sendDiagnosticTestEmail = async (to, mode = 'plain') => {
  if (mode === 'plain') {
    return sendMail(
      to,
      'Kesula SMTP Production Test (Plain Text)',
      'This is an automated production SMTP test message from Kesula Charitable Trust confirming IPv4 connectivity.'
    );
  }

  return sendMail(
    to,
    'Kesula SMTP Production Test (Simple HTML)',
    `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2>Kesula SMTP Production Test</h2>
        <p>This is a verified test email sent via Gmail SMTP on Render over IPv4 (Port 587 STARTTLS).</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      </div>
    `
  );
};
