import express from 'express';
import { z } from 'zod';
import { submitContact } from '../controllers/contact.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { emailEnquiryLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const contactSubmitSchema = z.object({
  name: z.string().min(1).trim(),
  email: z.string().email(),
  phone: z.string().trim().optional(),
  subject: z.string(),
  message: z.string().min(1).trim()
});

router.post('/submit-contact', emailEnquiryLimiter, validateRequest(contactSubmitSchema), submitContact);

export default router;
