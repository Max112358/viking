// part of backend
// routes/users.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { getUserRooms } = require('../controllers/roomController');

// Protect all routes with authentication
router.use(authenticateToken);

//requests will look like this: GET /users/1/rooms
router.get('/:userId/rooms', getUserRooms);

module.exports = router;
