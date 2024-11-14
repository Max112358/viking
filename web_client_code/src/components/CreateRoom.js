import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateRoom = ({ theme }) => {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNsfw, setIsNsfw] = useState(false);

  // Room settings
  const [isPublic, setIsPublic] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [allowUserThreads, setAllowUserThreads] = useState(true);
  const [threadLimit, setThreadLimit] = useState(500);
  // New settings
  const [anonymousUniquePerThread, setAnonymousUniquePerThread] = useState(false);
  const [showCountryFlags, setShowCountryFlags] = useState(false);

  const navigate = useNavigate();

  const getThreadLimitDisplay = (value) => {
    return value === 500 ? '∞' : value;
  };

  const getThreadLimitForAPI = (value) => {
    return value === 500 ? null : value;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('authToken');

      if (!authToken || authToken === 'invalid') {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('name', roomName);
      formData.append('description', description);
      if (thumbnailImage) {
        formData.append('thumbnail', thumbnailImage);
      }

      // Add room settings to formData
      formData.append('isPublic', isPublic);
      formData.append('allowAnonymous', allowAnonymous);
      formData.append('allowUserThreads', allowUserThreads);
      formData.append('threadLimit', getThreadLimitForAPI(threadLimit));
      formData.append('anonymousUniquePerThread', anonymousUniquePerThread);
      formData.append('showCountryFlags', showCountryFlags);
      formData.append('isNsfw', isNsfw);

      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/chat');
      } else {
        if (response.status === 401) {
          localStorage.setItem('authToken', 'invalid');
          navigate('/login');
        } else {
          setError(data.message || 'Failed to create room');
        }
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('An error occurred while creating the room');
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
                <h2 className="card-title text-center mb-4">Create New Room</h2>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="roomName" className="form-label">
                      Room Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="roomName"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      required
                      maxLength={50}
                    />
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
                      required
                      maxLength={500}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="thumbnail" className="form-label">
                      Room Thumbnail
                    </label>
                    <input type="file" className="form-control" id="thumbnail" accept="image/*" onChange={handleImageChange} />
                    {previewUrl && (
                      <div className="mt-2 d-flex justify-content-center">
                        <div
                          className={`d-flex align-items-center justify-content-center rounded-circle overflow-hidden ${
                            theme === 'dark' ? 'bg-dark' : 'bg-white'
                          }`}
                          style={{
                            width: '100px',
                            height: '100px',
                            position: 'relative',
                          }}
                        >
                          <img
                            src={previewUrl}
                            alt="Thumbnail preview"
                            className="w-100 h-100 object-fit-cover"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`card mb-3 ${theme === 'dark' ? 'bg-secondary' : ''}`}>
                    <div className={`card-header ${theme === 'dark' ? 'bg-high-dark text-light border-secondary' : ''}`}>
                      <h5 className="mb-0">Room Settings</h5>
                    </div>
                    <div className={`card-body ${theme === 'dark' ? 'bg-high-dark text-light' : ''}`}>
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="isPublic">
                            Public Room
                          </label>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="allowAnonymous"
                            checked={allowAnonymous}
                            onChange={(e) => setAllowAnonymous(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="allowAnonymous">
                            Allow Anonymous Posts
                          </label>
                        </div>
                      </div>

                      {allowAnonymous && (
                        <div className="mb-3 ms-4">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="anonymousUniquePerThread"
                              checked={anonymousUniquePerThread}
                              onChange={(e) => setAnonymousUniquePerThread(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="anonymousUniquePerThread">
                              Unique Anonymous IDs Per Thread
                              <small className="d-block text-secondary">
                                Each anonymous user gets a different random ID in each thread
                              </small>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCountryFlags"
                            checked={showCountryFlags}
                            onChange={(e) => setShowCountryFlags(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="showCountryFlags">
                            Show Country Flags
                            <small className="d-block text-secondary">Display country flag based on poster's IP address</small>
                          </label>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="allowUserThreads"
                            checked={allowUserThreads}
                            onChange={(e) => setAllowUserThreads(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="allowUserThreads">
                            Allow Users to Create Threads
                          </label>
                        </div>
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
                            <small className="d-block text-secondary">Mark room as containing adult/mature content</small>
                          </label>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="threadLimit" className="form-label d-flex justify-content-between">
                          Thread Limit
                          <span className={theme === 'dark' ? 'text-light' : 'text-muted'}>{getThreadLimitDisplay(threadLimit)}</span>
                        </label>
                        <div className="d-flex align-items-center gap-2">
                          <span className="small">10</span>
                          <input
                            type="range"
                            className="form-range flex-grow-1"
                            id="threadLimit"
                            min="10"
                            max="500"
                            step="10"
                            value={threadLimit}
                            onChange={(e) => setThreadLimit(parseInt(e.target.value))}
                          />
                          <span className="small">∞</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Room'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/chat')}>
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

export default CreateRoom;
