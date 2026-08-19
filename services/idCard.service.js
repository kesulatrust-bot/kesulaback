import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PNG_BACKEND = path.resolve(__dirname, '..', 'public', 'images', 'logo.png');
const LOGO_PNG_FRONTEND = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'images', 'logo.png');
const LOGO_WEBP_FRONTEND = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'images', 'logo.webp');

const getLocalLogoBuffer = () => {
  try {
    if (fs.existsSync(LOGO_PNG_BACKEND)) return fs.readFileSync(LOGO_PNG_BACKEND);
    if (fs.existsSync(LOGO_PNG_FRONTEND)) return fs.readFileSync(LOGO_PNG_FRONTEND);
    if (fs.existsSync(LOGO_WEBP_FRONTEND)) return fs.readFileSync(LOGO_WEBP_FRONTEND);
  } catch (err) {
    console.warn('[ID CARD SERVICE] Could not load local logo:', err.message);
  }
  return null;
};

/**
 * Fetch image buffer from URL or decode base64 Data URI safely
 */
export const getImageBuffer = async (imageSource) => {
  if (!imageSource || typeof imageSource !== 'string') return null;

  try {
    // 1. Handle base64 Data URI
    if (imageSource.startsWith('data:image/')) {
      const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }

    // 2. Handle HTTP/HTTPS URL
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      const response = await fetch(imageSource, { signal: AbortSignal.timeout(6000) });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    }

    // 3. Handle local file path
    if (fs.existsSync(imageSource)) {
      return fs.readFileSync(imageSource);
    }
  } catch (err) {
    console.warn(`[ID CARD SERVICE] Could not load image from source (${imageSource.slice(0, 50)}...):`, err.message);
  }
  return null;
};

/**
 * Generate high-resolution official vector PDF ID card for member
 * @param {Object} member - Member details
 * @returns {Promise<Buffer>} - Generated PDF Buffer
 */
