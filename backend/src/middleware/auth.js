import { verifyAccessToken } from '../utils/crypto.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access token required', code: 'TOKEN_REQUIRED' });
    }

    const token = authHeader.split(' ')[1];
    const { valid, decoded } = verifyAccessToken(token);

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'TOKEN_INVALID' });
    }

    const blacklistResult = await query(
      'SELECT id FROM token_blacklist WHERE token_jti = $1 AND expires_at > NOW()',
      [decoded.jti]
    );

    if (blacklistResult.rows.length > 0) {
      return res.status(401).json({ success: false, error: 'Token has been revoked', code: 'TOKEN_REVOKED' });
    }

    const userResult = await query('SELECT id, email, role, totp_enabled FROM users WHERE id = $1', [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    req.user = { ...userResult.rows[0], tokenJti: decoded.jti };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ success: false, error: 'Authentication failed', code: 'AUTH_ERROR' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' });
  next();
};
