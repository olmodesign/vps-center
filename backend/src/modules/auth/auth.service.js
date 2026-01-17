import { query } from '../../config/database.js';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, generateTOTPSecret, generateQRCode, verifyTOTP, decodeToken } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/errorHandler.js';

class AuthService {
  async login(email, password) {
    const result = await query('SELECT id, email, password_hash, role, totp_enabled, totp_secret FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    if (user.totp_enabled) return { requiresTwoFactor: true, userId: user.id };
    return this.generateTokens(user);
  }

  async loginWithTotp(email, password, totpCode) {
    const result = await query('SELECT id, email, password_hash, role, totp_enabled, totp_secret FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    if (user.totp_enabled) {
      const isValidTotp = verifyTOTP(user.totp_secret, totpCode);
      if (!isValidTotp) throw new AppError('Invalid 2FA code', 401, 'INVALID_TOTP');
    }
    return this.generateTokens(user);
  }

  async generateTokens(user) {
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    logger.info('User logged in', { userId: user.id, email: user.email });
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, totpEnabled: user.totp_enabled } };
  }

  async refreshAccessToken(refreshToken) {
    const { valid, decoded } = verifyRefreshToken(refreshToken);
    if (!valid) throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');

    const blacklistResult = await query('SELECT id FROM token_blacklist WHERE token_jti = $1', [decoded.jti]);
    if (blacklistResult.rows.length > 0) throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');

    const userResult = await query('SELECT id, email, role, totp_enabled FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0) throw new AppError('User not found', 401, 'USER_NOT_FOUND');

    await this.blacklistToken(decoded.jti, new Date(decoded.exp * 1000));
    return this.generateTokens(userResult.rows[0]);
  }

  async logout(accessTokenJti, refreshToken) {
    const decoded = decodeToken(refreshToken);
    if (decoded) await this.blacklistToken(decoded.jti, new Date(decoded.exp * 1000));
  }

  async blacklistToken(jti, expiresAt) {
    await query('INSERT INTO token_blacklist (token_jti, expires_at) VALUES ($1, $2) ON CONFLICT (token_jti) DO NOTHING', [jti, expiresAt]);
  }

  async setupTotp(userId) {
    const userResult = await query('SELECT email, totp_enabled FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (userResult.rows[0].totp_enabled) throw new AppError('2FA is already enabled', 400, 'TOTP_ALREADY_ENABLED');

    const { secret, otpauthUrl } = generateTOTPSecret(userResult.rows[0].email);
    await query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, userId]);
    const qrCode = await generateQRCode(otpauthUrl);
    return { secret, qrCode };
  }

  async enableTotp(userId, totpCode) {
    const userResult = await query('SELECT totp_secret, totp_enabled FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (userResult.rows[0].totp_enabled) throw new AppError('2FA is already enabled', 400, 'TOTP_ALREADY_ENABLED');
    if (!userResult.rows[0].totp_secret) throw new AppError('2FA setup not initiated', 400, 'TOTP_NOT_SETUP');

    const isValid = verifyTOTP(userResult.rows[0].totp_secret, totpCode);
    if (!isValid) throw new AppError('Invalid 2FA code', 400, 'INVALID_TOTP');

    await query('UPDATE users SET totp_enabled = true WHERE id = $1', [userId]);
    logger.info('2FA enabled', { userId });
    return { success: true };
  }

  async disableTotp(userId, password, totpCode) {
    const userResult = await query('SELECT password_hash, totp_secret, totp_enabled FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (!userResult.rows[0].totp_enabled) throw new AppError('2FA is not enabled', 400, 'TOTP_NOT_ENABLED');

    const isValidPassword = await verifyPassword(password, userResult.rows[0].password_hash);
    if (!isValidPassword) throw new AppError('Invalid password', 401, 'INVALID_PASSWORD');

    const isValidTotp = verifyTOTP(userResult.rows[0].totp_secret, totpCode);
    if (!isValidTotp) throw new AppError('Invalid 2FA code', 401, 'INVALID_TOTP');

    await query('UPDATE users SET totp_enabled = false, totp_secret = NULL WHERE id = $1', [userId]);
    logger.info('2FA disabled', { userId });
    return { success: true };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const isValid = await verifyPassword(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');

    const newHash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    logger.info('Password changed', { userId });
    return { success: true };
  }

  async getCurrentUser(userId) {
    const result = await query('SELECT id, email, role, totp_enabled, last_login, created_at FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    const user = result.rows[0];
    return { id: user.id, email: user.email, role: user.role, totpEnabled: user.totp_enabled, lastLogin: user.last_login, createdAt: user.created_at };
  }
}

export const authService = new AuthService();
export default authService;
