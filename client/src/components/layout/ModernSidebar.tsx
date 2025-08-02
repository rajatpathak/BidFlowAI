import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  FileText, 
  Plus, 
  Package,
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
  Lightbulb,
  Home,
  Zap,
  Target,
  TrendingUp,
  ChevronRight,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  category?: string;
  badge?: string;
  description?: string;
}

const navigationSections = {
  "Overview": [
    { name: "Dashboard", href: "/", icon: Home, description: "Main overview and statistics" },
    { name: "AI Insights", href: "/ai-insights", icon: Brain, description: "AI-powered analytics" },
    { name: "AI Recommendations", href: "/ai-recommendations", icon: Lightbulb, description: "Smart suggestions" },
  ],
  "Tenders": [
    { name: "Active Tenders", href: "/active-tenders", icon: Activity, description: "Current opportunities" },
    { name: "Assigned Tenders", href: "/assigned-tenders", icon: Target, description: "Your assigned work" },
    { name: "Not Relevant", href: "/not-relevant-tenders", icon: AlertTriangle, description: "Filtered opportunities" },
    { name: "Tender Results", href: "/tender-results", icon: Trophy, description: "Win/loss tracking" },
    { name: "Missed Opportunities", href: "/missed-opportunities", icon: History, description: "Past opportunities" },
  ],
  "Work": [
    { name: "Create Bid", href: "/create-bid", icon: Plus, description: "Start new proposal" },
    { name: "Bid Documents", href: "/bid-creation", icon: Package, description: "Document management" },
    { name: "Meetings", href: "/meetings", icon: Calendar, description: "Schedule and track" },
    { name: "Finance", href: "/finance", icon: DollarSign, description: "Budget and costs" },
  ],
  "Administration": [
    { name: "User Management", href: "/user-management", icon: UserCog, adminOnly: true, description: "Manage team access" },
    { name: "Not Relevant Requests", href: "/admin/not-relevant-requests", icon: Shield, adminOnly: true, description: "Review submissions" },
    { name: "Admin Settings", href: "/admin-settings", icon: Cog, adminOnly: true, description: "System configuration" },
  ]
};

export default function ModernSidebar() {
  const [location] = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-determine active section based on current route
  useEffect(() => {
    for (const [section, items] of Object.entries(navigationSections)) {
      if (items.some(item => item.href === location)) {
        setActiveSection(section);
        break;
      }
    }
  }, [location]);

  const NavigationSection = ({ title, items }: { title: string; items: NavigationItem[] }) => {
    const filteredItems = items.filter(item => {
      // Filter based on permissions
      if (item.adminOnly && user?.role !== "admin") return false;
      if (item.href === "/finance" && user?.role !== "finance_manager" && user?.role !== "admin") return false;
      if (item.href === "/assigned-tenders" && !["senior_bidder", "junior_bidder", "bidder"].includes(user?.role || "")) return false;
      return true;
    });

    if (filteredItems.length === 0) return null;

    const isExpanded = activeSection === title;

    return (
      <div className="mb-6">
        <div 
          className={cn(
            "flex items-center justify-between px-3 py-2 mb-2 rounded-lg cursor-pointer transition-all-smooth",
            "hover:bg-gray-50 dark:hover:bg-gray-800/50",
            isExpanded ? "bg-gray-50 dark:bg-gray-800/50" : ""
          )}
          onClick={() => setActiveSection(isExpanded ? null : title)}
        >
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
          <ChevronRight 
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isExpanded ? "rotate-90" : ""
            )}
          />
        </div>
        
        <div className={cn(
          "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-3 rounded-xl transition-all-smooth cursor-pointer",
                  "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
                  "hover:shadow-sm hover:scale-[1.02] transform",
                  isActive
                    ? "bg-gradient-primary text-white shadow-lg shadow-blue-500/25"
                    : "text-gray-700 dark:text-gray-300"
                )}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: isExpanded ? "slideUp 0.3s ease-out forwards" : "none"
                }}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg mr-3 transition-all-smooth",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-md"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium transition-colors-smooth",
                    isActive ? "text-white" : "text-gray-900 dark:text-gray-100 group-hover:text-gray-900"
                  )}>
                    {item.name}
                  </div>
                  {item.description && (
                    <div className={cn(
                      "text-xs transition-colors-smooth mt-0.5",
                      isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600"
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>

                {item.badge && (
                  <Badge 
                    variant={isActive ? "secondary" : "outline"} 
                    className="ml-2 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="hidden lg:flex lg:flex-shrink-0 animate-slide-in-left" style={{ zIndex: 10 }}>
      <div className={cn(
        "flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all-smooth",
        "shadow-xl backdrop-blur-sm",
        isCollapsed ? "w-16" : "w-80"
      )} style={{ pointerEvents: 'auto' }}>
        
        {/* Logo Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-primary animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="text-white">
                <div className="text-xl font-bold">BidFlow AI</div>
                <div className="text-xs text-white/80">Bid Management System</div>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && !isCollapsed && (
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl hover-lift">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                    {user.role === 'finance_manager' && <DollarSign className="h-3 w-3 mr-1" />}
                    {user.role === 'bidder' && <FileText className="h-3 w-3 mr-1" />}
                    {user.role === 'admin' ? 'Administrator' : 
                     user.role === 'finance_manager' ? 'Finance Manager' : 'Bidder'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {Object.entries(navigationSections).map(([section, items]) => (
            <NavigationSection key={section} title={section} items={items} />
          ))}
        </nav>
        
        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={logout}
            variant="outline"
            className={cn(
              "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
              "border-red-200 dark:border-red-800 transition-all-smooth hover-scale",
              isCollapsed ? "px-2" : ""
            )}
          >
            <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-3")} />
            {!isCollapsed && "Sign Out"}
          </Button>
        </div>
      </div>
    </div>
  );
}