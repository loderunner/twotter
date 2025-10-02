import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Runs database migrations
 */
async function migrate() {
  try {
    console.log('Running database migrations...');

    const schemaPath = join(__dirname, 'schema.sql');
    const schema = await readFile(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
