// hooks/useFriendsData.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export const useFriendsData = () => {
  const [friends, setFriends] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [navigate]);

  const fetchFriends = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch friends');
      }

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
    }
  }, [navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/friends/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  }, [navigate]);

  return {
    friends,
    rooms,
    categories,
    error,
    fetchRooms,
    fetchFriends,
    fetchCategories,
  };
};

export const useChatData = () => {
  const [threads, setThreads] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const navigate = useNavigate();

  const fetchThreads = async (channelId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/threads/${channelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const fetchRoomAndChannel = async (roomUrl) => {
    try {
      const token = localStorage.getItem('authToken');
      const roomResponse = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setSelectedRoom(roomData);

        const channelsResponse = await fetch(`${API_BASE_URL}/channels/${roomData.room_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();
          const defaultChannel = channelsData.categories[0]?.channels[0];
          if (defaultChannel) {
            setSelectedChannel(defaultChannel);
            fetchThreads(defaultChannel.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
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

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
  };
};
