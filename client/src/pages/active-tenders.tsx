import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { TableSkeleton, CardGridSkeleton } from "@/components/loading/ImportSkeleton";
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  Building2,
  DollarSign,
  ExternalLink,
  Target,
  Clock,
  CheckCircle,
  Upload,
  FileSpreadsheet,
  XCircle,
  UserPlus,
  Users
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { TenderTable } from "@/components/tenders/tender-table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Tender = {
  id: string;
  title: string;
  organization: string;
  referenceNo: string | null;
  location: string | null;
  value: number | null;
  deadline: string | null;
  status: string;
  assignedTo: string | null;
  aiScore: number;
  link: string | null;
  createdAt: string | null;
};

type TenderImport = {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: Date | null;
  uploadedBy: string | null;
  tendersProcessed: number | null;
  duplicatesSkipped: number | null;
  status: string;
  errorLog: string | null;
};

export default function ActiveTendersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [selectedTenders, setSelectedTenders] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const itemsPerPage = 20;

  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: imports = [], isLoading: importsLoading } = useQuery<TenderImport[]>({
    queryKey: ["/api/tender-imports"],
  });

  // Filter tenders by source and other criteria
  const getFilteredTenders = (source: string) => {
    return tenders.filter(tender => {
      // Source filter
      if (source === 'gem' && tender.source !== 'gem') return false;
      if (source === 'non_gem' && tender.source !== 'non_gem') return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          tender.title.toLowerCase().includes(query) ||
          tender.organization.toLowerCase().includes(query) ||
          (tender.location && tender.location.toLowerCase().includes(query)) ||
          (tender.requirements?.[0]?.reference && tender.requirements[0].reference.toLowerCase().includes(query))
        );
        if (!matchesSearch) return false;
      }

      // Location filter
      if (locationFilter !== "all" && tender.location !== locationFilter) return false;

      // Status filter
      if (statusFilter !== "all" && tender.status !== statusFilter) return false;

      return true;
    });
  };

  const gemTenders = getFilteredTenders('gem');
  const nonGemTenders = getFilteredTenders('non_gem');

  // Pagination for each source
  const getPaginatedTenders = (tendersList: typeof tenders) => {
    const totalPages = Math.ceil(tendersList.length / itemsPerPage);
    const paginatedTenders = tendersList.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return { tendersList: paginatedTenders, totalPages };
  };

  const { tendersList: paginatedGemTenders, totalPages: gemTotalPages } = getPaginatedTenders(gemTenders);
  const { tendersList: paginatedNonGemTenders, totalPages: nonGemTotalPages } = getPaginatedTenders(nonGemTenders);

  // Get unique locations for filter
  const locations = Array.from(new Set(tenders.map(t => t.location).filter(Boolean)));

  // Calculate stats
  const stats = {
    total: tenders.length,
    eligible: tenders.filter(t => t.aiScore >= 70).length,
    assigned: tenders.filter(t => t.assignedTo).length,
    highValue: tenders.filter(t => (t.value || 0) > 10000000).length // > 1 Crore
  };

  // Handle file upload for tenders
  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("tendersFile", uploadFile);
    formData.append("uploadedBy", user?.username || "admin");

    try {
      const response = await fetch("/api/upload-tenders", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/tender-imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      
      toast({
        title: "Upload successful",
        description: `Added ${result.tendersProcessed} tenders, skipped ${result.duplicatesSkipped} duplicates from ${result.sheetsProcessed} sheets.`,
      });
      
      setUploadFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection for new upload tabs
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setUploadProgress(0);
  };

  // Handle file upload with progress tracking for new tabs
  const handleNewFileUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await fetch("/api/upload-tenders", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: `${result.tendersProcessed || 0} tenders added, ${result.duplicatesSkipped || 0} duplicates skipped from ${result.sheetsProcessed || 0} sheets`,
      });

      // Refresh tender data
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tender-imports"] });
      
      // Clear file selection
      setSelectedFile(null);
      setUploadProgress(0);

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Load upload history from imports data
  useEffect(() => {
    if (imports && imports.length > 0) {
      // Transform the data for display
      const transformedHistory = imports.map((item: any) => ({
        id: item.id,
        fileName: item.file_name,
        uploadDate: new Date(item.uploaded_at).toLocaleString(),
        tendersImported: item.entries_added || 0,
        tendersSkipped: item.entries_duplicate || 0,
        status: item.status || 'completed'
      }));
      setUploadHistory(transformedHistory);
    }
  }, [imports]);

  // Fetch upload history
  const fetchUploadHistory = async () => {
    try {
      const response = await fetch("/api/tender-imports");
      if (response.ok) {
        const data = await response.json();
        setUploadHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch upload history:", error);
    }
  };

  // Handle tender selection
  const handleTenderSelect = (tenderId: string, checked: boolean) => {
    const newSelected = new Set(selectedTenders);
    if (checked) {
      newSelected.add(tenderId);
    } else {
      newSelected.delete(tenderId);
    }
    setSelectedTenders(newSelected);
  };

  // Handle select all tenders
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedTenders.map(t => t.id));
      setSelectedTenders(allIds);
    } else {
      setSelectedTenders(new Set());
    }
  };

  // Delete selected tenders
  const handleDeleteSelected = async () => {
    if (selectedTenders.size === 0) return;
    
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedTenders).map(id =>
        fetch(`/api/tenders/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Success",
        description: `${selectedTenders.size} tenders deleted successfully`,
      });
      
      // Refresh data and clear selection
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      setSelectedTenders(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected tenders",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete all tenders
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/tenders/delete-all', { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error('Failed to delete all tenders');
      }
      
      toast({
        title: "Success",
        description: "All tenders deleted successfully",
      });
      
      // Refresh data and clear selection
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      setSelectedTenders(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete all tenders",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle tender assignment
  const handleAssignTender = async () => {
    if (!selectedTenderId || !assignedTo) return;
    
    setIsAssigning(true);
    try {
      const response = await fetch(`/api/tenders/${selectedTenderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo,
          notes: assignmentNotes,
          assignedBy: user?.username || 'admin'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign tender');
      }

      toast({
        title: "Success",
        description: `Tender assigned to ${assignedTo} successfully`,
      });

      // Reset form and close dialog
      setAssignDialogOpen(false);
      setSelectedTenderId("");
      setAssignedTo("");
      setAssignmentNotes("");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign tender",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Open assignment dialog
  const openAssignDialog = (tenderId: string) => {
    setSelectedTenderId(tenderId);
    setAssignDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>
        
        {/* Statistics Cards Skeleton */}
        <CardGridSkeleton cards={4} />
        
        {/* Table Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          <TableSkeleton rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Active Tenders</h1>
          <p className="text-gray-600">View and manage active tender opportunities with AI-powered insights</p>
        </div>
      </div>

      <Tabs defaultValue="gem-tenders" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gem-tenders">GeM Tenders</TabsTrigger>
          <TabsTrigger value="non-gem-tenders">Non-GeM Tenders</TabsTrigger>
          <TabsTrigger value="upload-tenders">Upload Tenders</TabsTrigger>
          <TabsTrigger value="upload-history">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="gem-tenders" className="space-y-6">{/* GeM Tenders Content */}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eligible (≥70%)</p>
                <p className="text-2xl font-bold text-green-600">{stats.eligible}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-orange-600">{stats.assigned}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Value (&gt;1Cr)</p>
                <p className="text-2xl font-bold text-purple-600">{stats.highValue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location!}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="invisible">Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={isDeleting || tenders.length === 0}
                >
                  {isDeleting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Delete All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting || selectedTenders.size === 0}
                >
                  {isDeleting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedTenders.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {selectedTenders.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                {selectedTenders.size} tender{selectedTenders.size !== 1 ? 's' : ''} selected
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedTenders(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedTenders.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedTenders.size} tender{selectedTenders.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Delete Selected
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GeM Tenders Table */}
      <TenderTable
        tenders={paginatedGemTenders}
        totalPages={gemTotalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedTenders={selectedTenders}
        setSelectedTenders={setSelectedTenders}
        openAssignDialog={openAssignDialog}
        user={user}
        source="gem"
      />
          {paginatedTenders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No active tenders found</h3>
              <p className="text-gray-500 mt-1">Upload tender data to see available opportunities.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTenders.size === paginatedTenders.length && paginatedTenders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Tender Details</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTenders.map((tender) => (
                    <TableRow key={tender.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTenders.has(tender.id)}
                          onCheckedChange={(checked) => handleTenderSelect(tender.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{tender.title}</div>
                          {tender.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Building2 className="h-3 w-3 mr-1" />
                              {tender.location}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tender.requirements && Array.isArray(tender.requirements) && tender.requirements[0]?.reference ? (
                          <div className="text-sm text-blue-600 font-mono">
                            {tender.requirements[0].reference}
                          </div>
                        ) : (
                          <span className="text-gray-400">No reference</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{tender.organization}</div>
                      </TableCell>
                      <TableCell>
                        {tender.value ? (
                          <div className="font-medium">
                            ₹{(tender.value / 10000000).toFixed(1)}Cr
                          </div>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tender.deadline ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(tender.deadline).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">No deadline</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tender.link ? (
                          <a href={tender.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center text-sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">No link</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={tender.aiScore >= 70 ? "default" : tender.aiScore >= 50 ? "secondary" : "outline"}
                          className={
                            tender.aiScore >= 70 ? "bg-green-500" : 
                            tender.aiScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                          }
                        >
                          {tender.aiScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tender.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tender.link && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={tender.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          {user?.role === 'admin' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openAssignDialog(tender.id)}
                              disabled={tender.assignedTo ? true : false}
                            >
                              {tender.assignedTo ? (
                                <>
                                  <Users className="h-3 w-3 mr-1" />
                                  Assigned
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Assign
                                </>
                              )}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.location.href = `/tender/${tender.id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTender && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Tender Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Title:</p>
                      <p className="text-sm font-medium">{selectedTender.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Organization:</p>
                      <p className="text-sm font-medium">{selectedTender.organization}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Value:</p>
                      <p className="text-sm font-medium">₹{(selectedTender.value / 100).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Deadline:</p>
                      <p className="text-sm font-medium">{new Date(selectedTender.deadline).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location:</p>
                      <p className="text-sm font-medium">{selectedTender.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reference No:</p>
                      <p className="text-sm font-medium">{selectedTender.requirements?.[0]?.reference || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">T247 ID:</p>
                      <p className="text-sm font-medium">{selectedTender.requirements?.[0]?.t247_id || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Turnover Requirement:</p>
                      <p className="text-sm font-medium">{selectedTender.requirements?.[0]?.turnover || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  {selectedTender.link && (
                    <Button asChild>
                      <a href={selectedTender.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Tender Portal
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Upload Tenders Tab */}
        <TabsContent value="upload-tenders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                <div>
                  <CardTitle>Upload Active Tenders</CardTitle>
                  <CardDescription>
                    Upload Excel files containing active tender data with automatic AI scoring
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Expected Excel Format:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Title</strong>: Tender title or work description</p>
                  <p>• <strong>Organization</strong>: Department or organization name</p>
                  <p>• <strong>Value</strong>: Tender value or EMD amount</p>
                  <p>• <strong>Deadline</strong>: Last date for submission</p>
                  <p>• <strong>Turnover</strong>: Eligibility turnover requirement</p>
                  <p>• <strong>Location</strong>: Place or location of work</p>
                  <p>• <strong>Reference No</strong>: Tender reference number</p>
                  <p>• <strong>Link</strong>: URL to tender details (optional)</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-medium">Choose Excel File</div>
                      <div className="text-sm text-gray-500">Upload .xlsx files with tender data</div>
                    </div>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      className="max-w-md mx-auto"
                    />
                  </div>
                  {selectedFile && (
                    <div className="mt-4">
                      <Badge variant="secondary" className="gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        {selectedFile.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleNewFileUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-8 py-2"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Active Tenders
                    </>
                  )}
                </Button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Processing Excel file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload History Tab */}
        <TabsContent value="upload-history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <div>
                    <CardTitle>Upload History</CardTitle>
                    <CardDescription>
                      View previous tender upload attempts and results
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchUploadHistory}>
                  <Upload className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {uploadHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No upload history</h3>
                  <p className="text-gray-500 mt-1">Upload some tender Excel files to see history here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Tenders Imported</TableHead>
                      <TableHead>Duplicates Skipped</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadHistory.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                            {upload.fileName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {upload.tendersProcessed || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-yellow-600">
                            {upload.duplicatesSkipped || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {upload.status === 'completed' ? (
                            <Badge variant="default" className="gap-1 bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3" />
                              Success
                            </Badge>
                          ) : upload.status === 'failed' ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Processing
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Tender</DialogTitle>
            <DialogDescription>
              Assign this tender to a bidder for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTo" className="text-right">
                Bidder
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select bidder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="senior_bidder">Senior Bidder</SelectItem>
                  <SelectItem value="junior_bidder">Junior Bidder</SelectItem>
                  <SelectItem value="technical_lead">Technical Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Assignment notes (optional)"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setAssignDialogOpen(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAssignTender}
              disabled={isAssigning || !assignedTo}
            >
              {isAssigning ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Tender
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}