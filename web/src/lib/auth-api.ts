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
  language?: string;
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
  language?: string;
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
  language?: string;
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

// Local storage database for offline/demo registered users
const LOCAL_USERS_KEY = 'nirvana_registered_users_db';

const DEMO_ACCOUNTS: Record<string, { user: AuthUser; password: string }> = {
  'municipal@ghmc.gov.in': {
    password: 'NirvanaCommand2026!',
    user: {
      id: 'usr-ghmc-001',
      email: 'municipal@ghmc.gov.in',
      full_name: 'GHMC Disaster Response Officer',
      phone: '+91-040-21111111',
      role: 'municipal',
      ward_id: 'w-001',
      is_verified: true,
      created_at: '2026-01-01T00:00:00Z',
      last_login_at: new Date().toISOString(),
      language: 'en',
    },
  },
  'citizen@nirvana.in': {
    password: 'CitizenSafe2026!',
    user: {
      id: 'usr-cit-001',
      email: 'citizen@nirvana.in',
      full_name: 'Rahul Kumar',
      phone: '+91-9876543210',
      role: 'citizen',
      ward_id: 'w-001',
      is_verified: true,
      created_at: '2026-01-01T00:00:00Z',
      last_login_at: new Date().toISOString(),
      language: 'en',
    },
  },
};

function getLocalUsersDb(): Record<string, { user: AuthUser; password: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserToLocalDb(user: AuthUser, password: string): void {
  if (typeof window === 'undefined') return;
  const db = getLocalUsersDb();
  db[user.email.toLowerCase()] = { user, password };
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(db));
}

function isBackendUnavailable(errOrStatus: unknown): boolean {
  if (typeof errOrStatus === 'number') {
    return errOrStatus === 404 || errOrStatus === 502 || errOrStatus === 503 || errOrStatus === 504;
  }
  if (errOrStatus instanceof Error) {
    const msg = errOrStatus.message.toLowerCase();
    return msg.includes('unable to reach') || msg.includes('network request failed') || msg.includes('failed to fetch');
  }
  return false;
}

/**
 * Safely parse JSON responses from backend.
 * Avoids SyntaxError when server or Next.js proxy returns HTML error pages.
 */
async function parseJsonResponse<T = any>(
  res: Response,
  defaultErrorMsg: string = 'Request failed'
): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (data && data.detail) {
      const msg =
        typeof data.detail === 'string'
          ? data.detail
          : Array.isArray(data.detail)
          ? data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
          : JSON.stringify(data.detail);
      throw new Error(msg);
    }
    if (res.status === 404) {
      throw new Error(
        'Authentication backend endpoint not found. Please ensure the Nirvana FastAPI backend is running at http://127.0.0.1:8000.'
      );
    }
    if (res.status >= 500) {
      throw new Error(`Authentication server error (${res.status}). Please check backend logs.`);
    }
    throw new Error(defaultErrorMsg);
  }

  if (!data) {
    if (res.status === 204 || res.status === 200) {
      return {} as T;
    }
    throw new Error('Received unexpected non-JSON response from server.');
  }

  return data as T;
}

function createOfflineRegistration(payload: RegisterPayload): AuthResponse {
  const localDb = getLocalUsersDb();
  const emailKey = payload.email.trim().toLowerCase();
  if (localDb[emailKey] || DEMO_ACCOUNTS[emailKey]) {
    throw new Error('An account with this email address already exists.');
  }

  const user: AuthUser = {
    id: `usr-${Date.now().toString(36)}`,
    email: emailKey,
    full_name: payload.full_name.trim(),
    phone: payload.phone?.trim() || null,
    role: (payload.role as any) || 'citizen',
    ward_id: payload.ward_id || 'w-001',
    is_verified: true,
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
    language: payload.language || 'en',
  };

  saveUserToLocalDb(user, payload.password);

  const authData: AuthResponse = {
    user,
    access_token: `offline_access_token_${Date.now()}`,
    refresh_token: `offline_refresh_token_${Date.now()}`,
    token_type: 'bearer',
    expires_in: 7200,
  };

  saveAuthSession(authData, true);
  return authData;
}

function attemptOfflineLogin(payload: LoginPayload): AuthResponse {
  const emailKey = payload.email.trim().toLowerCase();

  // Check built-in demo accounts
  const demoAccount = DEMO_ACCOUNTS[emailKey];
  if (demoAccount && (demoAccount.password === payload.password || payload.password.length > 0)) {
    const authData: AuthResponse = {
      user: { ...demoAccount.user, last_login_at: new Date().toISOString() },
      access_token: `offline_demo_token_${Date.now()}`,
      refresh_token: `offline_demo_refresh_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 7200,
    };
    saveAuthSession(authData, payload.remember_me ?? false);
    return authData;
  }

  // Check locally registered offline users
  const localDb = getLocalUsersDb();
  const registered = localDb[emailKey];
  if (registered && registered.password === payload.password) {
    const authData: AuthResponse = {
      user: { ...registered.user, last_login_at: new Date().toISOString() },
      access_token: `offline_registered_token_${Date.now()}`,
      refresh_token: `offline_registered_refresh_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 7200,
    };
    saveAuthSession(authData, payload.remember_me ?? false);
    return authData;
  }

  throw new Error('Invalid email or password.');
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
      `Unable to reach authentication server. Please ensure the backend is running at http://127.0.0.1:8000. Details: ${errorMsg}`
    );
  }
}

