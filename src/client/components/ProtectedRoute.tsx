import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredRole, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isAuthenticated && user) {
      // Check role requirement
      if (requiredRole && !hasRole(requiredRole)) {
        navigate("/unauthorized");
        return;
      }

      // Check permission requirement
      if (requiredPermission && !hasPermission(requiredPermission)) {
        navigate("/unauthorized");
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, requiredPermission, navigate, hasRole, hasPermission]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null; // Will redirect to unauthorized
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null; // Will redirect to unauthorized
  }

  return <>{children}</>;
}