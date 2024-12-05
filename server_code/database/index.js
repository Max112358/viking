// database/index.js
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

// Export the database interface
module.exports = {
  query: (text, params) => pool.query(text, params),
  transaction,
  initializeDatabase: require('./initialize'),
};

/*
database/
  ├── index.js           (main entry point with pool and exports)
  ├── initialize.js      (orchestrates initialization)
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
