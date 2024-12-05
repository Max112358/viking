// components/friend-list/AddFriend.js
import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';

const AddFriend = ({ theme, onClose }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Friend request sent!');
        setEmail('');
      } else {
        setError(data.message || 'Failed to send friend request');
      }
    } catch (error) {
      setError('An error occurred while sending the request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Add Friend</h5>
          <button className="btn btn-close" onClick={onClose} />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Enter friend's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100" 
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Friend Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFriend;