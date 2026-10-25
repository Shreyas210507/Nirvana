/**
 * Client API library for Nirvana Authentication.
 * Interacts directly with the FastAPI backend at /api/auth.
 */

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'citizen' | 'municipal' | 'admin' | 'responder';
  ward_id?: string | null;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone?: string;
  role?: string;
  ward_id?: string;
  terms_agreed: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface ForgotPasswordResponse {
  status: string;
  message: string;
  dev_reset_token?: string | null;
  dev_reset_url?: string | null;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  ward_id?: string;
}

// Storage keys
const TOKEN_KEY = 'nirvana_access_token';
const REFRESH_KEY = 'nirvana_refresh_token';
const USER_KEY = 'nirvana_user_cache';

// Helper to get the base API URL
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // In browser, relative '/api' goes through Next.js proxy rewrite to FastAPI port 8000
    return '';
  }
  return process.env.API_URL || 'http://localhost:8000';
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(data: AuthResponse, rememberMe: boolean = true): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  if (!rememberMe) {
    sessionStorage.setItem('nirvana_session_active', '1');
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('nirvana_session_active');
}

/**
 * Perform an authenticated fetch request with automatic token header.
 */
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getStoredAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network request failed';
    throw new Error(
      `Unable to reach authentication server. Please ensure the backend is running at http://localhost:8000. Details: ${errorMsg}`
    );
  }
}

// Auth API Methods
export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed. Please check your information.');
  }

  saveAuthSession(data, true);
  return data;
}

export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  const res = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Invalid email or password.');
  }

  saveAuthSession(data, payload.remember_me ?? false);
  return data;
}

export async function apiGetMe(): Promise<AuthUser> {
  const res = await authFetch('/api/auth/me', {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to retrieve user profile.');
  }

  const user: AuthUser = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  return user;
}

export async function apiLogout(): Promise<void> {
  try {
    await authFetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch {
    // Ignore backend logout error, clear locally
  } finally {
    clearAuthSession();
  }
}

export async function apiRefreshToken(): Promise<AuthResponse | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await authFetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearAuthSession();
      return null;
    }

    const data: AuthResponse = await res.json();
    saveAuthSession(data, true);
    return data;
  } catch {
    return null;
  }
}

export async function apiForgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const res = await authFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to submit password reset request.');
  }
  return data;
}

export async function apiResetPassword(payload: ResetPasswordPayload): Promise<{ status: string; message: string }> {
  const res = await authFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to reset password.');
  }
  return data;
}

export async function apiUpdateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const res = await authFetch('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update profile.');
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(data));
  }
  return data;
}
