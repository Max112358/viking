// components/friend-list/CategoryContextMenu.js
import React, { useEffect, useRef } from 'react';

const CategoryContextMenu = ({ x, y, onClose, children }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="position-fixed bg-white shadow rounded border"
      style={{
        left: x,
        top: y,
        zIndex: 1050,
        minWidth: '160px',
      }}
    >
      {children}
    </div>
  );
};

export default CategoryContextMenu;
