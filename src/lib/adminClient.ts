import { apiUrl } from "./environment";
import { supabase } from "./supabase";
export type Row = Record<string, any>;
export async function adminRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error("Sign in to continue");
  const response = await fetch(apiUrl(path), {
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
