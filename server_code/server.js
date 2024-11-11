// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('public/uploads'));

// Initialize database
db.initializeDatabase();

/*
// Log all incoming requests, useful for debugging endpoints
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body); // Only for POST/PUT/PATCH requests
  next(); // Pass to the next middleware or route handler
});
*/

// Routes - mount at root level to keep original paths
app.use('/', require('./routes/auth')); 
app.use('/rooms', require('./routes/rooms'));
app.use('/users', require('./routes/users'));


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


//app file structure DO NOT DELETE THIS
/*
project/
  ├── controllers/
  ├─────authController.js
  ├─────roomController.js
  ├── middleware/
  ├─────fileUpload.js
  ├── routes/
  ├─────auth.js
  ├─────rooms.js
  ├─────users.js
  ├── services/
  ├─────roomService.js
  ├── public/
  │   └── uploads/
  ├── server.js
  └── db.js
  */