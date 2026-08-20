import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  paymentSuccessTemplate,
  memberWelcomeTemplate,
  memberActiveTemplate,
  adminNotificationTemplate,
  enquiryReceivedTemplate
} from '../utils/templates.js';

import { generateMemberIdCardPdf, getImageBuffer } from './idCard.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// --------------------------------------------------
// RESEND CONFIGURATION (PORT 443 HTTPS REST ONLY)
// --------------------------------------------------

const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const resendFrom = (process.env.RESEND_FROM || 'Kesula Charitable Trust <contact@kesulatrust.org>').trim();
const adminNotificationRecipient = (process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'kesulatrust@gmail.com').trim();

if (resendApiKey) {
  console.log('[RESEND SERVICE] ✅ Resend HTTPS API initialized (Port 443 REST). Sender:', resendFrom);
} else {
  console.warn('[RESEND SERVICE] ⚠️ RESEND_API_KEY is not set. Outbound emails will fail until configured.');
}

// --------------------------------------------------
// CENTRALIZED RESEND DISPATCHER (HTTP REST via FETCH)
// --------------------------------------------------

export const sendMail = async (to, subject, html, customAttachments = [], emailType = 'general') => {
  const cleanRecipient = String(to || '').trim();
  
  if (!cleanRecipient || !cleanRecipient.includes('@')) {
    console.error(`[RESEND FAILED] type=${emailType} to="${cleanRecipient}" error="Invalid recipient address"`);
    return {
      success: false,
      provider: 'resend',
      error: `Invalid recipient address: "${cleanRecipient}"`
    };
  }

  const cleanApiKey = (process.env.RESEND_API_KEY || resendApiKey || '').trim();
  if (!cleanApiKey) {
    console.error(`[RESEND FAILED] type=${emailType} to="${cleanRecipient}" error="Missing RESEND_API_KEY environment variable"`);
    return {
      success: false,
      provider: 'resend',
      error: 'RESEND_API_KEY not configured on server'
    };
  }

  console.log(`[RESEND] Sending email... type=${emailType} to="${cleanRecipient}" | subject="${subject}"`);

  // Format attachments for Resend REST API (Base64 encoding)
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
    to: [cleanRecipient],
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
      console.error(`[RESEND FAILED] type=${emailType} to="${cleanRecipient}" error="${errorMsg}" status=${response.status}`);
      return {
        success: false,
        provider: 'resend',
        error: errorMsg,
        status: response.status
      };
    }

    const messageId = data.id || 'N/A';
    console.log(`[RESEND ACCEPTED] type=${emailType} to="${cleanRecipient}" messageId="${messageId}"`);
    return {
      success: true,
      provider: 'resend',
      messageId: messageId
    };
  } catch (err) {
    const errorMsg = err.name === 'AbortError' ? 'Resend request timed out after 18s' : err.message;
    console.error(`[RESEND FAILED] type=${emailType} to="${cleanRecipient}" error="${errorMsg}"`);
    return {
      success: false,
      provider: 'resend',
      error: errorMsg
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
    customAttachments,
    'member-approval'
  );

  return {
    success: result.success,
    provider: 'resend',
    messageId: result.messageId || null,
    error: result.error || null,
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
    html,
    [],
    'member-welcome'
  );

  const adminHtml = adminNotificationTemplate(
    'New Membership Application',
    `${name} (${email}) has applied for membership.`,
    details
  );

  const adminResult = await sendMail(
    adminNotificationRecipient,
    'New Membership Application Received',
    adminHtml,
    [],
    'admin-membership'
  );

  return {
    success: memberResult.success,
    provider: 'resend',
    messageId: memberResult.messageId || null,
    error: memberResult.error || null,
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
    html,
    [],
    'donor-receipt'
  );

  const adminHtml = adminNotificationTemplate(
    'New Donation Received',
    `Received ₹${amount} contribution from ${name} (${email}).`
  );

  const adminResult = await sendMail(
    adminNotificationRecipient,
    'New Donation Contribution Received',
    adminHtml,
    [],
    'admin-donation'
  );

  return {
    success: donorResult.success,
    provider: 'resend',
    messageId: donorResult.messageId || null,
    error: donorResult.error || null,
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
    html,
    [],
    'user-enquiry'
  );

  const adminHtml = adminNotificationTemplate(
    'New General Enquiry',
    `Received a new enquiry from ${name} (${email}). Please check the admin dashboard for details.`,
    details
  );

  const adminResult = await sendMail(
    adminNotificationRecipient,
    'New General Enquiry Received',
    adminHtml,
    [],
    'admin-enquiry'
  );

  return {
    success: userResult.success,
    provider: 'resend',
    messageId: userResult.messageId || null,
    error: userResult.error || null,
    userEmail: userResult,
    adminEmail: adminResult
  };
};
