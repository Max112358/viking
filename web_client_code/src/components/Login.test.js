// __tests__/components/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../components/Login';
import { API_BASE_URL } from '../../config';

// Mock fetch globally
global.fetch = jest.fn();

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear mock data before each test
    fetch.mockClear();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login theme="light" />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const mockResponse = {
      token: 'fake-token',
      user: { id: 1, email: 'test@example.com' },
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    render(
      <BrowserRouter>
        <Login theme="light" />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBe('fake-token');
      expect(localStorage.getItem('userId')).toBe('1');
      expect(localStorage.getItem('userEmail')).toBe('test@example.com');
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  test('handles login failure', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      })
    );

    render(
      <BrowserRouter>
        <Login theme="light" />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  test('navigates to registration page', () => {
    render(
      <BrowserRouter>
        <Login theme="light" />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/register an account/i));
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('navigates to forgot password page', () => {
    render(
      <BrowserRouter>
        <Login theme="light" />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/forgot your password/i));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });
});
