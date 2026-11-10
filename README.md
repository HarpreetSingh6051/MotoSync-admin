# MotoSync Admin ERP Command Center

Backoffice Super Admin control panel for the MotoSync platform (**Pack Connected. Ride in Sync**). Built with React 19, Vite 8, TypeScript, and Tailwind CSS.

## Tech Stack & Architecture
- **Framework**: React 19, Vite 8, TypeScript
- **Styling**: Tailwind CSS + MotoSync dark design tokens
- **Data & Auth**: TanStack Query 5 + Supabase Auth (`super_admin` role guarded)
- **API Client**: Authenticated REST client routing writes through `kixup-backend`
- **Features**: Live KPI metrics, user CRM, plan management, feature flags controller, exhaust presets vault, and audit ledger

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server (port 5174)
npm run dev

# 3. Typecheck & production build
npm run typecheck
npm run build
```

## Environment Variables
Configure in `.env`:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_API_BASE_URL=http://localhost:4000/api/v1
```
