// database/tables/threadTables.js
module.exports = async (client) => {
  try {
    // Create threads table
    await client.query(`
        CREATE TABLE IF NOT EXISTS threads (
          id SERIAL PRIMARY KEY,
          channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
          url_id CHAR(8) UNIQUE NOT NULL,
          subject VARCHAR(255) NOT NULL,
          author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_pinned BOOLEAN DEFAULT FALSE,
          is_locked BOOLEAN DEFAULT FALSE,
          is_anonymous BOOLEAN DEFAULT FALSE,
          last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    console.log('✓ Threads table created');

    // Create anonymous identifiers table
    await client.query(`
        CREATE TABLE IF NOT EXISTS anonymous_identifiers (
          id SERIAL PRIMARY KEY,
          thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          anonymous_id VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(thread_id, user_id)
        )
      `);
    console.log('✓ Anonymous identifiers table created');

    // Create posts table
    await client.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
          author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          content TEXT NOT NULL,
          country_code CHAR(2),
          country_name VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    console.log('✓ Posts table created');

    // Create file attachments table
    await client.query(`
        CREATE TABLE IF NOT EXISTS file_attachments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          file_size INTEGER NOT NULL,
          file_url VARCHAR(255) NOT NULL,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    console.log('✓ File attachments table created');

    // Create notifications table
    await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB
        )
      `);
    console.log('✓ Notifications table created');

    // Create notification settings table
    await client.query(`
        CREATE TABLE IF NOT EXISTS notification_settings (
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          mentions_enabled BOOLEAN DEFAULT TRUE,
          threads_enabled BOOLEAN DEFAULT TRUE,
          messages_enabled BOOLEAN DEFAULT TRUE,
          PRIMARY KEY (user_id, room_id)
        )
      `);
    console.log('✓ Notification settings table created');

    // Create temporary accounts table
    await client.query(`
        CREATE TABLE IF NOT EXISTS temporary_accounts (
          id SERIAL PRIMARY KEY,
          ip_address VARCHAR(45) NOT NULL,
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          UNIQUE(ip_address, room_id)
        )
      `);
    console.log('✓ Temporary accounts table created');

    return true;
  } catch (error) {
    console.error('✗ Error creating thread tables:', error);
    throw error;
  }
};
