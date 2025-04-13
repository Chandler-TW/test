const { register } = require('../src/auth');
const { validateRegistration } = require('../src/validation');

describe('Registration Functionality', () => {
  test('should show error for duplicate username', () => {
    const userData = { username: 'existinguser', password: 'testpass', confirmPassword: 'testpass' };
    const result = register(userData);
    expect(result.error).toBe('Username already exists');
  });

  test('should display error for mismatched passwords', () => {
    const userData = { username: 'newuser', password: 'testpass', confirmPassword: 'mismatch' };
    const errors = validateRegistration(userData);
    expect(errors.confirmPassword).toBe('Passwords do not match');
  });

  test('should log in and redirect on successful registration', () => {
    const userData = { username: 'newuser', password: 'testpass', confirmPassword: 'testpass' };
    const result = register(userData);
    expect(result.redirect).toBe('/dashboard');
  });
});