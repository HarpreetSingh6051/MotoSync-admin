# MotoSync Admin ERP

Standalone Super Admin ERP/CRM dashboard for the MotoSync platform, built with React, Vite, TypeScript, and Tailwind CSS.

## Features
- **Overview & Revenue**: Real-time KPI metrics (total riders, PRO subscribers, estimated MRR in INR, active sponsored campaigns).
- **Users / CRM**: Comprehensive rider directory with live entitlement management (assign plans, promote roles between rider, road captain, club admin, and super_admin, suspend/ban accounts).
- **Subscription Plan Manager**: Create and edit subscription plans (Free Rider, Silver Visor, Road Captain PRO, Club Shield) that dynamically update the rider app paywall and pricing.
- **Feature Flag Rollout Controller**: Toggle core, AI, safety, and monetization feature flags with live Supabase synchronization.
- **Exhaust Sound Vault**: Manage the digital garage exhaust sound presets, decibels, and PRO locks.
- **Sponsored Campaigns**: Manage partner pitstop ads and discount codes.

## Setup & Development

```bash
npm install
npm run dev        # Vite dev server on port 5174
npm run typecheck  # TypeScript check
npm run build      # Typecheck + production build
```

## Production Deployment
1. Push this repository to GitHub as a separate project/repo (`kixup-admin-erp`).
2. Deploy to Vercel, Netlify, or your internal admin domain.
3. Configure environment variables:
   - `VITE_SUPABASE_URL=https://hxsifqmspboitoqnkvwj.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`
4. Log in with a user account that has been promoted to `super_admin` in the Supabase database. All actions are guarded by Row Level Security (RLS) and audit-logged.
