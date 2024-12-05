// components/friend-list/Layout.js
import React from 'react';

const Layout = ({ theme, error, children }) => {
  return (
    <div className="h-100 d-flex flex-column">
      {error && <div className="alert alert-danger">{error}</div>}
      {children}
    </div>
  );
};

export default Layout;