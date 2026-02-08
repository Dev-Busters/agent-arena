import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixSchema() {
  const client = await pool.connect();
  try {
    console.log('Adding max_depth column...');
    await client.query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_depth INT DEFAULT 1');
    console.log('✓ max_depth column added');
    
    console.log('Adding total_gold column...');
    await client.query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_gold BIGINT DEFAULT 0');
    console.log('✓ total_gold column added');
    
    console.log('Creating index...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_agents_max_depth ON agents(max_depth DESC)');
    console.log('✓ Index created');
    
    console.log('✅ Schema fixed!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

fixSchema();
