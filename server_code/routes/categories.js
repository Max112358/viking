// routes/categories.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { createCategory, updateCategory, deleteCategory, getCategories } = require('../controllers/categoryController');

// Protect all routes with authentication
router.use(authenticateToken);

router.post('/:roomId', createCategory);
router.get('/:roomId', getCategories);
router.put('/:categoryId', updateCategory);
router.delete('/:categoryId', deleteCategory);

module.exports = router;
