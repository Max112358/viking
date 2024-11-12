import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ChatInterface from './components/ChatInterface';
import CreateRoom from './components/CreateRoom';
import CreateThread from './components/CreateThread';
import './colors.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  useEffect(() => {
    // Listen for changes in system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="min-vh-100">
      <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
        <Router>
          <Routes>
            <Route path="/" element={<Login theme={theme} />} />
            <Route path="/login" element={<Login theme={theme} />} /> {/* Duplicate link, for ease of navigation */}
            <Route path="/chat" element={<ChatInterface theme={theme} />} />
            <Route path="/forgot-password" element={<ForgotPassword theme={theme} />} />
            <Route path="/register" element={<Register theme={theme} />} />
            <Route path="/create-room" element={<CreateRoom theme={theme} />} />
            <Route path="/create-thread/:roomId" element={<CreateThread theme={theme} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;
