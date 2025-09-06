#!/bin/bash

# Campus Event Reporting System - Startup Script

echo "🚀 Starting Campus Event Reporting System Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16+) and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

# Check if database exists
if [ ! -f database.db ]; then
    echo "🗃️  Setting up database..."
    npm run migrate
    
    if [ $? -ne 0 ]; then
        echo "❌ Database migration failed"
        exit 1
    fi
    
    echo "🌱 Loading sample data..."
    npm run seed
    
    if [ $? -ne 0 ]; then
        echo "❌ Database seeding failed"
        exit 1
    fi
    
    echo "✅ Database setup completed"
else
    echo "ℹ️  Database already exists"
fi

# Run tests to verify everything works
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but continuing..."
else
    echo "✅ All tests passed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "Then visit:"
echo "  Frontend: http://localhost:4000"
echo "  API Health: http://localhost:4000/api/health"
echo ""
echo "Admin token for testing: admin123456"
echo ""
echo "Available commands:"
echo "  npm start     - Start the server"
echo "  npm run dev   - Start with auto-reload"
echo "  npm test      - Run test suite"
echo "  npm run seed  - Reload sample data"
echo "  npm run reset-db - Reset database completely"
