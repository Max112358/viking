import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateThread = ({ theme }) => {
  const { roomId } = useParams();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');

  // Add validation for roomId
  useEffect(() => {
    if (!roomId) {
      navigate('/chat');
    }
  }, [roomId, navigate]);

  // Check if the user is authenticated
  useEffect(() => {
    if (!authToken || !userId) {
      navigate('/login');
    }
  }, [authToken, userId, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(`url(${url})`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('content', message);
      //not sure we need to send user id due to it being in the token
      formData.append('userId', userId); // Always send the userId
      formData.append('isAnonymous', isAnonymous);
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(`${API_BASE_URL}/threads/${roomId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/chat/rooms/${roomId}`);
      } else if (response.status === 401) {
        // Handle invalid token case
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
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

  const handleCancel = () => {
    navigate(`/chat/rooms/${roomId}`);
  };

  return (
    <div className={`min-vh-100 py-5 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Create New Thread</h2>

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
                      maxLength={100}
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
                    <input type="file" className="form-control" id="image" accept="image/*" onChange={handleImageChange} />
                    {previewUrl && (
                      <div
                        className="mt-2 image-preview"
                        style={{
                          backgroundImage: previewUrl,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          width: '100%',
                          height: '200px',
                        }}
                      />
                    )}
                  </div>

                  <div className="mb-3 d-flex align-items-center justify-content-between">
                    <label htmlFor="isAnonymous" className="form-label mb-0">
                      Anonymous Mode
                    </label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isAnonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                      />
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Thread'}
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

export default CreateThread;
