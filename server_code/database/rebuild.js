// database/rebuild.js
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function rebuildDatabase() {
  // Create a client to connect to postgres database
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres database
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Drop existing connections to the database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'vikingdb'
        AND pid <> pg_backend_pid();
    `);
    console.log('Terminated existing connections');

    // Drop the database if it exists
    await client.query('DROP DATABASE IF EXISTS vikingdb');
    console.log('Dropped existing database');

    // Create new database
    await client.query('CREATE DATABASE vikingdb');
    console.log('Created new database');

    // Close connection to postgres database
    await client.end();
    console.log('Disconnected from PostgreSQL');

    // Run the server initialization code
    console.log('Initializing new database schema...');
    const db = require('./index.js');
    await db.initializeDatabase();

    console.log('\nDatabase rebuild completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error rebuilding database:', error);
    process.exit(1);
  }
}

// Run the rebuild process
rebuildDatabase();

/*
backend file structure DO NOT DELETE THIS
database/
  ├── index.js           (main entry point with pool and exports)
  ├── initialize.js      (orchestrates initialization)
  ├── rebuild.js         (database rebuild script)
  ├── functions/
  │   ├── index.js
  │   ├── timestampFunction.js
  │   └── urlGeneration.js
  ├── tables/
  │   ├── index.js
  │   ├── userTables.js
  │   ├── roomTables.js
  │   ├── channelTables.js
  │   └── threadTables.js
  └── triggers/
      ├── index.js
      ├── timestampTriggers.js
      ├── positionTriggers.js
      └── urlTriggers.js
*/
