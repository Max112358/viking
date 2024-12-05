// database/triggers/positionTriggers.js
module.exports = async (client) => {
  try {
    await client.query(`
        -- Category position trigger
        DROP TRIGGER IF EXISTS set_category_position ON channel_categories;
        CREATE TRIGGER set_category_position
          BEFORE INSERT OR UPDATE OF position ON channel_categories
          FOR EACH ROW
          EXECUTE FUNCTION maintain_category_position();
  
        -- Channel position trigger
        DROP TRIGGER IF EXISTS set_channel_position ON channels;
        CREATE TRIGGER set_channel_position
          BEFORE INSERT OR UPDATE OF position ON channels
          FOR EACH ROW
          EXECUTE FUNCTION maintain_channel_position();
  
        -- Ensure default channel trigger
        DROP TRIGGER IF EXISTS set_default_channel ON channels;
        CREATE TRIGGER set_default_channel
          BEFORE INSERT ON channels
          FOR EACH ROW
          EXECUTE FUNCTION ensure_default_channel();
  
        -- Prevent deleting last channel trigger
        DROP TRIGGER IF EXISTS prevent_last_channel_deletion ON channels;
        CREATE TRIGGER prevent_last_channel_deletion
          BEFORE DELETE ON channels
          FOR EACH ROW
          EXECUTE FUNCTION prevent_delete_last_channel();
      `);
    console.log('✓ Position and channel management triggers created');
    return true;
  } catch (error) {
    console.error('✗ Error creating position triggers:', error);
    throw error;
  }
};
