# Complete BMS Server Deployment Guide

## Project Structure (Production Ready)
```
bid-management-system/
├── client/                   # React frontend
├── server/                   # Express backend (cleaned)
│   ├── clean-routes.ts      # All API routes consolidated
│   ├── simple-index.ts      # Clean server entry point
│   ├── db.ts               # Database configuration
│   ├── auth.ts             # Authentication utilities
│   └── vite.ts             # Vite integration
├── shared/                   # Shared schemas
├── uploads/                  # File uploads directory
├── logs/                     # Application logs
├── deploy.yml               # GitHub Actions deployment
├── docker-compose.yml       # Docker deployment
├── Dockerfile              # Container configuration
├── nginx.conf              # Reverse proxy config
├── ecosystem.config.js     # PM2 configuration
├── deploy-server.sh        # Server deployment script
└── package.json            # Dependencies and scripts
```

## Deployment Options

### Option 1: Simple Server Deployment (Recommended)

#### 1. Environment Variables (.env)
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/bms_db"
JWT_SECRET="your-256-bit-secret-key-change-in-production"
OPENAI_API_KEY="sk-your-openai-key" # Optional
NODE_ENV="production"
PORT=5000
```

#### 2. Deploy with Script
```bash
chmod +x deploy-server.sh
./deploy-server.sh
```

### Option 2: Docker Deployment

#### 1. Create .env file with your variables
#### 2. Deploy with Docker Compose
```bash
docker-compose up -d
```

### Option 3: Manual PM2 Deployment

#### 1. Install dependencies
```bash
npm ci --production
```

#### 2. Build application
```bash
npm run build
```

#### 3. Setup database
```bash
npm run db:push
```

#### 4. Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Option 4: GitHub Actions Deployment

#### 1. Set repository secrets:
- `SERVER_HOST`: Your server IP/domain
- `SERVER_USER`: SSH username
- `SERVER_SSH_KEY`: Private SSH key
- `SERVER_PORT`: SSH port (usually 22)

#### 2. Push to main branch - automatic deployment via deploy.yml

## Key Features
- ✅ Document Templates with Image Upload
- ✅ Company Settings Management
- ✅ Excel Upload Processing
- ✅ Tender Management
- ✅ User Authentication
- ✅ File Upload and Serving
- ✅ Clean API Structure

## Server Health Check
Visit: `http://your-domain/health`

## Main Issues Resolved
1. ✅ Removed duplicate directories (backend/, frontend/)
2. ✅ Cleaned up scattered server utilities
3. ✅ Fixed image upload functionality
4. ✅ Consolidated API routes
5. ✅ Simple deployment configuration
6. ✅ Working file serving and validation