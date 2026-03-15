// ============================================================
// Role-based access utility — prepared for backend RBAC
// ============================================================

export type AppRole = "admin" | "finance" | "viewer";

interface RolePermissions {
  canEditBudgets: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canViewInsights: boolean;
  canViewDashboard: boolean;
}

const rolePermissionsMap: Record<AppRole, RolePermissions> = {
  admin: {
    canEditBudgets: true,
    canManageUsers: true,
    canExportData: true,
    canViewInsights: true,
    canViewDashboard: true,
  },
  finance: {
    canEditBudgets: false,
    canManageUsers: false,
    canExportData: true,
    canViewInsights: true,
    canViewDashboard: true,
  },
  viewer: {
    canEditBudgets: false,
    canManageUsers: false,
    canExportData: false,
    canViewInsights: true,
    canViewDashboard: true,
  },
};

export function getPermissions(role: AppRole): RolePermissions {
  return rolePermissionsMap[role] || rolePermissionsMap.viewer;
}

export function hasPermission(role: AppRole, permission: keyof RolePermissions): boolean {
  return rolePermissionsMap[role]?.[permission] ?? false;
}

// Stub: in production this would read from auth context / JWT
let currentRole: AppRole = "admin";

export function getCurrentRole(): AppRole {
  return currentRole;
}

export function setCurrentRole(role: AppRole): void {
  currentRole = role;
}
