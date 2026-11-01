---
name: fullstack-debug-expert
description: Systematically troubleshoot full-stack errors, Supabase RLS policies, Gradle build issues, and Capacitor native integrations. Use when diagnosing runtime errors, build failures, native Android/iOS crashes, or security policy issues.
---

# Fullstack Debug Expert

A professional skill for systematically diagnosing and resolving issues across modern full-stack web and mobile stacks, including Supabase backend security, build toolchains (Gradle/Vite), and hybrid native mobile runtimes (Capacitor/Tauri).

## When to Use
- Diagnosing and fixing Supabase Row Level Security (RLS) policy violations, recursive lookups, or RPC execution failures.
- Resolving Android Gradle build errors, namespace clashes, and ProGuard / dependency resolution failures.
- Debugging Capacitor native plugin bridges, permission denials (Geolocation, Camera, Audio), and webview synchronization.
- Investigating Vite / TypeScript compilation, circular imports, and production bundling issues.

## Diagnostic Procedures
1. **Supabase RLS & Security**:
   - Inspect RLS policy clauses using `EXPLAIN ANALYZE` or test queries as `anon` / `authenticated`.
   - Ensure helper functions use `SECURITY DEFINER` with explicit `search_path = public` to avoid recursion.
2. **Capacitor & Android Mobile**:
   - Verify `capacitor.config.ts`, `build.gradle`, and `AndroidManifest.xml` have matching app IDs and permissions.
   - Always run `npx cap sync android` after modifying native dependencies or web output.
3. **Build & Bundler Verification**:
   - Use `tsc --noEmit` to verify type safety before inspecting bundler failures.
   - Guard against Node/CommonJS synthetic default import mismatches with `esModuleInterop`.
