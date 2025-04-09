import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginForm from '../LoginForm';
import Dashboard from '../Dashboard';
import { ToastProvider, useToasts } from '../../context/ToastContext';
import { login, validateToken } from '../../services/authService';
import { AuthProvider } from '../../context/AuthContext';

// Mock the necessary modules and services
jest.mock('../../services/authService');
jest.mock('../../context/ToastContext', () => {
  const actual = jest.requireActual('../../context/ToastContext');
  return {
    ...actual,
    useToasts: jest.fn()
  };
});

// Mock Cookies
const mockCookies = {};
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
  configurable: true
});

describe('Successful Login Flow', () => {
  // Setup common test data
  const validUsername = 'testuser';
  const validPassword = 'Password123';
  const userDisplayName = 'Test User';
  const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0';
  const addToast = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    document.cookie = '';
    
    // Setup toast mock
    useToasts.mockReturnValue({ addToast });
    
    // Setup default login success response
    login.mockResolvedValue({
      token: mockJwtToken,
      user: {
        id: '123',
        username: validUsername,
        displayName: userDisplayName
      }
    });
    
    // Setup token validation mock
    validateToken.mockResolvedValue({
      isValid: true,
      user: {
        id: '123',
        username: validUsername,
        displayName: userDisplayName
      }
    });
  });
  
  // Utility function to render the component with router
  const renderWithRouter = (ui, { route = '/' } = {}) => {
    return render(
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/" element={ui} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    );
  };

  // AC1: Store JWT token in secure HTTP-only cookie
  test('successful login stores JWT token in secure HTTP-only cookie', async () => {
    let documentCookie = '';
    
    // Mock document.cookie setter to capture the set cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
      set: jest.fn((value) => {
        documentCookie = value;
      }),
      get: jest.fn(() => documentCookie),
    });

    renderWithRouter(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(validUsername, validPassword);
    });
    
    // Check if the cookie is set with the right attributes
    await waitFor(() => {
      expect(document.cookie.set).toHaveBeenCalled();
      expect(documentCookie).toContain('token=');
      expect(documentCookie).toContain('HttpOnly');
      expect(documentCookie).toContain('Secure');
      expect(documentCookie).toContain('SameSite=Strict');
    });
  });

  // AC2: Redirect to /dashboard page
  test('successful login redirects to dashboard page', async () => {
    renderWithRouter(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Check if we're on the dashboard page
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  // AC3: Display welcome toast notification with user's display name
  test('successful login displays welcome toast with user display name', async () => {
    renderWithRouter(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith(
        expect.stringContaining(`Welcome, ${userDisplayName}`),
        { type: 'success' }
      );
    });
  });

  // AC4: Login state persists across page refreshes via token validation
  test('login state persists across page refreshes via token validation', async () => {
    // First simulate a login to set the token
    renderWithRouter(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    fireEvent.change(passwordInput, { target: { value: validPassword } });
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Wait for login to complete
    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
    
    // Cleanup and re-render to simulate a page refresh
    document.cookie = `token=${mockJwtToken}; path=/; HttpOnly; Secure; SameSite=Strict`;
    
    // Create a new render to simulate a page refresh
    renderWithRouter(<Dashboard />);
    
    // Verify token validation was called
    await waitFor(() => {
      expect(validateToken).toHaveBeenCalled();
    });
    
    // Check if user is still logged in by looking for user-specific content
    await waitFor(() => {
      expect(screen.getByText(new RegExp(userDisplayName, 'i'))).toBeInTheDocument();
    });
  });
});