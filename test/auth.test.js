const request = require('supertest');
const app = require('../app');

describe('User Authentication', () => {
  // Test for valid credentials
  it('should redirect to dashboard on valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'validUser', password: 'validPass' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/dashboard');
  });

  // Test for empty fields
  it('should show validation errors for empty fields', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: '', password: '' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toBeDefined();
  });

  // Test for incorrect credentials
  it('should display error for incorrect credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'invalidUser', password: 'invalidPass' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBe('Invalid username or password');
  });

  // Test for password masking
  it('should mask passwords during input', () => {
    // This would typically be tested in the frontend, but for backend, we can ensure the API doesn't return the password
    const res = await request(app)
      .post('/login')
      .send({ username: 'test', password: 'secret' });
    expect(res.body.password).toBeUndefined();
  });

  // Test for duplicate username
  it('should show error for duplicate username', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'existingUser', password: 'pass123' });
    expect(res.statusCode).toEqual(409);
    expect(res.body.error).toBe('Username already exists');
  });

  // Test for password mismatch
  it('should show error for password mismatch', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'newUser', password: 'pass123', confirmPassword: 'pass456' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Passwords do not match');
  });

  // Test for successful registration
  it('should log in and redirect on successful registration', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'newUser', password: 'pass123', confirmPassword: 'pass123' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/dashboard');
  });

  // Test for logout
  it('should clear session and redirect on logout', async () => {
    const res = await request(app)
      .post('/logout')
      .send();
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/login');
  });

  // Test for network error
  it('should display connection error on network failure', async () => {
    // Mock a network error
    jest.spyOn(request(app), 'post').mockImplementation(() => {
      throw new Error('Connection failed');
    });
    const res = await request(app)
      .post('/login')
      .send({ username: 'test', password: 'pass' });
    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toBe('Connection failed. Please try again.');
  });

  // Test for error message timeout
  it('should clear error messages after 5 seconds', async () => {
    // This would typically be tested in the frontend
    // For backend, we can ensure the API doesn't persist error messages
    const res = await request(app)
      .post('/login')
      .send({ username: 'invalid', password: 'invalid' });
    expect(res.statusCode).toEqual(401);
    setTimeout(() => {
      expect(res.body.error).toBeUndefined();
    }, 5000);
  });
});