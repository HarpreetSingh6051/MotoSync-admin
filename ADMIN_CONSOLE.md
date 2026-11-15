# Live admin console

The entry point is src/pages/AdminConsole.tsx. It uses Supabase Auth for sign-in and backend bearer-token API requests for all admin data and mutations. No service-role key belongs in this application.

See ../kixup-backend/docs/ADMIN_CONSOLE.md for the required database migration, backend credential setup, administrator provisioning and acceptance checklist. The new console replaces the mounted demo dashboard; old modules remain in source for later integration.

Use npm run dev (port 5174), npm run typecheck, and npm run build. Configure VITE_API_BASE_URL (for example http://localhost:4000/api/v1), VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY in .env.local.

Live verification and browser responsive screenshots are pending. Never interpret a successful build as database or browser acceptance.

## Environment routing and authentication gateway

All active console HTTP calls use `VITE_API_BASE_URL` through src/lib/environment.ts. Public routing files select:

- `.env.development`: `http://localhost:4000/api/v1`
- `.env.production`: `https://moto-sync-be.vercel.app/api/v1`

Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in ignored `.env.local` for the local project, and in Vercel Environment Variables for each Preview/Production environment. For separate databases, use `.env.development.local` / `.env.production.local` overrides. Vite environment changes require restarting the development server or rebuilding/redeploying. Host-provided environment variables take precedence over files.

The Supabase SDK retains session storage/refresh, but its Auth HTTP requests are forwarded to the configured backend `/auth/v1/token`, `/auth/v1/user`, and `/auth/v1/logout`. Backend then calls its configured SUPABASE_URL with SUPABASE_ANON_KEY. Both projects must point at the same Supabase project. The gateway does not permit signup or Auth admin endpoints. API management calls continue to send the signed session bearer token.

A local backend HTTP check with the requested initial credentials returned `400 invalid_credentials`. This is an account/password issue in the currently configured Supabase project, not an admin API route failure. Apply migration 007 and verify its transaction succeeded, or check/reset the already-existing Auth account. The seed intentionally does not reset an existing administrator password. A service-role credential is still required for admin authorization after login. Additional user provisioning is not yet implemented in the console.
