// routes/rooms.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');
const { createRoom, getUserRooms, joinRoom, leaveRoom, deleteRoom } = require('../controllers/roomController');

// Protect all routes with authentication
router.use(authenticateToken);

// Update the getUserRooms route to not use URL parameters
router.get('/', getUserRooms); // Changed from '/user/:userId/rooms'
router.post('/', upload.single('thumbnail'), createRoom);
router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);
router.delete('/:roomId', deleteRoom);

module.exports = router;
