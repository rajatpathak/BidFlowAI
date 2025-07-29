import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Tenders from "@/pages/tenders";
import CreateBid from "@/pages/create-bid";
import AIInsights from "@/pages/ai-insights";
import Finance from "@/pages/finance";
import Meetings from "@/pages/meetings";
import UserManagement from "@/pages/user-management";
import AdminSettings from "@/pages/admin-settings";
import EnhancedTenders from "@/pages/enhanced-tenders";
import TenderResults from "@/pages/tender-results";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/tenders" component={Tenders} />
          <Route path="/create-bid" component={CreateBid} />
          <Route path="/ai-insights" component={AIInsights} />
          <Route path="/finance" component={Finance} />
          <Route path="/meetings" component={Meetings} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/admin-settings" component={AdminSettings} />
          <Route path="/enhanced-tenders" component={EnhancedTenders} />
          <Route path="/tender-results" component={TenderResults} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
