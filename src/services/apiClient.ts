// ============================================================
// Centralized API Client with error handling, retry, and timeout
// ============================================================

import { toast } from "@/hooks/use-toast";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 2;

// Global error event for the error banner
type ErrorListener = (error: ApiError | Error) => void;
const errorListeners = new Set<ErrorListener>();

export function onApiError(listener: ErrorListener) {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

function notifyError(error: ApiError | Error) {
  errorListeners.forEach((fn) => fn(error));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, ...init } = options;
  const url = `${baseUrl}${path}`;
  const headers = { "Content-Type": "application/json", ...init.headers as Record<string, string> };

  let lastError: Error | ApiError = new Error("Request failed");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { ...init, headers }, timeout);

      if (res.status === 401) {
        const err = new ApiError(401, "Unauthorized");
        notifyError(err);
        // Future: redirect to login
        throw err;
      }

      if (!res.ok) {
        let body: unknown;
        try { body = await res.json(); } catch { /* ignore */ }
        const err = new ApiError(res.status, res.statusText, body);

        if (res.status >= 500 && attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          lastError = err;
          continue;
        }

        notifyError(err);
        throw err;
      }

      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof ApiError) throw err;

      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new Error("Request timed out");
      } else if (err instanceof TypeError) {
        lastError = new Error("Network error — check your connection");
      } else {
        lastError = err as Error;
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      notifyError(lastError);
      toast({
        title: "Connection Error",
        description: lastError.message + ". Click to retry.",
        variant: "destructive",
      });
      throw lastError;
    }
  }

  throw lastError;
}
