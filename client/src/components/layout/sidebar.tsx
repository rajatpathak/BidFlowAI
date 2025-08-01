import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  FileText, 
  Plus, 
  FolderOpen, 
  Brain, 
  PieChart, 
  Settings, 
  User,
  DollarSign,
  Calendar,
  UserCog,
  FileSpreadsheet,
  Cog,
  Trophy,
  Upload,
  LogOut,
  Shield,
  History,
  Bell,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Active Tenders", href: "/active-tenders", icon: FileText },
  { name: "Assigned Tenders", href: "/assigned-tenders", icon: Bell },
  { name: "Not Relevant", href: "/not-relevant-tenders", icon: AlertTriangle },
  { name: "Tender Results", href: "/tender-results", icon: Trophy },
  { name: "Missed Opportunities", href: "/missed-opportunities", icon: AlertTriangle },
  { name: "Create Bid", href: "/create-bid", icon: Plus },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Finance", href: "/finance", icon: DollarSign },
  { name: "AI Insights", href: "/ai-insights", icon: Brain },
  { name: "AI Recommendations", href: "/ai-recommendations", icon: Lightbulb },
  { name: "User Management", href: "/user-management", icon: UserCog, adminOnly: true },
  { name: "Not Relevant Requests", href: "/admin/not-relevant-requests", icon: Shield, adminOnly: true },
  { name: "Admin Settings", href: "/admin-settings", icon: Cog, adminOnly: true },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout, hasPermission } = useAuth();

  return (
    <div className="hidden lg:flex lg:flex-shrink-0" style={{ zIndex: 10 }}>
      <div className="flex flex-col w-64 bg-white border-r border-gray-200" style={{ pointerEvents: 'auto' }}>
        {/* Logo Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BMS</span>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <Badge variant="outline" className="text-xs">
                  {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                  {user.role === 'finance_manager' && <DollarSign className="h-3 w-3 mr-1" />}
                  {user.role === 'bidder' && <FileText className="h-3 w-3 mr-1" />}
                  {user.role === 'admin' ? 'Admin' : 
                   user.role === 'finance_manager' ? 'Finance' : 'Bidder'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            // Filter navigation based on user role
            if (item.adminOnly && user?.role !== "admin") return null;
            if (item.href === "/finance" && user?.role !== "finance_manager" && user?.role !== "admin") return null;
            if (item.href === "/assigned-tenders" && user?.role !== "senior_bidder" && user?.role !== "junior_bidder" && user?.role !== "bidder") return null;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary",
                  isActive
                    ? "text-white bg-primary"
                    : "text-gray-700"
                )}
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => {
                  console.log('Menu item clicked:', item.name, item.href);
                  // Let wouter handle the navigation
                }}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-200">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
