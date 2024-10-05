import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [room, setRoom] = useState('general');
  const [recipient, setRecipient] = useState('');
  const [userRooms, setUserRooms] = useState([]);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const fetchUserRooms = async () => {
      try {
        const response = await fetch(`https://hobefog.pythonanywhere.com/get_user_rooms?user=${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setUserRooms(data.rooms);
        }
      } catch (error) {
        console.error('Error fetching user rooms:', error);
      }
    };

    fetchUserRooms();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [username, navigate]);

  useEffect(scrollToBottom, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`https://hobefog.pythonanywhere.com/get_messages_for_user?user=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages.length > 0) {
          setMessages(prevMessages => {
            const newMessages = data.messages.filter(msg => {
              return !prevMessages.some(prevMsg => prevMsg.id === msg.id);
            });
            return [...prevMessages, ...newMessages];
          });
          if (data.messages.length > 0) {
            lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      let url, body;
      if (recipient) {
        url = 'https://hobefog.pythonanywhere.com/send_message_to_specific_user';
        body = `sender=${encodeURIComponent(username)}&recipient=${encodeURIComponent(recipient)}&message=${encodeURIComponent(inputMessage)}`;
      } else {
        url = 'https://hobefog.pythonanywhere.com/send_message_to_specific_room';
        body = `sender=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}&message=${encodeURIComponent(inputMessage)}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      if (response.ok) {
        setInputMessage('');
        const newMessage = {
          id: Date.now(),
          type: recipient ? 'private' : 'room',
          from: username,
          room: room,
          message: inputMessage
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: '1rem',
  };

  const headerStyle = {
    marginBottom: '1rem',
  };

  const controlsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  };

  const messageWindowStyle = {
    flexGrow: 1,
    overflowY: 'auto',
    border: '1px solid #ccc',
    borderRadius: '0.375rem',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#fff',
  };

  const inputFormStyle = {
    display: 'flex',
  };

  const inputStyle = {
    flexGrow: 1,
    marginRight: '0.5rem',
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '0.25rem',
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#3490dc',
    color: '#fff',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Welcome, {username}!</h1>
      <div style={controlsStyle}>
        <div>
          <label>
            Select Room:
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              {userRooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Send private message to:
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter username or leave blank for room message"
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
      </div>
      <div style={messageWindowStyle}>
        {messages.map((msg, index) => (
          <div key={msg.id || index} style={{ marginBottom: '0.5rem' }}>
            {msg.type === 'room' ? (
              <p><strong>Room {msg.room}:</strong> {msg.message}</p>
            ) : (
              <p><strong>{msg.from === username ? 'You' : `Private from ${msg.from}`}:</strong> {msg.message}</p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={inputFormStyle}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={inputStyle}
          placeholder="Type your message..."
        />
        <button type="submit" style={buttonStyle}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;