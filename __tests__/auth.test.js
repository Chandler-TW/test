test('Validates email format', () => {
  expect(validateEmail('test@example.com')).toBeTruthy();
  expect(validateEmail('invalid')).toBeFalsy();
});

test('Checks password length', () => {
  expect(validatePassword('short')).toBeFalsy();
  expect(validatePassword('longenough')).toBeTruthy();
});

test('Displays auth errors', () => {
  render(<Login />);
  fireEvent.submit(screen.getByRole('form'));
  expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
});