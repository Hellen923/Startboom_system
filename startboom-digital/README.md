# HoneyPot CRM

Enterprise Multi-Tenant Customer Relationship Management System

---

## Overview

HoneyPot CRM is a comprehensive, full-stack CRM platform built for investment firms, sales organizations, and service companies. The system features complete multi-tenancy, role-based access control, client portal functionality, real-time messaging, and advanced analytics.

**Status:** Production-ready and deployed

**Domain:** https://coremintcrm.com (in deployment)

---

## Technology Stack

### Frontend
- React 18
- Tailwind CSS for styling
- React Router v6 for navigation
- Axios for API communication
- Context API for state management
- Recharts for data visualization
- Deployed on Vercel (auto-deploy from main branch)

### Backend
- Node.js 18+ with Express.js
- MongoDB Atlas (cloud database)
- JWT authentication
- bcrypt for password hashing
- Brevo API for transactional emails
- Rate limiting and security middleware
- Deployed on Render (auto-deploy from main branch)

---

## Core Features

### CRM Functionality
- Multi-tenant architecture with complete data isolation
- Role-based access: SuperAdmin, Admin, Manager, Agent, Client
- Client and lead management with 360-degree customer view
- Sales pipeline with multiple view modes (Kanban, Table, Charts)
- Contact management for people and organizations
- Deal tracking with weighted revenue forecasting
- Task and calendar management
- Transaction recording and receipt generation

### Enterprise Features
- Organizational structure: Branches, Departments, Teams
- Custom pipeline configuration per tenant
- Custom fields for industry-specific data
- Goals and performance targets (individual, team, company)
- Performance leaderboard with gamification
- Workflow automation for repetitive tasks
- Revenue forecasting with confidence scoring
- Business intelligence alerts
- Advanced reporting with export capabilities

### Communication
- Real-time internal messaging system
- Direct messages and group channels
- Department and branch-level broadcasts
- Notification system with unread tracking

### Client Portal
- Secure external access for clients
- Investment overview dashboard
- Deal history and document access
- Self-service reporting
- Branded experience with dark mode support

---

## Project Structure

```
startboom-digital/
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components (admin, agent, client, superadmin)
│   │   ├── services/           # API service layer (api.js, enterpriseApi.js)
│   │   ├── context/            # React Context providers (Auth, Theme, Modules)
│   │   ├── utils/              # Helper functions and utilities
│   │   └── App.js              # Main application router
│   ├── .env                    # Development environment variables
│   ├── .env.production         # Production environment variables
│   └── package.json            # Frontend dependencies
│
├── backend/
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API endpoint definitions
│   ├── middleware/             # Authentication, rate limiting, error handling
│   ├── services/               # Business logic (email, metrics, aggregation)
│   ├── jobs/                   # Scheduled background tasks
│   ├── config/                 # Configuration files
│   ├── .env                    # Backend environment variables (NEVER COMMIT)
│   ├── .env.example            # Template for .env setup
│   ├── server.js               # Application entry point
│   └── package.json            # Backend dependencies
│
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- MongoDB Atlas account (free tier available)
- Brevo account for email service (free tier available)
- Git for version control

### Local Development Setup

#### 1. Clone and Install

```bash
git clone <repository-url>
cd startboom-digital
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with these variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Authentication
JWT_SECRET=your-secret-key-min-32-characters

# Server
PORT=5000
NODE_ENV=development

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM=verified-sender@yourdomain.com
EMAIL_FROM=verified-sender@yourdomain.com

# Application URLs
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Image Uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important:** The `.env` file is gitignored for security. Never commit it to version control.

Start the backend server:

```bash
npm start
```

Backend runs at: http://localhost:5000

#### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=HoneyPot CRM
```

Start the frontend development server:

```bash
npm start
```

Frontend runs at: http://localhost:3000

---

## Environment Variables Explained

### Backend (.env)

**Purpose:** Configures the Node.js/Express server, database connection, and external services.

**Location:** `backend/.env` (gitignored, never committed)

**Key Variables:**
- `MONGODB_URI`: Connection string to MongoDB database
- `JWT_SECRET`: Secret key for generating authentication tokens (must be long and random)
- `PORT`: Port number for the backend server (default: 5000)
- `NODE_ENV`: Environment mode (development or production)
- `BREVO_API_KEY`: API key from Brevo for sending emails
- `BREVO_FROM`: Verified sender email address in your Brevo account
- `FRONTEND_URL`: URL of the frontend application (for CORS and redirects)
- `CORS_ORIGINS`: Comma-separated list of allowed frontend URLs

**Security Note:** The `.env` file contains sensitive credentials. It is automatically ignored by git. Use `.env.example` as a template.

### Frontend (.env.production)

**Purpose:** Tells the React frontend where the backend API is located in production.

**Location:** `frontend/.env.production` (gitignored, never committed)

**Key Variables:**
- `REACT_APP_API_URL`: Full URL to your deployed backend API (e.g., https://your-api.onrender.com/api)
- `REACT_APP_NAME`: Display name shown in the application header

**Development vs Production:**
- During local development, use `.env` with `http://localhost:5000/api`
- For production builds, use `.env.production` with your actual API URL
- React will automatically use the correct file based on build command

---

## Deployment

### Current Production Setup

**Frontend (Vercel):**
- URL: https://honeypot-crm.vercel.app
- Auto-deploy: Pushes to `main` branch automatically trigger deployment
- Build command: `npm run build`
- Output directory: `build`

