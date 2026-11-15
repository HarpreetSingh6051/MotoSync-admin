import { environment, apiUrl } from "./environment";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = environment.supabaseUrl;
const anonKey = environment.supabaseAnonKey;

/**
 * The app runs in two modes:
 *  - `live`  → Supabase URL + anon key present, queries hit Postgres/PostGIS.
 *  - `demo`  → no keys yet, every query resolves against the seeded dataset in
 *              `src/lib/mockData.ts`. All writes stay local (and persist).
 *
 * This is intentional: the UI, the flows and the AI features are fully usable
 * before a single backend credential exists.
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && environment.apiBase,
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      global: {
        fetch: (input, init) => {
          const original = new URL(
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.href
                : input.url,
          );
          // Keep the SDK session lifecycle while sending all Auth HTTP traffic through NestJS.
          if (
            original.origin === new URL(url).origin &&
            original.pathname.startsWith("/auth/v1/")
          ) {
            return fetch(apiUrl(original.pathname + original.search), init);
          }
          return fetch(input, init);
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null;

export const dataMode = isSupabaseConfigured ? "live" : "demo";

export const getAppUrl = () =>
  import.meta.env.VITE_APP_URL?.trim() || window.location.origin;

export const publicMediaUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const base = import.meta.env.VITE_R2_PUBLIC_BASE_URL?.trim();
  return base ? `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : path;
};
