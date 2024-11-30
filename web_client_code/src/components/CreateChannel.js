// components/CreateChannel.js
// components/CreateChannel.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateChannel = ({ theme }) => {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [isNsfw, setIsNsfw] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [categoryName, setCategoryName] = useState(''); // Changed from category state
  const navigate = useNavigate();
  const { roomUrl, categoryId } = useParams();

  useEffect(() => {
    const fetchRoomAndCategoryData = async () => {
      try {
        const authToken = localStorage.getItem('authToken');

        // Fetch room data first
        const roomResponse = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!roomResponse.ok) {
          throw new Error('Failed to fetch room data');
        }

        const roomData = await roomResponse.json();
        if (!roomData.is_admin) {
          navigate(`/v/${roomUrl}`);
          return;
        }
        setRoom(roomData);

        // Then fetch channels/categories data
        const categoriesResponse = await fetch(`${API_BASE_URL}/channels/${roomData.room_id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }

        const categoriesData = await categoriesResponse.json();
        console.log('Categories data:', categoriesData); // Debug log

        // Find the matching category
        const category = categoriesData.categories.find((cat) => cat.id.toString() === categoryId);
        console.log('Found category:', category); // Debug log

        if (category) {
          setCategoryName(category.name);
        } else {
          console.error('Category not found:', categoryId); // Debug log
          setError('Invalid category');
          navigate(`/v/${roomUrl}`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    if (roomUrl && categoryId) {
      fetchRoomAndCategoryData();
    } else {
      navigate('/chat');
    }
  }, [roomUrl, categoryId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/channels/${room.room_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: channelName.toLowerCase().trim(),
          description: description.trim(),
          isNsfw,
          categoryId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/v/${roomUrl}`);
      } else if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError(data.message || 'Failed to create channel');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      setError('An error occurred while creating the channel');
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
                <h2 className="card-title text-center mb-4">Create New Channel</h2>
                {room && <h6 className="text-center mb-2">in {room.name}</h6>}
                {categoryName && (
                  <h6 className={`text-center mb-4 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Category: {categoryName}</h6>
                )}

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="channelName" className="form-label">
                      Channel Name
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">#</span>
                      <input
                        type="text"
                        className="form-control"
                        id="channelName"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="general"
                        required
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                      placeholder="Channel description"
                      maxLength={500}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isNsfw"
                        checked={isNsfw}
                        onChange={(e) => setIsNsfw(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="isNsfw">
                        NSFW Content
                      </label>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Channel'}
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

export default CreateChannel;
