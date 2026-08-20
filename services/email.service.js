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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// --------------------------------------------------
// RESEND CONFIGURATION (PORT 443 HTTPS REST ONLY)
// --------------------------------------------------

const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const resendFrom = process.env.RESEND_FROM || 'Kesula Charitable Trust <contact@kesulatrust.org>';
const adminNotificationRecipient = process.env.MAIL_FROM_ADDRESS || 'kesulatrust@gmail.com';

if (resendApiKey) {
  console.log('[RESEND SERVICE] ✅ Resend HTTPS API initialized (Port 443 REST). Sender:', resendFrom);
} else {
  console.warn('[RESEND SERVICE] ⚠️ RESEND_API_KEY is not set. Outbound emails will fail until configured.');
}

// --------------------------------------------------
// CENTRALIZED RESEND DISPATCHER (HTTP REST via FETCH)
// --------------------------------------------------

export const sendMail = async (to, subject, html, customAttachments = []) => {
  if (!to || !to.includes('@')) {
    console.error(`[RESEND FAILED] Invalid recipient email: "${to}"`);
    return {
      success: false,
      accepted: false,
      error: `Invalid recipient address: "${to}"`,
      provider: 'resend'
    };
  }

  const cleanApiKey = (process.env.RESEND_API_KEY || resendApiKey || '').trim();
  if (!cleanApiKey) {
    console.error('[RESEND FAILED] Missing RESEND_API_KEY environment variable on server.');
    return {
      success: false,
      accepted: false,
      error: 'RESEND_API_KEY not configured on server',
      provider: 'resend'
    };
  }

  console.log(`[RESEND] Sending email to: "${to}" | Subject: "${subject}"`);

  // Format attachments for Resend REST API
  const formattedAttachments = (customAttachments || []).map(att => {
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
    to: [to.trim()],
    subject: subject,
    html: html
  };

  if (formattedAttachments.length > 0) {
    payload.attachments = formattedAttachments;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Resend API returned status ${response.status}`;
      console.error(`[RESEND FAILED] Error dispatching to "${to}":`, errorMsg);
      return {
        success: false,
        accepted: false,
        error: errorMsg,
        status: response.status,
        provider: 'resend'
      };
    }

    console.log(`[RESEND ACCEPTED] to: "${to}" | messageId: "${data.id}"`);
    return {
      success: true,
      accepted: true,
      messageId: data.id,
      provider: 'resend'
    };
  } catch (err) {
    const errorMsg = err.name === 'AbortError' ? 'Resend request timed out after 18s' : err.message;
    console.error(`[RESEND FAILED] Network exception for "${to}":`, errorMsg);
    return {
      success: false,
      accepted: false,
      error: errorMsg,
      provider: 'resend'
    };
  }
};

// --------------------------------------------------
// 1. MEMBER APPROVAL EMAIL (WITH PDF ID CARD ATTACHMENT)
// --------------------------------------------------

export const sendMemberActiveEmail = async (email, name, details = {}) => {
  const memberId = details.id 
    ? `KCT-${String(details.id).slice(0, 8).toUpperCase()}` 
    : (details.memberId || `KCT-MEM-${Math.floor(100000 + Math.random() * 900000)}`);

  console.log(`[EMAIL SERVICE] 📧 sendMemberActiveEmail triggered for "${email}"`, { name, memberId });

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
        filename: `Kesula-Member-ID-${memberId}.pdf`,
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
    messageId: result.messageId || null,
    error: result.error || null,
    provider: 'resend',
    idCardAttachment: Boolean(pdfBuffer),
    photoAttached: Boolean(photoBuffer)
  };
};

// --------------------------------------------------
// 2. MEMBER WELCOME / APPLICATION CONFIRMATION EMAIL
// --------------------------------------------------

export const sendMemberWelcomeEmail = async (email, name, details = {}) => {
  const html = memberWelcomeTemplate(name, details);

  const memberResult = await sendMail(
    email,
    'Membership Application Received - Kesula Charitable Trust',
    html
  );

  const adminHtml = adminNotificationTemplate(
    'New Membership Application',
    `${name} (${email}) has applied for membership.`,
    details
  );

  const adminResult = await sendMail(
    adminNotificationRecipient,
    'New Membership Application Received',
    adminHtml
  );

  return {
    success: memberResult.accepted,
    status: (memberResult.accepted && adminResult.accepted) ? 'SUCCESS' : (memberResult.accepted ? 'MEMBER_ONLY' : 'FAILED'),
    memberEmail: memberResult,
    adminEmail: adminResult
  };
};

// --------------------------------------------------
// 3. DONATION / 80G RECEIPT EMAIL
// --------------------------------------------------

export const sendPaymentSuccessEmail = async (email, name, amount, details = {}) => {
  const html = paymentSuccessTemplate(name, amount, details);

  const donorResult = await sendMail(
    email,
    'Thank You for Your Donation - Kesula Charitable Trust',
    html
  );

  const adminHtml = adminNotificationTemplate(
    'New Donation Received',
    `Received ₹${amount} contribution from ${name} (${email}).`
  );

  const adminResult = await sendMail(
    adminNotificationRecipient,
    'New Donation Contribution Received',
    adminHtml
  );

  return {
    success: donorResult.accepted,
    status: (donorResult.accepted && adminResult.accepted) ? 'SUCCESS' : (donorResult.accepted ? 'DONOR_ONLY' : 'FAILED'),
    donorEmail: donorResult,
    adminEmail: adminResult
  };
};

// --------------------------------------------------
// 4. CONTACT / GENERAL ENQUIRY EMAIL
// --------------------------------------------------

export const sendEnquiryEmail = async (email, name, details = {}) => {
  const html = enquiryReceivedTemplate(name);

  const userResult = await sendMail(
    email,
    'Enquiry Received - Kesula Charitable Trust',
    html
  );

  const adminHtml = adminNotificationTemplate(
    'New General Enquiry',
    `Received a new enquiry from ${name} (${email}). Please check the admin dashboard for details.`,
    details
  );

  const adminResult = await sendMail(
    adminNotificationRecipient,
    'New General Enquiry Received',
    adminHtml
  );

  return {
    success: userResult.accepted,
    status: (userResult.accepted && adminResult.accepted) ? 'SUCCESS' : (userResult.accepted ? 'USER_ONLY' : 'FAILED'),
    userEmail: userResult,
    adminEmail: adminResult
  };
};
