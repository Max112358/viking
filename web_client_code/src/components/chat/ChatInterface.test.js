// __tests__/components/chat/ChatInterface.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatInterface from '../../../components/chat/ChatInterface';
import { API_BASE_URL } from '../../../config';

// Mock fetch globally
global.fetch = jest.fn();

// Mock navigation and params
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({
    roomUrl: 'test-room',
    channelId: 'test-channel',
    threadId: 'test-thread',
  }),
}));

describe('ChatInterface Component', () => {
  const mockRoom = {
    room_id: 1,
    name: 'Test Room',
    url_name: 'test-room',
    is_admin: true,
  };

  const mockChannels = {
    categories: [
      {
        id: 1,
        name: 'General',
        channels: [
          {
            id: 1,
            name: 'general',
            url_id: 'test-channel',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    localStorage.setItem('authToken', 'fake-token');
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <ChatInterface theme="light" />
      </BrowserRouter>
    );

    expect(screen.getByText(/select a room to view channels/i)).toBeInTheDocument();
  });

  test('loads room and channel data', async () => {
    fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoom),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChannels),
        })
      );

    render(
      <BrowserRouter>
        <ChatInterface theme="light" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/rooms/by-url/test-room`,
        expect.any(Object)
      );
    });
  });

  test('handles room selection', async () => {
    render(
      <BrowserRouter>
        <ChatInterface theme="light" />
      </BrowserRouter>
    );

    // Mock successful room fetch
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoom),
      })
    );

    // Simulate room selection
    fireEvent.click(screen.getByText(/select a room to view channels/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/v/test-room');
    });
  });

  test('handles logout', () => {
    render(
      <BrowserRouter>
        <ChatInterface theme="light" />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Logout'));

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
