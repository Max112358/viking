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
  const navigate = useNavigate();

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailImage(file);
      // Create a preview URL for the selected image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append('name', roomName);
      formData.append('description', description);
      if (thumbnailImage) {
        formData.append('thumbnail', thumbnailImage);
      }

      const userId = '1'; // Replace with actual user ID from authentication
      formData.append('userId', userId);

      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/chat'); // Navigate back to chat interface
      } else {
        setError(data.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('An error occurred while creating the room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-vh-100 py-5 ${
        theme === 'dark' ? 'bg-dark text-light' : 'bg-light'
      }`}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div
              className={`card ${
                theme === 'dark' ? 'bg-mid-dark text-light' : ''
              }`}
            >
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
                    <input
                      type="file"
                      className="form-control"
                      id="thumbnail"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
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

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Room'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/chat')}
                    >
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
