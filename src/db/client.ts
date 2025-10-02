import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://twotter:twotter@localhost:5432/twotter';

/**
 * PostgreSQL connection pool
 */
export const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
