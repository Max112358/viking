// part of frontend
// components/CreateThread.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateThread = ({ theme }) => {
  const { roomUrl, channelId } = useParams(); // Add channelId from URL params
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState(null);
  const navigate = useNavigate();
  const authToken = localStorage.getItem('authToken');
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!roomUrl || !channelId) {
      navigate('/chat');
      return;
    }

    const fetchRoomAndChannelData = async () => {
      try {
        // Fetch room data
        const roomResponse = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!roomResponse.ok) {
          throw new Error('Failed to fetch room data');
        }

        const roomData = await roomResponse.json();
        setRoom(roomData);

        // Fetch channel data
        const channelsResponse = await fetch(`${API_BASE_URL}/channels/${roomData.room_id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!channelsResponse.ok) {
          throw new Error('Failed to fetch channels');
        }

        const channelsData = await channelsResponse.json();

        // Find the specific channel from all categories
        const targetChannel = channelsData.categories.reduce((found, category) => {
          if (found) return found;
          return category.channels.find((ch) => ch.url_id === channelId);
        }, null);

        if (!targetChannel) {
          throw new Error('Channel not found');
        }

        setChannel(targetChannel);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load data');
        navigate(`/v/${roomUrl}`);
      }
    };

    fetchRoomAndChannelData();
  }, [roomUrl, channelId, authToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('content', message);
      formData.append('isAnonymous', isAnonymous);
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(`${API_BASE_URL}/threads/${channel.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/v/${roomUrl}/${channelId}`);
      } else if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError(data.message || 'Failed to create thread');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      setError('An error occurred while creating the thread');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-vh-100 py-5 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Create New Thread</h2>
                {room && <h6 className="text-center mb-2">in {room.name}</h6>}
                {channel && <h6 className={`text-center mb-4 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>#{channel.name}</h6>}

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="subject" className="form-label">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="message" className="form-label">
                      Message
                    </label>
                    <textarea
                      className="form-control"
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows="3"
                      required
                      maxLength={2000}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="image" className="form-label">
                      Image
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setImage(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                    {previewUrl && (
                      <div className="mt-2">
                        <img src={previewUrl} alt="Preview" className="img-fluid" style={{ maxHeight: '200px' }} />
                      </div>
                    )}
                  </div>

                  <div className="mb-3 form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isAnonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="isAnonymous">
                      Post Anonymously
                    </label>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Thread'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(`/v/${roomUrl}/${channelId}`)}>
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

export default CreateThread;
