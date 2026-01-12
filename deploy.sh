#!/bin/bash

# 1. Stop and Cleanup Old Containers
echo "🧹 Cleaning up old containers..."
sudo docker rm -f bot-detect_redis bot-detect_backend bot-detect_dashboard 2>/dev/null
sudo docker network rm athena-net 2>/dev/null

# 2. Create Network
echo "🌐 Creating network..."
sudo docker network create athena-net

# 3. Start Redis
echo "🔴 Starting Redis..."
sudo docker run -d --name bot-detect_redis \
  --network athena-net \
  -p 6379:6379 \
  redis:alpine

# 4. Build and Start Backend
echo "🐍 Building and Starting Backend..."
sudo docker build -t athena-backend ./backend
sudo docker run -d --name bot-detect_backend \
  --network athena-net \
  -p 8000:8000 \
  -e REDIS_URL=redis://bot-detect_redis:6379/0 \
  athena-backend

# 5. Build and Start Dashboard
echo "⚛️ Building and Starting Dashboard (This may take a minute)..."
sudo docker build -t athena-dashboard ./dashboard
sudo docker run -d --name bot-detect_dashboard \
  --network athena-net \
  -p 80:80 \
  athena-dashboard

echo "✅ Deployment Complete!"
echo "👉 Dashboard: http://localhost"
