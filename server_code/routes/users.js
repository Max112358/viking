// routes/users.js
const express = require('express');
const router = express.Router();
const { getUserRooms } = require('../controllers/roomController');

//requests will look like this: GET /users/1/rooms
router.get('/:userId/rooms', getUserRooms);

module.exports = router;