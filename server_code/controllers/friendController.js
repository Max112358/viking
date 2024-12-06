// controllers/friendController.js
const db = require('../database');

exports.getFriends = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Get all friends with their associated DM room and categories
    const result = await db.query(
      `SELECT 
        u.id, 
        u.email,
        f.status,
        f.created_at,
        r.id as room_id,
        r.url_name as room_url,
        COALESCE(json_agg(
          json_build_object(
            'id', fc.id,
            'name', fc.name
          ) 
          ORDER BY fc.position) FILTER (WHERE fc.id IS NOT NULL), '[]'
        ) as categories
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id)
      LEFT JOIN rooms r ON (
        r.name = CONCAT('dm-', LEAST(f.user_id, f.friend_id), '-', GREATEST(f.user_id, f.friend_id))
      )
      LEFT JOIN friend_category_members fcm ON (fcm.friend_id = f.friend_id)
      LEFT JOIN friend_categories fc ON (fc.id = fcm.category_id AND fc.user_id = f.user_id)
      WHERE f.user_id = $1 AND f.status = 'accepted'
      GROUP BY u.id, u.email, f.status, f.created_at, r.id, r.url_name
      ORDER BY u.email`,
      [userId]
    );

    res.json({ friends: result.rows });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends' });
  }
};

exports.getFriendRequests = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await db.query(
      `SELECT 
        f.id,
        f.user_id as sender_id,
        u.email as sender_email,
        f.created_at
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: 'Error fetching friend requests' });
  }
};

exports.respondToFriendRequest = async (req, res) => {
  const { requestId, action } = req.params;
  const userId = req.user.userId;

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    await db.transaction(async (client) => {
      // Verify the request is for this user
      const request = await client.query('SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3', [
        requestId,
        userId,
        'pending',
      ]);

      if (request.rows.length === 0) {
        throw new Error('Friend request not found');
      }

      if (action === 'accept') {
        // Update the friendship status to accepted
        await client.query('UPDATE friendships SET status = $1 WHERE id = $2', ['accepted', requestId]);

        // Create reciprocal friendship
        await client.query(
          `INSERT INTO friendships (user_id, friend_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, friend_id) DO UPDATE
           SET status = $3`,
          [userId, request.rows[0].user_id, 'accepted']
        );
      } else {
        // Delete the friend request if rejected
        await client.query('DELETE FROM friendships WHERE id = $1', [requestId]);
      }
    });

    res.json({ message: `Friend request ${action}ed successfully` });
  } catch (error) {
    console.error(`Error ${action}ing friend request:`, error);
    res.status(500).json({ message: `Error ${action}ing friend request` });
  }
};

exports.createFriendCategory = async (req, res) => {
  const userId = req.user.userId;
  const { name } = req.body;

  try {
    // Get the maximum position for ordering
    const posResult = await db.query('SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM friend_categories WHERE user_id = $1', [
      userId,
    ]);
    const position = posResult.rows[0].next_pos;

    const result = await db.query(
      'INSERT INTO friend_categories (user_id, name, position) VALUES ($1, $2, $3) RETURNING id, name, position',
      [userId, name, position]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating friend category:', error);
    if (error.code === '23505') {
      // unique violation
      res.status(400).json({ message: 'A category with this name already exists' });
    } else {
      res.status(500).json({ message: 'Error creating category' });
    }
  }
};

exports.getFriendCategories = async (req, res) => {
  const userId = req.user.userId;

  try {
    const categories = await db.query(
      `SELECT fc.*, 
              COUNT(fcm.friend_id) as friend_count
       FROM friend_categories fc
       LEFT JOIN friend_category_members fcm ON fc.id = fcm.category_id
       WHERE fc.user_id = $1
       GROUP BY fc.id
       ORDER BY fc.position`,
      [userId]
    );

    res.json({ categories: categories.rows });
  } catch (error) {
    console.error('Error fetching friend categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};
