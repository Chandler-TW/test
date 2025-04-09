import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import authService from '../services/authService';

interface LocationState {
  from?: {
    pathname: string;
  };
}

/**
 * Container component for the login page
 * Handles redirection after login success
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination if redirected from a protected route
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/dashboard';
  
  // If already authenticated, redirect to the intended destination
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate(from);
    }
  }, [from, navigate]);
  
  /**
   * Handler for successful login
   */
  const handleLoginSuccess = () => {
    console.log('Login successful, redirecting to:', from);
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>
        
        <LoginForm 
          onLoginSuccess={handleLoginSuccess}
          redirectPath={from}
        />
      </div>
    </div>
  );
};

export default LoginPage;