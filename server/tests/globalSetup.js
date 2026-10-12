import fs from 'node:fs';
import path from 'node:path';

/**
 * Removes the previous test database and journal before the test run.
 */
export default function setup() {
  const file = path.join(import.meta.dirname, '..', 'oqms-test.sqlite');
  fs.rmSync(file, { force: true });
  fs.rmSync(`${file}-journal`, { force: true });
}