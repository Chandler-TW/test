const { logout } = require('../src/auth');

describe('Logout Functionality', () => {
  test('should clear session and redirect to login page', () => {
    const result = logout();
    expect(result.sessionCleared).toBe(true);
    expect(result.redirect).toBe('/login');
  });
});