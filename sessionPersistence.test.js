// sessionPersistence.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import LoginForm from '../components/LoginForm';
import { AuthProvider, useAuth } from '../context/AuthContext';
import SessionManager from '../utils/SessionManager';

// Mock the session manager
jest.mock('../utils/SessionManager');

// Create test component to access auth context
const LogoutTestComponent = () => {
  const { logout, logoutAllSessions } = useAuth();
  return (
    <div>
      <button onClick={logout}>Logout</button>
      <button onClick={logoutAllSessions}>Logout All Sessions</button>
    </div>
  );
};

// Setup MSW server for API mocking
const server = setupServer(
  rest.post('/api/login', (req, res, ctx) => {
    const { rememberMe } = req.body;
    return res(
      ctx.json({
        success: true,
        token: 'test-token',
        expiresIn: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60 // 7 days or 1 day in seconds
      })
    );
  }),
  
  rest.post('/api/renew-session', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        token: 'renewed-token',
        expiresIn: 7 * 24 * 60 * 60
      })
    );
  }),
  
  rest.post('/api/logout', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),
  
  rest.post('/api/logout-all', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Session Persistence for User Login (US2)', () => {
  test('US2.1: "Remember me" checkbox option appears below password field', () => {
    render(<LoginForm />);
    
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    const passwordField = screen.getByLabelText(/password/i);
    
    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(rememberMeCheckbox).toHaveAttribute('type', 'checkbox');
    
    // Check that the checkbox appears after/below the password field in the DOM
    const formElements = document.body.textContent;
    const passwordIndex = formElements.indexOf('Password');
    const rememberMeIndex = formElements.indexOf('Remember me');
    
    expect(passwordIndex).toBeLessThan(rememberMeIndex);
  });
  
  test('US2.2: When checked, session persists for 7 days using secure HTTP-only cookies', async () => {
    // Reset SessionManager mock
    SessionManager.setSession.mockClear();
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill in login form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberMeCheckbox); // Check "Remember me"
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Verify SessionManager was called with correct parameters
      expect(SessionManager.setSession).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        })
      );
    });
  });
  
  test('US2.3: Session tokens automatically renew upon active usage', async () => {
    // Reset SessionManager mock
    SessionManager.setSession.mockClear();
    SessionManager.getSession.mockImplementation(() => 'test-token');
    
    // Mock the session renewal function
    const mockRenewSession = jest.fn();
    jest.spyOn(global, 'setTimeout');
    
    render(
      <AuthProvider renewSessionFn={mockRenewSession}>
        <div>Test Component</div>
      </AuthProvider>
    );
    
    // Simulate user activity
    fireEvent.click(document.body);
    
    // Verify session renewal was scheduled
    expect(setTimeout).toHaveBeenCalled();
    
    // Manually trigger the renewal function
    const renewalFn = setTimeout.mock.calls[0][0];
    await renewalFn();
    
    // Verify the session was renewed
    expect(mockRenewSession).toHaveBeenCalled();
  });
  
  test('US2.4: Users can manually logout from all sessions', async () => {
    // Reset SessionManager mock
    SessionManager.clearSession.mockClear();
    SessionManager.getSession.mockImplementation(() => 'test-token');
    
    render(
      <AuthProvider>
        <LogoutTestComponent />
      </AuthProvider>
    );
    
    // Find and click the "Logout All Sessions" button
    const logoutAllButton = screen.getByRole('button', { name: /logout all sessions/i });
    fireEvent.click(logoutAllButton);
    
    await waitFor(() => {
      // Verify SessionManager's clearSession was called
      expect(SessionManager.clearSession).toHaveBeenCalled();
    });
  });
});