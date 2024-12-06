// routes/friends.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getFriends,
  getFriendRequests,
  respondToFriendRequest,
  createFriendCategory,
  getFriendCategories,
} = require('../controllers/friendController');

// Protect all routes with authentication
router.use(authenticateToken);

// Friend routes
router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.post('/requests/:requestId/:action', respondToFriendRequest);

// Category routes
router.post('/categories', createFriendCategory);
router.get('/categories', getFriendCategories);

module.exports = router;
