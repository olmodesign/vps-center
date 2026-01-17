import { authService } from './auth.service.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  if (result.requiresTwoFactor) return res.status(200).json({ success: true, requiresTwoFactor: true, message: '2FA verification required' });
  res.status(200).json({ success: true, data: result });
});

export const loginWithTotp = asyncHandler(async (req, res) => {
  const { email, password, totpCode } = req.body;
  const result = await authService.loginWithTotp(email, password, totpCode);
  res.status(200).json({ success: true, data: result });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  res.status(200).json({ success: true, data: result });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(req.user.tokenJti, refreshToken);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ success: true, data: user });
});

export const setupTotp = asyncHandler(async (req, res) => {
  const result = await authService.setupTotp(req.user.id);
  res.status(200).json({ success: true, data: result });
});

export const enableTotp = asyncHandler(async (req, res) => {
  const { totpCode } = req.body;
  await authService.enableTotp(req.user.id, totpCode);
  res.status(200).json({ success: true, message: '2FA enabled successfully' });
});

export const disableTotp = asyncHandler(async (req, res) => {
  const { password, totpCode } = req.body;
  await authService.disableTotp(req.user.id, password, totpCode);
  res.status(200).json({ success: true, message: '2FA disabled successfully' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json({ success: true, message: 'Password changed successfully' });
});
