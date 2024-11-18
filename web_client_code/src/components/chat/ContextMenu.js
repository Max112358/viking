// components/chat/ContextMenu.js
import React from 'react';

const ContextMenu = ({ x, y, onClose, children }) => (
  <div
    className="position-fixed bg-white shadow-sm rounded border"
    style={{
      left: x,
      top: y,
      zIndex: 1050,
      minWidth: '120px',
    }}
  >
    {children}
  </div>
);

export default ContextMenu;
