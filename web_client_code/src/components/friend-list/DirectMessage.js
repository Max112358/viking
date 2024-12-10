// components/friend-list/DirectMessage.js
import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const DirectMessage = ({ friend, theme, refreshAllData }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [thread, setThread] = useState(null);
  const scrollContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    setShouldAutoScroll(isAtBottom);
  };

  // Initialize DM room and fetch messages
  useEffect(() => {
    const initializeDM = async () => {
      try {
        const myUserId = localStorage.getItem('userId');
        const roomUrl = `dm-${Math.min(myUserId, friend.id)}-${Math.max(myUserId, friend.id)}`;

        // Get the room
        const roomResponse = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!roomResponse.ok) {
          throw new Error('Failed to fetch room');
        }

        const roomData = await roomResponse.json();

        // Get channels
        const channelsResponse = await fetch(`${API_BASE_URL}/channels/${roomData.room_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!channelsResponse.ok) {
          throw new Error('Failed to fetch channels');
        }

        const channelsData = await channelsResponse.json();
        const defaultChannel = channelsData.categories[0]?.channels?.[0];

        if (!defaultChannel) {
          throw new Error('No message channel found');
        }

        // Get threads (we know there will be one)
        const threadsResponse = await fetch(`${API_BASE_URL}/threads/${defaultChannel.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!threadsResponse.ok) {
          throw new Error('Failed to fetch thread');
        }

        const threadsData = await threadsResponse.json();
        const mainThread = threadsData.threads[0];

        if (!mainThread) {
          throw new Error('No message thread found');
        }

        setThread(mainThread);
        await fetchMessages(mainThread.url_id);
      } catch (err) {
        console.error('Error initializing DM:', err);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    if (friend?.id) {
      initializeDM();
    }
  }, [friend?.id]);

  const fetchMessages = async (threadUrlId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/threads/${threadUrlId}/posts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.posts || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!newMessage.trim() || !thread?.url_id || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/threads/${thread.url_id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      await fetchMessages(thread.url_id);
      await refreshAllData();
      setNewMessage('');
      setShouldAutoScroll(true);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  if (isLoading) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading messages...</span>
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
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
            style={{ width: '40px', height: '40px' }}
          >
            {friend.email.charAt(0).toUpperCase()}
          </div>
          <h5 className="mb-0">{friend.email}</h5>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-grow-1 overflow-auto p-3"
        onScroll={handleScroll}
      >
        <div className="d-flex flex-column gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`d-flex ${
                message.author_email === localStorage.getItem('userEmail')
                  ? 'justify-content-end'
                  : 'justify-content-start'
              }`}
            >
              <div
                className={`card ${theme === 'dark' ? 'bg-primary' : 'bg-primary'} text-light`}
                style={{ maxWidth: '75%' }}
              >
                <div className="card-body py-2 px-3">
                  <div style={{ whiteSpace: 'pre-line' }}>{message.content}</div>
                  <small className="text-light-emphasis">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-top">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <textarea
              className="form-control"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newMessage.trim()) handleSubmit(e);
                }
              }}
              placeholder="Write a message... (Press Enter to send, Shift+Enter for new line)"
              rows="2"
              style={{ resize: 'none' }}
              disabled={isSending}
            />
            <button type="submit" className="btn btn-primary" disabled={isSending}>
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectMessage;
