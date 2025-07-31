import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { TrendingUp, TrendingDown, Activity, FileText, DollarSign, Clock } from "lucide-react";
import { useDashboardStats } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, change, icon, description, variant = 'default' }: StatCardProps) {
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${getVariantColors()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-gray-500 mt-1">
            {change > 0 ? (
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
            )}
            <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function EnhancedStatsCards() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <LoadingSpinner />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <Activity className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load dashboard statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  // Role-based stat visibility
  const showFinanceStats = user?.role === 'admin' || user?.role === 'finance_manager';
  const showFullStats = user?.role === 'admin';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Tenders"
        value={formatNumber(stats.activeTenders || 0)}
        icon={<FileText className="h-4 w-4 text-blue-600" />}
        description="Currently open for bidding"
        variant="default"
      />
      
      <StatCard
        title="Win Rate"
        value={`${(stats.winRate || 0).toFixed(1)}%`}
        change={stats.winRateChange}
        icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        description="Success rate this quarter"
        variant="success"
      />
      
      {showFinanceStats && (
        <StatCard
          title="Total Pipeline Value"
          value={formatCurrency(stats.totalValue || 0)}
          icon={<DollarSign className="h-4 w-4 text-purple-600" />}
          description="Combined tender values"
          variant="default"
        />
      )}
      
      <StatCard
        title="Upcoming Deadlines"
        value={formatNumber(stats.upcomingDeadlines || 0)}
        icon={<Clock className="h-4 w-4 text-orange-600" />}
        description="Next 7 days"
        variant={stats.upcomingDeadlines > 5 ? "warning" : "default"}
      />
      
      {showFullStats && (
        <>
          <StatCard
            title="Pending Finance Requests"
            value={formatNumber(stats.pendingFinanceRequests || 0)}
            icon={<Activity className="h-4 w-4 text-red-600" />}
            description="Awaiting approval"
            variant={stats.pendingFinanceRequests > 0 ? "danger" : "success"}
          />
          
          <StatCard
            title="Completed Tasks"
            value={formatNumber(stats.completedTasks || 0)}
            change={stats.completedTasksChange}
            icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            description="This month"
            variant="success"
          />
        </>
      )}
    </div>
  );
}