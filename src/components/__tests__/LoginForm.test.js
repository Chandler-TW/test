import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../LoginForm';

describe('LoginForm Component', () => {
  // AC1: Form contains two required fields: Username (text input) and Password (password input)
  test('renders login form with username and password fields', () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  // AC2: Both fields must have validation: Show red outline and 'Required' text if empty on submit
  test('displays validation errors when submitting empty form', async () => {
    render(<LoginForm />);
    
    // Mock the submit button to be enabled for this test
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    submitButton.disabled = false;
    
    // Submit the empty form
    fireEvent.click(submitButton);
    
    // Check for validation messages
    const usernameValidationMsg = await screen.findByText(/required/i, { selector: '[data-testid="username-error"]' });
    const passwordValidationMsg = await screen.findByText(/required/i, { selector: '[data-testid="password-error"]' });
    
    expect(usernameValidationMsg).toBeInTheDocument();
    expect(passwordValidationMsg).toBeInTheDocument();
    
    // Check for red outlines (assuming the error class adds a red outline)
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(usernameInput).toHaveClass('error');
    expect(passwordInput).toHaveClass('error');
  });

  // AC3: Password field obscures input (type=password)
  test('password field obscures input with type=password', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // AC4: Submit button remains disabled until both fields are filled
  test('submit button is disabled until both fields are filled', () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login|sign in|submit/i });
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Initially button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Fill username only
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(submitButton).toBeDisabled();
    
    // Clear username and fill password only
    fireEvent.change(usernameInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(submitButton).toBeDisabled();
    
    // Fill both fields
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(submitButton).toBeEnabled();
  });
});