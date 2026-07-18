import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder',
    });
  }
  return razorpayInstance;
};

export const createOrder = async (options) => {
  const instance = getRazorpayInstance();
  return await instance.orders.create(options);
};

export const verifySignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto.createHmac('sha256', secret).update(body.toString()).digest('hex');
  return expectedSignature === signature;
};
