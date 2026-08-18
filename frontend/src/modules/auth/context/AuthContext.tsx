import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getMe, login as loginRequest, register as registerRequest } from '../services/auth.service';
import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from '../session';
import type { AuthUser } from '../types/auth.types';

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    getToken() ? getStoredUser() : null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();

    if (!token || !stored) {
      clearSession();
      setReady(true);
      return;
    }

    setUser(stored);

    void getMe()
      .then((current) => {
        saveSession(token, current);
        setUser(current);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      isClient: user?.role === 'CLIENT',
      async login(email, password) {
        const response = await loginRequest({ email, password });
        saveSession(response.accessToken, response.user);
        setUser(response.user);
        return response.user;
      },
      async register(name, email, password) {
        const response = await registerRequest({ name, email, password });
        saveSession(response.accessToken, response.user);
        setUser(response.user);
        return response.user;
      },
      logout() {
        clearSession();
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider');
  }

  return context;
}
