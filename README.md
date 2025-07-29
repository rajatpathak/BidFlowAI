# Bid Management System (BMS) with AI Enhancements

A comprehensive web-based Bid Management System that revolutionizes tender discovery, analysis, and collaboration through intelligent AI-powered insights and Excel-based data processing.

## 🚀 Features

### Core Functionality
- **Tender Management**: Complete lifecycle management from discovery to award
- **AI-Powered Analysis**: Intelligent scoring and recommendations using OpenAI
- **Excel Integration**: Bulk upload and processing of tender data
- **Role-Based Access**: Admin, Finance Manager, and Senior Bidder roles
- **Real-time Dashboard**: Analytics and pipeline tracking
- **Document Management**: File uploads and tender document tracking

### Advanced Features
- **Eligibility Scoring**: AI-based company-tender matching (0-100%)
- **Appentus Analytics**: Specialized tracking for Appentus participation
- **Win/Loss Analysis**: Detailed insights on tender outcomes
- **Financial Tracking**: EMD/PBG management and approval workflows
- **Meeting Coordination**: Schedule and track tender-related meetings

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** components
- **TanStack Query** for state management
- **Wouter** for routing
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **OpenAI API** for AI features
- **Multer** for file uploads

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL database
- OpenAI API key (for AI features)
- Git

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Appentus-Personal/BMS_RP.git
cd BMS_RP
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bms_db

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=5000
NODE_ENV=development
```

### 4. Database Setup
```bash
# Push schema to database
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🌐 VPS Deployment Guide

### Prerequisites for VPS
- Ubuntu 20.04+ or similar Linux distribution
- Minimum 2GB RAM, 2 CPU cores
- Domain name (optional)
- SSL certificate (optional)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install -y nginx
```

### Step 2: PostgreSQL Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE bms_db;
CREATE USER bms_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;
\q
```

### Step 3: Application Setup
```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/Appentus-Personal/BMS_RP.git
cd BMS_RP

# Set permissions
sudo chown -R $USER:$USER /var/www/BMS_RP

# Install dependencies
npm install

# Build the application
npm run build

# Create production .env file
nano .env
```

Add production environment variables:
```env
DATABASE_URL=postgresql://bms_user:your_password@localhost:5432/bms_db
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
PORT=5000
```

### Step 4: Database Migration
```bash
npm run db:push
```

### Step 5: PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'bms-app',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 6: Nginx Configuration
Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/bms
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 100M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/bms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Setup (Optional)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Step 8: Firewall Configuration
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📊 Database Schema

Key tables:
- `users` - User authentication and profiles
- `tenders` - Active tender information
- `enhanced_tender_results` - Tender results with win/loss tracking
- `ai_recommendations` - AI-generated insights
- `company_settings` - Company criteria for matching

## 🔑 Default Login Credentials

### Admin
- Username: `admin`
- Password: `admin123`

### Finance Manager
- Username: `finance`
- Password: `finance123`

### Senior Bidder
- Username: `bidder`
- Password: `bidder123`

**⚠️ Change these credentials in production!**

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tenders
- `GET /api/tenders` - List all tenders
- `POST /api/upload-tenders` - Upload tenders from Excel
- `POST /api/tenders/:id/assign` - Assign tender to user

### Results
- `GET /api/enhanced-tender-results` - Get tender results
- `POST /api/upload-tender-results` - Upload results from Excel

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/pipeline` - Pipeline data

## 🚀 Deployment Checklist

- [ ] Change default passwords
- [ ] Set up proper database backups
- [ ] Configure monitoring (PM2 monitoring or similar)
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Enable SSL certificate
- [ ] Set up domain name
- [ ] Test all features in production
- [ ] Document any custom configurations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team

## 🔄 Updates

To update the application on VPS:
```bash
cd /var/www/BMS_RP
git pull origin main
npm install
npm run build
pm2 restart bms-app
```

---

Built with ❤️ by Appentus Team