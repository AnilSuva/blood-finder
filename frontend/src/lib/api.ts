const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001').replace(/\/+$/, '');
let csrf: string | undefined;
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
async function csrfToken(forceRefresh = false): Promise<string> {
  if (csrf && !forceRefresh) return csrf;
  const response = await fetch(`${API_URL}/api/csrf`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to initialize secure session');
  csrf = (await response.json() as { csrfToken: string }).csrfToken;
  return csrf;
}
export async function api<T>(path: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
    headers.set('X-CSRF-Token', await csrfToken());
  }
  const response = await fetch(`${API_URL}/api${path}`, { ...options, method, headers, credentials: 'include' });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null) as T | { error?: { code: string; message: string } } | null;
  if (!response.ok) {
    const error = data as { error?: { code: string; message: string } } | null;
    const code = error?.error?.code ?? 'REQUEST_FAILED';
    const message = error?.error?.message ?? 'Something went wrong';

    // Auto-retry once on CSRF rejection
    if (response.status === 403 && code === 'CSRF_REJECTED' && retryCount === 0) {
      await csrfToken(true);
      return api<T>(path, options, retryCount + 1);
    }

    // Auto-refresh token and retry once on 401 for authenticated endpoints
    if (response.status === 401 && !path.startsWith('/auth/') && retryCount === 0) {
      try {
        await api<void>('/auth/refresh', { method: 'POST' }, 1);
        return api<T>(path, options, retryCount + 1);
      } catch {
        // Refresh failed, proceed to throw original 401
      }
    }

    throw new ApiError(response.status, code, message);
  }
  return data as T;
}
export const apiUrl = API_URL;
