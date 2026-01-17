import { Router } from 'express';
import { login, loginWithTotp, refreshToken, logout, getCurrentUser, setupTotp, enableTotp, disableTotp, changePassword } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { loginLimiter, totpLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema, loginWithTotpSchema, refreshTokenSchema, enableTotpSchema, disableTotpSchema, changePasswordSchema } from './auth.schema.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/login/2fa', loginLimiter, totpLimiter, validate(loginWithTotpSchema), loginWithTotp);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/2fa/setup', authenticate, setupTotp);
router.post('/2fa/enable', authenticate, totpLimiter, validate(enableTotpSchema), enableTotp);
router.post('/2fa/disable', authenticate, totpLimiter, validate(disableTotpSchema), disableTotp);
router.post('/password/change', authenticate, validate(changePasswordSchema), changePassword);

export default router;
