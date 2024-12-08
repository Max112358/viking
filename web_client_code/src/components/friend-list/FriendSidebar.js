// components/friend-list/FriendSidebar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddFriend from './AddFriend';
import FriendRequests from './FriendRequests';

const FriendSidebar = ({ friends = [], selectedFriend, onFriendSelect, theme }) => {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const toggleCategory = (categoryId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Group friends by category
  const friendsByCategory = friends.reduce((acc, friend) => {
    // Create an "Uncategorized" group for friends without categories
    if (!friend.categories || friend.categories.length === 0) {
      if (!acc.uncategorized) {
        acc.uncategorized = [];
      }
      acc.uncategorized.push(friend);
      return acc;
    }

    // Add friend to each of their categories
    friend.categories.forEach((category) => {
      if (!acc[category.id]) {
        acc[category.id] = {
          name: category.name,
          friends: [],
        };
      }
      acc[category.id].friends.push(friend);
    });
    return acc;
  }, {});

  const renderFriend = (friend) => (
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
  );

  const renderCategory = (categoryId, category) => (
    <div key={categoryId} className="mb-3">
      <div
        className="d-flex align-items-center mb-2 user-select-none"
        style={{ cursor: 'pointer' }}
        onClick={() => toggleCategory(categoryId)}
      >
        <i className={`bi bi-chevron-${collapsedCategories[categoryId] ? 'right' : 'down'} me-2`}></i>
        <span className="text-uppercase small fw-bold">{categoryId === 'uncategorized' ? 'Uncategorized' : category.name}</span>
        <span className="ms-2 small text-muted">({categoryId === 'uncategorized' ? category.length : category.friends.length})</span>
      </div>
      {!collapsedCategories[categoryId] && (
        <div className="d-flex flex-column gap-2">
          {categoryId === 'uncategorized'
            ? category.map((friend) => renderFriend(friend))
            : category.friends.map((friend) => renderFriend(friend))}
        </div>
      )}
    </div>
  );

  const renderMainView = () => (
    <div className="h-100 d-flex flex-column">
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-people-fill me-2"></i>
            <h5 className="mb-0">Friends</h5>
          </div>
          <div>
            <button onClick={() => setShowAddFriend(true)} className="btn btn-success btn-sm me-2" title="Add Friend">
              <i className="bi bi-person-plus"></i>
            </button>
            <button onClick={() => setShowRequests(true)} className="btn btn-primary btn-sm" title="Friend Requests">
              <i className="bi bi-person-lines-fill"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3">
        {Object.entries(friendsByCategory).map(([categoryId, category]) => renderCategory(categoryId, category))}
      </div>
    </div>
  );

  if (showAddFriend) {
    return <AddFriend theme={theme} onClose={() => setShowAddFriend(false)} />;
  }

  if (showRequests) {
    return <FriendRequests theme={theme} onClose={() => setShowRequests(false)} />;
  }

  return renderMainView();
};

export default FriendSidebar;
