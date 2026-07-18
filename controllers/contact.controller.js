import { supabase } from '../services/supabase.service.js';
import { sendEnquiryEmail } from '../services/email.service.js';

export const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Insert into Supabase
    const { error } = await supabase.from('contact_messages').insert([{ name, email, phone, subject, message }]);
    if (error) throw new Error(error.message);

    // Send Email
    await sendEnquiryEmail(email, name, { subject, message, phone });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
