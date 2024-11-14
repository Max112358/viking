// part of backend
// controllers/roomController.js
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { destroyRoom } = require('../services/roomService');

exports.createRoom = async (req, res) => {
  const {
    name,
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
    const roomResult = await db.query(
      `INSERT INTO rooms (
        name, 
        description, 
        thumbnail_url, 
        is_public,
        allow_anonymous,
        allow_user_threads,
        thread_limit,
        anonymous_unique_per_thread,
        show_country_flags,
        is_nsfw,
        allow_accountless,
        posts_per_thread
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        name,
        description,
        thumbnailUrl,
        isPublic === 'true',
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
    await db.query('INSERT INTO room_members (room_id, user_id, is_admin) VALUES ($1, $2, $3)', [roomId, userId, true]);

    res.status(201).json({
      message: 'Room created successfully',
      roomId: roomId,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
};

exports.getUserRooms = async (req, res) => {
  // Get userId from the JWT token instead of URL parameters
  const userId = req.user.userId;

  try {
    const userRooms = await db.query(
      `
      SELECT r.id as room_id, r.name, r.thumbnail_url, r.created_at, rm.joined_at
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = $1
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
    const existingMember = await db.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, userId]);

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
      await client.query('DELETE FROM room_members WHERE room_id = $1 AND user_id = $2', [roomId, userId]);

      const remainingMembers = await client.query('SELECT COUNT(*) FROM room_members WHERE room_id = $1', [roomId]);

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
      const isAdmin = await client.query('SELECT is_admin FROM room_members WHERE room_id = $1 AND user_id = $2 AND is_admin = true', [
        roomId,
        userId,
      ]);

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
