// database/tables/roomTables.js
module.exports = async (client) => {
  try {
    // Create rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url_name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        thumbnail_url VARCHAR(255),
        is_public BOOLEAN DEFAULT FALSE,
        is_hidden BOOLEAN DEFAULT FALSE,      /* New field added here */
        thread_limit INTEGER DEFAULT 100,
        allow_anonymous BOOLEAN DEFAULT TRUE,
        allow_user_threads BOOLEAN DEFAULT TRUE,
        max_file_size INTEGER DEFAULT 5242880,
        max_files_per_post INTEGER DEFAULT 9,
        anonymous_unique_per_thread BOOLEAN DEFAULT FALSE,
        show_country_flags BOOLEAN DEFAULT FALSE,
        is_nsfw BOOLEAN DEFAULT FALSE,
        allow_accountless BOOLEAN DEFAULT FALSE,     
        posts_per_thread INTEGER DEFAULT 1000,      
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
  `);
    console.log('✓ Rooms table created');

    // Create room_members table
    await client.query(`
        CREATE TABLE IF NOT EXISTS room_members (
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          is_admin BOOLEAN DEFAULT FALSE,
          is_mod BOOLEAN DEFAULT FALSE,
          is_janitor BOOLEAN DEFAULT FALSE,
          display_name VARCHAR(50),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (room_id, user_id)
        )
      `);
    console.log('✓ Room members table created');

    // Create room_role_permissions table
    await client.query(`
        CREATE TABLE IF NOT EXISTS room_role_permissions (
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          role_name VARCHAR(20) CHECK (role_name IN ('admin', 'mod', 'janitor')),
          can_pin_threads BOOLEAN DEFAULT FALSE,
          can_lock_threads BOOLEAN DEFAULT FALSE,
          can_move_threads BOOLEAN DEFAULT FALSE,
          can_delete_threads BOOLEAN DEFAULT FALSE,
          can_ban_users BOOLEAN DEFAULT FALSE,
          can_timeout_users BOOLEAN DEFAULT FALSE,
          can_edit_posts BOOLEAN DEFAULT FALSE,
          can_delete_posts BOOLEAN DEFAULT FALSE,
          can_manage_roles BOOLEAN DEFAULT FALSE,
          PRIMARY KEY (room_id, role_name)
        )
      `);
    console.log('✓ Room role permissions table created');

    // Create room_invites table
    await client.query(`
        CREATE TABLE IF NOT EXISTS room_invites (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          inviter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          invitee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE
        )
      `);
    console.log('✓ Room invites table created');

    // Create room_bans table
    await client.query(`
        CREATE TABLE IF NOT EXISTS room_bans (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          banned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reason TEXT,
          banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE,
          is_permanent BOOLEAN DEFAULT FALSE,
          UNIQUE(room_id, user_id)
        )
      `);
    console.log('✓ Room bans table created');

    // Create room_timeouts table
    await client.query(`
        CREATE TABLE IF NOT EXISTS room_timeouts (
          id SERIAL PRIMARY KEY,
          room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reason TEXT,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          UNIQUE(room_id, user_id)
        )
      `);
    console.log('✓ Room timeouts table created');

    return true;
  } catch (error) {
    console.error('✗ Error creating room tables:', error);
    throw error;
  }
};
