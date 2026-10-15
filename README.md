# 🎓 EduAccess AI — Smart Learning Accessibility Platform

> **A full-stack, neurodivergent-friendly learning acceleration platform built with the MERN stack.**
> Empowering students with ADHD, dyslexia, and varied cognitive processing styles through interactive visual knowledge graphs, AI-assisted note simplification, adaptive quizzes, and real-time learning analytics.

---

## 🌟 Executive Overview

**EduAccess AI** transforms dense academic documents, lecture notes, and study materials into personalized, multi-sensory study environments. Engineered from the ground up for **WCAG 2.1 AA accessibility**, it blends cognitive science principles with responsive design to bridge learning gaps for neurodivergent and low-vision learners.

### Key Highlights
- 🧠 **ConceptMap AI (Signature Feature)**: Dynamic, interactive knowledge graphs powered by `@xyflow/react` with custom hierarchical positioning, expandable node inspectors, and accessible keyboard-navigable outline alternatives.
- 📊 **Learning Insights & Remediation (Signature Feature)**: Real data-driven analytics powered by `Recharts`, visualizing score progression curves, topic mastery distribution, weak-topic detection (<50%), and automated note-linked revision recommendations.
- 📝 **Notes Workspace & PDF Extraction**: In-memory PDF text extraction (`pdf-parse`), multi-level AI simplification (Elementary, High School, College, ADHD-Bullet format), and native Web Speech API text-to-speech audio reader.
- ⏱️ **Quiz Studio & Timed Assessments**: Adaptive assessment generator with custom difficulty scaling, countdown timer, instant server-side grading, and deep answer explanations.
- ♿ **Sensory Accessibility System**:
  - **Atkinson Hyperlegible Font** (Braille Institute certified) toggle for enhanced character distinction.
  - **WCAG AAA High-Contrast Mode** with intensified border and text contrast ratios.
  - **Mouse Reading Ruler Guide** with dynamic cursor-tracking highlight band.
  - **4-Step Text Scaling** (`Small`, `Default`, `Large`, `X-Large`) & **3-Step Line Height** controls.
  - **Persistent Dark/Light Palette** with warm ivory (`#faf8f5`), forest green (`#2d6a4f`), and charcoal accents.

---

## 🏗️ Architecture & Tech Stack

```
                                  ┌───────────────────────────┐
                                  │      EduAccess Client     │
                                  │  (React 18 + Vite + Tailwind)
                                  └─────────────┬─────────────┘
                                                │
                                    REST API / JSON / JWT
                                                │
                                  ┌─────────────▼─────────────┐
                                  │      Express.js API       │
                                  │   (Node.js ESM + Zod)     │
                                  └──────┬─────────────┬──────┘
                                         │             │
                               ┌─────────▼──────┐ ┌────▼─────────────┐
                               │ MongoDB Atlas  │ │   AI Services     │
                               │  (Mongoose 8)  │ │ (OpenAI / Groq)   │
                               └────────────────┘ └───────────────────┘
```

### Frontend (`/client`)
- **Core Framework**: React 18 (Pure JavaScript, strictly no TypeScript) with Vite bundler
- **Routing**: React Router v6 (`react-router-dom`) with `ProtectedRoute`, `PublicOnlyRoute`, and `AppLayout`
- **Design System & Styling**: Tailwind CSS with custom theme tokens, typography, and responsive grid layouts
- **Interactive Graphs**: `@xyflow/react` (React Flow v12) with custom nodes, handles, and pan-zoom controls
- **Data Visualization**: `recharts` (ResponsiveContainer, LineChart, BarChart, Tooltip, Legend)
- **Icons & Polish**: `lucide-react`, `clsx`, `tailwind-merge`
- **Accessibility Engine**: React Context API (`AccessibilityContext`, `ThemeContext`, `AuthContext`)

### Backend (`/server`)
- **Runtime**: Node.js (ES Modules, `"type": "module"`)
- **Web Framework**: Express.js 4.x
- **Database**: MongoDB Atlas via Mongoose 8.x with compound indexing
- **Security & Hardening**: `helmet`, `cors`, `express-rate-limit`, `bcryptjs` (salt rounds = 12), `zod` input validation, and XSS sanitization
- **Authentication**: JWT with dual authentication (HttpOnly `SameSite=Strict` cookies with Bearer token fallback)
- **Document Processing**: `multer` memory storage + `pdf-parse`
- **AI Integrations**: `openai` SDK compatible with OpenAI (`gpt-4o-mini`) and Groq (`llama-3.3-70b-versatile`)

---

## 📁 Project Structure

