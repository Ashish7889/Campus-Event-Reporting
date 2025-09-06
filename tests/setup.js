// Test setup file
process.env.NODE_ENV = 'test';
process.env.DB_FILENAME = ':memory:'; // Use in-memory SQLite for tests
process.env.ADMIN_TOKEN = 'test-admin-token';

// Increase test timeout
jest.setTimeout(30000);
