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
      minWidth: '150px'
    }}
  >
    {children}
  </div>
);

const ChatInterface = ({ theme }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(true);
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
    if (isMobile) {
      setShowSidebar(false);
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
        // If we were viewing this room, clear the selection
        if (selectedRoom?.room_id === roomId) {
          setSelectedRoom(null);
        }
        // Refresh the rooms list
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

  const sidebarClasses = `
    sidebar 
    position-fixed 
    start-0 
    top-0 
    h-100 
    ${showSidebar ? '' : 'sidebar-hidden'}
    ${theme === 'dark' ? 'bg-dark' : 'bg-light'}
    border-end
    ${theme === 'dark' ? 'border-secondary' : 'border-light'}
  `.trim();

  const buttonThemeClasses = theme === 'dark' 
    ? 'btn-outline-light' 
    : 'btn-outline-dark';

  const selectedButtonClasses = theme === 'dark'
    ? 'btn-primary'
    : 'btn-primary';

  return (
    <div className={`vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {isMobile && (
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="btn position-fixed top-0 start-0 m-3 z-3"
        >
          <i className="bi bi-list fs-4"></i>
        </button>
      )}

      {/* Rooms Sidebar */}
      <div className={sidebarClasses} style={{ width: '80px', zIndex: 2 }}>
        <div className="d-flex flex-column p-3 gap-3">
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
              style={{ width: '48px', height: '48px' }}
              title={room.name}
            >
              {getRoomDisplay(room)}
            </button>
          ))}
          
          <button
            onClick={handleCreateRoom}
            className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '48px', height: '48px' }}
            title="Create New Room"
          >
            +
          </button>
        </div>
      </div>

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

      {/* Main Content Area */}
      <div 
        className="h-100 overflow-hidden"
        style={{ 
          marginLeft: showSidebar ? '80px' : '0',
          transition: 'margin-left 0.3s ease-in-out'
        }}
      >
        {selectedRoom ? (
          <div className="h-100 p-3">
            <h2 className={`fs-4 fw-bold mb-3 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
              {selectedRoom.name}
            </h2>
            <div className={`h-100 rounded ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`}>
              <div className="p-3">Chat messages will appear here</div>
            </div>
          </div>
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <p className={theme === 'dark' ? 'text-light' : 'text-dark'}>
              Select a room to start chatting
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          .sidebar {
            transition: transform 0.3s ease-in-out;
          }
          
          .sidebar-hidden {
            transform: translateX(-100%);
          }
          
          @media (max-width: 768px) {
            .sidebar {
              z-index: 1030;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChatInterface;