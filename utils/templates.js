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

export const memberActiveTemplate = (name, details = {}) => {
  const memberId = details.id 
    ? `KCT-${String(details.id).slice(0, 8).toUpperCase()}` 
    : (details.memberId || `KCT-MEM-${Math.floor(100000 + Math.random() * 900000)}`);

  const email = details.email || 'N/A';
  const phone = details.phone || details.phone_number || 'N/A';
  const interest = details.interestArea || details.interest_area || 'Community Volunteer';
  const issuedDate = details.createdAt || details.created_at
    ? new Date(details.createdAt || details.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const photoUrl = details.photoUrl || details.photo_url || '';

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://www.kesulatrust.org/verify-member?id=${memberId}&name=${encodeURIComponent(name)}`)}&color=8a3004`;

  return `
<div style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <img src="${LOGO_URL}" alt="Kesula Charitable Trust" style="max-height: 55px; border-radius: 9999px;" />
      <h3 style="color: #8a3004; margin: 8px 0 0 0; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Kesula Charitable Trust</h3>
    </div>
    <div style="${bodyStyles}">
      <h2 style="color: #27ae60; margin-top: 0; font-size: 22px; text-align: center;">🎉 Membership Approved!</h2>
      <p style="font-size: 15px;">Dear <strong>${name}</strong>,</p>
      <p style="font-size: 14px; color: #475569;">We are thrilled to inform you that your membership application has been <strong>approved</strong>! You are now an official verified member of <strong>Kesula Charitable Trust</strong>.</p>
      
      <p style="font-size: 14px; font-weight: bold; color: #1e293b; margin-top: 20px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">🪪 Your Official Verified Digital Membership Card:</p>
      
      <!-- Visual ID Card Container -->
      <div style="max-width: 330px; margin: 15px auto; border-radius: 20px; background: linear-gradient(to bottom, #fff7ed, #ffffff, #fef3c7); border: 2px solid #fde68a; box-shadow: 0 10px 25px rgba(0,0,0,0.12); overflow: hidden; font-family: sans-serif; text-align: center;">
        
        <!-- ID Card Header -->
        <div style="background-color: #8a3004; padding: 12px 16px; color: white; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #fcd34d;">
          <div style="text-align: left;">
            <div style="font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #fcd34d;">KESULA TRUST</div>
            <div style="font-size: 8px; color: #fef3c7; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Official Member Identity Pass</div>
          </div>
          <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 20px; background-color: rgba(251,191,36,0.25); color: #fde68a; border: 1px solid rgba(251,191,36,0.4);">VERIFIED</span>
        </div>

        <!-- ID Card Content Body -->
        <div style="padding: 18px 16px;">
          <!-- Member Avatar / Photo -->
          <div style="width: 100px; height: 125px; margin: 0 auto 10px; padding: 4px; background: linear-gradient(to top right, #fbbf24, #8a3004, #fde68a); border-radius: 16px;">
            <div style="width: 100%; height: 100%; border-radius: 12px; background-color: white; overflow: hidden; display: flex; align-items: center; justify-content: center; color: #8a3004; font-size: 44px;">
              ${photoUrl ? `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : '👤'}
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;">${name}</h3>
            <div style="display: inline-block; margin-top: 4px; padding: 3px 14px; border-radius: 20px; background: linear-gradient(to right, #4a1802, #8a3004, #4a1802); color: #fcd34d; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
              ${interest}
            </div>
          </div>

          <!-- Details Table -->
          <div style="background-color: #ffffff; border: 1px solid #fde68a; border-top: 4px solid #8a3004; border-radius: 12px; padding: 12px; text-align: left; font-size: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #fef3c7;">
                <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 5px 0;">MEMBER ID:</td>
                <td style="text-align: right; font-weight: 900; color: #8a3004; font-family: monospace; font-size: 10px;">${memberId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #fef3c7;">
                <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 5px 0;">EMAIL:</td>
                <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 9px;">${email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #fef3c7;">
                <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 5px 0;">PHONE:</td>
                <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 9px;">${phone}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 5px 0;">ISSUED ON:</td>
                <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 9px;">${issuedDate}</td>
              </tr>
            </table>
          </div>

          <!-- QR Verification Box -->
          <div style="margin-top: 14px; background-color: #fff7ed; border: 1px solid #fde68a; border-radius: 12px; padding: 10px; text-align: center;">
            <img src="${qrUrl}" alt="Scan QR Code to Verify" style="width: 90px; height: 90px; margin: 0 auto; display: block; border-radius: 6px;" />
            <div style="font-size: 8px; font-weight: 800; color: #8a3004; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">Scan to Verify Membership</div>
          </div>
        </div>

        <!-- ID Card Footer -->
        <div style="background-color: #8a3004; color: #fde68a; padding: 8px 12px; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
          Official Volunteer Identity Pass • Non-Transferable
        </div>
      </div>

      <!-- Download / Print ID Card Action Button -->
      <div style="text-align: center; margin-top: 22px; margin-bottom: 12px;">
        <a href="https://www.kesulatrust.org/contact?memberId=${encodeURIComponent(details.id || '')}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #8a3004; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 12px; box-shadow: 0 4px 12px rgba(138,48,4,0.3);">
          🖨️ Download / Print Official Digital ID Card
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 15px;">Welcome aboard to our mission of empowering communities!</p>
      <p style="font-size: 14px; color: #1e293b;">Warm regards,<br/><strong>Kesula Charitable Trust Team</strong></p>
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
    </div>
  </div>
</div>
  `;
};

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
