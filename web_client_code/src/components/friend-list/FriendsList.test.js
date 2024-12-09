// __tests__/components/friend-list/FriendsList.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FriendsList from '../../../components/friend-list/FriendsList';

describe('FriendsList Component', () => {
  const mockFriends = [
    {
      id: 1,
      email: 'friend1@example.com',
      status: 'online',
      categories: [{ id: 1, name: 'Close Friends' }],
    },
    {
      id: 2,
      email: 'friend2@example.com',
      status: 'offline',
      categories: [],
    },
  ];

  const mockCategories = [
    {
      id: 1,
      name: 'Close Friends',
    },
  ];

  const mockHandlers = {
    handleFriendSelect: jest.fn(),
    handleContextMenu: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders friends list with categories', () => {
    render(
      <FriendsList
        theme="light"
        friends={mockFriends}
        categories={mockCategories}
        handlers={mockHandlers}
        activeView={null}
        setActiveView={() => {}}
        selectedFriend={null}
        refreshAllData={() => {}}
      />
    );

    expect(screen.getByText('Close Friends')).toBeInTheDocument();
    expect(screen.getByText('friend1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    expect(screen.getByText('friend2@example.com')).toBeInTheDocument();
  });

  test('handles friend selection', () => {
    render(
      <FriendsList
        theme="light"
        friends={mockFriends}
        categories={mockCategories}
        handlers={mockHandlers}
        activeView={null}
        setActiveView={() => {}}
        selectedFriend={null}
        refreshAllData={() => {}}
      />
    );

    fireEvent.click(screen.getByText('friend1@example.com'));
    expect(mockHandlers.handleFriendSelect).toHaveBeenCalledWith(mockFriends[0]);
  });

  test('shows category context menu on right click', () => {
    render(
      <FriendsList
        theme="light"
        friends={mockFriends}
        categories={mockCategories}
        handlers={mockHandlers}
        activeView={null}
        setActiveView={() => {}}
        selectedFriend={null}
        refreshAllData={() => {}}
      />
    );

    const categoryElement = screen.getByText('Close Friends');
    fireEvent.contextMenu(categoryElement);
    expect(mockHandlers.handleContextMenu).toHaveBeenCalled();
  });

  test('toggles category collapse', () => {
    render(
      <FriendsList
        theme="light"
        friends={mockFriends}
        categories={mockCategories}
        handlers={mockHandlers}
        activeView={null}
        setActiveView={() => {}}
        selectedFriend={null}
        refreshAllData={() => {}}
      />
    );

    const categoryToggle = screen.getByText('Close Friends');
    fireEvent.click(categoryToggle);
    // After clicking, the chevron icon should change
    expect(screen.getByClassName('bi-chevron-right')).toBeInTheDocument();
  });
});
