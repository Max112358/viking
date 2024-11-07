const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize database on server start
db.initializeDatabase();

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

// New endpoint: Create a room
app.post('/rooms', async (req, res) => {
  const { name, description } = req.body;
  const userId = req.body.userId; // You'll need to implement proper authentication

  try {
    const result = await db.query(
      'INSERT INTO rooms (name, description) VALUES ($1, $2) RETURNING room_id',
      [name, description]
    );
    
    // Automatically add the creator as a member
    const roomId = result.rows[0].room_id;
    await db.query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
      [roomId, userId]
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
      SELECT r.room_id, r.name, r.description, r.created_at, rm.joined_at
      FROM rooms r
      INNER JOIN room_members rm ON r.room_id = rm.room_id
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

// New endpoint: Leave a room
app.post('/rooms/:roomId/leave', async (req, res) => {
  const { roomId } = req.params;
  const userId = req.body.userId;

  try {
    await db.query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    res.status(200).json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Error leaving room' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});