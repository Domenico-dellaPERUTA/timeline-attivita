#!/bin/bash

echo "🏗️  Building Next.js app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "📦 Deploying to /Library/WebServer/Activity..."
sudo mkdir -p /Library/WebServer/Activity

echo "📋 Copying files..."
sudo rsync -av --exclude='node_modules' --exclude='.git' ./ /Library/WebServer/Activity/

echo "📥 Installing production dependencies..."
cd /Library/WebServer/Activity
sudo npm install --production

echo "🔄 Restarting service..."
sudo launchctl stop com.activity.next 2>/dev/null || true
sudo launchctl start com.activity.next

echo "✅ Deploy completed!"