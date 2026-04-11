export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly meta: Record<string, unknown>;

  constructor(status: number, code: string, message: string, meta: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.meta = meta;
  }
}

// Emitted when a silent refresh fails — AuthContext listens and clears user state.
export const FORCE_LOGOUT_EVENT = "equilabour:force-logout";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  _retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const json = (await response.json()) as {
    success: boolean;
    data?: T;
    error?: { code: string; message: string; [key: string]: unknown };
  };

  if (!response.ok) {
    // On 401 (expired access token), attempt one silent refresh then retry.
    if (response.status === 401 && _retry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return apiFetch<T>(path, init, false);
      }
      // Refresh also failed — force logout.
      window.dispatchEvent(new Event(FORCE_LOGOUT_EVENT));
    }

    const { code: errCode, message: errMessage, ...errMeta } = json.error ?? {};
    throw new ApiError(
      response.status,
      errCode ?? "UNKNOWN_ERROR",
      errMessage ?? "An unexpected error occurred.",
      errMeta,
    );
  }

  return json.data as T;
}
