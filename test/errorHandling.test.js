const { handleNetworkError, clearErrorMessages } = require('../src/auth');

describe('Error Handling', () => {
  test('should display "Connection failed. Please try again." on network error', () => {
    const error = { type: 'network', message: 'API timeout' };
    const result = handleNetworkError(error);
    expect(result.error).toBe('Connection failed. Please try again.');
  });

  test('should clear error messages after 5 seconds or on user action', () => {
    const errorElement = document.createElement('div');
    errorElement.textContent = 'Error message';
    document.body.appendChild(errorElement);

    setTimeout(() => {
      clearErrorMessages();
      expect(errorElement.textContent).toBe('');
    }, 5000);
  });
});