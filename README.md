# 💊 DoseTracker AI - Smart Medication & Telehealth Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https.mit-license.org)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-brightgreen.svg)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6.0%2B-47A248.svg)](https://www.mongodb.com)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)](https://deepmind.google/technologies/gemini)

**DoseTracker AI** is an enterprise-grade, full-stack digital healthcare and AI-powered medication management platform. It empowers patients and healthcare providers with automated dose schedules, intelligent medication reminders, prescription OCR document scanning, health event tracking, and direct AI clinical assistance.

---

## 📋 Table of Contents
1. [Project Description](#-project-description)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Folder Structure](#-folder-structure)
6. [Installation & Setup](#-installation--setup)
   - [Prerequisites](#prerequisites)
   - [Environment Setup](#environment-setup)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
7. [API Overview](#-api-overview)
8. [Screenshots & UI Preview](#-screenshots--ui-preview)
9. [Future Scope & Roadmap](#-future-scope--roadmap)
10. [License](#-license)

---

## 📝 Project Description

Managing complex medication regimens, tracking adherence, organizing prescriptions, and consulting with doctors can be fragmented and challenging. **DoseTracker AI** bridges this gap by unifying patient care, clinical notes, document scanning, and automated background reminder engines into an intuitive, responsive web application.

With native **Google Gemini AI integration**, patients can ask questions about medication interactions, upload prescriptions for instant OCR processing, and track overall adherence analytics seamlessly.

---

## ✨ Key Features

### 🩺 Patient & Doctor Portals
- **Multi-Role Authentication**: Role-based access control (RBAC) for Patients, Doctors, and System Administrators.
- **Medication Scheduling & Dose Log**: Live daily timeline to record taken, missed, or snoozed doses.
- **Background Reminder Engine**: Enterprise cron-like scheduler for real-time medication alerts.
- **Prescription & Document Scanning**: Upload prescription PDFs/Images with automated file management and OCR parsing.
- **Family Member Management**: Track medications and care for multiple family dependents under a single primary account.
- **Health Event & Symptom Tracking**: Log side effects, symptoms, and health milestones.
- **AI Clinical Assistant**: Natural language healthcare advisor powered by Google Gemini AI with medical disclaimer guardrails.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + Framer Motion (Animations)
- **Icons & UI**: Lucide React + Recharts (Adherence Data Visualization)
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with JWT Bearer Interceptors

### Backend
- **Runtime**: Node.js (v18+) & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) + Bcrypt password hashing
- **File Uploads**: Multer storage middleware
- **AI Engine**: `@google/genai` (Google Gemini 2.0 / Flash API)

---

## 🏗 System Architecture

```
                               ┌────────────────────────┐
                               │   React + Vite UI      │
                               │   (Port 3000)          │
                               └───────────┬────────────┘
                                           │ Axios HTTP / REST
                                           ▼
                               ┌────────────────────────┐
                               │   Express API Engine   │
                               │   (Port 5000)          │
                               └─────┬────────────┬─────┘
                                     │            │
               ┌─────────────────────┴──┐      ┌──┴─────────────────────┐
               │    MongoDB Database    │      │ Google Gemini AI API   │
               │ (Users, Doses, Meds)   │      │ (Prescription OCR/Hub) │
               └────────────────────────┘      └────────────────────────┘
```

---

## 📂 Folder Structure

```
DoseTracker-AI/
├── frontend/                  # React + Vite + Tailwind Frontend Workspace
│   ├── public/                # Static public assets
│   ├── src/
│   │   ├── components/        # Reusable UI components & Layouts
│   │   ├── context/           # React Context (Auth, Theme, Notifications)
│   │   ├── pages/             # Application Views (Dashboard, Meds, AI Hub)
│   │   └── services/          # API Services & Axios Config
│   ├── package.json
│   └── vite.config.js
├── backend/                   # Node.js + Express REST API Backend
│   ├── config/                # MongoDB Database Connection
│   ├── controllers/           # API Controller Handlers
│   ├── middleware/            # JWT Auth & Upload Middlewares
│   ├── models/                # Mongoose Database Schemas
│   ├── routes/                # Express API Route Handlers
│   ├── services/              # Reminder Engine & Gemini AI Service
│   ├── uploads/               # Document & Prescription File Storage
│   └── server.js              # Server Entrypoint
├── database/                  # Database Schemas & Seed Data
├── docs/                      # Technical Documentation
├── .gitignore                 # Safe & Secure Git Ignore Configuration
├── .env.example               # Root Environment Variables Template
├── package.json               # Root Monorepo Scripts
└── README.md                  # Project Documentation
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI

### Environment Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/RamSingh7248/DoseTracker-AI.git
   cd DoseTracker-AI
   ```

2. Configure Environment Variables:
   Create a `.env` file inside the `backend/` folder based on `.env.example`:
   ```bash
   cp .env.example backend/.env
   ```

   **backend/.env Configuration**:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/dose-tracker
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

### Quick Monorepo Start
Install dependencies for both frontend and backend in one command:
```bash
npm run install:all
```

Start both backend and frontend development servers concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📡 API Overview

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register new user account |
| `/api/auth/login` | `POST` | Public | Authenticate user & receive JWT |
| `/api/auth/me` | `GET` | Private | Fetch authenticated user profile |
| `/api/medications` | `GET/POST` | Private | Manage patient medications |
| `/api/doses` | `GET/POST` | Private | Record medication doses & adherence |
| `/api/prescriptions` | `GET/POST` | Private | Upload and scan prescriptions |
| `/api/ai/chat` | `POST` | Private | Consult Gemini AI Healthcare Assistant |
| `/api/health` | `GET` | Public | API health check & server status |

---

## 🖼 Screenshots & UI Preview

| Dashboard & Dose Tracker | AI Healthcare Hub |
| :---: | :---: |
| *(Add Dashboard Screenshot)* | *(Add AI Hub Screenshot)* |

---

## 🔮 Future Scope & Roadmap

- [ ] **Mobile App (React Native)**: Cross-platform iOS and Android companion app.
- [ ] **Push & SMS Reminders**: Integration with Twilio for direct SMS reminders.
- [ ] **Wearable Sync**: Apple HealthKit & Google Fit integration for automatic vital tracking.
- [ ] **E-Prescription Integration**: Direct integration with pharmacy fulfillment APIs.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/RamSingh7248">Ram Singh</a>
</p>
