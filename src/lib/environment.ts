/** All environment-dependent service addresses live here. Vite substitutes these at build time. */
export const environment = {
  apiBase: (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, ""),
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || "")
    .trim()
    .replace(/\/$/, ""),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim(),
  riderUrl: (import.meta.env.VITE_APP_URL || "").trim(),
};
export function apiUrl(path: string) {
  if (!environment.apiBase)
    throw new Error("Configure VITE_API_BASE_URL for this environment");
  return `${environment.apiBase}${path}`;
}
