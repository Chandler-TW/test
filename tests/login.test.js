const { login } = require('./auth');

describe('Login Functionality', () => {
  test('should redirect to dashboard on valid credentials', async () => {
    const response = await login('validUser', 'validPass');
    expect(response.redirect).toBe('/dashboard');
  });

  test('should show validation errors for empty fields', async () => {
    const response = await login('', '');
    expect(response.errors).toContain('Username is required');
    expect(response.errors).toContain('Password is required');
  });

  test('should display error for incorrect credentials', async () => {
    const response = await login('invalidUser', 'invalidPass');
    expect(response.error).toBe('Invalid username or password');
  });

  test('should mask password during input', () => {
    const passwordInput = document.getElementById('password');
    expect(passwordInput.type).toBe('password');
  });
});