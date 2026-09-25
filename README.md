# ☁️ Voxen Cloud Services — Cloud-Based Document Management System

> **Secure. Simple. Anywhere.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639?logo=nginx&logoColor=white)](https://nginx.org/)

**Voxen Cloud Services** is an enterprise-ready, cloud-based Document Management System (DMS) built with **React, Vite, Node.js, Express, PostgreSQL, Docker, and Nginx**. It offers enterprise-grade document upload, role-based access control (RBAC), multi-criteria search, categorization, real-time metrics, inline preview, and cloud storage abstraction supporting both local persistent volumes and AWS S3.

---

## 📸 Screenshots & UI Preview

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Voxen Cloud Services           [ + Quick Upload ]   [ (U) Alex Morgan ] [ Sign Out ]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  Welcome back, Alex Morgan 👋                                                          │
│  Manage, search, and securely access all your organization's documents.                │
│                                                                                        │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │ Total Documents  │ │ Storage Used     │ │ This Month       │ │ Categories       │  │
│  │       48         │ │    14.2 MB       │ │       12         │ │        7         │  │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘  │
│                                                                                        │
│  [ Search documents by name, category, or description...                             ]  │
│                                                                                        │
│  Recent Documents                                                Categories            │
│  ┌─────────────────────────────────────────────────────────────┐ ┌──────────────────┐  │
│  │ Name                   │ Category │ Size    │ Date          │ │ Work         24   │  │
│  │ 📄 Q4_Financial_Plan   │ Finance  │ 2.4 MB  │ Sep 25, 2026  │ │ Academic     10   │  │
│  │ 📑 Technical_Spec.docx │ Projects │ 840 KB  │ Sep 24, 2026  │ │ Finance       8   │  │
│  │ 🖼️ Cloud_Arch.png      │ Work     │ 1.1 MB  │ Sep 22, 2026  │ │ Legal         6   │  │
│  └─────────────────────────────────────────────────────────────┘ └──────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔐 Authentication & Security
* **JWT-Based Authentication**: Secure token verification with token expiration handling and auto-renewal/redirection.
* **bcrypt Password Hashing**: Passwords stored as salted hashes (salt rounds: 10).
* **Role-Based Access Control (RBAC)**: Distinct permissions for `USER` and `ADMIN` roles.
* **Security Middleware**: HTTP protection with `Helmet`, sanitized headers, and rate limiting with `express-rate-limit`.
* **Safe File Handling**: Multer file validation against MIME types and extensions with UUID-based obfuscated file names to prevent directory traversal and collisions.

### 📁 Document Management
* **Multi-Format Support**: Native handling for PDF, Word (DOC, DOCX), Excel (XLS, XLSX), PowerPoint (PPT, PPTX), Plain Text (TXT), Images (PNG, JPG, JPEG), and Archives (ZIP).
* **Upload Interface**: Drag-and-drop file upload with animated dropzone, file size validation (up to 10MB configurable), category selection, and descriptions.
* **Inline Document Preview**: In-browser preview for PDFs, image files, and plain text documents; download fallback for complex office files and archives.
* **Granular Search & Filtering**: Real-time keyword search, category filtering, file-type filtering, and sorting (by name, size, or date).
* **View Modes**: Instant toggle between Grid Cards and Dense Table List view.

### 📊 Real-Time Dashboard & Analytics
* **Workspace Metrics**: Total documents, storage quota utilization with visual progress bar, monthly upload counts, and active categories.
* **Audit Trail**: Real-time activity timeline logging uploads, downloads, views, and deletions.
* **Category Breakdown**: Interactive category distribution charts with storage volume metrics.

### 🛡️ Administrative Console
* **User Management Directory**: Search users, view role status, inspect document counts, and track individual storage usage.
* **Account Controls**: Toggle user status (Activate / Suspend) and safely delete user accounts with cascading cleanup.
* **Self-Protection Guards**: Prevents administrators from accidentally locking or deleting their own accounts.
* **System Telemetry**: Real-time database connection status and server health diagnostics.

### ☁️ Cloud & Infrastructure Ready
* **Multi-Tier Storage Abstraction**: Seamlessly switch between local Docker volumes (`STORAGE_PROVIDER=local`) and AWS S3 (`STORAGE_PROVIDER=s3`).
* **Nginx Reverse Proxy**: Production Nginx configuration routing `/api/*` to the Node.js backend and `/*` to the React client.
* **Persistent Volumes**: Zero data loss across container teardowns and reboots.
* **CI/CD Automation**: GitHub Actions pipeline for linting, testing, Docker image packaging, and SSH VM deployment.

---

## 🏗️ Architecture

```text
                               Client Browser
                                     │
                                     ▼
                          Nginx (Reverse Proxy)
                            Port 80 / Port 443
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
        React SPA Frontend                      Express.js REST API
             (Port 80)                               (Port 5000)
                                                         │
                                        ┌────────────────┴────────────────┐
                                        │                                 │
                                        ▼                                 ▼
                              PostgreSQL 15 Database            Storage Service
                                   (Port 5432)                (Docker Volume / S3)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | Modern SaaS UI, Lucide Icons, React Router DOM, Axios |
| **Backend** | Node.js, Express.js | REST API, JWT, bcryptjs, Multer, Helmet, express-rate-limit |
| **Database** | PostgreSQL 15 | Relational schema, pgcrypto UUIDs, indexes, trigger functions |
| **Storage** | Local Disk / AWS S3 | Abstracted `StorageService` for flexible cloud file persistence |
| **Reverse Proxy** | Nginx Alpine | Gzip compression, client body limits (50MB), SPA rewrite rules |
| **Containerization**| Docker & Docker Compose | Multi-stage builds, non-root users, healthchecks, networks |
| **CI/CD** | GitHub Actions | Test automation, GHCR container push, SSH cloud deploy |

---

## 🚀 Quick Start (Local Docker Compose)

### 1. Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+)
* [Docker Compose](https://docs.docker.com/compose/) (v2+)
* [Git](https://git-scm.com/)

### 2. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/<your-username>/voxen-cloud-services.git
cd voxen-cloud-services

# Copy environment template
cp .env.example .env
```

### 3. Launch with Docker Compose
```bash
docker compose up --build -d
```

This single command starts:
1. **PostgreSQL** on port `5432` with volume `voxen_postgres_data`
2. **Backend API** on port `5000` with volume `voxen_backend_uploads`
3. **Frontend SPA** on internal port `80`
4. **Nginx Reverse Proxy** on port `80`

### 4. Access the Application
Open your browser and navigate to:
👉 **`http://localhost`**

---

## 🔑 Default Credentials

The database automatically seeds default user and admin accounts upon initialization:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@voxen.io` | `AdminPassword123!` | Full System & User Management |
| **Demo User** | `demo@voxen.io` | `DemoPassword123!` | Standard Document Space |

> 💡 **Tip**: The login page features convenient **"Quick Demo Access"** buttons to auto-populate either account.

---

## 📡 REST API Reference

### Health & Monitoring
* `GET /api/health` — Service uptime, database connectivity, and environment status.

### Authentication
* `POST /api/auth/register` — Register a new account (`name`, `email`, `password`, `confirmPassword`).
* `POST /api/auth/login` — Authenticate and receive JWT token (`email`, `password`).
* `GET /api/auth/me` — Retrieve authenticated user profile.
* `PUT /api/auth/profile` — Update display name and/or password.

### Documents
* `GET /api/documents` — List documents with search, category, type, sort, and pagination.
* `POST /api/documents/upload` — Upload document (`multipart/form-data`: `file`, `category`, `description`).
* `GET /api/documents/:id` — Retrieve document metadata.
* `GET /api/documents/:id/download` — Download document stream with proper filename headers.
* `GET /api/documents/:id/preview` — Inline document stream for browser preview.
* `DELETE /api/documents/:id` — Remove document from storage and database.

### Categories & Dashboard
* `GET /api/categories` — Get allowed categories with document count statistics.
* `GET /api/dashboard/stats` — User KPIs, category distribution, and recent activity logs.

### Administration (Requires ADMIN Role)
* `GET /api/admin/users` — Paginated list of users with document counts and storage metrics.
* `GET /api/admin/stats` — System-wide telemetry (total users, total documents, total bytes).
* `PATCH /api/admin/users/:id/status` — Toggle user status (`isActive: true/false`).
* `DELETE /api/admin/users/:id` — Delete user account and associated documents.

---

## 🧪 Testing

Both backend and frontend contain automated unit and integration tests.

### Run All Tests
```bash
npm test
```

### Run Backend Tests (Jest & Supertest)
```bash
npm run test:backend
```

### Run Frontend Tests (Vitest & Testing Library)
```bash
npm run test:frontend
```

---

## ☁️ Production Cloud Deployment

For comprehensive deployment instructions on **AWS EC2 (Ubuntu 22.04/24.04 LTS)**, domain configuration, Let's Encrypt SSL, and GitHub Actions CI/CD, refer to the complete deployment guide:

👉 **[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## 💾 PostgreSQL Backup & Restore

### Backup
```bash
docker compose exec -T postgres pg_dump -U docuser -d docmanager | gzip > voxen_backup.sql.gz
```

### Restore
```bash
gunzip < voxen_backup.sql.gz | docker compose exec -T postgres psql -U docuser -d docmanager
```

---

## 🔒 Security Best Practices Implemented

* ✅ No plain-text passwords stored.
* ✅ Cryptographic UUIDs for primary keys to prevent identifier enumeration.
* ✅ Strict MIME type and extension filtering on file ingestion.
* ✅ Unprivileged non-root user execution inside backend Docker container.
* ✅ Rate limiting enabled on sensitive authentication routes.
* ✅ Production stack trace suppression.
* ✅ Complete volume persistence across container redeployments.

---

## 📄 License

This project is licensed under the MIT License.
