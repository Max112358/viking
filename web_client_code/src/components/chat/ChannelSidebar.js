// part of front end
// components/chat/ChannelSidebar.js
import React from 'react';

const ChannelSidebar = ({ selectedRoom, channels, selectedChannel, onChannelSelect, theme }) => {
  const buttonThemeClasses = theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark';
  const selectedButtonClasses = theme === 'dark' ? 'btn-primary' : 'btn-primary';

  return (
    <div className="p-3">
      <h6 className="mb-3">{selectedRoom.name}</h6>
      <div className="d-flex flex-column gap-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel)}
            className={`btn text-start p-2 ${selectedChannel?.id === channel.id ? selectedButtonClasses : buttonThemeClasses}`}
          >
            <div className="d-flex align-items-center">
              <i className="bi bi-hash me-2"></i>
              <span>{channel.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
