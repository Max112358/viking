// part of backend
// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./database');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Serve uploaded files with correct MIME types
app.use(
  '/uploads',
  express.static('public/uploads', {
    setHeaders: (res, path) => {
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      }
    },
  })
);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/threads', require('./routes/threads'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: 'File upload error' });
  }
  next(error);
});

// Initialize database
db.initializeDatabase();

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
