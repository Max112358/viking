const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/fileUpload');
const { 
  createRoom, 
  joinRoom, 
  leaveRoom, 
  deleteRoom 
} = require('../controllers/roomController');

router.post('/', upload.single('thumbnail'), createRoom);
router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);
router.delete('/:roomId', deleteRoom);

module.exports = router;