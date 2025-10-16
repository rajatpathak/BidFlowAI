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
  Users,
  Eye,
  Trash2
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Tender = {
  id: string;
  title: string;
  organization: string;
  referenceNumber: string | null;
  location: string | null;
  value: number | null;
  deadline: string | null;
  status: string;
  source: string;
  assignedTo: string | null;
  aiScore: number;
  link: string | null;
  createdAt: string | null;
  requirements?: any[];
  category?: string;
  winProbability?: number;
  currency?: string;
  estimatedValue?: number;
};

type TenderResponse = {
  data: Tender[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: any;
  sort?: any;
};

export default function ActiveTendersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
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

  // Build query parameters for the enhanced API
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: itemsPerPage.toString(),
    sortBy: 'deadline',
    sortOrder: 'ASC'
  });

  if (searchQuery) queryParams.set('search', searchQuery);
  if (locationFilter !== 'all') queryParams.set('location', locationFilter);
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);
  if (sourceFilter !== 'all') queryParams.set('source', sourceFilter);

  const { data: tendersResponse, isLoading } = useQuery<TenderResponse>({
    queryKey: [`/api/tenders?${queryParams.toString()}`],
  });

  // Extract tenders and pagination info from the enhanced API response
  const tenders = tendersResponse?.data || [];
  const pagination = tendersResponse?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };

  // Get unique locations and sources for filters
  const { data: allTendersResponse } = useQuery<TenderResponse>({
    queryKey: ['/api/tenders?limit=1000'], // Get all for filter options
  });
  const allTenders = allTendersResponse?.data || [];
  const locations = Array.from(new Set(allTenders.map(t => t.location).filter(Boolean)));
  const sources = Array.from(new Set(allTenders.map(t => t.source).filter(Boolean)));

  // Calculate stats from all tenders
  const stats = {
    total: pagination.total,
    eligible: allTenders.filter(t => t.aiScore >= 70).length,
    assigned: allTenders.filter(t => t.assignedTo).length,
    highValue: allTenders.filter(t => (t.value || 0) > 10000000).length // > 1 Crore
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
      const allIds = new Set(tenders.map(t => t.id));
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

  // Format currency
  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get source badge color
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'gem': return 'bg-blue-100 text-blue-800';
      case 'non_gem': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Value ({'>'}₹1Cr)</p>
                <p className="text-2xl font-bold text-purple-600">{stats.highValue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenders by title, organization, or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="gem">GeM</SelectItem>
                <SelectItem value="non_gem">Non-GeM</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location || ''} value={location || ''}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {selectedTenders.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedTenders.size} tender(s) selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Selected"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenders List</CardTitle>
              <CardDescription>
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tenders
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Checkbox
                checked={selectedTenders.size === tenders.length && tenders.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTenders.has(tender.id)}
                      onCheckedChange={(checked) => handleTenderSelect(tender.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{tender.title}</p>
                      {tender.referenceNumber && (
                        <p className="text-xs text-gray-500">{tender.referenceNumber}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="truncate">{tender.organization}</p>
                      {tender.location && (
                        <p className="text-xs text-gray-500">{tender.location}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tender.value ? formatCurrency(tender.value, tender.currency) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {tender.deadline ? formatDate(tender.deadline) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tender.status)}>
                      {tender.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSourceColor(tender.source)}>
                      {tender.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${
                        tender.aiScore >= 70 ? 'text-green-600' : 
                        tender.aiScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {tender.aiScore}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignDialog(tender.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      {tender.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(tender.link || '', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tender</DialogTitle>
            <DialogDescription>
              Assign this tender to a team member for bidding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignedTo">Assign to</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="bidder">Bidder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any notes or instructions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTender} disabled={isAssigning || !assignedTo}>
              {isAssigning ? "Assigning..." : "Assign Tender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}