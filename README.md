# Friends of Education (FOE) - Decoupled ID Card System & Admin Portal

Production full-stack decoupled monorepo architecture for **Friends of Education Charitable Trust (Reg. E-0040751(GBR))** ID card generation, administration, asset management, and print-ready PDF export.

---

## 🏛️ Project Architecture

```
foe/
├── docker-compose.yml          # PostgreSQL 16 local service container
├── docker-compose.prod.yml     # Multi-stage production compose (DB + Backend + Frontend)
├── Dockerfile.backend          # Fastify / Node.js container
├── Dockerfile.frontend         # Next.js standalone container
├── .env                        # Root environment variables
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # BloodGroup, Member (BigInt PK), CardSettings
│   │   └── seed.ts             # Seeds 8 Blood Groups, default CardSettings, and 0001 sample
│   ├── src/
│   │   ├── config/             # Cloudinary & Prisma DB singletons
│   │   ├── routes/             # Fastify REST endpoints under /api
│   │   ├── controllers/        # Request handlers & validation
│   │   ├── services/           # Business logic, sequential ID generation, DB queries
│   │   └── app.ts              # Fastify server, BigInt JSON serializer, CORS, Multipart
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── public/
    │   ├── logo.png            # Official Friends of Education high-res logo
    │   └── signature.svg       # Authorised signature graphic
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx      # Root layout with responsive navigation & toast
    │   │   ├── settings/page.tsx           # Route 1: Asset & card configuration manager
    │   │   ├── members/create/page.tsx     # Route 2: Pixel-perfect member registration form
    │   │   ├── members/page.tsx            # Route 3: Descending member directory with cursor pagination
    │   │   └── members/[id]/preview/page.tsx # Route 4: Live CR80 side-by-side card preview & PDF export
    │   ├── components/
    │   │   ├── Navbar.tsx           # Global branding navigation
    │   │   ├── CardPreviewFront.tsx # Front ID card with curved header, photo, and website footer
    │   │   ├── CardPreviewBack.tsx  # Back ID card with About Us, Validity, Emergency contact
    │   │   ├── PDFExporter.tsx      # High-res client PDF generator (html2canvas + jsPDF)
    │   │   └── Toast.tsx            # Animated notification alert system
    │   └── lib/
    │       ├── api.ts          # Strongly typed client for backend REST API
    │       └── utils.ts        # Date formatting & base64 image proxy conversion
    ├── package.json
    ├── tailwind.config.ts
    └── next.config.ts
```

---

## 🚀 Quickstart & Verification Flow

### Prerequisites
- Node.js 18+ or 20+
- Docker & Docker Compose (or an active PostgreSQL 16 instance)

### Step 1: Start PostgreSQL Database
```bash
docker compose up -d postgres
```
Verify the container status:
```bash
docker ps
```

### Step 2: Initialize & Seed Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
> The Fastify API server will start on **`http://localhost:5000`** with all endpoints registered under `/api`.

### Step 3: Start Next.js Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
> The Next.js Admin Portal will run on **`http://localhost:3000`**.

---

## 🧪 Functional Verification

1. **Card Settings & Assets (`/settings`)**
   - Upload new Organisation Logo and Authorised Signature directly to Cloudinary (folder: `foe`).
   - Configure default values: Trust Name, Subtitle, Registration No., Website URL, and Default Emergency Contact.

2. **Member Registration (`/members/create`)**
   - Auto-generated sequential Member ID is computed from the database (e.g. `0001`, `0002`).
   - Upload passport photo (300 x 400 preview, validated <= 2 MB).
   - Dynamic Blood Group dropdown populated from the master database table.
   - On submission, automatically redirects to the ID card live preview.

3. **Member Directory & Pagination (`/members`)**
   - Displays members in descending order (`ORDER BY id DESC`), latest registrations first.
   - Cursor-based pagination with "Load More Records".
   - Filter tabs: **Active Members** and **Deleted / Archival Records**.
   - Soft-delete marks record with timestamp and admin user; restore action reinstates the record.

4. **Live Card Preview & High-Res PDF Export (`/members/[id]/preview`)**
   - Pixel-perfect CR80 ratio render (Front and Back side-by-side).
   - "Download ID Card (PDF)" generates a clean A4 landscape print-ready PDF.
   - Remote images from Cloudinary are proxied via `/api/proxy-image` to guarantee untainted HTML5 canvas rendering without CORS errors.

---

## 🔒 Security & Performance Features
- **BigInt Serialization**: Fastify's reply serializer converts BigInt database primary keys to strings globally, preventing JSON serialization errors.
- **Image Proxying**: `/api/proxy-image?url=...` prevents cross-origin canvas contamination during high-resolution PDF rendering.
- **Soft Deletion**: Records preserve historical data using `deletedAt` and `deletedBy` fields without hard deletion.
