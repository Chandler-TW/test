import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { body } from 'express-validator';
import { UserSession } from '../models/User';
import config from '../config/config';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

/**
 * Authentication middleware for protecting routes
 * 
 * Verifies the JWT token and sets req.user if valid
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookies or Authorization header
  const token = 
    req.cookies?.auth_token || 
    req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'UNAUTHORIZED',
      message: 'Authentication required' 
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret) as UserSession;
    
    // Set user info in request object
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * CSRF protection middleware
 * Double submit cookie pattern
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.headers['x-csrf-token'];
  
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({
      success: false,
      error: 'CSRF_ERROR',
      message: 'CSRF validation failed'
    });
  }
  
  next();
};

/**
 * Rate limiting middleware for login attempts
 * Limits login attempts to 5 per minute per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: config.auth.rateLimitWindowMs, // 1 minute
  max: config.auth.rateLimitMaxAttempts, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMITED',
    message: 'Too many login attempts. Please try again later.'
  }
});

/**
 * Login form validation middleware
 */
export const validateLoginInput = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Password complexity validation middleware for registration
 */
export const validatePasswordComplexity = 
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least 1 uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least 1 number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least 1 special character');