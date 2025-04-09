const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const { act } = require('react-dom/test-utils');
const LoginComponent = require('../components/LoginComponent');
const AppComponent = require('../components/AppComponent');
const AuthService = require('../services/AuthService');
const { useNavigate, MemoryRouter } = require('react-router-dom');

jest.mock('axios');
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useNavigate: jest.fn(),
    BrowserRouter: ({ children }) => children,
  };
});

jest.mock('../services/AuthService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  isSessionValid: jest.fn(),
  getSessionData: jest.fn(),
  clearSessionData: jest.fn(),
  refreshToken: jest.fn()
}));

describe('Login Feature Integration Tests', () => {
  let navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
  });

  // Test for complete login flow
  test('complete login flow with successful authentication', async () => {
    // Mock a successful login
    AuthService.login.mockResolvedValueOnce({ 
      success: true,
      data: { token: 'test-token', user: { id: 1, username: 'testuser' } }
    });
    
    // Mock that session becomes valid after login
    AuthService.isSessionValid.mockReturnValue(false); // Initially false
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    // Fill in the form
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Verify API was called with correct credentials
    expect(AuthService.login).toHaveBeenCalledWith('testuser', 'password123');
    
    // Verify user is redirected to dashboard
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  // Test for validation failures before API call
  test('prevents API call when validation fails', async () => {
    render(<LoginComponent />);
    
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    // Submit without entering credentials
    fireEvent.click(submitButton);
    
    // Verify error is displayed
    const errorMessage = await screen.findByText('Username and password are required.');
    expect(errorMessage).toBeInTheDocument();
    
    // Verify API was not called
    expect(AuthService.login).not.toHaveBeenCalled();
  });

  // Test for entire workflow from login to logout
  test('full user workflow: login, session persistence, and logout', async () => {
    // Set up for initial app state (not logged in)
    AuthService.isSessionValid.mockReturnValue(false);
    
    // Render app in a memory router
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppComponent />
      </MemoryRouter>
    );
    
    // Should be on login page
    const loginForm = screen.getByRole('form', { name: /login/i });
    expect(loginForm).toBeInTheDocument();
    
    // Set up for successful login
    AuthService.login.mockResolvedValueOnce({ 
      success: true,
      data: { token: 'test-token', user: { id: 1, username: 'testuser' } }
    });
    
    // Fill in login form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    // Mock that user is now logged in
    AuthService.isSessionValid.mockReturnValue(true);
    AuthService.getSessionData.mockReturnValue({ 
      user: { id: 1, username: 'testuser' },
      token: 'test-token'
    });
    
    // Re-render to simulate navigation to dashboard
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppComponent />
        </MemoryRouter>
      );
    });
    
    // Should be on dashboard now
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    
    // Find and click logout button
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    
    // Verify logout was called and session was cleared
    expect(AuthService.logout).toHaveBeenCalledTimes(1);
    expect(AuthService.clearSessionData).toHaveBeenCalledTimes(1);
  });

  // Test for error state persistence across navigation
  test('error messages are cleared on navigation', async () => {
    // Set up for login error
    AuthService.login.mockRejectedValueOnce({ 
      response: { data: { message: 'Incorrect username or password.' } } 
    });
    
    render(<LoginComponent />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    
    // Try to log in with incorrect credentials
    await userEvent.type(usernameInput, 'wronguser');
    await userEvent.type(passwordInput, 'wrongpass');
    fireEvent.click(submitButton);
    
    // Verify error is displayed
    const errorMessage = await screen.findByText('Incorrect username or password.');
    expect(errorMessage).toBeInTheDocument();
    
    // Clear the form and try again with correct credentials
    await userEvent.clear(usernameInput);
    await userEvent.clear(passwordInput);
    
    // Prepare for successful login
    AuthService.login.mockResolvedValueOnce({ success: true });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);
    
    // Verify error is no longer displayed
    await waitFor(() => {
      expect(screen.queryByText('Incorrect username or password.')).not.toBeInTheDocument();
    });
  });

  // Test for session timeouts
  test('handles session timeout and returns to login screen', async () => {
    // Initially session is valid
    AuthService.isSessionValid.mockReturnValue(true);
    AuthService.getSessionData.mockReturnValue({ 
      user: { id: 1, username: 'testuser' },
      token: 'test-token'
    });
    
    // Render app
    render(<AppComponent />);
    
    // Should be on dashboard
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    
    // Simulate session timeout/expiration
    act(() => {
      // Trigger the session timeout handler by simulating a session check
      const sessionTimeoutHandler = AuthService.isSessionValid.mock.calls[0][0];
      if (typeof sessionTimeoutHandler === 'function') {
        // If the first call includes a callback function, call it
        sessionTimeoutHandler();
      } else {
        // Otherwise simulate expiry by changing the mock return value
        AuthService.isSessionValid.mockReturnValue(false);
      }
    });
    
    // Re-render to simulate session check
    render(<AppComponent />);
    
    // Verify redirect to login
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});