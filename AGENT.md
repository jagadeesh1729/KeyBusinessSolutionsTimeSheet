# AGENT.md

## Project Overview

KeyBusinessSolutionsTimeSheet is a full-stack timesheet management application with a Node.js/Express backend and React/TypeScript frontend.

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Sequelize ORM)
- **Authentication**: JWT-based authentication
- **Containerization**: Docker

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API
- **HTTP Client**: Axios

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app configuration
│   │   ├── server.ts           # Server entry point
│   │   ├── config/             # Database and environment configuration
│   │   ├── middleware/         # Auth, logging, rate limiting, security
│   │   ├── models/             # Sequelize models
│   │   ├── routes/             # API route handlers
│   │   ├── services/           # Business logic layer
│   │   └── utils/              # Utility functions
│   ├── sql/                    # SQL migration scripts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main application component
│   │   ├── api/                # API client configuration
│   │   ├── component/
│   │   │   ├── atoms/          # Basic UI components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── layout/         # Layout components
│   │   │   ├── mocules/        # Feature components (molecules)
│   │   │   └── offerletter/    # Offer letter module
│   │   ├── context/            # React Context providers
│   │   ├── theme/              # MUI theme configuration
│   │   └── utils/              # Utility functions
│   └── Dockerfile
├── docker-compose.yaml         # Docker orchestration
└── backup.sql                  # Database backup
```

## Development Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start            # Start production server
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Docker
```bash
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose build           # Rebuild containers
```

## Key Features

- **Timesheet Management**: Create, view, and manage employee timesheets
- **Project Management**: Track projects and assignments
- **Employee Management**: Manage employee profiles and teams
- **Authentication**: Secure login with JWT tokens
- **Dashboard**: Admin and employee dashboards with analytics
- **Expiration Tracking**: Track document and certification expirations
- **Offer Letters**: Generate and manage offer letters
- **Email Integration**: Send notifications and reports

## API Routes

| Route | Description |
|-------|-------------|
| `/api/auth` | Authentication (login, register, password reset) |
| `/api/users` | User management |
| `/api/timesheets` | Timesheet CRUD operations |
| `/api/projects` | Project management |
| `/api/dashboard` | Dashboard analytics |
| `/api/expiration-tracker` | Document expiration tracking |
| `/api/meetings` | Meeting management |
| `/api/offer-letter` | Offer letter generation |

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)

### Frontend
- `VITE_API_URL` - Backend API base URL

## Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint configured for both frontend and backend
- **Naming**: 
  - Components: PascalCase
  - Files: PascalCase for components, camelCase for utilities
  - Variables/Functions: camelCase

## Git Workflow

- Main branch: `main`
- Feature branches: `feature/<feature-name>`
- Current branch: `backend-auth-feature`

## Notes for AI Agents

1. Always run `npm install` after pulling new changes
2. Check for TypeScript errors before committing
3. Follow existing code patterns and conventions
4. Use the existing API client (`apiClient.ts`) for HTTP requests
5. Custom hooks are located in `component/hooks/` for data fetching
6. Use MUI components for consistent UI styling
