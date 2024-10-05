import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [room, setRoom] = useState('general');
  const [recipient, setRecipient] = useState('');
  const [userRooms, setUserRooms] = useState([]);
  const [privateMessagesEnabled, setPrivateMessagesEnabled] = useState(true);
  const [usernameToManage, setUsernameToManage] = useState('');
  const [roomToManage, setRoomToManage] = useState('');  // New state for room input
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const messagesEndRef = useRef(null);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    fetchUserRooms();
    fetchPrivateMessagingStatus();

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [username, navigate]);

  useEffect(scrollToBottom, [messages]);

  // Fetch the rooms the teacher is in
  const fetchUserRooms = async () => {
    try {
      const response = await fetch(`https://hobefog.pythonanywhere.com/get_all_rooms`);
      if (response.ok) {
        const data = await response.json();
        setUserRooms(data.rooms);
        // Set default room to general if it's not in the list
        if (!data.rooms.includes(room)) {
          setRoom('general');
        }
      }
    } catch (error) {
      console.error('Error fetching user rooms:', error);
    }
  };

  // Fetch if private messaging is enabled or disabled
  const fetchPrivateMessagingStatus = async () => {
    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/get_private_communication_status');
      const data = await response.json();
      setPrivateMessagesEnabled(data.private_communication_enabled);
    } catch (error) {
      console.error('Error fetching private messaging status:', error);
    }
  };

  // Fetch messages for the teacher's rooms
  const fetchMessages = async () => {
    try {
      const response = await fetch(`https://hobefog.pythonanywhere.com/get_messages_for_user?user=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
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
          message: inputMessage,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Teacher control: Toggle private messages
  const togglePrivateMessages = async () => {
    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/toggle_private_communication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `sender=${encodeURIComponent(username)}`,
      });
      if (response.ok) {
        const result = await response.json();
        setPrivateMessagesEnabled(result.status.includes('enabled'));
      }
    } catch (error) {
      console.error('Error toggling private messages:', error);
    }
  };

  // Teacher control: Add or remove users from rooms
  const manageRoom = async (action) => {
    const endpoint = action === 'add'
      ? 'add_specific_user_to_room'
      : 'remove_specific_user_from_room';

    try {
      const response = await fetch(`https://hobefog.pythonanywhere.com/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user=${encodeURIComponent(usernameToManage)}&room=${encodeURIComponent(roomToManage)}&sender=${encodeURIComponent(username)}`,
      });

      if (response.ok) {
        alert(`${usernameToManage} has been ${action === 'add' ? 'added to' : 'removed from'} room ${roomToManage}`);
        fetchUserRooms();  // Refresh the room list after the change
      } else {
        alert('Failed to manage room. Please try again.');
      }
    } catch (error) {
      console.error(`Error managing room (${action}):`, error);
    }
  };

  // Teacher control: Close a room
  const closeRoom = async () => {
    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/close_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `room=${encodeURIComponent(roomToManage)}&sender=${encodeURIComponent(username)}`,
      });

      if (response.ok) {
        alert(`Room ${roomToManage} has been closed.`);
        fetchUserRooms();  // Refresh the room list after closing a room
      } else {
        alert('Failed to close the room. Please try again.');
      }
    } catch (error) {
      console.error('Error closing room:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem' }}>
      <h1>Welcome, {username} (Teacher)</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <label>
            Select Room:
            <select value={room} onChange={(e) => setRoom(e.target.value)} style={{ marginLeft: '0.5rem' }}>
              {userRooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
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
              disabled={!privateMessagesEnabled}
            />
          </label>
        </div>
      </div>

      {/* Teacher-specific controls */}
      <div style={{ marginBottom: '1rem' }}>
        <h2>Teacher Controls</h2>
        <button onClick={togglePrivateMessages}>
          {privateMessagesEnabled ? 'Disable' : 'Enable'} Private Messages
        </button>

        <div style={{ marginTop: '1rem' }}>
          <input
            type="text"
            value={usernameToManage}
            onChange={(e) => setUsernameToManage(e.target.value)}
            placeholder="Enter username to manage"
            style={{ marginRight: '0.5rem' }}
          />
          <input
            type="text"
            value={roomToManage}
            onChange={(e) => setRoomToManage(e.target.value)}
            placeholder="Enter room to manage"
            style={{ marginRight: '0.5rem' }}  // New room input
          />
          <button onClick={() => manageRoom('add')}>Add to Room</button>
          <button onClick={() => manageRoom('remove')} style={{ marginLeft: '0.5rem' }}>
            Remove from Room
          </button>
          <button onClick={closeRoom} style={{ marginLeft: '0.5rem' }}>
            Close Room
          </button>
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '1rem', backgroundColor: '#fff' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            {msg.type === 'room' ? (
              <p>
                <strong>Room {msg.room}:</strong> {msg.message}
              </p>
            ) : (
              <p>
                <strong>{msg.from === username ? 'You' : `Private from ${msg.from}`}:</strong> {msg.message}
              </p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: '1rem' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ flexGrow: 1, marginRight: '0.5rem', padding: '0.5rem' }}
          placeholder="Type your message..."
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#3490dc', color: '#fff' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default TeacherInterface;
