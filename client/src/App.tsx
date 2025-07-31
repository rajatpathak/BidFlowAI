import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { UploadProvider } from "@/contexts/UploadContext";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import CreateBid from "@/pages/create-bid";
import AIInsights from "@/pages/ai-insights";
import Finance from "@/pages/finance";
import Meetings from "@/pages/meetings";
import UserManagement from "@/pages/user-management";
import AdminSettings from "@/pages/admin-settings";
import ActiveTenders from "@/pages/active-tenders-new";
import TenderResults from "@/pages/tender-results";
import TenderDetail from "@/pages/tender-detail";
import AssignedTenders from "@/pages/assigned-tenders";
import UploadDemo from "@/pages/upload-demo";
import Login from "@/pages/login";
import Unauthorized from "@/pages/unauthorized";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/unauthorized" component={Unauthorized} />
      
      {/* Protected routes with authenticated layout */}
      <Route>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/active-tenders" component={() => <ProtectedRoute requiredPermission="view_tenders"><ActiveTenders /></ProtectedRoute>} />
              <Route path="/tender/:id" component={() => <ProtectedRoute requiredPermission="view_tenders"><TenderDetail /></ProtectedRoute>} />
              <Route path="/assigned-tenders" component={() => <ProtectedRoute requiredPermission="create_bids"><AssignedTenders /></ProtectedRoute>} />
              <Route path="/tender-results" component={() => <ProtectedRoute requiredPermission="view_tenders"><TenderResults /></ProtectedRoute>} />
              <Route path="/create-bid" component={() => <ProtectedRoute requiredPermission="create_bids"><CreateBid /></ProtectedRoute>} />
              <Route path="/ai-insights" component={() => <ProtectedRoute requiredPermission="use_ai_insights"><AIInsights /></ProtectedRoute>} />
              <Route path="/finance" component={() => <ProtectedRoute requiredPermission="view_finance"><Finance /></ProtectedRoute>} />
              <Route path="/meetings" component={() => <ProtectedRoute><Meetings /></ProtectedRoute>} />
              <Route path="/user-management" component={() => <ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
              <Route path="/admin-settings" component={() => <ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
              <Route path="/upload-demo" component={() => <ProtectedRoute><UploadDemo /></ProtectedRoute>} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UploadProvider>
          <Toaster />
          <Router />
        </UploadProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
