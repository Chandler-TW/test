// loginForm.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from '../components/LoginForm';

describe('LoginForm Basic Authentication (US1)', () => {
  test('US1.1: Login form contains username and password input fields', () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
  
  test('US1.2: Username and password fields are required with client-side validation', () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    
    // Test validation feedback by submitting empty form
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    fireEvent.click(submitButton);
    
    // Check if validation messages appear
    const validationMessages = screen.getAllByText(/required|cannot be empty/i);
    expect(validationMessages.length).toBeGreaterThan(0);
  });
  
  test('US1.3: Submit button remains disabled until both fields are filled', () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    
    // Initially button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Fill only username
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(submitButton).toBeDisabled();
    
    // Clear username and fill only password
    fireEvent.change(usernameInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(submitButton).toBeDisabled();
    
    // Fill both fields
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(submitButton).toBeEnabled();
  });
  
  test('US1.4: Password input masks characters by default', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});