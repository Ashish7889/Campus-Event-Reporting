const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    const migrationFile = path.join(__dirname, '../migrations/001_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split SQL statements and execute them individually
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.raw(statement);
      }
    }
    
    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runMigrations();
