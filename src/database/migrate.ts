/**
 * Database Migration Runner
 * Reads schema.sql and applies migrations
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log('Loading env from:', envPath);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

import pool from './connection';

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting database migrations...');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons but handle dollar-quoted strings
    const statements: string[] = [];
    let current = '';
    let inDollarQuote = false;
    let dollarDelimiter = '';
    
    for (let i = 0; i < schema.length; i++) {
      const char = schema[i];
      const remaining = schema.substring(i);
      
      // Check for dollar quote start/end
      if (char === '$') {
        const match = remaining.match(/^\$[a-zA-Z0-9_]*\$/);
        if (match) {
          const delimiter = match[0];
          if (inDollarQuote && delimiter === dollarDelimiter) {
            inDollarQuote = false;
          } else if (!inDollarQuote) {
            inDollarQuote = true;
            dollarDelimiter = delimiter;
          }
          current += delimiter;
          i += delimiter.length - 1;
          continue;
        }
      }
      
      // Check for statement end
      if (char === ';' && !inDollarQuote) {
        if (current.trim().length > 0) {
          statements.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim().length > 0) {
      statements.push(current.trim());
    }

    // Execute each statement
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✓ Executed migration statement');
      } catch (err: any) {
        // Log but don't fail on duplicate object errors (idempotent)
        if (err.code === '42P07' || err.code === '42712' || err.code === '42710') {
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
