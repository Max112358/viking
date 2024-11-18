// components/chat/RoomSidebar.js
import React from 'react';

const RoomSidebar = ({ rooms, selectedRoom, onRoomSelect, onCreateRoom, onRoomContextMenu, getRoomDisplay, theme }) => {
  const ROOM_BUTTON_SIZE = 38;
  const buttonThemeClasses = theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark';
  const selectedButtonClasses = theme === 'dark' ? 'btn-primary' : 'btn-primary';

  return (
    <div className="d-flex flex-column p-2 gap-2">
      {rooms.map((room) => (
        <button
          key={room.room_id}
          onClick={() => onRoomSelect(room)}
          onContextMenu={(e) => onRoomContextMenu(e, room)}
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
        onClick={onCreateRoom}
        className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: `${ROOM_BUTTON_SIZE}px`, height: `${ROOM_BUTTON_SIZE}px` }}
        title="Create New Room"
      >
        <i className="bi bi-plus"></i>
      </button>
    </div>
  );
};

export default RoomSidebar;
