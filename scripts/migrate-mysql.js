require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMySQLMigrations() {
  let connection;
  
  try {
    console.log('Starting MySQL database migrations...');
    
    // Connect to MySQL database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_events'
    });

    console.log('Connected to MySQL database');

    // Drop existing tables if they exist (for clean migration)
    const dropTables = [
      'DROP TABLE IF EXISTS feedback',
      'DROP TABLE IF EXISTS attendance', 
      'DROP TABLE IF EXISTS registrations',
      'DROP TABLE IF EXISTS events',
      'DROP TABLE IF EXISTS students',
      'DROP TABLE IF EXISTS colleges'
    ];

    for (const sql of dropTables) {
      await connection.execute(sql);
    }
    console.log('Dropped existing tables if any');

    // Create tables in correct order
    const createTables = [
      `CREATE TABLE colleges (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE students (
        id VARCHAR(36) PRIMARY KEY,
        college_id VARCHAR(36) NOT NULL,
        roll_no VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE events (
        id VARCHAR(36) PRIMARY KEY,
        college_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        start_time DATETIME,
        end_time DATETIME,
        capacity INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE registrations (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'registered',
        UNIQUE(event_id, student_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE attendance (
        id VARCHAR(36) PRIMARY KEY,
        registration_id VARCHAR(36) NOT NULL,
        checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        present INTEGER DEFAULT 1,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE feedback (
        id VARCHAR(36) PRIMARY KEY,
        registration_id VARCHAR(36) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
      )`
    ];

    for (const sql of createTables) {
      await connection.execute(sql);
      console.log(`Created table successfully`);
    }

    // Create indexes
    const createIndexes = [
      'CREATE INDEX idx_events_college ON events(college_id)',
      'CREATE INDEX idx_students_college ON students(college_id)',
      'CREATE INDEX idx_reg_event ON registrations(event_id)',
      'CREATE INDEX idx_reg_student ON registrations(student_id)',
      'CREATE INDEX idx_attendance_reg ON attendance(registration_id)',
      'CREATE INDEX idx_feedback_reg ON feedback(registration_id)',
      'CREATE INDEX idx_events_status ON events(status)',
      'CREATE INDEX idx_events_type ON events(type)',
      'CREATE INDEX idx_events_start_time ON events(start_time)'
    ];

    for (const sql of createIndexes) {
      await connection.execute(sql);
    }
    console.log('Created indexes successfully');

    console.log('✅ MySQL database migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMySQLMigrations();
