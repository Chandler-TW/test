import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../LoginForm';
import { login } from '../../services/authService';

// Mocking the auth service
jest.mock('../../services/authService');

describe('Error Handling in Login Form', () => {
  // Setup common test data
  const validUsername = 'testuser';
  const validPassword = 'Password123';
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // AC1: Display clear error messages for different HTTP status codes
  test('displays error message for invalid credentials (HTTP 401)', async () => {
    login.mockRejectedValueOnce({ 
      status: 401, 
      message: 'Invalid username or password' 
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Verify error message is displayed
    const errorMessage = await screen.findByText(/invalid username or password/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('displays error message for server unavailable (HTTP 500)', async () => {
    login.mockRejectedValueOnce({ 
      status: 500, 
      message: 'Server error' 
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Verify error message is displayed
    const errorMessage = await screen.findByText(/server error|server unavailable|try again later/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('displays error message for network errors', async () => {
    login.mockRejectedValueOnce(new Error('Network Error'));

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Verify error message is displayed
    const errorMessage = await screen.findByText(/network error|connection problem|check your connection/i);
    expect(errorMessage).toBeInTheDocument();
  });

  // AC2: Error messages persist until user starts modifying form fields
  test('error messages persist until user modifies form fields', async () => {
    login.mockRejectedValueOnce({ 
      status: 401, 
      message: 'Invalid username or password' 
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Verify error message is displayed
    const errorMessage = await screen.findByText(/invalid username or password/i);
    expect(errorMessage).toBeInTheDocument();
    
    // Error should still be visible before modifying fields
    expect(errorMessage).toBeInTheDocument();
    
    // After modifying username, error should be cleared
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    
    // Wait for error message to be removed from the DOM
    await waitFor(() => {
      expect(screen.queryByText(/invalid username or password/i)).not.toBeInTheDocument();
    });
  });

  // AC3: Failed login attempts show generic message
  test('failed login shows generic error message for security', async () => {
    // Test with both 401 and 403 status codes
    login.mockRejectedValueOnce({ 
      status: 401, 
      message: 'User not found' // This specific message should not be shown to user
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Verify generic error message is displayed, not the specific one
    const errorMessage = await screen.findByText(/invalid username or password/i);
    expect(errorMessage).toBeInTheDocument();
    expect(screen.queryByText(/user not found/i)).not.toBeInTheDocument();
  });
});