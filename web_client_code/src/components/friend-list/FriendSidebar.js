// components/friend-list/FriendSidebar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddFriend from './AddFriend';
import FriendRequests from './FriendRequests';
import Layout from './Layout';

const FriendSidebar = ({ friends, selectedFriend, onFriendSelect, theme }) => {
  const [filter, setFilter] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const buttonThemeClasses = theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark';
  const selectedButtonClasses = theme === 'dark' ? 'btn-primary' : 'btn-primary';

  const filteredFriends = friends.filter(friend => 
    friend.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Layout theme={theme}>
      {/* Main Friends View */}
      {!showAddFriend && !showRequests && (
        <>
          {/* Search Bar */}
          <div className="p-3">
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Search friends..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            
            {/* Action Buttons */}
            <div className="d-flex gap-2 mb-3">
              <button 
                className="btn btn-success flex-grow-1"
                onClick={() => setShowAddFriend(true)}
              >
                <i className="bi bi-person-plus me-2"></i>
                Add Friend
              </button>
              <button 
                className="btn btn-primary flex-grow-1"
                onClick={() => setShowRequests(true)}
              >
                <i className="bi bi-person-lines-fill me-2"></i>
                Requests
              </button>
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-grow-1 overflow-auto px-3">
            <div className="d-flex flex-column gap-2">
              {filteredFriends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => onFriendSelect(friend)}
                  className={`btn text-start p-2 ${
                    selectedFriend?.id === friend.id ? selectedButtonClasses : buttonThemeClasses
                  }`}
                >
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                         style={{ width: '32px', height: '32px' }}>
                      {friend.email.charAt(0).toUpperCase()}
                    </div>
                    <span>{friend.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Friend View */}
      {showAddFriend && (
        <div className="p-3">
          <AddFriend 
            theme={theme} 
            onClose={() => setShowAddFriend(false)} 
          />
        </div>
      )}

      {/* Friend Requests View */}
      {showRequests && (
        <div className="p-3">
          <FriendRequests 
            theme={theme} 
            onUpdate={() => setShowRequests(false)} 
          />
        </div>
      )}
    </Layout>
  );
};

export default FriendSidebar;