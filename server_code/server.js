const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('public/uploads'));

// Initialize database on server start
db.initializeDatabase();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb) {
    cb(null, 'room-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// Registration Endpoint
app.post('/register_user', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Create room endpoint
app.post('/rooms', upload.single('thumbnail'), async (req, res) => {
  const { name, description, userId } = req.body;
  const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Create the room
    const roomResult = await db.query(
      'INSERT INTO rooms (name, description, thumbnail_url) VALUES ($1, $2, $3) RETURNING id',
      [name, description, thumbnailUrl]
    );
    
    const roomId = roomResult.rows[0].id;

    // Add creator as admin member
    await db.query(
      'INSERT INTO room_members (room_id, user_id, is_admin) VALUES ($1, $2, $3)',
      [roomId, userId, true]
    );

    res.status(201).json({ 
      message: 'Room created successfully', 
      roomId: roomId 
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
});

// New endpoint: Get user's rooms
app.get('/users/:userId/rooms', async (req, res) => {
  const userId = req.params.userId;

  try {
    const userRooms = await db.query(`
      SELECT r.id as room_id, r.name, r.thumbnail_url, r.created_at, rm.joined_at
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = $1
      ORDER BY rm.joined_at DESC
    `, [userId]);

    res.json({ rooms: userRooms.rows });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

// New endpoint: Join a room
app.post('/rooms/:roomId/join', async (req, res) => {
  const { roomId } = req.params;
  const userId = req.body.userId;

  try {
    // Check if already a member
    const existingMember = await db.query(
      'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: 'Already a member of this room' });
    }

    // Add user to room
    await db.query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
      [roomId, userId]
    );

    res.status(200).json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Error joining room' });
  }
});

// Room management functions
async function destroyRoom(transaction, roomId) {
  try {
    // Get room thumbnail URL before deleting
    const roomData = await transaction.query(
      'SELECT thumbnail_url FROM rooms WHERE id = $1',
      [roomId]
    );
    
    // Delete all room members
    await transaction.query('DELETE FROM room_members WHERE room_id = $1', [roomId]);
    
    // Delete the room itself
    await transaction.query('DELETE FROM rooms WHERE id = $1', [roomId]);

    // If there was a thumbnail, delete the file
    if (roomData.rows[0]?.thumbnail_url) {
      const thumbnailPath = path.join(__dirname, 'public', roomData.rows[0].thumbnail_url);
      fs.unlink(thumbnailPath, (err) => {
        if (err) console.error('Error deleting thumbnail:', err);
      });
    }

    return true;
  } catch (error) {
    console.error('Error destroying room:', error);
    throw error;
  }
}

// Updated leave room endpoint
app.post('/rooms/:roomId/leave', async (req, res) => {
  const { roomId } = req.params;
  const userId = req.body.userId;
  
  try {
    await db.transaction(async (client) => {
      // Remove the user from the room
      await client.query(
        'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      // Check if there are any members left in the room
      const remainingMembers = await client.query(
        'SELECT COUNT(*) FROM room_members WHERE room_id = $1',
        [roomId]
      );

      // If no members remain, destroy the room
      if (parseInt(remainingMembers.rows[0].count) === 0) {
        await destroyRoom(client, roomId);
      }
    });

    res.status(200).json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Error leaving room' });
  }
});

// Admin delete room endpoint
app.delete('/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const userId = req.body.userId;

  try {
    await db.transaction(async (client) => {
      // Check if user is room admin
      const isAdmin = await client.query(
        'SELECT is_admin FROM room_members WHERE room_id = $1 AND user_id = $2 AND is_admin = true',
        [roomId, userId]
      );

      if (isAdmin.rows.length === 0) {
        throw new Error('Not authorized to delete room');
      }

      await destroyRoom(client, roomId);
    });
    
    res.status(200).json({ message: 'Room successfully deleted' });
  } catch (error) {
    console.error('Error deleting room:', error);
    if (error.message === 'Not authorized to delete room') {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error deleting room' });
    }
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
