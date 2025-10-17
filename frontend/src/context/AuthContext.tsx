import { createContext, useState, useContext, useMemo, type ReactNode } from 'react';

interface User {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'project_manager' | 'employee';
  no_of_hours: number;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const parsed: any = JSON.parse(raw);
      const normalized: User = {
        userId: String(parsed.userId ?? parsed.id ?? ''),
        email: parsed.email ?? '',
        name: parsed.name ?? `${parsed.first_name ?? ''} ${parsed.last_name ?? ''}`.trim(),
        role: parsed.role as User['role'],
        no_of_hours: typeof parsed.no_of_hours === 'number' ? parsed.no_of_hours : 40,
      };
      return normalized.userId ? normalized : null;
    } catch {
      return null;
    }
  });

  const login = (userData: any, token: string) => {
    const normalized: User = {
      userId: String(userData?.userId ?? userData?.id ?? ''),
      email: userData?.email ?? '',
      name: userData?.name ?? `${userData?.first_name ?? ''} ${userData?.last_name ?? ''}`.trim(),
      role: (userData?.role ?? 'employee') as User['role'],
      no_of_hours: typeof userData?.no_of_hours === 'number' ? userData.no_of_hours : 40,
      first_name: userData?.first_name,
      last_name: userData?.last_name,
    };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const authContextValue = useMemo(() => ({ user, login, logout, isAuthenticated: !!user }), [user]);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
