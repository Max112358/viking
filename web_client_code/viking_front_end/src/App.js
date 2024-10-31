import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ChatInterface from './components/ChatInterface';
import TeacherInterface from './components/TeacherInterface';
import styles from './App.module.css';

function App() {
  const [theme, setTheme] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    // Listen for changes in system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const themeClass = theme === 'dark' ? styles.darkTheme : styles.lightTheme;

  return (
    <div className={styles.root}>
      <div className={`${styles.app} ${themeClass}`}>
        <Router>
          <Routes>
            <Route path="/" element={<Login theme={theme} />} />
            <Route path="/chat" element={<ChatInterface theme={theme} />} />
            <Route path="/forgot-password" element={<ForgotPassword theme={theme} />} />
            <Route path="/register" element={<Register theme={theme} />} />
            <Route path="/teacher-dashboard" element={<TeacherInterface theme={theme} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;