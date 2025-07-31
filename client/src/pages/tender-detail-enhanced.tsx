import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { 
  ArrowLeft, 
  ExternalLink, 
  Building2, 
  DollarSign, 
  Calendar, 
  MapPin, 
  FileText, 
  Target, 
  CheckCircle,
  XCircle,
  Info,
  PlayCircle,
  AlertTriangle,
  Upload,
  Download,
  File
} from "lucide-react";

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
  assigned_to?: string; // backend field name
  assignedToName?: string;
  requirements: Array<{
    location: string;
    reference: string;
    department: string;
    category: string;
    sheet: string;
    t247_id: string;
    turnover: string;
    msmeExemption?: string;
    startupExemption?: string;
    eligibilityCriteria?: string;
    checklist?: string;
    documentFees?: string;
    emd?: string;
    quantity?: string;
  }>;
  link?: string;
}

export default function TenderDetailEnhancedPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/tender/:id");
  const [showBiddingDialog, setShowBiddingDialog] = useState(false);
  const [showNotRelevantDialog, setShowNotRelevantDialog] = useState(false);
  const [notRelevantReason, setNotRelevantReason] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: tender, isLoading } = useQuery<TenderDetail>({
    queryKey: [`/api/tenders/${params?.id}`],
    enabled: !!params?.id,
  });

  // Fetch uploaded documents
  const { data: documents = [] } = useQuery({
    queryKey: [`/api/tenders/${params?.id}/documents`],
    enabled: !!params?.id,
  });

  // Start bidding mutation
  const startBiddingMutation = useMutation({
    mutationFn: async (data: { tenderId: string; files: FileList }) => {
      const formData = new FormData();
      Array.from(data.files).forEach((file) => {
        formData.append('documents', file);
      });
      
      const response = await fetch(`/api/tenders/${data.tenderId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload documents');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bidding Started",
        description: "RFP documents uploaded successfully. You can now start preparing your bid.",
      });
      setShowBiddingDialog(false);
      setSelectedFiles(null);
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${params?.id}/documents`] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive"
      });
    }
  });

  // Not relevant submission mutation
  const notRelevantMutation = useMutation({
    mutationFn: async (data: { tenderId: string; reason: string }) => {
      const response = await fetch(`/api/tenders/${data.tenderId}/not-relevant`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: data.reason })
      });
      
      if (!response.ok) throw new Error('Failed to mark tender as not relevant');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tender marked as not relevant successfully",
      });
      setShowNotRelevantDialog(false);
      setNotRelevantReason("");
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${params?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark tender as not relevant",
        variant: "destructive"
      });
    }
  });

  // Handler functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleStartBiddingSubmit = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one RFP document to upload",
        variant: "destructive"
      });
      return;
    }

    if (!tender) return;

    startBiddingMutation.mutate({
      tenderId: tender.id,
      files: selectedFiles
    });
  };

  const handleNotRelevantSubmit = () => {
    if (!notRelevantReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for marking this tender as not relevant",
        variant: "destructive"
      });
      return;
    }

    if (!tender) return;

    notRelevantMutation.mutate({
      tenderId: tender.id,
      reason: notRelevantReason.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/active-tenders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Tender Not Found</h1>
            <p className="text-gray-600 mt-2">The requested tender could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const requirements = tender.requirements[0] || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/active-tenders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tender Details</h1>
            <p className="text-gray-600">Complete tender information and requirements</p>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl pr-4">{tender.title}</CardTitle>
                <CardDescription className="mt-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-lg">{tender.organization}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant={tender.source === 'gem' ? 'default' : 'secondary'} className="text-sm">
                  {tender.source === 'gem' ? 'GeM Portal' : 'Non-GeM Portal'}
                </Badge>
                <Badge 
                  variant={tender.aiScore >= 70 ? "default" : tender.aiScore >= 50 ? "secondary" : "outline"}
                  className={`text-sm ${
                    tender.aiScore >= 70 ? "bg-green-500 hover:bg-green-600" : 
                    tender.aiScore >= 50 ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {tender.aiScore}% AI Match
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Tender Value</p>
                  <p className="text-xl font-bold text-green-900">₹{(tender.value / 100).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Deadline</p>
                  <p className="text-xl font-bold text-blue-900">{new Date(tender.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <MapPin className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-700 font-medium">Location</p>
                  <p className="text-lg font-bold text-orange-900">{requirements.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Target className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700 font-medium">Source</p>
                  <p className="text-lg font-bold text-purple-900">{requirements.sheet || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Link Action */}
            {tender.link && (
              <div className="mb-6">
                <Button size="lg" asChild>
                  <a href={tender.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    View on Tender Portal
                  </a>
                </Button>
              </div>
            )}

            {/* Action Buttons for Assigned Tenders */}
            {user?.role === 'senior_bidder' && tender.status === 'assigned' && (tender.assignedTo === user?.id || tender.assigned_to === user?.id) && (
              <div className="mb-6 flex gap-4">
                <Button 
                  size="lg" 
                  onClick={() => setShowBiddingDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Start Bidding
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setShowNotRelevantDialog(true)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Not Relevant
                </Button>
              </div>
            )}

            {/* Assignment Info */}
            {tender.assignedTo && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Assigned to: {tender.assignedToName || 'Unknown User'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Uploaded Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="prepared">Prepared Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Comprehensive Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reference Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reference Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Reference Number</p>
                <p className="text-lg font-semibold text-gray-900">{requirements.reference || 'Not available'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 font-medium">T247 ID</p>
                <p className="text-lg font-semibold text-gray-900">{requirements.t247_id || 'Not available'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 font-medium">Department</p>
                <p className="font-medium">{requirements.department || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Category</p>
                <p className="font-medium">{requirements.category || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Turnover Requirement</p>
                <p className="text-lg font-semibold text-green-700">{requirements.turnover || 'Not specified'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 font-medium">Document Fees</p>
                <p className="font-medium">{requirements.documentFees || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">EMD (Earnest Money Deposit)</p>
                <p className="font-medium">{requirements.emd || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Quantity</p>
                <p className="font-medium">{requirements.quantity || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GeM Specific Information (if applicable) */}
        {tender.source === 'gem' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  MSME & Startup Exemptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">MSME Exemption</span>
                  <div className="flex items-center gap-2">
                    {requirements.msmeExemption === 'Yes' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={requirements.msmeExemption === 'Yes' ? 'default' : 'outline'}>
                      {requirements.msmeExemption || 'No'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Startup Exemption</span>
                  <div className="flex items-center gap-2">
                    {requirements.startupExemption === 'Yes' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={requirements.startupExemption === 'Yes' ? 'default' : 'outline'}>
                      {requirements.startupExemption || 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Additional Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Status</p>
                  <Badge variant="outline" className="mt-1">
                    {tender.status || 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Processing Sheet</p>
                  <p className="font-medium">{requirements.sheet || 'Unknown'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Eligibility Criteria & Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Eligibility Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {requirements.eligibilityCriteria || 'No specific eligibility criteria provided.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {requirements.checklist || 'No checklist items specified.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <File className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{doc.originalName || doc.filename}</p>
                            <p className="text-sm text-gray-500">
                              {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • 
                              Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No documents uploaded yet</p>
                    <p className="text-sm">Use the "Start Bidding" button to upload RFP documents</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6 mt-6">
            <ActivityLogsSection tenderId={tender.id} />
          </TabsContent>
          
          <TabsContent value="prepared" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prepared Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No prepared documents yet</p>
                  <p className="text-sm">Documents prepared for this tender will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                Upload RFP documents to begin the bidding process for this tender:
                <div className="font-medium mt-2 text-gray-900">
                  {tender?.title}
                </div>
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

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  <div className="space-y-1">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBiddingDialog(false);
                  setSelectedFiles(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStartBiddingSubmit}
                disabled={startBiddingMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {startBiddingMutation.isPending ? "Uploading..." : "Start Bidding"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Not Relevant Dialog */}
        <Dialog open={showNotRelevantDialog} onOpenChange={setShowNotRelevantDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Mark as Not Relevant
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Please provide a reason for marking this tender as not relevant:
                <div className="font-medium mt-2 text-gray-900">
                  {tender?.title}
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  This will help improve future tender matching.
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for not relevant</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Outside our expertise area, Budget too low, Technical requirements don't match..."
                  value={notRelevantReason}
                  onChange={(e) => setNotRelevantReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNotRelevantDialog(false);
                  setNotRelevantReason("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNotRelevantSubmit}
                disabled={!notRelevantReason.trim() || notRelevantMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {notRelevantMutation.isPending ? "Submitting..." : "Mark Not Relevant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Activity Logs Component
interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

function ActivityLogsSection({ tenderId }: { tenderId: string }) {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: [`/api/tenders/${tenderId}/activity-logs`],
    enabled: !!tenderId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Activity Log ({logs?.length || 0} entries)
        </CardTitle>
        <CardDescription>
          Track of all changes and updates made to this tender
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activity logs found for this tender.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="capitalize">
                    {log.action.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                
                {log.details && log.details.before && log.details.after && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <h4 className="font-medium text-sm text-red-700 mb-2">Before (Previous)</h4>
                      <div className="bg-red-50 p-3 rounded text-xs space-y-1">
                        <p><strong>Title:</strong> {log.details.before.title}</p>
                        <p><strong>Organization:</strong> {log.details.before.organization}</p>
                        <p><strong>Value:</strong> ₹{(log.details.before.value / 100).toLocaleString('en-IN')}</p>
                        <p><strong>Deadline:</strong> {new Date(log.details.before.deadline).toLocaleDateString()}</p>
                        {log.details.before.link && (
                          <p><strong>Link:</strong> <a href={log.details.before.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-green-700 mb-2">After (Updated)</h4>
                      <div className="bg-green-50 p-3 rounded text-xs space-y-1">
                        <p><strong>Title:</strong> {log.details.after.title}</p>
                        <p><strong>Organization:</strong> {log.details.after.organization}</p>
                        <p><strong>Value:</strong> ₹{(log.details.after.value / 100).toLocaleString('en-IN')}</p>
                        <p><strong>Deadline:</strong> {new Date(log.details.after.deadline).toLocaleDateString()}</p>
                        {log.details.after.link && (
                          <p><strong>Link:</strong> <a href={log.details.after.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-600">
                  Source: {log.details.source || 'System'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}