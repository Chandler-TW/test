import axios from 'axios';

// Define types for authentication data
export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

class AuthService {
  private API_URL = '/auth';
  
  /**
   * Log in a user with username and password
   * @param credentials - User credentials
   * @returns Promise with auth response
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.API_URL}/login`, {
        username: credentials.username,
        password: credentials.password
      });
      
      // Store the JWT token based on rememberMe preference
      if (credentials.rememberMe) {
        localStorage.setItem('authToken', response.data.token);
      } else {
        sessionStorage.setItem('authToken', response.data.token);
      }
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Log out the current user
   */
  logout(): void {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
  
  /**
   * Check if user is currently logged in
   * @returns boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
  }
  
  /**
   * Get the current authentication token
   * @returns The JWT token if it exists
   */
  getToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  
  /**
   * Get the current authenticated user
   * @returns The user object if it exists
   */
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  /**
   * Handle API errors and provide meaningful messages
   * @param error - Error from API call
   * @returns Error with appropriate message
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with an error status code
      switch (error.response.status) {
        case 401:
          return new Error('Incorrect username or password');
        case 403:
          return new Error('Access forbidden');
        case 429:
          return new Error('Too many login attempts. Please try again later');
        default:
          return new Error('An error occurred while logging in');
      }
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Unable to connect to the server. Please check your internet connection');
    } else {
      // Error setting up the request
      return new Error('An unexpected error occurred');
    }
  }
}

// Create and export a singleton instance
export default new AuthService();