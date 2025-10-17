import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { UploadProvider } from "@/contexts/UploadContext";
import ModernSidebar from "@/components/layout/ModernSidebar";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/dashboard";
import CreateBid from "@/pages/create-bid";
import BidCreation from "@/pages/bid-creation";
import AIInsights from "@/pages/ai-insights";
import RecommendationDashboard from "@/components/ai/recommendation-dashboard";
import Finance from "@/pages/finance";
import Meetings from "@/pages/meetings";
import UserManagement from "@/pages/user-management";
import AdminSettings from "@/pages/admin-settings";
import ActiveTenders from "@/pages/active-tenders-enhanced";
import TenderResults from "@/pages/tender-results";
import TenderDetail from "@/pages/tender-detail-enhanced";
import TenderDetailPage from "@/pages/tender-detail";
import MissedOpportunities from "@/pages/missed-opportunities";
import AssignedTenders from "@/pages/assigned-tenders";
import AdminNotRelevantRequests from "@/pages/admin-not-relevant-requests";
import NotRelevantTenders from "@/pages/not-relevant-tenders";
import UploadDemo from "@/pages/upload-demo";
import Login from "@/pages/login";
import Unauthorized from "@/pages/unauthorized";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
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
      
      {/* Protected routes with sidebar layout */}
      <Route>
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
          <ModernSidebar />
          <div className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/active-tenders" component={() => <ProtectedRoute requiredPermission="view_tenders"><ActiveTenders /></ProtectedRoute>} />
              <Route path="/tender/:id" component={() => <ProtectedRoute requiredPermission="view_tenders"><TenderDetail /></ProtectedRoute>} />
              <Route path="/assigned-tenders" component={() => <ProtectedRoute requiredPermission="create_bids"><AssignedTenders /></ProtectedRoute>} />
              <Route path="/not-relevant-tenders" component={() => <ProtectedRoute requiredPermission="view_tenders"><NotRelevantTenders /></ProtectedRoute>} />
              <Route path="/admin/not-relevant-requests" component={() => <ProtectedRoute requiredRole="admin"><AdminNotRelevantRequests /></ProtectedRoute>} />
              <Route path="/tender-results" component={() => <ProtectedRoute requiredPermission="view_tenders"><TenderResults /></ProtectedRoute>} />
              <Route path="/missed-opportunities" component={() => <ProtectedRoute requiredPermission="view_tenders"><MissedOpportunities /></ProtectedRoute>} />
              <Route path="/create-bid" component={() => <ProtectedRoute requiredPermission="create_bids"><CreateBid /></ProtectedRoute>} />
              <Route path="/bid-creation/:id?" component={() => <ProtectedRoute requiredPermission="create_bids"><BidCreation /></ProtectedRoute>} />
              <Route path="/ai-insights" component={() => <ProtectedRoute requiredPermission="use_ai_insights"><AIInsights /></ProtectedRoute>} />
              <Route path="/ai-recommendations" component={() => <ProtectedRoute requiredPermission="use_ai_insights"><RecommendationDashboard /></ProtectedRoute>} />
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <UploadProvider>
              <Toaster />
              <Router />
            </UploadProvider>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
