// database/tables/channelTables.js
module.exports = async (client) => {
  try {
    // Create channel categories table first
    await client.query(`
        CREATE TABLE IF NOT EXISTS channel_categories (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          position INTEGER DEFAULT 0,
          is_collapsed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(room_id, name)
        )
      `);
    console.log('✓ Channel categories table created');

    // Create channels table
    await client.query(`
        CREATE TABLE IF NOT EXISTS channels (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          category_id INTEGER REFERENCES channel_categories(id) ON DELETE SET NULL,
          url_id CHAR(8) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          position INTEGER DEFAULT 0,
          is_default BOOLEAN DEFAULT FALSE,
          is_nsfw BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(room_id, name)
        )
      `);
    console.log('✓ Channels table created');

    // Create channel permissions table
    await client.query(`
        CREATE TABLE IF NOT EXISTS channel_permissions (
          channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
          role_name VARCHAR(20) CHECK (role_name IN ('admin', 'mod', 'janitor')),
          can_view BOOLEAN DEFAULT TRUE,
          can_post BOOLEAN DEFAULT TRUE,
          can_create_threads BOOLEAN DEFAULT TRUE,
          PRIMARY KEY (channel_id, role_name)
        )
      `);
    console.log('✓ Channel permissions table created');

    return true;
  } catch (error) {
    console.error('✗ Error creating channel tables:', error);
    throw error;
  }
};
