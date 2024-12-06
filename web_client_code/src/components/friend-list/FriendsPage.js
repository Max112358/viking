// components/friend-list/FriendsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import AddFriend from './AddFriend';
import FriendRequests from './FriendRequests';
import MainNavigation from '../navigation/MainNavigation';
import CreateFriendCategory from './CreateFriendCategory';

const FriendsPage = ({ theme }) => {
  const [friends, setFriends] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeView, setActiveView] = useState(null); // 'add-friend' or 'requests'
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch friends');
      }

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
    }
  };

  const handleRoomSelect = (room) => {
    navigate(`/v/${room.url_name}`);
  };

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
    setActiveView(null);
    if (friend.room_url) {
      navigate(`/v/${friend.room_url}`);
    }
  };

  const ROOM_BUTTON_SIZE = 38;

  return (
    <div className={`vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* Rooms Sidebar */}
      <div
        className={`position-fixed start-0 top-0 h-100 border-end ${
          theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-light text-dark border-light'
        }`}
        style={{ width: '54px', zIndex: 2 }}
      >
        <MainNavigation rooms={rooms} selectedRoom={selectedRoom} onRoomSelect={handleRoomSelect} theme={theme} activeSection="friends" />
      </div>

      {/* Friends Content Area */}
      <div
        className="h-100 overflow-hidden"
        style={{
          marginLeft: `${ROOM_BUTTON_SIZE + 16}px`,
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <div className="container-fluid h-100">
          <div className="row h-100">
            {/* Friends List */}
            <div className="col-md-3 border-end h-100 p-0">
              <div className="d-flex flex-column h-100">
                <div className="p-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-people-fill me-2"></i>
                      <h5 className="mb-0">Friends</h5>
                    </div>
                    <div>
                      <button
                        onClick={() => setActiveView('create-category')}
                        className={`btn btn-sm me-2 ${activeView === 'create-category' ? 'btn-warning' : 'btn-outline-warning'}`}
                        title="Create Category"
                      >
                        <i className="bi bi-folder-plus"></i>
                      </button>
                      <button
                        onClick={() => setActiveView('add-friend')}
                        className={`btn btn-sm me-2 ${activeView === 'add-friend' ? 'btn-success' : 'btn-outline-success'}`}
                        title="Add Friend"
                      >
                        <i className="bi bi-person-plus"></i>
                      </button>
                      <button
                        onClick={() => setActiveView('requests')}
                        className={`btn btn-sm ${activeView === 'requests' ? 'btn-primary' : 'btn-outline-primary'}`}
                        title="Friend Requests"
                      >
                        <i className="bi bi-person-lines-fill"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-grow-1 overflow-auto p-3">
                  <div className="d-flex flex-column gap-3">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}
                        onClick={() => handleFriendSelect(friend)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3"
                              style={{ width: '48px', height: '48px', flexShrink: 0 }}
                            >
                              {friend.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h6 className="card-title mb-1">{friend.email}</h6>
                              <div className={`small ${theme === 'dark' ? 'text-light-emphasis' : 'text-muted'}`}>
                                {friend.status === 'online' ? 'Online' : 'Offline'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-md-9 p-3">
              {activeView === 'create-category' ? (
                <CreateFriendCategory
                  theme={theme}
                  onClose={() => setActiveView(null)}
                  onCategoryCreated={() => {
                    setActiveView(null);
                    fetchFriends();
                  }}
                />
              ) : activeView === 'add-friend' ? (
                <AddFriend theme={theme} onClose={() => setActiveView(null)} />
              ) : activeView === 'requests' ? (
                <FriendRequests
                  theme={theme}
                  onUpdate={() => {
                    setActiveView(null);
                    fetchFriends();
                  }}
                />
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <p className="text-muted">Select a friend to start chatting or use the buttons above to manage your friends list</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
