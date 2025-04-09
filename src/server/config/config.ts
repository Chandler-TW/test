import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    bcryptSaltRounds: 12,
    rateLimitMaxAttempts: 5,
    rateLimitWindowMs: 60 * 1000, // 1 minute
    failedAttemptsBeforeCaptcha: 3,
  },
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'user_auth',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  security: {
    csrf: {
      enabled: true,
    },
    xss: {
      enabled: true,
    },
  }
};

export default config;