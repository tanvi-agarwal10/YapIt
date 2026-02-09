#!/bin/bash

# YapIt Installation Helper Script

set -e

echo "🚀 YapIt Installation Script"
echo "============================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+"
    exit 1
fi
echo "✓ Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✓ npm $(npm --version) found"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use MongoDB Atlas"
    echo "   https://www.mongodb.com/docs/manual/installation/"
else
    echo "✓ MongoDB found"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Backend
echo "📦 Backend dependencies..."
cd backend
npm install
echo "✓ Backend dependencies installed"
echo ""

# Web
echo "📦 Web client dependencies..."
cd ../web
npm install
echo "✓ Web client dependencies installed"
echo ""

# Mobile (optional)
echo "📱 Mobile client (optional)"
if command -v flutter &> /dev/null; then
    echo "📦 Mobile dependencies..."
    cd ../mobile
    flutter pub get
    echo "✓ Mobile dependencies installed"
else
    echo "⚠️  Flutter not installed. Skip mobile setup or:"
    echo "   https://flutter.dev/docs/get-started/install"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Configure backend:   cp backend/.env.example backend/.env"
echo "   2. Start backend:       cd backend && npm run dev"
echo "   3. Start web:           cd web && npm run dev"
echo "   4. Open http://localhost:3000"
echo ""
echo "🐳 Or use Docker:"
echo "   ./deploy.sh"
echo ""
