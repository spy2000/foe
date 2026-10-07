<div align="center">

# 🪪 ID Card Generator & Admin Portal (v1.0)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-4169E1?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

A production-ready, decoupled monorepo application for managing organization members and generating pixel-perfect, dual-sided CR80 ID cards in high-DPI PDF format.

</div>

---

## ✨ Key Features & Flows

### 🎨 Pixel-Perfect ID Card Rendering
*   **Dual-Sided CR80 Compliance:** Strict adherence to physical ID card dimensions (85.6mm × 53.98mm).
*   **High-DPI PDF Export:** Integrated `html2canvas` and `jsPDF` engine with scale multipliers and CSS normalization to prevent layout shifts, ensuring razor-sharp typography and exact vector curves on the printed A5 canvas.
*   **Dynamic Data Binding:** Real-time visual preview of members' photos, credentials, and organizational settings on both the front and back of the card.

### 🏢 Organization Settings Management
*   **Global Brand Control:** Manage trust/organization names, registration numbers, and default signatory details.
*   **Custom Clauses:** Edit Back-Card information (About Us, Validity, Emergency Returns) with live UI updates.

### ☁️ Strict Deferred Media Lifecycle (Cloudinary)
*   **Zero-Waste Uploads:** Images (Logos, Signatures, Member Photos) are staged in local memory via `URL.createObjectURL` and only uploaded to Cloudinary upon final form submission.
*   **Orphan Asset Cleanup:** When an image is replaced or a member is permanently deleted, the backend automatically targets and destroys the old asset in the Cloudinary bucket.

### 👥 Member Directory & Bulk Operations
*   **Stateful Table:** Cursor-based pagination and search filtering.
*   **Soft & Hard Deletes:** Members can be safely archived (soft delete) or permanently erased from the PostgreSQL database.
*   **Bulk Actions:** A floating action bar handles multi-select array operations for rapid administration.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js (App Router), React, Tailwind CSS, Headless UI, Zod |
| **Backend** | Node.js, Fastify / Express, Prisma ORM, Winston Logger |
| **Database** | PostgreSQL (Hosted on NeonDB, Docker for local dev) |
| **Storage** | Cloudinary (Secure URL asset management) |
| **Print Engine**| `html2canvas`, `jsPDF` |

---

## 🏗️ Project Structure (Monorepo)

```text
id-card-portal/
├── frontend/                 # Next.js Application
│   ├── src/app/              # App Router pages (members, settings, preview)
│   ├── src/components/       # Reusable UI (PDFExporter, CardPreview, Modals)
│   └── src/lib/              # API interceptors and utilities
├── backend/                  # Node.js API
│   ├── src/controllers/      # Business logic & Cloudinary purges
│   ├── src/routes/           # Express/Fastify route definitions
│   └── prisma/               # Database schema and seed files
└── docker-compose.yml        # Local PostgreSQL container orchestration
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
*   Node.js (v18+)
*   Yarn or npm
*   Docker Desktop (for local database)
*   Cloudinary Account (for image uploads)

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5433/foe_db?schema=public"
PORT=5000
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
FRONTEND_URL="http://localhost:3000"
```

Create a `.env.local` file in the `frontend/` directory:

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### 3. Spin Up Local Database
From the root directory, start the PostgreSQL container:

```bash
docker-compose up -d
```

### 4. Initialize Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed     # Optional: Seed initial card settings and admin user
npm run dev
```

### 5. Initialize Frontend
Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🌍 Production Deployment

This monorepo is configured for decoupled hosting using Render (Backend) and Vercel (Frontend), tied together by NeonDB (Serverless Postgres).

### Backend (Render)
1.  Connect your repository to Render as a Web Service.
2.  Set the **Root Directory** to `backend`.
3.  **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
4.  **Start Command:** `npm run start` (or `node dist/index.js`)
5.  Add all environment variables, using the NeonDB connection string for `DATABASE_URL`.
6.  *Note:* A `/api/health` keep-alive endpoint is implemented to prevent Render free-tier cold starts.

### Frontend (Vercel)
1.  Import the repository into Vercel.
2.  Set the **Root Directory** to `frontend`.
3.  Vercel will auto-detect Next.js framework settings.
4.  Set `NEXT_PUBLIC_API_URL` to your live Render backend URL (e.g., `https://your-api.onrender.com`). Do not include the trailing `/api` if handled in code.
5.  Deploy.
6.  Once deployed, update the backend's `FRONTEND_URL` environment variable to match your Vercel domain to secure CORS policies.
