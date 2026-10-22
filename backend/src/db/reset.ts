import { unlinkSync, existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './ccb.db';
const dbPath = path.resolve(process.cwd(), DB_PATH);

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log('🗑️  Database deleted:', dbPath);
} else {
  console.log('ℹ️  No database found at:', dbPath);
}

console.log('✅ Reset complete. Run "npm run seed" to re-seed.');
