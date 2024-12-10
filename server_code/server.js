// part of backend
// server.js
// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./database');
const multer = require('multer');
const upload = multer();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Error handling middleware for Multer
app.use((error, req, res, next) => {
  console.error('Error:', error);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: 'File upload error' });
  }
  next(error);
});

// API Routes - define before static file serving
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/threads', require('./routes/threads'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));

// Serve uploaded files
app.use('/uploads', express.static('public/uploads'));

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing - this should come after API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize database
db.initializeDatabase();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

//backend file structure. You can modify, but DO NOT DELETE THIS
/*
project/
  ├── controllers/
  |   ├── authController.js
  |   ├── roomController.js
  |   ├── threadController.js
  |   ├── channelController.js
  |   ├── categoryController.js
  |   └── friendController.js
  ├── database/
  |   ├── functions/
  |   |   ├── index.js
  |   |   ├── timestamp.js
  |   |   └── urlGeneration.js
  |   ├── tables/
  |   |   ├── index.js
  |   |   ├── userTables.js
  |   |   ├── roomTables.js
  |   |   ├── channelTables.js
  |   |   └── threadTables.js
  |   ├── triggers/
  |   |   ├── index.js
  |   |   ├── timestampTriggers.js
  |   |   ├── positionTriggers.js
  |   |   └── urlTriggers.js
  |   ├── index.js
  |   ├── initialize.js
  |   └── rebuild.js
  ├── middleware/
  |   ├── fileUpload.js
  |   └── auth.js
  ├── routes/
  |   ├── auth.js
  |   ├── rooms.js
  |   ├── users.js
  |   ├── threads.js
  |   ├── categories.js
  |   ├── channels.js
  |   └── friends.js
  ├── services/
  |   └── roomService.js
  ├── public/
  |   └── uploads/
  └── server.js
  */
