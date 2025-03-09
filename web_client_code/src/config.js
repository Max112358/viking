// src/config.js
//export const API_BASE_URL = 'http://YOUR_IP:YOUR_PORT';
//export const API_BASE_URL = 'http://localhost:3000';
//export const API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;

//export const API_BASE_URL =
//  process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api' : '/api';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

// If you need a specific URL for development:
// export const API_BASE_URL = process.env.NODE_ENV === 'development'
//   ? 'http://localhost:3000/api'
//   : `${window.location.protocol}//${window.location.host}/api`;
