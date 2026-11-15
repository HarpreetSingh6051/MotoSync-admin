import { supabase } from "./supabase";
export type Row = Record<string, any>;
export async function adminRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in to continue");
  const base = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1"
  ).replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(". ")
        : data?.message || `Request failed (${response.status})`,
    );
  return data;
}
