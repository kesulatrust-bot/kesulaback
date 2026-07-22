import rateLimit from 'express-rate-limit';

export const createOrderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many requests' } });
export const verifyPaymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many requests' } });
export const emailEnquiryLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Too many requests. Please wait a moment.' } });
export const emailMemberLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Too many requests. Please wait a moment.' } });
export const generalApiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests' } });
