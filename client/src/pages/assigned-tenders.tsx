import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/loading/ImportSkeleton";
import { 
  FileText, 
  Search, 
  Calendar,
  Building2,
  DollarSign,
  ExternalLink,
  Target,
  Clock,
  CheckCircle,
  Bell,
  User,
  PlayCircle,
  AlertTriangle,
  Upload
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AssignedTender {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  location: string;
  referenceNo?: string;
  link?: string;
  aiScore: number;
  status: string;
  source: string;
  assignedToName?: string;
  requirements?: Array<{
    reference?: string;
    t247_id?: string;
    location?: string;
    msmeExemption?: string;
    startupExemption?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AssignedTenders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showBiddingDialog, setShowBiddingDialog] = useState(false);
  const [showNotRelevantDialog, setShowNotRelevantDialog] = useState(false);
  const [selectedTender, setSelectedTender] = useState<AssignedTender | null>(null);
  const [notRelevantReason, setNotRelevantReason] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  const itemsPerPage = 20;

  // Fetch assigned tenders for current user
  const { data: assignedTenders = [], isLoading } = useQuery<AssignedTender[]>({
    queryKey: ["/api/users", user?.id, "assigned-tenders"],
    queryFn: () => fetch(`/api/users/${user?.id}/assigned-tenders`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper functions
  const getSourceBadge = (tender: AssignedTender) => {
    if (tender.source === 'gem') {
      return <Badge variant="default" className="bg-green-100 text-green-800">GeM</Badge>;
    } else if (tender.source === 'non_gem') {
      return <Badge variant="outline" className="border-blue-500 text-blue-700">Non-GeM</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const getCorrigendumBadge = (tender: AssignedTender) => {
    if (tender.title.toLowerCase().includes('corrigendum') || 
        tender.title.toLowerCase().includes('amendment') || 
        tender.title.toLowerCase().includes('addendum')) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Corrigendum</Badge>;
    }
    return null;
  };

  const getReferenceNo = (tender: AssignedTender) => {
    // Check requirements array first, then fallback to referenceNo field
    if (tender.requirements && tender.requirements.length > 0) {
      const ref = tender.requirements[0]?.reference || tender.requirements[0]?.t247_id;
      if (ref) return ref;
    }
    return tender.referenceNo || 'N/A';
  };

  // Filter tenders based on search and status
  const filteredTenders = assignedTenders.filter((tender) => {
    const matchesSearch = !searchQuery || 
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getReferenceNo(tender).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || tender.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "assigned-tenders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive"
      });
    }
  });

  // Mark not relevant mutation
  const markNotRelevantMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "assigned-tenders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark tender as not relevant",
        variant: "destructive"
      });
    }
  });

  // Action handlers
  const handleStartBidding = (tender: AssignedTender) => {
    setSelectedTender(tender);
    setShowBiddingDialog(true);
  };

  const handleNotRelevant = (tender: AssignedTender) => {
    setSelectedTender(tender);
    setShowNotRelevantDialog(true);
  };

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

    if (!selectedTender) return;

    startBiddingMutation.mutate({
      tenderId: selectedTender.id,
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

    if (!selectedTender) return;

    markNotRelevantMutation.mutate({
      tenderId: selectedTender.id,
      reason: notRelevantReason.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Assigned Tenders</h1>
            <p className="text-gray-600 mt-1">Tenders assigned to you for processing</p>
          </div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assigned Tenders</h1>
          <p className="text-gray-600 mt-1">Tenders assigned to you for processing</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <Badge variant="secondary">
            {filteredTenders.length} assigned
          </Badge>
        </div>
      </div>

      {/* Notification Banner */}
      {assignedTenders.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-blue-900 font-medium">
                  You have {assignedTenders.length} tender{assignedTenders.length !== 1 ? 's' : ''} assigned to you
                </p>
                <p className="text-blue-700 text-sm">
                  Review and start working on your assigned tenders below
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Input
                placeholder="Search by title, organization, location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-md"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="status-filter">Filter by Status:</Label>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger id="status-filter" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Tenders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Assigned Tenders ({filteredTenders.length})</CardTitle>
          <CardDescription>
            Tenders that have been assigned to you by the admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTenders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No assigned tenders</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery || statusFilter !== "all" 
                  ? "No tenders match your current filters." 
                  : "You don't have any assigned tenders yet. Check back later."}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tender Details</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTenders.map((tender) => (
                      <TableRow key={tender.id}>
                        {/* Tender Details */}
                        <TableCell>
                          <div className="space-y-2">
                            <div className="font-medium text-sm leading-tight">
                              {tender.title.length > 80 
                                ? `${tender.title.substring(0, 80)}...` 
                                : tender.title}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Ref: {getReferenceNo(tender)}
                              </span>
                              {getCorrigendumBadge(tender)}
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Organization */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {tender.organization.length > 30 
                                ? `${tender.organization.substring(0, 30)}...` 
                                : tender.organization}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Value */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {formatCurrency(tender.value)}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Deadline */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {new Date(tender.deadline).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Location */}
                        <TableCell>
                          <span className="text-sm">{tender.location}</span>
                        </TableCell>
                        
                        {/* Source */}
                        <TableCell>
                          {getSourceBadge(tender)}
                        </TableCell>
                        
                        {/* AI Score */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-gray-400" />
                            <Badge 
                              variant={tender.aiScore >= 70 ? "default" : "secondary"}
                              className={tender.aiScore >= 70 ? "bg-green-100 text-green-800" : ""}
                            >
                              {tender.aiScore}% Match
                            </Badge>
                          </div>
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/tender/${tender.id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              View
                            </Button>
                            
                            {/* Bidder Actions for assigned tenders */}
                            {user?.role === 'senior_bidder' && tender.status === 'assigned' && (
                              <>
                                <Button 
                                  onClick={() => handleStartBidding(tender)} 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Start Bidding
                                </Button>
                                <Button 
                                  onClick={() => handleNotRelevant(tender)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Not Relevant
                                </Button>
                              </>
                            )}
                            
                            {tender.link && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(tender.link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                                Link
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
                {selectedTender?.title}
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
                {selectedTender?.title}
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
              disabled={markNotRelevantMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {markNotRelevantMutation.isPending ? "Marking..." : "Mark Not Relevant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}