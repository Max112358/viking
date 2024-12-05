// routes/friends.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { getFriends } = require('../controllers/friendController');

// Protect all routes with authentication
router.use(authenticateToken);

router.get('/', getFriends);

module.exports = router;