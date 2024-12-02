// components/chat/Thread.js
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const Thread = ({ threadId, theme, onBack }) => {
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/threads/${threadId}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (threadId) {
      fetchPosts();
    }
  }, [threadId]);

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/threads/${threadId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newPost }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Refresh posts after successful submission
      const updatedResponse = await fetch(`${API_BASE_URL}/threads/${threadId}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await updatedResponse.json();
      setPosts(data.posts || []);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-100 d-flex flex-column">
      {/* Thread Header */}
      <div className="p-3 border-bottom d-flex align-items-center">
        <button className="btn btn-link me-3" onClick={onBack}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h5 className="mb-0">{thread?.subject || 'Thread'}</h5>
      </div>

      {/* Posts List */}
      <div className="flex-grow-1 overflow-auto p-3">
        <div className="d-flex flex-column gap-3">
          {posts.map((post) => (
            <div key={post.id} className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
              <div className="card-body">
                <p className="card-text">{post.content}</p>
                <div className={`small ${theme === 'dark' ? 'text-light-emphasis' : 'text-muted'}`}>
                  {post.author_email ? `Posted by ${post.author_email}` : 'Anonymous'} · {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Post Form */}
      <div className="p-3 border-top">
        <form onSubmit={handleSubmitPost}>
          <div className="input-group">
            <textarea
              className="form-control"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Write a reply..."
              rows="2"
            />
            <button type="submit" className="btn btn-primary">
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Thread;
