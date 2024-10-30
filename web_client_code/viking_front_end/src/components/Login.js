import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkIfTeacher } from './Utility';
import styles from './Login.module.css';

const Login = ({ theme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const themeClass = theme === 'dark' ? styles.darkTheme : styles.lightTheme;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/register_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(username)}`,
      });

      if (response.ok) {
        localStorage.setItem('username', username);
        navigate('/chat');
      } else {
        alert('Failed to register user. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className={`${styles.loginContainer} ${themeClass}`}>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.logoContainer}>
            <img 
              src={`${process.env.PUBLIC_URL}/logo_vector.svg`}
              alt="Viking Logo"
              className={styles.logo}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              placeholder="Username"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Password"
              required
            />
          </div>

          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.button}>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;