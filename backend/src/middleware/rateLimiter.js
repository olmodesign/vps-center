import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMax,
  message: { success: false, error: 'Too many login attempts', code: 'LOGIN_RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const totpLimiter = rateLimit({
  windowMs: 300000,
  max: 5,
  message: { success: false, error: 'Too many verification attempts', code: 'TOTP_RATE_LIMIT' },
});
