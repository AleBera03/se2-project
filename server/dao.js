// SQLite queries
import db from './db.js';
import { createGetCounterQueues } from './getCounterQueues.js';

export const getCounterQueues = createGetCounterQueues(db);