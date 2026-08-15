require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    console.log('Applying schema.sql ...');
    await db.query(schema);
    console.log('✔ Migration complete.');
  } catch (err) {
    console.error('✘ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
}

migrate();
