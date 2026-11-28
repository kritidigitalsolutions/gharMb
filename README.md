# 🏠 GharMB — Real Estate Platform

GharMB is a real estate management system with a **React Admin Panel** and a **Node.js/Express Backend API** that powers the admin dashboard and consumer mobile app.

---

## 📁 Project Structure

```text
gharMb/
├── client/     # Frontend Admin Panel (React + Vite + Tailwind CSS)
├── server/     # Backend REST API (Node.js + Express + MongoDB)
├── webpage/    # Public landing webpage
└── scripts/    # Helper scripts
```

---

## ✨ Main Features

- **Property Approvals:** Verify, audit, and approve property listings.
- **Builder Management:** Document verification, 2-step screen visibility toggle (`Screen: ON/OFF`), and priority ranking (`#1`, `#2` auto-shift).
- **Revenue & Escrow:** Track token bookings and escrow payments (Held, Settled, Refunded).
- **Push Broadcasts:** Send announcements to specific user roles (Agents, Builders, Buyers, or Everyone).
- **Content Management (CMS):** Manage blogs/insights, client reviews, FAQs, and legal policies.
- **Mobile Responsive:** Admin panel is fully optimized for mobile, tablet, and desktop screens.

---

## 🚀 Quick Start (How to Run)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (running locally or a MongoDB Atlas URI)

### 2. Install Dependencies
Open terminal in the project root:

```bash
# Install root, server, and client dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### 3. Environment Setup (`.env`)

#### Server (`server/.env`)
Create a `.env` file inside the `server` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@gharmb.com
```

#### Client (`client/.env`)
Create a `.env` file inside the `client` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start Development Servers
Run this single command from the project root:

```bash
npm run dev
```

This will run both backend and frontend together:
- **Admin Panel:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 🛠️ Common Commands

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Runs both server and client together |
| `npm run dev:server` | Runs only backend server (`http://localhost:5000`) |
| `npm run dev:client` | Runs only admin panel (`http://localhost:5173`) |
| `npm run build:client` | Creates production build for client |

---

## 👥 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Firebase Admin
