# FieldFix

FieldFix coordinates home-service bookings between customers, technicians, and administrators. The project includes a React dashboard, an Express/Socket.IO API, and an Expo customer/technician app with authentication, booking/payment, chat, and device notifications.

## Contents

- [Project Layout](#project-layout)
- [Technology Stack](#technology-stack)
- [Run Locally](#run-locally)
- [Database and Prisma Studio](#database-and-prisma-studio)
- [Portals and Workflow](#portals-and-workflow)
- [API Overview](#api-overview)
- [Environment Configuration](#environment-configuration)
- [Build and Mobile Commands](#build-and-mobile-commands)
- [Deployment](#deployment)
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
├── mobile-app/                    # Expo / React Native customer and technician app
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
| Real-time | Authenticated Socket.IO for booking updates, chat, and technician GPS |
| Payments | Razorpay Node SDK and Razorpay Checkout (test/live mode depends on configured keys) |
| Mobile | Expo 50, React Native 0.73, secure token storage, maps/location, Razorpay Checkout, Socket.IO, Expo push notifications |

SMS/OTP and an external AI service are not wired into the main workflow. Mobile push delivery uses Expo Push Service; Android/iOS push credentials and an EAS project are required for device delivery.

## Run Locally

These steps assume Windows PowerShell and that commands are run from the repository root (`FieldFix/`), unless a step says otherwise.

### 1. Install prerequisites

- Install Node.js LTS (which includes npm).
- Install PostgreSQL and make sure its database server/service is running. pgAdmin is only a database client; it does not replace or start the PostgreSQL server.
- Optional: install Git if you are cloning the project.

Razorpay, Redis, Twilio, and push-service credentials are not needed just to start the API and dashboard. Razorpay test credentials are needed to complete checkout. See [Environment Configuration](#environment-configuration).

### 2. Install the project packages

Open PowerShell in the repository root and run:

```powershell
npm install
```

This installs the dependencies for the backend, dashboard, and mobile app workspaces.

### 3. Create a local PostgreSQL database

Start the PostgreSQL server, then create an empty database named `fieldfix`. For example, in pgAdmin, connect to your local server, open **Query Tool**, and run:

```sql
CREATE DATABASE fieldfix;
```

If the database already exists, do not create it again. The database server must stay running while FieldFix is using it; you can close the pgAdmin window after that if the PostgreSQL server service remains running.

### 4. Configure the backend

From the repository root, make a private copy of the sample environment file:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Edit `backend/.env` and set `DATABASE_URL` to match your PostgreSQL username and password. For a typical local install, the shape is:

```text
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/fieldfix?schema=public"
```

Replace `YOUR_USER` and `YOUR_PASSWORD`; the sample value `user:password` is only a placeholder. Also set `JWT_SECRET` to a private random value of at least 32 bytes. You can generate one in PowerShell from the repository root:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value after `JWT_SECRET=` in `backend/.env`. Keep `.env` files and secrets private and do not commit them.

### 5. Generate Prisma Client and create the tables

From the repository root, run these once for a new local database:

```powershell
npm --prefix backend run prisma:generate
Set-Location backend
npx prisma migrate deploy --schema prisma/schema.prisma
Set-Location ..
```

The first command generates the Prisma client used by the API. The second applies the checked-in PostgreSQL migrations to the database in `backend/.env`. It does not reset or delete the database. For an existing/shared database, first confirm its URL and back it up; do not run reset commands. If it has a schema but no matching Prisma migration history, stop and reconcile that history before applying migrations.

### 6. Start the API and dashboard

From the repository root:

```powershell
npm run dev
```

Keep this terminal open. It starts the backend and admin dashboard together. The API is at `http://localhost:5000` and the dashboard is usually at `http://localhost:5180` (Vite prints the actual URL if that port is busy). Check the API at `http://localhost:5000/api/health`.

You can instead start them in separate terminals, both opened at the repository root:

```powershell
npm run start:backend
```

```powershell
npm run start:web
```

The backend loads `backend/.env`; do not launch it before completing the database and Prisma steps above. The API and dashboard need to keep running while you use the app.

### 7. (Optional) Start the mobile app

First, from the repository root, create the mobile environment file if it does not exist:

```powershell
if (-not (Test-Path mobile-app/.env)) { Copy-Item mobile-app/.env.example mobile-app/.env }
```

Then open a second PowerShell terminal at the repository root and run:

```powershell
npm run start:mobile
```

Then follow Expo's terminal instructions to open the app on a simulator/device. The mobile app needs the API terminal running too. To use a physical phone, put the phone and computer on the same network and set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` in `mobile-app/.env` to your computer's LAN IP (for example, `http://192.168.1.20:5000/api` and `http://192.168.1.20:5000`); `localhost` on the phone refers to the phone itself. For the standard Android emulator, use `http://10.0.2.2:5000/api` and `http://10.0.2.2:5000`. Copy `mobile-app/.env.example` to `mobile-app/.env` before changing these values. Native Razorpay checkout requires an Expo development or store build; it does not run in Expo Go.

## Database and Prisma Studio

The Prisma schema is in `backend/prisma/schema.prisma`; PostgreSQL connection settings come from `backend/.env`. Complete steps 3–5 in [Run Locally](#run-locally) before opening Studio.

From the repository root, open Prisma Studio with:

```powershell
npm --prefix backend run prisma:studio
```

Prisma Studio normally opens at `http://localhost:5555`. It lets you inspect the `User`, `TechnicianProfile`, `ServiceCategory`, `Booking`, `Payment`, `Review`, and `ChatMessage` tables. Studio reads and edits the database selected by `DATABASE_URL`, so confirm that URL before changing records.

To validate the schema, from the repository root run:

```powershell
Set-Location backend
npx prisma validate --schema prisma/schema.prisma
Set-Location ..
```

For a throwaway development database without migration history, `db push` is an alternative; review `DATABASE_URL` first. From the repository root, run:

```powershell
Set-Location backend
npx prisma db push --schema prisma/schema.prisma
Set-Location ..
```

The historical SQLite migration files are retained in `backend/prisma/migrations-sqlite-legacy/`. New PostgreSQL databases use the PostgreSQL baseline under `backend/prisma/migrations/`. For an existing shared database, back it up and reconcile its schema/history before applying migrations; do not reset it.

## Portals and Workflow

### Customer

- Register and sign in with a customer account.
- Search registered technicians by name, service skill, and city.
- Select a service, future appointment date, address, and problem description; the API assigns an available technician by skill and city.
- Pay the server-calculated service price through Razorpay Checkout.
- The backend verifies the Razorpay signature and captured payment before making the booking visible to the technician.
- View booking status, paid amount, and booking notifications. The notification bell opens a dropdown linked to the customer’s bookings.
- Chat with the assigned technician on a booking thread, or open a separate Help & Support thread for administrators.
- In the Expo app, use device location or tap a map location and complete the booking and payment flow.

### Technician

- Register with a unique technician verification ID, selected service skills, and operating city.
- Toggle availability; unavailable technicians cannot receive new customer requests.
- See only jobs assigned to the signed-in technician.
- Accept a paid request, start the job, then mark it complete. Status transitions are persisted by the API.
- Message customers through the booking thread and contact administrators through Help & Support.
- In the Expo app, receive assigned jobs, update job status, and chat with customers.
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
| `POST` | `/dispatch/match` | Find an available technician by service and city |
| `POST` | `/payments/order` | Create server-priced booking and Razorpay order; customer only |
| `POST` | `/payments/verify` | Verify and capture payment before activating the request; customer only |
| `POST` | `/payments/fail` | Cancel an unpaid booking after failed/dismissed checkout; customer only |
| `GET` / `POST` | `/messages?threadId=...` / `/messages` | Read/send authorized support or booking messages |
| `POST` / `DELETE` | `/notifications/push-token` | Register/remove the signed-in device's Expo push token |
| `GET` | `/messages/threads` | Admin support inbox, including booking chats; admin only |

The browser API client is configured in `admin-dashboard/src/services/api.ts`; route implementations are in `backend/src/routes/`.

## Environment Configuration

Start with `backend/.env.example` and store real values only in the ignored `backend/.env` file. For local API startup, `DATABASE_URL` must point to a running PostgreSQL database and `JWT_SECRET` must contain at least 32 bytes. Razorpay keys are only needed to create/verify checkout payments; use Razorpay test keys during development. The Redis, Twilio, FCM, and backend Google Maps values shown in the sample are placeholders and are not required by the current core web flow.

| Variable | Purpose |
|---|---|
| `PORT` | Backend HTTP port; defaults to `5000` |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Secret used to sign and verify login tokens; use a strong private value |
| `JWT_EXPIRES_IN` | JWT expiry duration, for example `7d` |
| `RAZORPAY_KEY_ID` | Razorpay public key ID sent to Checkout |
| `RAZORPAY_KEY_SECRET` | Server-only secret used for signature verification; never expose it in frontend code |
| `VITE_API_BASE_URL` | Dashboard API URL; defaults to the local API |
| `EXPO_PUBLIC_API_URL` | Mobile REST API URL. Set in `mobile-app/.env`; use the computer LAN IP for a physical phone or `10.0.2.2` for the Android emulator. |
| `EXPO_PUBLIC_SOCKET_URL` | Mobile Socket.IO URL. Use the same host choice as `EXPO_PUBLIC_API_URL`, without `/api`. |
| `GOOGLE_MAPS_API_KEY` | Android Maps SDK key, supplied to Expo during native builds; only needed for native map display. |

Other sample variables in `.env.example` (Redis, maps, Twilio, and FCM) are placeholders and are not required by the current core web flow.

## Build and Mobile Commands

Run from the repository root:

```powershell
npm run build:admin
npm run build:backend
```

Start the Expo app:

```powershell
npm run start:mobile
```

Start its web preview on port `8085`:

```powershell
npm run start:mobile:web
```

The mobile app supports customer/technician login and registration, secure session storage, bookings, technician availability/status, map/location selection, Razorpay checkout, booking chat, live booking updates, and Expo push-token registration. For mobile environment variables, copy `mobile-app/.env.example` to `mobile-app/.env` and choose the API host for the device you are using, as described above. Native Razorpay requires an Expo development or store build; it is not supported in Expo Go. The web preview uses Razorpay's hosted checkout.

## Deployment

### Render

`render.yaml` defines the API, dashboard, and a new PostgreSQL database. Connect this repository in Render and create a Blueprint from that file. Render runs the PostgreSQL migrations before each API deployment. Set the Razorpay test/live keys in the Render environment before accepting payments. The API/database plans in the Blueprint are paid plans; review Render's current billing before applying it. Do not point this new deployment at an existing shared database without backing it up and reconciling the migration history.

The API and dashboard use the fixed hostnames in `render.yaml`; if Render assigns different hostnames, update the dashboard's `VITE_API_BASE_URL` and mobile `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` values before rebuilding.

### Expo EAS

From `mobile-app/`, run `npx eas-cli login`, then `npx eas-cli init` once to link the app to your Expo account. Provide the Android Maps API key as the `GOOGLE_MAPS_API_KEY` EAS environment variable; restrict that key to the Maps SDK and this app's package/signing certificate. Configure Android/iOS push credentials in EAS. The app reads the linked EAS project ID for push-token setup. Build an internal development client with `npm run build:development`, an installable preview with `npm run build:preview`, or a store release with `npm run build:production`. Store submission also needs the corresponding Google Play / Apple developer account and credentials.

Expo's [EAS build profiles](https://docs.expo.dev/build/eas-json/) configure development, preview, and production builds. Render's [Blueprint configuration](https://render.com/docs/blueprint-spec) defines the backend, dashboard, and database services.

## Current Scope and Notes

- Realtime booking notices are sent over authenticated Socket.IO. Native push is sent through Expo after the user grants permission and the device token is registered; Expo/FCM/APNs credentials must be configured in the app's EAS account.
- The floating customer assistant uses local FAQ responses; it is not connected to an external AI model.
- Razorpay must be configured with valid keys. Use Razorpay test credentials and test payment methods during development. Do not test with live keys unless intentionally charging a real account.
- The analytics page, landing-page metrics, and some secondary forms/screens may still contain presentation/demo content; the core booking, payment, technician status, messaging, availability, and admin support paths use persisted API data.
- Architecture references: [ER diagram](docs/ER_DIAGRAM.md) and [booking state transitions](docs/STATE_TRANSITION.md).
