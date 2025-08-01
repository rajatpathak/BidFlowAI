import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Unauthorized() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current User:</strong> {user.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Role:</strong> {user.role}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={() => navigate("/dashboard")} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button 
              onClick={logout} 
              variant="destructive" 
              className="w-full"
            >
              Logout & Switch User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}