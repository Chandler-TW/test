import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { 
  User, 
  LoginCredentials, 
  UserResponse, 
  LoginResponse, 
  UserSession,
  AuthErrorType,
  AuthError
} from '../models/User';
import { db } from '../database/connection';

/**
 * Auth Service to handle all authentication related operations
 */
export class AuthService {
  
  /**
   * Login a user with credentials
   * 
   * @param credentials - User login credentials 
   */
  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { username, password, rememberMe } = credentials;
    
    try {
      // In a real app, replace this with actual database query
      // This is a simulation
      const user = await this.findUserByUsername(username);
      
      if (!user) {
        throw this.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS, 
          'Invalid username or password',
          401
        );
      }
      
      if (!user.isActive) {
        throw this.createAuthError(
          AuthErrorType.ACCOUNT_LOCKED, 
          'Your account has been locked. Please contact support.',
          403
        );
      }
      
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(user.id);
        
        // Check if we need to show CAPTCHA
        if (user.failedLoginAttempts >= config.auth.failedAttemptsBeforeCaptcha - 1) {
          throw this.createAuthError(
            AuthErrorType.CAPTCHA_REQUIRED,
            'Please complete the CAPTCHA to continue',
            401
          );
        }
        
        throw this.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Invalid username or password',
          401
        );
      }
      
      // Reset failed attempts
      await this.resetFailedLoginAttempts(user.id);
      
      // Update last successful login
      await this.updateLastSuccessfulLogin(user.id);
      
      // Create session data
      const sessionData: UserSession = {
        userId: user.id,
        username: user.username
      };
      
      // Create token with configurable expiration
      const expiresIn = rememberMe 
        ? '7d'  // 7 days if remember me is checked
        : config.auth.jwtExpiresIn;
      
      const token = jwt.sign(
        sessionData,
        config.auth.jwtSecret,
        { expiresIn }
      );
      
      // Format user response (exclude sensitive data)
      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive
      };
      
      return {
        user: userResponse,
        token
      };
      
    } catch (error) {
      if ((error as AuthError).type) {
        throw error;
      }
      
      // Generic server error
      throw this.createAuthError(
        AuthErrorType.SERVER_ERROR,
        'An unexpected error occurred. Please try again later.',
        500
      );
    }
  }
  
  /**
   * Validate JWT token and return user session
   * 
   * @param token - JWT token to validate
   */
  public async validateToken(token: string): Promise<UserSession> {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as UserSession;
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  /**
   * Hash password using bcrypt
   * 
   * @param password - Plain text password
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.auth.bcryptSaltRounds);
  }
  
  /**
   * Create standard auth error object
   */
  private createAuthError(type: AuthErrorType, message: string, statusCode: number): AuthError {
    return {
      type,
      message,
      statusCode
    };
  }
  
  /**
   * Find user by username (simulated)
   * In a real app, this would query a database
   */
  private async findUserByUsername(username: string): Promise<User | null> {
    // Simulated DB response - in a real app, this would query the database
    if (username === 'testuser') {
      return {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        // Hashed version of 'password123'
        password: '$2a$12$9VVVvuFgcLtGHxorwf9FSuoqcKNuLx.9UtB0LFz3y8kVJFzI9YY0.',
        isActive: true,
        failedLoginAttempts: 0,
        lastLoginAttempt: null,
        lastSuccessfulLogin: new Date('2023-01-01'),
        createdAt: new Date('2022-01-01'),
        updatedAt: new Date('2022-01-01')
      };
    }
    
    return null;
  }
  
  /**
   * Increment failed login attempts (simulated)
   */
  private async incrementFailedLoginAttempts(userId: number): Promise<void> {
    // In a real app, this would update a database record
    console.log(`Incrementing failed attempts for user ${userId}`);
  }
  
  /**
   * Reset failed login attempts (simulated)
   */
  private async resetFailedLoginAttempts(userId: number): Promise<void> {
    // In a real app, this would update a database record
    console.log(`Resetting failed attempts for user ${userId}`);
  }
  
  /**
   * Update last successful login timestamp (simulated)
   */
  private async updateLastSuccessfulLogin(userId: number): Promise<void> {
    // In a real app, this would update a database record
    console.log(`Updating last successful login for user ${userId}`);
  }
}

export default new AuthService();