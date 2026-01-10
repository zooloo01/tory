# Torforyou — Barber Booking App

Mobile-first barber booking app with phone-based authentication via Supabase.

## Features

- **Phone OTP Login** — SMS-based authentication via Supabase Auth
- **Role-Based Routing** — Admins → `/admin`, Customers → `/book`
- **Booking Flow** — Service → Date/Time → Confirm (3 steps)
- **My Appointments** — View upcoming/past bookings with status labels
- **Admin Panel** — Manage appointments and services

---

## Quick Start

```bash
npm install
cp .env.example .env.local  # Fill in your values
npx prisma generate
npx prisma db push
npm run dev
```

---

## How Supabase is Connected

1. **Browser Client** (`src/lib/supabase.ts`) — Uses `createBrowserClient` from `@supabase/ssr`
2. **Server Client** (`src/lib/supabase-server.ts`) — Cookie-based sessions for SSR
3. **Middleware** (`src/middleware.ts`) — Refreshes session on each request, protects routes
4. **Database** — Prisma connects to Supabase Postgres via `DATABASE_URL`

---

## How Phone Auth Works

1. User enters phone number on `/login`
2. App calls `supabase.auth.signInWithOtp({ phone })` → Supabase sends SMS via Twilio
3. User enters 6-digit OTP
4. App calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
5. On success, checks if phone exists in `Admin` table → redirects accordingly
6. Session persisted via cookies (refresh-safe)

---

## Environment Variables

Create `.env.local` with:

```env
# Supabase (from project settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (from project settings → Database → Connection string)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## Deploy to Vercel (Step-by-Step)

### 1. Setup Supabase Project

1. Go to [supabase.com](https://supabase.com) → Create new project
2. **Enable Phone Auth**: Settings → Auth → Providers → Phone → Enable
3. **Configure Twilio**: Add Account SID, Auth Token, Message Service SID
4. Copy your project URL and anon key from Settings → API

### 2. Push Database Schema

```bash
# Set DATABASE_URL to your Supabase connection string
npx prisma db push
```

### 3. Seed Admin Phone (Optional)

Run this SQL in Supabase SQL Editor:
```sql
INSERT INTO "Admin" (id, phone, "createdAt") 
VALUES (gen_random_uuid(), '+972501234567', NOW());
```

### 4. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
4. Deploy

### 5. Verify

1. Visit your Vercel URL
2. Click "Sign In" → Enter phone → Receive SMS → Enter OTP
3. Check redirect based on role (admin/customer)

---

## Project Structure

```
src/
├── app/
│   ├── login/          # Phone OTP login
│   ├── booking/        # Customer booking flow
│   ├── my-appointments/# Customer history
│   ├── admin/          # Admin dashboard
│   ├── book/           # Redirect to /booking
│   └── api/
│       └── auth/check-role/  # Admin phone check
├── components/
│   └── AuthProvider.tsx      # Auth context
├── lib/
│   ├── supabase.ts           # Browser client
│   └── supabase-server.ts    # Server client
├── middleware.ts             # Route protection
└── server/                   # tRPC + Prisma
```

---

## Route Protection

| Route | Access |
|-------|--------|
| `/login` | Public (redirects if logged in) |
| `/booking` | Public |
| `/my-appointments` | Authenticated only |
| `/admin` | Authenticated only |

Admin role check happens after OTP verification via `/api/auth/check-role`.