```
restaurant-3d-landing/
├── package.json                 # Root npm workspaces configuration & scripts
├── README.md                    # Platform documentation & guides
├── .gitignore                   # Workspace gitignore rules
│
├── client/                      # Frontend Application (React 18 + Vite)
│   ├── index.html               # HTML entry with Atkinson Hyperlegible font links
│   ├── package.json             # Frontend dependencies & build scripts
│   ├── vite.config.js           # Vite dev server & proxy configuration
│   ├── tailwind.config.js       # Accessible color palette & typography tokens
│   └── src/
│       ├── main.jsx             # React DOM root with multi-context providers
│       ├── App.jsx              # Client routing & authentication guards
│       ├── index.css            # Base styles, high-contrast, & font classes
│       ├── components/
│       │   ├── common/          # AppLayout, Navbar, Footer, ReadingRuler, AlertBanner
│       │   ├── conceptMap/      # ConceptMapCanvas, ConceptNode, AccessibleOutlineView
│       │   ├── dashboard/       # StatCard, RecentActivityList, QuickActionGrid
│       │   ├── insights/        # ScoreChart, TopicMasteryChart, WeakTopicsCard
│       │   ├── notes/           # NoteEditor, PdfUploadModal, AudioReaderControls
│       │   └── quiz/            # QuizCard, QuestionView, QuizResultsView, Timer
│       ├── context/             # AuthContext, ThemeContext, AccessibilityContext
│       ├── pages/               # 14 Full Application Pages (Dashboard, Studio, etc.)
│       └── services/            # Centralized API client & endpoint helpers
│
└── server/                      # Backend REST API (Express + MongoDB)
    ├── package.json             # Server dependencies & test scripts
    ├── vitest.config.js         # Vitest test runner configuration
    ├── .env.example             # Template for server environment variables
    ├── tests/
    │   └── server.test.js       # Comprehensive endpoint & security test suite
    └── src/
        ├── app.js               # Express app configuration & middleware pipeline
        ├── server.js            # Server entrypoint, database connection, & graceful shutdown
        ├── config/              # Environment validator & MongoDB connector
        ├── models/              # User, Document, ConceptMap, Quiz, QuizAttempt
        ├── controllers/         # Auth, Document, ConceptMap, Quiz, QuizAttempt, Insight, AI
        ├── routes/              # Express route definitions
        ├── middleware/          # Auth, validate, upload, rateLimiter, errorHandler, security
        ├── services/            # AI generation service, PDF parser, insights aggregator
        ├── validators/          # Zod schema definitions
        └── utils/               # Token generator, sanitizer, structured logger
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance (`mongodb://localhost:27017/eduaccess`)

### 1. Clone & Install Dependencies
The repository utilizes npm workspaces. You can install all root, client, and server dependencies in one command:
```bash
# Install all dependencies across workspaces
npm run install:all
```

### 2. Configure Environment Variables
Create a `.env` file in the `server/` directory (or copy from `.env.example`):
```bash
# In server/.env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/eduaccess?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
COOKIE_SECRET=your_secure_cookie_signing_secret_here

# AI Provider (OpenAI or Groq)
AI_PROVIDER=openai
AI_API_KEY=your_openai_or_groq_api_key_here
AI_MODEL=gpt-4o-mini
```

### 3. Start Development Servers
Run both backend API (`http://localhost:5000`) and frontend Vite client (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

You can also run client or server independently:
```bash
# Server only
npm run dev:server

# Client only
npm run dev:client
```

---

## 🧪 Testing & Quality Verification

### Run Server Tests
The backend includes a comprehensive suite of automated tests verifying authentication endpoints, security headers, rate limiting, and document CRUD operations:
```bash
npm run test
```

### Build Client for Production
Test the frontend build and Rollup asset pipeline:
```bash
npm run build
```

---

## 🔒 Security & WCAG Accessibility Highlights

1. **Authentication Security**: Passwords hashed with `bcryptjs` (salt rounds: 12). JWTs are issued with configurable expiration and transported via secure, `HttpOnly`, `SameSite=Strict` cookies with fallback to `Authorization: Bearer` headers.
2. **Defensive API Hardening**: Security headers managed via `helmet`, tiered rate limiting (auth, AI, and general endpoints), and payload size limits on PDF file uploads.
3. **Data Isolation**: All MongoDB queries scope records strictly to `userId: req.user._id` to enforce multi-tenant isolation.
4. **Cognitive & Visual Accessibility**:
   - High contrast mode meets WCAG 2.1 AAA contrast ratios.
   - Screen-reader friendly DOM structure with descriptive `aria-label`, `aria-checked`, and `role` tags.
   - Keyboard-navigable alternatives provided for all drag-and-drop / canvas interactions.
   - Atkinson Hyperlegible typography ensures unambiguous character identification for dyslexic readers.

---

## 📄 License
This project is licensed under the MIT License.
