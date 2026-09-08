# FieldFix

FieldFix is an end-to-end field service management solution featuring Customer & Technician Mobile Applications, an Admin Web Dashboard, a Real-Time Backend Engine, and modern cloud integrations.

---

## 🛠️ Technology Stack & Architecture

### 📱 Mobile Apps (Customer + Technician)

| Tech | Used For |
| :--- | :--- |
| **React Native** | Cross-platform mobile framework (Android + iOS from one codebase) |
| **TypeScript** | Type safety across the app |
| **React Navigation** | Screen routing/navigation |
| **Zustand / Redux Toolkit** | State management (booking state, user session, live tracking data) |
| **react-native-maps** | Interactive map, technician markers, live location display |
| **Socket.IO client** | Real-time updates: live GPS, chat, job status changes |
| **Expo (or bare RN + EAS)** | Build tooling, camera access, push notification setup, easier device testing |

---

### 💻 Admin Dashboard

| Tech | Used For |
| :--- | :--- |
| **React.js + TypeScript** | Web dashboard UI |
| **Tailwind CSS** | Styling |
| **React Query / Axios** | API calls, caching dashboard data |
| **Socket.IO client** | Live job monitoring view |

---

### ⚙️ Backend

| Tech | Used For |
| :--- | :--- |
| **Node.js + Express (or NestJS)** | REST API server, business logic, all modules (auth, bookings, dispatch, etc.) |
| **TypeScript** | Type safety on backend |
| **Socket.IO (server)** | WebSocket gateway for live tracking, chat, real-time job status |
| **Prisma (or TypeORM)** | ORM — talks to PostgreSQL, migrations, schema management |
| **JWT (jsonwebtoken)** | Auth tokens for session management |
| **bcrypt** | Password hashing |
| **Joi / Zod** | Request validation (inline form validation per SRS 3.1) |

---

### 🗄️ Databases & Caching

| Tech | Used For |
| :--- | :--- |
| **PostgreSQL** | Primary relational DB — Users, Bookings, Payments, Reviews, ServiceCategory, Dispatch |
| **Redis** | High-frequency live-location data, OTP storage, session/cache |

---

### 🔌 Third-Party Integrations

| Service | Used For |
| :--- | :--- |
| **Google Maps Platform** | Maps, geocoding, distance/ETA calculation, routing |
| **Razorpay or Stripe (test mode)** | Payment processing, refunds — PCI-DSS compliant so you never touch raw card data |
| **Firebase Cloud Messaging (FCM)** | Push notifications (booking updates, job offers, payment status) |
| **Twilio or MSG91** | OTP SMS verification, masked in-app voice calling |
| **Dialogflow (optional) or simple rule engine** | Chatbot support — start rule-based, upgrade if time allows |

---

### ☁️ DevOps / Hosting

| Tech | Used For |
| :--- | :--- |
| **Render or Railway** | Backend hosting (free/student tier) |
| **Supabase or Neon** | Managed PostgreSQL hosting |
| **Expo EAS** | Building & distributing mobile app binaries for testing |
| **GitHub / GitHub Actions** | Version control, basic CI (lint/test on push) |
| **Postman** | API testing during development |

---

### 📑 Documentation / Design Tools (for SRS deliverables)

| Tool | Used For |
| :--- | :--- |
| **StarUML** | Class diagrams, use case diagrams |
| **dbdiagram.io or Prisma's schema visualizer** | ER diagram (flagged as pending in SRS Appendix B) |
| **draw.io / Lucidchart** | State-transition diagram for job status |

---

## 📂 Repository Directory Structure

```
FieldFix/
├── backend/                  # Node.js + Express + TypeScript + Prisma + Socket.IO API Engine
│   ├── prisma/               # PostgreSQL schema & database migration scripts
│   ├── src/
│   │   ├── app.ts            # Express application middleware & setup
│   │   └── server.ts         # HTTP Server & Socket.IO Real-time Gateway
│   ├── .env.example          # Environment variables template
│   ├── package.json
│   └── tsconfig.json
│
├── admin-dashboard/          # React.js + TypeScript + Tailwind CSS Web Dashboard
│   ├── src/
│   │   ├── App.tsx           # Dashboard layout & live dispatch monitor
│   │   ├── main.tsx          # React DOM entry point
│   │   └── index.css         # Tailwind CSS styling directives
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── mobile-app/               # React Native / Expo (Customer + Technician App)
│   ├── src/
│   │   └── App.tsx           # Customer & Technician role-switcher interface
│   ├── app.json              # Expo application configuration
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                     # SRS Deliverables & Architecture Diagrams
│   └── README.md             # Diagram tracking & SRS specifications
│
├── .gitignore                # Git exclusions for dependencies, builds, & secrets
├── package.json              # Root workspace package configuration
└── README.md                 # Master FieldFix project documentation
```