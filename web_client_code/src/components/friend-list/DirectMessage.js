import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const DirectMessage = ({ friend, theme }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [channel, setChannel] = useState(null);
  const [thread, setThread] = useState(null);
  const scrollContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    setShouldAutoScroll(isAtBottom);
  };

  // Fetch or create DM room
  useEffect(() => {
    const initializeDMRoom = async () => {
      try {
        const myUserId = localStorage.getItem('userId');
        const roomUrl = `dm-${Math.min(myUserId, friend.id)}-${Math.max(myUserId, friend.id)}`;

        const roomResponse = await fetch(`${API_BASE_URL}/rooms/by-url/${roomUrl}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoom(roomData);

          const channelsResponse = await fetch(`${API_BASE_URL}/channels/${roomData.room_id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });

          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            const defaultChannel = channelsData.categories[0]?.channels?.find(
              (ch) => ch.name === 'messages'
            );

            if (defaultChannel) {
              setChannel(defaultChannel);

              const threadsResponse = await fetch(`${API_BASE_URL}/threads/${defaultChannel.id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
              });

              if (threadsResponse.ok) {
                const threadsData = await threadsResponse.json();
                let mainThread = threadsData.threads[0];

                // If no thread exists, create one
                if (!mainThread) {
                  const createThreadResponse = await fetch(
                    `${API_BASE_URL}/threads/${defaultChannel.id}`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                      },
                      body: JSON.stringify({
                        subject: 'Direct Messages',
                        content: 'Chat started',
                        isAnonymous: false,
                      }),
                    }
                  );

                  if (createThreadResponse.ok) {
                    const newThreadData = await createThreadResponse.json();
                    mainThread = { url_id: newThreadData.urlId };
                  }
                }

                if (mainThread) {
                  setThread(mainThread);
                  // Fetch messages for this thread
                  const messagesResponse = await fetch(
                    `${API_BASE_URL}/threads/${mainThread.url_id}/posts`,
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                      },
                    }
                  );

                  if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    setMessages(messagesData.posts || []);
                  }
                }
              }
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing DM room:', err);
        setError('Failed to load messages');
        setIsLoading(false);
      }
    };

    if (friend?.id) {
      initializeDMRoom();
    }
  }, [friend?.id]);

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!newMessage.trim() || !thread?.url_id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/threads/${thread.url_id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const messagesResponse = await fetch(`${API_BASE_URL}/threads/${thread.url_id}/posts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        setMessages(data.posts || []);
        setNewMessage('');
        setShouldAutoScroll(true);
      }
    } catch (err) {
      setError('Error sending message');
      console.error('Error:', err);
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
      <div className="p-3 border-bottom d-flex align-items-center">
        <div className="d-flex align-items-center flex-grow-1">
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
            />
            <button type="submit" className="btn btn-primary">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectMessage;
