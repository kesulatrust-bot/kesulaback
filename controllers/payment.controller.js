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

export const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }
    
    const signature = req.headers['x-razorpay-signature'];
    const bodyString = JSON.stringify(req.body);
    
    // In express, req.body is already parsed, but Razorpay webhook verification expects raw body.
    // For a robust implementation, it's best to verify using the actual signature.
    import('crypto').then(crypto => {
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(bodyString).digest('hex');
      if (expectedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
      
      const event = req.body.event;
      if (event === 'payment.captured' || event === 'order.paid') {
        // Payment successful - backend fallback logic
        const paymentData = req.body.payload.payment.entity;
        // In a real scenario, you'd mark the order as paid in Supabase here.
        console.log('Webhook received successful payment:', paymentData.id);
      }
      
      res.status(200).json({ status: 'ok' });
    });
  } catch (error) {
    next(error);
  }
};
