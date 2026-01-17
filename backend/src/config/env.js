import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3100,
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  totp: {
    issuer: process.env.TOTP_ISSUER || 'VPS-Center',
    window: parseInt(process.env.TOTP_WINDOW, 10) || 1,
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3101',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
    loginWindowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 300000,
  },
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@localhost',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
};

export default config;
