import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const LS_REFRESH_TOKEN_KEY = 'corner:refresh-token';
const LS_LAST_ACTIVE_KEY = 'corner:last-active';

/** Auto-logout if inactive for this many ms (30 days). Matches server refresh token TTL. */
const INACTIVITY_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;
/** Refresh the access token this many ms before it expires (access token is 15m → refresh at 14m). */
const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 14 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  plan: 'free' | 'pro';
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string; plan: 'free' | 'pro' };
}

export interface UseAuthReturn {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => string | null;
}

function recordActivity(): void {
  try {
    localStorage.setItem(LS_LAST_ACTIVE_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

function isSessionStale(): boolean {
  try {
    const raw = localStorage.getItem(LS_LAST_ACTIVE_KEY);
    if (!raw) return false; // no record → treat as fresh (first-time or migrated)
    const lastActive = parseInt(raw, 10);
    return Date.now() - lastActive > INACTIVITY_TIMEOUT_MS;
  } catch {
    return false;
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = accessToken;

  // ----- helpers -----

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(LS_REFRESH_TOKEN_KEY);
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const storedRefreshToken = localStorage.getItem(LS_REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return null;
    try {
      const res = await axios.post<{ accessToken: string; refreshToken: string }>(
        '/api/auth/refresh',
        { refreshToken: storedRefreshToken }
      );
      const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
      localStorage.setItem(LS_REFRESH_TOKEN_KEY, newRefresh);
      setAccessToken(newAccess);
      recordActivity();
      return newAccess;
    } catch (err) {
      // Only log out when the server says the token is invalid/expired (401).
      // Network errors, 5xx, or DB unavailable (503) should not log the user out.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401) {
        clearSession();
      }
      return null;
    }
  }, [clearSession]);

  const applyAuthResponse = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem(LS_REFRESH_TOKEN_KEY, data.refreshToken);
    recordActivity();
  }, []);

  // ----- session restore on mount -----

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(LS_REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      setLoading(false);
      return;
    }

    // If user has been inactive for > INACTIVITY_TIMEOUT_MS, clear the session
    if (isSessionStale()) {
      clearSession();
      setLoading(false);
      return;
    }

    axios
      .post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
        refreshToken: storedRefreshToken,
      })
      .then(async (res) => {
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
        localStorage.setItem(LS_REFRESH_TOKEN_KEY, newRefresh);
        setAccessToken(newAccess);
        recordActivity();

        const meRes = await axios.get<AuthUser>('/api/auth/me', {
          headers: { Authorization: `Bearer ${newAccess}` },
        });
        setUser(meRes.data);
      })
      .catch((err) => {
        // Only clear session when server says token is invalid/expired (401).
        // Network/5xx/503 should not log the user out — they can retry when back.
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 401) {
          clearSession();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- proactive access token refresh timer -----

  useEffect(() => {
    if (!user) return;

    // Refresh the access token every 14 minutes so it never expires mid-session
    const interval = setInterval(() => {
      const storedRefreshToken = localStorage.getItem(LS_REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) return;
      doRefresh();
    }, ACCESS_TOKEN_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, doRefresh]);

  // ----- activity tracking -----

  useEffect(() => {
    if (!user) return;

    // Update last-active timestamp on meaningful user events
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll'] as const;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const onActivity = () => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        recordActivity();
        debounceTimer = null;
      }, 60_000); // write at most once per minute
    };

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [user]);

  // ----- public API -----

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        const res = await axios.post<AuthResponse>('/api/auth/register', {
          email,
          password,
          displayName,
        });
        applyAuthResponse(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const code = err.response?.data?.code as string | undefined;
          if (code === 'EMAIL_EXISTS') throw new Error('EMAIL_EXISTS');
          const message = err.response?.data?.message as string | undefined;
          throw new Error(message ?? 'Registration failed');
        }
        throw new Error('Registration failed');
      }
    },
    [applyAuthResponse]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await axios.post<AuthResponse>('/api/auth/login', { email, password });
        applyAuthResponse(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const code = err.response?.data?.code as string | undefined;
          if (code === 'USER_NOT_FOUND') throw new Error('USER_NOT_FOUND');
          if (code === 'INVALID_CREDENTIALS') throw new Error('INVALID_CREDENTIALS');
          const message = err.response?.data?.message as string | undefined;
          throw new Error(message ?? 'Login failed');
        }
        throw new Error('Login failed');
      }
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(LS_REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
      axios.post('/api/auth/logout', { refreshToken: storedRefreshToken }).catch(() => {});
    }
    localStorage.removeItem(LS_LAST_ACTIVE_KEY);
    clearSession();
  }, [clearSession]);

  const getToken = useCallback(() => accessTokenRef.current, []);

  return { user, accessToken, loading, register, login, logout, getToken };
}
