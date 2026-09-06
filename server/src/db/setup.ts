import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { pool } from './pool.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupDb() {
  let schemaPath = join(__dirname, 'schema.sql');
  if (!existsSync(schemaPath)) {
    schemaPath = join(__dirname, '..', '..', 'src', 'db', 'schema.sql');
  }
  const sql = readFileSync(schemaPath, 'utf-8');
  try {
    await pool.query(sql);
    console.log('Database schema setup successful.');
  } catch (error) {
    console.error('Error setting up database schema:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDb().then(() => process.exit(0));
}
