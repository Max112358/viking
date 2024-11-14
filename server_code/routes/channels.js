// routes/channels.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { createChannel, getChannels, updateChannel, deleteChannel } = require('../controllers/channelController');

// Protect all routes with authentication
router.use(authenticateToken);

router.post('/:roomId', createChannel);
router.get('/:roomId', getChannels);
router.put('/:channelId', updateChannel);
router.delete('/:channelId', deleteChannel);

module.exports = router;
