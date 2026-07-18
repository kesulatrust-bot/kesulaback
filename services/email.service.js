import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { paymentSuccessTemplate, memberWelcomeTemplate, memberActiveTemplate, adminNotificationTemplate } from '../utils/templates.js';
import { enquiryReceivedTemplate } from '../utils/templates-enquiry.js';

dotenv.config();

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to logo — lives in frontend/public/images (backend has no public folder)
const LOGO_PATH = path.resolve(__dirname, '..', 'frontend', 'public', 'images', 'logo.jpeg');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT, // true for 465, false for 587
  family: 4, // Force IPv4 — prevents ENETUNREACH errors on Render (IPv6 not supported)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `Kesula Charitable Trust <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'logo.jpeg',
          path: LOGO_PATH,
          cid: 'logo' // same cid value as in the html img src
        }
      ]
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendPaymentSuccessEmail = async (email, name, amount) => {
  const html = paymentSuccessTemplate(name, amount);
  // Send receipt to donor
  await sendMail(email, 'Thank You for Your Donation - Kesula Charitable Trust', html);
  // Notify admin
  const adminHtml = adminNotificationTemplate('New Donation', `Received ₹${amount} from ${name} (${email}).`);
  await sendMail(process.env.MAIL_FROM_ADDRESS, 'New Donation Received', adminHtml);
  return true;
};

export const sendMemberWelcomeEmail = async (email, name, details = {}) => {
  const html = memberWelcomeTemplate(name);
  // Send welcome to applicant
  await sendMail(email, 'Membership Application Received - Kesula Charitable Trust', html);
  // Notify admin
  const adminHtml = adminNotificationTemplate('New Membership Application', `${name} (${email}) has applied for membership.`, details);
  await sendMail(process.env.MAIL_FROM_ADDRESS, 'New Membership Application', adminHtml);
  return true;
};

export const sendMemberActiveEmail = async (email, name) => {
  const html = memberActiveTemplate(name);
  return sendMail(email, 'Welcome to Kesula Charitable Trust!', html);
};

export const sendEnquiryEmail = async (email, name, details = {}) => {
  const html = enquiryReceivedTemplate(name);
  // Auto-reply to user
  await sendMail(email, 'Enquiry Received - Kesula Charitable Trust', html);
  // Notify admin
  const adminHtml = adminNotificationTemplate('New General Enquiry', `Received a new enquiry from ${name} (${email}). Please check the admin dashboard for details.`, details);
  await sendMail(process.env.MAIL_FROM_ADDRESS, 'New General Enquiry', adminHtml);
  return true;
};
