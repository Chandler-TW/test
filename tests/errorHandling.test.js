const { handleError } = require('../src/utils/errorHandler');

describe('Error Handling', () => {
  test('should display network error message', () => {
    const response = handleError('NETWORK_ERROR');
    expect(response.error).toBe('Connection failed. Please try again.');
  });

  test('should clear error message after 5 seconds', () => {
    jest.useFakeTimers();
    const response = handleError('NETWORK_ERROR');
    setTimeout(() => {
      expect(response.error).toBeNull();
    }, 5000);
    jest.runAllTimers();
  });

  test('should clear error message on user action', () => {
    const response = handleError('NETWORK_ERROR');
    response.clearError();
    expect(response.error).toBeNull();
  });
});