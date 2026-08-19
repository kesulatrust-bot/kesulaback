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
// REUSABLE SMTP TRANSPORTER
// --------------------------------------------------

const transporter = nodemailer.createTransport({
  host: smtpHost,

  // Gmail:
  // 587 = STARTTLS
  // 465 = implicit TLS
  port: smtpPort,

  secure: smtpPort === 465,

  // Important for Render IPv6 connectivity issue
  family: 4,

  auth: {
    user: smtpUser,
    pass: smtpPass
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000
});

// --------------------------------------------------
// VERIFY SMTP CONNECTION
// --------------------------------------------------

transporter.verify()
  .then(() => {
    console.log(
      '✅ [SMTP] Gmail SMTP connection verified successfully'
    );
  })
  .catch((error) => {
    console.error(
      '❌ [SMTP] Gmail SMTP verification failed',
      {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      }
    );
  });

// --------------------------------------------------
// SEND MAIL
// --------------------------------------------------

const sendMail = async (to, subject, html, customAttachments = []) => {
  console.log(
    `[SMTP] Sending email to "${to}" | Subject: "${subject}"`
  );

  try {
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

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `✅ [SMTP SUCCESS] Email sent to ${to}`,
      {
        messageId: info.messageId,
        response: info.response
      }
    );

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {

    console.error(
      `❌ [SMTP ERROR] Failed sending email to ${to}`,
      {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      }
    );

    return {
      success: false,
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
