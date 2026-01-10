-- Create tables for Torforyou barber booking app

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  "supabaseId" TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Admin table (phone-based admin lookup)
CREATE TABLE IF NOT EXISTS "Admin" (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service table
CREATE TABLE IF NOT EXISTS "Service" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "durationMin" INTEGER NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  "bufferMin" INTEGER NOT NULL DEFAULT 5
);

-- Appointment table
CREATE TABLE IF NOT EXISTS "Appointment" (
  id TEXT PRIMARY KEY,
  "startUtc" TIMESTAMP NOT NULL,
  "endUtc" TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  "userId" TEXT,
  "serviceId" TEXT NOT NULL,
  "guestName" TEXT,
  "guestPhone" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL,
  FOREIGN KEY ("serviceId") REFERENCES "Service"(id) ON DELETE RESTRICT
);

-- Seed default services
INSERT INTO "Service" (id, title, "durationMin", price, "bufferMin")
VALUES 
  (gen_random_uuid()::text, 'Haircut', 30, 25, 5),
  (gen_random_uuid()::text, 'Beard Trim', 15, 15, 5),
  (gen_random_uuid()::text, 'Full Service', 60, 40, 5)
ON CONFLICT DO NOTHING;
