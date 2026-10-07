import sqlite3 from 'sqlite3'
import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


const DB_PATH = path.join(__dirname, 'database.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');



const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('Failed to enable foreign keys:', pragmaErr.message);
      } else {
        console.log('Foreign key constraints enabled.');
      }
    });

    initDatabase();
  }
});


function initDatabase() {
  if (fs.existsSync(SCHEMA_PATH)) {
    const sql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    
    db.exec(sql, (err) => {
      if (err) {
        console.error('Failed to execute schema.sql:', err.message);
      } else {
        console.log('Database schema and initial data initialized successfully.');
      }
    });
  } else {
    console.warn('schema.sql not found at', SCHEMA_PATH);
  }
}

export default db;