import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenderTable } from "@/components/tenders/tender-table";
import { FileSpreadsheet, FileText, Target, Building2, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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
      setUploadProgress(10);

      // Real progress tracking
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 2, 85));
      }, 200);

      const response = await fetch('/api/upload-tenders', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);
      
      toast({
        title: "Upload Complete",
        description: `${result.tendersProcessed || 0} tenders imported from ${result.sheetsProcessed || 0} sheets`,
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
          Upload Excel files with GeM and Non-GeM tender data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".xlsx,.xls"
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
  const itemsPerPage = 20;

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
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

  // Assignment dialog handler
  const openAssignDialog = (tenderId: string) => {
    toast({
      title: "Assignment Feature",
      description: "Assignment functionality will be implemented soon.",
    });
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Active Tenders</h1>
            <p className="text-gray-600">Manage GeM and Non-GeM tender opportunities</p>
          </div>
        </div>

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
                  <p className="text-sm text-gray-600">GeM Tenders</p>
                  <p className="text-2xl font-bold text-green-600">{stats.gem}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Non-GeM Tenders</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.nonGem}</p>
                </div>
                <Building2 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Eligible (≥70%)</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.eligible}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search tenders by title, organization, location, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs for GeM and Non-GeM Tenders */}
        <Tabs defaultValue="gem-tenders" className="w-full">
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
              openAssignDialog={openAssignDialog}
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
              openAssignDialog={openAssignDialog}
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
    </div>
  );
}