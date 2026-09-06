import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { pool } from './pool.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function seedDb() {
  let seedPath = join(__dirname, 'seed.sql');
  if (!existsSync(seedPath)) {
    seedPath = join(__dirname, '..', '..', 'src', 'db', 'seed.sql');
  }
  const sql = readFileSync(seedPath, 'utf-8');
  try {
    await pool.query(sql);
    console.log('Database seed successful.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDb().then(() => process.exit(0));
}
