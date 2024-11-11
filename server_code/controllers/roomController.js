// controllers/roomController.js
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { destroyRoom } = require('../services/roomService');

exports.createRoom = async (req, res) => {
  const { name, description, userId } = req.body;
  const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const roomResult = await db.query(
      'INSERT INTO rooms (name, description, thumbnail_url) VALUES ($1, $2, $3) RETURNING id',
      [name, description, thumbnailUrl]
    );
    
    const roomId = roomResult.rows[0].id;
    await db.query(
      'INSERT INTO room_members (room_id, user_id, is_admin) VALUES ($1, $2, $3)',
      [roomId, userId, true]
    );

    res.status(201).json({ 
      message: 'Room created successfully', 
      roomId: roomId 
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
};

exports.getUserRooms = async (req, res) => {
  const userId = req.params.userId;

  //console.log('get user rooms endpoint hit with data:', req.body); 

  try {
    const userRooms = await db.query(`
      SELECT r.id as room_id, r.name, r.thumbnail_url, r.created_at, rm.joined_at
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = $1
      ORDER BY rm.joined_at DESC
    `, [userId]);

    res.json({ rooms: userRooms.rows });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
};

exports.joinRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.body.userId;

  try {
    const existingMember = await db.query(
      'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: 'Already a member of this room' });
    }

    await db.query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
      [roomId, userId]
    );

    res.status(200).json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Error joining room' });
  }
};

exports.leaveRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.body.userId;

  //console.log('leave room endpoint hit with data:', roomId, " ", userId); 
  
  try {
    await db.transaction(async (client) => {
      await client.query(
        'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, userId]
      );

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
  const userId = req.body.userId;

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