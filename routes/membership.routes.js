import express from 'express';
import { z } from 'zod';
import { 
  submitMembership, 
  approveMembership, 
  sendWelcomeEmail, 
  downloadMemberIdCard, 
  previewMemberIdCard 
} from '../controllers/membership.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { emailMemberLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const memberSubmitSchema = z.object({
  fullName: z.string().min(1).trim(),
  email: z.string().email(),
  phone: z.string().min(1).trim(),
  address: z.string().optional(),
  interestArea: z.string().optional(),
  message: z.string().optional(),
  photoUrl: z.string().optional(),
  photo_url: z.string().optional()
});

router.post('/submit-member', emailMemberLimiter, validateRequest(memberSubmitSchema), submitMembership);
router.post('/approve-member', approveMembership);
router.post('/send-welcome-email', sendWelcomeEmail);

// Direct Member ID Card PDF Download & Preview Endpoints
router.get('/members/:memberId/id-card/download', downloadMemberIdCard);
router.get('/members/:memberId/id-card/preview', previewMemberIdCard);
router.get('/members/:memberId/id-card', downloadMemberIdCard);

export default router;
