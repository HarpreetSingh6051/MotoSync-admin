# Live admin console

The entry point is src/pages/AdminConsole.tsx. It uses Supabase Auth for sign-in and backend bearer-token API requests for all admin data and mutations. No service-role key belongs in this application.

See ../kixup-backend/docs/ADMIN_CONSOLE.md for the required database migration, backend credential setup, administrator provisioning and acceptance checklist. The new console replaces the mounted demo dashboard; old modules remain in source for later integration.

Use npm run dev (port 5174), npm run typecheck, and npm run build. Configure VITE_API_BASE_URL (for example http://localhost:4000/api/v1), VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY in .env.local.

Live verification and browser responsive screenshots are pending. Never interpret a successful build as database or browser acceptance.
