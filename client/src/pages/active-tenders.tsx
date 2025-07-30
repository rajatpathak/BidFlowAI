import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  XCircle
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
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
  const itemsPerPage = 20;

  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: imports = [], isLoading: importsLoading } = useQuery<TenderImport[]>({
    queryKey: ["/api/tender-imports"],
  });

  // Filter tenders
  const filteredTenders = tenders.filter(tender => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        tender.title.toLowerCase().includes(query) ||
        tender.organization.toLowerCase().includes(query) ||
        (tender.location && tender.location.toLowerCase().includes(query)) ||
        (tender.referenceNo && tender.referenceNo.toLowerCase().includes(query))
      );
      if (!matchesSearch) return false;
    }

    // Location filter
    if (locationFilter !== "all" && tender.location !== locationFilter) return false;

    // Status filter
    if (statusFilter !== "all" && tender.status !== statusFilter) return false;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      const response = await fetch("/api/tender-imports", {
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
        description: `Processed ${result.tendersProcessed} tenders successfully.`,
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

      <Tabs defaultValue="active-tenders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-tenders">Active Tenders</TabsTrigger>
          <TabsTrigger value="upload-tenders">Upload Tenders</TabsTrigger>
          <TabsTrigger value="upload-history">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="active-tenders" className="space-y-6">{/* Active Tenders Content */}

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
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setLocationFilter("all");
                  setStatusFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenders Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Tenders ({filteredTenders.length})</CardTitle>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableHead>Tender Details</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTenders.map((tender) => (
                    <TableRow key={tender.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{tender.title}</div>
                          {tender.referenceNo && (
                            <div className="text-sm text-gray-500">Ref: {tender.referenceNo}</div>
                          )}
                          {tender.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Building2 className="h-3 w-3 mr-1" />
                              {tender.location}
                            </div>
                          )}
                        </div>
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
                          <Button size="sm" variant="outline">
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
    </div>
  );
}