import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { API_BASE_URL } from '../config';

const Register = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic password validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password strength check
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
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

            <div className="mb-2">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control"
                placeholder="Confirm Password"
                required
              />
            </div>

            <div>
              <button type="submit" className="btn btn-primary w-100">
                Register
              </button>
            </div>

            <div className="text-center mt-2">
              <button type="button" className="btn btn-link p-0" onClick={() => navigate('/login')}>
                Already have an account? Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
