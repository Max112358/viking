// hooks/useFriendsData.js
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

// Data fetching hook
export const useFriendsData = () => {
  const [friends, setFriends] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Unified data refresh function
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [roomsResponse, friendsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/rooms`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
        fetch(`${API_BASE_URL}/friends`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
        fetch(`${API_BASE_URL}/friends/categories`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
      ]);

      // Check if any requests failed
      if (!roomsResponse.ok || !friendsResponse.ok || !categoriesResponse.ok) {
        throw new Error('One or more requests failed');
      }

      // Parse all responses in parallel
      const [roomsData, friendsData, categoriesData] = await Promise.all([
        roomsResponse.json(),
        friendsResponse.json(),
        categoriesResponse.json(),
      ]);

      // Update all state at once
      setRooms(roomsData.rooms || []);
      setFriends(friendsData.friends || []);
      setCategories(categoriesData.categories || []);

      return true; // Indicate successful refresh
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
      return false; // Indicate failed refresh
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Individual fetch methods - now using the unified refresh
  const fetchRooms = useCallback(async () => {
    return refreshAllData();
  }, [refreshAllData]);

  const fetchFriends = useCallback(async () => {
    return refreshAllData();
  }, [refreshAllData]);

  const fetchCategories = useCallback(async () => {
    return refreshAllData();
  }, [refreshAllData]);

  // Initial data fetch
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  return {
    friends,
    rooms,
    categories,
    error,
    isLoading,
    refreshAllData,
    // Keep individual fetch methods for backward compatibility
    fetchRooms,
    fetchFriends,
    fetchCategories,
  };
};

// Context menu hook remains unchanged
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, category) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      category,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  return { contextMenu, handleContextMenu, closeContextMenu };
};

// Chat data hook remains unchanged
export const useChatData = () => {
  const [threads, setThreads] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);

  const fetchThreads = async (channelId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/threads/${channelId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch threads');
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const fetchRoomAndChannel = async (roomUrl) => {
    try {
      const roomResponse = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!roomResponse.ok) throw new Error('Failed to fetch room');
      const roomData = await roomResponse.json();
      setSelectedRoom(roomData);

      const channelsResponse = await fetch(`${API_BASE_URL}/channels/${roomData.room_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!channelsResponse.ok) throw new Error('Failed to fetch channels');
      const channelsData = await channelsResponse.json();
      setSelectedChannel(channelsData.categories[0]?.channels[0] || null);
    } catch (error) {
      console.error('Error fetching room and channel:', error);
    }
  };

  return {
    threads,
    selectedRoom,
    selectedChannel,
    selectedThread,
    setSelectedThread,
    fetchThreads,
    fetchRoomAndChannel,
  };
};
