# Spec — Barber Appointment Booking App (web v1)

> Purpose: Deliver a production-grade spec for a Senior Creative Developer (Awwwards-level) / Agent AI to build a web-first appointment booking app for barbers.

---

## Product brief
- **Goal:** Fast, reliable booking for customers + a lightweight admin panel for the barber to manage, reschedule, cancel, and contact clients.
- **Audience:** Small businesses / single-barber shops (future multi-staff support).
- **Value:** Reduce phone/WhatsApp traffic, cut no-shows, make scheduling predictable.

---

## Tech summary (one liners)
- **Frontend:** Next.js + TypeScript (SSR/ISR where useful). TailwindCSS + component system (shadcn/ui-style). Framer Motion for micro-interactions.
- **API:** tRPC (type-safe fullstack TypeScript) — GraphQL optional but lower priority.
- **DB:** PostgreSQL with Prisma ORM.
- **Cache & Jobs:** Redis for caching, locks, rate-limiting and BullMQ for job queueing.
- **Auth:** NextAuth or custom JWT sessions; OAuth for Google Calendar sync.
- **Realtime:** WebSockets (Socket.io) or Pusher for live updates.
- **Notifications:** Email (SendGrid), SMS (Twilio), Web Push.
- **Hosting:** Vercel for frontend; Render / Fly / Cloud Run for backend services; managed Postgres (Neon/Supabase/AWS RDS).
- **CI/CD:** GitHub Actions → preview deployments → staging → prod.
- **Monitoring:** Sentry for errors, Datadog/Prometheus for metrics and alerts.
- **Payments (optional):** Stripe for deposits/prepays.

---

## MVP scope — core requirements
### Customer flow
- Quick booking flow: select service → pick date/time → enter contact → confirm.
- Guest booking + optional account creation.
- Real-time availability with slot locking during checkout.
- Email/SMS confirmations and configurable reminders (e.g. 24h, 2h).
- Google Calendar sync + ICS export.

### Barber / Admin
- Daily/weekly calendar with drag-to-reschedule.
- Appointment list with statuses: scheduled, confirmed, arrived, cancelled, no-show.
- Cancel, reschedule, contact client (SMS/email/call link).
- Manage services, durations, buffer times, working hours, blackout dates.
- Audit log/history for changes.

---

## UX principles
- Mobile-first, RTL-ready (Hebrew primary). Minimal steps — booking ≤ 3 screens.
- Accessibility: WCAG AA baseline (aria, keyboard, contrast).
- Performance budget: fast interactive booking (<1.5s perceived).

---

## High-level data model
```yaml
User: {id: uuid, role: [customer, barber, admin], name, email, phone, tz}
BarberProfile: {id, userId, businessName, address, services[], staff[], workingHours, blackoutDates}
Service: {id, barberId, title, duration_min, price, buffer_min}
Appointment: {id, barberId, serviceId, customerId?, start_utc, end_utc, status, metadata}
AvailabilitySlot: {start_utc, end_utc, status, lockedUntil?}
Notification: {id, appointmentId, channel, status, sentAt}
AuditLog: {entity, action, userId, timestamp, details}
```

---

## API surface (examples - tRPC style)
- `mutation bookAppointment(input)` — reserve slot, return appointment + requestId.
- `query availability(barberId, serviceId, from, to)` — returns available slots (UTC + tz info).
- `mutation modifyAppointment(id, newStart)` — reschedule flow with conflict check.
- `mutation cancelAppointment(id, reason)` — notify customer.
- `mutation syncGoogle(oauthCode)` — connect calendar.
- WebSocket channel `barber:{id}` emits appointment.created/updated/cancelled.

Response pattern: include `requestId`, `serverTimeUtc`, standardized error schema `{code, message, meta}`.

---

## Time & timezone rules
- Store all times in UTC only. Convert for display using user/barber timezone (default Asia/Jerusalem).
- Use Luxon or Temporal polyfill for DST-safe calculations. Avoid native Date for scheduling logic.

---

## Security & privacy
- Enforce TLS, HSTS.
- Passwords: bcrypt/argon2 if stored; prefer OAuth/SSO.
- RBAC checks server-side for admin/barber actions.
- Rate-limit booking endpoints (Redis).
- PII encrypted at rest; retention and erase endpoints for compliance.

---

## Reliability & scaling
- Use connection pooling (pgbouncer) and read replicas for scale.
- Slot locking via Redis to prevent double-booking.
- Background workers for notifications and calendar syncs.
- Backups: daily snapshots + PITR.
- SLO: target 99.9% availability for core booking flow.

---

## Testing strategy
- Unit tests: Jest + ts-jest.
- E2E: Playwright for booking, cancel, reschedule flows on mobile and desktop.
- Contract testing: keep tRPC types authoritative.
- Load testing: k6 or Artillery to validate slot-locking under concurrent attempts.

---

## CI/CD
- GitHub Actions pipeline: lint → typecheck → unit → preview deploy → e2e on staging → deploy.
- Migrations via Prisma; block destructive migrations without approval.

---

## Observability & alerts
- Errors: Sentry with release tags.
- Metrics: request latency, booking success rate, queue lengths, notification failure rate.
- Alerts to Slack/PagerDuty for critical failures (queue backlog, DB issues).

---

## Deliverables (MVP)
1. Production-grade Next.js app (RTL & mobile-first) public booking flow.
2. Admin dashboard: calendar + appointment list + basic availability editor.
3. API & DB schema + migrations.
4. Google Calendar sync & ICS export.
5. Notifications: email + SMS + configurable reminders.
6. CI/CD with preview/staging/prod and monitoring.
7. Playwright acceptance tests and a load test report.

---

## Acceptance criteria (testable)
- Complete booking from mobile in ≤3 screens with confirmed ICS.
- Barber can reschedule/cancel and customer receives notification.
- No double-booking under a simulated 200 concurrent attempts per slot (slot-locking passes).
- Notification failure rate <1% in staging load tests.

---

## Post-MVP roadmap
- Multi-staff & shift management.
- Prepayment & deposit flows.
- WhatsApp Business integration.
- Smart reminder timing (ML-driven send-time optimization).
- White-label / multi-tenant capabilities.

---

## Notes for the Senior Creative Developer
- Pixel-perfect UI, but keep performance tight. Micro-interactions enhance clarity.
- Accessibility is mandatory — test with axe-core.
- Strict TypeScript everywhere; single source-of-truth for types (tRPC + Prisma).
- Design tokens, theme system, RTL support, and a small component library.

---

## README expectations
- Local dev: env vars, migrations, seed data.
- Integrations: Google OAuth setup, Twilio/SendGrid keys.
- Promotion flow: preview → staging → prod.

---

*End of spec.*
