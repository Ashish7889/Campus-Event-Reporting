require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'campus_events'}\``);
    console.log(`Database '${process.env.DB_NAME || 'campus_events'}' created or already exists`);

    // Database is ready for use
    console.log(`Database '${process.env.DB_NAME || 'campus_events'}' is ready for use`);

    console.log('✅ MySQL database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up MySQL database:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solutions:');
      console.log('1. Check if your MySQL credentials in .env file are correct');
      console.log('2. Make sure MySQL server is running');
      console.log('3. Update DB_PASSWORD in .env if your MySQL root user has a password');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase();
