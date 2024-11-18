// part of backend
// routes/rooms.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');
const {
  createRoom,
  getUserRooms,
  joinRoom,
  leaveRoom,
  deleteRoom,
  checkRoomUrlAvailability,
  getRoomByUrl,
} = require('../controllers/roomController');

// Protect all routes with authentication
router.use(authenticateToken);

// Update the getUserRooms route to use the root path
router.get('/', getUserRooms);
router.post('/', upload.single('thumbnail'), createRoom);
router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);
router.delete('/:roomId', deleteRoom);
router.get('/check-url/:urlName', checkRoomUrlAvailability);
router.get('/by-url/:urlName', getRoomByUrl);

module.exports = router;
