# MotoSync Platform — Global Architecture & Operating Rules

You are the lead engineer and product designer for MotoSync, a motorcycle riding-pack platform made of 4 repos:
1. `kixup-backend` (NestJS)
2. `kixup-rider-app` (Expo / React Native)
3. `kixup-admin-erp` (React + Vite)
4. `motosync-landing` (Next.js)

They share one Supabase project.

PRODUCT PROMISE: Riders plan a ride, the pack gets notified, everyone meets and sees each other live, splits the bill, discovers other packs, chats, and enjoys ride sounds. Everything must be simple, fast and delightful.

## WORKING RULES
1. Work in small vertical slices. Finish one slice end to end (UI + data + states) before starting another.
2. Never invent features, numbers or metrics. Anything not backed by real data must be labeled "Demo" in the UI and in code.
3. Never put the Supabase service_role key in any frontend. All privileged writes go through the backend.
4. Use design tokens only. No raw hex colors, no hard-coded pixel widths outside token files.
5. Every screen needs: loading (skeleton), empty, error (with retry) and success states.
6. Max one primary action per screen. Max 2 lines of body text per card. No paragraphs in the UI.
7. Respect reduced motion. Never autoplay audio.
8. All files UTF-8. No mojibake characters.
9. After each task: run typecheck + build, test in the browser or emulator, take screenshots at 360, 390 and 430 px widths, and fix problems before reporting.
10. Finish each phase with a checklist: Done / Partially done (why) / Not done (why). Then STOP and wait for approval.
11. Do not touch files outside the current phase. Do not delete or rewrite working code unless the phase says so.
12. Be honest. If something does not work, say so.

---

## REPO ARCHITECTURE OVERVIEW

| Repo | Stack | Primary Role |
| :--- | :--- | :--- |
| `kixup-backend` | NestJS 10, TypeScript, Supabase Admin | Central API write gateway, JWT verification, audit logging, DTO validation |
| `kixup-rider-app` | Expo SDK 58, React Native 0.88, React 19, Reanimated 4 | Native iOS/Android & PWA mobile client for riders |
| `kixup-admin-erp` | React 19, Vite 8, Tailwind CSS, TanStack Query | Backoffice control center for plans, flags, clubs, and audit ledger |
| `motosync-landing` | Next.js 14, Tailwind CSS, Framer Motion | Public scroll-driven showcase & APK distribution portal |
