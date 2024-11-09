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
    navigate('/create-room'); // Navigate to the create room page
  };

  return (
    <div className={`h-screen w-full flex ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-4 left-4 z-50"
        >
          <i className="bi bi-list fs-4"></i>
        </button>
      )}

      {/* Rooms Sidebar */}
      <div 
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } transform transition-transform duration-300 fixed md:relative md:translate-x-0 h-full w-20 flex-shrink-0 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        } border-r ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        } overflow-y-auto z-40`}
      >
        <div className="flex flex-col items-center py-4 space-y-4">
          {rooms.map((room) => (
            <button
              key={room.room_id}
              onClick={() => handleRoomSelect(room)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                selectedRoom?.room_id === room.room_id
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={room.name}
            >
              {room.name.charAt(0).toUpperCase()}
            </button>
          ))}
          
          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              theme === 'dark'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            title="Create New Room"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden">
        {selectedRoom ? (
          <div className="h-full p-4">
            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {selectedRoom.name}
            </h2>
            {/* Chat interface will go here */}
            <div className={`h-full rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {/* Placeholder for chat component */}
              <div className="p-4">Chat messages will appear here</div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;