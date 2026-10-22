import { unlinkSync, existsSync } from 'fs';
export default async function teardown() {
  const TEST_DB = './test_ccb.db';
  try {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  } catch {}
}
