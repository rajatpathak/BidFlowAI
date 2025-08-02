import { cn } from "@/lib/utils";
import ModernSidebar from "./ModernSidebar";
import PageHeader from "./PageHeader";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  className?: string;
}

export default function AppLayout({ 
  children, 
  title, 
  description, 
  breadcrumbs = [], 
  actions,
  className 
}: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <ModernSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
        <main className={cn(
          "flex-1 overflow-auto p-6 animate-fade-in",
          "bg-gradient-to-br from-gray-50 via-white to-blue-50/30",
          "dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10",
          className
        )}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}