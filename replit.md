# Bid Management System (BMS)

## Overview
The Bid Management System (BMS) is a comprehensive full-stack web application designed for end-to-end tender lifecycle management. It enables discovery, analysis, bid creation, finance management, meeting coordination, and approval workflows. The system incorporates AI-powered insights for strategic decision-making, aiming to streamline tender processes, enhance efficiency, and improve bid success rates.

## User Preferences
Preferred communication style: Simple, everyday language.
Project Architecture: Clean, simple, and scalable structure with consolidated codebase for easier deployment and maintenance.

## Recent Changes (August 1, 2025)
- **Project Restructure**: Cleaned up project structure by removing duplicate directories and unused files
- **Simplified Architecture**: Created consolidated route handlers and removed complex scattered server files
- **Clean Image Upload**: Fixed image upload functionality with proper multer configuration and file serving
- **Deployment Ready**: Streamlined codebase for easier server deployment and maintenance
- **Complete Deployment Suite**: Added comprehensive deployment configurations including Docker, PM2, GitHub Actions, and manual server setup
- **Production Security**: Enhanced server configuration with security headers, CORS, and graceful shutdown handling
- **Bid Document Management**: Added comprehensive bid document management system as sub-tab in tender view with create, edit, delete, and workflow capabilities
- **Admin Document Management**: Enhanced admin settings with comprehensive bid document oversight including workflow management, document statistics, and approval controls
- **Centralized Document Library**: Added folder-based document organization system in admin interface for company documents accessible by bidders and AI systems

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Uploads**: Multer with local storage
- **AI Integration**: OpenAI API
- **Authentication**: Simple JWT-based authentication for demo purposes
- **Architecture**: Clean modular route structure for easy maintenance and deployment

### Data Storage
- **Primary Database**: PostgreSQL (via Neon serverless for production), with a user preference to migrate to MySQL.
- **ORM**: Drizzle
- **Session Storage**: PostgreSQL with connect-pg-simple
- **File Storage**: Local filesystem (`uploads/` directory)

### Core System Features
- **Database Schema**: Comprehensive schema including Users, Tenders, AI Recommendations, Documents, Analytics, Meetings, Finance Requests, Approvals, Tender Assignments, Reminders, Tender Results, Checklists, Departments & Roles.
- **AI Services**: Tender analysis, bid optimization, pricing intelligence, and risk assessment using OpenAI.
- **Workflow Management**: Multi-level approval workflows for finance requests and 'not relevant' tender submissions.
- **Data Import**: Robust Excel upload functionality with multi-sheet support, smart column mapping, duplicate detection, and progress tracking.
- **Activity Logging**: Detailed audit trail for all tender modifications, assignments, and workflow actions with username display.
- **Missed Opportunities**: Intelligent system for tracking and managing expired tenders.
- **User Management**: Dynamic user role management and permission-based access control.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection (production).
- **drizzle-orm**: ORM for database interactions.
- **@tanstack/react-query**: Frontend server state management.
- **@radix-ui/***: Accessible UI component primitives.
- **openai**: Official OpenAI API client.
- **xlsx**: Library for Excel file parsing and data extraction.