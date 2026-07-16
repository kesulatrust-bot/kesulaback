import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendPaymentSuccessEmail, sendMemberWelcomeEmail, sendMemberActiveEmail } from './mailer.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder',
});

// Endpoint to create a Razorpay order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Endpoint to verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      email,
      name,
      amount
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment successful, send email
      if (email && name) {
        await sendPaymentSuccessEmail(email, name, amount);
      }
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Endpoint to send member welcome email
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, name, details } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    const { sendMemberWelcomeEmail } = await import('./mailer.js');
    const sent = await sendMemberWelcomeEmail(email, name, details);
    if (sent) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to send member active email
app.post('/api/send-active-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    const sent = await sendMemberActiveEmail(email, name);
    if (sent) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending active email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to send enquiry email
app.post('/api/send-enquiry-email', async (req, res) => {
  try {
    const { email, name, details } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    // Import dynamically or ensure it's imported at top. We will import at top.
    const { sendEnquiryEmail } = await import('./mailer.js');
    const sent = await sendEnquiryEmail(email, name, details);
    if (sent) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending enquiry email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
