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
  createRoomInvite,
  joinRoomByInvite,
  getInviteInfo,
} = require('../controllers/roomController');

// Protect all routes with authentication
router.use(authenticateToken);

router.get('/', getUserRooms);
router.post('/', upload.single('thumbnail'), createRoom);
router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);
router.delete('/:roomId', deleteRoom);
router.get('/check-url/:urlName', checkRoomUrlAvailability);
router.get('/by-url/:urlName', getRoomByUrl);

// invite routes
router.post('/:roomId/invite', createRoomInvite);
router.get('/invite/:inviteCode', getInviteInfo);
router.post('/invite/:inviteCode/join', joinRoomByInvite);

module.exports = router;
