const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not configured. Add it to your environment variables.'
  );
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

async function checkDatabaseConnection() {
  const client = await pool.connect();

  try {
    await client.query('SELECT 1');
    console.log('PostgreSQL connected successfully.');
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  checkDatabaseConnection,
};