// controllers/categoryController.js
const db = require('../database');

exports.createCategory = async (req, res) => {
  const { roomId } = req.params;
  const { name, position } = req.body;
  const userId = req.user.userId;

  try {
    await db.transaction(async (client) => {
      // Check if user is room admin
      const adminCheck = await client.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2 AND is_admin = true', [
        roomId,
        userId,
      ]);

      if (adminCheck.rows.length === 0) {
        throw new Error('Only room admins can create categories');
      }

      // Create the category
      const result = await client.query('INSERT INTO channel_categories (room_id, name, position) VALUES ($1, $2, $3) RETURNING id', [
        roomId,
        name,
        position,
      ]);

      res.status(201).json({
        message: 'Category created successfully',
        categoryId: result.rows[0].id,
      });
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(error.message === 'Only room admins can create categories' ? 403 : 500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { name, position } = req.body;
  const userId = req.user.userId;

  try {
    await db.transaction(async (client) => {
      // Check if user is room admin
      const adminCheck = await client.query(
        `SELECT 1 FROM room_members rm
                 JOIN channel_categories cc ON cc.room_id = rm.room_id
                 WHERE cc.id = $1 AND rm.user_id = $2 AND rm.is_admin = true`,
        [categoryId, userId]
      );

      if (adminCheck.rows.length === 0) {
        throw new Error('Only room admins can update categories');
      }

      await client.query(
        `UPDATE channel_categories 
                 SET name = COALESCE($1, name),
                     position = COALESCE($2, position)
                 WHERE id = $3`,
        [name, position, categoryId]
      );

      res.json({ message: 'Category updated successfully' });
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(error.message === 'Only room admins can update categories' ? 403 : 500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  const userId = req.user.userId;

  try {
    await db.transaction(async (client) => {
      // Check if user is room admin
      const adminCheck = await client.query(
        `SELECT 1 FROM room_members rm
                 JOIN channel_categories cc ON cc.room_id = rm.room_id
                 WHERE cc.id = $1 AND rm.user_id = $2 AND rm.is_admin = true`,
        [categoryId, userId]
      );

      if (adminCheck.rows.length === 0) {
        throw new Error('Only room admins can delete categories');
      }

      // Remove category_id from channels in this category
      await client.query('UPDATE channels SET category_id = NULL WHERE category_id = $1', [categoryId]);

      // Delete the category
      await client.query('DELETE FROM channel_categories WHERE id = $1', [categoryId]);

      res.json({ message: 'Category deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(error.message === 'Only room admins can delete categories' ? 403 : 500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;

  try {
    const categories = await db.query(
      `SELECT cc.*, 
                    COALESCE(json_agg(
                        json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'description', c.description,
                            'position', c.position,
                            'is_default', c.is_default,
                            'is_nsfw', c.is_nsfw,
                            'url_id', c.url_id
                        ) ORDER BY c.position
                    ) FILTER (WHERE c.id IS NOT NULL), '[]'::json) as channels
             FROM channel_categories cc
             LEFT JOIN channels c ON c.category_id = cc.id
             WHERE cc.room_id = $1
             GROUP BY cc.id
             ORDER BY cc.position`,
      [roomId]
    );

    // Also get uncategorized channels
    const uncategorizedChannels = await db.query(
      `SELECT id, name, description, position, is_default, is_nsfw, url_id
             FROM channels
             WHERE room_id = $1 AND category_id IS NULL
             ORDER BY position`,
      [roomId]
    );

    res.json({
      categories: categories.rows,
      uncategorizedChannels: uncategorizedChannels.rows,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};
