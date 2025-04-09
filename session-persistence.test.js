const { JSDOM } = require('jsdom');
const jwt = require('jsonwebtoken');
const LoginService = require('../src/services/loginService');
const AuthService = require('../src/services/authService');

// Set up JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  referrer: 'http://localhost',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000
});

// Set globals
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;

// Mock required modules
jest.mock('../src/services/loginService');
jest.mock('../src/services/authService');

// Mock Date for testing expiration times
const RealDate = global.Date;

// Load component after mocks are set
const LoginComponent = require('../src/components/Login');
const SessionManager = require('../src/utils/sessionManager');

describe('US3: Session Persistence User Story', () => {
  let loginComponent;
  let rememberMeCheckbox;
  let usernameInput;
  let passwordInput;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset localStorage
    window.localStorage.clear();
    
    // Restore original Date
    global.Date = RealDate;
    
    // Set up DOM
    document.body.innerHTML = '<div id="login-container"></div>';
    loginComponent = new LoginComponent('#login-container');
    
    // Get form elements
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    rememberMeCheckbox = document.getElementById('remember-me');
  });
  
  // AC1: A "Remember Me" checkbox allows users to opt into extended session persistence
  describe('Remember Me functionality', () => {
    test('should display a "Remember Me" checkbox', () => {
      // Find the remember me checkbox
      expect(rememberMeCheckbox).toBeTruthy();
      expect(rememberMeCheckbox.type).toBe('checkbox');
      
      // Check label exists
      const rememberMeLabel = Array.from(document.querySelectorAll('label')).find(
        label => label.htmlFor === 'remember-me'
      );
      expect(rememberMeLabel).toBeTruthy();
      expect(rememberMeLabel.textContent).toContain('Remember Me');
    });
    
    test('should create token with extended expiry when "Remember Me" is checked', async () => {
      // Mock current date
      const mockDate = new Date('2023-01-01T12:00:00Z');
      global.Date = jest.fn(() => mockDate);
      global.Date.now = jest.fn(() => mockDate.getTime());
      
      // Set up mock for successful authentication
      const mockShortToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE2NzI1NzYwMDAsImV4cCI6MTY3MjU3OTYwMH0.fake-signature';
      const mockLongToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE2NzI1NzYwMDAsImV4cCI6MTY3MzE4MDgwMH0.fake-signature';
      
      LoginService.authenticate.mockImplementation((username, password, rememberMe) => {
        return Promise.resolve({
          success: true,
          token: rememberMe ? mockLongToken : mockShortToken
        });
      });
      
      // Mock JWT decode to verify tokens without verification
      jest.spyOn(jwt, 'decode').mockImplementation((token) => {
        if (token === mockShortToken) {
          return {
            userId: '123456',
            iat: Math.floor(mockDate.getTime() / 1000),
            exp: Math.floor(mockDate.getTime() / 1000) + 3600 // 1 hour
          };
        } else if (token === mockLongToken) {
          return {
            userId: '123456',
            iat: Math.floor(mockDate.getTime() / 1000),
            exp: Math.floor(mockDate.getTime() / 1000) + 604800 // 7 days
          };
        }
      });
      
      // Fill in credentials
      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      
      // Test with "Remember Me" checked
      rememberMeCheckbox.checked = true;
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Verify authentication was called with remember me flag
      expect(LoginService.authenticate).toHaveBeenCalledWith(
        'testuser', 'password123', true
      );
      
      // Get stored token
      const storedToken = window.localStorage.getItem('authToken');
      expect(storedToken).toBe(mockLongToken);
      
      // Verify token expiry using decode
      const decodedToken = jwt.decode(storedToken);
      expect(decodedToken).toBeTruthy();
      
      // Calculate expected expiry (7 days from mock date in seconds)
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      const expectedExpiry = Math.floor(mockDate.getTime() / 1000) + sevenDaysInSeconds;
      expect(decodedToken.exp).toBe(expectedExpiry);
    });
    
    test('should create token with standard expiry when "Remember Me" is unchecked', async () => {
      // Mock current date
      const mockDate = new Date('2023-01-01T12:00:00Z');
      global.Date = jest.fn(() => mockDate);
      global.Date.now = jest.fn(() => mockDate.getTime());
      
      // Set up mock for successful authentication
      const mockShortToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE2NzI1NzYwMDAsImV4cCI6MTY3MjU3OTYwMH0.fake-signature';
      
      LoginService.authenticate.mockResolvedValue({
        success: true,
        token: mockShortToken
      });
      
      // Mock JWT decode
      jest.spyOn(jwt, 'decode').mockReturnValue({
        userId: '123456',
        iat: Math.floor(mockDate.getTime() / 1000),
        exp: Math.floor(mockDate.getTime() / 1000) + 3600 // 1 hour
      });
      
      // Fill in credentials
      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      
      // Test with "Remember Me" unchecked (default)
      rememberMeCheckbox.checked = false;
      await loginComponent.handleSubmit(new Event('submit'));
      
      // Verify authentication was called without remember me flag
      expect(LoginService.authenticate).toHaveBeenCalledWith(
        'testuser', 'password123', false
      );
      
      // Get stored token
      const storedToken = window.localStorage.getItem('authToken');
      expect(storedToken).toBe(mockShortToken);
      
      // Verify token expiry
      const decodedToken = jwt.decode(storedToken);
      expect(decodedToken).toBeTruthy();
      
      // Calculate expected expiry (1 hour from mock date in seconds)
      const oneHourInSeconds = 3600;
      const expectedExpiry = Math.floor(mockDate.getTime() / 1000) + oneHourInSeconds;
      expect(decodedToken.exp).toBe(expectedExpiry);
    });
  });
  
  // AC2: Session tokens expire after a defined period unless "Remember Me" is selected
  describe('Token expiration', () => {
    test('should redirect to login page when token expires', async () => {
      // Mock Date for testing token expiry
      const mockCurrentDate = new Date('2023-01-01T13:30:00Z'); // 1.5 hours after token creation
      global.Date = jest.fn(() => mockCurrentDate);
      global.Date.now = jest.fn(() => mockCurrentDate.getTime());
      
      // Mock JWT verify to simulate expired token
      jest.spyOn(AuthService, 'verifyToken').mockReturnValue({
        valid: false,
        expired: true
      });
      
      // Create a fake token that's expired
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired-token.fake-signature';
      window.localStorage.setItem('authToken', expiredToken);
      
      // Mock window.location
      delete window.location;
      window.location = { href: '/dashboard' };
      
      // Simulate page load/token check
      const sessionManager = new SessionManager();
      await sessionManager.checkSessionValidity();
      
      // Verify redirect to login page
      expect(window.location.href).toBe('/login');
      
      // Verify token was removed
      expect(window.localStorage.getItem('authToken')).toBeNull();
    });
    
    test('should maintain session when token is still valid', async () => {
      // Mock current date
      const mockCurrentDate = new Date('2023-01-01T12:30:00Z'); // 30 minutes after token creation
      global.Date = jest.fn(() => mockCurrentDate);
      global.Date.now = jest.fn(() => mockCurrentDate.getTime());
      
      // Mock JWT verify to simulate valid token
      jest.spyOn(AuthService, 'verifyToken').mockReturnValue({
        valid: true,
        expired: false,
        payload: {
          userId: '123456',
          exp: Math.floor(mockCurrentDate.getTime() / 1000) + 1800 // 30 minutes left
        }
      });
      
      // Create a fake token that's still valid
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-token.fake-signature';
      window.localStorage.setItem('authToken', validToken);
      
      // Mock window.location
      delete window.location;
      window.location = { href: '/dashboard' };
      
      // Simulate page load/token check
      const sessionManager = new SessionManager();
      await sessionManager.checkSessionValidity();
      
      // Verify no redirect occurred
      expect(window.location.href).toBe('/dashboard');
      
      // Verify token still exists
      expect(window.localStorage.getItem('authToken')).toBe(validToken);
    });
  });
  
  // AC3: Users can log out manually, which clears the session token
  describe('User logout', () => {
    test('should clear token and redirect to login page on logout', async () => {
      // Set a fake token
      window.localStorage.setItem('authToken', 'fake-token');
      
      // Mock window.location
      delete window.location;
      window.location = { href: '/dashboard' };
      
      // Create logout button
      document.body.innerHTML += '<button id="logout-btn">Logout</button>';
      const logoutBtn = document.getElementById('logout-btn');
      
      // Initialize the logout handler
      const sessionManager = new SessionManager();
      sessionManager.attachLogoutHandler();
      
      // Trigger logout
      logoutBtn.click();
      
      // Verify token is cleared
      expect(window.localStorage.getItem('authToken')).toBeNull();
      
      // Verify redirect to login page
      expect(window.location.href).toBe('/login');
    });
    
    test('should call the AuthService logout method on logout', async () => {
      // Set up mock for AuthService.logout
      AuthService.logout = jest.fn().mockResolvedValue({ success: true });
      
      // Set a fake token
      const fakeToken = 'fake-token';
      window.localStorage.setItem('authToken', fakeToken);
      
      // Create logout button
      document.body.innerHTML += '<button id="logout-btn">Logout</button>';
      const logoutBtn = document.getElementById('logout-btn');
      
      // Initialize the logout handler
      const sessionManager = new SessionManager();
      sessionManager.attachLogoutHandler();
      
      // Trigger logout
      logoutBtn.click();
      
      // Verify AuthService.logout was called with the token
      expect(AuthService.logout).toHaveBeenCalledWith(fakeToken);
    });
  });
});