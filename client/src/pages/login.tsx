import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Shield, DollarSign, Users } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "Login Successful",
        description: `Welcome ${data.user.name}!`,
      });
      // Force reload to ensure clean authentication state
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const demoAccounts = [
    {
      username: "admin",
      password: "admin123",
      role: "System Administrator",
      description: "Full access to all system features",
      icon: Shield,
      color: "bg-red-100 text-red-800",
      permissions: ["User Management", "System Settings", "All Reports", "Data Management"]
    },
    {
      username: "finance_manager",
      password: "finance123",
      role: "Finance Manager",
      description: "Manage EMD/PBG requests and financial approvals",
      icon: DollarSign,
      color: "bg-green-100 text-green-800",
      permissions: ["Finance Requests", "Budget Approval", "Financial Reports", "Cost Analysis"]
    },
    {
      username: "senior_bidder",
      password: "bidder123",
      role: "Senior Bidder",
      description: "Create and manage bids, tender assignments",
      icon: Building2,
      color: "bg-blue-100 text-blue-800",
      permissions: ["Bid Creation", "Tender Management", "AI Insights", "Document Upload"]
    }
  ];

  const quickLogin = (account: typeof demoAccounts[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    loginMutation.mutate({ username: account.username, password: account.password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your Bid Management System account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demo Accounts</h2>
            <p className="text-gray-600">
              Click any account below to login instantly and explore role-specific features
            </p>
          </div>

          <div className="space-y-4">
            {demoAccounts.map((account) => {
              const IconComponent = account.icon;
              return (
                <Card 
                  key={account.username}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
                  onClick={() => quickLogin(account)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${account.color.replace('text-', 'bg-').replace('800', '200')}`}>
                        <IconComponent className={`h-6 w-6 ${account.color.replace('bg-', 'text-').replace('100', '600')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{account.role}</h3>
                          <Badge className={account.color}>
                            {account.username}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{account.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {account.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {account.username} / {account.password}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
              <Users className="h-4 w-4" />
              <span>All demo accounts are pre-configured with appropriate permissions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}