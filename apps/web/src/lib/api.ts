import type { ApiResponse } from "@anilji/shared";

function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api-proxy";
  }
  return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;
}

export async function api<T>(
  path: string,
  options?: RequestInit & { auth?: boolean }
): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    cache: "no-store",
    credentials: options?.auth ? "include" : "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return res.json() as Promise<ApiResponse<T>>;
}

export async function apiPublic<T>(path: string, options?: RequestInit) {
  return api<T>(path, options);
}

export async function apiAuth<T>(path: string, options?: RequestInit) {
  return api<T>(path, { ...options, auth: true });
}
