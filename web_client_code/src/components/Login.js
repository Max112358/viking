import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { API_BASE_URL } from '../config';

const Login = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the token in local storage
        localStorage.setItem('authToken', data.token);
        // Store the user information in local storage
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        navigate('/chat');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div
      className={`d-flex justify-content-center align-items-start min-vh-100 pt-2 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}
    >
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit} className={`card py-2 px-3 ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
          <div className="card-body p-2">
            <div className="text-center mb-3">
              <img
                src={`${process.env.PUBLIC_URL}/viking_logo_vector_with_text_white3.svg`}
                alt="Viking Logo"
                style={{ height: '140px', maxWidth: '400px' }}
                className="img-fluid"
              />
            </div>

            {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}

            <div className="mb-2">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                placeholder="Email"
                required
              />
            </div>

            <div className="mb-2">
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

            <div className="d-flex justify-content-between mt-2">
              <button type="button" className="btn btn-link p-0" onClick={() => navigate('/register')}>
                Register an account
              </button>
              <button type="button" className="btn btn-link p-0" onClick={() => navigate('/forgot-password')}>
                Forgot your password?
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
