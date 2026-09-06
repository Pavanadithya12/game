import pg from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mawabro';

export const pool = new pg.Pool({
  connectionString,
});

pool.on('error', (err) => {
  // Gracefully catch background pool errors so node process never crashes
  console.log('Postgres connection note (in-memory mode active):', err.message);
});
