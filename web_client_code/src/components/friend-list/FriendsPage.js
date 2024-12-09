// components/friend-list/FriendsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendsData, useChatData, useContextMenu } from '../../hooks/useFriendsData';
import { createFriendHandlers } from './friendsHandlers';
import FriendsView from './FriendsView';

const FriendsPage = ({ theme }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Update to use new unified refresh
  const { friends, rooms, categories, error, refreshAllData } = useFriendsData();

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

  // Room selection handler
  const handleRoomSelect = (room) => {
    if (room?.url_name) {
      navigate(`/v/${room.url_name}`);
    }
  };

  // Create handlers with refreshAllData and setActiveView
  const handlers = createFriendHandlers({
    setSelectedFriend,
    setActiveView,
    setSelectedThread,
    setContextMenu: closeContextMenu,
    navigate,
    fetchThreads,
    fetchRoomAndChannel,
    refreshAllData,
  });

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    refreshAllData();
  }, [navigate, refreshAllData]);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const viewProps = {
    theme,
    rooms,
    friends,
    categories,
    threads,
    selectedRoom,
    selectedFriend,
    selectedChannel,
    selectedThread,
    activeView,
    setActiveView, // Add this
    contextMenu,
    handleRoomSelect,
    handlers,
    refreshAllData,
  };

  return <FriendsView {...viewProps} />;
};

export default FriendsPage;
