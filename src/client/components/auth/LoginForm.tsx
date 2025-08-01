import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, User, AlertCircle } from "lucide-react";

const demoAccounts = [
  {
    role: "System Administrator",
    username: "admin",
    password: "admin123",
    description: "Full system access with all permissions",
    color: "bg-red-50 border-red-200 text-red-800"
  },
  {
    role: "Senior Bidder",
    username: "rahul.kumar",
    password: "bidder123", 
    description: "Bid creation and tender management",
    color: "bg-blue-50 border-blue-200 text-blue-800"
  },
  {
    role: "Finance Manager",
    username: "priya.sharma",
    password: "finance123",
    description: "Financial operations and approvals",
    color: "bg-green-50 border-green-200 text-green-800"
  }
];

export default function LoginForm() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleDemoLogin = (username: string, password: string) => {
    setCredentials({ username, password });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Bid Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="pl-10"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="Signing in..." />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAccounts.map((account) => (
              <div
                key={account.username}
                className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${account.color}`}
                onClick={() => handleDemoLogin(account.username, account.password)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{account.role}</div>
                    <div className="text-xs opacity-75 mt-1">{account.description}</div>
                    <div className="text-xs font-mono mt-2">
                      {account.username} / {account.password}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}