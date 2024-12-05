// controllers/friendController.js
const db = require('../database');

exports.getFriends = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Get all friends with their associated DM room
    const result = await db.query(
      `SELECT 
        u.id, 
        u.email,
        f.status,
        f.created_at,
        r.id as room_id,
        r.url_name as room_url
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id)
      LEFT JOIN rooms r ON (
        r.name = CONCAT('dm-', LEAST(f.user_id, f.friend_id), '-', GREATEST(f.user_id, f.friend_id))
      )
      WHERE f.user_id = $1 AND f.status = 'accepted'
      ORDER BY u.email`,
      [userId]
    );

    // For any friends without a DM room, create one
    const friendsWithRooms = await Promise.all(
      result.rows.map(async (friend) => {
        if (!friend.room_id) {
          // Create a new private room for these friends
          const roomName = `dm-${Math.min(userId, friend.id)}-${Math.max(userId, friend.id)}`;
          const roomUrlName = roomName;

          await db.transaction(async (client) => {
            // Create the room
            const roomResult = await client.query(
              `INSERT INTO rooms (
                name, 
                url_name, 
                description, 
                is_public,
                allow_anonymous,
                allow_user_threads
              ) VALUES ($1, $2, $3, false, true, true) 
              RETURNING id, url_name`,
              [roomName, roomUrlName, `Private messages between users`]
            );

            const roomId = roomResult.rows[0].id;

            // Add both users as room members
            await client.query(
              `INSERT INTO room_members (room_id, user_id, is_admin) 
               VALUES ($1, $2, true), ($1, $3, true)`,
              [roomId, userId, friend.id]
            );

            // Create default category
            const categoryResult = await client.query(
              `INSERT INTO channel_categories (room_id, name, position) 
               VALUES ($1, $2, 0) RETURNING id`,
              [roomId, 'Messages']
            );

            // Create default channel
            await client.query(
              `INSERT INTO channels (room_id, category_id, name, description, is_default) 
               VALUES ($1, $2, $3, $4, true)`,
              [roomId, categoryResult.rows[0].id, 'chat', 'Private chat']
            );

            // Update the friend object with new room info
            friend.room_id = roomId;
            friend.room_url = roomResult.rows[0].url_name;
          });
        }
        return friend;
      })
    );

    res.json({ friends: friendsWithRooms });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends' });
  }
};
