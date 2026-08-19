import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
const smtpPass = rawPass
  .replace(/\s+/g, '')
  .replace(/^"|"$/g, '');

const mailFrom =
  process.env.MAIL_FROM_ADDRESS ||
  smtpUser;

if (!smtpPass) {
  console.warn(
    '⚠️ [SMTP WARNING] SMTP_PASS is not configured in .env.'
  );
}

// --------------------------------------------------
// SMTP CONFIG LOG
// --------------------------------------------------

console.log('[SMTP CONFIG]', {
  host: smtpHost,
  port: smtpPort,
  user: smtpUser,
  passConfigured: Boolean(smtpPass),
  from: mailFrom,
  ipv4Only: true
});

// --------------------------------------------------
// REUSABLE RESILIENT SMTP TRANSPORTERS (DUAL POOL)
// --------------------------------------------------

// Primary: Gmail Service preset (automatically handles Google cloud routing & TLS)
const primaryTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000
});

// Fallback: Explicit Port 587 STARTTLS with TLS tolerance
const fallbackTransporter = nodemailer.createTransport({
  host: smtpHost || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000
});

// --------------------------------------------------
// VERIFY SMTP CONNECTIONS
// --------------------------------------------------

primaryTransporter.verify()
  .then(() => {
    console.log('✅ [SMTP] Primary Gmail SSL (port 465) verified successfully');
  })
  .catch((error) => {
    console.warn('⚠️ [SMTP] Primary Gmail SSL (port 465) verification notice:', error.message);
  });

fallbackTransporter.verify()
  .then(() => {
    console.log('✅ [SMTP] Fallback Gmail STARTTLS (port 587) verified successfully');
  })
  .catch((error) => {
    console.warn('⚠️ [SMTP] Fallback Gmail STARTTLS (port 587) verification notice:', error.message);
  });

// --------------------------------------------------
// SEND MAIL (WITH AUTOMATIC RETRY)
// --------------------------------------------------

const sendMail = async (to, subject, html, customAttachments = []) => {
  console.log(
    `[SMTP] Sending email to "${to}" | Subject: "${subject}"`
  );

  const validLogo = getValidLogoPath();

  const mailOptions = {
    from: `Kesula Charitable Trust <${mailFrom}>`,
    to,
    subject,
    html,
    attachments: []
  };

  if (validLogo) {
    mailOptions.attachments.push({
      filename: 'logo.png',
      path: validLogo,
      cid: 'logo'
    });
  }

  if (Array.isArray(customAttachments) && customAttachments.length > 0) {
    mailOptions.attachments.push(...customAttachments);
  }

  // Attempt with Primary Transporter (Port 465 Direct SSL)
  try {
    const info = await primaryTransporter.sendMail(mailOptions);
    console.log(`✅ [SMTP SUCCESS] Email sent to ${to} via Primary SSL (465)`, {
      messageId: info.messageId,
      response: info.response
    });
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (primaryError) {
    console.warn(
      `⚠️ [SMTP RETRY] Primary transport failed for ${to} (${primaryError.message}). Retrying via Fallback transport (587)...`
    );

    // Fallback Attempt (Port 587 STARTTLS)
    try {
      const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
      console.log(`✅ [SMTP SUCCESS] Email sent to ${to} via Fallback (587)`, {
        messageId: fallbackInfo.messageId,
        response: fallbackInfo.response
      });
      return {
        success: true,
        messageId: fallbackInfo.messageId
      };
    } catch (fallbackError) {
      console.error(
        `❌ [SMTP ERROR] Both primary and fallback transports failed for ${to}`,
        {
          primaryError: primaryError.message,
          fallbackError: fallbackError.message,
          code: fallbackError.code
        }
      );
      return {
        success: false,
        error: fallbackError.message,
        code: fallbackError.code
      };
    }
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
    success: donorResult.success && adminResult.success,
    donor: donorResult,
    admin: adminResult
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

  const adminEmail =
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER;

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
    success: memberResult.success && adminResult.success,
    member: memberResult,
    admin: adminResult
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

  console.log(
    `[EMAIL SERVICE] 📧 sendMemberActiveEmail called for "${email}"`,
    {
      name,
      memberId
    }
  );

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
    success: result.success,
    memberEmail: result.success,
    idCardAttachment: Boolean(pdfBuffer),
    photoAttached: Boolean(photoBuffer),
    messageId: result.messageId,
    error: result.error
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

  const adminEmail =
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER;

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
    success: userResult.success && adminResult.success,
    user: userResult,
    admin: adminResult
  };
};
