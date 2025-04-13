const request = require('supertest');
const app = require('../app');

describe('Registration Functionality', () => {
  it('should show "Username already exists" for duplicate usernames', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'existingUser', password: 'password', confirmPassword: 'password' });
    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe('Username already exists');
  });

  it('should display "Passwords do not match" for mismatched passwords', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'newUser', password: 'password1', confirmPassword: 'password2' });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Passwords do not match');
  });

  it('should log the user in and redirect to the dashboard on success', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'newUser', password: 'password', confirmPassword: 'password' });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
  });
});