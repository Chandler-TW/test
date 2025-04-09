import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser } from '../redux/authSlice';
import SecureInput from '../ui/SecureInput';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(loginUser({ email, password }));
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      <SecureInput
        label="Email/Username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        type="email"
      />
      <SecureInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        type={showPassword ? 'text' : 'password'}
        toggleVisibility={() => setShowPassword(!showPassword)}
      />
      <button type="submit">Sign In</button>
    </form>
  );
};