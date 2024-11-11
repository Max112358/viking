const express = require('express');
const router = express.Router();
const { 
  createThread,
  getThreads,
  getPosts,
  createPost,
  deleteThread
} = require('../controllers/threadController');

router.post('/:roomId', createThread);
router.get('/:roomId', getThreads);
router.get('/:threadId/posts', getPosts);
router.post('/:threadId/posts', createPost);
router.delete('/:threadId', deleteThread);

module.exports = router;