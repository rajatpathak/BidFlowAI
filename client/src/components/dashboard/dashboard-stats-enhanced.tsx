import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Trophy,
  Clock,
  Send,
  Users,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type DashboardStats = {
  freshTenders: number;
  freshTendersChange: number;
  tenderResults: number;
  tenderResultsChange: number;
  inProgressTenders: number;
  inProgressChange: number;
  submittedTenders: number;
  submittedChange: number;
  unassignedTenders: number;
  unassignedChange: number;
};

export default function DashboardStatsEnhanced() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/enhanced-stats"],
  });

  const statCards = [
    {
      title: "Fresh Tenders",
      value: stats?.freshTenders || 40689,
      change: stats?.freshTendersChange || 8.5,
      icon: FileText,
      color: "blue",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Tender Result",
      value: stats?.tenderResults || 40689,
      change: stats?.tenderResultsChange || 8.5,
      icon: Trophy,
      color: "green",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      title: "In-Progress Tender",
      value: stats?.inProgressTenders || 40689,
      change: stats?.inProgressChange || 8.5,
      icon: Clock,
      color: "orange",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
    {
      title: "Submitted Tenders",
      value: stats?.submittedTenders || 40689,
      change: stats?.submittedChange || 8.5,
      icon: Send,
      color: "purple",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      title: "Unassigned Tenders",
      value: stats?.unassignedTenders || 40689,
      change: stats?.unassignedChange || 8.5,
      icon: Users,
      color: "red",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
    },
    {
      title: "Tender Result",
      value: stats?.tenderResults || 40689,
      change: stats?.tenderResultsChange || 8.5,
      icon: Trophy,
      color: "indigo",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="dashboard-stats-enhanced">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className={`${stat.bgColor} ${stat.borderColor} border`}
          data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s/g, '-')}`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-3xl font-bold ${stat.iconColor}`} data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
                    {stat.value.toLocaleString()}
                  </h3>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {stat.change > 0 ? (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stat.change)}% Up from yesterday
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
