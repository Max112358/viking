// components/InviteHandler.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const InviteHandler = ({ theme }) => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleInvite = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/rooms/invite/${inviteCode}/join`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Fetch room URL to redirect to
          const roomResponse = await fetch(`${API_BASE_URL}/rooms/invite/${inviteCode}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const roomData = await roomResponse.json();
          navigate(`/v/${roomData.urlName}`);
        } else {
          setError(data.message || 'Failed to join room');
          setTimeout(() => navigate('/chat'), 3000);
        }
      } catch (error) {
        console.error('Error joining room:', error);
        setError('Failed to join room');
        setTimeout(() => navigate('/chat'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    handleInvite();
  }, [inviteCode, navigate]);

  if (isLoading) {
    return (
      <div
        className={`min-vh-100 d-flex align-items-center justify-content-center ${
          theme === 'dark' ? 'bg-dark text-light' : 'bg-light'
        }`}
      >
        <div className="text-center">
          <div className="spinner-border mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>Processing invite...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-vh-100 d-flex align-items-center justify-content-center ${
          theme === 'dark' ? 'bg-dark text-light' : 'bg-light'
        }`}
      >
        <div className="alert alert-danger">
          {error}
          <div className="mt-2 small">Redirecting to chat...</div>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteHandler;
