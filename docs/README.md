# FieldFix

FieldFix coordinates home-service bookings between customers, technicians, and administrators. The working end-to-end experience is currently the React web application backed by an Express API and PostgreSQL. The Expo mobile application is an early scaffold and does not yet implement the complete web booking/payment workflow.

## Contents

- [Project Layout](#project-layout)
- [Technology Stack](#technology-stack)
- [Run Locally](#run-locally)
- [Database and Prisma Studio](#database-and-prisma-studio)
- [Portals and Workflow](#portals-and-workflow)
- [API Overview](#api-overview)
- [Environment Configuration](#environment-configuration)
- [Build and Mobile Commands](#build-and-mobile-commands)
- [Current Scope and Notes](#current-scope-and-notes)

## Project Layout

```text
FieldFix/
├── admin-dashboard/             # React web app: customer, technician, admin portals
│   └── src/
│       ├── pages/                # Portal pages and booking/support screens
│       ├── components/           # Shared admin layout and forms
│       └── services/             # Axios API client, auth helpers, Socket.IO client
├── backend/                      # Express REST API and Socket.IO server
│   ├── prisma/
│   │   ├── schema.prisma         # PostgreSQL data model
│   │   └── migrations/           # Prisma SQL history
│   └── src/
│       ├── routes/               # Auth, booking, messaging, payment APIs
│       ├── middleware/           # JWT authentication and role checks
│       ├── app.ts                # Express app and route registration
│       └── server.ts             # HTTP and Socket.IO server
├── mobile-app/                    # Expo / React Native starter app
├── docs/                          # ER and status lifecycle documentation
├── package.json                   # npm workspaces and root commands
└── README.md
```

## Technology Stack

| Area | Implemented technology |
|---|---|
| Web portals | React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 7 |
| UI icons | lucide-react |
| Web API | Axios with JWT bearer-token interceptor |
| Backend | Node.js, Express 4, TypeScript |
| Database access | Prisma 5 and PostgreSQL |
| Authentication | JWT (`jsonwebtoken`) and bcrypt password hashing |
| Real-time | Socket.IO for technician GPS updates; booking/chat status is also refreshed through the REST API |
| Payments | Razorpay Node SDK and Razorpay Checkout (test/live mode depends on configured keys) |
| Mobile scaffold | Expo 50, React Native 0.73, TypeScript, React Navigation, Zustand, Socket.IO client |

Redis, Google Maps, SMS/OTP, Firebase push notifications, and an external AI service are not currently wired into the main workflow.

## Run Locally

### Prerequisites

- Node.js and npm compatible with the installed workspace dependencies
- A reachable PostgreSQL database
- Razorpay test keys for exercising checkout (live keys should only be used in a deployed environment)

### Install dependencies

Run from the repository root:

```powershell
npm install
```

Create the backend environment file if it does not exist, then edit it with your own database and service configuration. Do not commit `.env` files or payment secrets.

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

At minimum, configure `DATABASE_URL`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` in `backend/.env`. See [Environment Configuration](#environment-configuration).

### Start the API and web app together

From the repository root:

```powershell
npm run dev
```

This runs the backend and Vite web app concurrently. The API defaults to `http://localhost:5000`; Vite defaults to port `5180` and chooses another free port if `5180` is occupied. Keep this terminal running while using the app.

To start the services separately, use two terminals from the repository root:

```powershell
npm run start:backend
```

```powershell
npm run start:web
```

The API health endpoint is `http://localhost:5000/api/health`.

## Database and Prisma Studio

The Prisma schema is in `backend/prisma/schema.prisma`; PostgreSQL connection settings come from `backend/.env`.

Open Prisma Studio from the backend directory:

```powershell
cd backend
npx prisma studio
```

Prisma Studio normally opens at `http://localhost:5555`. It lets you inspect the `User`, `TechnicianProfile`, `ServiceCategory`, `Booking`, `Payment`, `Review`, and `ChatMessage` tables. Studio reads and edits the database selected by `DATABASE_URL`, so confirm that URL before changing records.

Validate the schema from `backend/`:

```powershell
npx prisma validate --schema prisma/schema.prisma
```

For a development database that needs to be synchronized with the schema, review `DATABASE_URL` first, then run:

```powershell
npx prisma db push --schema prisma/schema.prisma
```

**Migration-history warning:** the checked-in `backend/prisma/migrations/migration_lock.toml` identifies SQLite, while the current Prisma datasource is PostgreSQL. Consequently, `prisma migrate dev` and `prisma migrate status` can report provider mismatch (`P3019`). The active database schema has been synchronized for the current implementation, but the migration history needs a PostgreSQL baseline before the standard migration workflow is reliable. Do not run migration/reset commands against a shared or production database until that baseline is resolved.

## Portals and Workflow

### Customer

- Register and sign in with a customer account.
- Search registered technicians by name, service skill, and city.
- Select a technician, service, future time slot, address, and problem description.
- Pay the server-calculated service price through Razorpay Checkout.
- The backend verifies the Razorpay signature and captured payment before making the booking visible to the technician.
- View booking status, paid amount, and booking notifications. The notification bell opens a dropdown linked to the customer’s bookings.
- Chat with the assigned technician on a booking thread, or open a separate Help & Support thread for administrators.

### Technician

- Register with a unique technician verification ID, selected service skills, and operating city.
- Toggle availability; unavailable technicians cannot receive new customer requests.
- See only jobs assigned to the signed-in technician.
- Accept a paid request, start the job, then mark it complete. Status transitions are persisted by the API.
- Message customers through the booking thread and contact administrators through Help & Support.
- Share browser geolocation for accepted/in-progress work. The browser must grant location permission for live GPS updates.

### Administrator

- Sign in with an administrator account provisioned in the database. Public registration only creates customer and technician accounts.
- View live booking counts and database-backed bookings/technicians.
- Update technician availability.
- Use the Support Inbox to view and reply to general support or booking conversations. Replies appear in the other portal’s same conversation.

### Booking status path

```text
AWAITING_PAYMENT -> PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED
					 ^
					 └── Only reached after successful payment verification
```

If Razorpay checkout fails or is dismissed, the unpaid booking is cancelled and is not sent to the technician.

## API Overview

All endpoints are served from `http://localhost:5000/api`. Routes requiring a user session use `Authorization: Bearer <JWT>`.

| Method | Path | Purpose / access |
|---|---|---|
| `GET` | `/health` | API health check |
| `POST` | `/auth/register` | Public customer/technician registration |
| `POST` | `/auth/login` | Sign in and receive a JWT |
| `GET` | `/auth/technicians` | Browse profiles; supports `name`, `skill`, `city`, `available` filters |
| `PATCH` | `/auth/technicians/availability` | Update technician availability; technician or admin |
| `GET` | `/bookings` | List bookings scoped to the signed-in role; admin sees all |
| `GET` | `/stats` | Admin dashboard counts; admin only |
| `PATCH` | `/bookings/:id/status` | Assigned technician accepts/updates their job |
| `POST` | `/payments/order` | Create server-priced booking and Razorpay order; customer only |
| `POST` | `/payments/verify` | Verify and capture payment before activating the request; customer only |
| `POST` | `/payments/fail` | Cancel an unpaid booking after failed/dismissed checkout; customer only |
| `GET` / `POST` | `/messages?threadId=...` / `/messages` | Read/send authorized support or booking messages |
| `GET` | `/messages/threads` | Admin support inbox, including booking chats; admin only |

The browser API client is configured in `admin-dashboard/src/services/api.ts`; route implementations are in `backend/src/routes/`.

## Environment Configuration

Start with `backend/.env.example` and store real values only in the ignored `backend/.env` file.

| Variable | Purpose |
|---|---|
| `PORT` | Backend HTTP port; defaults to `5000` |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Secret used to sign and verify login tokens; use a strong private value |
| `JWT_EXPIRES_IN` | JWT expiry duration, for example `7d` |
| `RAZORPAY_KEY_ID` | Razorpay public key ID sent to Checkout |
| `RAZORPAY_KEY_SECRET` | Server-only secret used for signature verification; never expose it in frontend code |

Other sample variables in `.env.example` (Redis, maps, Twilio, and FCM) are placeholders and are not required by the current core web flow.

## Build and Mobile Commands

Run from the repository root:

```powershell
npm run build:admin
npm run build:backend
```

Start the Expo mobile scaffold:

```powershell
npm run start:mobile
```

Start its web preview on port `8085`:

```powershell
npm run start:mobile:web
```

The mobile app currently contains an Expo/React Native UI scaffold and API health-check client. Customer registration, paid booking, technician job management, and the complete support workflow are implemented in the web portals; they are not yet implemented end-to-end in the mobile app.

## Current Scope and Notes

- In-app booking notifications are based on the customer’s current booking records and are refreshed by the customer portal. Browser/mobile push notifications, SMS, and email delivery are not configured.
- The floating customer assistant uses local FAQ responses; it is not connected to an external AI model.
- Razorpay must be configured with valid keys. Use Razorpay test credentials and test payment methods during development. Do not test with live keys unless intentionally charging a real account.
- The analytics page, landing-page metrics, and some secondary forms/screens may still contain presentation/demo content; the core booking, payment, technician status, messaging, availability, and admin support paths use persisted API data.
- Architecture references: [ER diagram](docs/ER_DIAGRAM.md) and [booking state transitions](docs/STATE_TRANSITION.md).