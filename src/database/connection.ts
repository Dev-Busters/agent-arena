import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const { Pool } = pg;

console.log('🚀 [DB] Initializing connection pool...');
console.log('🚀 [DB] DATABASE_URL set:', !!process.env.DATABASE_URL);

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ [DB] FATAL: DATABASE_URL environment variable is not set!');
  console.error('❌ [DB] Please ensure DATABASE_URL is configured in your environment.');
  console.error('❌ [DB] Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased from 2000 to 5000 for better Railway compatibility
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('❌ [DB] Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('✅ [DB] Pool connection established');
});

console.log('🚀 [DB] Connection pool initialized');

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
