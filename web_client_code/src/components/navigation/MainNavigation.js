// components/navigation/MainNavigation.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const MainNavigation = ({ rooms = [], selectedRoom = null, onRoomSelect, theme, activeSection = 'chat' }) => {
  const navigate = useNavigate();
  const buttonThemeClasses = theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark';
  const selectedButtonClasses = theme === 'dark' ? 'btn-primary' : 'btn-primary';

  // Smaller base size and proper container width
  const BUTTON_SIZE = 38; // px
  const PADDING = 8; // px
  const CONTAINER_WIDTH = BUTTON_SIZE + PADDING * 2; // Total width including padding

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

  return (
    <div
      className="d-flex flex-column h-100 position-fixed start-0 top-0"
      style={{
        width: `${CONTAINER_WIDTH}px`,
        padding: `${PADDING}px`,
      }}
    >
      {/* Friends Button */}
      <button
        className={`btn rounded-circle d-flex align-items-center justify-content-center mb-2 ${
          activeSection === 'friends' ? selectedButtonClasses : buttonThemeClasses
        }`}
        style={{
          width: `${BUTTON_SIZE}px`,
          height: `${BUTTON_SIZE}px`,
          minWidth: `${BUTTON_SIZE}px`, // Prevent button from expanding
        }}
        onClick={() => navigate('/friends')}
        title="Friends List"
      >
        <i className="bi bi-people-fill"></i>
      </button>

      <div className={`w-100 mb-2 ${theme === 'dark' ? 'border-secondary' : 'border-dark'}`} style={{ borderBottom: '1px solid' }} />

      {/* Rooms Section */}
      <div
        className="flex-grow-1 overflow-auto d-flex flex-column gap-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            width: 0,
            height: 0,
            display: 'none',
          },
        }}
      >
        {rooms.map((room) => (
          <button
            key={room.room_id}
            onClick={() => onRoomSelect(room)}
            className={`btn rounded-circle d-flex align-items-center justify-content-center p-0 overflow-hidden ${
              selectedRoom?.room_id === room.room_id ? selectedButtonClasses : buttonThemeClasses
            }`}
            style={{
              width: `${BUTTON_SIZE}px`,
              height: `${BUTTON_SIZE}px`,
              minWidth: `${BUTTON_SIZE}px`, // Prevent button from expanding
            }}
            title={room.name}
          >
            {getRoomDisplay(room)}
          </button>
        ))}
      </div>

      {/* Create Room Button */}
      <div>
        <div className={`w-100 mt-2 ${theme === 'dark' ? 'border-secondary' : 'border-dark'}`} style={{ borderTop: '1px solid' }} />
        <button
          onClick={() => navigate('/create-room')}
          className="btn btn-success rounded-circle d-flex align-items-center justify-content-center mt-2"
          style={{
            width: `${BUTTON_SIZE}px`,
            height: `${BUTTON_SIZE}px`,
            minWidth: `${BUTTON_SIZE}px`, // Prevent button from expanding
          }}
          title="Create New Room"
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>
    </div>
  );
};

export default MainNavigation;
