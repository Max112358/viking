// services/privateMessageService.js
const db = require('../database');

// Helper function to generate deterministic room name from user IDs
const generateDMRoomName = (userIds) => {
  const sortedIds = userIds.sort((a, b) => a - b);
  return `dm-${sortedIds.join('-')}`;
};

// Helper function to generate deterministic URL for DM room
const generateDMRoomUrl = (userIds) => {
  const sortedIds = userIds.sort((a, b) => a - b);
  return `dm-${sortedIds.join('-')}`;
};

exports.findOrCreateDMRoom = async (userId1, userId2) => {
  try {
    return await db.transaction(async (client) => {
      // First try to find an existing DM room between these users
      const expectedUrl = generateDMRoomUrl([userId1, userId2]);

      const existingRoom = await client.query(
        `SELECT r.* FROM rooms r
           WHERE r.url_name = $1
           AND EXISTS (
             SELECT 1 FROM room_members rm1
             WHERE rm1.room_id = r.id AND rm1.user_id = $2
           )
           AND EXISTS (
             SELECT 1 FROM room_members rm2
             WHERE rm2.room_id = r.id AND rm2.user_id = $3
           )`,
        [expectedUrl, userId1, userId2]
      );

      if (existingRoom.rows.length > 0) {
        return existingRoom.rows[0];
      }

      // If no room exists, create one
      const roomResult = await client.query(
        `INSERT INTO rooms (
            name,
            url_name,
            description,
            is_public,
            is_hidden,
            allow_anonymous,
            allow_user_threads,
            thread_limit,
            posts_per_thread
          ) VALUES ($1, $2, $3, false, true, false, false, null, null)
          RETURNING *`,
        [generateDMRoomName([userId1, userId2]), expectedUrl, 'Direct Messages']
      );

      const roomId = roomResult.rows[0].id;

      // Create default category
      const categoryResult = await client.query(
        `INSERT INTO channel_categories (room_id, name, position)
           VALUES ($1, 'MESSAGES', 0) RETURNING id`,
        [roomId]
      );

      // Create default channel
      await client.query(
        `INSERT INTO channels (room_id, category_id, name, description, is_default)
           VALUES ($1, $2, 'messages', 'Direct Messages', true)`,
        [roomId, categoryResult.rows[0].id]
      );

      // Add both users as room members
      await client.query(
        `INSERT INTO room_members (room_id, user_id, is_admin)
           VALUES ($1, $2, true), ($1, $3, true)`,
        [roomId, userId1, userId2]
      );

      return roomResult.rows[0];
    });
  } catch (error) {
    console.error('Error in findOrCreateDMRoom:', error);
    throw error;
  }
};

// Find all DM rooms for a user
exports.findUserDMRooms = async (userId) => {
  try {
    const result = await db.query(
      `SELECT 
        r.*,
        u.id as other_user_id,
        u.email as other_user_email
       FROM rooms r
       JOIN room_members rm1 ON r.id = rm1.room_id
       JOIN room_members rm2 ON r.id = rm2.room_id
       JOIN users u ON rm2.user_id = u.id
       WHERE r.url_name LIKE 'dm-%'
       AND rm1.user_id = $1
       AND rm2.user_id != $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error finding user DM rooms:', error);
    throw error;
  }
};

// Find DM room between specific users
exports.findDMRoomByUsers = async (userId1, userId2) => {
  try {
    const expectedUrl = generateDMRoomUrl([userId1, userId2]);
    const result = await db.query(
      `SELECT r.* FROM rooms r
       WHERE r.url_name = $1
       AND EXISTS (
         SELECT 1 FROM room_members rm1
         WHERE rm1.room_id = r.id AND rm1.user_id = $2
       )
       AND EXISTS (
         SELECT 1 FROM room_members rm2
         WHERE rm2.room_id = r.id AND rm2.user_id = $3
       )`,
      [expectedUrl, userId1, userId2]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding DM room by users:', error);
    throw error;
  }
};

exports.getDMParticipants = async (roomId) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email
       FROM users u
       JOIN room_members rm ON u.id = rm.user_id
       WHERE rm.room_id = $1`,
      [roomId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting DM participants:', error);
    throw error;
  }
};

exports.isDMRoom = async (roomId) => {
  try {
    const result = await db.query(
      `SELECT EXISTS (
         SELECT 1 FROM rooms
         WHERE id = $1 AND url_name LIKE 'dm-%'
       ) as is_dm`,
      [roomId]
    );
    return result.rows[0]?.is_dm || false;
  } catch (error) {
    console.error('Error checking if room is DM:', error);
    throw error;
  }
};
