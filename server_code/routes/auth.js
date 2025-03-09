// part of backend
// routes/auth.js
const express = require('express');
const router = express.Router();
//const authenticateToken = require('../middleware/auth');
const { register, login, verifyToken } = require('../controllers/authController');

// DO NOT AUTHENTICATE PUBLIC PAGES

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyToken, (req, res) => {
  res.json({ userId: req.user.userId, email: req.user.email });
});

module.exports = router;
