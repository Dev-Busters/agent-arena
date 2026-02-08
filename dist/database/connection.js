import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
export const query = (text, params) => {
    return pool.query(text, params);
};
export const getClient = async () => {
    return pool.connect();
};
export const closePool = async () => {
    await pool.end();
};
export default pool;
//# sourceMappingURL=connection.js.map