// errorHandling.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import LoginForm from '../components/LoginForm';
import { AuthProvider } from '../context/AuthContext';

// Mock LoginAttemptTracker
jest.mock('../utils/LoginAttemptTracker', () => ({
  getAttempts: jest.fn(),
  incrementAttempts: jest.fn(),
  resetAttempts: jest.fn(),
}));

import LoginAttemptTracker from '../utils/LoginAttemptTracker';

// Setup MSW server for API mocking
const server = setupServer(
  // Default success response
  rest.post('/api/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        token: 'test-token',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe('Error Handling for User Login (US3)', () => {
  test('US3.1: Clear visual feedback for empty required fields', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Try to submit form without filling any fields
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Check for visual feedback
    await waitFor(() => {
      // Expect visual indicators for empty fields
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Check for error class/styling
      expect(usernameInput).toHaveClass('error'); // Assuming 'error' class is added
      expect(passwordInput).toHaveClass('error');
      
      // Check for error messages
      const errorMessages = screen.getAllByText(/required|cannot be empty/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
  
  test('US3.2: Shows specific error message for Invalid credentials (HTTP 401)', async () => {
    // Override default handler to return 401
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            success: false,
            error: 'Invalid username or password'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // Check for specific 401 error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/invalid username or password/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
  
  test('US3.2: Shows specific error message for Account locked (HTTP 403)', async () => {
    // Override default handler to return 403
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(
          ctx.status(403),
          ctx.json({
            success: false,
            error: 'Account locked. Please contact support.'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'lockeduser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // Check for specific 403 error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/account locked/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
  
  test('US3.2: Shows specific error message for Server errors (HTTP 500)', async () => {
    // Override default handler to return 500
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: 'Server error. Please try again later.'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // Check for specific 500 error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/server error/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
  
  test('US3.3: Error messages display below form with icon indicators', async () => {
    // Override default handler to return error
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            success: false,
            error: 'Invalid username or password'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    await waitFor(() => {
      // Get the error message container
      const errorMessage = screen.getByText(/invalid username or password/i);
      
      // Check location (below the form)
      const form = screen.getByRole('form') || document.querySelector('form');
      expect(form.compareDocumentPosition(errorMessage)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      
      // Check for error icon
      const errorIcon = document.querySelector('.error-icon, .fa-exclamation-circle, [data-icon="exclamation-circle"]');
      expect(errorIcon).toBeInTheDocument();
    });
  });
  
  test('US3.4: Failed login attempts trigger CAPTCHA after 3 tries', async () => {
    // Mock three failed login attempts
    LoginAttemptTracker.getAttempts.mockReturnValue(3);
    
    // Override default handler to return 401
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            success: false,
            error: 'Invalid username or password'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    await waitFor(() => {
      // Check that CAPTCHA is displayed
      const captcha = screen.getByTestId('captcha') || screen.getByLabelText(/captcha/i);
      expect(captcha).toBeInTheDocument();
      
      // Verify increment function was called
      expect(LoginAttemptTracker.incrementAttempts).toHaveBeenCalled();
    });
  });
});