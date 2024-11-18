// components/CreateCategory.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateCategory = ({ theme }) => {
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const navigate = useNavigate();
  const { roomUrl } = useParams();

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const roomData = await response.json();
          if (!roomData.is_admin) {
            // Redirect if user is not an admin
            navigate(`/v/${roomUrl}`);
            return;
          }
          setRoom(roomData);
        } else {
          navigate('/chat');
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        setError('Failed to load room data');
      }
    };

    if (roomUrl) {
      fetchRoomData();
    } else {
      navigate('/chat');
    }
  }, [roomUrl, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/categories/${room.room_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: categoryName.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/v/${roomUrl}`);
      } else if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError(data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setError('An error occurred while creating the category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/v/${roomUrl}`);
  };

  return (
    <div className={`min-vh-100 py-5 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Create New Category</h2>
                {room && <h6 className="text-center mb-4">in {room.name}</h6>}

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="categoryName" className="form-label">
                      Category Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="categoryName"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="CATEGORY NAME"
                      required
                      maxLength={100}
                    />
                    <small className="form-text text-muted">Category names are automatically converted to uppercase for consistency</small>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Category'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCategory;
