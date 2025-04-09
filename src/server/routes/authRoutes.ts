import express from 'express';
import authController from '../controllers/authController';
import { 
  loginRateLimiter, 
  validateLoginInput, 
  authenticateJWT 
} from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login user and get auth token
 * @access Public
 */
router.post(
  '/login',
  loginRateLimiter,
  validateLoginInput,
  authController.login
);

/**
 * @route POST /api/auth/logout
 * @desc Logout and clear auth token
 * @access Public
 */
router.post('/logout', authController.logout);

/**
 * @route GET /api/auth/validate-session
 * @desc Check if current session is valid
 * @access Protected
 */
router.get(
  '/validate-session',
  authenticateJWT,
  authController.validateSession
);

export default router;