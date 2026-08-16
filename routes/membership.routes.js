import express from 'express';
import { z } from 'zod';
import { submitMembership, approveMembership, sendWelcomeEmail } from '../controllers/membership.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { emailMemberLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const memberSubmitSchema = z.object({
  fullName: z.string().min(1).trim(),
  email: z.string().email(),
  phone: z.string().min(1).trim(),
  address: z.string().optional(),
  interestArea: z.string().optional(),
  message: z.string().optional()
});

router.post('/submit-member', emailMemberLimiter, validateRequest(memberSubmitSchema), submitMembership);
router.post('/approve-member', approveMembership);
router.post('/send-welcome-email', sendWelcomeEmail);

export default router;
