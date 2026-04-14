import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { type AppUser, defaultUsers, type UserRole } from "@/data/usersData";
import { usersApi, authApi, setAuthToken } from "@/services/api";

export interface AccessScope {
  type: "subscription" | "resourceGroup";
  value: string;
}

/** Mock password map — only used for demo login */
const mockPasswords: Record<string, string> = {
  "admin@company.com": "admin123",
  "ajay@company.com": "viewer123",
  "sarah@company.com": "editor123",
  "mike@company.com": "viewer123",
};

interface AuthContextType {
  currentUser: AppUser;
  users: AppUser[];
  isAuthenticated: boolean;
  allowedSubscriptions: string[];
  allowedResourceGroups: string[];
  hasFullAccess: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: AppUser) => void;
  addUser: (user: AppUser) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateUser: (user: AppUser) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const STORAGE_KEY = "finops_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as AppUser;
        // In a real app, we might store the token separately
        // For simplicity, let's assume it's in the user object for now 
        // or check if we need a separate STORAGE_TOKEN_KEY
        return user;
      }
    } catch { /* ignore */ }
    return null;
  });

  const isAuthenticated = currentUser !== null;

  // Sync token to API layer
  useEffect(() => {
    if (currentUser && (currentUser as any).token) {
      setAuthToken((currentUser as any).token);
    } else {
      setAuthToken(null);
    }
  }, [currentUser]);

  // Persist to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        // Load roles first for mapping
        const rolesData = await usersApi.getRoles();
        setRoles(rolesData);

        const data = await usersApi.getAll();
        setUsers(data.map(u => ({
           id: u.id,
           name: u.name,
           email: u.email,
           role: typeof u.role === 'string' 
             ? (u.role as string).toLowerCase() as UserRole 
             : ((u as any).role?.name?.toLowerCase() || "viewer") as UserRole,
           department: u.department,
           assignedResourceGroups: u.assignedResourceGroups || [],
           scopes: u.scopes || [],
           lastActive: u.lastActive,
        } as AppUser)));
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [isAuthenticated]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login({ email, password });
      if (res && res.token) {
        const mappedUser: AppUser = {
          id: res.user.id,
          name: res.user.email.split('@')[0],
          email: res.user.email,
          role: res.user.role.toLowerCase() as UserRole,
          assignedResourceGroups: res.user.scopes || [],
          scopes: res.user.scopes.map(s => ({ type: "resourceGroup", value: s })),
        };
        (mappedUser as any).token = res.token;
        setCurrentUser(mappedUser);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addUser = useCallback(async (user: AppUser) => {
     try {
       let currentRoles = roles;
       let roleId = currentRoles.find(r => r.name.toLowerCase() === user.role.toLowerCase())?.id;
       
       if (!roleId) {
         currentRoles = await usersApi.getRoles();
         setRoles(currentRoles);
         roleId = currentRoles.find(r => r.name.toLowerCase() === user.role.toLowerCase())?.id;
       }
       if (!roleId) throw new Error(`Role '${user.role}' not found on the server.`);

       const dto = {
         user: {
           name: user.name,
           email: user.email,
           password: user.password || user.email, // Use email as default password if not provided
           roleId: roleId,
           department: user.department,
           isActive: true
         },
         scopes: user.scopes?.map(s => ({
           scopeType: s.type === "subscription" ? "Subscription" : "ResourceGroup",
           scopeValue: s.value
         })) || []
       };

       const created = await usersApi.create(dto);
       setUsers((prev) => [...prev, {
         ...user,
         id: created.id,
         role: user.role // Keep the UI role name
       }]);
     } catch (err) {
       console.error("Failed to add user", err);
       throw err; 
     }
  }, [roles]);

  const removeUser = useCallback(async (id: string) => {
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Failed to remove user", err);
    }
  }, []);

  const updateUser = useCallback(async (user: AppUser) => {
    try {
       let currentRoles = roles;
       let roleId = currentRoles.find(r => r.name.toLowerCase() === user.role.toLowerCase())?.id;
       
       if (!roleId) {
         currentRoles = await usersApi.getRoles();
         setRoles(currentRoles);
         roleId = currentRoles.find(r => r.name.toLowerCase() === user.role.toLowerCase())?.id;
       }
       if (!roleId) throw new Error(`Role '${user.role}' not found on the server.`);

      const dto = {
        user: {
          name: user.name,
          email: user.email,
          password: user.password, // Frontend logic usually doesn't send password on update unless changed
          roleId: roleId,
          department: user.department,
          isActive: true
        },
        scopes: user.scopes?.map(s => ({
          scopeType: s.type === "subscription" ? "Subscription" : "ResourceGroup",
          scopeValue: s.value
        })) || []
      };

      await usersApi.update(user.id, dto);
      setUsers((prev) => prev.map((u) => u.id === user.id ? user : u));
      if (currentUser && user.id === currentUser.id) setCurrentUser(user);
    } catch (err) {
      console.error("Failed to update user", err);
      throw err;
    }
  }, [currentUser, roles]);

  // Safe accessor — fallback to first default if not authenticated (guards downstream)
  const safeUser = currentUser || defaultUsers[0];

  const hasFullAccess = safeUser.role === "admin" || safeUser.role === "super admin" || (
    safeUser.assignedResourceGroups.length === 0 &&
    (!safeUser.scopes || safeUser.scopes.length === 0)
  );

  const allowedSubscriptions = useMemo(() => {
    if (hasFullAccess) return [];
    return (safeUser.scopes || [])
      .filter((s) => s.type === "subscription")
      .map((s) => s.value);
  }, [safeUser, hasFullAccess]);

  const allowedResourceGroups = useMemo(() => {
    if (hasFullAccess) return [];
    const fromScopes = (safeUser.scopes || [])
      .filter((s) => s.type === "resourceGroup")
      .map((s) => s.value);
    const legacy = safeUser.assignedResourceGroups || [];
    return [...new Set([...fromScopes, ...legacy])];
  }, [safeUser, hasFullAccess]);

  const value = useMemo(() => ({
    currentUser: safeUser,
    users,
    isAuthenticated,
    allowedSubscriptions,
    allowedResourceGroups,
    hasFullAccess,
    login,
    logout,
    setCurrentUser: (u: AppUser) => setCurrentUser(u),
    addUser,
    removeUser,
    updateUser,
    isLoading,
  }), [safeUser, users, isAuthenticated, allowedSubscriptions, allowedResourceGroups, hasFullAccess, login, logout, addUser, removeUser, updateUser, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
