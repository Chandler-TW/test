const { JSDOM } = require('jsdom');
const jwt = require('jsonwebtoken');
const LoginService = require('../src/services/loginService');
const AuthService = require('../src/services/authService');

// Mock the document and window objects
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Mock services
jest.mock('../src/services/loginService');
jest.mock('../src/services/authService');

// Load login component after mocks
const LoginComponent = require('../src/components/Login');

describe('US1: Successful Login User Story', () => {
  let loginComponent;
  let formElement;
  let usernameInput;
  let passwordInput;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up the DOM for testing
    document.body.innerHTML = '<div id="login-container"></div>';
    loginComponent = new LoginComponent('#login-container');
    formElement = document.querySelector('form');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
  });

  // AC1: A login form with fields for username (required) and password (required) is displayed
  describe('Login form display', () => {
    test('should render a form with username and password fields', () => {
      // Assert form exists
      expect(formElement).toBeTruthy();
      
      // Assert username field exists and is required
      expect(usernameInput).toBeTruthy();
      expect(usernameInput.required).toBe(true);
      
      // Assert password field exists and is required
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.required).toBe(true);
    });

    test('should have appropriate labels for form fields', () => {
      const labels = document.querySelectorAll('label');
      
      expect(labels.length).toBeGreaterThanOrEqual(2);
      
      // Find labels for username and password inputs
      const usernameLabel = Array.from(labels).find(label => 
        label.htmlFor === 'username');
      const passwordLabel = Array.from(labels).find(label => 
        label.htmlFor === 'password');
      
      expect(usernameLabel).toBeTruthy();
      expect(usernameLabel.textContent).toContain('Username');
      
      expect(passwordLabel).toBeTruthy();
      expect(passwordLabel.textContent).toContain('Password');
    });
  });

  // AC2: Password input is masked by default
  describe('Password field masking', () => {
    test('password field should be of type password', () => {
      expect(passwordInput.type).toBe('password');
    });
  });

  // AC3: Submitting valid credentials redirects the user to their dashboard/homepage
  describe('Successful login redirection', () => {
    test('should redirect to dashboard after successful login', async () => {
      // Mock implementation for successful login
      LoginService.authenticate.mockResolvedValue({ 
        success: true,
        token: 'fake-jwt-token'
      });
      
      // Mock window.location
      delete window.location;
      window.location = { href: '' };
      
      // Fill in the form
      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      
      // Submit the form
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Verify redirect
      expect(window.location.href).toBe('/dashboard');
    });
  });

  // AC4: Successful login stores a secure session token (e.g., JWT)
  describe('Session token storage', () => {
    test('should store JWT token after successful login', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE1MTYyMzkwMjJ9.fake-signature';
      
      // Mock successful login with token
      LoginService.authenticate.mockResolvedValue({
        success: true,
        token: mockToken
      });
      
      // Mock localStorage
      const localStorageMock = (() => {
        let store = {};
        return {
          getItem: key => store[key],
          setItem: (key, value) => { store[key] = value.toString(); },
          clear: () => { store = {}; }
        };
      })();
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      
      // Fill in form
      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      
      // Submit form
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Verify token is stored
      expect(window.localStorage.getItem('authToken')).toBe(mockToken);
      
      // Verify the token is valid
      const storedToken = window.localStorage.getItem('authToken');
      const tokenPayload = jwt.decode(storedToken);
      
      expect(tokenPayload).toBeTruthy();
      expect(tokenPayload.userId).toBe('123456');
    });
  });
});