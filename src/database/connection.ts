import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const { Pool } = pg;

console.log('🚀 [DB] Initializing connection pool...');
console.log('🚀 [DB] DATABASE_URL set:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
