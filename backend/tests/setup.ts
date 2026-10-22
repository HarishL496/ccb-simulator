import { unlinkSync, existsSync } from 'fs';

const TEST_DB = './test_ccb.db';

export default async function setup() {
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
}
