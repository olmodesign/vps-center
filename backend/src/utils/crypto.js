import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';

export const hashPassword = async (password) => bcrypt.hash(password, config.bcryptRounds);
export const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

export const generateAccessToken = (payload) => {
  return jwt.sign({ ...payload, jti: uuidv4(), type: 'access' }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiry });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign({ ...payload, jti: uuidv4(), type: 'refresh' }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });
};

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    if (decoded.type !== 'access') throw new Error('Invalid token type');
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

export const decodeToken = (token) => jwt.decode(token);

export const generateTOTPSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `${config.totp.issuer}:${email}`,
    issuer: config.totp.issuer,
    length: 32,
  });
  return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
};

export const generateQRCode = async (otpauthUrl) => QRCode.toDataURL(otpauthUrl);

export const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: config.totp.window });
};

export const generateUUID = () => uuidv4();
