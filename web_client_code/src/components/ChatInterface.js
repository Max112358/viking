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
      minWidth: '120px' 
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

  useEffect(() => {
    if (!userEmail) {
      navigate('/');
      return;
    }

    fetchRooms();
  }, [userEmail, navigate]);

  const fetchRooms = async () => {
    try {
      const userId = '1'; // Replace with actual user ID
      const response = await fetch(`${API_BASE_URL}/users/${userId}/rooms`);
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchThreads = async (roomId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/threads`);
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

  const handleContextMenu = useCallback((e, room) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      room: room
    });
  }, []);

  const handleLeaveRoom = async (roomId) => {
    try {
      const userId = '1'; // Replace with actual user ID
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    // Implement thread creation logic
    console.log('Create thread');
  };

  const getBaseClasses = (isDark) => 
    `${isDark ? 'bg-dark text-light' : 'bg-light text-dark'} 
     ${isDark ? 'border-secondary' : 'border-light'}`.trim();

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

      {/* Rooms Sidebar remains the same */}
      <div className={roomSidebarClasses} style={{ width: '64px', zIndex: 2 }}>
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
              style={{ width: '38px', height: '38px' }}
              title={room.name}
            >
              {getRoomDisplay(room)}
            </button>
          ))}
          
          <button
            onClick={handleCreateRoom}
            className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            title="Create New Room"
          >
            +
          </button>
        </div>
      </div>

      {/* Threads Sidebar with updated create button */}
      {selectedRoom && (
        <div 
          className={threadSidebarClasses} 
          style={{ 
            width: '50px', 
            left: showRoomSidebar ? '64px' : '0',
            zIndex: 1 
          }}
        >
          <div className="p-2">
            <div className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between align-items-center">
              <h6 className="m-0 text-truncate">{selectedRoom.name}</h6> {/* Reduced from h5 */}
              </div>
              <button
                onClick={handleCreateThread}
                className="btn btn-success w-100 d-flex align-items-center justify-content-center"
                style={{ height: '30px', borderRadius: '50%' }}
                title="Create New Thread"
              >
                <i className="bi bi-plus"></i> {/* Changed to icon only */}
              </button>
              <div className="d-flex flex-column gap-1"> {/* Reduced gap */}
                {threads.map((thread) => (
                  <button
                  key={thread.id}
                  onClick={() => handleThreadSelect(thread)}
                  className={`
                    btn 
                    text-start 
                    ${selectedThread?.id === thread.id ? selectedButtonClasses : buttonThemeClasses}
                  `}
                  title={thread.subject} // Added title since we're removing text
                >
                  <i className="bi bi-plus"></i> {/* Changed to plus icon */}
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
            <button
              className="btn btn-link text-danger w-100 text-start px-3"
              onClick={() => handleLeaveRoom(contextMenu.room.room_id)}
            >
              Leave Room
            </button>
          </div>
        </ContextMenu>
      )}

      {/* Main Chat Area */}
      <div 
        className="h-100 overflow-hidden"
        style={{ 
          marginLeft: showRoomSidebar 
            ? (selectedRoom ? '114px' : '64px') // Adjusted based on new sidebar widths
            : (showThreadSidebar && selectedRoom ? '250px' : '0'),
          transition: 'margin-left 0.3s ease-in-out'
        }}
      >
        {selectedThread ? (
          <div className="h-100 p-3">
            <h2 className={`fs-4 fw-bold mb-3 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
              {selectedThread.subject}
            </h2>
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