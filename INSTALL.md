# Installation & Setup Guide

This guide details the step-by-step process to compile, migrate, seed, and boot the AI Crypto Trading Assistant SaaS locally or inside Docker.

---

## 🛠️ Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** (running locally or via Docker)
- **Docker & Docker Compose** (Optional, for containerized deploy)

---

## ⚙️ Environment Configuration

1. Copy the `.env.example` file and create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
2. Configure your `DATABASE_URL` with your PostgreSQL server connection parameters.
3. Configure `NEXTAUTH_SECRET` with a secure random key.

---

## 💻 Local Setup Instructions

Follow these commands to configure the workspace from scratch:

### 1. Install Project Packages
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Database Migrations
Configure your `.env` connection string, then execute:
```bash
npx prisma migrate dev --name init
```

### 4. Seed Database with Historical Candles & Users
Execute the seeding command to load 500+ historical candles (BTC, ETH, SOL, BNB, XRP) and create default user log profiles:
```bash
npx prisma db seed
```

### 5. Boot Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.

---

## 🐳 Docker Container Deploy Setup

To spin up the entire stack (Next.js Node Web Application + PostgreSQL Database Node) automatically:

```bash
# Compile and boot containers
docker-compose up --build -d
```
The application will run on port `3000` and link directly to the database container inside the private network namespace.

---

## 🔑 Default Login Credentials (Seeded Profiles)

Use the following profiles to log in immediately:

### 🛡️ Admin Account (Cleared for Admin Console & Force Scanners)
- **Email**: `admin@tradingai.com`
- **Password**: `adminpassword`

### 📈 Standard User Account (Cleared for Dashboards & Sandbox)
- **Email**: `user@tradingai.com`
- **Password**: `userpassword`
