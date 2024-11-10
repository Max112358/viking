import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const ChatInterface = ({ theme }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!userEmail) {
      navigate('/');
      return;
    }

    const fetchRooms = async () => {
      try {
        const userId = '1'; // You'll need to implement proper user ID storage
        const response = await fetch(`${API_BASE_URL}/users/${userId}/rooms`);
        const data = await response.json();
        console.log('Fetched rooms data:', data.rooms); // Add this line
        setRooms(data.rooms || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchRooms();
  }, [userEmail, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  // Helper function to handle room display (thumbnail or letter)
  const getRoomDisplay = (room) => {
    console.log('Room data:', room); // Add this line
    console.log('Thumbnail URL:', room.thumbnail_url); // Add this line
    if (room.thumbnail_url) {
      const fullUrl = `${API_BASE_URL}${room.thumbnail_url}`;
      console.log('Full image URL:', fullUrl); // Add this line
      return (
        <img 
          src={fullUrl}
          alt={room.name}
          className="w-100 h-100 rounded-circle object-fit-cover"
          onError={(e) => {
            console.log('Image failed to load'); // Add this line
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentElement.textContent = room.name.charAt(0).toUpperCase();
          }}
        />
      );
    }
    return room.name.charAt(0).toUpperCase();
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
    <div className={`vh-100 d-flex ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* Mobile Toggle Button */}
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
          
          {/* Create Room Button */}
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

      {/* Main Content Area */}
      <div className="flex-grow-1 h-100 overflow-hidden ms-5" style={{ marginLeft: '80px' }}>
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