import { supabase } from '../services/supabase.service.js';
import { sendMemberWelcomeEmail } from '../services/email.service.js';

export const submitMembership = async (req, res, next) => {
  try {
    const { fullName, email, phone, address, interestArea, message } = req.body;
    
    // Insert into Supabase
    const { error } = await supabase.from('members').insert([{ fullName, email, phone, address, interestArea, message, status: 'pending' }]);
    if (error) throw new Error(error.message);

    // Send Email
    await sendMemberWelcomeEmail(email, fullName, { interestArea, message });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
