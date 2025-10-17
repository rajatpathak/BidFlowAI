import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Calendar, IndianRupee, User } from "lucide-react";

type TenderCardData = {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  status: string;
  assignedTo?: string;
  location?: string;
};

export default function TenderCardEnhanced() {
  const { data: tenders = [] } = useQuery<TenderCardData[]>({
    queryKey: ["/api/dashboard/featured-tenders"],
  });

  // Fallback data
  const displayTender = tenders[0] || {
    id: "1",
    title: "Public Works Department - Nanded - Maharashtra",
    organization: "Public Works Department",
    value: 814900000,
    deadline: "2024-03-12",
    status: "in_progress",
    assignedTo: "Ayush Sinha",
    location: "Nanded, Maharashtra",
  };

  const formatValue = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} CR`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "submitted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const daysLeft = getDaysLeft(displayTender.deadline);

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="tender-card-enhanced">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100" data-testid="tender-title">
              {displayTender.title}
            </h3>
          </div>

          {/* Value and Deadline */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-gray-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="tender-value">
                {formatValue(displayTender.value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="tender-deadline">
                {new Date(displayTender.deadline).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
              <Badge variant="outline" className="ml-2" data-testid="days-left-badge">
                {daysLeft} Days Left
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            Lorem ipsum dolor sit amet consectetur. In vitae in volutpat vulputate
            enim faucibus lacus morbi mi. Id egestas dictumst dignissim sed nunc
            dolor vestibulum viverra urna. Varius phasellus pharetra et iaculis ipsum
            dolor morbi. Vehicula enim nisi diam sed amet sit. Venenatis
            consectetur erat quis diam sit pharetra ut sem duis.
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Assigned to: <span className="font-medium text-gray-900 dark:text-gray-100" data-testid="assigned-to">{displayTender.assignedTo || "Unassigned"}</span>
              </span>
            </div>
            <Badge className={getStatusColor(displayTender.status)} data-testid="status-badge">
              {displayTender.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
