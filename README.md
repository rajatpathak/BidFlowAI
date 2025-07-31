# Bid Management System (BMS)

A comprehensive tender management web application featuring intelligent AI-powered tender analysis, automated Excel processing, role-based authentication, and complete tender lifecycle management from discovery through award.

## 🚀 Features

### Core Functionality
- **Tender Management**: Complete CRUD operations for tender lifecycle management
- **AI-Powered Analysis**: OpenAI GPT-4 integration for intelligent tender matching and recommendations
- **Excel Processing**: Multi-sheet Excel upload with automated tender import and duplicate detection
- **Role-Based Authentication**: JWT-based authentication with Admin, Finance Manager, and Senior Bidder roles
- **Activity Logging**: Comprehensive audit trail with detailed timestamps and user tracking
- **Document Upload**: File attachment system with metadata persistence

### Advanced Features
- **Smart AI Matching**: Intelligent eligibility scoring based on company criteria vs tender requirements
- **Not Relevant Workflow**: Admin approval system for marking tenders as not relevant
- **Assignment System**: Tender assignment to bidders with priority setting and budget allocation
- **Missed Opportunities**: Automated identification and management of expired tenders
- **Corrigendum Detection**: Automatic detection and highlighting of tender updates
- **GeM/Non-GeM Classification**: Separate handling for government and non-government tenders

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: OpenAI GPT-4 API
- **File Processing**: Multer + XLSX for Excel handling

### Project Structure
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React context providers
│   │   └── lib/           # Utility functions
├── server/                # Express backend application
│   ├── services/          # Business logic services
│   ├── routes.ts          # API route definitions
│   ├── auth.ts           # Authentication middleware
│   └── db.ts             # Database configuration
├── shared/               # Shared TypeScript schemas
└── uploads/              # File upload storage
```

## 🚀 VPS Deployment via GitHub Actions

### Prerequisites
- VPS server with Ubuntu/Debian
- Node.js 18+ installed
- PostgreSQL database
- PM2 process manager
- Nginx (optional, for reverse proxy)

### Environment Variables
Set the following environment variables on your VPS:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/bms_production

# Authentication
JWT_SECRET=your-secure-jwt-secret-key

# AI Integration
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
NODE_ENV=production
PORT=3000
```

### GitHub Actions Setup

#### 1. Repository Secrets
Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```
VPS_HOST=your-vps-ip-address
VPS_USERNAME=your-ssh-username
VPS_SSH_KEY=your-private-ssh-key
DATABASE_URL=your-production-database-url
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key
```

#### 2. Deployment Workflow
The repository includes a GitHub Actions workflow (`.github/workflows/deployment-fix.yml`) that automatically:

- Triggers on push to `production` branch
- Connects to VPS via SSH
- Stops existing processes
- Pulls latest code
- Installs dependencies
- Builds the application
- Starts the server with PM2
- Runs health checks
- Sends Teams notifications

#### 3. Manual Deployment Steps
If you need to deploy manually:

```bash
# 1. Clone repository on VPS
git clone https://github.com/your-username/bms-project.git
cd bms-project

# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your production values

# 5. Database setup
npm run db:push

# 6. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### VPS Server Configuration

#### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git
```

#### 2. Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE bms_production;
CREATE USER bms_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE bms_production TO bms_user;
\q
```

#### 3. PM2 Configuration
The project includes `ecosystem.config.js` for PM2:

```javascript
module.exports = {
  apps: [{
    name: 'bms-production',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

#### 4. Nginx Configuration (Optional)
For reverse proxy setup:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
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
```

### Deployment Process

#### Automatic Deployment
1. Push changes to `production` branch
2. GitHub Actions automatically deploys to VPS
3. Health checks verify deployment
4. Teams notification confirms success/failure

#### Manual Deployment
```bash
# On VPS
cd /path/to/bms-project
git pull origin production
npm install
npm run build
pm2 restart bms-production
```

### Monitoring and Logs

#### PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs bms-production

# Monitor resources
pm2 monit

# Restart application
pm2 restart bms-production

# Stop application
pm2 stop bms-production
```

#### Health Check
The application includes health check endpoints:
- `GET /api/health` - Basic health status
- `GET /api/dashboard/stats` - Application statistics

### Security Considerations

1. **Environment Variables**: Store sensitive data in environment variables, never in code
2. **Database Security**: Use strong passwords and limit database access
3. **SSH Security**: Use key-based authentication, disable password login
4. **Firewall**: Configure UFW to only allow necessary ports
5. **SSL/TLS**: Use Let's Encrypt for HTTPS certificates
6. **Regular Updates**: Keep system and dependencies updated

### Troubleshooting

#### Common Issues
1. **Port Already in Use**: Check if another process is using port 3000
2. **Database Connection**: Verify DATABASE_URL and PostgreSQL service status
3. **Permission Issues**: Ensure proper file permissions for uploads directory
4. **Memory Issues**: Monitor PM2 memory usage and restart if needed

#### Debug Commands
```bash
# Check application logs
pm2 logs bms-production --lines 100

# Check system resources
htop
df -h

# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

## 🔧 Development

### Local Setup
```bash
# Clone repository
git clone https://github.com/your-username/bms-project.git
cd bms-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local values

# Start development server
npm run dev
```

### Demo Credentials
- **Admin**: `admin` / `admin123`
- **Senior Bidder**: `senior_bidder` / `bidder123`
- **Finance Manager**: `finance_manager` / `finance123`

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - User logout

### Tender Management
- `GET /api/tenders` - List tenders with filtering
- `GET /api/tenders/:id` - Get single tender
- `POST /api/tenders` - Create tender
- `PUT /api/tenders/:id` - Update tender
- `DELETE /api/tenders/:id` - Delete tender

### Excel Upload
- `POST /api/upload-tenders` - Upload active tenders Excel
- `POST /api/tender-results-imports` - Upload tender results Excel
- `GET /api/tender-imports` - Get import history

### AI Features
- `POST /api/ai/generate-recommendations` - Generate AI recommendations
- `GET /api/ai/market-intelligence` - Get market analysis
- `POST /api/ai/generate-bid` - AI-powered bid generation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the GitHub repository.