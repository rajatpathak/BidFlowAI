import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Refreshing user with token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('No token found, setting user to null');
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('User refresh response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('User data refreshed successfully:', userData);
        setUser(userData);
      } else {
        console.log('Invalid token, removing from localStorage');
        // Invalid token, remove it
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('User refresh completed');
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      console.log('Starting login process for:', credentials.username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          console.log('Login response data:', responseData);
          
          const { user: userData, token } = responseData;
          localStorage.setItem('auth_token', token);
          setUser(userData);
          
          console.log('Login successful, user set:', userData);
          
          toast({
            title: "Login Successful",
            description: `Welcome back, ${userData.name}!`,
          });
        } else {
          console.error('Server returned non-JSON response:', await response.text());
          throw new Error('Server returned non-JSON response');
        }
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          console.error('Login error response:', error);
          throw new Error(error.message || 'Login failed');
        } else {
          const errorText = await response.text();
          console.error('Login failed with HTML response:', errorText);
          throw new Error(`Login failed: Server returned HTML instead of JSON (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    }
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

  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    isLoading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}