// components/friend-list/FriendsView.js
import React from 'react';
import MainNavigation from '../navigation/MainNavigation';
import CreateFriendCategory from './CreateFriendCategory';
import AddFriend from './AddFriend';
import FriendRequests from './FriendRequests';
import CategoryContextMenu from './CategoryContextMenu';
import FriendsList from './FriendsList';
import DirectMessage from './DirectMessage';

const FriendsView = ({
  theme,
  rooms,
  friends,
  categories,
  selectedRoom,
  handleRoomSelect,
  activeView,
  setActiveView,
  selectedFriend,
  contextMenu,
  handlers,
  refreshAllData,
}) => {
  const {
    handleThreadSelect,
    handleBackToThreads,
    handleCreateThread,
    handleCloseContextMenu,
    handleDeleteCategory,
  } = handlers;

  return (
    <div className={`vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* Rooms Sidebar */}
      <div
        className={`position-fixed start-0 top-0 h-100 border-end ${
          theme === 'dark'
            ? 'bg-dark text-light border-secondary'
            : 'bg-light text-dark border-light'
        }`}
        style={{ width: '54px', zIndex: 2 }}
      >
        <MainNavigation
          rooms={rooms}
          selectedRoom={selectedRoom}
          onRoomSelect={handleRoomSelect}
          theme={theme}
          activeSection="friends"
        />
      </div>

      {/* Main Content Area */}
      <div
        className="h-100 overflow-hidden"
        style={{
          marginLeft: '54px',
        }}
      >
        <div className="container-fluid h-100">
          <div className="row h-100">
            {/* Friends List */}
            <div className="col-md-3 border-end h-100 p-0">
              <FriendsList
                theme={theme}
                friends={friends}
                categories={categories}
                handlers={handlers}
                activeView={activeView}
                setActiveView={setActiveView}
                selectedFriend={selectedFriend}
                refreshAllData={refreshAllData}
              />
            </div>

            {/* Chat/Content Area */}
            <div className="col-md-9 p-0 h-100">
              {activeView === 'create-category' ? (
                <CreateFriendCategory
                  theme={theme}
                  onClose={() => setActiveView(null)}
                  refreshAllData={refreshAllData}
                />
              ) : activeView === 'add-friend' ? (
                <AddFriend
                  theme={theme}
                  onClose={() => setActiveView(null)}
                  refreshAllData={refreshAllData}
                />
              ) : activeView === 'requests' ? (
                <FriendRequests
                  theme={theme}
                  onClose={() => setActiveView(null)}
                  refreshAllData={refreshAllData}
                />
              ) : selectedFriend ? (
                <DirectMessage
                  friend={selectedFriend}
                  theme={theme}
                  onClose={() => handlers.setSelectedFriend(null)}
                  refreshAllData={refreshAllData}
                />
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <p className="text-muted">
                    Select a friend to start chatting or use the buttons above to manage your
                    friends list
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CategoryContextMenu x={contextMenu.x} y={contextMenu.y} onClose={handleCloseContextMenu}>
          <button
            className="btn btn-link text-danger w-100 text-start px-3"
            onClick={() => handleDeleteCategory(contextMenu.category.id)}
          >
            <i className="bi bi-trash me-2"></i>
            Delete Category
          </button>
        </CategoryContextMenu>
      )}

      {/* Logout Button */}
      <button
        className="btn btn-sm btn-outline-danger position-fixed"
        onClick={handlers.handleLogout}
        style={{
          top: '10px',
          right: '10px',
          zIndex: 9999,
        }}
      >
        <i className="bi bi-box-arrow-right"></i> Logout
      </button>
    </div>
  );
};

export default FriendsView;