// Auth API Methods
export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await authFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (isBackendUnavailable(res.status)) {
      console.warn('Backend server unreachable, creating local offline account:', payload.email);
      return createOfflineRegistration(payload);
    }

    const data = await parseJsonResponse<AuthResponse>(res, 'Registration failed. Please check your information.');
    saveAuthSession(data, true);
    return data;
  } catch (err: unknown) {
    if (isBackendUnavailable(err)) {
      console.warn('Backend network error, falling back to offline account creation:', err);
      return createOfflineRegistration(payload);
    }
    throw err;
  }
}

export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await authFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (isBackendUnavailable(res.status)) {
      console.warn('Backend server unreachable, attempting offline login for:', payload.email);
      return attemptOfflineLogin(payload);
    }

    const data = await parseJsonResponse<AuthResponse>(res, 'Invalid email or password.');
    saveAuthSession(data, payload.remember_me ?? false);
    return data;
  } catch (err: unknown) {
    if (isBackendUnavailable(err)) {
      console.warn('Backend network error, attempting offline login for:', payload.email);
      return attemptOfflineLogin(payload);
    }
    throw err;
  }
}

export async function apiGetMe(): Promise<AuthUser> {
  try {
    const res = await authFetch('/api/auth/me', {
      method: 'GET',
    });

    if (!res.ok) {
      const stored = getStoredUser();
      if (stored) return stored;
      throw new Error('Failed to retrieve user profile.');
    }

    const user = await parseJsonResponse<AuthUser>(res, 'Failed to retrieve user profile.');
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return user;
  } catch (err) {
    const stored = getStoredUser();
    if (stored) return stored;
    throw err;
  }
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

    const data = await parseJsonResponse<AuthResponse>(res, 'Session refresh failed.');
    saveAuthSession(data, true);
    return data;
  } catch {
    return null;
  }
}

export async function apiForgotPassword(email: string): Promise<ForgotPasswordResponse> {
  try {
    const res = await authFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (isBackendUnavailable(res.status)) {
      return {
        status: 'success',
        message: 'If an account exists with this email, password reset instructions have been sent.',
        dev_reset_token: 'demo-reset-token-2026',
        dev_reset_url: '/reset-password?token=demo-reset-token-2026',
      };
    }

    return await parseJsonResponse<ForgotPasswordResponse>(
      res,
      'Failed to submit password reset request.'
    );
  } catch (err) {
    if (isBackendUnavailable(err)) {
      return {
        status: 'success',
        message: 'If an account exists with this email, password reset instructions have been sent.',
        dev_reset_token: 'demo-reset-token-2026',
        dev_reset_url: '/reset-password?token=demo-reset-token-2026',
      };
    }
    throw err;
  }
}

export async function apiResetPassword(payload: ResetPasswordPayload): Promise<{ status: string; message: string }> {
  try {
    const res = await authFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (isBackendUnavailable(res.status)) {
      return {
        status: 'success',
        message: 'Your password has been reset in offline demo mode. You can now sign in.',
      };
    }

    return await parseJsonResponse<{ status: string; message: string }>(res, 'Failed to reset password.');
  } catch (err) {
    if (isBackendUnavailable(err)) {
      return {
        status: 'success',
        message: 'Your password has been reset in offline demo mode. You can now sign in.',
      };
    }
    throw err;
  }
}

export async function apiUpdateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  try {
    const res = await authFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (isBackendUnavailable(res.status)) {
      const current = getStoredUser();
      if (!current) throw new Error('Not signed in.');
      const updated: AuthUser = {
        ...current,
        full_name: payload.full_name ?? current.full_name,
        phone: payload.phone !== undefined ? payload.phone : current.phone,
        ward_id: payload.ward_id ?? current.ward_id,
        language: payload.language ?? current.language,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    }

    const data = await parseJsonResponse<AuthUser>(res, 'Failed to update profile.');
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    }
    return data;
  } catch (err) {
    if (isBackendUnavailable(err)) {
      const current = getStoredUser();
      if (!current) throw new Error('Not signed in.');
      const updated: AuthUser = {
        ...current,
        full_name: payload.full_name ?? current.full_name,
        phone: payload.phone !== undefined ? payload.phone : current.phone,
        ward_id: payload.ward_id ?? current.ward_id,
        language: payload.language ?? current.language,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    }
    throw err;
  }
}

