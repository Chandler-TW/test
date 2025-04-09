import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import authService from '../services/authService';

// Mock the auth service
jest.mock('../services/authService', () => ({
  login: jest.fn(),
}));

// Mock the navigate function from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('LoginForm Component', () => {
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Wrap component with router for testing
  const renderLoginForm = (props = {}) => {
    return render(
      <BrowserRouter>
        <LoginForm {...props} />
      </BrowserRouter>
    );
  };

  // Test 1: Form renders with all required elements
  test('renders login form with all fields and buttons', () => {
    renderLoginForm();
    
    // Check for form elements
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  // Test 2: Validation for empty fields
  test('shows validation errors when submitting empty form', async () => {
    renderLoginForm();
    
    // Submit form without entering any data
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    // Check for validation error messages
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    
    // Verify login was not called
    expect(authService.login).not.toHaveBeenCalled();
  });

  // Test 3: Submitting form with valid data
  test('submits the form with valid credentials', async () => {
    // Setup mock for successful login
    const mockLoginSuccess = { token: 'fake-token', user: { id: '1', username: 'testuser' } };
    (authService.login as jest.Mock).mockResolvedValueOnce(mockLoginSuccess);
    
    // Setup success callback mock
    const onLoginSuccessMock = jest.fn();
    
    renderLoginForm({ onLoginSuccess: onLoginSuccessMock, redirectPath: '/dashboard' });
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByLabelText(/remember me/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    // Verify the service was called with correct parameters
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
        rememberMe: true,
      });
    });
    
    // Verify success callback was called
    await waitFor(() => {
      expect(onLoginSuccessMock).toHaveBeenCalled();
    });
  });

  // Test 4: Handling login error
  test('shows error message when login fails', async () => {
    // Setup mock for failed login
    const mockError = new Error('Incorrect username or password');
    (authService.login as jest.Mock).mockRejectedValueOnce(mockError);
    
    renderLoginForm();
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    // Verify error message is displayed
    expect(await screen.findByText(/incorrect username or password/i)).toBeInTheDocument();
  });

  // Test 5: Button state during login
  test('disables submit button during login process', async () => {
    // Setup a delayed login response to test loading state
    (authService.login as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ token: 'token' }), 100))
    );
    
    renderLoginForm();
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    // Button should be disabled and show loading text
    expect(screen.getByText(/logging in.../i)).toBeInTheDocument();
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
    
    // After login completes, button should be enabled again
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled();
    });
  });
});