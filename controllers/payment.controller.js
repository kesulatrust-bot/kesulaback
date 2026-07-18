import { createOrder, verifySignature } from '../services/payment.service.js';
import { sendPaymentSuccessEmail } from '../services/email.service.js';
import { supabase } from '../services/supabase.service.js';

export const createPaymentOrder = async (req, res, next) => {
  try {
    const { amount, receipt } = req.body;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`
    };
    const order = await createOrder(options);
    res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder' });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, name, amount } = req.body;
    
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (isValid) {
      // Save donation record to Supabase
      const { error: dbError } = await supabase
        .from('donations')
        .insert([{
          name,
          email,
          amount,
          razorpay_order_id,
          razorpay_payment_id
        }]);

      if (dbError) {
        console.error('Error saving donation to Supabase database:', dbError);
      }

      if (email && name) {
        sendPaymentSuccessEmail(email, name, amount).catch(err => {
          console.error("Background payment success email sending error:", err);
        });
      }
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    next(error);
  }
};
