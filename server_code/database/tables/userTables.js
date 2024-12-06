// database/tables/userTables.js
module.exports = async (client) => {
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
    console.log('✓ Users table created');

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
    console.log('✓ User profiles table created');

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
    console.log('✓ Friendships table created');

    // Create friend categories table
    await client.query(`
        CREATE TABLE IF NOT EXISTS friend_categories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(50) NOT NULL,
          position INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, name)
        )
      `);
    console.log('✓ Friend categories table created');

    // Create friend category members table
    await client.query(`
        CREATE TABLE IF NOT EXISTS friend_category_members (
          category_id INTEGER REFERENCES friend_categories(id) ON DELETE CASCADE,
          friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (category_id, friend_id)
        )
      `);
    console.log('✓ Friend category members table created');

    return true;
  } catch (error) {
    console.error('✗ Error creating user tables:', error);
    throw error;
  }
};
