import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/data/usersData";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  /** If set, only these roles may access the route */
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  // If used as a layout route wrapper, render Outlet; otherwise render children
  return <>{children ?? <Outlet />}</>;
}
