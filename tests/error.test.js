// tests/error.test.js
const { handleError } = require('../src/auth');

describe('Error Handling Functionality', () => {
  test('should display connection error on API timeout', () => {
    const result = handleError('timeout');
    expect(result.error).toBe('Connection failed. Please try again.');
  });

  test('should clear error messages after 5 seconds', () => {
    jest.useFakeTimers();
    const result = handleError('anyError');
    jest.advanceTimersByTime(5000);
    expect(result.error).toBeNull();
  });
});