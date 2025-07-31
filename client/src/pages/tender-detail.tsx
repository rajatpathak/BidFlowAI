import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, ExternalLink, MapPin, Building, User, Clock, Activity, FileText, Upload, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

// Helper function to display activity types
const getActivityTypeDisplay = (activityType: string): string => {
  const actionTypes: Record<string, string> = {
    'tender_assigned': '👤 Assignment',
    'assignment_updated': '✏️ Update',
    'assignment_removed': '❌ Removed',
    'tender_deleted': '🗑️ Deletion',
    'marked_not_relevant': '⚠️ Not Relevant',
    'excel_upload': '📊 Excel Upload',
    'corrigendum_update': '📝 Corrigendum',
    'missed_opportunity': '⏰ Missed',
    'status_changed': '🔄 Status Change',
    'document_uploaded': '📎 Document',
    'comment_added': '💬 Comment',
    'deadline_extended': '⏱️ Deadline'
  };
  
  return actionTypes[activityType] || '📋 Action';
};

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

interface TenderDocument {
  id: string;
  tenderId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showBiddingDialog, setShowBiddingDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tender, isLoading: tenderLoading } = useQuery<TenderDetail>({
    queryKey: [`/api/tenders/${id}`],
    enabled: !!id,
  });

  const { data: activityLogs = [], isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: [`/api/tenders/${id}/activity-logs`],
    enabled: !!id,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<TenderDocument[]>({
    queryKey: [`/api/tenders/${id}/documents`],
    enabled: !!id,
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest(`/api/tenders/${id}/documents`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${id}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${id}/activity-logs`] });
      setShowBiddingDialog(false);
      setUploadedFiles(null);
      setUploadProgress(0);
      toast({
        title: "Documents Uploaded",
        description: "RFP documents have been successfully uploaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    },
  });

  const handleStartBidding = () => {
    setShowBiddingDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(files);
    }
  };

  const handleUploadDocuments = async () => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one RFP document to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Array.from(uploadedFiles).forEach((file) => {
      formData.append('documents', file);
    });
    formData.append('type', 'rfp_document');

    setUploadProgress(10);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 15, 90));
    }, 200);

    try {
      await uploadDocumentsMutation.mutateAsync(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

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

              <div className="pt-4 flex gap-3">
                {tender.link && (
                  <Button asChild variant="outline">
                    <a href={tender.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Tender Portal
                    </a>
                  </Button>
                )}
                {tender.assignedTo && (
                  <Button onClick={handleStartBidding} className="bg-green-600 hover:bg-green-700">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Bidding
                  </Button>
                )}
              </div>
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

        {/* Sidebar with Tabs */}
        <div className="space-y-6">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
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
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {getActivityTypeDisplay(log.activityType)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 leading-relaxed">
                            {log.enhancedDescription || log.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        <span>•</span>
                        <span className="font-medium">
                          by {log.displayName || log.createdByName || log.createdBy || 'Unknown User'}
                        </span>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            {log.details.priority && (
                              <div>
                                <span className="font-medium">Priority:</span> {log.details.priority}
                              </div>
                            )}
                            {log.details.budget && (
                              <div>
                                <span className="font-medium">Budget:</span> ₹{log.details.budget}
                              </div>
                            )}
                            {log.details.assignedToName && (
                              <div>
                                <span className="font-medium">Assigned to:</span> {log.details.assignedToName}
                              </div>
                            )}
                            {log.details.reason && (
                              <div className="col-span-2">
                                <span className="font-medium">Reason:</span> {log.details.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents ({documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No documents uploaded yet</p>
                      {tender?.assignedTo && (
                        <p className="text-xs text-gray-400 mt-1">Click "Start Bidding" to upload RFP documents</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">{doc.originalName}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span>{format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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

      {/* Start Bidding Dialog */}
      <Dialog open={showBiddingDialog} onOpenChange={setShowBiddingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Start Bidding Process
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Upload RFP documents to begin the bidding process for this tender.
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documents">Select RFP Documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <div className="text-xs text-gray-500">
                Accepted formats: PDF, DOC, DOCX, XLS, XLSX
              </div>
            </div>

            {uploadedFiles && uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({uploadedFiles.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {Array.from(uploadedFiles).map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <FileText className="h-4 w-4" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading documents...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBiddingDialog(false);
                setUploadedFiles(null);
                setUploadProgress(0);
              }}
              disabled={uploadDocumentsMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadDocuments}
              disabled={!uploadedFiles || uploadedFiles.length === 0 || uploadDocumentsMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadDocumentsMutation.isPending ? "Uploading..." : "Upload & Start Bidding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}