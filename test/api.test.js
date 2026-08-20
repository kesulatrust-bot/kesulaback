import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server.js';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: () => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [{ id: 'test-uuid-1234', fullName: 'Test User', email: 'test@example.com' }], error: null })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'test-uuid-1234', fullName: 'Test User', email: 'test@example.com' }, error: null }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null })
          }),
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      }),
      storage: {
        from: () => ({
          upload: vi.fn().mockResolvedValue({ data: { path: 'members/test.webp' }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.webp' } })
        })
      }
    })
  };
});

// Mock Resend Email Service
vi.mock('../services/email.service.js', () => {
  return {
    sendMail: vi.fn().mockResolvedValue({ success: true, provider: 'resend', messageId: 'resend_msg_test_123' }),
    sendMemberActiveEmail: vi.fn().mockResolvedValue({ success: true, provider: 'resend', messageId: 'resend_msg_active_123', idCardAttachment: true }),
    sendMemberWelcomeEmail: vi.fn().mockResolvedValue({ success: true, provider: 'resend', messageId: 'resend_msg_welcome_123' }),
    sendPaymentSuccessEmail: vi.fn().mockResolvedValue({ success: true, provider: 'resend', messageId: 'resend_msg_pay_123' }),
    sendEnquiryEmail: vi.fn().mockResolvedValue({ success: true, provider: 'resend', messageId: 'resend_msg_enq_123' })
  };
});

describe('Backend API Tests', () => {
  it('GET /api/ping should return awake', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'awake', service: 'kesula-backend' });
  });

  it('POST /api/submit-contact should return 400 for invalid data', async () => {
    const res = await request(app)
      .post('/api/submit-contact')
      .send({ name: 'Short' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid request data');
  });

  it('POST /api/submit-contact should return 200 for valid data', async () => {
    const res = await request(app)
      .post('/api/submit-contact')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        subject: 'Inquiry',
        message: 'This is a test message that is long enough.'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/submit-member should submit application and trigger Resend email', async () => {
    const res = await request(app)
      .post('/api/submit-member')
      .send({
        fullName: 'Ramesh Kumar',
        email: 'ramesh@example.com',
        phone: '9876543210',
        interestArea: 'Education Support',
        message: 'Happy to contribute.'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.member).toBeDefined();
  });

  it('POST /api/approve-member should approve member and return Resend result', async () => {
    const res = await request(app)
      .post('/api/approve-member')
      .send({
        memberId: 'test-uuid-1234',
        email: 'ramesh@example.com',
        name: 'Ramesh Kumar'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.memberApproved).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.messageId).toBe('resend_msg_active_123');
  });

  it('POST /api/send-welcome-email should trigger Resend welcome email', async () => {
    const res = await request(app)
      .post('/api/send-welcome-email')
      .send({
        email: 'ramesh@example.com',
        name: 'Ramesh Kumar'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.provider).toBe('resend');
    expect(res.body.messageId).toBe('resend_msg_welcome_123');
  });
});
