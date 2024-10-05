import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Utility from './Utility';  // Import everything as Utility

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [room, setRoom] = useState('general');
  const [recipient, setRecipient] = useState('');
  const [userRooms, setUserRooms] = useState([]);
  const [isTeacher, setIsTeacher] = useState(false);  // State to track if the user is a teacher
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const fetchInitialData = async () => {
      const rooms = await Utility.get_user_rooms(username);
      setUserRooms(rooms);

      // Fetch messages initially
      const initialMessages = await Utility.get_messages_for_user(username);
      setMessages(initialMessages);

      // Check if the user is a teacher
      const teacherStatus = await Utility.is_teacher(username);
      setIsTeacher(teacherStatus);
    };

    fetchInitialData();
    const interval = setInterval(() => fetchMessages(username), 5000);

    return () => clearInterval(interval);
  }, [username, navigate]);

  useEffect(scrollToBottom, [messages]);

  const fetchMessages = async (username) => {
    const newMessages = await Utility.get_messages_for_user(username);
    setMessages(newMessages);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    let sendResult;
    if (recipient) {
      sendResult = await Utility.send_message_to_specific_user(username, recipient, inputMessage);
    } else {
      sendResult = await Utility.send_message_to_specific_room(username, room, inputMessage);
    }

    if (sendResult.success) {
      setInputMessage('');  // Clear input after sending
      fetchMessages(username);  // Refresh messages
    } else {
      console.error('Message sending failed.');
    }
  };

  // Navigate to teacher's dashboard or any other page
  const handleTeacherClick = () => {
    navigate('/teacher-dashboard');  // Adjust this route as needed
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

      {/* Conditionally render the button if the user is a teacher */}
      {isTeacher && (
        <button
          onClick={handleTeacherClick}
          style={{
            ...buttonStyle,
            marginBottom: '1rem',
            backgroundColor: '#ff9800', // Different color for special button
          }}
        >
          Go to Teacher's Dashboard
        </button>
      )}

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
