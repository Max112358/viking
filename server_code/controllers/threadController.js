// controllers/threadController.js
const db = require('../db');

exports.createThread = async (req, res) => {
  const { roomId } = req.params;
  const { subject, content, userId } = req.body;

  try {
    await db.transaction(async (client) => {
      // Check if user is a member of the room
      const memberCheck = await client.query(
        'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this room');
      }

      // Create thread
      const threadResult = await client.query(
        'INSERT INTO threads (room_id, subject, author_id) VALUES ($1, $2, $3) RETURNING id',
        [roomId, subject, userId]
      );

      // Create initial post
      await client.query(
        'INSERT INTO posts (thread_id, author_id, content) VALUES ($1, $2, $3)',
        [threadResult.rows[0].id, userId, content]
      );

      return threadResult.rows[0];
    });

    res.status(201).json({ message: 'Thread created successfully' });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(error.message === 'User is not a member of this room' ? 403 : 500)
       .json({ message: error.message });
  }
};

exports.getThreads = async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const threads = await db.query(`
      SELECT 
        t.id,
        t.subject,
        t.created_at,
        t.is_pinned,
        t.last_activity,
        u.email as author_email,
        COUNT(p.id) as post_count,
        FIRST_VALUE(p.content) OVER (
          PARTITION BY t.id 
          ORDER BY p.created_at
        ) as first_post
      FROM threads t
      JOIN users u ON t.author_id = u.id
      LEFT JOIN posts p ON t.id = p.thread_id
      WHERE t.room_id = $1
      GROUP BY t.id, t.subject, t.created_at, t.is_pinned, 
               t.last_activity, u.email, p.content
      ORDER BY t.is_pinned DESC, t.last_activity DESC
      LIMIT $2 OFFSET $3
    `, [roomId, limit, offset]);

    res.json({ threads: threads.rows });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ message: 'Error fetching threads' });
  }
};

exports.getPosts = async (req, res) => {
  const { threadId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const posts = await db.query(`
      SELECT 
        p.id,
        p.content,
        p.created_at,
        p.updated_at,
        u.email as author_email
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.thread_id = $1
      ORDER BY p.created_at ASC
      LIMIT $2 OFFSET $3
    `, [threadId, limit, offset]);

    res.json({ posts: posts.rows });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

exports.createPost = async (req, res) => {
  const { threadId } = req.params;
  const { content, userId } = req.body;

  try {
    await db.transaction(async (client) => {
      // Check if user is a member of the room containing this thread
      const memberCheck = await client.query(`
        SELECT 1 FROM room_members rm
        JOIN threads t ON t.room_id = rm.room_id
        WHERE t.id = $1 AND rm.user_id = $2
      `, [threadId, userId]);

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this room');
      }

      // Create post
      await client.query(
        'INSERT INTO posts (thread_id, author_id, content) VALUES ($1, $2, $3)',
        [threadId, userId, content]
      );

      // Update thread's last_activity
      await client.query(
        'UPDATE threads SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
        [threadId]
      );
    });

    res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(error.message === 'User is not a member of this room' ? 403 : 500)
       .json({ message: error.message });
  }
};

exports.deleteThread = async (req, res) => {
  const { threadId } = req.params;
  const { userId } = req.body;

  try {
    await db.transaction(async (client) => {
      // Check if user is the thread author or room admin
      const authorCheck = await client.query(`
        SELECT 1 FROM threads t
        JOIN room_members rm ON t.room_id = rm.room_id
        WHERE t.id = $1 
        AND (t.author_id = $2 OR (rm.user_id = $2 AND rm.is_admin = true))
      `, [threadId, userId]);

      if (authorCheck.rows.length === 0) {
        throw new Error('Not authorized to delete thread');
      }

      await client.query('DELETE FROM threads WHERE id = $1', [threadId]);
    });

    res.status(200).json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(error.message === 'Not authorized to delete thread' ? 403 : 500)
       .json({ message: error.message });
  }
};