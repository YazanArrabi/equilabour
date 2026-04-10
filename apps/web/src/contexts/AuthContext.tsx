import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import * as authApi from "@/api/auth";
import { FORCE_LOGOUT_EVENT } from "@/api/client";

export interface AuthUser {
  userId: string;
  role: "worker" | "company";
  profileId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: authApi.LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser({ userId: data.id, role: data.role, profileId: data.profileId });
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  // Listen for force-logout events (fired by apiFetch when silent refresh fails)
  useEffect(() => {
    function handleForceLogout() {
      setUser(null);
    }
    window.addEventListener(FORCE_LOGOUT_EVENT, handleForceLogout);
    return () => window.removeEventListener(FORCE_LOGOUT_EVENT, handleForceLogout);
  }, []);

  const login = useCallback(
    async (input: authApi.LoginInput) => {
      await authApi.login(input);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
