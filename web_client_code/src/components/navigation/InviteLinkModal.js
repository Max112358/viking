// components/navigation/InviteLinkModal.js
import React, { useState } from 'react';

const InviteLinkModal = ({ show, onClose, inviteUrl, error, isLoading, theme }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop show" style={{ opacity: 0.5 }} />
      <div className={`modal d-block ${theme === 'dark' ? 'dark-mode' : ''}`} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
            <div className="modal-header">
              <h5 className="modal-title">Invite Link</h5>
              <button
                type="button"
                className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`}
                onClick={onClose}
              />
            </div>
            <div className="modal-body">
              {error ? (
                <div className="alert alert-danger">{error}</div>
              ) : isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Creating invite link...</span>
                  </div>
                  <div className="mt-2">Creating invite link...</div>
                </div>
              ) : inviteUrl ? (
                <>
                  <div className="input-group">
                    <input
                      type="text"
                      className={`form-control ${
                        theme === 'dark' ? 'bg-secondary text-light' : ''
                      }`}
                      value={inviteUrl}
                      readOnly
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                      onClick={handleCopy}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <small className="text-muted mt-2 d-block">
                    Share this link with others to invite them to the room
                  </small>
                </>
              ) : null}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`btn ${theme === 'dark' ? 'btn-secondary' : 'btn-light'}`}
                onClick={onClose}
                disabled={isLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InviteLinkModal;
