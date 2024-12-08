// components/friend-list/FriendsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendsData, useChatData, useContextMenu } from '../../hooks/useFriendsData';
import { createFriendHandlers } from './friendsHandlers';
import FriendsView from './FriendsView';

const FriendsPage = ({ theme }) => {
  const navigate = useNavigate();

  // Custom hooks for data management
  const { friends, rooms, categories, error, fetchRooms, fetchFriends, fetchCategories } =
    useFriendsData();

  const {
    threads,
    selectedRoom,
    selectedChannel,
    selectedThread,
    setSelectedThread,
    fetchThreads,
    fetchRoomAndChannel,
  } = useChatData();

  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  // Local state
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeView, setActiveView] = useState(null);

  // Room selection handler
  const handleRoomSelect = (room) => {
    if (room?.url_name) {
      navigate(`/v/${room.url_name}`);
    }
  };

  // Create handlers
  const handlers = createFriendHandlers({
    // State setters
    setSelectedFriend,
    setActiveView,
    setSelectedThread,
    setContextMenu: closeContextMenu,

    // Navigation
    navigate,

    // Data fetching
    fetchThreads,
    fetchRoomAndChannel,
    fetchCategories,
    fetchFriends,
  });

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchInitialData = async () => {
      try {
        await Promise.all([fetchRooms(), fetchFriends(), fetchCategories()]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [fetchRooms, fetchFriends, fetchCategories, navigate]);

  // Handle errors
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Combine all props for the view
  const viewProps = {
    // Theme
    theme,

    // Data
    rooms,
    friends,
    categories,
    threads,

    // Selection state
    selectedRoom,
    selectedFriend,
    selectedChannel,
    selectedThread,
    activeView,

    // Context menu
    contextMenu,

    // Navigation handlers
    handleRoomSelect, // Add this

    // Other handlers
    handlers: {
      ...handlers,
      handleContextMenu,
      setActiveView,
    },
  };

  return <FriendsView {...viewProps} />;
};

export default FriendsPage;
