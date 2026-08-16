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
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Non-blocking email send so API responds immediately (200 OK)
    sendMemberActiveEmail(email, name || 'Valued Member').catch(err => {
      console.error("Background active email sending error:", err);
    });

    res.json({ success: true, message: 'Approval notification sent.' });
  } catch (error) {
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
