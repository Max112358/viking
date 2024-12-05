// database/functions/position.js
module.exports = async (client) => {
  try {
    // Function to maintain category positions
    await client.query(`
      CREATE OR REPLACE FUNCTION maintain_category_position()
      RETURNS TRIGGER AS $$
      DECLARE
        max_pos INTEGER;
      BEGIN
        -- Get the maximum position for the room
        SELECT COALESCE(MAX(position), -1) INTO max_pos
        FROM channel_categories
        WHERE room_id = NEW.room_id;
        
        -- If no position specified or invalid position, append to end
        IF NEW.position IS NULL OR NEW.position > max_pos + 1 THEN
          NEW.position := max_pos + 1;
        ELSE
          -- Shift existing categories to make room for the new position
          UPDATE channel_categories
          SET position = position + 1
          WHERE room_id = NEW.room_id
            AND position >= NEW.position
            AND id != COALESCE(NEW.id, -1);
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql VOLATILE;
    `);

    // Function to maintain channel positions
    await client.query(`
      CREATE OR REPLACE FUNCTION maintain_channel_position()
      RETURNS TRIGGER AS $$
      DECLARE
        max_pos INTEGER;
      BEGIN
        -- Get the maximum position for the category
        SELECT COALESCE(MAX(position), -1) INTO max_pos
        FROM channels
        WHERE room_id = NEW.room_id
          AND COALESCE(category_id, 0) = COALESCE(NEW.category_id, 0);
        
        -- If no position specified or invalid position, append to end
        IF NEW.position IS NULL OR NEW.position > max_pos + 1 THEN
          NEW.position := max_pos + 1;
        ELSE
          -- Shift existing channels to make room for the new position
          UPDATE channels
          SET position = position + 1
          WHERE room_id = NEW.room_id
            AND COALESCE(category_id, 0) = COALESCE(NEW.category_id, 0)
            AND position >= NEW.position
            AND id != COALESCE(NEW.id, -1);
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql VOLATILE;
    `);

    // Function to ensure at least one default channel exists
    await client.query(`
      CREATE OR REPLACE FUNCTION ensure_default_channel()
      RETURNS TRIGGER AS $$
      DECLARE
        default_count INTEGER;
      BEGIN
        -- Count existing default channels in the room
        SELECT COUNT(*) INTO default_count
        FROM channels
        WHERE room_id = NEW.room_id AND is_default = true;
        
        -- If this is the first channel in the room, make it default
        IF default_count = 0 THEN
          NEW.is_default := true;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql VOLATILE;
    `);

    // Function to prevent deletion of the last channel
    await client.query(`
      CREATE OR REPLACE FUNCTION prevent_delete_last_channel()
      RETURNS TRIGGER AS $$
      DECLARE
        channel_count INTEGER;
      BEGIN
        -- Count remaining channels in the room
        SELECT COUNT(*) INTO channel_count
        FROM channels
        WHERE room_id = OLD.room_id;
        
        -- If this is the last channel, prevent deletion
        IF channel_count = 1 THEN
          RAISE EXCEPTION 'Cannot delete the last channel in a room';
        END IF;
        
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql VOLATILE;
    `);

    console.log('✓ Position management functions created');
    return true;
  } catch (error) {
    console.error('✗ Error creating position management functions:', error);
    throw error;
  }
};
