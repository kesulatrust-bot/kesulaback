import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server.js';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: () => ({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })
    })
  };
});

// Mock Nodemailer
vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn().mockResolvedValue(true)
      })
    },
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(true)
    })
  };
});

describe('Backend API Tests', () => {
  it('GET /api/ping should return awake', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'awake' });
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
});
