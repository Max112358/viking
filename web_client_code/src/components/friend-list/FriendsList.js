// components/friend-list/FriendsList.js
import React, { useState } from 'react';

const FriendsList = ({
  theme,
  friends,
  categories,
  handlers,
  activeView,
  setActiveView,
  selectedFriend,
  refreshAllData,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const toggleCategory = (categoryId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const renderFriendCard = (friend) => (
    <div
      key={friend.id}
      onClick={() => handlers.handleFriendSelect(friend)}
      className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''} ${
        selectedFriend?.id === friend.id ? 'border-primary' : ''
      }`}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-body py-2">
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

  const renderCategory = (category) => (
    <div
      key={category.id}
      className="mb-3"
      onContextMenu={(e) => handlers.handleContextMenu(e, category)}
    >
      <div
        className="d-flex align-items-center mb-2 user-select-none"
        style={{ cursor: 'pointer' }}
        onClick={() => toggleCategory(category.id)}
      >
        <i
          className={`bi bi-chevron-${collapsedCategories[category.id] ? 'right' : 'down'} me-2`}
        ></i>
        <span className="text-uppercase small fw-bold">{category.name}</span>
        <span className="ms-2 small text-muted">
          (
          {
            friends.filter((friend) => friend.categories?.some((cat) => cat.id === category.id))
              .length
          }
          )
        </span>
      </div>
      {!collapsedCategories[category.id] && (
        <div className="d-flex flex-column gap-2 ms-3">
          {friends
            .filter((friend) => friend.categories?.some((cat) => cat.id === category.id))
            .map(renderFriendCard)}
        </div>
      )}
    </div>
  );

  return (
    <div className="d-flex flex-column h-100">
      {/* Header with buttons */}
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-people-fill me-2"></i>
            <h5 className="mb-0">Friends</h5>
          </div>
          <div>
            <button
              onClick={() => setActiveView('create-category')}
              className={`btn btn-sm me-2 ${
                activeView === 'create-category' ? 'btn-warning' : 'btn-outline-warning'
              }`}
              title="Create Category"
            >
              <i className="bi bi-folder-plus"></i>
            </button>
            <button
              onClick={() => setActiveView('add-friend')}
              className={`btn btn-sm me-2 ${
                activeView === 'add-friend' ? 'btn-success' : 'btn-outline-success'
              }`}
              title="Add Friend"
            >
              <i className="bi bi-person-plus"></i>
            </button>
            <button
              onClick={() => setActiveView('requests')}
              className={`btn btn-sm ${
                activeView === 'requests' ? 'btn-primary' : 'btn-outline-primary'
              }`}
              title="Friend Requests"
            >
              <i className="bi bi-person-lines-fill"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable friend list */}
      <div className="flex-grow-1 overflow-auto p-3">
        {/* Categories */}
        {categories.map(renderCategory)}

        {/* Uncategorized Friends */}
        <div className="mb-3">
          <div
            className="d-flex align-items-center mb-2 user-select-none"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleCategory('uncategorized')}
          >
            <i
              className={`bi bi-chevron-${
                collapsedCategories.uncategorized ? 'right' : 'down'
              } me-2`}
            ></i>
            <span className="text-uppercase small fw-bold">Uncategorized</span>
            <span className="ms-2 small text-muted">
              ({friends.filter((friend) => !friend.categories?.length).length})
            </span>
          </div>
          {!collapsedCategories.uncategorized && (
            <div className="d-flex flex-column gap-2 ms-3">
              {friends.filter((friend) => !friend.categories?.length).map(renderFriendCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
