# 🚀 BMS VPS Deployment Guide

## Overview
This guide provides multiple deployment methods for your BMS application on a VPS, including Docker, PM2, and manual deployment options.

## 📋 Prerequisites

### Server Requirements
- Ubuntu 20.04+ or CentOS 7+ VPS
- 2GB+ RAM, 20GB+ storage
- Node.js 20+, npm, PM2, Docker (optional)
- Nginx for reverse proxy
- PostgreSQL database

### Local Requirements
- SSH access to your VPS
- Git repository with your code
- Environment variables configured

## 🎯 Deployment Methods

### Method 1: Automated Script Deployment (Recommended)

```bash
# Make script executable
chmod +x deploy-vps.sh

# Deploy to your VPS
./deploy-vps.sh your-server-ip ubuntu
```

This script handles:
- Building the application locally
- Transferring files to VPS
- Installing dependencies
- Setting up PM2 and Nginx
- Health checks and rollback on failure

### Method 2: Docker Deployment

```bash
# On your VPS
git clone https://github.com/your-username/bms-app.git
cd bms-app

# Create environment file
cp .env.example .env
# Edit .env with production values

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose logs -f bms-app
```

### Method 3: GitHub Actions Deployment

1. **Set up repository secrets:**
   ```
   VPS_HOST=your.server.ip.address
   VPS_USERNAME=ubuntu
   VPS_SSH_KEY=your-private-ssh-key
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-jwt-secret
   OPENAI_API_KEY=sk-your-openai-key
   ```

2. **Push to main/production branch:**
   ```bash
   git push origin main
   ```

The GitHub Actions workflow will automatically deploy your application.

## ⚙️ Manual Setup Instructions

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE bms_production;
CREATE USER bms_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE bms_production TO bms_user;
\q
```

### 3. Application Deployment

```bash
# Create app directory
sudo mkdir -p /var/www/bms-production
sudo chown $USER:$USER /var/www/bms-production
cd /var/www/bms-production

# Clone repository
git clone https://github.com/your-username/bms-app.git current
cd current

# Install dependencies
npm ci --production

# Build application
npm run build

# Create environment file
cp .env.example .env
# Edit .env with production values
nano .env
```

### 4. Environment Configuration

Edit `/var/www/bms-production/current/.env`:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://bms_user:secure_password_here@localhost:5432/bms_production
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
OPENAI_API_KEY=sk-your-openai-api-key
```

### 5. Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the generated command
```

### 6. Nginx Configuration

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/bms << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
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
    }
    
    # Frontend routes
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/bms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL/HTTPS Setup (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 2 * * 1 /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Check application status
pm2 status

# View logs
pm2 logs bms-app

# Check API health
curl http://localhost:5000/api/health
```

### Updates
```bash
cd /var/www/bms-production/current
git pull origin main
npm ci --production
npm run build
pm2 restart bms-app
```

### Backup Database
```bash
# Create backup
pg_dump -U bms_user -h localhost bms_production > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U bms_user -h localhost bms_production < backup_file.sql
```

## 🔧 Troubleshooting

### Common Issues

**Application not starting:**
```bash
pm2 logs bms-app --lines 50
```

**Database connection issues:**
```bash
sudo -u postgres psql -c "\l"  # List databases
sudo systemctl status postgresql
```

**Nginx issues:**
```bash
sudo nginx -t  # Test configuration
sudo tail -f /var/log/nginx/error.log
```

**Port already in use:**
```bash
sudo lsof -i :5000
sudo netstat -tulpn | grep :5000
```

### Performance Optimization

**PM2 Cluster Mode:**
```bash
# Update ecosystem.config.js instances to 'max'
pm2 restart bms-app
```

**Database Optimization:**
```sql
-- In PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE bms_production;
```

## 📱 Quick Commands Reference

```bash
# Application Management
pm2 start ecosystem.config.js --env production
pm2 restart bms-app
pm2 stop bms-app
pm2 logs bms-app

# System Management
sudo systemctl restart nginx
sudo systemctl status postgresql
sudo systemctl status nginx

# Monitoring
htop                    # System resources
pm2 monit              # PM2 monitoring
curl http://localhost:5000/api/health  # Health check
```

Your BMS application is now ready for production deployment on VPS!