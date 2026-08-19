// Email Templates for Kesula Charitable Trust

const LOGO_URL = "https://kesulatrust.org/images/logo.png";

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
  const rawDate = details.createdAt || details.created_at || details.submittedAt || details.submitted_at;
  const issuedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  // Backend direct download endpoint
  const backendUrl = process.env.API_URL || process.env.VITE_API_URL || 'https://kesulaback-kg86.onrender.com';
  const downloadUrl = `${backendUrl}/api/members/${encodeURIComponent(details.id || memberId)}/id-card/download`;
  const verifyUrl = `https://www.kesulatrust.org/verify-member?id=${encodeURIComponent(memberId)}&name=${encodeURIComponent(name)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&color=8a3004`;

  // Photo resolution: prefer CID if attached, then public HTTPS URL
  const photoSrc = details.hasPhotoAttachment ? 'cid:memberphoto' : (details.publicPhotoUrl || details.photoUrl || details.photo_url || '');

  return `
<div style="${baseStyles}">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #fffaf0; padding: 24px 20px; border-bottom: 2px solid #fde68a;">
              <img src="${LOGO_URL}" alt="Kesula Charitable Trust" width="55" height="55" style="width: 55px; height: 55px; border-radius: 9999px; display: block; margin: 0 auto 10px auto;" />
              <h1 style="color: #8a3004; margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Kesula Charitable Trust</h1>
              <p style="color: #b45309; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em;">Official Member Onboarding</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 30px 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em;">
                  🎉 Membership Approved
                </span>
                <h2 style="color: #0f172a; margin: 14px 0 6px 0; font-size: 22px; font-weight: 800;">Welcome to the Family, ${name}!</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                  We are delighted to confirm that your membership application has been officially verified and approved. Your official verified identity pass is ready.
                </p>
              </div>

              <!-- ID CARD PREVIEW (Email-Safe Table Layout) -->
              <table role="presentation" align="center" width="310" border="0" cellspacing="0" cellpadding="0" style="max-width: 310px; width: 100%; margin: 20px auto; background-color: #fffdfa; border: 2px solid #fde68a; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 24px rgba(138,48,4,0.12);">
                
                <!-- Card Header -->
                <tr>
                  <td style="background-color: #8a3004; padding: 12px 14px; border-bottom: 2px solid #fcd34d;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left">
                          <div style="font-size: 11px; font-weight: 900; color: #fcd34d; text-transform: uppercase; letter-spacing: 0.05em;">KESULA TRUST</div>
                          <div style="font-size: 7.5px; color: #fef3c7; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Member Identity Pass</div>
                        </td>
                        <td align="right">
                          <span style="font-size: 7.5px; font-weight: 800; color: #ffffff; background-color: #059669; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #6ee7b7;">VERIFIED</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Card Body (Photo & Info) -->
                <tr>
                  <td align="center" style="padding: 16px 14px 10px 14px;">
                    
                    <!-- Member Photo Frame -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px auto;">
                      <tr>
                        <td align="center" valign="middle" style="width: 90px; height: 115px; background-color: #fff7ed; border: 2px solid #8a3004; border-radius: 12px; overflow: hidden; padding: 2px;">
                          ${photoSrc 
                            ? `<img src="${photoSrc}" alt="${name}" width="90" height="115" style="width: 90px; height: 115px; object-fit: cover; display: block; border-radius: 8px;" />` 
                            : `<div style="font-size: 38px; line-height: 115px; color: #8a3004; text-align: center;">👤</div>`}
                        </td>
                      </tr>
                    </table>

                    <h3 style="font-size: 16px; font-weight: 900; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase;">${name}</h3>
                    <div style="display: inline-block; padding: 3px 12px; border-radius: 9999px; background-color: #8a3004; color: #fcd34d; font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
                      ${interest}
                    </div>

                    <!-- Details Table inside card -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #fde68a; border-top: 3px solid #8a3004; border-radius: 10px; padding: 8px 10px; font-size: 9px;">
                      <tr>
                        <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 4px 0; border-bottom: 1px solid #fef3c7;">MEMBER ID:</td>
                        <td style="text-align: right; font-weight: 900; color: #8a3004; font-family: monospace; font-size: 9.5px; padding: 4px 0; border-bottom: 1px solid #fef3c7;">${memberId}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 4px 0; border-bottom: 1px solid #fef3c7;">EMAIL:</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 8.5px; padding: 4px 0; border-bottom: 1px solid #fef3c7;">${email}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 4px 0; border-bottom: 1px solid #fef3c7;">PHONE:</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 8.5px; padding: 4px 0; border-bottom: 1px solid #fef3c7;">${phone}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 800; font-size: 8px; text-transform: uppercase; padding: 4px 0;">ISSUED ON:</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 8.5px; padding: 4px 0;">${issuedDate}</td>
                      </tr>
                    </table>

                    <!-- QR Code Box -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px; background-color: #fff7ed; border: 1px solid #fde68a; border-radius: 10px; padding: 8px;">
                      <tr>
                        <td align="center">
                          <img src="${qrUrl}" alt="Scan QR Code to Verify" width="80" height="80" style="width: 80px; height: 80px; display: block; border-radius: 6px;" />
                          <div style="font-size: 7.5px; font-weight: 800; color: #8a3004; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">Scan with Phone to Verify Membership</div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Card Footer -->
                <tr>
                  <td align="center" style="background-color: #8a3004; color: #fde68a; padding: 7px 10px; font-size: 7.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
                    Official Volunteer Identity Pass • Non-Transferable
                  </td>
                </tr>
              </table>

              <!-- DOWNLOAD CALL TO ACTION -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #8a3004; box-shadow: 0 4px 14px rgba(138,48,4,0.35);">
                          <a href="${downloadUrl}" target="_blank" style="display: inline-block; padding: 15px 30px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 800; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 12px;">
                            📥 DOWNLOAD OFFICIAL ID CARD (PDF)
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment & Verification Help Notice -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 15px 0;">
                <tr>
                  <td style="font-size: 12px; color: #475569; line-height: 1.5;">
                    📎 <strong>Attachment Included:</strong> Your official print-ready ID card is also attached to this email as a PDF (<code>Kesula-Member-${memberId}.pdf</code>).<br/>
                    🔍 <strong>Live Verification:</strong> Anyone can verify your active volunteer status anytime at <a href="${verifyUrl}" target="_blank" style="color: #8a3004; font-weight: 700; text-decoration: underline;">kesulatrust.org/verify-member</a>.
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #1e293b; margin-top: 25px; line-height: 1.5;">
                Warm regards,<br/>
                <strong>Kesula Charitable Trust Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Boduppal / Chengicherla, Telangana, India • www.kesulatrust.org</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
      <p style="text-align: center;"><a href="https://kesulatrust.org/admin" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Log in to Admin Dashboard</a></p>
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. System Generated Email.</p>
    </div>
  </div>
</div>
`;
};
