import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkIfTeacher } from './Utility';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = ({ theme }) => {
  const [email, setEmail] = useState('');  // Updated to email
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/register_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(email)}`,  // Changed to email
      });

      if (response.ok) {
        localStorage.setItem('email', email);  // Updated to email
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
    <div className={`d-flex justify-content-center align-items-start min-vh-100 p-4 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit} className="p-4 shadow rounded">
          <div className="text-center mb-4">
            <img
              src={`${process.env.PUBLIC_URL}/viking_logo_vector_with_text_white3.svg`}
              alt="Viking Logo"
              style={{ height: '160px', maxWidth: '400px' }}
              className="img-fluid"
            />
          </div>

          <div className="mb-3">
            <input
              type="text"
              id="email"  // Updated ID
              value={email}  // Updated to email
              onChange={(e) => setEmail(e.target.value)}  // Updated to email
              className="form-control"
              placeholder="Email"  // Changed placeholder to Email
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="Password"
              required
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </div>

          {/* New links for Register and Forgot Password */}
          <div className="d-flex justify-content-between mt-3">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => navigate('/register')}
            >
              Register an account
            </button>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
