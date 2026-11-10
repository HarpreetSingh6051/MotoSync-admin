---
name: supabase-data-rules
description: How data and auth must flow across MotoSync repos.
---
- Backend is the only write gateway. Frontends use Supabase directly only for Auth, Storage and public realtime reads.
- Never expose service_role to a client. Never silently fall back to mock data: show a "Demo data" badge when fallback is active.
- Use UUIDs everywhere. Validate input with DTOs.
- Admin routes require a verified Supabase JWT with role super_admin.
