// database/initialize.js
const functions = require('./functions');
const tables = require('./tables');
const triggers = require('./triggers');

async function initializeDatabase(client) {
  try {
    console.log('\nStarting database initialization...\n');

    // 1. Create utility functions first
    console.log('Creating database functions...');
    await functions.createTimestampFunction(client);
    await functions.createUrlFunction(client);
    await functions.createPositionFunctions(client);

    // 2. Create all tables in dependency order
    console.log('\nCreating database tables...');
    await tables.createUserTables(client);
    await tables.createRoomTables(client);
    await tables.createChannelTables(client);
    await tables.createThreadTables(client);

    // 3. Create triggers last (after all functions and tables exist)
    console.log('\nCreating database triggers...');
    await triggers.createTimestampTriggers(client);
    await triggers.createPositionTriggers(client);
    await triggers.createUrlTriggers(client);

    console.log('\n✓ Database initialization completed successfully\n');
    return true;
  } catch (error) {
    console.error('\n✗ Database initialization failed:', error);
    throw error;
  }
}

module.exports = async () => {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const client = await pool.connect();
  try {
    await initializeDatabase(client);
  } finally {
    client.release();
  }
};
