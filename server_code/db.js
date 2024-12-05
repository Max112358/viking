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
    // Create function for generating unique URL IDs
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_unique_url_id(table_name text, column_name text)
      RETURNS char(8) AS $$
      DECLARE
          new_id char(8);
          done bool;
      BEGIN
          done := false;
          WHILE NOT done LOOP
              -- Generate random 8-character string with mixed case alphanumeric
              new_id := array_to_string(ARRAY(
                  SELECT chr(((CASE WHEN r < 26 THEN 65 
                                  WHEN r < 52 THEN 97
                                  ELSE 48 END) + (CASE WHEN r < 26 THEN r
                                                     WHEN r < 52 THEN (r-26)
                                                     ELSE (r-52) END))::integer)
                  FROM (
                      SELECT floor(random()*62)::integer AS r
                      FROM generate_series(1,8)
                  ) AS gen
              ), '');
              
              -- Check if ID exists
              EXECUTE format('SELECT NOT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
              INTO done
              USING new_id;
          END LOOP;
          
          RETURN new_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('URL generation function created');

    // 1. First create users table (no dependencies)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table ensured');

    // 2. Create user profiles table (depends on users)
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

    // 3. Create friendships table (depends on users)
    // Create friendships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      )
    `);
    console.log('Friendships table ensured');

    // Add trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_friendship_timestamp ON friendships;
      CREATE TRIGGER update_friendship_timestamp
        BEFORE UPDATE ON friendships
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // 4. Create rooms table (no dependencies) - Updated with url_name
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url_name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        thumbnail_url VARCHAR(255),
        is_public BOOLEAN DEFAULT FALSE,
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
    console.log('Rooms table ensured');

    // 5. Create room_members table (depends on rooms and users)
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

    // 6. Create room_role_permissions table (depends on rooms)
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

    // 7. Create room_invites table (depends on rooms and users)
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

    // 8. Create room_bans table (depends on rooms and users)
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

    // 9. Create room_timeouts table (depends on rooms and users)
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

    // First create the channel categories table BEFORE the channels table
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
    console.log('Channel categories table ensured');

    // 10. -- Create channels table (depends on rooms)
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
    console.log('Channels table ensured');

    // Create trigger for updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add timestamp triggers
    await client.query(`
      DROP TRIGGER IF EXISTS update_channel_categories_updated_at ON channel_categories;
      CREATE TRIGGER update_channel_categories_updated_at
          BEFORE UPDATE ON channel_categories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create trigger for category position maintenance
    await client.query(`
      CREATE OR REPLACE FUNCTION maintain_category_position()
      RETURNS TRIGGER AS $$
      DECLARE
        max_pos INTEGER;
      BEGIN
          IF NEW.position IS NULL OR NEW.position < 0 THEN
              SELECT COALESCE(MAX(position) + 1, 0)
              INTO max_pos
              FROM channel_categories
              WHERE room_id = NEW.room_id;
              
              NEW.position := max_pos;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger for channel position maintenance
    await client.query(`
      CREATE OR REPLACE FUNCTION maintain_channel_position()
      RETURNS TRIGGER AS $$
      DECLARE
        max_pos INTEGER;
      BEGIN
          IF NEW.position IS NULL OR NEW.position < 0 THEN
              IF NEW.category_id IS NOT NULL THEN
                  SELECT COALESCE(MAX(position) + 1, 0)
                  INTO max_pos
                  FROM channels
                  WHERE category_id = NEW.category_id;
              ELSE
                  SELECT COALESCE(MAX(position) + 1, 0)
                  INTO max_pos
                  FROM channels
                  WHERE room_id = NEW.room_id
                    AND category_id IS NULL;
              END IF;
              
              NEW.position := max_pos;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Add position maintenance triggers
    await client.query(`
      DROP TRIGGER IF EXISTS set_category_position ON channel_categories;
      CREATE TRIGGER set_category_position
          BEFORE INSERT OR UPDATE OF position ON channel_categories
          FOR EACH ROW
          EXECUTE FUNCTION maintain_category_position();

      DROP TRIGGER IF EXISTS set_channel_position ON channels;
      CREATE TRIGGER set_channel_position
          BEFORE INSERT OR UPDATE OF position ON channels
          FOR EACH ROW
          EXECUTE FUNCTION maintain_channel_position();
    `);

    // Create function for category reordering
    await client.query(`
      CREATE OR REPLACE FUNCTION reorder_categories(
        p_room_id INTEGER,
        p_category_ids INTEGER[],
        p_positions INTEGER[]
      ) RETURNS void AS $$
      BEGIN
        FOR i IN 1..array_length(p_category_ids, 1)
        LOOP
          UPDATE channel_categories
          SET position = p_positions[i]
          WHERE id = p_category_ids[i] AND room_id = p_room_id;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create function for channel reordering
    await client.query(`
      CREATE OR REPLACE FUNCTION reorder_channels(
        p_room_id INTEGER,
        p_channel_ids INTEGER[],
        p_positions INTEGER[],
        p_category_ids INTEGER[]
      ) RETURNS void AS $$
      BEGIN
        FOR i IN 1..array_length(p_channel_ids, 1)
        LOOP
          UPDATE channels
          SET position = p_positions[i],
              category_id = p_category_ids[i]
          WHERE id = p_channel_ids[i]
            AND room_id = p_room_id;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Category and channel ordering functions created');

    // Create trigger function for channel URL IDs
    await client.query(`
      CREATE OR REPLACE FUNCTION set_channel_url_id()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.url_id IS NULL THEN
              NEW.url_id := generate_unique_url_id('channels', 'url_id');
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_channel_url_id_trigger ON channels;
      CREATE TRIGGER set_channel_url_id_trigger
          BEFORE INSERT ON channels
          FOR EACH ROW
          EXECUTE FUNCTION set_channel_url_id();
    `);
    console.log('Channel URL trigger created');

    // 6. Create channel permissions table (depends on channels)
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
    console.log('Channel permissions table ensured');

    // Add triggers for channel management
    await client.query(`
      CREATE OR REPLACE FUNCTION ensure_default_channel()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Check if this is the first channel in the room
        IF NOT EXISTS (
          SELECT 1 FROM channels 
          WHERE room_id = NEW.room_id 
          AND id != NEW.id
        ) THEN
          NEW.is_default := TRUE;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_default_channel ON channels;
      CREATE TRIGGER set_default_channel
      BEFORE INSERT ON channels
      FOR EACH ROW
      EXECUTE FUNCTION ensure_default_channel();

      CREATE OR REPLACE FUNCTION prevent_delete_last_channel()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM channels 
          WHERE room_id = OLD.room_id 
          AND id != OLD.id
        ) THEN
          RAISE EXCEPTION 'Cannot delete the last channel in a room';
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS prevent_last_channel_deletion ON channels;
      CREATE TRIGGER prevent_last_channel_deletion
      BEFORE DELETE ON channels
      FOR EACH ROW
      EXECUTE FUNCTION prevent_delete_last_channel();
    `);
    console.log('Channel triggers created');

    // 10. Create threads table (depends on rooms and users)
    // Update threads table with url_id
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
    console.log('Threads table ensured');

    // Create trigger function for thread URL IDs
    await client.query(`
      CREATE OR REPLACE FUNCTION set_thread_url_id()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.url_id IS NULL THEN
              NEW.url_id := generate_unique_url_id('threads', 'url_id');
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_thread_url_id_trigger ON threads;
      CREATE TRIGGER set_thread_url_id_trigger
          BEFORE INSERT ON threads
          FOR EACH ROW
          EXECUTE FUNCTION set_thread_url_id();
    `);
    console.log('Thread URL trigger created');

    // 11. Create anonymous_identifiers table (depends on threads and users)
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
    console.log('Anonymous identifiers table ensured');

    // 12. Create posts table (depends on threads and users)
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
    console.log('Posts table ensured');

    // 13. Create file_attachments table (depends on posts)
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

    // 14. Create notifications table (depends on users)
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

    // 15. Create notification_settings table (depends on users and rooms)
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

    // 16. Create new table for temporary accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS temporary_accounts (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,              -- IPv6 can be up to 45 chars
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(ip_address, room_id)
      )
    `);
    console.log('Temporary accounts table ensured');

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
