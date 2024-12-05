// part of backend
// controllers/threadController.js
const db = require('../database');

exports.createThread = async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user.userId;

  console.log('Request body:', req.body); // Debug log
  console.log('Request file:', req.file); // Debug log

  try {
    const result = await db.transaction(async (client) => {
      // First, verify that the channel exists and get its room_id
      const channelCheck = await client.query('SELECT room_id FROM channels WHERE id = $1', [channelId]);

      if (channelCheck.rows.length === 0) {
        throw new Error('Channel not found');
      }

      const roomId = channelCheck.rows[0].room_id;

      // Check if user is a member of the room
      const memberCheck = await client.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, userId]);

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this room');
      }

      // Get form data from request body
      const { subject, content, isAnonymous } = req.body;

      if (!content) {
        throw new Error('Message content is required');
      }

      // Create thread
      const threadResult = await client.query(
        'INSERT INTO threads (channel_id, subject, author_id, is_anonymous) VALUES ($1, $2, $3, $4) RETURNING id, url_id',
        [channelId, subject || 'Untitled Thread', userId, isAnonymous === 'true']
      );

      const threadId = threadResult.rows[0].id;

      // Create the first post
      const postResult = await client.query('INSERT INTO posts (thread_id, author_id, content) VALUES ($1, $2, $3) RETURNING id', [
        threadId,
        userId,
        content,
      ]);

      // If there's a file, add it to file_attachments
      if (req.file) {
        await client.query(
          `INSERT INTO file_attachments 
           (post_id, file_name, file_type, file_size, file_url) 
           VALUES ($1, $2, $3, $4, $5)`,
          [postResult.rows[0].id, req.file.filename, req.file.mimetype, req.file.size, `/uploads/${req.file.filename}`]
        );
      }

      return {
        threadId: threadId,
        urlId: threadResult.rows[0].url_id,
      };
    });

    res.status(201).json({
      message: 'Thread created successfully',
      threadId: result.threadId,
      urlId: result.urlId,
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(error.message === 'User is not a member of this room' ? 403 : 500).json({
      message: error.message,
    });
  }
};

exports.getThreads = async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.userId;

  try {
    const threads = await db.query(
      `WITH RankedPosts AS (
        SELECT 
          p.*,
          ROW_NUMBER() OVER (PARTITION BY p.thread_id ORDER BY p.created_at) as rn
        FROM posts p
        WHERE p.thread_id IN (
          SELECT id FROM threads WHERE channel_id = $1
        )
      )
      SELECT 
        t.id,
        t.url_id,
        t.subject,
        t.created_at,
        t.is_pinned,
        t.last_activity,
        CASE 
          WHEN t.is_anonymous THEN NULL 
          ELSE u.email 
        END as author_email,
        COUNT(DISTINCT p.id) as post_count,
        rp.content as first_post_content,
        fa.file_url as first_post_image
      FROM threads t
      LEFT JOIN users u ON t.author_id = u.id
      LEFT JOIN posts p ON t.id = p.thread_id
      LEFT JOIN RankedPosts rp ON t.id = rp.thread_id AND rp.rn = 1
      LEFT JOIN file_attachments fa ON rp.id = fa.post_id 
        AND fa.file_type LIKE 'image/%'
      WHERE t.channel_id = $1
      GROUP BY t.id, t.subject, t.created_at, t.is_pinned,
        t.last_activity, t.is_anonymous, u.email,
        rp.content, fa.file_url
      ORDER BY t.is_pinned DESC, t.last_activity DESC
      LIMIT $2 OFFSET $3`,
      [channelId, limit, offset]
    );

    res.json({ threads: threads.rows });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ message: 'Error fetching threads' });
  }
};

