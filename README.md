# 🪪 Friends of Education - ID Card Portal

An enterprise-grade, multi-tenant portal designed to manage members, enforce role-based access controls (RBAC), and generate pixel-perfect CR80 ID cards. Built with a decoupled Next.js frontend and an Express/Prisma backend.

## ✨ Key Features

*   **Pixel-Perfect ID Generation:** Renders ID cards mapped perfectly to standard CR80 physical dimensions (`340px × 536px`) for flawless PDF exports and printing.
*   **Granular RBAC:** Invite-only admin onboarding with granular toggles (`canAddMember`, `canDownloadCard`) and isolated view scopes (`ALL` vs `OWN`).
*   **Secure Authentication:** HttpOnly cookie-based JWT sessions, forced initial password changes, and zero-trust API endpoint guards.
*   **Resilient Infrastructure:** Optimistic UI updates with TanStack React Query, cursor-based infinite scrolling, and asynchronous Brevo email dispatches with explicit timeout handling.
*   **Soft Delete Architecture:** Non-destructive data deletion allowing for account deactivation and seamless restoration.

## 🛠️ Technology Stack

*   **Frontend:** Next.js (App Router), React, Tailwind CSS, TanStack React Query, React Hook Form, Zod.
*   **Backend:** Node.js, Express, Prisma ORM, JSON Web Tokens, bcryptjs.
*   **Database:** PostgreSQL (Designed for NeonDB Serverless environments).
*   **Integrations:** Cloudinary (Media Storage), Brevo (Transactional Email).

## 📋 Prerequisites & Integrations

Before running the project, you must set up the following third-party accounts:

1.  **PostgreSQL Database:** A running Postgres instance. [NeonDB](https://neon.tech) is recommended for serverless deployment.
2.  **Brevo (Sendinblue):** Create an account at [Brevo.com](https://brevo.com).
    *   Navigate to **Senders & IP** to authenticate your sender email and domain.
    *   Generate a **v3 API Key** under SMTP & API.
3.  **Cloudinary:** Create an account at [Cloudinary.com](https://cloudinary.com) for storing profile images and signatures. Extract your Cloud Name, API Key, and API Secret.

## 🚀 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd foe-portal

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Copy the `.env.example` files to `.env` in both the backend and frontend directories and populate them with your keys.

- `backend/.env` requires your Postgres DB URL, Brevo Key, and Cloudinary secrets.
- `frontend/.env.local` requires the backend API URL.

### 3. Database Initialization (Backend)
Push the Prisma schema to your database and seed the initial SuperAdmin account.

```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed -- --target=users
```

### 4. Run the Application
You can run both environments concurrently using the root package (if configured), or run them in separate terminals.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The portal will be available at `http://localhost:3000`. Log in using the seeded SuperAdmin credentials defined in your backend `.env` file.

## 🏗️ System Architecture Highlights
*   **Silent 4xx Error Handling:** The frontend `ApiClient` gracefully handles expected validation errors (like 401s or 403s), transforming them into UI toast notifications rather than fatal React tree crashes.
*   **Strict Deactivation Lockdowns:** Deactivated users have their sessions instantly revoked and are met with a full-screen lockdown interface preventing all API access.
*   **Asynchronous Fire-and-Forget:** Emails and keep-alive health pings are executed off the main thread to ensure sub-100ms API response times.
