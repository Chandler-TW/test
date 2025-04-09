// postLoginFlow.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import Dashboard from '../components/Dashboard';
import Navigation from '../components/Navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import SessionManager from '../utils/SessionManager';

// Mock the session manager
jest.mock('../utils/SessionManager');

// Create a wrapper component to access router information
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

// Create a wrapper component to simulate app with routing
const AppWrapper = ({ initialEntries = ['/login'] }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Navigation />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
        <LocationDisplay />
      </AuthProvider>
    </MemoryRouter>
  );
};

// Setup MSW server for API mocking
const server = setupServer(
  rest.post('/api/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        token: 'test-token',
        user: {
          id: '123',
          username: 'testuser',
          name: 'Test User'
        }
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

describe('Post-Login Flow for User Login (US4)', () => {
  test('US4.1: Successful login redirects to default dashboard when no pre-authentication URL', async () => {
    render(<AppWrapper />);
    
    // Fill login form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // Verify redirect to dashboard
    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/dashboard');
    });
  });
  
  test('US4.1: Successful login redirects to pre-authentication URL if available', async () => {
    // Set up with a redirect param in the URL
    render(
      <AppWrapper initialEntries={['/login?redirect=/profile']} />
    );
    
    // Fill login form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // Verify redirect to original URL
    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/profile');
    });
  });
  
  test('US4.2: Session token stored in secure HTTP-only cookie', async () => {
    // Reset SessionManager mock
    SessionManager.setSession.mockClear();
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill login form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // Verify SessionManager was called with secure HTTP-only cookie settings
    await waitFor(() => {
      expect(SessionManager.setSession).toHaveBeenCalledWith(
        'test-token', 
        expect.objectContaining({
          secure: true,
          httpOnly: true
        })
      );
    });
  });
  
  test('US4.3: Navigation menu updates to show authenticated state', async () => {
    render(<AppWrapper />);
    
    // Before login, navigation should show unauthenticated state
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/my profile/i)).not.toBeInTheDocument();
    
    // Fill login form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // After login, navigation should update
    await waitFor(() => {
      // Login link should disappear
      expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
      
      // Authenticated menu items should appear
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
      
      // User name should appear
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });
  });
  
  test('US4.4: Loading indicator displayed during authentication process', async () => {
    // Configure server with delay to test loading state
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(
          ctx.delay(100), // Add delay
          ctx.json({
            success: true,
            token: 'test-token',
            user: {
              id: '123',
              username: 'testuser',
              name: 'Test User'
            }
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );
    
    // Fill login form and submit
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in|submit/i }));
    
    // Verify loading indicator appears
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Verify loading indicator disappears after login completes
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });
});