#!/bin/bash

# BMS VPS Deployment Script
# Usage: ./deploy-vps.sh [server-ip] [username]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_HOST=${1:-"your-server-ip"}
VPS_USER=${2:-"ubuntu"}
APP_DIR="/var/www/bms-production"
SERVICE_NAME="bms-app"

echo -e "${BLUE}🚀 BMS VPS Deployment Script${NC}"
echo -e "${YELLOW}Target: ${VPS_USER}@${VPS_HOST}${NC}"
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo -e "${RED}❌ SSH key not found. Please set up SSH access first.${NC}"
    exit 1
fi

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${VPS_USER}@${VPS_HOST} 'echo "SSH connection successful"' 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to ${VPS_HOST}. Please check your SSH configuration.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH connection successful${NC}"

# Build locally first
echo -e "${YELLOW}Building application locally...${NC}"
npm run build

# Create deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
tar -czf bms-deployment.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    docker-compose.yml \
    Dockerfile \
    .env.example \
    uploads/ \
    --exclude='uploads/*.tmp'

# Deploy to VPS
echo -e "${YELLOW}Deploying to VPS...${NC}"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

# Configuration
APP_DIR="/var/www/bms-production"
SERVICE_NAME="bms-app"

echo "🚀 Starting deployment on VPS..."

# Create app directory
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

# Stop existing services
echo "⏹️ Stopping existing services..."
pm2 stop $SERVICE_NAME 2>/dev/null || true

# Backup current version
if [ -d "current" ]; then
    echo "📦 Creating backup..."
    rm -rf backup 2>/dev/null || true
    mv current backup
fi

# Create new deployment directory
mkdir -p current
cd current

ENDSSH

# Copy deployment package
echo -e "${YELLOW}Copying files to VPS...${NC}"
scp bms-deployment.tar.gz ${VPS_USER}@${VPS_HOST}:${APP_DIR}/current/

# Continue deployment on VPS
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

APP_DIR="/var/www/bms-production"
SERVICE_NAME="bms-app"

cd $APP_DIR/current

# Extract deployment package
echo "📦 Extracting deployment package..."
tar -xzf bms-deployment.tar.gz
rm bms-deployment.tar.gz

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --production --silent

# Create required directories
mkdir -p logs uploads

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️ Creating environment file..."
    cp .env.example .env
    echo ""
    echo "🔧 Please edit .env file with your production values:"
    echo "   DATABASE_URL, JWT_SECRET, OPENAI_API_KEY"
    echo ""
fi

# Start application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js --env production
pm2 save

# Setup nginx if not exists
if [ ! -f "/etc/nginx/sites-available/bms" ]; then
    echo "🌐 Setting up Nginx..."
    sudo tee /etc/nginx/sites-available/bms > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Static files
    location /uploads/ {
        alias /var/www/bms-production/current/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Frontend routes
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

    sudo ln -sf /etc/nginx/sites-available/bms /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
fi

echo "✅ Deployment completed!"

ENDSSH

# Clean up local files
rm -f bms-deployment.tar.gz

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
sleep 5

if ssh ${VPS_USER}@${VPS_HOST} 'curl -f http://localhost:5000/api/health' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Deployment successful! API is responding.${NC}"
    echo -e "${GREEN}🌐 Your application should be available at: http://${VPS_HOST}${NC}"
else
    echo -e "${RED}❌ Health check failed. Please check the logs:${NC}"
    ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs bms-app --lines 20'
fi

echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo -e "${YELLOW}View logs:${NC} ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs bms-app'"
echo -e "${YELLOW}Restart app:${NC} ssh ${VPS_USER}@${VPS_HOST} 'pm2 restart bms-app'"
echo -e "${YELLOW}Check status:${NC} ssh ${VPS_USER}@${VPS_HOST} 'pm2 status'"