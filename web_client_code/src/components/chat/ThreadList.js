// components/chat/ThreadList.js
import React from 'react';
import { API_BASE_URL } from '../../config';

const ThreadList = ({ selectedChannel, threads, onThreadSelect, onCreateThread, theme }) => {
  // Helper function to get correct image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    // Remove /api if it exists at the start of the path
    return path.replace(/^\/api/, '');
  };

  return (
    <div className="h-100 d-flex flex-column">
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center" style={{ paddingRight: '70px' }}>
          <i className="bi bi-hash me-2"></i>
          <h5 className="mb-0 me-3">{selectedChannel.name}</h5>
          <button
            onClick={onCreateThread}
            className="btn btn-success btn-sm"
            title="Create New Thread"
          >
            <i className="bi bi-chat-dots"></i>
          </button>
        </div>
      </div>
      <div className="flex-grow-1 overflow-auto p-3">
        <div className="d-flex flex-column gap-3">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}
              onClick={() => onThreadSelect(thread)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body">
                <div className="d-flex gap-3">
                  {thread.first_post_image && (
                    <img
                      src={getImageUrl(thread.first_post_image)}
                      alt=""
                      className="rounded"
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <h6 className="card-title">{thread.subject}</h6>
                    <p className="card-text small">{thread.first_post_content}</p>
                    <div
                      className={`small ${theme === 'dark' ? 'text-light-emphasis' : 'text-muted'}`}
                    >
                      {thread.author_email ? `Posted by ${thread.author_email}` : 'Anonymous'} ·{' '}
                      {new Date(thread.created_at).toLocaleDateString()}
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
};

export default ThreadList;
