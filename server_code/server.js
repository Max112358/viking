// part of backend
// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const db = require('./database'); // Updated to use new database folder
const multer = require('multer');
const upload = multer();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('public/uploads'));

// Initialize database
db.initializeDatabase();

///*
// Log all incoming requests, useful for debugging endpoints
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body); // Only for POST/PUT/PATCH requests
  next(); // Pass to the next middleware or route handler
});
//*/

//error handling middleware to catch Multer errors
app.use((error, req, res, next) => {
  console.error('Error:', error);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: 'File upload error' });
  }
  next(error);
});

// Routes - mount at root level to keep original paths
app.use('/', require('./routes/auth'));
app.use('/rooms', require('./routes/rooms'));
app.use('/categories', require('./routes/categories'));
app.use('/channels', require('./routes/channels'));
app.use('/threads', require('./routes/threads'));
app.use('/users', require('./routes/users'));
app.use('/friends', require('./routes/friends'));

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
