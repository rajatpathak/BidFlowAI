# Server Setup Instructions

## Prerequisites
- Ubuntu 20.04+ or CentOS 7+
- Node.js 20+
- PostgreSQL 13+
- Nginx (optional, for reverse proxy)
- PM2 (for process management)

## 1. Server Preparation

### Update system
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install PM2 globally
```bash
sudo npm install -g pm2
```

### Install Nginx (optional)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 2. Database Setup

### Create database and user
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE bms_db;
CREATE USER bms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;
\q
```

## 3. Application Deployment

### Clone repository
```bash
cd /var/www
sudo git clone https://github.com/your-username/bms-app.git
cd bms-app
sudo chown -R $USER:$USER /var/www/bms-app
```

### Set environment variables
```bash
cp .env.example .env
nano .env
```
Update with your actual values.

### Deploy application
```bash
chmod +x deploy-server.sh
./deploy-server.sh
```

## 4. Nginx Configuration (Optional)

### Create Nginx config
```bash
sudo nano /etc/nginx/sites-available/bms-app
```

Copy the content from `nginx.conf` and update server_name.

### Enable site
```bash
sudo ln -s /etc/nginx/sites-available/bms-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. SSL Certificate (Optional)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Generate certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## 6. Firewall Setup

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw enable
```

## 7. Monitoring

### Check application status
```bash
pm2 status
pm2 logs bms-app
```

### Check Nginx status
```bash
sudo systemctl status nginx
```

### Health check
```bash
curl http://localhost:5000/health
```

## Troubleshooting

### Application won't start
1. Check PM2 logs: `pm2 logs bms-app`
2. Verify environment variables: `cat .env`
3. Check database connection: `npm run db:push`

### Database connection issues
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Test connection: `psql -h localhost -U bms_user -d bms_db`
3. Check DATABASE_URL format

### File upload issues
1. Ensure uploads directory exists and is writable
2. Check disk space: `df -h`
3. Verify file permissions: `ls -la uploads/`