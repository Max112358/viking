// components/friend-list/FriendSidebar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddFriend from './AddFriend';
import FriendRequests from './FriendRequests';

const FriendSidebar = ({ friends, selectedFriend, onFriendSelect, theme }) => {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const renderMainView = () => (
    <div className="h-100 d-flex flex-column">
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center" style={{ paddingRight: '70px' }}>
          <i className="bi bi-people-fill me-2"></i>
          <h5 className="mb-0 me-3">Friends</h5>
          <button onClick={() => setShowAddFriend(true)} className="btn btn-success btn-sm" title="Add Friend">
            <i className="bi bi-person-plus"></i>
          </button>
          <button onClick={() => setShowRequests(true)} className="btn btn-primary btn-sm ms-2" title="Friend Requests">
            <i className="bi bi-person-lines-fill"></i>
          </button>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3">
        <div className="d-flex flex-column gap-3">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}
              onClick={() => onFriendSelect(friend)}
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
  );

  const renderAddFriend = () => (
    <div className="h-100 d-flex flex-column">
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center">
          <button className="btn btn-link me-3 p-0" onClick={() => setShowAddFriend(false)}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <h5 className="mb-0">Add Friend</h5>
        </div>
      </div>
      <div className="p-3">
        <AddFriend theme={theme} onClose={() => setShowAddFriend(false)} />
      </div>
    </div>
  );

  const renderFriendRequests = () => (
    <div className="h-100 d-flex flex-column">
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center">
          <button className="btn btn-link me-3 p-0" onClick={() => setShowRequests(false)}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <h5 className="mb-0">Friend Requests</h5>
        </div>
      </div>
      <div className="p-3">
        <FriendRequests theme={theme} onUpdate={() => setShowRequests(false)} />
      </div>
    </div>
  );

  if (showAddFriend) return renderAddFriend();
  if (showRequests) return renderFriendRequests();
  return renderMainView();
};

export default FriendSidebar;
