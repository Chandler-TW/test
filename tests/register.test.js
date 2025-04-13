// tests/register.test.js
const { register } = require('../src/auth');

describe('Registration Functionality', () => {
  test('should show error for duplicate username', () => {
    const result = register('existingUser', 'pass123', 'pass123');
    expect(result.error).toBe('Username already exists');
  });

  test('should display error for mismatched passwords', () => {
    const result = register('newUser', 'pass123', 'pass456');
    expect(result.error).toBe('Passwords do not match');
  });

  test('should log in and redirect on successful registration', () => {
    const result = register('newUser', 'pass123', 'pass123');
    expect(result.redirect).toBe('/dashboard');
  });
});