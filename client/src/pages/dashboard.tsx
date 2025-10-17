import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, LayoutGrid, LayoutList } from "lucide-react";
import EnhancedStatsCards from "@/components/dashboard/enhanced-stats-cards";
import AIRecommendations from "@/components/dashboard/ai-recommendations";
import TenderPipeline from "@/components/dashboard/tender-pipeline";
import DynamicTenderTable from "@/components/dashboard/dynamic-tender-table";
import AIFeaturesPanel from "@/components/dashboard/ai-features-panel";
import DashboardStatsEnhanced from "@/components/dashboard/dashboard-stats-enhanced";
import TenderReminders from "@/components/dashboard/tender-reminders";
import CalendarWidget from "@/components/dashboard/calendar-widget";
import TenderSubmitChart from "@/components/dashboard/tender-submit-chart";
import TenderCardEnhanced from "@/components/dashboard/tender-card-enhanced";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"enhanced" | "classic">("enhanced");
  
  const actions = (
    <div className="flex items-center space-x-3">
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <Button
          variant={viewMode === "enhanced" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("enhanced")}
          className="h-8"
          data-testid="button-enhanced-view"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Enhanced
        </Button>
        <Button
          variant={viewMode === "classic" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("classic")}
          className="h-8"
          data-testid="button-classic-view"
        >
          <LayoutList className="h-4 w-4 mr-2" />
          Classic
        </Button>
      </div>
      <Button className="bg-gradient-primary hover:scale-105 transition-transform shadow-lg" data-testid="button-create-bid">
        <Plus className="h-4 w-4 mr-2" />
        Create New Bid
      </Button>
      <Button variant="outline" className="hover-scale" data-testid="button-analytics">
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
          {viewMode === "enhanced" ? (
            <>
              {/* Enhanced Dashboard View */}
              <div className="animate-slide-up">
                <DashboardStatsEnhanced />
              </div>

              {/* Calendar and Reminders Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <div className="lg:col-span-1">
                  <CalendarWidget />
                </div>
                <div className="lg:col-span-2">
                  <TenderReminders />
                </div>
              </div>

              {/* Featured Tender Card */}
              <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
                <TenderCardEnhanced />
              </div>

              {/* Submit Status Chart */}
              <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
                <TenderSubmitChart />
              </div>
            </>
          ) : (
            <>
              {/* Classic Dashboard View */}
              <div className="animate-slide-up">
                <EnhancedStatsCards />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <AIRecommendations />
                <TenderPipeline />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
                <DynamicTenderTable />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
                <AIFeaturesPanel />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
