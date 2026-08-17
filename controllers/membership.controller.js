import { supabase } from '../services/supabase.service.js';
import { sendMemberWelcomeEmail, sendMemberActiveEmail } from '../services/email.service.js';

export const submitMembership = async (req, res, next) => {
  try {
    const { fullName, email, phone, address, interestArea, message } = req.body;
    
    // Insert into Supabase
    const { error } = await supabase.from('members').insert([{ fullName, email, phone, address, interestArea, message, status: 'pending' }]);
    if (error) throw new Error(error.message);

    // Send Email in background (non-blocking)
    sendMemberWelcomeEmail(email, fullName, { interestArea, message }).catch(err => {
      console.error("Background welcome email sending error:", err);
    });
    
    res.json({ success: true });
  } catch (error) {
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

    // Trigger email send asynchronously
    sendMemberActiveEmail(email, name || 'Valued Member', details)
      .then(success => {
        console.log(`[CONTROLLER] Member approval email result for ${email}: ${success ? 'DELIVERED' : 'FAILED'}`);
      })
      .catch(err => {
        console.error("[CONTROLLER] Background member approval email error:", err);
      });

    res.json({ success: true, message: 'Approval notification sent.' });
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
      console.error("Background welcome email sending error:", err);
    });

    res.json({ success: true, message: 'Welcome email triggered.' });
  } catch (error) {
    next(error);
  }
};