export const generateMemberIdCardPdf = async (member = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const memberId = member.id
        ? `KCT-${String(member.id).slice(0, 8).toUpperCase()}`
        : (member.memberId || `KCT-MEM-${Math.floor(100000 + Math.random() * 900000)}`);

      const name = (member.fullName || member.full_name || member.name || 'Valued Member').toUpperCase();
      const email = member.email || 'N/A';
      const phone = member.phone || member.phone_number || 'N/A';
      const interest = (member.interestArea || member.interest_area || 'Community Volunteer').toUpperCase();
      const rawDate = member.createdAt || member.created_at || member.submittedAt || member.submitted_at;
      const issuedDate = rawDate
        ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      const photoSource = member.photoUrl || member.photo_url || member.photo || member.avatar_url || '';
      const photoBuffer = await getImageBuffer(photoSource);
      const logoBuffer = getLocalLogoBuffer();

      // Verification URL for QR code
      const verifyUrl = `https://www.kesulatrust.org/verify-member?id=${encodeURIComponent(memberId)}&name=${encodeURIComponent(name)}`;
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
          dark: '#8a3004',
          light: '#ffffff'
        }
      });

      // A4 page setup in portrait (595.28 x 841.89 points)
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: 36,
        info: {
          Title: `Kesula Charitable Trust ID Card - ${memberId}`,
          Author: 'Kesula Charitable Trust',
          Subject: `Official Verified Membership Pass for ${name}`,
          Keywords: 'Kesula, Member Pass, ID Card, Volunteer'
        }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // ----------------------------------------------------
      // DOCUMENT HEADER (PRINTABLE SHEET)
      // ----------------------------------------------------
      doc.rect(0, 0, 595.28, 40).fill('#8a3004');
      doc.fillColor('#fcd34d')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('KESULA CHARITABLE TRUST', 36, 14, { align: 'left' });
      
      doc.fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica')
        .text('OFFICIAL VERIFIED MEMBERSHIP IDENTITY PASS', 36, 16, { align: 'right' });

      doc.fillColor('#64748b')
        .fontSize(8.5)
        .font('Helvetica')
        .text('Print this official document on thick paper / PVC card stock. Cut along the dashed guide lines.', 36, 52, { align: 'center' });

      // ----------------------------------------------------
      // CARD DIMENSIONS (Standard Badge Size: 240 x 360 points)
      // Placed side-by-side on A4 sheet: Front Card & Back Card
      // ----------------------------------------------------
      const cardWidth = 236;
      const cardHeight = 360;
      const cardY = 78;
      const frontX = 48;
      const backX = 312;

      // ----------------------------------------------------
      // 1. FRONT CARD
      // ----------------------------------------------------
      // Cut border
      doc.rect(frontX - 2, cardY - 2, cardWidth + 4, cardHeight + 4)
        .dash(4, { space: 3 })
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke()
        .undash();

      // Card Background
      doc.roundedRect(frontX, cardY, cardWidth, cardHeight, 14)
        .fillAndStroke('#fffdfa', '#fde68a');

      // Top Header Bar
      doc.roundedRect(frontX, cardY, cardWidth, 46, 14)
        .fill('#8a3004');
      doc.rect(frontX, cardY + 24, cardWidth, 22)
        .fill('#8a3004'); // square off bottom corners of header

      // Gold accent line under header
      doc.rect(frontX, cardY + 46, cardWidth, 2).fill('#fcd34d');

      // Logo in header
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, frontX + 10, cardY + 8, { width: 30, height: 30 });
        } catch (e) {
          // Fallback text
        }
      }

      doc.fillColor('#fcd34d')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('KESULA TRUST', frontX + 46, cardY + 11);

      doc.fillColor('#fef3c7')
        .fontSize(6.5)
        .font('Helvetica')
        .text('OFFICIAL IDENTITY PASS', frontX + 46, cardY + 24);

      // Verified Badge Pill (Top Right)
      doc.roundedRect(frontX + cardWidth - 64, cardY + 14, 54, 16, 8)
        .fillAndStroke('#059669', '#6ee7b7');
      doc.fillColor('#ffffff')
        .fontSize(6.5)
        .font('Helvetica-Bold')
        .text('VERIFIED', frontX + cardWidth - 64, cardY + 18, { width: 54, align: 'center' });

      // Member Photo Frame (Centered: 86 x 108 pt)
      const photoWidth = 86;
      const photoHeight = 108;
      const photoX = frontX + (cardWidth - photoWidth) / 2;
      const photoY = cardY + 58;

      // Outer gold/terracotta border
      doc.roundedRect(photoX - 3, photoY - 3, photoWidth + 6, photoHeight + 6, 10)
        .fillAndStroke('#fff7ed', '#8a3004');

      if (photoBuffer) {
        try {
          doc.save();
          doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 8).clip();
          doc.image(photoBuffer, photoX, photoY, {
            width: photoWidth,
            height: photoHeight,
            fit: [photoWidth, photoHeight],
            align: 'center',
            valign: 'center'
          });
          doc.restore();
        } catch (imgErr) {
          console.warn('[ID CARD SERVICE] Error drawing photo buffer:', imgErr.message);
          drawAvatarFallback(doc, photoX, photoY, photoWidth, photoHeight);
        }
      } else {
        drawAvatarFallback(doc, photoX, photoY, photoWidth, photoHeight);
      }

      // Member Name
      const nameY = photoY + photoHeight + 8;
      doc.fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(name, frontX + 8, nameY, { width: cardWidth - 16, align: 'center', ellipsis: true });

      // Interest Area Badge
      const badgeY = nameY + 16;
      doc.roundedRect(frontX + 28, badgeY, cardWidth - 56, 14, 7)
        .fill('#8a3004');
      doc.fillColor('#fcd34d')
        .fontSize(6.5)
        .font('Helvetica-Bold')
        .text(interest, frontX + 28, badgeY + 3.5, { width: cardWidth - 56, align: 'center', ellipsis: true });

      // Member Details Box
      const boxY = badgeY + 20;
      const boxHeight = 88;
      doc.roundedRect(frontX + 10, boxY, cardWidth - 20, boxHeight, 6)
        .fillAndStroke('#ffffff', '#fde68a');

      // Top border highlight
      doc.rect(frontX + 10, boxY, cardWidth - 20, 2).fill('#8a3004');

      const drawDetailRow = (label, value, yPos, isLast = false) => {
        doc.fillColor('#64748b')
          .fontSize(6.5)
          .font('Helvetica-Bold')
          .text(label, frontX + 16, yPos);

        doc.fillColor('#1e293b')
          .fontSize(7)
          .font(label === 'MEMBER ID:' ? 'Helvetica-Bold' : 'Helvetica')
          .text(value, frontX + 70, yPos, { width: cardWidth - 92, align: 'right', ellipsis: true });

        if (!isLast) {
          doc.rect(frontX + 14, yPos + 12, cardWidth - 28, 0.5).fill('#fef3c7');
        }
      };

      drawDetailRow('MEMBER ID:', memberId, boxY + 8);
      drawDetailRow('EMAIL:', email, boxY + 24);
      drawDetailRow('PHONE:', phone, boxY + 40);
      drawDetailRow('ISSUED ON:', issuedDate, boxY + 56, true);

      // Card Bottom Bar
      doc.roundedRect(frontX, cardY + cardHeight - 20, cardWidth, 20, 14)
        .fill('#8a3004');
      doc.rect(frontX, cardY + cardHeight - 20, cardWidth, 10)
        .fill('#8a3004'); // square off top of footer
      doc.fillColor('#fde68a')
        .fontSize(6.5)
        .font('Helvetica-Bold')
        .text('OFFICIAL VOLUNTEER IDENTITY PASS', frontX, cardY + cardHeight - 14, { width: cardWidth, align: 'center' });

      // ----------------------------------------------------
      // 2. BACK CARD (TERMS, QR CODE & VERIFICATION)
      // ----------------------------------------------------
      // Cut border
      doc.rect(backX - 2, cardY - 2, cardWidth + 4, cardHeight + 4)
        .dash(4, { space: 3 })
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke()
        .undash();

      // Back Card Background
      doc.roundedRect(backX, cardY, cardWidth, cardHeight, 14)
        .fillAndStroke('#fffdfa', '#fde68a');

      // Back Header Bar
      doc.roundedRect(backX, cardY, cardWidth, 40, 14)
        .fill('#8a3004');
      doc.rect(backX, cardY + 20, cardWidth, 20)
        .fill('#8a3004');

      doc.fillColor('#fcd34d')
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .text('KESULA CHARITABLE TRUST', backX, cardY + 11, { width: cardWidth, align: 'center' });
      doc.fillColor('#fef3c7')
        .fontSize(6.5)
        .font('Helvetica')
        .text('DIGITAL MEMBERSHIP VERIFICATION', backX, cardY + 24, { width: cardWidth, align: 'center' });

      // QR Code Container
      const qrBoxSize = 110;
      const qrBoxX = backX + (cardWidth - qrBoxSize) / 2;
      const qrBoxY = cardY + 48;

      doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 22, 10)
        .fillAndStroke('#ffffff', '#fde68a');

      doc.image(qrBuffer, qrBoxX + 10, qrBoxY + 8, { width: 90, height: 90 });

      doc.fillColor('#8a3004')
        .fontSize(6.5)
        .font('Helvetica-Bold')
        .text('SCAN TO VERIFY PASS', qrBoxX, qrBoxY + 102, { width: qrBoxSize, align: 'center' });

      // Terms Box
      const termsY = qrBoxY + qrBoxSize + 28;
      const termsHeight = 114;
      doc.roundedRect(backX + 10, termsY, cardWidth - 20, termsHeight, 8)
        .fillAndStroke('#fff7ed', '#fde68a');

      doc.fillColor('#8a3004')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('TERMS & GUIDELINES', backX + 16, termsY + 8);
      doc.rect(backX + 16, termsY + 18, cardWidth - 32, 1).fill('#fde68a');

      const guidelines = [
        '• Certifies official volunteer status with Kesula Trust.',
        '• Non-transferable identity pass for verified community work.',
        '• Always carry this pass during trust initiatives & drives.',
        '• If found, please return to Head Office, Telangana.',
        '• Website: www.kesulatrust.org | Helpline: +91 94939 88366'
      ];

      let guideY = termsY + 24;
      guidelines.forEach((g) => {
        doc.fillColor('#475569')
          .fontSize(6)
          .font('Helvetica')
          .text(g, backX + 16, guideY, { width: cardWidth - 32, lineGap: 1.5 });
        guideY += 15;
      });

      // Back Bottom Bar
      doc.roundedRect(backX, cardY + cardHeight - 20, cardWidth, 20, 14)
        .fill('#8a3004');
      doc.rect(backX, cardY + cardHeight - 20, cardWidth, 10)
        .fill('#8a3004');
      doc.fillColor('#fde68a')
        .fontSize(6.5)
        .font('Helvetica-Bold')
        .text('WWW.KESULATRUST.ORG', backX, cardY + cardHeight - 14, { width: cardWidth, align: 'center' });

      // ----------------------------------------------------
      // FOOTER INSTRUCTIONS ON A4 SHEET
      // ----------------------------------------------------
      const sheetFooterY = 460;
      doc.roundedRect(36, sheetFooterY, 523.28, 90, 8)
        .fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('📋 Member ID Card Printing & Usage Instructions:', 48, sheetFooterY + 10);

      const printInstructions = [
        '1. Direct Download: Keep this digital PDF saved on your smartphone for instant digital verification.',
        '2. Hard Copy Print: Print in 100% actual scale (do not fit to page) on 300 GSM photo paper or PVC ID card printer.',
        '3. Lamination: Cut both Front and Back along dashed guides, glue back-to-back, and laminate with 250-micron pouch.',
        '4. Verification: Anyone can scan the QR code using any smartphone camera to verify your official active membership.'
      ];

      let instrY = sheetFooterY + 26;
      printInstructions.forEach((inst) => {
        doc.fillColor('#475569')
          .fontSize(7.5)
          .font('Helvetica')
          .text(inst, 48, instrY, { width: 500 });
        instrY += 14;
      });

      // Security watermark in bottom corner
      doc.fillColor('#94a3b8')
        .fontSize(7)
        .text(`Issued securely by Kesula Charitable Trust System • Member ID: ${memberId} • Verified On: ${issuedDate}`, 36, 810, { width: 523.28, align: 'center' });

      doc.end();
    } catch (error) {
      console.error('[ID CARD SERVICE] Fatal generation error:', error);
      reject(error);
    }
  });
};

/**
 * Clean vector silhouette avatar fallback for PDF
 */
function drawAvatarFallback(doc, x, y, width, height) {
  doc.roundedRect(x, y, width, height, 8).fill('#fff7ed');
  // Head
  doc.circle(x + width / 2, y + 36, 20).fill('#8a3004');
  // Shoulders
  doc.save();
  doc.roundedRect(x, y, width, height, 8).clip();
  doc.circle(x + width / 2, y + 100, 42).fill('#8a3004');
  doc.restore();
}
