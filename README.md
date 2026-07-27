# GHARMB - Scalable Real Estate Platform

GHARMB is an enterprise-grade MERN-stack Real Estate platform designed with a monorepo architecture. It supports distinct portals for Admin Panel (React) and general users (App APIs, serving Web clients and future React Native mobile apps).

## Repository Architecture

```text
GHARMB/
├── client/      # React Admin Panel Frontend (Vite/React)
├── server/      # Backend API (Node.js + Express)
├── docs/        # Project documentation & design assets
├── README.md
└── .gitignore
```

## Tech Stack & Architecture Highlights

- **MERN Stack**: MongoDB (Atlas), Express.js, React, Node.js.
- **Firebase Authentication**: OTP-based and Google Social login verification.
- **Scalable Architecture**: Controllers, Services, Middlewares, Models, and Validation layers for separation of concerns.
- **Role-Based Access Control (RBAC)**: Support for Buyers, Tenants, Property Owners, Real Estate Agents, Builders, and Admins.
- **JWT Middleware**: Fallback/complementary JWT authorization.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas cluster
- Firebase project credentials

### Setup & Run

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```
2. Configure `.env` in the `server/` directory:
   ```bash
   cp server/.env.example server/.env
   ```
3. Start development servers:
   - To start both backend and frontend: Setup workspaces and run matching scripts.
   - To start backend only:
     ```bash
     npm run server
     ```
