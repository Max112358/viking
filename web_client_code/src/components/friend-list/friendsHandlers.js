// components/friend-list/friendsHandlers.js
import { API_BASE_URL } from '../../config';

export const createFriendHandlers = ({
  setSelectedFriend,
  setActiveView,
  fetchThreads,
  fetchRoomAndChannel,
  navigate,
  setContextMenu,
  refreshAllData,
  setSelectedThread,
}) => {
  const handleFriendSelect = async (friend) => {
    setSelectedFriend(friend);
    setActiveView(null);

    if (friend.room_url) {
      await fetchRoomAndChannel(friend.room_url);
    }
  };

  const handleRoomSelect = (room) => {
    navigate(`/v/${room.url_name}`);
  };

  const handleThreadSelect = (thread) => {
    if (thread?.url_id) {
      setSelectedThread(thread);
    }
  };

  const handleBackToThreads = () => {
    setSelectedThread(null);
  };

  const handleCreateThread = (selectedChannel, selectedRoom) => {
    if (selectedChannel) {
      navigate(`/v/${selectedRoom.url_name}/${selectedChannel.url_id}/create-thread`);
    }
  };

  const handleContextMenu = (e, category) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      category,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/friends/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await refreshAllData();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setContextMenu(null);
    }
  };

  const handleAddFriend = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send friend request');
      }

      setActiveView(null);
      await refreshAllData();
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  const handleCreateCategory = async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      // Mirror the initial data fetch pattern
      const fetchInitialData = async () => {
        try {
          await refreshAllData();
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };

      await fetchInitialData();
      setActiveView(null);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const handleRespondToFriendRequest = async (requestId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend request`);
      }

      await refreshAllData();
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return {
    handleFriendSelect,
    handleRoomSelect,
    handleThreadSelect,
    handleBackToThreads,
    handleCreateThread,
    handleContextMenu,
    handleCloseContextMenu,
    handleDeleteCategory,
    handleAddFriend,
    handleCreateCategory,
    handleRespondToFriendRequest,
    handleLogout,
  };
};
