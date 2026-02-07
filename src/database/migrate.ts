/**
 * Database Migration Runner
 * Reads schema.sql and applies migrations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting database migrations...');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and filter empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✓ Executed migration statement');
      } catch (err: any) {
        // Log but don't fail on duplicate object errors (idempotent)
        if (err.code === '42P07' || err.code === '42712') {
          console.log('⚠ Object already exists (skipping):', err.message);
        } else {
          throw err;
        }
      }
    }

    console.log('✅ Database migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigrations();
