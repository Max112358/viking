// components/chat/ChatInterface.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import RoomSidebar from './RoomSidebar';
import ChannelSidebar from './ChannelSidebar';
import ThreadList from './ThreadList';
import ContextMenu from './ContextMenu';
import useResponsive from '../../hooks/useResponsive';
import useFetch from '../../hooks/useFetch';

const ChatInterface = ({ theme }) => {
  const navigate = useNavigate();
  const { roomUrl, channelId, threadId } = useParams();
  const { isMobile } = useResponsive();

  // State management
  const [rooms, setRooms] = useState([]);
  const [channels, setChannels] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showRoomSidebar, setShowRoomSidebar] = useState(true);
  const [showChannelSidebar, setShowChannelSidebar] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);

  // Authentication helpers
  const handleInvalidToken = useCallback(() => {
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

  // Data fetching functions
  const fetchRooms = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');

      if (!userId || !token) {
        handleInvalidToken();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleInvalidToken();
        return;
      }

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [handleInvalidToken]);

  const fetchChannels = async (roomId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/channels/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleInvalidToken();
        return;
      }

      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchThreads = async (channelId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/threads/${channelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleInvalidToken();
        return;
      }

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  // URL-based routing effect
  useEffect(() => {
    if (roomUrl) {
      const fetchRoomByUrl = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });

          if (response.ok) {
            const roomData = await response.json();
            setSelectedRoom(roomData);
            fetchChannels(roomData.room_id);

            if (channelId) {
              const channelResponse = await fetch(`${API_BASE_URL}/channels/${roomData.room_id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
              });

              if (channelResponse.ok) {
                const { channels } = await channelResponse.json();
                const channel = channels.find((c) => c.url_id === channelId);
                if (channel) {
                  setSelectedChannel(channel);
                  fetchThreads(channel.id);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching room:', error);
        }
      };

      fetchRoomByUrl();
    }
  }, [roomUrl, channelId, threadId]);

  // Event handlers
  const handleRoomSelect = (room) => {
    navigate(`/v/${room.url_name}`);
  };

  const handleChannelSelect = (channel) => {
    navigate(`/v/${selectedRoom.url_name}/${channel.url_id}`);
  };

  const handleThreadSelect = (thread) => {
    navigate(`/v/${selectedRoom.url_name}/${selectedChannel.url_id}/${thread.url_id}`);
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleCreateThread = () => {
    navigate(`/v/${selectedRoom.url_name}/create-thread`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Mobile responsiveness handlers
  const handleToggleRoomSidebar = () => {
    setShowRoomSidebar(!showRoomSidebar);
    if (isMobile && !showRoomSidebar) {
      setShowChannelSidebar(false);
    }
  };

  const handleToggleChannelSidebar = () => {
    setShowChannelSidebar(!showChannelSidebar);
    if (isMobile && !showChannelSidebar) {
      setShowRoomSidebar(false);
    }
  };

  // Context menu handlers
  const handleContextMenu = useCallback((e, item, type = 'room') => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      item,
      type,
    });
  }, []);

  const handleLeaveRoom = async (roomId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: localStorage.getItem('userId') }),
      });

      if (response.ok) {
        if (selectedRoom?.room_id === roomId) {
          setSelectedRoom(null);
          setSelectedChannel(null);
          setSelectedThread(null);
          setChannels([]);
          setThreads([]);
        }
        fetchRooms();
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    } finally {
      setContextMenu(null);
    }
  };

  return (
    <div className={`vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* Mobile Toggle Buttons */}
      {isMobile && (
        <div className="position-fixed top-0 start-0 m-2 z-3 d-flex gap-2">
          <button onClick={handleToggleRoomSidebar} className="btn">
            <i className="bi bi-list fs-5"></i>
          </button>
          {selectedRoom && (
            <button onClick={handleToggleChannelSidebar} className="btn">
              <i className="bi bi-chat-left-text fs-5"></i>
            </button>
          )}
        </div>
      )}

      {/* Room Sidebar */}
      <RoomSidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        onCreateRoom={handleCreateRoom}
        onRoomContextMenu={handleContextMenu}
        theme={theme}
        show={showRoomSidebar}
      />

      {/* Channel Sidebar */}
      {selectedRoom && (
        <ChannelSidebar
          selectedRoom={selectedRoom}
          channels={channels}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          theme={theme}
          show={showChannelSidebar}
        />
      )}

      {/* Main Content Area */}
      <ThreadList
        selectedChannel={selectedChannel}
        threads={threads}
        onThreadSelect={handleThreadSelect}
        onCreateThread={handleCreateThread}
        theme={theme}
        showRoomSidebar={showRoomSidebar}
        showChannelSidebar={showChannelSidebar}
      />

      {/* Logout Button */}
      <button className="btn btn-sm btn-outline-danger position-fixed top-0 end-0 m-2 z-3" onClick={handleLogout}>
        <i className="bi bi-box-arrow-right"></i> Logout
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}>
          {contextMenu.type === 'room' && (
            <button className="btn btn-link text-danger w-100 text-start px-3" onClick={() => handleLeaveRoom(contextMenu.item.room_id)}>
              Leave Room
            </button>
          )}
        </ContextMenu>
      )}
    </div>
  );
};

export default ChatInterface;
