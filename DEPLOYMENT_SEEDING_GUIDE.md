# Database Seeding Guide for BMS Deployment

## Overview
This guide provides comprehensive instructions for seeding the BMS database with default users, roles, and sample data required for production deployment.

## Quick Setup

### 1. Database Schema Setup
```bash
npx drizzle-kit push
```

### 2. Database Seeding
```bash
npx tsx scripts/seed-simple.ts
```

### 3. Alternative: Complete Setup Script
```bash
chmod +x scripts/run-seed.sh
./scripts/run-seed.sh
```

## Default Credentials Created

After successful seeding, you can login with these credentials:

### Admin User
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@bms.local`
- **Role**: Administrator (full system access)

### Manager User
- **Username**: `manager`
- **Password**: `manager123`
- **Email**: `manager@bms.local`
- **Role**: Manager (tender management and oversight)

### Bidder User
- **Username**: `bidder` 
- **Password**: `bidder123`
- **Email**: `bidder@bms.local`
- **Role**: Bidder (create and submit bids)

## Sample Data Created

The seeding process creates:

1. **Default Users**: Admin, Manager, and Bidder accounts with proper permissions
2. **Sample Tender**: IT Infrastructure Modernization Project worth ₹5 Crore
3. **User Roles**: Proper role assignments for different access levels

## Production Deployment Steps

### For VPS Deployment:

1. **Setup PostgreSQL Database**
   ```bash
   # Install PostgreSQL
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Create database
   sudo -u postgres createdb bms_production
   
   # Create user
   sudo -u postgres createuser --interactive bms_user
   ```

2. **Configure Environment Variables**
   ```bash
   export DATABASE_URL="postgresql://bms_user:password@localhost:5432/bms_production"
   export NODE_ENV=production
   export JWT_SECRET="your-production-jwt-secret"
   export OPENAI_API_KEY="your-openai-api-key"
   ```

3. **Deploy and Seed Database**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd bms-project
   
   # Install dependencies
   npm install
   
   # Setup database schema
   npm run db:push
   
   # Seed database
   npx tsx scripts/seed-simple.ts
   
   # Build and start
   npm run build
   npm start
   ```

### For Replit Deployment:

1. **Setup Environment Variables in Replit**
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NODE_ENV`: `production`

2. **Run Database Setup**
   ```bash
   npx drizzle-kit push
   npx tsx scripts/seed-simple.ts
   ```

3. **Deploy**
   - Change run command to: `node replit-deploy.js`
   - Click Deploy

## Verification

After seeding, verify the setup:

1. **Check Users Created**
   ```sql
   SELECT username, email, name, role FROM users;
   ```

2. **Test Login**
   - Try logging in with admin/admin123
   - Verify dashboard loads correctly

3. **Check Sample Data**
   - Verify sample tender appears in Active Tenders
   - Test document upload functionality
   - Test AI analysis features

## Security Notes

### Important: Change Default Passwords

For production deployment, **immediately change default passwords**:

1. Login as admin
2. Go to User Management
3. Update passwords for all default users
4. Consider disabling unused accounts

### Environment Security

- Use strong, unique JWT secrets
- Secure database connection strings
- Enable SSL/TLS for database connections
- Use environment variables for all secrets

## Troubleshooting

### Common Issues:

1. **"duplicate key value violates unique constraint"**
   - Database already seeded, skip seeding or use `--force` option

2. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL is running
   - Verify user permissions

3. **Permission errors**
   - Ensure proper file permissions: `chmod +x scripts/run-seed.sh`
   - Check database user has CREATE/INSERT permissions

### Reset Database (Development Only)
```bash
# WARNING: This will delete all data
npx drizzle-kit push --force
npx tsx scripts/seed-simple.ts
```

## Support

For deployment issues:
1. Check logs: `pm2 logs` (if using PM2)
2. Verify environment variables are set
3. Test database connectivity
4. Check file permissions and ownership

## Next Steps

After successful seeding:
1. Login with admin credentials
2. Configure company settings
3. Upload company documents
4. Create additional users as needed
5. Import tender data
6. Configure AI analysis settings