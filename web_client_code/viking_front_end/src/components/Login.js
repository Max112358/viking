import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  // Helper function to check if the user is a teacher
  const checkIfTeacher = async (username) => {
    try {
      const response = await fetch(`https://hobefog.pythonanywhere.com/is_teacher?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      return data.is_teacher;  // Returns true if user is teacher, otherwise false
    } catch (error) {
      console.error("Error checking teacher status:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Register the user
      const response = await fetch('https://hobefog.pythonanywhere.com/register_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(username)}`,
      });

      if (response.ok) {
        localStorage.setItem('username', username);

        // Check if the user is the teacher and redirect accordingly
        const isTeacher = await checkIfTeacher(username);
        if (isTeacher) {
          navigate('/teacher');  // Redirect to teacher-specific interface
        } else {
          navigate('/chat');  // Redirect to normal chat interface
        }
      } else {
        alert('Failed to register user. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Chat App</h1>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
            Enter your username:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
