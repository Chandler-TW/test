const { JSDOM } = require('jsdom');
const LoginService = require('../src/services/loginService');

// Mock the document and window objects
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Mock the LoginService
jest.mock('../src/services/loginService');

// Load the Login component after mocks
const LoginComponent = require('../src/components/Login');

describe('US2: Error Handling User Story', () => {
  let loginComponent;
  let formElement;
  let usernameInput;
  let passwordInput;
  let submitButton;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up the DOM for testing
    document.body.innerHTML = '<div id="login-container"></div>';
    loginComponent = new LoginComponent('#login-container');
    formElement = document.querySelector('form');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    submitButton = document.querySelector('button[type="submit"]');
  });

  // AC1: Submitting empty username or password triggers inline validation errors
  describe('Empty field validation', () => {
    test('should show validation error when username is empty', async () => {
      // Fill in only the password field
      passwordInput.value = 'password123';
      usernameInput.value = '';
      
      // Trigger form submission
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Check for validation error message
      const usernameError = document.querySelector('.username-error');
      expect(usernameError).toBeTruthy();
      expect(usernameError.textContent).toContain('Username is required');
    });

    test('should show validation error when password is empty', async () => {
      // Fill in only the username field
      usernameInput.value = 'testuser';
      passwordInput.value = '';
      
      // Trigger form submission
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Check for validation error message
      const passwordError = document.querySelector('.password-error');
      expect(passwordError).toBeTruthy();
      expect(passwordError.textContent).toContain('Password is required');
    });

    test('should show validation error for both fields when both are empty', async () => {
      // Leave both fields empty
      usernameInput.value = '';
      passwordInput.value = '';
      
      // Trigger form submission
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Check for validation error messages
      const usernameError = document.querySelector('.username-error');
      const passwordError = document.querySelector('.password-error');
      
      expect(usernameError).toBeTruthy();
      expect(usernameError.textContent).toContain('Username is required');
      
      expect(passwordError).toBeTruthy();
      expect(passwordError.textContent).toContain('Password is required');
    });
  });

  // AC2: Invalid credentials display a user-friendly error message
  describe('Invalid credentials error message', () => {
    test('should display error message when credentials are invalid', async () => {
      // Set up mock to return failed authentication
      LoginService.authenticate.mockResolvedValue({
        success: false,
        message: 'Incorrect username or password'
      });
      
      // Fill in form with invalid credentials
      usernameInput.value = 'wronguser';
      passwordInput.value = 'wrongpass';
      
      // Submit form
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Check for error message
      const errorMessage = document.querySelector('.login-error');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Incorrect username or password');
    });
    
    test('should handle server errors with user-friendly message', async () => {
      // Set up mock to simulate server error
      LoginService.authenticate.mockRejectedValue(new Error('Server error'));
      
      // Fill in form
      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      
      // Submit form
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Check for generic error message
      const errorMessage = document.querySelector('.login-error');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Unable to login. Please try again later.');
    });
  });

  // AC3: Errors persist until the user corrects the input or submits again
  describe('Error message persistence', () => {
    test('validation error should persist until input is corrected', async () => {
      // Submit with empty username
      usernameInput.value = '';
      passwordInput.value = 'password123';
      
      // Trigger form submission
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Check error is displayed
      let usernameError = document.querySelector('.username-error');
      expect(usernameError).toBeTruthy();
      
      // Simulate typing partially in the field (still invalid)
      usernameInput.value = 'a';
      usernameInput.dispatchEvent(new Event('input'));
      
      // Error should still exist
      usernameError = document.querySelector('.username-error');
      expect(usernameError).toBeTruthy();
      
      // Now fill in with valid value
      usernameInput.value = 'validuser';
      usernameInput.dispatchEvent(new Event('input'));
      
      // Error should be cleared
      usernameError = document.querySelector('.username-error');
      expect(usernameError).toBeFalsy();
    });

    test('authentication error should persist until new submission', async () => {
      // Set up mock for failed authentication
      LoginService.authenticate.mockResolvedValue({
        success: false,
        message: 'Incorrect username or password'
      });
      
      // Fill form with invalid credentials
      usernameInput.value = 'wronguser';
      passwordInput.value = 'wrongpass';
      
      // Submit form
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Check error is displayed
      let authError = document.querySelector('.login-error');
      expect(authError).toBeTruthy();
      
      // Change input values but don't submit yet
      usernameInput.value = 'correctuser';
      passwordInput.value = 'correctpass';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));
      
      // Error should still be displayed
      authError = document.querySelector('.login-error');
      expect(authError).toBeTruthy();
      
      // Update mock for successful login
      LoginService.authenticate.mockResolvedValue({
        success: true,
        token: 'fake-token'
      });
      
      // Submit form again
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Error should be gone
      authError = document.querySelector('.login-error');
      expect(authError).toBeFalsy();
    });
  });
});