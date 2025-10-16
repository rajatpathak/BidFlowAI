import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import EnhancedStatsCards from "@/components/dashboard/enhanced-stats-cards";
import AIRecommendations from "@/components/dashboard/ai-recommendations";
import TenderPipeline from "@/components/dashboard/tender-pipeline";
import DynamicTenderTable from "@/components/dashboard/dynamic-tender-table";
import AIFeaturesPanel from "@/components/dashboard/ai-features-panel";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  
  const actions = (
    <div className="flex items-center space-x-3">
      <Button className="bg-gradient-primary hover:scale-105 transition-transform shadow-lg">
        <Plus className="h-4 w-4 mr-2" />
        Create New Bid
      </Button>
      <Button variant="outline" className="hover-scale">
        <TrendingUp className="h-4 w-4 mr-2" />
        Analytics
      </Button>
    </div>
  );

  const breadcrumbs = [
    { label: "Overview" }
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user?.name || 'User'}! Here's your comprehensive tender overview and AI-powered insights.`}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Cards */}
          <div className="animate-slide-up">
            <EnhancedStatsCards />
          </div>

          {/* AI and Pipeline Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <AIRecommendations />
            <TenderPipeline />
          </div>

          {/* Main Table */}
          <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
            <DynamicTenderTable />
          </div>

          {/* AI Features Panel */}
          <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
            <AIFeaturesPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
