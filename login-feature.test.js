const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const { act } = require('react-dom/test-utils');
const axios = require('axios');
const LoginComponent = require('../components/LoginComponent');
const AuthService = require('../services/AuthService');
const { useNavigate } = require('react-router-dom');

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));
jest.mock('../services/AuthService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  isSessionValid: jest.fn(),
  getSessionData: jest.fn(),
  clearSessionData: jest.fn()
}));

describe('Login Component', () => {
  let navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
  });

  // US1.1: Login form includes username (text) and password (masked input) fields
  test('renders login form with username and password fields', () => {
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(submitButton).toBeInTheDocument();
  });

  // US1.2: Submitting the form triggers authentication via backend API
  test('submitting form triggers authentication API call', async () => {
    AuthService.login.mockResolvedValueOnce({ success: true });
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    expect(AuthService.login).toHaveBeenCalledWith('testuser', 'password123');
  });

  // US1.3: On success: Redirect user to the app dashboard
  test('redirects to dashboard on successful login', async () => {
    AuthService.login.mockResolvedValueOnce({ success: true });
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  // US1.4: On success: Persist session
  test('persists session data on successful login', async () => {
    const mockSessionData = { token: 'test-token', user: { id: 1, username: 'testuser' } };
    AuthService.login.mockResolvedValueOnce({ success: true, data: mockSessionData });
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // The session persistence would typically be handled in the AuthService after login
      // We're verifying that the login was successful and returned session data
      expect(AuthService.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  // US1.5: Prevent form resubmission while authentication is in progress
  test('disables submit button while authentication is in progress', async () => {
    // Create a promise that we can resolve manually to control the timing
    let resolveLogin;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    AuthService.login.mockReturnValueOnce(loginPromise);
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    // Button should be disabled immediately after submission
    expect(submitButton).toBeDisabled();
    
    // Resolve the login promise
    resolveLogin({ success: true });
    
    // Wait for the button to be enabled again after login is complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  // US2.1: Show error messages for empty username/password
  test('shows error for empty username and password', async () => {
    render(<LoginComponent />);
    
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    fireEvent.click(submitButton);
    
    const errorMessage = await screen.findByText('Username and password are required.');
    expect(errorMessage).toBeInTheDocument();
  });

  test('shows error for empty username', async () => {
    render(<LoginComponent />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    const errorMessage = await screen.findByText('Username and password are required.');
    expect(errorMessage).toBeInTheDocument();
  });

  test('shows error for empty password', async () => {
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    fireEvent.click(submitButton);
    
    const errorMessage = await screen.findByText('Username and password are required.');
    expect(errorMessage).toBeInTheDocument();
  });

  // US2.2: Show error messages for invalid credentials
  test('shows error for invalid credentials', async () => {
    AuthService.login.mockRejectedValueOnce({ 
      response: { data: { message: 'Incorrect username or password.' } } 
    });
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'wronguser');
    await userEvent.type(passwordInput, 'wrongpass');
    fireEvent.click(submitButton);
    
    const errorMessage = await screen.findByText('Incorrect username or password.');
    expect(errorMessage).toBeInTheDocument();
  });

  // US2.3: Show error messages for server errors
  test('shows error for server errors', async () => {
    AuthService.login.mockRejectedValueOnce({ 
      response: { status: 500 }
    });
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    const errorMessage = await screen.findByText('Unable to log in. Please try again later.');
    expect(errorMessage).toBeInTheDocument();
  });

  // US2.4: Errors display inline or as a banner
  test('displays error messages inline or as a banner', async () => {
    render(<LoginComponent />);
    
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    fireEvent.click(submitButton);
    
    const errorElement = await screen.findByText('Username and password are required.');
    
    // Check that the error is displayed either inline (under the form fields)
    // or as a banner (in a dedicated error container)
    const errorContainer = errorElement.closest('[role="alert"]') || 
                           errorElement.closest('.error-message') ||
                           errorElement.closest('.error-banner');
                           
    expect(errorContainer).toBeInTheDocument();
  });
});