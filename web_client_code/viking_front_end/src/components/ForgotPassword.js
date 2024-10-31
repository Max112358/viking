import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const ForgotPassword = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://hobefog.pythonanywhere.com/request_password_reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(email)}`,
      });

      if (response.ok) {
        alert('If an account exists with this email, you will receive a reset code.');
        setShowResetForm(true);
      } else {
        alert('Failed to process request. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
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
        body: `email=${encodeURIComponent(email)}&reset_code=${encodeURIComponent(resetCode)}&new_password=${encodeURIComponent(newPassword)}`,
      });

      if (response.ok) {
        alert('Password reset successful! Please login with your new password.');
        navigate('/login');
      } else {
        alert('Failed to reset password. Please check your reset code and try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className={`d-flex justify-content-center align-items-start min-vh-100 p-4 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <form onSubmit={showResetForm ? handleResetPassword : handleRequestReset} className="p-4 shadow rounded">
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
              disabled={showResetForm}
            />
          </div>

          {showResetForm && (
            <>
              <div className="mb-3">
                <input
                  type="text"
                  id="resetCode"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="form-control"
                  placeholder="Reset Code"
                  required
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
                />
              </div>
            </>
          )}

          <div>
            <button type="submit" className="btn btn-primary w-100">
              {showResetForm ? 'Reset Password' : 'Request Reset Code'}
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

export default ForgotPassword;