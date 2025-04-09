const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const { act } = require('react-dom/test-utils');
const AppComponent = require('../components/AppComponent');
const AuthService = require('../services/AuthService');
const { useNavigate } = require('react-router-dom');

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
}));

jest.mock('../services/AuthService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  isSessionValid: jest.fn(),
  getSessionData: jest.fn(),
  clearSessionData: jest.fn()
}));

describe('Session Persistence', () => {
  let navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    
    // Mock a valid session by default
    AuthService.isSessionValid.mockReturnValue(true);
    AuthService.getSessionData.mockReturnValue({ 
      user: { id: 1, username: 'testuser' },
      token: 'valid-token'
    });
  });

  // US3.1: Session persists until user clicks "Log Out"
  test('session remains active until user clicks logout', async () => {
    render(<AppComponent />);
    
    // Verify the user is logged in (dashboard is displayed)
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    
    // Find and click logout button
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    
    // Verify logout was called
    expect(AuthService.logout).toHaveBeenCalledTimes(1);
  });

  // US3.2: Session persists until token expiration (backend-managed)
  test('session is validated on app initialization', async () => {
    render(<AppComponent />);
    
    // Check that the session validation was called
    expect(AuthService.isSessionValid).toHaveBeenCalledTimes(1);
    
    // User should be on dashboard since session is valid
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test('redirects to login when session is expired', async () => {
    // Mock an expired session
    AuthService.isSessionValid.mockReturnValue(false);
    
    render(<AppComponent />);
    
    // Validate session check was performed
    expect(AuthService.isSessionValid).toHaveBeenCalledTimes(1);
    
    // User should be redirected to login
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  // US3.3: After logout, redirect to login screen
  test('redirects to login screen after logout', async () => {
    render(<AppComponent />);
    
    // Find and click logout button
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    
    // Verify user is redirected to login
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  // US3.4: After logout, clear session data
  test('clears session data after logout', async () => {
    render(<AppComponent />);
    
    // Find and click logout button
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    
    // Verify session data is cleared
    expect(AuthService.clearSessionData).toHaveBeenCalledTimes(1);
  });

  // Additional test: Session persists across page refreshes
  test('session persists across page refreshes', async () => {
    // First render to simulate initial load
    const { unmount } = render(<AppComponent />);
    
    // Verify user is logged in
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    
    // Unmount to simulate page refresh
    unmount();
    
    // Render again to simulate page reload
    render(<AppComponent />);
    
    // Session should still be valid
    expect(AuthService.isSessionValid).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  // Test for handling token refresh
  test('handles token refresh when session is about to expire', async () => {
    // Mock the token refresh functionality
    const refreshToken = jest.fn().mockResolvedValue({ 
      success: true, 
      data: { token: 'new-token' }
    });
    AuthService.refreshToken = refreshToken;
    
    // Mock that token is about to expire
    AuthService.isTokenAboutToExpire = jest.fn().mockReturnValue(true);
    
    render(<AppComponent />);
    
    // Wait for the token refresh to be triggered
    await waitFor(() => {
      expect(refreshToken).toHaveBeenCalled();
    });
    
    // User should still be on the dashboard
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});