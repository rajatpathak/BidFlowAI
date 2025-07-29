import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Verify token with server (optional - for enhanced security)
  const { data: verifiedUser, isLoading: isVerifying } = useQuery({
    queryKey: ['/api/auth/verify'],
    enabled: isAuthenticated && !!localStorage.getItem('auth_token'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // All permissions
      finance_manager: [
        'view_finance', 'manage_finance', 'approve_requests', 
        'view_reports', 'manage_budgets', 'view_tenders'
      ],
      senior_bidder: [
        'create_bids', 'view_tenders', 'manage_tenders', 
        'upload_documents', 'use_ai_insights', 'view_assignments'
      ],
      bidder: [
        'create_bids', 'view_tenders', 'manage_tenders', 
        'upload_documents', 'use_ai_insights', 'view_assignments'
      ]
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isVerifying,
    logout,
    hasPermission,
    hasRole,
  };
}