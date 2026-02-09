#!/bin/bash

# YapIt Deployment Script

echo "🚀 Deploying YapIt Platform..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo "✓ Docker found"

# Build and start services
echo "🔨 Building services..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ YapIt Platform is running!"
echo ""
echo "📍 Web Client:  http://localhost:3000"
echo "📍 Backend API: http://localhost:5000"
echo "📍 MongoDB:     localhost:27017"
echo ""
echo "📝 Default MongoDB credentials:"
echo "   Username: admin"
echo "   Password: password"
echo ""
echo "🛑 To stop services, run: docker-compose down"
echo ""
