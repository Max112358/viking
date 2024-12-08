// controllers/friendController.js
const db = require('../database');

exports.getFriends = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Get all friends with their associated categories
    const result = await db.query(
      `SELECT 
        u.id, 
        u.email,
        f.status,
        f.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', fc.id,
              'name', fc.name
            ) 
          ) FILTER (WHERE fc.id IS NOT NULL),
          '[]'
        ) as categories
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id)
      LEFT JOIN friend_category_members fcm ON (fcm.friend_id = f.friend_id)
      LEFT JOIN friend_categories fc ON (fc.id = fcm.category_id AND fc.user_id = f.user_id)
      WHERE f.user_id = $1 AND f.status = 'accepted'
      GROUP BY u.id, u.email, f.status, f.created_at
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

exports.addFriendToCategory = async (req, res) => {
  const userId = req.user.userId;
  const { categoryId, friendId } = req.params;

  try {
    // Verify the category belongs to the user
    const categoryCheck = await db.query('SELECT 1 FROM friend_categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Add friend to category
    await db.query('INSERT INTO friend_category_members (category_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      categoryId,
      friendId,
    ]);

    res.json({ message: 'Friend added to category successfully' });
  } catch (error) {
    console.error('Error adding friend to category:', error);
    res.status(500).json({ message: 'Error adding friend to category' });
  }
};

exports.deleteFriendCategory = async (req, res) => {
  const { categoryId } = req.params;
  const userId = req.user.userId;

  try {
    await db.transaction(async (client) => {
      // Verify ownership
      const category = await client.query('SELECT 1 FROM friend_categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);

      if (category.rows.length === 0) {
        throw new Error('Category not found or unauthorized');
      }

      // Delete the category (members will be automatically removed due to CASCADE)
      await client.query('DELETE FROM friend_categories WHERE id = $1', [categoryId]);
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(error.message === 'Category not found or unauthorized' ? 403 : 500).json({ message: error.message });
  }
};

// Add this new function along with the existing ones
exports.sendFriendRequest = async (req, res) => {
  const senderId = req.user.userId;
  const { email } = req.body;

  try {
    await db.transaction(async (client) => {
      // Check if target user exists
      const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const receiverId = userResult.rows[0].id;

      // Can't send friend request to yourself
      if (senderId === receiverId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if friendship already exists
      const existingFriendship = await client.query('SELECT status FROM friendships WHERE user_id = $1 AND friend_id = $2', [
        senderId,
        receiverId,
      ]);

      if (existingFriendship.rows.length > 0) {
        throw new Error('Friendship already exists or pending');
      }

      // Create the friend request
      await client.query('INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)', [senderId, receiverId, 'pending']);
    });

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(400).json({ message: error.message });
  }
};

// Helper function to generate deterministic room name from two user IDs
const generateFriendRoomName = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort((a, b) => a - b);
  return `dm-${sortedIds[0]}-${sortedIds[1]}`;
};

// Helper function to generate deterministic URL name from two user IDs
const generateFriendRoomUrl = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort((a, b) => a - b);
  return `dm-${sortedIds[0]}-${sortedIds[1]}`;
};

// Modify the existing sendFriendRequest function to create a room when friendship is accepted
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
        const senderId = request.rows[0].user_id;

        // Update the friendship status to accepted
        await client.query('UPDATE friendships SET status = $1 WHERE id = $2', ['accepted', requestId]);

        // Create reciprocal friendship
        await client.query(
          `INSERT INTO friendships (user_id, friend_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, friend_id) DO UPDATE
           SET status = $3`,
          [userId, senderId, 'accepted']
        );

        // Create DM room if it doesn't exist
        const roomUrl = generateFriendRoomUrl(userId, senderId);
        const roomName = generateFriendRoomName(userId, senderId);

        // Check if room already exists
        const existingRoom = await client.query('SELECT id FROM rooms WHERE url_name = $1', [roomUrl]);

        if (existingRoom.rows.length === 0) {
          // Create the room
          const roomResult = await client.query(
            `INSERT INTO rooms (
              name, 
              url_name,
              description, 
              is_public,
              allow_anonymous
            ) VALUES ($1, $2, $3, false, false) RETURNING id`,
            [roomName, roomUrl, 'Direct Messages']
          );

          const roomId = roomResult.rows[0].id;

          // Create default category
          const categoryResult = await client.query(
            `INSERT INTO channel_categories (room_id, name, position) 
             VALUES ($1, $2, 0) RETURNING id`,
            [roomId, 'MESSAGES']
          );

          const categoryId = categoryResult.rows[0].id;

          // Create default channel
          await client.query(
            `INSERT INTO channels (room_id, category_id, name, description, is_default) 
             VALUES ($1, $2, $3, $4, true)`,
            [roomId, categoryId, 'messages', 'Direct Messages']
          );

          // Add both users as room members
          await client.query('INSERT INTO room_members (room_id, user_id, is_admin) VALUES ($1, $2, true), ($1, $3, true)', [
            roomId,
            userId,
            senderId,
          ]);
        }
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

// Modify the getFriends function to include room information
exports.getFriends = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await db.query(
      `WITH friend_rooms AS (
        SELECT r.id as room_id, r.url_name as room_url, r.name as room_name,
               rm1.user_id as user1_id, rm2.user_id as user2_id
        FROM rooms r
        JOIN room_members rm1 ON r.id = rm1.room_id
        JOIN room_members rm2 ON r.id = rm2.room_id
        WHERE r.url_name LIKE 'dm-%'
        AND rm1.user_id != rm2.user_id
      )
      SELECT 
        u.id, 
        u.email,
        f.status,
        f.created_at,
        fr.room_url,
        COALESCE(
          json_agg(
            json_build_object(
              'id', fc.id,
              'name', fc.name
            ) 
          ) FILTER (WHERE fc.id IS NOT NULL),
          '[]'
        ) as categories
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id)
      LEFT JOIN friend_category_members fcm ON (fcm.friend_id = f.friend_id)
      LEFT JOIN friend_categories fc ON (fc.id = fcm.category_id AND fc.user_id = f.user_id)
      LEFT JOIN friend_rooms fr ON 
        ((fr.user1_id = f.user_id AND fr.user2_id = f.friend_id) OR 
         (fr.user1_id = f.friend_id AND fr.user2_id = f.user_id))
      WHERE f.user_id = $1 AND f.status = 'accepted'
      GROUP BY u.id, u.email, f.status, f.created_at, fr.room_url
      ORDER BY u.email`,
      [userId]
    );

    res.json({ friends: result.rows });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends' });
  }
};
