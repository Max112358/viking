// components/chat/Thread.js
import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';

const Thread = ({ threadId, theme, onBack }) => {
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const scrollContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [posts, shouldAutoScroll]);

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
        setThread(data.thread);
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
    if (e) {
      e.preventDefault();
    }
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

      const updatedResponse = await fetch(`${API_BASE_URL}/threads/${threadId}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await updatedResponse.json();
      setPosts(data.posts || []);
      setNewPost('');
      setShouldAutoScroll(true);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message);
    }
  };

  const formatContent = (content) => {
    return content.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const formatPostDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderGroupedPosts = () => {
    const getImageUrl = (path) => {
      if (!path) return null;
      return path.replace(/^\/api/, '');
    };

    const groupedPosts = [];
    let currentGroup = [];

    posts.forEach((post, index) => {
      const prevPost = posts[index - 1];
      const shouldStartNewGroup = () => {
        if (!prevPost) return true;

        const timeDiff = new Date(post.created_at) - new Date(prevPost.created_at);
        const fiveMinutes = 5 * 60 * 1000;

        return post.author_id !== prevPost.author_id || timeDiff > fiveMinutes;
      };

      if (shouldStartNewGroup()) {
        if (currentGroup.length > 0) {
          groupedPosts.push([...currentGroup]);
          currentGroup = [];
        }
        currentGroup.push(post);
      } else {
        currentGroup.push(post);
      }
    });

    if (currentGroup.length > 0) {
      groupedPosts.push(currentGroup);
    }

    return groupedPosts.map((group, groupIndex) => (
      <div key={group[0].id} className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
        <div className="card-body">
          <div className={`small mb-2 ${theme === 'dark' ? 'text-light-emphasis' : 'text-muted'}`}>
            <strong>{group[0].author_email ? group[0].author_email : 'Anonymous'}</strong> •{' '}
            {formatPostDate(group[0].created_at)}
          </div>
          {group.map((post, postIndex) => (
            <div key={post.id} className={postIndex > 0 ? 'mt-3' : ''}>
              <div className="card-text" style={{ whiteSpace: 'pre-line' }}>
                {formatContent(post.content)}
              </div>
              {post.attachments && post.attachments.length > 0 && (
                <div className="mt-2">
                  {post.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {attachment.file_type.startsWith('image/') && (
                        <img
                          src={getImageUrl(attachment.file_url)}
                          alt="Attachment"
                          className="img-fluid rounded"
                          style={{ maxHeight: '300px' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ));
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
      <div className="p-3 border-bottom d-flex align-items-center">
        <button className="btn btn-link me-3" onClick={onBack}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h5 className="mb-0">{thread?.subject || 'Loading...'}</h5>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-grow-1 overflow-auto p-3"
        onScroll={handleScroll}
      >
        <div className="d-flex flex-column gap-3">{renderGroupedPosts()}</div>
      </div>

      <div className="p-3 border-top">
        <form onSubmit={handleSubmitPost}>
          <div className="input-group">
            <textarea
              className="form-control"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newPost.trim()) {
                    handleSubmitPost(e);
                  }
                }
              }}
              placeholder="Write a reply... (Press Enter to send, Shift+Enter for new line)"
              rows="2"
              style={{ whiteSpace: 'pre-line' }}
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
