// Email Templates for Kesula Charitable Trust

const LOGO_URL = "cid:logo";

const baseStyles = `
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333333;
  line-height: 1.6;
`;

const headerStyles = `
  background-color: #f8f9fa;
  padding: 20px;
  text-align: center;
  border-bottom: 2px solid #e9ecef;
`;

const bodyStyles = `
  padding: 30px 20px;
  background-color: #ffffff;
`;

const footerStyles = `
  background-color: #f8f9fa;
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #6c757d;
  border-top: 1px solid #e9ecef;
`;

const containerStyles = `
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
`;

export const paymentSuccessTemplate = (name, amount) => `
<div style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <img src="${LOGO_URL}" alt="Kesula Charitable Trust" style="max-height: 50px;" />
    </div>
    <div style="${bodyStyles}">
      <h2 style="color: #2c3e50; margin-top: 0;">Thank You for Your Donation!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We have successfully received your generous donation of <strong>₹${amount}</strong>.</p>
      <p>Your support is invaluable and helps us continue our mission to make a positive impact in the community.</p>
      <p>A formal receipt will be available upon request. If you have any questions, feel free to contact us.</p>
      <br/>
      <p>Warm regards,</p>
      <p><strong>Kesula Charitable Trust Team</strong></p>
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
    </div>
  </div>
</div>
`;

export const memberWelcomeTemplate = (name) => `
<div style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <img src="${LOGO_URL}" alt="Kesula Charitable Trust" style="max-height: 50px;" />
    </div>
    <div style="${bodyStyles}">
      <h2 style="color: #2c3e50; margin-top: 0;">Membership Application Received</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for applying to become a member of the Kesula Charitable Trust!</p>
      <p>We have received your membership form. Our team is currently reviewing your details. We will notify you once your application has been processed and approved.</p>
      <p>We appreciate your interest in joining hands with us to make a difference.</p>
      <br/>
      <p>Warm regards,</p>
      <p><strong>Kesula Charitable Trust Team</strong></p>
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
    </div>
  </div>
</div>
`;

export const memberActiveTemplate = (name) => `
<div style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <img src="${LOGO_URL}" alt="Kesula Charitable Trust" style="max-height: 50px;" />
    </div>
    <div style="${bodyStyles}">
      <h2 style="color: #27ae60; margin-top: 0;">Membership Approved!</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We are thrilled to inform you that your membership application has been <strong>approved</strong>!</p>
      <p>You are now an official member of the Kesula Charitable Trust.</p>
      <p>Welcome aboard!</p>
      <p>Warm regards,</p>
      <p><strong>Kesula Charitable Trust Team</strong></p>
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
    </div>
  </div>
</div>
`;

export const enquiryReceivedTemplate = (name) => `
<div style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <img src="${LOGO_URL}" alt="Kesula Charitable Trust" style="max-height: 50px;" />
    </div>
    <div style="${bodyStyles}">
      <h2 style="color: #2c3e50; margin-top: 0;">Enquiry Received</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for getting in touch with Kesula Charitable Trust!</p>
      <p>We have successfully received your message and our team will review it and get back to you as soon as possible.</p>
      <br/>
      <p>Warm regards,</p>
      <p><strong>Kesula Charitable Trust Team</strong></p>
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
    </div>
  </div>
</div>
`;

export const adminNotificationTemplate = (title, message, details = {}) => {
  const detailsHtml = Object.entries(details).map(([key, value]) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #555;"><strong>${key}:</strong></td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">${value || 'N/A'}</td>
    </tr>
  `).join('');

  return `
<div style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <img src="${LOGO_URL}" alt="Kesula Charitable Trust" style="max-height: 50px;" />
    </div>
    <div style="${bodyStyles}">
      <h3 style="color: #c0392b; margin-top: 0; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">Admin Notification: ${title}</h3>
      <p style="font-size: 15px;">${message}</p>
      
      ${Object.keys(details).length > 0 ? `
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <h4 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #ddd; padding-bottom: 5px;">Submission Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${detailsHtml}
        </table>
      </div>
      ` : ''}
      
      <br/>
      <p style="text-align: center;"><a href="http://localhost:5173/admin" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Log in to Admin Dashboard</a></p>
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. System Generated Email.</p>
    </div>
  </div>
</div>
`;
};
