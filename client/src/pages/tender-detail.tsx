import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ExternalLink, MapPin, Building, User, Clock, Activity } from "lucide-react";
import { format } from "date-fns";

interface TenderDetail {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  location: string;
  status: string;
  source: string;
  aiScore: number;
  assignedTo?: string;
  assignedToName?: string;
  requirements?: Array<{
    reference?: string;
    msmeExemption?: string;
    startupExemption?: string;
  }>;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  tenderId: string;
  activityType: string;
  description: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  details?: any;
}

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: tender, isLoading: tenderLoading } = useQuery<TenderDetail>({
    queryKey: [`/api/tenders/${id}`],
    enabled: !!id,
  });

  const { data: activityLogs = [], isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: [`/api/tenders/${id}/activity-logs`],
    enabled: !!id,
  });

  if (tenderLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Tender Not Found</h2>
            <p className="text-gray-600">The requested tender could not be found.</p>
            <Button className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tender.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="h-4 w-4" />
            {tender.organization}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={tender.source === 'gem' ? 'default' : 'secondary'}>
            {tender.source === 'gem' ? 'GeM' : 'Non-GeM'}
          </Badge>
          <Badge 
            variant={tender.aiScore >= 70 ? "default" : tender.aiScore >= 50 ? "secondary" : "outline"}
            className={
              tender.aiScore >= 70 ? "bg-green-500" : 
              tender.aiScore >= 50 ? "bg-yellow-500" : "bg-red-500"
            }
          >
            {tender.aiScore}% AI Match
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tender Information */}
          <Card>
            <CardHeader>
              <CardTitle>Tender Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-medium">Deadline:</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {format(new Date(tender.deadline), 'PPP')}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location:</span>
                  </div>
                  <p className="text-sm">{tender.location}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Tender Value:</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  ₹{(tender.value / 100).toLocaleString('en-IN')}
                </p>
              </div>

              {tender.assignedTo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Assigned To:</span>
                  </div>
                  <Badge variant="default">{tender.assignedToName || tender.assignedTo}</Badge>
                </div>
              )}

              {tender.link && (
                <div className="pt-4">
                  <Button asChild variant="outline">
                    <a href={tender.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Tender Portal
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          {tender.requirements && tender.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements & Eligibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tender.requirements.map((req, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      {req.reference && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Reference:</span>
                          <p className="text-sm">{req.reference}</p>
                        </div>
                      )}
                      {req.msmeExemption && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">MSME Exemption:</span>
                          <Badge variant={req.msmeExemption.toLowerCase() === 'yes' ? 'default' : 'outline'}>
                            {req.msmeExemption}
                          </Badge>
                        </div>
                      )}
                      {req.startupExemption && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Startup Exemption:</span>
                          <Badge variant={req.startupExemption.toLowerCase() === 'yes' ? 'default' : 'outline'}>
                            {req.startupExemption}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Log Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log ({activityLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No activity logs available
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(log.createdAt), 'PPp')}</span>
                        <span>•</span>
                        <span>by {log.createdByName || log.createdBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.history.back()}
              >
                ← Back to Tenders
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = `/active-tenders`}
              >
                View All Active Tenders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}