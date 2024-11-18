// components/create-room/Layout.js
import React from 'react';

const Layout = ({ theme, error, children }) => {
  return (
    <div className={`min-vh-100 py-5 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className={`card ${theme === 'dark' ? 'bg-mid-dark text-light' : ''}`}>
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Create New Room</h2>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
