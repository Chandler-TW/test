import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

interface LoginFormProps {
  // Optional props that can be passed to the component
  onLoginSuccess?: () => void;
  redirectPath?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  redirectPath = '/dashboard'
}) => {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    password: ''
  });

  const navigate = useNavigate();

  /**
   * Validate form inputs before submission
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    const errors = {
      username: !username ? 'Username is required' : '',
      password: !password ? 'Password is required' : ''
    };
    
    setValidationErrors(errors);
    return !errors.username && !errors.password;
  };

  /**
   * Handle form submission
   * @param e - Form event
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.login({
        username,
        password,
        rememberMe
      });
      
      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
      // Redirect to the specified path
      navigate(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <h2>Log In</h2>
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-required="true"
            aria-invalid={!!validationErrors.username}
            aria-describedby={validationErrors.username ? "username-error" : undefined}
          />
          {validationErrors.username && (
            <div id="username-error" className="validation-error">
              {validationErrors.username}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-required="true"
            aria-invalid={!!validationErrors.password}
            aria-describedby={validationErrors.password ? "password-error" : undefined}
          />
          {validationErrors.password && (
            <div id="password-error" className="validation-error">
              {validationErrors.password}
            </div>
          )}
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe">Remember Me</label>
        </div>
        
        <button 
          type="submit" 
          className="login-button" 
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      {/* Additional links could be included here based on open questions in PRD */}
      <div className="additional-options">
        <a href="/forgot-password">Forgot Password?</a>
      </div>
    </div>
  );
};

export default LoginForm;