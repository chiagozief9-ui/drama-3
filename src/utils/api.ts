/**
 * Secure API fetch wrapper that guarantees authentication headers and credentials
 * are sent correctly across iframes, third-party cookie restrictions, and mobile browsers.
 */

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('aidrama_token');
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('aidrama_token', token);
    } else {
      localStorage.removeItem('aidrama_token');
    }
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (token && !headers.has('X-Session-Token')) {
    headers.set('X-Session-Token', token);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
