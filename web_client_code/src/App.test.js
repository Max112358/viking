// src/App.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock the child components and router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
}));

jest.mock('./components/Login', () => () => <div>Login Component</div>);
jest.mock('./components/chat/ChatInterface', () => () => <div>Chat Interface</div>);
jest.mock('./components/friend-list/FriendsPage', () => () => <div>Friends Page</div>);

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(document.querySelector('.min-vh-100')).toBeInTheDocument();
  });

  test('respects system dark mode preference', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(document.querySelector('.bg-dark')).toBeInTheDocument();
  });
});
