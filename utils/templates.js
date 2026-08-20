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

export const paymentSuccessTemplate = (name, amount, details = {}) => {
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const receiptId = details.receipt || details.orderId || `KCT-DON-${Date.now().toString().slice(-8)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Donation Receipt - Kesula Charitable Trust</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif !important;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px; font-family: Arial, Helvetica, sans-serif !important;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #8a3004; padding: 24px 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="Kesula Logo" width="58" height="58" style="width: 58px; height: 58px; border-radius: 50%; display: block; margin: 0 auto 10px auto; border: 2px solid #fde68a;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif !important;">
                KESULA CHARITABLE TRUST
              </h1>
              <p style="color: #fde68a; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-family: Arial, Helvetica, sans-serif !important;">
                Official Donation Receipt & Appreciation
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 24px 24px 16px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; border: 1px solid #86efac; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif !important;">
                ✓ DONATION RECEIVED SUCCESSFULLY
              </div>
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 22px; font-weight: 800; font-family: Arial, Helvetica, sans-serif !important;">
                Thank You, ${name}!
              </h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 auto 20px auto; max-width: 480px; font-family: Arial, Helvetica, sans-serif !important;">
                We gratefully acknowledge the receipt of your generous contribution of <strong style="color: #8a3004; font-size: 16px;">₹${formattedAmount}</strong> towards tribal welfare, child education, and healthcare initiatives.
              </p>

              <!-- Donation Receipt Summary Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; font-family: Arial, Helvetica, sans-serif !important;">
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Donor Name:</td>
                  <td style="text-align: right; font-weight: 800; color: #0f172a; padding: 6px 0;">${name}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Donation Amount:</td>
                  <td style="text-align: right; font-weight: 900; color: #8a3004; font-size: 15px; padding: 6px 0;">₹${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Receipt Number:</td>
                  <td style="text-align: right; font-weight: 700; font-family: monospace; color: #1e293b; padding: 6px 0;">${receiptId}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Date of Contribution:</td>
                  <td style="text-align: right; font-weight: 600; color: #1e293b; padding: 6px 0;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Tax Exemption:</td>
                  <td style="text-align: right; font-weight: 800; color: #16a34a; padding: 6px 0;">Eligible under Section 80G</td>
                </tr>
              </table>

              <!-- 80G Exemption Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; text-align: left;">
                <tr>
                  <td style="font-size: 12px; color: #9a3412; line-height: 1.5; font-family: Arial, Helvetica, sans-serif !important;">
                    🏛️ <strong>80G Tax Exemption:</strong> All donations to Kesula Charitable Trust are 50% exempt from Income Tax under Section 80G of the Income Tax Act. A formal tax certificate will be processed under Trust registration records.
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #334155; line-height: 1.6; text-align: left; margin: 0; font-family: Arial, Helvetica, sans-serif !important;">
                Your support directly transforms lives across marginalized rural & tribal villages. If you need any assistance, feel free to contact us at <a href="mailto:kesulatrust@gmail.com" style="color: #8a3004; font-weight: bold;">kesulatrust@gmail.com</a>.
              </p>

              <p style="font-size: 13px; color: #1e293b; text-align: left; margin-top: 18px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif !important;">
                Warm regards,<br/>
                <strong>Kesula Charitable Trust Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 18px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; font-family: Arial, Helvetica, sans-serif !important;">
              <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">Boduppal / Chengicherla, Telangana, India • www.kesulatrust.org</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

export const memberWelcomeTemplate = (name, details = {}) => {
  const interest = details.interestArea || details.interest_area || 'Community Volunteer';
  const phone = details.phone || details.phone_number || 'N/A';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Application Received - Kesula Charitable Trust</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif !important;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px; font-family: Arial, Helvetica, sans-serif !important;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #8a3004; padding: 24px 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="Kesula Logo" width="58" height="58" style="width: 58px; height: 58px; border-radius: 50%; display: block; margin: 0 auto 10px auto; border: 2px solid #fde68a;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif !important;">
                KESULA CHARITABLE TRUST
              </h1>
              <p style="color: #fde68a; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-family: Arial, Helvetica, sans-serif !important;">
                Volunteer & Membership Application
              </p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 24px 24px 16px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; border: 1px solid #fcd34d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif !important;">
                ⏳ APPLICATION UNDER REVIEW
              </div>
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 22px; font-weight: 800; font-family: Arial, Helvetica, sans-serif !important;">
                Application Received, ${name}!
              </h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 auto 20px auto; max-width: 480px; font-family: Arial, Helvetica, sans-serif !important;">
                Thank you for applying to join the active volunteer team of <strong>Kesula Charitable Trust</strong>. Your application details have been safely received and forwarded to the Trust Executive Committee for review.
              </p>

              <!-- Application Summary Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; font-size: 12px; font-family: Arial, Helvetica, sans-serif !important;">
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Applicant Name:</td>
                  <td style="text-align: right; font-weight: 800; color: #0f172a; padding: 6px 0;">${name}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Interest Area:</td>
                  <td style="text-align: right; font-weight: 800; color: #8a3004; padding: 6px 0;">${interest}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Contact Number:</td>
                  <td style="text-align: right; font-weight: 600; color: #1e293b; padding: 6px 0;">${phone}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Submission Date:</td>
                  <td style="text-align: right; font-weight: 600; color: #1e293b; padding: 6px 0;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 700; padding: 6px 0; text-transform: uppercase; font-size: 10px;">Status:</td>
                  <td style="text-align: right; font-weight: 800; color: #b45309; padding: 6px 0;">Pending Admin Review</td>
                </tr>
              </table>

              <!-- Next Steps Notice -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; text-align: left;">
                <tr>
                  <td style="font-size: 12px; color: #166534; line-height: 1.6; font-family: Arial, Helvetica, sans-serif !important;">
                    📋 <strong>What Happens Next?</strong><br/>
                    1. Our administration team will review your application details.<br/>
                    2. Once approved, your official <strong>Digital Member ID Card (PDF)</strong> and verification link will be emailed to you immediately.
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #1e293b; text-align: left; margin-top: 18px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif !important;">
                Warm regards,<br/>
                <strong>Kesula Charitable Trust Team</strong><br/>
                <a href="https://kesulatrust.org" target="_blank" style="color: #8a3004; font-weight: bold; text-decoration: none;">www.kesulatrust.org</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 18px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; font-family: Arial, Helvetica, sans-serif !important;">
              <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">Boduppal / Chengicherla, Telangana, India • www.kesulatrust.org</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

export const memberActiveTemplate = (name, details = {}) => {
  const memberId = details.id 
    ? `KCT-${String(details.id).slice(0, 8).toUpperCase()}` 
    : (details.memberId || `KCT-MEM-${Math.floor(100000 + Math.random() * 900000)}`);

  const fullName = details.fullName || details.name || name || 'Valued Member';
  const email = details.email || 'N/A';
  const phone = details.phone || details.phone_number || 'N/A';
  const interest = details.interestArea || details.interest_area || 'Community Volunteer';
  const address = details.address || details.city || 'Telangana, India';
  const rawDate = details.createdAt || details.created_at || details.submittedAt || details.submitted_at;
  const issuedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  // Backend direct download endpoint
  const backendUrl = process.env.API_URL || process.env.VITE_API_URL || 'https://kesulaback-nit5.onrender.com';
  const downloadUrl = `${backendUrl}/api/members/${encodeURIComponent(details.id || memberId)}/id-card/download`;
  const verifyUrl = `https://kesulatrust.org/verify-member?id=${encodeURIComponent(memberId)}&name=${encodeURIComponent(fullName)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}&color=8a3004`;

  // Photo resolution: prefer direct public HTTPS URL, then CID attachment
  const rawPhoto = details.photo_url || details.photoUrl || details.photo || details.publicPhotoUrl || details.avatar_url || '';
  const photoSrc = (rawPhoto && (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://')))
    ? rawPhoto
    : (details.hasPhotoAttachment ? 'cid:memberphoto' : '');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to Kesula Charitable Trust</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif !important; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px; font-family: Arial, Helvetica, sans-serif !important;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #8a3004; padding: 24px 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="Kesula Logo" width="58" height="58" style="width: 58px; height: 58px; border-radius: 50%; display: block; margin: 0 auto 10px auto; border: 2px solid #fde68a;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif !important;">
                KESULA CHARITABLE TRUST
              </h1>
              <p style="color: #fde68a; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-family: Arial, Helvetica, sans-serif !important;">
                Official Membership ID Card & Welcome Pass
              </p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 24px 24px 12px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; border: 1px solid #86efac; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif !important;">
                ✓ MEMBERSHIP APPROVED & ACTIVE
              </div>
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 22px; font-weight: 800; font-family: Arial, Helvetica, sans-serif !important;">
                Welcome, ${fullName}!
              </h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 auto; max-width: 480px; font-family: Arial, Helvetica, sans-serif !important;">
                Congratulations! Your membership application has been approved by the Kesula Charitable Trust administration. Your official verified <strong>Digital Member ID Card</strong> is ready below.
              </p>
            </td>
          </tr>

          <!-- Primary Download Button -->
          <tr>
            <td align="center" style="padding: 12px 20px 22px 20px;">
              <a href="${downloadUrl}" target="_blank" style="display: inline-block; background-color: #d97706; background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff !important; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4); font-family: Arial, Helvetica, sans-serif !important;">
                📥 Download Member ID Card (PDF)
              </a>
            </td>
          </tr>

          <!-- OFFICIAL DIGITAL ID CARD PREVIEW -->
          <tr>
            <td align="center" style="padding: 0 16px 24px 16px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 350px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 2px solid #d97706; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">
                
                <!-- ID Card Header -->
                <tr>
                  <td style="background-color: #8a3004; padding: 12px 14px; text-align: left;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left">
                          <span style="font-size: 12px; font-weight: 900; color: #fde68a; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif !important; display: block;">
                            KESULA TRUST
                          </span>
                          <span style="font-size: 8px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif !important; display: block;">
                            Official Identity Pass
                          </span>
                        </td>
                        <td align="right">
                          <span style="font-size: 8px; font-weight: 800; color: #ffffff; background-color: #16a34a; padding: 3px 9px; border-radius: 9999px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif !important;">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Photo & Name Area -->
                <tr>
                  <td align="center" style="padding: 16px 14px 8px 14px; background-color: #ffffff;">
                    ${photoSrc 
                      ? `<img src="${photoSrc}" alt="${fullName}" width="95" height="115" style="width: 95px; height: 115px; object-fit: cover; display: block; border-radius: 10px; border: 2px solid #8a3004; margin: 0 auto;" />`
                      : `<div style="width: 80px; height: 80px; border-radius: 50%; background-color: #fff7ed; border: 2px solid #d97706; text-align: center; line-height: 80px; font-size: 36px; color: #8a3004; margin: 0 auto;">👤</div>`
                    }
                    <h3 style="font-size: 17px; font-weight: 900; color: #0f172a; margin: 10px 0 2px 0; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif !important;">
                      ${fullName}
                    </h3>
                    <div style="display: inline-block; padding: 3px 12px; border-radius: 9999px; background-color: #8a3004; color: #fde68a; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif !important;">
                      ${interest}
                    </div>
                  </td>
                </tr>

                <!-- Details List -->
                <tr>
                  <td style="padding: 0 14px 14px 14px; background-color: #ffffff;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 10px; font-family: Arial, Helvetica, sans-serif !important;">
                      <tr>
                        <td style="color: #64748b; font-weight: 700; padding: 4px 0; font-size: 9.5px; text-transform: uppercase;">MEMBER ID:</td>
                        <td style="text-align: right; font-weight: 900; color: #8a3004; font-family: monospace; font-size: 11px; padding: 4px 0;">${memberId}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 700; padding: 4px 0; font-size: 9.5px; text-transform: uppercase;">EMAIL:</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 10px; padding: 4px 0; word-break: break-all;">${email}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 700; padding: 4px 0; font-size: 9.5px; text-transform: uppercase;">PHONE:</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 10px; padding: 4px 0;">${phone}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 700; padding: 4px 0; font-size: 9.5px; text-transform: uppercase;">ADDRESS:</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 10px; padding: 4px 0;">${address}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 700; padding: 4px 0; font-size: 9.5px; text-transform: uppercase;">VALIDITY:</td>
                        <td style="text-align: right; font-weight: 700; color: #16a34a; font-size: 10px; padding: 4px 0;">LIFETIME ACTIVE</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 700; padding: 4px 0; font-size: 9.5px; text-transform: uppercase;">ISSUED ON:</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 10px; padding: 4px 0;">${issuedDate}</td>
                      </tr>
                    </table>

                    <!-- QR Code Block -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px; background-color: #fff7ed; border: 1px solid #fde68a; border-radius: 10px; padding: 8px;">
                      <tr>
                        <td align="center">
                          <img src="${qrUrl}" alt="Scan QR" width="75" height="75" style="width: 75px; height: 75px; display: block; border-radius: 6px; margin: 0 auto;" />
                          <span style="font-size: 8px; font-weight: 700; color: #8a3004; text-transform: uppercase; margin-top: 4px; display: block; font-family: Arial, Helvetica, sans-serif !important;">
                            Scan to Verify Member Authenticity
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Card Footer -->
                <tr>
                  <td align="center" style="background-color: #8a3004; color: #fde68a; padding: 8px 10px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif !important;">
                    Official Identity Document • www.kesulatrust.org
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Complete Member Summary Box -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 16px;">
                <tr>
                  <td style="font-size: 12px; color: #334155; line-height: 1.6; font-family: Arial, Helvetica, sans-serif !important;">
                    📎 <strong>Print-Ready PDF Included:</strong> Your official ID card is attached to this email as a PDF (<code>Kesula-Member-${memberId}.pdf</code>).<br/>
                    🔍 <strong>Live Verification Link:</strong> Anyone can verify your credentials anytime at <a href="${verifyUrl}" target="_blank" style="color: #b45309; font-weight: bold; text-decoration: underline;">kesulatrust.org/verify-member</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 18px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; font-family: Arial, Helvetica, sans-serif !important;">
              <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">Boduppal / Chengicherla, Telangana, India • www.kesulatrust.org</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
