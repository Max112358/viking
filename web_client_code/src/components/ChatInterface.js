// part of frontend
// components/ChatInterface.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Custom context menu component
const ContextMenu = ({ x, y, onClose, children }) => (
  <div
    className="position-fixed bg-white shadow-sm rounded border"
    style={{
      left: x,
      top: y,
      zIndex: 1050,
      minWidth: '120px',
    }}
  >
    {children}
  </div>
);

const ChatInterface = ({ theme }) => {
  const [rooms, setRooms] = useState([]);
  const [channels, setChannels] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showRoomSidebar, setShowRoomSidebar] = useState(true);
  const [showChannelSidebar, setShowChannelSidebar] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  // Move fetchRooms to useCallback to prevent dependency issues
  // First, wrap handleInvalidToken in useCallback
  const handleInvalidToken = useCallback(() => {
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

  // Then update fetchRooms to include handleInvalidToken in its dependencies
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
  }, [handleInvalidToken]); // Add handleInvalidToken as a dependency

  //make sure the user is authorized to do this
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      handleInvalidToken();
      return;
    }

    fetchRooms(); // This will fail with 401 if token is invalid
  }, [handleInvalidToken, fetchRooms]);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleClickOutside = () => {
      setContextMenu(null);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setSelectedChannel(null);
    setSelectedThread(null);
    fetchChannels(room.room_id);
    if (isMobile) {
      setShowRoomSidebar(false);
      setShowChannelSidebar(true);
    }
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setSelectedThread(null);
    fetchThreads(channel.id);
    if (isMobile) {
      setShowChannelSidebar(false);
    }
  };

  const handleThreadSelect = (thread) => {
    setSelectedThread(thread);
  };

  const handleContextMenu = useCallback((e, item, type = 'room') => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      item: item,
      type: type,
    });
  }, []);

  const handleDeleteThread = async (threadId) => {
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        handleInvalidToken();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleInvalidToken();
        return;
      }

      if (response.ok) {
        if (selectedThread?.id === threadId) {
          setSelectedThread(null);
        }
        // Refresh threads list
        fetchThreads(selectedRoom.room_id);
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    } finally {
      setContextMenu(null);
    }
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleCreateThread = () => {
    if (selectedChannel) {
      navigate(`/create-thread/${selectedRoom.room_id}/${selectedChannel.id}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getRoomDisplay = (room) => {
    if (room.thumbnail_url) {
      const fullUrl = `${API_BASE_URL}${room.thumbnail_url}`;
      return (
        <img
          src={fullUrl}
          alt={room.name}
          className="w-100 h-100 rounded-circle object-fit-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentElement.textContent = room.name.charAt(0).toUpperCase();
          }}
        />
      );
    }
    return room.name.charAt(0).toUpperCase();
  };

  const handleLeaveRoom = async (roomId) => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');

      if (!userId || !token) {
        handleInvalidToken();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        if (selectedRoom?.room_id === roomId) {
          setSelectedRoom(null);
          setSelectedThread(null);
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

  const getBaseClasses = (isDark) =>
    `${isDark ? 'bg-dark text-light' : 'bg-light text-dark'} 
     ${isDark ? 'border-secondary' : 'border-light'}`.trim();

  const ROOM_BUTTON_SIZE = 38;
  const SIDEBAR_WIDTH = 280;

  const buttonThemeClasses = theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark';
  const selectedButtonClasses = theme === 'dark' ? 'btn-primary' : 'btn-primary';

  return (
    <div className={`vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* Mobile Toggle Buttons */}
      {isMobile && (
        <>
          <button onClick={() => setShowRoomSidebar(!showRoomSidebar)} className="btn position-fixed top-0 start-0 m-2 z-3">
            <i className="bi bi-list fs-5"></i>
          </button>
          {selectedRoom && (
            <button
              onClick={() => setShowChannelSidebar(!showChannelSidebar)}
              className="btn position-fixed top-0 start-0 m-2 z-3"
              style={{ left: '64px' }}
            >
              <i className="bi bi-chat-left-text fs-5"></i>
            </button>
          )}
        </>
      )}

      {/* Rooms Sidebar */}
      <div
        className={`position-fixed start-0 top-0 h-100 border-end ${showRoomSidebar ? '' : 'translate-x-[-100%]'} ${getBaseClasses(
          theme === 'dark'
        )} transition-transform duration-300`}
        style={{ width: `${ROOM_BUTTON_SIZE + 16}px`, zIndex: 2 }}
      >
        <div className="d-flex flex-column p-2 gap-2">
          {rooms.map((room) => (
            <button
              key={room.room_id}
              onClick={() => handleRoomSelect(room)}
              onContextMenu={(e) => handleContextMenu(e, room)}
              className={`btn rounded-circle d-flex align-items-center justify-content-center p-0 overflow-hidden ${
                selectedRoom?.room_id === room.room_id ? selectedButtonClasses : buttonThemeClasses
              }`}
              style={{ width: `${ROOM_BUTTON_SIZE}px`, height: `${ROOM_BUTTON_SIZE}px` }}
              title={room.name}
            >
              {getRoomDisplay(room)}
            </button>
          ))}
          <button
            onClick={handleCreateRoom}
            className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: `${ROOM_BUTTON_SIZE}px`, height: `${ROOM_BUTTON_SIZE}px` }}
            title="Create New Room"
          >
            <i className="bi bi-plus"></i>
          </button>
        </div>
      </div>

      {/* Channels Sidebar */}
      {selectedRoom && (
        <div
          className={`position-fixed h-100 border-end ${showChannelSidebar ? '' : 'translate-x-[-100%]'} ${getBaseClasses(
            theme === 'dark'
          )} transition-transform duration-300`}
          style={{
            width: `${SIDEBAR_WIDTH}px`,
            left: showRoomSidebar ? `${ROOM_BUTTON_SIZE + 16}px` : '0',
            zIndex: 1,
          }}
        >
          <div className="p-3">
            <h6 className="mb-3">{selectedRoom.name}</h6>
            <div className="d-flex flex-column gap-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`btn text-start p-2 ${selectedChannel?.id === channel.id ? selectedButtonClasses : buttonThemeClasses}`}
                >
                  <div className="d-flex align-items-center">
                    <i className="bi bi-hash me-2"></i>
                    <span>{channel.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="h-100 overflow-hidden"
        style={{
          marginLeft: showRoomSidebar
            ? selectedRoom
              ? `${ROOM_BUTTON_SIZE + 16 + SIDEBAR_WIDTH}px`
              : `${ROOM_BUTTON_SIZE + 16}px`
            : showChannelSidebar && selectedRoom
            ? `${SIDEBAR_WIDTH}px`
            : '0',
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        {selectedChannel ? (
          <div className="h-100 d-flex flex-column">
            <div className="p-3 border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">#{selectedChannel.name}</h5>
                <button onClick={handleCreateThread} className="btn btn-success">
                  New Thread
                </button>
              </div>
            </div>
            <div className="flex-grow-1 overflow-auto p-3">
              <div className="d-flex flex-column gap-3">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`card ${theme === 'dark' ? 'bg-mid-dark' : ''}`}
                    onClick={() => handleThreadSelect(thread)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body">
                      <div className="d-flex gap-3">
                        {thread.first_post_image && (
                          <img
                            src={`${API_BASE_URL}${thread.first_post_image}`}
                            alt=""
                            className="rounded"
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <h6 className="card-title">{thread.subject}</h6>
                          <p className="card-text small">{thread.first_post_content}</p>
                          <div className="text-muted small">
                            {thread.author_email ? `Posted by ${thread.author_email}` : 'Anonymous'} ·{' '}
                            {new Date(thread.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <p>{selectedRoom ? 'Select a channel to view threads' : 'Select a room to view channels'}</p>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button className={`btn btn-sm btn-outline-danger position-fixed top-0 end-0 m-2 z-3 ${buttonThemeClasses}`} onClick={handleLogout}>
        <i className="bi bi-box-arrow-right"></i> Logout
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}>
          <div className="py-2">
            {contextMenu.type === 'room' && (
              <button className="btn btn-link text-danger w-100 text-start px-3" onClick={() => handleLeaveRoom(contextMenu.item.room_id)}>
                Leave Room
              </button>
            )}
          </div>
        </ContextMenu>
      )}
    </div>
  );
};

export default ChatInterface;
