import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggle_private_communication } from './Utility';

const TeacherInterface = () => {
  const [room, setRoom] = useState('general');
  const [userRooms, setUserRooms] = useState([]);
  const [usernameToManage, setUsernameToManage] = useState('');
  const [roomToManage, setRoomToManage] = useState('');
  const [isPrivateChatDisabled, setIsPrivateChatDisabled] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    fetchUserRooms();
    fetchPrivateChatStatus();
  }, [username, navigate]);

  const fetchUserRooms = async () => {
    try {
      const response = await fetch(`https://hobefog.pythonanywhere.com/get_all_rooms`);
      if (response.ok) {
        const data = await response.json();
        setUserRooms(data.rooms);
        if (!data.rooms.includes(room)) {
          setRoom('general');
        }
      }
    } catch (error) {
      console.error('Error fetching user rooms:', error);
    }
  };

  const fetchPrivateChatStatus = async () => {
    try {
      const response = await fetch(`https://hobefog.pythonanywhere.com/get_private_chat_status`);
      if (response.ok) {
        const data = await response.json();
        setIsPrivateChatDisabled(data.isPrivateChatDisabled);
      }
    } catch (error) {
      console.error('Error fetching private chat status:', error);
    }
  };

  const handleTogglePrivateChat = async () => {
    try {
      const result = await toggle_private_communication(username);
      if (result.success) {
        setIsPrivateChatDisabled(result.isPrivateChatDisabled);
        alert(`Private chat has been ${result.isPrivateChatDisabled ? 'disabled' : 'enabled'}.`);
      } else {
        alert('Failed to toggle private chat. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling private chat:', error);
      alert('An error occurred while toggling private chat.');
    }
  };

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
        fetchUserRooms();
      } else {
        alert('Failed to manage room. Please try again.');
      }
    } catch (error) {
      console.error(`Error managing room (${action}):`, error);
    }
  };

  const closeRoom = async () => {
    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/close_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `room=${encodeURIComponent(room)}&sender=${encodeURIComponent(username)}`,
      });

      const data = await response.json();
      
      if (response.status === 422) {
        alert(data.status); // This will show "The 'general' room cannot be closed."
      } else if (response.ok) {
        alert(data.status);
        fetchUserRooms();
      } else {
        alert('Failed to close the room. Please try again.');
      }
    } catch (error) {
      console.error('Error closing room:', error);
      alert('An error occurred while trying to close the room.');
    }
  };

  const handleReturnToChat = () => {
    navigate('/chat');
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem' }}>
      <h1>Welcome, {username} (Teacher)</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label>
            Select Room:
            <select 
              value={room} 
              onChange={(e) => setRoom(e.target.value)} 
              style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}
            >
              {userRooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button onClick={closeRoom} style={buttonStyle}>
            Close Room
          </button>
        </div>
      </div>

      <button
        onClick={handleReturnToChat}
        style={{
          ...buttonStyle,
          marginBottom: '1rem',
          backgroundColor: '#ff9800',
        }}
      >
        Go to Chat Window
      </button>

      <div style={{ marginBottom: '1rem' }}>
        <h2>Teacher Controls</h2>

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
            style={{ marginRight: '0.5rem' }}
          />
          <button onClick={() => manageRoom('add')}>Add to Room</button>
          <button onClick={() => manageRoom('remove')} style={{ marginLeft: '0.5rem' }}>
            Remove from Room
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleTogglePrivateChat} style={buttonStyle}>
            {isPrivateChatDisabled ? 'Enable Private Chat' : 'Disable Private Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherInterface;