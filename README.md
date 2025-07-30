# Bid Management System (BMS)

A comprehensive, full-stack Bid Management System designed for efficient tender lifecycle management, built with modern technologies and separated frontend/backend architecture.

## 🏗️ Project Architecture

### **Separated Architecture**
- **Frontend**: React.js with TypeScript (Port 3000)
- **Backend**: Node.js with Express.js (Port 5000)  
- **Database**: MySQL with Drizzle ORM
- **API Communication**: RESTful APIs with Axios

### **Key Features**
- ✅ **Complete Tender Lifecycle Management** - From discovery to award
- ✅ **AI-Powered Matching** - Intelligent eligibility scoring based on company criteria
- ✅ **Advanced Excel Integration** - Multi-sheet processing with automatic tender import
- ✅ **Real-time Dashboard** - Comprehensive analytics and pipeline tracking
- ✅ **Role-Based Access Control** - Admin, Finance Manager, Senior Bidder roles
- ✅ **Financial Management** - EMD/PBG tracking, approval workflows
- ✅ **Meeting Coordination** - Scheduling, minutes tracking, team collaboration
- ✅ **Document Management** - File uploads, version control, secure storage
- ✅ **Advanced Filtering** - Multi-parameter search with eligibility indicators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bms-project
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Configure environment variables
   cp .env.example .env
   # Edit .env with your MySQL connection details
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   # From backend directory
   npm run db:push
   ```

5. **Start Development Servers**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   # Server starts on http://localhost:5000
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   # App starts on http://localhost:3000
   ```

## 📊 Database Schema

### Core Tables
- **users** - User management with role-based permissions
- **tenders** - Complete tender information with AI scoring
- **ai_recommendations** - ML-generated insights and suggestions
- **documents** - File attachments and document tracking
- **meetings** - Meeting scheduling and coordination
- **finance_requests** - EMD/PBG management and approvals
- **tender_results** - Award tracking and post-tender analysis
- **company_settings** - Configurable company criteria for AI matching

### Enhanced Features
- **Excel Upload Tracking** - Complete audit trail of imports
- **Advanced Analytics** - Dashboard metrics and pipeline data
- **Checklist Management** - Task tracking and compliance
- **Approval Workflows** - Multi-level approval system
- **Reminder System** - Automated deadline notifications

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination

### Tenders
- `GET /api/tenders` - List tenders with advanced filtering
- `GET /api/tenders/:id` - Get single tender details
- `POST /api/tenders` - Create new tender
- `PUT /api/tenders/:id` - Update tender information
- `DELETE /api/tenders/:id` - Delete tender

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/health` - Server health check

## 🎯 Key Technologies

### Frontend Stack
- **React 18** - Modern component architecture
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Accessible component library
- **Axios** - HTTP client for API communication

### Backend Stack
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database operations
- **MySQL2** - MySQL database connector
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Development Tools
- **tsx** - TypeScript execution for development
- **ESBuild** - Fast bundling for production
- **Drizzle Kit** - Database migrations and schema management

## 📁 Project Structure

```
bms-project/
├── frontend/                 # React.js Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── lib/             # Utilities and API client
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.tsx          # Main application component
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Node.js Backend
│   ├── server/
│   │   ├── routes/          # API route handlers
│   │   ├── db.ts            # Database connection
│   │   └── index.ts         # Server entry point
│   ├── package.json
│   └── drizzle.config.ts
│
├── shared/                  # Shared types and schemas
│   └── schema.ts            # Database schema definitions
│
└── README.md               # This file
```

## 🛠️ Environment Configuration

### Backend (.env)
```env
DATABASE_URL=mysql://username:password@localhost:3306/bms_db
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔄 Data Migration

This project ensures **no local storage dependencies** - all data is persisted in MySQL:

- ✅ **Database-First Approach** - All application data stored in MySQL
- ✅ **Type-Safe Operations** - Drizzle ORM ensures schema consistency
- ✅ **Real-time Sync** - Frontend automatically reflects database changes
- ✅ **Audit Trail** - Complete tracking of all operations
- ✅ **Scalable Architecture** - Ready for production deployment

## 📈 Recent Updates

### Separated Architecture Implementation (January 2025)
- **Complete Frontend/Backend Separation** - Independent React and Node.js applications
- **MySQL Integration** - Converted from PostgreSQL to MySQL with optimized schema
- **RESTful API Design** - Clean, consistent API endpoints with proper error handling
- **Type-Safe Development** - Shared TypeScript schemas between frontend and backend
- **Production-Ready Setup** - Separate package.json files and build configurations

### Enhanced Features
- **Real-time Dashboard** - Live statistics from database
- **Advanced Filtering** - Multi-parameter tender search with pagination
- **Authentication System** - Secure login with role-based access
- **Error Handling** - Comprehensive error management across the stack
- **Development Workflow** - Hot reload for both frontend and backend

## 🚀 Deployment

### Production Build

**Frontend**:
```bash
cd frontend
npm run build
# Builds to frontend/dist/
```

**Backend**:
```bash
cd backend
npm run build
# Builds to backend/dist/
```

### Environment Setup
- Configure production MySQL database
- Set proper CORS origins
- Update API URLs for production domains
- Enable SSL/TLS for secure communication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for efficient tender management**