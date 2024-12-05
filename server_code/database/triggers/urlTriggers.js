// database/triggers/urlTriggers.js
module.exports = async (client) => {
  try {
    await client.query(`
        -- Channel URL trigger
        DROP TRIGGER IF EXISTS set_channel_url_id_trigger ON channels;
        CREATE TRIGGER set_channel_url_id_trigger
          BEFORE INSERT ON channels
          FOR EACH ROW
          EXECUTE FUNCTION set_channel_url_id();
  
        -- Thread URL trigger
        DROP TRIGGER IF EXISTS set_thread_url_id_trigger ON threads;
        CREATE TRIGGER set_thread_url_id_trigger
          BEFORE INSERT ON threads
          FOR EACH ROW
          EXECUTE FUNCTION set_thread_url_id();
      `);
    console.log('✓ URL generation triggers created');
    return true;
  } catch (error) {
    console.error('✗ Error creating URL triggers:', error);
    throw error;
  }
};
