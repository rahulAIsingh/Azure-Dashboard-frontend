import type { AccessScope } from "@/types/dashboardTypes";

export type UserRole = "admin" | "viewer" | "editor";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  assignedResourceGroups: string[]; // legacy — kept for compat
  scopes?: AccessScope[];
  avatar?: string;
  department?: string;
  lastActive?: string;
}

export const defaultUsers: AppUser[] = [
  {
    id: "user-admin",
    name: "Admin User",
    email: "admin@company.com",
    password: "admin123",
    role: "admin",
    assignedResourceGroups: [],
    scopes: [],
    department: "IT Operations",
    lastActive: new Date().toISOString(),
  }
];

export const roleColors: Record<UserRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  editor: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  viewer: "bg-accent/10 text-accent border-accent/30",
};

export const roleDescriptions: Record<UserRole, string> = {
  admin: "Full access to all resource groups and settings",
  editor: "Can view and modify assigned scopes",
  viewer: "Read-only access to assigned scopes",
};
