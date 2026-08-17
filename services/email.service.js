import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { paymentSuccessTemplate, memberWelcomeTemplate, memberActiveTemplate, adminNotificationTemplate } from '../utils/templates.js';
import { enquiryReceivedTemplate } from '../utils/templates-enquiry.js';

dotenv.config();

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to logo — checked in backend/public/images then frontend/public/images
const LOGO_PNG_BACKEND = path.resolve(__dirname, '..', 'public', 'images', 'logo.png');
const LOGO_PNG_FRONTEND = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'images', 'logo.png');
const LOGO_WEBP_FRONTEND = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'images', 'logo.webp');

const getValidLogoPath = () => {
  if (fs.existsSync(LOGO_PNG_BACKEND)) return LOGO_PNG_BACKEND;
  if (fs.existsSync(LOGO_PNG_FRONTEND)) return LOGO_PNG_FRONTEND;
  if (fs.existsSync(LOGO_WEBP_FRONTEND)) return LOGO_WEBP_FRONTEND;
  return null;
};

const rawPass = process.env.SMTP_PASS || '';
const cleanPass = rawPass.replace(/\s+/g, '').replace(/^"|"$/g, '');

const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    family: 4, // Force IPv4 — prevents ENETUNREACH errors on Render
    auth: {
      user: process.env.SMTP_USER || 'kesulatrust@gmail.com',
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
};

const sendMail = async (to, subject, html) => {
  console.log(`[SMTP] Sending email to: "${to}" | Subject: "${subject}"`);
  try {
    const validLogo = getValidLogoPath();
    const mailOptions = {
      from: `Kesula Charitable Trust <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || 'kesulatrust@gmail.com'}>`,
      to,
      subject,
      html,
    };

    if (validLogo) {
      mailOptions.attachments = [
        {
          filename: 'logo.jpeg',
          path: validLogo,
          cid: 'logo'
        }
      ];
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [SMTP SUCCESS] Email sent successfully to %s: %s', to, info.messageId);
    return true;
  } catch (error) {
    console.error(`❌ [SMTP ERROR] Error sending email to ${to}:`, error.message);
    return false;
  }
};

export const sendPaymentSuccessEmail = async (email, name, amount) => {
  const html = paymentSuccessTemplate(name, amount);
  await sendMail(email, 'Thank You for Your Donation - Kesula Charitable Trust', html);
  const adminHtml = adminNotificationTemplate('New Donation', `Received ₹${amount} from ${name} (${email}).`);
  await sendMail(process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER, 'New Donation Received', adminHtml);
  return true;
};

export const sendMemberWelcomeEmail = async (email, name, details = {}) => {
  const html = memberWelcomeTemplate(name);
  await sendMail(email, 'Membership Application Received - Kesula Charitable Trust', html);
  const adminHtml = adminNotificationTemplate('New Membership Application', `${name} (${email}) has applied for membership.`, details);
  await sendMail(process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER, 'New Membership Application', adminHtml);
  return true;
};

export const sendMemberActiveEmail = async (email, name, details = {}) => {
  console.log(`[EMAIL SERVICE] 📧 sendMemberActiveEmail called for: "${email}" (Name: "${name}")`);
  const html = memberActiveTemplate(name, details);
  return sendMail(email, 'Welcome to Kesula Charitable Trust - Official Member ID Card Included', html);
};

export const sendEnquiryEmail = async (email, name, details = {}) => {
  const html = enquiryReceivedTemplate(name);
  await sendMail(email, 'Enquiry Received - Kesula Charitable Trust', html);
  const adminHtml = adminNotificationTemplate('New General Enquiry', `Received a new enquiry from ${name} (${email}). Please check the admin dashboard for details.`, details);
  await sendMail(process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER, 'New General Enquiry', adminHtml);
  return true;
};
