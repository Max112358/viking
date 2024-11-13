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
  const [threads, setThreads] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showRoomSidebar, setShowRoomSidebar] = useState(true);
  const [showThreadSidebar, setShowThreadSidebar] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userEmail) {
      navigate('/');
      return;
    }

    fetchRooms();
  }, [userEmail, navigate]);

  const fetchRooms = async () => {
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
  };

  const fetchThreads = async (roomId) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/threads/${roomId}`, {
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

  const handleInvalidToken = () => {
    // Remove the token from local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');

    // Navigate the user to the login page
    navigate('/');
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
    setSelectedThread(null);
    fetchThreads(room.room_id);
    if (isMobile) {
      setShowRoomSidebar(false);
      setShowThreadSidebar(true);
    }
  };

  const handleThreadSelect = (thread) => {
    setSelectedThread(thread);
    if (isMobile) {
      setShowThreadSidebar(false);
    }
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

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleCreateThread = () => {
    if (selectedRoom) {
      navigate(`/create-thread/${selectedRoom.room_id}`);
    }
  };

  const handleLogout = () => {
    // Remove the token from local storage
    //localStorage.removeItem('authToken');
    //localStorage.removeItem('userId');
    //localStorage.removeItem('userEmail');

    // Clear all items from local storage
    localStorage.clear();

    // Navigate the user to the login page
    navigate('/');
  };

  const getBaseClasses = (isDark) =>
    `${isDark ? 'bg-dark text-light' : 'bg-light text-dark'} 
     ${isDark ? 'border-secondary' : 'border-light'}`.trim();

  const ROOM_BUTTON_SIZE = 38;

  const getRoomSidebarWidth = () => {
    const padding = 16; // optional padding or margins on each side
    return ROOM_BUTTON_SIZE + padding;
  };

  const getThreadSidebarWidth = () => {
    //const maxThreadSubjectLength = Math.max(...threads.map((thread) => thread.subject.length));
    //return Math.max(150, 24 + maxThreadSubjectLength * 8); // Adjust width based on longest thread subject
    return 280; // Fixed width for better formatting of thread cards
  };

  const getThreadTitleStyle = (roomName) => {
    const sidebarWidth = getThreadSidebarWidth();
    const words = roomName.split(' ');
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const wordsPerLine = Math.ceil(words.length / 3); // Distribute words across 3 lines
    const targetWidth = sidebarWidth * 0.9; // 90% of sidebar width

    // Calculate font size based on longest word to ensure it fits
    const longestWordLength = Math.max(...words.map((word) => word.length));
    const pixelsPerChar = targetWidth / longestWordLength;
    const fontSize = Math.min(16, Math.max(12, pixelsPerChar * 1.2));

    return {
      fontSize: `${fontSize}px`,
      lineHeight: 1.4,
      padding: '2px 0',
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      maxHeight: `${fontSize * 1.4 * 3}px`, // 3 lines of text
      wordBreak: 'break-word',
    };
  };

  const roomSidebarClasses = `
  position-fixed 
  start-0 
  top-0  
  h-100 
  ${showRoomSidebar ? '' : 'translate-x-[-100%]'}
  border-end
  ${getBaseClasses(theme === 'dark')}
  transition-transform
  duration-300
  `.trim();

  const threadSidebarClasses = `
  position-fixed 
  h-100 
  ${showThreadSidebar ? '' : 'translate-x-[-100%]'}
  border-end
  ${getBaseClasses(theme === 'dark')}
  transition-transform
  duration-300
  `.trim();

  const buttonThemeClasses = theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark';
  const selectedButtonClasses = theme === 'dark' ? 'btn-primary' : 'btn-primary';

  return (
    <div className={`vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* Mobile buttons with smaller size */}
      {isMobile && (
        <>
          <button
            onClick={() => setShowRoomSidebar(!showRoomSidebar)}
            className="btn position-fixed top-0 start-0 m-2 z-3" // Reduced margin
          >
            <i className="bi bi-list fs-5"></i> {/* Reduced from fs-4 */}
          </button>
          {selectedRoom && (
            <button
              onClick={() => setShowThreadSidebar(!showThreadSidebar)}
              className="btn position-fixed top-0 start-0 m-2 z-3" // Reduced margin
              style={{ left: '64px' }} // Reduced from 80px
            >
              <i className="bi bi-chat-left-text fs-5"></i> {/* Reduced from fs-4 */}
            </button>
          )}
        </>
      )}

      {/* Rooms Sidebar with dynamic width */}
      <div className={roomSidebarClasses} style={{ width: `${getRoomSidebarWidth()}px`, zIndex: 2 }}>
        <div className="d-flex flex-column p-2 gap-2">
          {rooms.map((room) => (
            <button
              key={room.room_id}
              onClick={() => handleRoomSelect(room)}
              onContextMenu={(e) => handleContextMenu(e, room)}
              className={`
                btn 
                rounded-circle 
                d-flex 
                align-items-center 
                justify-content-center
                p-0
                overflow-hidden
                ${selectedRoom?.room_id === room.room_id ? selectedButtonClasses : buttonThemeClasses}
              `}
              style={{
                width: `${ROOM_BUTTON_SIZE}px`,
                height: `${ROOM_BUTTON_SIZE}px`,
              }} // Use the constant here
              title={room.name}
            >
              {getRoomDisplay(room)}
            </button>
          ))}

          <button
            onClick={handleCreateRoom}
            className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: `${ROOM_BUTTON_SIZE}px`,
              height: `${ROOM_BUTTON_SIZE}px`,
            }} // Use the constant here
            title="Create New Room"
          >
            <i className="bi bi-plus"></i> {/* Changed to icon only */}
          </button>
        </div>
      </div>

      {/* Threads Sidebar with dynamic width */}
      {selectedRoom && (
        <div
          className={threadSidebarClasses}
          style={{
            width: `${getThreadSidebarWidth()}px`,
            left: showRoomSidebar ? `${getRoomSidebarWidth()}px` : '0',
            zIndex: 1,
          }}
        >
          <div className="p-2">
            <div className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="m-0" style={getThreadTitleStyle(selectedRoom.name)}>
                  {selectedRoom.name}
                </h6>
              </div>
              <button
                onClick={handleCreateThread}
                className="btn btn-success w-100 d-flex align-items-center justify-content-center"
                style={{
                  height: '30px',
                  //borderRadius: '50%', //makes it a circle
                }}
                title="Create New Thread"
              >
                <i className="bi bi-plus"></i> {/* Changed to icon only */}
              </button>
              <div className="d-flex flex-column gap-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread)}
                    onContextMenu={(e) => handleContextMenu(e, thread, 'thread')}
                    className={`
                      btn 
                      p-2
                      text-start 
                      ${selectedThread?.id === thread.id ? selectedButtonClasses : buttonThemeClasses}
                    `}
                    style={{
                      minHeight: '80px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start',
                    }}
                  >
                    {thread.first_post_image ? (
                      <img
                        src={`${API_BASE_URL}${thread.first_post_image}`}
                        alt=""
                        className="rounded"
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="rounded bg-secondary"
                        style={{
                          width: '60px',
                          height: '60px',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div className="overflow-hidden">
                      <div className="fw-medium text-truncate mb-1" style={{ fontSize: '14px' }}>
                        {thread.subject}
                      </div>
                      <div
                        className="small opacity-75"
                        style={{
                          fontSize: '12px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.2',
                        }}
                      >
                        {thread.first_post_content}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}>
          <div className="py-2">
            {contextMenu.type === 'room' && (
              <button className="btn btn-link text-danger w-100 text-start px-3" onClick={() => handleLeaveRoom(contextMenu.item.room_id)}>
                Leave Room
              </button>
            )}
            {contextMenu.type === 'thread' && (
              <button
                className={`btn btn-link w-100 text-start px-3 ${contextMenu.item.author_id === userId ? 'text-danger' : 'text-muted'}`}
                onClick={() => {
                  if (contextMenu.item.author_id === userId) {
                    handleDeleteThread(contextMenu.item.id);
                  }
                }}
                disabled={contextMenu.item.author_id !== userId}
              >
                Delete Thread {contextMenu.item.author_id !== userId ? '(must be author)' : ''}
              </button>
            )}
          </div>
        </ContextMenu>
      )}

      {/* Main Chat Area */}
      <div
        className="h-100 overflow-hidden"
        style={{
          marginLeft: showRoomSidebar
            ? selectedRoom
              ? `${getRoomSidebarWidth() + getThreadSidebarWidth()}px`
              : `${getRoomSidebarWidth()}px`
            : showThreadSidebar && selectedRoom
            ? `${getThreadSidebarWidth()}px`
            : '0',
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        {selectedThread ? (
          <div className="h-100 p-3">
            <h2 className={`fs-4 fw-bold mb-3 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>{selectedThread.subject}</h2>
            <div className={`h-100 rounded ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`}>
              <div className="p-3">Chat messages will appear here</div>
            </div>
          </div>
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <p className={theme === 'dark' ? 'text-light' : 'text-dark'}>
              {selectedRoom ? 'Select a thread to start chatting' : 'Select a room to view threads'}
            </p>
          </div>
        )}
      </div>

      {/* Logout button */}
      <button className={`btn btn-sm btn-outline-danger position-fixed top-0 end-0 m-2 z-3 ${buttonThemeClasses}`} onClick={handleLogout}>
        <i className="bi bi-box-arrow-right"></i> Logout
      </button>

      <style>
        {`
          .translate-x-[-100%] {
            transform: translateX(-100%);
          }
          
          .transition-transform {
            transition: transform 0.3s ease-in-out;
          }
          
          .duration-300 {
            transition-duration: 300ms;
          }
          
          @media (max-width: 768px) {
            .position-fixed {
              z-index: 1030;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChatInterface;
