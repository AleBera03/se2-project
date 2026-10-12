import { beforeEach } from 'vitest';

import { resetTestDb } from './helpers/testDb.js';

// Restores the test database before each test.
beforeEach(() => resetTestDb());