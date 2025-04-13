import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from '../src/reducers';
import App from '../src/components/App';

const store = createStore(rootReducer, applyMiddleware(thunk));

describe('App Component', () => {
  it('renders login form by default', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('switches to registration form when register button is clicked', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    fireEvent.click(screen.getByText('Need an account? Register'));
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('displays error message when login fails', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    fireEvent.change(screen.getByLabelText('Username:'), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText('Login'));
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();
  });
});