export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lastLoginAttempt: Date | null;
  lastSuccessfulLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}

export interface RegisterUserData {
  username: string;
  email: string;
  password: string;
}

export interface UserSession {
  userId: number;
  username: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

// For error handling
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  CAPTCHA_REQUIRED = 'CAPTCHA_REQUIRED',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  statusCode: number;
}