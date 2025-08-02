import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { 
  Bell, 
  Search, 
  Menu, 
  Sun, 
  Moon, 
  Settings,
  User,
  ChevronDown,
  Zap,
  Activity
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions,
  className 
}: PageHeaderProps) {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn(
      "sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800",
      "animate-fade-in",
      className
    )}>
      <div className="px-6 py-4">
        {/* Top Row: Breadcrumbs and Quick Actions */}
        <div className="flex items-center justify-between mb-4">
          {/* Breadcrumbs */}
          <Breadcrumb className="animate-slide-up">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-gray-900 dark:text-gray-100 font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
            {/* Search */}
            <Button variant="ghost" size="sm" className="hover-scale">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative hover-scale">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                3
              </span>
            </Button>

            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="hover-scale">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" className="hover-scale">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Header Row */}
        <div className="flex items-center justify-between">
          {/* Title and Description */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {actions && (
            <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
              {actions}
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-4 mt-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            <Activity className="h-3 w-3 mr-1" />
            System Online
          </Badge>
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <Zap className="h-3 w-3 mr-1" />
            AI Enabled
          </Badge>
          {user && (
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              <User className="h-3 w-3 mr-1" />
              {user.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}