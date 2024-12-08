// components/friend-list/FriendRequests.js
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const FriendRequests = ({ theme, onUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/requests`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (error) {
      setError('Error loading friend requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        await fetchRequests();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(`Failed to ${action} request`);
      }
    } catch (error) {
      setError(`Error ${action}ing friend request`);
    }
  };

  if (isLoading) return <div className="text-center p-3">Loading requests...</div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;

  return (
    <div className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : 'bg-light text-dark'}`}>
      <div className="card-body">
        <h5 className="card-title mb-3">Friend Requests</h5>
        {requests.length === 0 ? (
          <p className={theme === 'dark' ? 'text-light-emphasis' : 'text-muted'}>No pending friend requests</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {requests.map((request) => (
              <div key={request.id} className={`card ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <div
                          className="rounded-circle bg-secondary text-light d-flex align-items-center justify-content-center me-2"
                          style={{ width: '32px', height: '32px', fontSize: '14px' }}
                        >
                          {request.sender_email?.charAt(0).toUpperCase()}
                        </div>
                        <strong>{request.sender_email}</strong>
                      </div>
                      <small className={theme === 'dark' ? 'text-light-emphasis' : 'text-muted'}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-success btn-sm" onClick={() => handleRequest(request.id, 'accept')}>
                        Accept
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRequest(request.id, 'reject')}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
