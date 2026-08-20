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
// REUSABLE RESILIENT SMTP TRANSPORTER (SINGLE POOL)
// --------------------------------------------------

const isGmail = smtpHost.includes('gmail') || smtpUser.includes('@gmail.com');

export const transporter = isGmail
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 20000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    })
  : nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      family: 4,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 20000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    });

// --------------------------------------------------
// STARTUP SMTP & DNS DIAGNOSTICS
// --------------------------------------------------

const runStartupDiagnostics = async () => {
  let resolvedIps = [];
  try {
    resolvedIps = await dns.promises.resolve4(smtpHost);
  } catch (dnsErr) {
    console.warn('[SMTP DNS WARNING] Failed resolving IPv4 for host:', dnsErr.message);
  }

  console.log('[SMTP DIAGNOSTICS]', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    passConfigured: Boolean(smtpPass),
    mailFrom,
    ipv4DnsResult: resolvedIps.length > 0 ? resolvedIps[0] : 'N/A',
    dnsFamily: 4
  });

  try {
    await transporter.verify();
    console.log('[SMTP VERIFY SUCCESS] Transporter connection verified and ready.');
  } catch (verifyError) {
    console.error('[SMTP VERIFY FAILED]', {
      code: verifyError.code,
      command: verifyError.command,
      responseCode: verifyError.responseCode,
      message: verifyError.message
    });
  }
};

runStartupDiagnostics();

// --------------------------------------------------
// SEND MAIL (WITH STRUCTURED [SMTP ACCEPTED] LOGGING)
// --------------------------------------------------

export const sendMail = async (to, subject, html, customAttachments = []) => {
  console.log(`[SMTP] Dispatching email to: "${to}" | Subject: "${subject}"`);

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
  amount
) => {

  const html = paymentSuccessTemplate(
    name,
    amount
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
  const html = memberWelcomeTemplate(name);

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
