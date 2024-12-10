// components/navigation/NavContextMenu.js
import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import InviteLinkModal from './InviteLinkModal';

// Get the frontend URL, fallback to the current window location
const FRONTEND_URL = window.location.origin;

const NavContextMenu = ({ contextMenu, onClose, theme }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);

  // Reset states when context menu closes
  useEffect(() => {
    if (!contextMenu && !showInviteModal) {
      setInviteUrl('');
      setError(null);
      setIsLoading(false);
    }
  }, [contextMenu, showInviteModal]);

  const handleLeaveRoom = async (roomId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to leave room');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      setError('Failed to leave room');
    }
    onClose();
  };

  const handleCreateInvite = async (roomId) => {
    setIsLoading(true);
    setShowInviteModal(true);
    onClose(); // Close context menu but keep modal open

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create invite');
      }

      // Construct the full URL using window.location.origin as fallback
      const fullInviteUrl = `${FRONTEND_URL}/invite/${data.inviteCode}`;
      setInviteUrl(fullInviteUrl);
      setError(null);
    } catch (error) {
      console.error('Error creating invite:', error);
      setError(error.message || 'Failed to create invite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className={`position-fixed bg-white shadow rounded border ${
            theme === 'dark' ? 'bg-dark text-light' : ''
          }`}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1050,
            minWidth: '160px',
          }}
        >
          <button
            className="btn btn-link text-danger d-block w-100 text-start px-3"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLeaveRoom(contextMenu.room.room_id);
            }}
          >
            <i className="bi bi-box-arrow-left me-2"></i>
            Leave Room
          </button>
          <button
            className="btn btn-link text-primary d-block w-100 text-start px-3"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCreateInvite(contextMenu.room.room_id);
            }}
          >
            <i className="bi bi-link-45deg me-2"></i>
            Create Invite Link
          </button>
        </div>
      )}

      {/* Invite Modal - shown independently of context menu */}
      <InviteLinkModal
        show={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteUrl('');
          setError(null);
        }}
        inviteUrl={inviteUrl}
        error={error}
        isLoading={isLoading}
        theme={theme}
      />
    </>
  );
};

export default NavContextMenu;
