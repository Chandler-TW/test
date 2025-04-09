test('Forgot Password link triggers email with reset instructions', () => {
  const forgotPasswordLink = document.querySelector('#forgot-password-link');
  forgotPasswordLink.click();
  expect(sendResetEmail).toHaveBeenCalledWith(expect.stringContaining('reset instructions'));
});

test('Email contains time-limited reset link', () => {
  const resetLink = generateResetLink('user@example.com');
  expect(resetLink).toMatch(/reset-token=[a-zA-Z0-9]+/);
  expect(resetLink).toHaveProperty('expiresIn', 3600); // 1 hour in seconds
});

test('Reset form validates password complexity', () => {
  const isValid = validatePassword('StrongPassword123!');
  expect(isValid).toBe(true);

  const isInvalid = validatePassword('weak');
  expect(isInvalid).toBe(false);
});