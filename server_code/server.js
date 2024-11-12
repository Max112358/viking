// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const multer = require('multer');
const upload = multer();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('public/uploads'));
app.use(upload.any());

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

// Routes - mount at root level to keep original paths
app.use('/', require('./routes/auth'));
app.use('/rooms', require('./routes/rooms'));
app.use('/users', require('./routes/users'));
app.use('/threads', require('./routes/threads'));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

//basic outline for how this chat website works
/*
Rooms are created and controlled by users. Whoever creates the room becomes its admin, but can promote other sub-admins.
Rooms contain threads. Any user can make threads within a room. A thread has a subject which is supposed to be the threads theme or reason for existing.
Threads contain posts. Any user can make a post within a thread. A post contains a message.
*/

//app file structure DO NOT DELETE THIS
/*
project/
  ├── controllers/
  ├─────authController.js
  ├─────roomController.js
  ├─────threadController.js
  ├── middleware/
  ├─────fileUpload.js
  ├─────auth.js
  ├── routes/
  ├─────auth.js
  ├─────rooms.js
  ├─────users.js
  ├─────threads.js
  ├── services/
  ├─────roomService.js
  ├── public/
  │   └── uploads/
  ├── server.js
  └── db.js
  */
