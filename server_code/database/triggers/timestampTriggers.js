// database/triggers/timestampTriggers.js
module.exports = async (client) => {
  try {
    // Add update_updated_at_column trigger to all tables with updated_at
    await client.query(`
        -- Friendships timestamp trigger
        DROP TRIGGER IF EXISTS update_friendship_timestamp ON friendships;
        CREATE TRIGGER update_friendship_timestamp
          BEFORE UPDATE ON friendships
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
  
        -- Channel categories timestamp trigger
        DROP TRIGGER IF EXISTS update_channel_categories_timestamp ON channel_categories;
        CREATE TRIGGER update_channel_categories_timestamp
          BEFORE UPDATE ON channel_categories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
  
        -- Channels timestamp trigger
        DROP TRIGGER IF EXISTS update_channel_timestamp ON channels;
        CREATE TRIGGER update_channel_timestamp
          BEFORE UPDATE ON channels
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
  
        -- Posts timestamp trigger
        DROP TRIGGER IF EXISTS update_post_timestamp ON posts;
        CREATE TRIGGER update_post_timestamp
          BEFORE UPDATE ON posts
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    console.log('✓ Timestamp triggers created');
    return true;
  } catch (error) {
    console.error('✗ Error creating timestamp triggers:', error);
    throw error;
  }
};
