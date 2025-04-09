import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import authService from '../services/authService';
import { LoginCredentials, AuthError } from '../models/User';
import config from '../config/config';

export class AuthController {
  /**
   * Login user and generate authentication token
   * 
   * @route POST /api/auth/login
   * @param req - Express request object
   * @param res - Express response object
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          error: 'Validation error', 
          details: errors.array() 
        });
        return;
      }
      
      const credentials: LoginCredentials = {
        username: req.body.username,
        password: req.body.password,
        rememberMe: req.body.rememberMe === true
      };
      
      // Attempt login
      const result = await authService.login(credentials);
      
      // Set JWT as HTTP-only cookie
      const cookieOptions = {
        maxAge: credentials.rememberMe 
          ? config.auth.cookieMaxAge 
          : undefined, // Session cookie if not remember me
        httpOnly: config.cookies.httpOnly,
        secure: config.cookies.secure,
        sameSite: config.cookies.sameSite as 'strict' | 'lax' | 'none'
      };
      
      res.cookie('auth_token', result.token, cookieOptions);
      
      // Send success response
      res.status(200).json({ 
        success: true,
        user: result.user,
        redirectUrl: req.body.redirectUrl || '/dashboard'
      });
      
    } catch (error) {
      // Handle authentication errors
      const authError = error as AuthError;
      
      if (authError.type) {
        res.status(authError.statusCode).json({
          success: false,
          error: authError.type,
          message: authError.message
        });
        return;
      }
      
      // Unexpected error
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.'
      });
    }
  }
  
  /**
   * Logout user by clearing auth cookie
   * 
   * @route POST /api/auth/logout
   * @param req - Express request object
   * @param res - Express response object
   */
  public async logout(req: Request, res: Response): Promise<void> {
    // Clear the authentication cookie
    res.clearCookie('auth_token', {
      httpOnly: config.cookies.httpOnly,
      secure: config.cookies.secure,
      sameSite: config.cookies.sameSite as 'strict' | 'lax' | 'none'
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
  
  /**
   * Verify current session is valid
   * 
   * @route GET /api/auth/validate-session
   * @param req - Express request object
   * @param res - Express response object
   */
  public async validateSession(req: Request, res: Response): Promise<void> {
    try {
      // The middleware already validated the token, so if we get here, session is valid
      // We just need to send the user data back
      if (req.user) {
        res.status(200).json({
          success: true,
          isAuthenticated: true,
          user: req.user
        });
      } else {
        res.status(401).json({
          success: false,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Session validation error:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.'
      });
    }
  }
}

export default new AuthController();