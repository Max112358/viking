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
  addFriendToCategory,
  deleteFriendCategory,
  sendFriendRequest,
} = require('../controllers/friendController');

// Protect all routes with authentication
router.use(authenticateToken);

// Friend routes
router.get('/', getFriends);
router.post('/request', sendFriendRequest);
router.get('/requests', getFriendRequests);
//router.post('/requests/:requestId/:action', respondToFriendRequest);
// routes/friends.js
router.post('/requests/:requestId/:action', (req, res, next) => {
  console.log('Friend request route hit:', {
    requestId: req.params.requestId,
    action: req.params.action,
    userId: req.user?.userId,
  });
  respondToFriendRequest(req, res);
});
// Category routes
router.post('/categories', createFriendCategory);
router.get('/categories', getFriendCategories);
router.post('/categories/:categoryId/members/:friendId', addFriendToCategory);
router.delete('/categories/:categoryId', deleteFriendCategory);

module.exports = router;
