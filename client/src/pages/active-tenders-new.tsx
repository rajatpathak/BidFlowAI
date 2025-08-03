import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, FileText, Target, Building2, DollarSign, Plus, Upload, Search, Filter, ExternalLink, MapPin, Building, Calendar, Users, Eye, Edit, AlertTriangle, Zap, TrendingUp, Clock, Star, MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/layout/AppLayout";

// Upload Tenders Component
function UploadTendersComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadedBy', user?.username || 'admin');

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate session ID for tracking
      const sessionId = Date.now().toString();
      formData.append('sessionId', sessionId);

      // Set up Server-Sent Events for real-time progress
      const eventSource = new EventSource(`/api/upload-progress/${sessionId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const progressData = JSON.parse(event.data);
          console.log('Progress update:', progressData);
          setUploadProgress(progressData.percentage || 0);
          
          if (progressData.completed) {
            eventSource.close();
          }
        } catch (error) {
          console.error('Error parsing progress data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
      };

      const response = await fetch('/api/upload-tenders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        eventSource.close();
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Ensure progress reaches 100%
      setTimeout(() => {
        setUploadProgress(100);
        eventSource.close();
      }, 1000);
      
      toast({
        title: "Upload Complete",
        description: `${result.tendersProcessed || 0} tenders imported successfully (${result.duplicatesSkipped || 0} duplicates skipped)`,
      });
      
      setSelectedFile(null);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tender-imports"] });
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: (error as Error).message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Excel File</CardTitle>
        <CardDescription>
          Upload Excel or CSV files with GeM and Non-GeM tender data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          
          {uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
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
          
          <Button 
            type="submit" 
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Upload Excel File"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Upload History Component
function UploadHistoryComponent() {
  const { data: uploadHistory = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/tender-imports"],
  });

  // Transform the data to ensure proper field mapping
  const transformedHistory = uploadHistory.map((upload: any) => ({
    fileName: upload.file_name || upload.fileName,
    tendersProcessed: upload.entries_added || upload.tendersProcessed || 0,
    duplicatesSkipped: upload.entries_duplicate || upload.duplicatesSkipped || 0,
    status: upload.status || 'completed',
    uploadedAt: upload.uploaded_at || upload.uploadedAt
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploadHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>Track your recent Excel uploads and processing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Upload History</h3>
            <p className="text-gray-500 mt-1">Upload history will appear here after processing files.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
        <CardDescription>Recent Excel file uploads and processing results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transformedHistory.map((upload, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{upload.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {upload.tendersProcessed} processed, {upload.duplicatesSkipped} duplicates
                  </p>
                  <p className="text-xs text-gray-400">
                    {upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleString() : 'Unknown time'}
                  </p>
                </div>
              </div>
              <Badge variant={upload.status === 'completed' ? 'default' : 'destructive'}>
                {upload.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface Tender {
  id: string;
  title: string;
  organization: string;
  referenceNo?: string;
  value: number;
  deadline: string;
  location: string;
  status: string;
  source: string;
  aiScore: number;
  assignedTo?: string;
  requirements?: Array<{
    reference?: string;
    msmeExemption?: string;
    startupExemption?: string;
    eligibilityCriteria?: string;
    checklist?: string;
  }>;
  link?: string;
}

export default function ActiveTendersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTenders, setSelectedTenders] = useState<Set<string>>(new Set());
  const [showMissedOpportunities, setShowMissedOpportunities] = useState(false);
  const itemsPerPage = 20;

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders", showMissedOpportunities],
    queryFn: () => {
      const params = new URLSearchParams();
      if (showMissedOpportunities) {
        params.append('includeMissedOpportunities', 'true');
      }
      return fetch(`/api/tenders?${params}`).then(res => res.json());
    }
  });

  // Filter tenders by source and search
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

      return true;
    });
  };

  const gemTenders = getFilteredTenders('gem');
  const nonGemTenders = getFilteredTenders('non_gem');

  // Pagination helper
  const getPaginatedTenders = (tendersList: Tender[]) => {
    const totalPages = Math.ceil(tendersList.length / itemsPerPage);
    const paginatedTenders = tendersList.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return { tendersList: paginatedTenders, totalPages };
  };

  const { tendersList: paginatedGemTenders, totalPages: gemTotalPages } = getPaginatedTenders(gemTenders);
  const { tendersList: paginatedNonGemTenders, totalPages: nonGemTotalPages } = getPaginatedTenders(nonGemTenders);

  // Assignment functionality now handled by TenderAssignmentDialog component

  // State for Not Relevant dialog
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [notRelevantReason, setNotRelevantReason] = useState('');
  const [showNotRelevantDialog, setShowNotRelevantDialog] = useState(false);

  // Handle Delete
  const handleDelete = async (tenderId: string) => {
    try {
      const response = await fetch(`/api/tenders/${tenderId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Tender deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete tender", variant: "destructive" });
    }
  };

  // Select all / deselect all handler for current page
  const handleSelectAll = (tendersList: Tender[]) => {
    const allCurrentSelected = tendersList.every(t => selectedTenders.has(t.id));
    if (allCurrentSelected) {
      // Deselect all current page tenders
      const newSelected = new Set(selectedTenders);
      tendersList.forEach(t => newSelected.delete(t.id));
      setSelectedTenders(newSelected);
    } else {
      // Select all current page tenders
      const newSelected = new Set(selectedTenders);
      tendersList.forEach(t => newSelected.add(t.id));
      setSelectedTenders(newSelected);
    }
  };

  // Global select all handler - selects ALL tenders across all pages
  const handleGlobalSelectAll = (source: 'gem' | 'non_gem') => {
    const relevantTenders = source === 'gem' ? gemTenders : nonGemTenders;
    const allSelected = relevantTenders.every(t => selectedTenders.has(t.id));
    
    if (allSelected) {
      // Deselect all tenders of this source
      const newSelected = new Set(selectedTenders);
      relevantTenders.forEach(t => newSelected.delete(t.id));
      setSelectedTenders(newSelected);
    } else {
      // Select all tenders of this source
      const newSelected = new Set(selectedTenders);
      relevantTenders.forEach(t => newSelected.add(t.id));
      setSelectedTenders(newSelected);
    }
  };

  // Delete selected tenders
  const handleDeleteSelected = async () => {
    if (!user || (user as any).role !== 'admin') {
      toast({ title: "Error", description: "Only admins can delete tenders", variant: "destructive" });
      return;
    }

    if (selectedTenders.size === 0) {
      toast({ title: "Error", description: "No tenders selected for deletion", variant: "destructive" });
      return;
    }

    const confirmation = confirm(`Are you sure you want to delete ${selectedTenders.size} selected tenders?`);
    if (!confirmation) return;

    // Initialize progress tracking
    setDeleteProgress({ current: 0, total: selectedTenders.size, isDeleting: true });

    try {
      console.log(`Starting bulk delete of ${selectedTenders.size} tenders...`);
      
      const tenderIds = Array.from(selectedTenders);
      let completedCount = 0;
      let successCount = 0;
      
      // Process deletions with progress tracking
      const deletePromises = tenderIds.map(async (tenderId, index) => {
        try {
          const response = await fetch(`/api/tenders/${tenderId}`, { method: 'DELETE' });
          completedCount++;
          
          // Update progress
          setDeleteProgress(prev => ({ 
            ...prev, 
            current: completedCount 
          }));
          
          if (!response.ok) {
            console.error(`Failed to delete tender ${tenderId}: ${response.status}`);
            return false;
          }
          successCount++;
          return true;
        } catch (error) {
          completedCount++;
          setDeleteProgress(prev => ({ 
            ...prev, 
            current: completedCount 
          }));
          console.error(`Error deleting tender ${tenderId}:`, error);
          return false;
        }
      });

      const results = await Promise.all(deletePromises);
      const finalSuccessCount = results.filter(r => r).length;
      const failCount = results.filter(r => !r).length;
      
      // Reset progress
      setDeleteProgress({ current: 0, total: 0, isDeleting: false });
      
      if (finalSuccessCount > 0) {
        toast({ 
          title: "Bulk Delete Complete", 
          description: `${finalSuccessCount} tenders deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}` 
        });
      } else {
        toast({ title: "Error", description: "Failed to delete selected tenders", variant: "destructive" });
      }
      
      setSelectedTenders(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
    } catch (error) {
      console.error("Bulk delete error:", error);
      setDeleteProgress({ current: 0, total: 0, isDeleting: false });
      toast({ title: "Error", description: "Failed to delete selected tenders", variant: "destructive" });
    }
  };

  // Handle Mark Not Relevant
  const handleMarkNotRelevant = (tenderId: string) => {
    setSelectedTenderId(tenderId);
    setShowNotRelevantDialog(true);
  };

  const submitNotRelevant = async () => {
    if (!selectedTenderId || !notRelevantReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/tenders/${selectedTenderId}/mark-not-relevant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: notRelevantReason }),
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Tender marked as not relevant" });
        setShowNotRelevantDialog(false);
        setNotRelevantReason('');
        setSelectedTenderId(null);
        queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark tender", variant: "destructive" });
    }
  };

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState({ 
    processed: 0, 
    duplicates: 0, 
    total: 0, 
    gemAdded: 0, 
    nonGemAdded: 0, 
    errors: 0 
  });
  
  // Delete progress state
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0, isDeleting: false });

  // File upload handler with real-time progress
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStats({ processed: 0, duplicates: 0, total: 0, gemAdded: 0, nonGemAdded: 0, errors: 0 });
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedBy", user?.username || "admin");

    // Create session ID upfront
    const sessionId = Date.now().toString();
    formData.append("sessionId", sessionId);

    let eventSource: EventSource | null = null;

    try {
      // Connect to progress stream BEFORE starting upload
      eventSource = new EventSource(`/api/upload-progress/${sessionId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const progress = JSON.parse(event.data);
          console.log('Progress update:', progress);
          setUploadProgress(progress.percentage || 0);
          setUploadStats({
            processed: progress.processed || 0,
            duplicates: progress.duplicates || 0,
            total: progress.total || 0,
            gemAdded: progress.gemAdded || 0,
            nonGemAdded: progress.nonGemAdded || 0,
            errors: progress.errors || 0
          });

          // Close connection when completed
          if (progress.completed || progress.percentage >= 100) {
            eventSource?.close();
          }
        } catch (e) {
          console.error('Error parsing progress:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource?.close();
      };

      // Small delay to ensure SSE connection is established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start the upload request
      const response = await fetch("/api/upload-tenders", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      
      // Final success notification
      toast({
        title: "Upload Successful", 
        description: `${result.gemAdded || 0} GeM + ${result.nonGemAdded || 0} Non-GeM entries added, ${result.duplicatesSkipped || 0} duplicates skipped${result.errorsEncountered ? `, ${result.errorsEncountered} errors` : ''}`,
      });

      // Refresh tender data
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
    } catch (error) {
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: (error as Error).message || "Failed to upload and process the Excel file",
        variant: "destructive",
      });
    } finally {
      // Clean up event source
      if (eventSource) {
        eventSource.close();
      }
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStats({ processed: 0, duplicates: 0, total: 0, gemAdded: 0, nonGemAdded: 0, errors: 0 });
      }, 3000);
    }
  };

  // Statistics
  const stats = {
    total: tenders.length,
    gem: gemTenders.length,
    nonGem: nonGemTenders.length,
    eligible: tenders.filter(t => t.aiScore >= 70).length,
  };

  const breadcrumbs = [
    { label: "Tenders" },
    { label: "Active Tenders" }
  ];

  const actions = (
    <div className="flex items-center space-x-3">
      <Button variant="outline" className="hover-scale">
        <Upload className="h-4 w-4 mr-2" />
        Upload Tenders
      </Button>
      <Button className="bg-gradient-primary hover:scale-105 transition-transform shadow-lg">
        <Plus className="h-4 w-4 mr-2" />
        Create Tender
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout title="Active Tenders" description="Loading tender opportunities..." breadcrumbs={breadcrumbs}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Active Tenders" 
      description="Manage GeM and Non-GeM tender opportunities with AI-powered insights"
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      <div className="space-y-8">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
          <Card className="hover-lift bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Tenders</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">GeM Tenders</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.gem}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Non-GeM Tenders</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.nonGem}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Eligible (≥70%)</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.eligible}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Settings */}
        <Card className="animate-slide-up hover-lift bg-white dark:bg-gray-800 shadow-lg" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenders by title, organization, location, or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-3 whitespace-nowrap bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-lg">
                <Switch
                  id="show-missed-opportunities"
                  checked={showMissedOpportunities}
                  onCheckedChange={setShowMissedOpportunities}
                />
                <Label htmlFor="show-missed-opportunities" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Missed Opportunities
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for GeM and Non-GeM Tenders */}
        <Tabs defaultValue="gem-tenders" className="w-full animate-slide-up" style={{ animationDelay: "400ms" }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gem-tenders">GeM Tenders ({gemTenders.length})</TabsTrigger>
            <TabsTrigger value="non-gem-tenders">Non-GeM Tenders ({nonGemTenders.length})</TabsTrigger>
            <TabsTrigger value="upload-tenders">Upload Tenders</TabsTrigger>
            <TabsTrigger value="upload-history">Upload History</TabsTrigger>
          </TabsList>

          <TabsContent value="gem-tenders" className="space-y-6">
            <TenderTable
              tenders={paginatedGemTenders}
              totalPages={gemTotalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedTenders={selectedTenders}
              setSelectedTenders={setSelectedTenders}
              onMarkNotRelevant={handleMarkNotRelevant}
              onDelete={handleDelete}
              onSelectAll={handleSelectAll}
              onGlobalSelectAll={handleGlobalSelectAll}
              onDeleteSelected={handleDeleteSelected}
              user={user ? { role: user.role } : undefined}
              source="gem"
              allTendersCount={gemTenders.length}
              allTenders={gemTenders}
              deleteProgress={deleteProgress}
            />
          </TabsContent>

          <TabsContent value="non-gem-tenders" className="space-y-6">
            <TenderTable
              tenders={paginatedNonGemTenders}
              totalPages={nonGemTotalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedTenders={selectedTenders}
              setSelectedTenders={setSelectedTenders}
              onMarkNotRelevant={handleMarkNotRelevant}
              onDelete={handleDelete}
              onSelectAll={handleSelectAll}
              onGlobalSelectAll={handleGlobalSelectAll}
              onDeleteSelected={handleDeleteSelected}
              user={user ? { role: user.role } : undefined}
              source="non_gem"
              allTendersCount={nonGemTenders.length}
              allTenders={nonGemTenders}
              deleteProgress={deleteProgress}
            />
          </TabsContent>

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
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                        id="tender-file-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="tender-file-upload">
                        <Button asChild disabled={isUploading}>
                          <span>{isUploading ? "Processing..." : "Select File"}</span>
                        </Button>
                      </label>
                    </div>
                    
                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Processing Excel file...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                        {uploadStats.total > 0 && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>💎 {uploadStats.gemAdded} GeM entries added</div>
                            <div>🔷 {uploadStats.nonGemAdded} Non-GeM entries added</div>
                            <div>🔄 {uploadStats.duplicates} duplicates skipped</div>
                            <div>❌ {uploadStats.errors} errors encountered</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload-history" className="space-y-6">
            <UploadHistoryComponent />
          </TabsContent>
        </Tabs>

        {/* Not Relevant Dialog */}
        <Dialog open={showNotRelevantDialog} onOpenChange={setShowNotRelevantDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Tender as Not Relevant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please provide a reason for marking this tender as not relevant:
              </p>
              <Textarea
                value={notRelevantReason}
                onChange={(e) => setNotRelevantReason(e.target.value)}
                placeholder="Enter reason for marking as not relevant..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotRelevantDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitNotRelevant}>
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}