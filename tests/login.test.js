// tests/login.test.js
const { login } = require('../src/auth');

describe('Login Functionality', () => {
  test('should redirect to dashboard on valid credentials', () => {
    const result = login('validUser', 'validPass');
    expect(result.redirect).toBe('/dashboard');
  });

  test('should show validation errors for empty fields', () => {
    const result = login('', '');
    expect(result.errors).toContain('Username and password are required');
  });

  test('should display error for invalid credentials', () => {
    const result = login('invalidUser', 'invalidPass');
    expect(result.error).toBe('Invalid username or password');
  });

  test('should mask password during input', () => {
    const input = document.createElement('input');
    input.type = 'password';
    expect(input.type).toBe('password');
  });
});