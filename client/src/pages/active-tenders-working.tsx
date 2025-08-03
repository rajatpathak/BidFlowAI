import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, Target, Building2, ExternalLink, Eye, UserPlus, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";

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
  link?: string;
  description?: string;
}

// Upload Component
function UploadTendersComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    processed: 0,
    duplicates: 0,
    total: 0,
    percentage: 0,
    gemAdded: 0,
    nonGemAdded: 0,
    errors: 0,
    completed: false
  });
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
    formData.append('uploadedBy', (user as any)?.username || user?.name || 'admin');
    
    const sessionId = Date.now().toString();
    formData.append('sessionId', sessionId);

    setIsUploading(true);
    setUploadProgress({ processed: 0, duplicates: 0, total: 0, percentage: 0, gemAdded: 0, nonGemAdded: 0, errors: 0, completed: false });

    try {
      // Set up SSE for progress updates
      const eventSource = new EventSource(`/api/upload-progress/${sessionId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const progress = JSON.parse(event.data);
          console.log('Progress update:', progress);
          setUploadProgress(progress);
          
          if (progress.completed) {
            eventSource.close();
          }
        } catch (e) {
          console.error('Error parsing progress:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
      };

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout - please try again')), 60000)
      );
      
      const uploadPromise = fetch('/api/upload-tenders', {
        method: 'POST',
        body: formData,
      });
      
      const response = await Promise.race([uploadPromise, timeoutPromise]);

      if ((response as Response).ok) {
        const result = await (response as Response).json();
        
        toast({
          title: "Success",
          description: `Uploaded ${result.tendersProcessed} tenders successfully! GeM: ${result.gemAdded}, Non-GeM: ${result.nonGemAdded}, Duplicates skipped: ${result.duplicatesSkipped}`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
        setSelectedFile(null);
        
        // Reset form
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload tenders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Tenders</span>
        </CardTitle>
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
          
          {(uploadProgress.percentage > 0 || isUploading) && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{uploadProgress.percentage}%</span>
              </div>
              <Progress value={uploadProgress.percentage} />
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-green-600">
                  <div className="font-medium">{uploadProgress.gemAdded}</div>
                  <div>GeM</div>
                </div>
                <div className="text-blue-600">
                  <div className="font-medium">{uploadProgress.nonGemAdded}</div>
                  <div>Non-GeM</div>
                </div>
                <div className="text-yellow-600">
                  <div className="font-medium">{uploadProgress.duplicates}</div>
                  <div>Skipped</div>
                </div>
                <div className="text-red-600">
                  <div className="font-medium">{uploadProgress.errors}</div>
                  <div>Failed</div>
                </div>
              </div>
              {isUploading && (
                <div className="text-xs text-blue-600 text-center">
                  {uploadProgress.gemAdded > 0 && `${uploadProgress.gemAdded} GeM • `}
                  {uploadProgress.nonGemAdded > 0 && `${uploadProgress.nonGemAdded} Non-GeM • `}
                  {uploadProgress.duplicates > 0 && `${uploadProgress.duplicates} skipped • `}
                  {uploadProgress.errors > 0 && `${uploadProgress.errors} failed • `}
                  Processing...
                </div>
              )}
            </div>
          )}
          
          <Button type="submit" disabled={isUploading || !selectedFile} className="w-full">
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Tenders
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Main component
export default function ActiveTendersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [notRelevantReason, setNotRelevantReason] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showNotRelevantDialog, setShowNotRelevantDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const itemsPerPage = 20;

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => fetch('/api/users').then(res => res.json())
  });

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
    queryFn: () => fetch('/api/tenders').then(res => res.json())
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
          (tender.location && tender.location.toLowerCase().includes(query))
        );
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  const gemTenders = getFilteredTenders('gem');
  const nonGemTenders = getFilteredTenders('non_gem');

  // Statistics
  const stats = {
    total: tenders.length,
    gem: gemTenders.length,
    nonGem: nonGemTenders.length,
    eligible: tenders.filter(t => t.aiScore >= 70).length,
  };

  // Handle tender assignment
  const handleAssign = async () => {
    if (!selectedTenderId || !assigneeUserId) return;
    
    try {
      const response = await fetch('/api/assign-tender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId: selectedTenderId,
          assigneeUserId,
          assignedBy: user?.id
        })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Tender assigned successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
        setShowAssignDialog(false);
        setSelectedTenderId(null);
        setAssigneeUserId("");
      } else {
        throw new Error('Assignment failed');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign tender", variant: "destructive" });
    }
  };

  // Handle mark as not relevant
  const handleNotRelevant = async () => {
    if (!selectedTenderId || !notRelevantReason) return;

    try {
      const response = await fetch(`/api/tenders/${selectedTenderId}/not-relevant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: notRelevantReason,
          submittedBy: user?.id
        })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Tender marked as not relevant" });
        queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
        setShowNotRelevantDialog(false);
        setSelectedTenderId(null);
        setNotRelevantReason("");
      } else {
        throw new Error('Failed to mark as not relevant');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark tender", variant: "destructive" });
    }
  };

  // Handle tender deletion
  const handleDelete = async (tenderId: string) => {
    if (!confirm('Are you sure you want to delete this tender?')) return;

    try {
      const response = await fetch(`/api/tenders/${tenderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Success", description: "Tender deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete tender", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Active Tenders">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading tenders...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Active Tenders">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Tenders</h1>
          <p className="text-muted-foreground">
            Manage and track tender opportunities from GeM and other portals
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Tenders</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">GeM Tenders</p>
                  <p className="text-3xl font-bold text-green-700">{stats.gem}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Non-GeM Tenders</p>
                  <p className="text-3xl font-bold text-orange-700">{stats.nonGem}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">AI Eligible</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.eligible}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <UploadTendersComponent />

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search tenders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tender Tables */}
        <Tabs defaultValue="gem" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gem">GeM Tenders ({gemTenders.length})</TabsTrigger>
            <TabsTrigger value="non-gem">Non-GeM Tenders ({nonGemTenders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="gem" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GeM Portal Tenders</CardTitle>
                <CardDescription>Government e-Marketplace tender opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gemTenders.slice(0, itemsPerPage).map((tender) => (
                      <TableRow key={tender.id}>
                        <TableCell className="font-medium">{tender.title}</TableCell>
                        <TableCell>{tender.organization}</TableCell>
                        <TableCell>₹{tender.value.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(tender.deadline), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{tender.location}</TableCell>
                        <TableCell>
                          <Badge variant={tender.aiScore >= 70 ? "default" : "secondary"}>
                            {tender.aiScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="View Details"
                              onClick={() => {
                                setSelectedTender(tender);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Assign Tender"
                              onClick={() => {
                                setSelectedTenderId(tender.id);
                                setShowAssignDialog(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Mark Not Relevant"
                              onClick={() => {
                                setSelectedTenderId(tender.id);
                                setShowNotRelevantDialog(true);
                              }}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>

                            {tender.link && (
                              <Button variant="outline" size="sm" asChild title="External Link">
                                <a href={tender.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}

                            {(user?.role === 'admin' || user?.role === 'manager') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Delete"
                                onClick={() => handleDelete(tender.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="non-gem" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Non-GeM Portal Tenders</CardTitle>
                <CardDescription>Tender opportunities from other government and private portals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonGemTenders.slice(0, itemsPerPage).map((tender) => (
                      <TableRow key={tender.id}>
                        <TableCell className="font-medium">{tender.title}</TableCell>
                        <TableCell>{tender.organization}</TableCell>
                        <TableCell>₹{tender.value.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(tender.deadline), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{tender.location}</TableCell>
                        <TableCell>
                          <Badge variant={tender.aiScore >= 70 ? "default" : "secondary"}>
                            {tender.aiScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="View Details"
                              onClick={() => {
                                setSelectedTender(tender);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Assign Tender"
                              onClick={() => {
                                setSelectedTenderId(tender.id);
                                setShowAssignDialog(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Mark Not Relevant"
                              onClick={() => {
                                setSelectedTenderId(tender.id);
                                setShowNotRelevantDialog(true);
                              }}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>

                            {tender.link && (
                              <Button variant="outline" size="sm" asChild title="External Link">
                                <a href={tender.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}

                            {(user?.role === 'admin' || user?.role === 'manager') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Delete"
                                onClick={() => handleDelete(tender.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Tender</DialogTitle>
              <DialogDescription>
                Assign this tender to a team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Assign to:</Label>
                <Select value={assigneeUserId} onValueChange={setAssigneeUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
              <Button onClick={handleAssign}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Not Relevant Dialog */}
        <Dialog open={showNotRelevantDialog} onOpenChange={setShowNotRelevantDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Not Relevant</DialogTitle>
              <DialogDescription>
                Please provide a reason why this tender is not relevant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason:</Label>
                <Textarea 
                  value={notRelevantReason}
                  onChange={(e) => setNotRelevantReason(e.target.value)}
                  placeholder="Enter reason..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotRelevantDialog(false)}>Cancel</Button>
              <Button onClick={handleNotRelevant}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Tender Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Tender Details</DialogTitle>
              <DialogDescription>
                Complete information about this tender opportunity
              </DialogDescription>
            </DialogHeader>
            {selectedTender && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Title</h3>
                    <p className="text-sm">{selectedTender.title}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Organization</h3>
                    <p className="text-sm">{selectedTender.organization}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Value</h3>
                    <p className="text-sm">₹{selectedTender.value.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Deadline</h3>
                    <p className="text-sm">{format(new Date(selectedTender.deadline), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Location</h3>
                    <p className="text-sm">{selectedTender.location}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Source</h3>
                    <Badge variant={selectedTender.source === 'gem' ? "default" : "secondary"}>
                      {selectedTender.source === 'gem' ? 'GeM Portal' : 'Non-GeM Portal'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedTender.description || 'No description available'}</p>
                </div>

                {selectedTender.link && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">External Link</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(selectedTender.link, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View on Portal</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}