**Backend (Render):**
- URL: https://honeypot-crm-api.onrender.com
- Auto-deploy: Pushes to `main` branch automatically trigger deployment
- Start command: `npm start`
- Health check: `/api/health`

**Database:**
- MongoDB Atlas (cloud-hosted)
- Automatic backups enabled
- Connection pooling configured

### Production Environment Variables

**On Render (Backend):**
Set these in the Render dashboard under Environment Variables:
```
MONGODB_URI=<your-atlas-connection-string>
JWT_SECRET=<secure-random-string>
PORT=5000
NODE_ENV=production
BREVO_API_KEY=<your-brevo-key>
BREVO_FROM=<verified-email>
EMAIL_FROM=<verified-email>
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

**On Vercel (Frontend):**
Set these in the Vercel project settings:
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_NAME=HoneyPot CRM
```

---

## User Roles and Access

### SuperAdmin
- Platform-level access
- Create and manage tenant organizations
- View all tenants and their data
- Platform analytics and monitoring

### Admin / Manager
- Organization-level access
- Create and manage users within their tenant
- Configure departments, branches, pipelines
- Access all reports and analytics
- Enable client portal access

### Agent
- Individual contributor access
- Manage assigned clients, leads, and deals
- Create tasks and schedule meetings
- View personal performance metrics
- Access messaging system

### Client
- External portal access only
- View their own investment data
- Access documents and reports
- Contact account manager (planned)

---

## Key Database Collections

- `users` - System users with authentication and role data
- `tenants` - Organization accounts with branding and configuration
- `clients` - Customer records with engagement tracking
- `leads` - Sales prospects in qualification phase
- `deals` - Sales opportunities in pipeline stages
- `contacts` - People and organization directory
- `sales` - Completed transactions with receipts
- `tasks` - To-do items and follow-up reminders
- `meetings` - Calendar events and scheduling
- `conversations` - Messaging threads
- `messages` - Individual chat messages
- `departments` - Organizational units with module permissions
- `branches` - Office locations with hierarchy
- `pipelines` - Custom sales stage definitions
- `customfields` - Dynamic field configurations
- `goals` - Performance targets and progress tracking
- `forecasts` - Revenue predictions
- `auditlogs` - Compliance and activity tracking

---

## Security Features

- JWT-based authentication with token expiration
- Password hashing using bcrypt (10 salt rounds)
- Rate limiting (5 login attempts per 15 minutes per IP)
- CORS configuration with whitelist
- Helmet.js for HTTP security headers
- MongoDB injection prevention
- Tenant data isolation (automatic filtering)
- Comprehensive audit logging
- Role-based access control (RBAC)

---

## Testing

### Current Testing Approach
The system is currently tested manually through comprehensive user workflows. All critical paths are verified before deployment.

### Manual Testing Checklist
- SuperAdmin tenant creation and management
- Admin user creation and role assignment
- Agent client/lead/deal workflows
- Client portal login and dashboard
- Messaging system functionality
- Pipeline drag-and-drop operations
- Report generation and export
- Email notification delivery
- Dark mode toggle
- Responsive design on mobile devices

### Planned Automated Testing
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows

---

## Common Development Tasks

### Creating a New Super Admin User

```bash
cd backend
node create-super-admin.js
```

### Creating a Test Client with Portal Access

```bash
cd backend
node create-demo-portal-client.js
```

### Building Frontend for Production

```bash
cd frontend
npm run build
```

The optimized build will be in the `frontend/build` directory.

### Checking Backend Health

```bash
curl http://localhost:5000/api/health
```

---

## Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Verify all required environment variables are set
- Check port 5000 is not already in use
- Review terminal logs for specific error messages

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` in `.env` points to correct backend URL
- Check backend is running and accessible
- Verify CORS_ORIGINS in backend includes your frontend URL
- Check browser console for network errors

### Email notifications not sending
- Verify `BREVO_API_KEY` is correct
- Confirm `BREVO_FROM` email is verified in your Brevo account
- Check Brevo dashboard for API usage and errors
- Review backend logs for email service errors

### Database connection errors
- Check MongoDB Atlas IP whitelist (allow access from your IP)
- Verify connection string includes correct username/password
- Ensure database user has read/write permissions
- Check MongoDB Atlas cluster status

---

## Project Standards

### Code Organization
- Follow existing file structure and naming conventions
- Keep components small and focused (single responsibility)
- Use descriptive variable and function names
- Separate business logic from presentation

### Git Workflow
- Create feature branches: `feature/your-feature-name`
- Write clear commit messages describing changes
- Test changes locally before pushing
- Never commit `.env` files or sensitive credentials

### API Design
- RESTful endpoints with consistent naming
- Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Error responses include descriptive messages
- All endpoints require authentication except login/register

---

## Known Limitations

- Rate limiting is IP-based only (needs per-user limits for shared networks)
- No automated test coverage (manual testing only)
- File uploads stored in Cloudinary (could migrate to S3 for larger scale)
- Some API endpoints need additional input validation
- Real-time messaging uses polling (WebSocket implementation planned)

---

## License

Proprietary - All Rights Reserved

This software is confidential and proprietary. Unauthorized copying, distribution, modification, or use is strictly prohibited without explicit written permission.

---

## Support and Contact

For technical questions or issues, contact the development team
.

**Technical Lead:** [Your Name/Email]

---

Last Updated: June 06, 2026