exports.getPosts = async (req, res) => {
  const { threadId } = req.params; // This is now the url_id
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.userId;

  try {
    // First, get the thread details along with room membership check - now using url_id
    const threadResult = await db.query(
      `SELECT t.*, 
              c.room_id,
              CASE WHEN t.is_anonymous THEN NULL ELSE u.email END as author_email
       FROM threads t
       JOIN channels c ON t.channel_id = c.id
       LEFT JOIN users u ON t.author_id = u.id
       WHERE t.url_id = $1`,
      [threadId]
    );

    if (threadResult.rows.length === 0) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const thread = threadResult.rows[0];

    // Check if user is a member of the room
    const memberCheck = await db.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [thread.room_id, userId]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'User is not a member of this room' });
    }

    // Get the posts with author information
    const postsResult = await db.query(
      `SELECT p.*,
              CASE WHEN t.is_anonymous THEN NULL ELSE u.email END as author_email,
              json_agg(json_build_object(
                'id', fa.id,
                'file_url', fa.file_url,
                'file_type', fa.file_type
              )) FILTER (WHERE fa.id IS NOT NULL) as attachments
       FROM posts p
       JOIN threads t ON p.thread_id = t.id
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN file_attachments fa ON fa.post_id = p.id
       WHERE p.thread_id = $1
       GROUP BY p.id, t.is_anonymous, u.email
       ORDER BY p.created_at ASC
       LIMIT $2 OFFSET $3`,
      [thread.id, limit, offset] // Using the actual thread.id here after looking it up
    );

    // Get total post count for pagination
    const countResult = await db.query('SELECT COUNT(*) FROM posts WHERE thread_id = $1', [thread.id]);

    res.json({
      thread: {
        id: thread.id,
        url_id: thread.url_id,
        subject: thread.subject,
        created_at: thread.created_at,
        is_locked: thread.is_locked,
        author_email: thread.author_email,
      },
      posts: postsResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

exports.createPost = async (req, res) => {
  const { threadId } = req.params; // This is now the url_id
  const { content } = req.body;
  const userId = req.user.userId;

  try {
    await db.transaction(async (client) => {
      // First get the actual thread ID using the url_id
      const threadResult = await client.query('SELECT id FROM threads WHERE url_id = $1', [threadId]);

      if (threadResult.rows.length === 0) {
        throw new Error('Thread not found');
      }

      const actualThreadId = threadResult.rows[0].id;

      // Check if user is a member of the room containing this thread
      const roomCheck = await client.query(
        `SELECT r.posts_per_thread, t.is_locked, r.id as room_id
         FROM rooms r
         JOIN channels c ON c.room_id = r.id
         JOIN threads t ON t.channel_id = c.id
         WHERE t.id = $1`,
        [actualThreadId]
      );

      if (roomCheck.rows.length === 0) {
        throw new Error('Thread not found');
      }

      // Verify room membership
      const memberCheck = await client.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2', [
        roomCheck.rows[0].room_id,
        userId,
      ]);

      if (memberCheck.rows.length === 0) {
        throw new Error('User is not a member of this room');
      }

      if (roomCheck.rows[0].is_locked) {
        throw new Error('Thread is locked');
      }

      // Count existing posts
      const postCount = await client.query('SELECT COUNT(*) FROM posts WHERE thread_id = $1', [actualThreadId]);

      const postLimit = roomCheck.rows[0].posts_per_thread;
      if (postLimit && parseInt(postCount.rows[0].count) >= postLimit) {
        // Lock the thread when limit is reached
        await client.query('UPDATE threads SET is_locked = true WHERE id = $1', [actualThreadId]);
        throw new Error('Thread has reached its post limit and is now locked');
      }

      // Create the post
      const postResult = await client.query('INSERT INTO posts (thread_id, author_id, content) VALUES ($1, $2, $3) RETURNING id', [
        actualThreadId,
        userId,
        content,
      ]);

      // If there's a file, add it to file_attachments
      if (req.file) {
        await client.query(
          `INSERT INTO file_attachments 
           (post_id, file_name, file_type, file_size, file_url) 
           VALUES ($1, $2, $3, $4, $5)`,
          [postResult.rows[0].id, req.file.filename, req.file.mimetype, req.file.size, `/uploads/${req.file.filename}`]
        );
      }

      // Update thread's last_activity
      await client.query('UPDATE threads SET last_activity = CURRENT_TIMESTAMP WHERE id = $1', [actualThreadId]);
    });

    res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    const status =
      {
        'User is not a member of this room': 403,
        'Thread is locked': 403,
        'Thread has reached its post limit and is now locked': 403,
        'Thread not found': 404,
      }[error.message] || 500;

    res.status(status).json({ message: error.message });
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
