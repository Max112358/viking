// part of backend
// controllers/roomController.js
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { destroyRoom } = require('../services/roomService');

exports.createRoom = async (req, res) => {
  const {
    name,
    urlName,
    description,
    isPublic,
    allowAnonymous,
    allowUserThreads,
    threadLimit,
    anonymousUniquePerThread,
    showCountryFlags,
    isNsfw,
    allowAccountless,
    postsPerThread,
  } = req.body;

  const userId = req.user.userId;
  const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Format the URL name: lowercase, remove special chars except hyphens
    const formattedUrlName = urlName.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Validate URL name
    if (formattedUrlName.length < 3 || formattedUrlName.length > 50) {
      return res.status(400).json({ message: 'URL name must be between 3 and 50 characters' });
    }

    // Check if URL is taken one final time before creating room
    const result = await db.transaction(async (client) => {
      // Check URL availability
      const urlCheck = await client.query(
        'SELECT EXISTS(SELECT 1 FROM rooms WHERE url_name = $1)',
        [formattedUrlName]
      );

      if (urlCheck.rows[0].exists) {
        throw new Error('URL name is no longer available');
      }

      // Create room
      const roomResult = await client.query(
        `INSERT INTO rooms (
          name, 
          url_name,
          description, 
          thumbnail_url, 
          is_public,
          is_hidden,
          allow_anonymous,
          allow_user_threads,
          thread_limit,
          anonymous_unique_per_thread,
          show_country_flags,
          is_nsfw,
          allow_accountless,
          posts_per_thread
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
        [
          name,
          formattedUrlName,
          description,
          thumbnailUrl,
          isPublic === 'true',
          formattedUrlName.startsWith('dm-'), // Automatically hide DM rooms
          allowAnonymous === 'true',
          allowUserThreads === 'true',
          threadLimit === 'null' ? null : parseInt(threadLimit),
          anonymousUniquePerThread === 'true',
          showCountryFlags === 'true',
          isNsfw === 'true',
          allowAccountless === 'true',
          postsPerThread === 'null' ? null : parseInt(postsPerThread),
        ]
      );

      const roomId = roomResult.rows[0].id;

      // Create default category
      const categoryResult = await client.query(
        `INSERT INTO channel_categories (room_id, name, position) 
         VALUES ($1, $2, 0) RETURNING id`,
        [roomId, 'TEXT CHANNELS']
      );

      const categoryId = categoryResult.rows[0].id;

      // Create default general channel
      await client.query(
        `INSERT INTO channels (room_id, category_id, name, description, is_default) 
         VALUES ($1, $2, $3, $4, true)`,
        [roomId, categoryId, 'general', 'General discussion']
      );

      // Make creator an admin
      await client.query(
        'INSERT INTO room_members (room_id, user_id, is_admin) VALUES ($1, $2, $3)',
        [roomId, userId, true]
      );

      return { roomId, urlName: formattedUrlName };
    });

    res.status(201).json({
      message: 'Room created successfully',
      roomId: result.roomId,
      urlName: result.urlName,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    if (error.message === 'URL name is no longer available') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error creating room' });
    }

    // Clean up uploaded file if room creation failed
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'public', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
  }
};

// Add URL check endpoint
exports.checkRoomUrlAvailability = async (req, res) => {
  const { urlName } = req.params;

  try {
    // Format the URL name (lowercase, remove special chars except hyphens)
    const formattedUrlName = urlName.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Basic validation
    if (formattedUrlName.length < 3) {
      return res.json({
        available: false,
        formattedUrl: formattedUrlName,
        message: 'URL must be at least 3 characters long',
      });
    }

    if (formattedUrlName.length > 50) {
      return res.json({
        available: false,
        formattedUrl: formattedUrlName,
        message: 'URL must be less than 50 characters',
      });
    }

    // Check if URL exists
    const result = await db.query('SELECT EXISTS(SELECT 1 FROM rooms WHERE url_name = $1)', [
      formattedUrlName,
    ]);

    res.json({
      available: !result.rows[0].exists,
      formattedUrl: formattedUrlName,
    });
  } catch (error) {
    console.error('Error checking room URL availability:', error);
    res.status(500).json({ message: 'Error checking URL availability' });
  }
};

exports.getRoomByUrl = async (req, res) => {
  const { urlName } = req.params;
  const userId = req.user.userId;

  try {
    // Get room and check if user is a member
    const roomResult = await db.query(
      `
      SELECT r.*, rm.is_admin, rm.is_mod, rm.is_janitor
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id AND rm.user_id = $1
      WHERE r.url_name = $2
    `,
      [userId, urlName]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = roomResult.rows[0];

    // If room is not public and user is not a member, deny access
    if (!room.is_public && !room.is_admin && !room.is_mod && !room.is_janitor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      room_id: room.id,
      name: room.name,
      url_name: room.url_name,
      description: room.description,
      thumbnail_url: room.thumbnail_url,
      is_public: room.is_public,
      is_admin: room.is_admin,
      is_mod: room.is_mod,
      is_janitor: room.is_janitor,
      // Add other room settings as needed
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Error fetching room' });
  }
};

exports.getUserRooms = async (req, res) => {
  const userId = req.user.userId;

  try {
    const userRooms = await db.query(
      `
      SELECT 
        r.id as room_id, 
        r.name, 
        r.url_name,
        r.thumbnail_url, 
        r.created_at, 
        rm.joined_at,
        rm.is_admin
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = $1
      AND NOT r.url_name LIKE 'dm-%'  -- Explicitly exclude DM rooms
      ORDER BY rm.joined_at DESC
    `,
      [userId]
    );

    res.json({ rooms: userRooms.rows });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
};

exports.joinRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId; // Also fixed here

  try {
    const existingMember = await db.query(
      'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: 'Already a member of this room' });
    }

    await db.query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)', [roomId, userId]);

    res.status(200).json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Error joining room' });
  }
};

exports.leaveRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId; // Fixed here too

  try {
    await db.transaction(async (client) => {
      await client.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [
        roomId,
        userId,
      ]);

      const remainingMembers = await client.query(
        'SELECT COUNT(*) FROM room_members WHERE room_id = $1',
        [roomId]
      );

      if (parseInt(remainingMembers.rows[0].count) === 0) {
        await destroyRoom(client, roomId);
      }
    });

    res.status(200).json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Error leaving room' });
  }
};

exports.deleteRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId; // And here

  try {
    await db.transaction(async (client) => {
      const isAdmin = await client.query(
        'SELECT is_admin FROM room_members WHERE room_id = $1 AND user_id = $2 AND is_admin = true',
        [roomId, userId]
      );

      if (isAdmin.rows.length === 0) {
        throw new Error('Not authorized to delete room');
      }

      await destroyRoom(client, roomId);
    });

    res.status(200).json({ message: 'Room successfully deleted' });
  } catch (error) {
    console.error('Error deleting room:', error);
    if (error.message === 'Not authorized to delete room') {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error deleting room' });
    }
  }
};
