import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";
import AIRecommendations from "@/components/dashboard/ai-recommendations";
import TenderPipeline from "@/components/dashboard/tender-pipeline";
import ActiveTendersTable from "@/components/dashboard/active-tenders-table";
import AIFeaturesPanel from "@/components/dashboard/ai-features-panel";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">BMS Dashboard</h1>
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, John! Here's your tender overview.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Bid
              </Button>
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="p-6">
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AIRecommendations />
          <TenderPipeline />
        </div>

        <ActiveTendersTable />

        <AIFeaturesPanel />
      </main>
    </div>
  );
}
