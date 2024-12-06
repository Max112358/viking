// components/friend-list/CreateFriendCategory.js
import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';

const CreateFriendCategory = ({ theme, onClose, onCategoryCreated }) => {
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/friends/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        onCategoryCreated();
        onClose();
      } else {
        setError(data.message || 'Failed to create category');
      }
    } catch (error) {
      setError('An error occurred while creating the category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Create Category</h5>
          <button type="button" className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`} onClick={onClose} aria-label="Close" />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              maxLength={50}
              disabled={isLoading}
            />
            <small className={`form-text ${theme === 'dark' ? 'text-light-emphasis' : 'text-muted'}`}>Maximum 50 characters</small>
          </div>
          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFriendCategory;
