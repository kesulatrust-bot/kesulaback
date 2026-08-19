import { supabase } from '../services/supabase.service.js';
import { sendMemberWelcomeEmail, sendMemberActiveEmail } from '../services/email.service.js';
import { generateMemberIdCardPdf } from '../services/idCard.service.js';

export const submitMembership = async (req, res, next) => {
  try {
    const { fullName, email, phone, address, interestArea, message, photoUrl, photo_url } = req.body;
    const finalPhoto = photoUrl || photo_url || '';
    const cleanPhone = String(phone || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanPhone || !fullName) {
      return res.status(400).json({ error: 'Full name, email, and phone number are required.' });
    }

    // Check for existing phone number
    const { data: existingPhone } = await supabase
      .from('members')
      .select('id')
      .eq('phone', cleanPhone)
      .limit(1);

    if (existingPhone && existingPhone.length > 0) {
      return res.status(409).json({ error: 'A membership application has already been submitted with this phone number.' });
    }
    
    // Ensure photo_url is a clean storage bucket URL, never raw base64
    let finalPublicPhotoUrl = '';
    if (finalPhoto && finalPhoto.startsWith('http')) {
      finalPublicPhotoUrl = finalPhoto;
    } else if (finalPhoto && finalPhoto.startsWith('data:image/')) {
      try {
        const matches = finalPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.includes('webp') ? 'webp' : 'png';
          const filePath = `members/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('images')
            .upload(filePath, buffer, { contentType: mimeType, upsert: false });
          if (!upErr) {
            const { data: pData } = supabase.storage.from('images').getPublicUrl(filePath);
            finalPublicPhotoUrl = pData?.publicUrl || '';
          }
        }
      } catch (e) {
        console.warn('[CONTROLLER] Could not save base64 to storage bucket:', e.message);
      }
    }

    // Insert into Supabase
    const payload = { fullName, email: cleanEmail, phone: cleanPhone, address, interestArea, message, status: 'pending' };
    if (finalPublicPhotoUrl) payload.photo_url = finalPublicPhotoUrl;

    let { data, error } = await supabase.from('members').insert([payload]).select();
    if (error) {
      // Fallback if photo_url column does not exist
      if (error.message && (error.message.includes('photo_url') || error.message.includes('photoUrl'))) {
        delete payload.photo_url;
        const retry = await supabase.from('members').insert([payload]).select();
        if (retry.error) throw new Error(retry.error.message);
        data = retry.data;
      } else {
        throw new Error(error.message);
      }
    }

    // Send Email in background (non-blocking)
    sendMemberWelcomeEmail(cleanEmail, fullName, { interestArea, message, phone: cleanPhone, address }).catch(err => {
      console.error("[CONTROLLER] Background welcome email sending error:", err);
    });
    
    const memberRecord = (data && data.length > 0) ? data[0] : payload;
    res.json({
      success: true,
      message: 'Membership application submitted successfully.',
      member: memberRecord
    });
  } catch (error) {
    console.error('[CONTROLLER] Exception in submitMembership:', error);
    next(error);
  }
};

export const approveMembership = async (req, res, next) => {
  try {
    const { email, name, memberDetails, memberId } = req.body;
    console.log(`[CONTROLLER] approveMembership called for email: "${email}", name: "${name}"`);
    
    if (!email) {
      console.warn('[CONTROLLER] Email missing in request body.');
      return res.status(400).json({ error: 'Email is required' });
    }

    const details = memberDetails || { memberId, name, email, ...req.body };

    // Trigger email send asynchronously with full error tracking
    sendMemberActiveEmail(email, name || 'Valued Member', details)
      .then(emailResult => {
        console.log(`[CONTROLLER] Member approval email result for ${email}:`, {
          success: emailResult.success,
          idCardAttachment: emailResult.idCardAttachment,
          photoAttached: emailResult.photoAttached,
          messageId: emailResult.messageId
        });
      })
      .catch(err => {
        console.error("[CONTROLLER] Background member approval email error:", err);
      });

    res.json({
      success: true,
      memberApproved: true,
      message: 'Membership approval processed and notification dispatched.'
    });
  } catch (error) {
    console.error('[CONTROLLER] Exception in approveMembership:', error);
    next(error);
  }
};

export const sendWelcomeEmail = async (req, res, next) => {
  try {
    const { email, name, details } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    sendMemberWelcomeEmail(email, name || 'Applicant', details || {}).catch(err => {
      console.error("[CONTROLLER] Background welcome email sending error:", err);
    });

    res.json({ success: true, message: 'Welcome email triggered.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct file download endpoint for official Member ID Card PDF
 * GET /api/members/:memberId/id-card/download
 */
export const downloadMemberIdCard = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID parameter is required' });
    }

    console.log(`[DOWNLOAD] Requesting ID card PDF for memberId: "${memberId}"`);

    // Lookup member in Supabase
    let member = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);

    if (isUuid) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();
      if (!error && data) member = data;
    } else {
      const cleanId = memberId.replace(/^KCT-/i, '').toLowerCase();
      const { data, error } = await supabase
        .from('members')
        .select('*');
      if (!error && Array.isArray(data)) {
        member = data.find(m => 
          m.id === memberId || 
          (m.id && String(m.id).toLowerCase().startsWith(cleanId)) ||
          (m.memberId && m.memberId.toLowerCase() === memberId.toLowerCase())
        );
      }
    }

    if (!member) {
      console.warn(`[DOWNLOAD] Member not found for identifier: ${memberId}, generating fallback verified pass.`);
      member = {
        fullName: req.query.name || 'Kesula Volunteer',
        id: memberId,
        interestArea: 'Community Volunteer',
        createdAt: new Date().toISOString()
      };
    }

    // Generate the official PDF Buffer
    const pdfBuffer = await generateMemberIdCardPdf(member);

    const formattedMemberId = member.id 
      ? `KCT-${String(member.id).slice(0, 8).toUpperCase()}` 
      : (member.memberId || 'KCT-PASS');

    const filename = `Kesula-Member-${formattedMemberId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[DOWNLOAD] Error generating/downloading member ID card:', error);
    next(error);
  }
};

/**
 * Preview endpoint for in-browser PDF viewing
 * GET /api/members/:memberId/id-card/preview
 */
export const previewMemberIdCard = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID parameter is required' });
    }

    let member = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);

    if (isUuid) {
      const { data, error } = await supabase.from('members').select('*').eq('id', memberId).single();
      if (!error && data) member = data;
    } else {
      const cleanId = memberId.replace(/^KCT-/i, '').toLowerCase();
      const { data, error } = await supabase.from('members').select('*');
      if (!error && Array.isArray(data)) {
        member = data.find(m => m.id === memberId || (m.id && String(m.id).toLowerCase().startsWith(cleanId)));
      }
    }

    if (!member) {
      return res.status(404).json({ error: 'Member record not found.' });
    }

    const pdfBuffer = await generateMemberIdCardPdf(member);
    const formattedMemberId = member.id ? `KCT-${String(member.id).slice(0, 8).toUpperCase()}` : 'KCT-PASS';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Kesula-Member-${formattedMemberId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Service-role photo upload endpoint (bypasses RLS safely)
 * POST /api/upload-photo
 */
export const uploadMemberPhoto = async (req, res, next) => {
  try {
    const { imageBase64, mimeType = 'image/webp', folder = 'members' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 data is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/i, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const ext = mimeType.includes('png') ? 'png' : (mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'webp');
    const filePath = `${folder}/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;

    console.log(`[SERVICE ROLE UPLOAD] Uploading photo to images/${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[SERVICE ROLE UPLOAD ERROR]:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filePath);
    return res.json({
      success: true,
      publicUrl: publicUrlData?.publicUrl,
      filePath
    });
  } catch (error) {
    console.error('[SERVICE ROLE UPLOAD EXCEPTION]:', error);
    next(error);
  }
};
