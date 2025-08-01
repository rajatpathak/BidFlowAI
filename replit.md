# Bid Management System (BMS)

## Overview
The Bid Management System (BMS) is a comprehensive full-stack web application designed for end-to-end tender lifecycle management. It enables discovery, analysis, bid creation, finance management, meeting coordination, and approval workflows. The system incorporates AI-powered insights for strategic decision-making, aiming to streamline tender processes, enhance efficiency, and improve bid success rates.

## User Preferences
Preferred communication style: Simple, everyday language.
Project Architecture: Separated frontend (React.js) and backend (Node.js) with MySQL database for easier route management.

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
- **Database ORM**: Drizzle ORM (initially with PostgreSQL, later migrated to MySQL as per user preference)
- **File Uploads**: Multer
- **AI Integration**: OpenAI API
- **Authentication**: Database session-based authentication with JWT tokens stored in PostgreSQL, bcrypt password hashing, and role-based access control (Admin, Finance Manager, Senior Bidder)

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