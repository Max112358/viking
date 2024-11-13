// part of backend
// db.js
const { Pool } = require('pg');
require('dotenv').config();

//this pool is used with wrapper functions, NOT direct export! DO NOT DELETE THIS
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Helper function to handle transactions
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Function to run migrations
async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Define migrations
    const migrations = [
      //{ //example migration
      //  name: 'add_is_anonymous_to_threads',
      //  up: `ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;`,
      //},
      // Add more migrations here as needed
    ];

    // Execute pending migrations
    for (const migration of migrations) {
      const migrationExists = await client.query('SELECT 1 FROM migrations WHERE name = $1', [migration.name]);

      if (migrationExists.rows.length === 0) {
        console.log(`Executing migration: ${migration.name}`);
        await client.query(migration.up);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
        console.log(`Completed migration: ${migration.name}`);
      }
    }
  } catch (err) {
    console.error('Error running migrations:', err);
    throw err;
  } finally {
    client.release();
  }
}

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table ensured');

    // Create user profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(50) UNIQUE,
        avatar_url VARCHAR(255),
        unique_invite_id VARCHAR(20) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('User profiles table ensured');

    // Create friendships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, friend_id)
      )
    `);
    console.log('Friendships table ensured');

    // Create rooms table with all settings - Added new toggles and limits
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail_url VARCHAR(255),
        is_public BOOLEAN DEFAULT FALSE,
        thread_limit INTEGER DEFAULT 100,
        allow_anonymous BOOLEAN DEFAULT TRUE,
        allow_user_threads BOOLEAN DEFAULT TRUE,
        max_file_size INTEGER DEFAULT 5242880,
        max_files_per_post INTEGER DEFAULT 9,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Rooms table ensured');

    // Create room_members junction table with expanded roles
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
    console.log('Room members table ensured');

    // Create room_role_permissions table to define powers for each role
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
    console.log('Room role permissions table ensured');

    // Create room invites table
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
    console.log('Room invites table ensured');

    // Create room bans table
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
    console.log('Room bans table ensured');

    // Create room timeouts table
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
    console.log('Room timeouts table ensured');

    // Create threads table - Added is_locked since it wasn't there before
    await client.query(`
      CREATE TABLE IF NOT EXISTS threads (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        is_anonymous BOOLEAN DEFAULT FALSE,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Threads table ensured');

    // Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Posts table ensured');

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
    console.log('File attachments table ensured');

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
    console.log('Notifications table ensured');

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
    console.log('Notification settings table ensured');

    console.log('Database initialization completed');
  } catch (err) {
    console.error('Error initializing database tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  transaction,
  initializeDatabase,
};
