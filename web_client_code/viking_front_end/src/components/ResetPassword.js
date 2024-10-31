import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const ResetPassword = ({ theme }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const emailFromUrl = searchParams.get('email');
    
    if (!tokenFromUrl || !emailFromUrl) {
      alert('Invalid reset link. Please request a new password reset.');
      navigate('/forgot-password');
      return;
    }

    setToken(tokenFromUrl);
    setEmail(emailFromUrl);
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/reset_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(email)}&reset_token=${encodeURIComponent(token)}&new_password=${encodeURIComponent(newPassword)}`,
      });

      if (response.ok) {
        alert('Password has been successfully reset! Please login with your new password.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to reset password. Please try again.');
        navigate('/forgot-password');
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
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-control"
              placeholder="New Password"
              required
              minLength="8"
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control"
              placeholder="Confirm New Password"
              required
              minLength="8"
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary w-100">
              Set New Password
            </button>
          </div>

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;