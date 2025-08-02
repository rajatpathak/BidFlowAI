#!/bin/bash

# Database Seeding Script for BMS
echo "🌱 BMS Database Seeding Script"
echo "==============================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Please run 'npm install' first."
    exit 1
fi

# Run database push first
echo "📊 Pushing database schema..."
npx drizzle-kit push

if [ $? -eq 0 ]; then
    echo "✅ Database schema updated successfully"
else
    echo "❌ Database schema push failed"
    exit 1
fi

# Run seeding
echo "🌱 Seeding database with default data..."
npx tsx scripts/seed.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database seeding completed successfully!"
    echo ""
    echo "🔑 Default Login Credentials:"
    echo "Admin:   admin / admin123"
    echo "Manager: manager / manager123"
    echo "Bidder:  bidder / bidder123"
    echo "Viewer:  viewer / viewer123"
    echo ""
    echo "🚀 You can now start the application with 'npm run dev'"
else
    echo "❌ Database seeding failed"
    exit 1
fi