import express from 'express';
import { z } from 'zod';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { createOrderLimiter, verifyPaymentLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const createOrderSchema = z.object({
  amount: z.number().positive(),
  receipt: z.string().optional()
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  amount: z.number().optional()
});

router.post('/create-order', createOrderLimiter, validateRequest(createOrderSchema), createPaymentOrder);
router.post('/verify-payment', verifyPaymentLimiter, validateRequest(verifyPaymentSchema), verifyPayment);

export default router;
