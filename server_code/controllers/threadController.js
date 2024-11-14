// part of backend
// controllers/threadController.js
const db = require('../db');

exports.createThread = async (req, res) => {
  console.log('Create thread got hit');

  const { roomId } = req.params;
  const { subject, content, isAnonymous } = req.body;
  const userId = req.user.userId;

  // Convert isAnonymous string to boolean
  const isAnonymousBoolean = isAnonymous === 'true';

  try {
    const threadId = await db.transaction(async (client) => {
      // Check if user is a member of the room
      const memberCheck = await client.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, userId]);

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this room');
      }

      // Create empty thread with just the subject
      // even if anonymous, save user id so that we know who has the rights to delete this thread
      const threadResult = await client.query(
        'INSERT INTO threads (room_id, subject, author_id, is_anonymous) VALUES ($1, $2, $3, $4) RETURNING id',
        [roomId, subject, userId, isAnonymousBoolean]
      );

      return threadResult.rows[0].id;
    });

    // Now use the existing createPost function to add the first post
    // We need to modify the request object to match what createPost expects
    req.params.threadId = threadId;
    req.body = { content }; // Simplify body to just include content

    // Call createPost (but we need to handle its response differently)
    await exports.createPost(req, {
      status: () => ({
        json: () => {}, // Empty handler since we'll send our own response
      }),
    });

    res.status(201).json({ message: 'Thread created successfully', threadId });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(error.message === 'User is not a member of this room' ? 403 : 500).json({ message: error.message });
  }
};

exports.getThreads = async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.userId;

  try {
    // First check if user is a member of the room
    const memberCheck = await db.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, userId]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'User is not a member of this room' });
    }

    const threads = await db.query(
      `
      WITH FirstPosts AS (
        SELECT DISTINCT ON (thread_id)
          p.thread_id,
          p.content as first_post_content,
          p.created_at,
          (
            SELECT fa.file_url 
            FROM file_attachments fa 
            WHERE fa.post_id = p.id 
            ORDER BY fa.uploaded_at ASC 
            LIMIT 1
          ) as first_post_image
        FROM posts p
        ORDER BY p.thread_id, p.created_at ASC
      )
      SELECT 
        t.id,
        t.subject,
        t.created_at,
        t.is_pinned,
        t.last_activity,
        CASE 
          WHEN t.is_anonymous THEN NULL 
          ELSE u.email 
        END as author_email,
        COUNT(p.id) as post_count,
        COALESCE(fp.first_post_content, '') as first_post_content,
        fp.first_post_image
      FROM threads t
      LEFT JOIN users u ON t.author_id = u.id
      LEFT JOIN posts p ON t.id = p.thread_id
      LEFT JOIN FirstPosts fp ON t.id = fp.thread_id
      WHERE t.room_id = $1
      GROUP BY 
        t.id, 
        t.subject, 
        t.created_at, 
        t.is_pinned,
        t.last_activity, 
        t.is_anonymous, 
        u.email,
        fp.first_post_content,
        fp.first_post_image
      ORDER BY t.is_pinned DESC, t.last_activity DESC
      LIMIT $2 OFFSET $3
    `,
      [roomId, limit, offset]
    );

    res.json({
      threads: threads.rows.map((thread) => ({
        ...thread,
        first_post_content: thread.first_post_content || '',
        first_post_image: thread.first_post_image || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ message: 'Error fetching threads' });
  }
};

exports.getPosts = async (req, res) => {
  const { threadId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.userId;

  try {
    // Check if user is a member of the room that contains this thread
    const memberCheck = await db.query(
      `
      SELECT 1 FROM room_members rm
      JOIN threads t ON t.room_id = rm.room_id
      WHERE t.id = $1 AND rm.user_id = $2
      `,
      [threadId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'User is not a member of this room' });
    }

    const posts = await db.query(
      `
      SELECT 
        p.id,
        p.content,
        p.created_at,
        p.updated_at,
        CASE 
          WHEN t.is_anonymous THEN NULL 
          ELSE u.email 
        END as author_email
      FROM posts p
      JOIN threads t ON p.thread_id = t.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.thread_id = $1
      ORDER BY p.created_at ASC
      LIMIT $2 OFFSET $3
    `,
      [threadId, limit, offset]
    );

    res.json({ posts: posts.rows });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

exports.createPost = async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  try {
    await db.transaction(async (client) => {
      // Check if user is a member of the room containing this thread
      const memberCheck = await client.query(
        `
        SELECT 1 FROM room_members rm
        JOIN threads t ON t.room_id = rm.room_id
        WHERE t.id = $1 AND rm.user_id = $2
      `,
        [threadId, userId]
      );

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this room');
      }

      // Create post with image if present
      await client.query('INSERT INTO posts (thread_id, author_id, content, image_url) VALUES ($1, $2, $3, $4)', [
        threadId,
        userId,
        content,
        req.file ? `/uploads/${req.file.filename}` : null,
      ]);

      // Update thread's last_activity
      await client.query('UPDATE threads SET last_activity = CURRENT_TIMESTAMP WHERE id = $1', [threadId]);
    });

    res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(error.message === 'User is not a member of this room' ? 403 : 500).json({ message: error.message });
  }
};

exports.deleteThread = async (req, res) => {
  const { threadId } = req.params;
  const userId = req.user.userId; // Get from JWT token

  try {
    await db.transaction(async (client) => {
      // Check if user is the thread author or room admin
      const authorCheck = await client.query(
        `
          SELECT 1 FROM threads t
          JOIN room_members rm ON t.room_id = rm.room_id
          WHERE t.id = $1 
          AND (t.is_anonymous = false AND t.author_id = $2 OR (rm.user_id = $2 AND rm.is_admin = true))
        `,
        [threadId, userId]
      );

      if (authorCheck.rows.length === 0) {
        throw new Error('Not authorized to delete thread');
      }

      await client.query('DELETE FROM threads WHERE id = $1', [threadId]);
    });

    res.status(200).json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(error.message === 'Not authorized to delete thread' ? 403 : 500).json({ message: error.message });
  }
};
