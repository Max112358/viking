// components/chat/RoomSidebar.js
import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import FriendSidebar from '../friend-list/FriendSidebar';

const RoomSidebar = ({ rooms, selectedRoom, onRoomSelect, onCreateRoom, onRoomContextMenu, getRoomDisplay, theme }) => {
  const ROOM_BUTTON_SIZE = 38;
  const buttonThemeClasses = theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark';
  const selectedButtonClasses = theme === 'dark' ? 'btn-primary' : 'btn-primary';
  
  const [showingFriends, setShowingFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const handleFriendsClick = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/friends`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
        setShowingFriends(!showingFriends); // Toggle friends list
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        console.error('Error fetching friends:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
    if (friend.room_url) {
      onRoomSelect({
        room_id: friend.room_id,
        url_name: friend.room_url,
        name: `Chat with ${friend.email}`
      });
    }
  };

  return (
    <div className="d-flex h-100">
      {/* Rooms Column */}
      <div className="d-flex flex-column p-2">
        <button
          className={`btn ${buttonThemeClasses} rounded-circle d-flex align-items-center justify-content-center mb-2 ${
            showingFriends ? selectedButtonClasses : ''
          }`}
          style={{ width: `${ROOM_BUTTON_SIZE}px`, height: `${ROOM_BUTTON_SIZE}px` }}
          title="Friends List"
          onClick={handleFriendsClick}
        >
          <i className="bi bi-people-fill"></i>
        </button>

        <div 
          className={`w-100 mb-2 ${theme === 'dark' ? 'border-secondary' : 'border-dark'}`} 
          style={{ borderBottom: '1px solid' }}
        />

        <div className="flex-grow-1 overflow-auto d-flex flex-column gap-2">
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
        </div>

        <div 
          className={`w-100 mt-2 ${theme === 'dark' ? 'border-secondary' : 'border-dark'}`} 
          style={{ borderTop: '1px solid' }}
        />
        
        <button
          onClick={onCreateRoom}
          className="btn btn-success rounded-circle d-flex align-items-center justify-content-center mt-2"
          style={{ width: `${ROOM_BUTTON_SIZE}px`, height: `${ROOM_BUTTON_SIZE}px` }}
          title="Create New Room"
        >
          <i className="bi bi-plus"></i>
        </button>
      </div>

      {/* Friends Sidebar */}
      {showingFriends && (
        <div className="border-start" style={{ width: '240px' }}>
          <FriendSidebar
            friends={friends}
            selectedFriend={selectedFriend}
            onFriendSelect={handleFriendSelect}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};

export default RoomSidebar;