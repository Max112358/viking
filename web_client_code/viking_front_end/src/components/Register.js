import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/register_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(email)}`,
      });

      if (response.ok) {
        alert('Registration successful! Please login.');
        navigate('/login');
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
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              placeholder="Email"
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

          <div className="mb-3">
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

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;