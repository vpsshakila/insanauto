#!/bin/bash

# setup.sh - Auto setup script for Proxmox deployment
# Usage: bash setup.sh

set -e

echo "🚀 InsanAuto - Proxmox Setup Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Please run as root${NC}"
  echo "   sudo bash setup.sh"
  exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "   Installing Docker..."
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found${NC}"
    echo "   Installing Docker Compose..."
    apt-get install -y docker-compose
fi

echo -e "${GREEN}✅ Docker installed${NC}"
docker --version
docker-compose --version
echo ""

# Navigate to project directory
if [ ! -d "/apps/insanauto" ]; then
    echo -e "${RED}❌ Project directory not found: /apps/insanauto${NC}"
    echo "   Please clone the repository first"
    exit 1
fi

cd /apps/insanauto

# Check if git repo
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Not a git repository${NC}"
else
    echo "📥 Pulling latest code..."
    git pull origin main || echo -e "${YELLOW}⚠️  Git pull failed, continuing...${NC}"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/browser-data backend/logs
chmod 755 backend/browser-data backend/logs

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "   Creating from template..."
    
    cat > backend/.env << 'EOF'
# Google Form Configuration
GOOGLE_FORM_URL=https://forms.gle/YOUR_FORM_ID

# Server Configuration
PORT=5000
NODE_ENV=production

# Browser Configuration
HEADLESS=true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Session Configuration
# (Optional)
EOF
    
    echo -e "${GREEN}✅ .env created${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env and set GOOGLE_FORM_URL${NC}"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Check if supervisord.conf exists
if [ ! -f "backend/supervisord.conf" ]; then
    echo "📝 Creating supervisord.conf..."
    
    cat > backend/supervisord.conf << 'EOF'
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
user=root

[program:xvfb]
command=/usr/bin/Xvfb :99 -screen 0 1280x720x24 -ac
autorestart=true
priority=100
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:fluxbox]
command=/usr/bin/fluxbox
environment=DISPLAY=":99"
autorestart=true
priority=200
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:x11vnc]
command=/usr/bin/x11vnc -display :99 -forever -shared -nopw -rfbport 5900
autorestart=true
priority=300
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nodejs]
command=npm start
directory=/app
environment=DISPLAY=":99",NODE_ENV="production"
autorestart=true
priority=400
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF
    
    echo -e "${GREEN}✅ supervisord.conf created${NC}"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || echo "No containers to stop"

# Build containers
echo ""
echo "🏗️  Building containers (this may take a few minutes)..."
docker-compose build --no-cache

# Start containers
echo ""
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Check status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔐 Login to Google (First time only):"
echo "   - Connect VNC to: ${SERVER_IP}:5900"
echo "   - Run: docker-compose exec backend node scripts/login.js"
echo "   - Login in VNC browser"
echo "   - Press Ctrl+C when done"
echo ""
echo "2. ✅ Verify Setup:"
echo "   docker-compose exec backend bash scripts/check-session.sh"
echo ""
echo "3. 🧪 Test Submission:"
echo "   docker-compose exec backend node test-submit.js"
echo ""
echo "4. 🌐 Access Services:"
echo "   - API: http://${SERVER_IP}:5000"
echo "   - Frontend: http://${SERVER_IP}:5174"
echo "   - VNC: ${SERVER_IP}:5900"
echo ""
echo "📚 View Logs:"
echo "   docker-compose logs -f backend"
echo ""
echo "🔄 Restart Services:"
echo "   docker-compose restart"
echo ""
echo "=================================="