import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AssignedTender {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  location: string;
  referenceNo: string;
  link?: string;
  aiScore: number;
  status: string;
  assignedAt: string;
  assignedBy: string;
  assignmentNotes?: string;
}

export default function AssignedTenders() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 20;

  // Fetch assigned tenders for current user
  const { data: assignedTenders = [], isLoading } = useQuery<AssignedTender[]>({
    queryKey: ["/api/tenders/assigned", user?.username],
    enabled: !!user?.username,
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

  // Filter tenders based on search and status
  const filteredTenders = assignedTenders.filter((tender) => {
    const matchesSearch = !searchQuery || 
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || tender.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
                      <TableHead>AI Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTenders.map((tender) => (
                      <TableRow key={tender.id}>
                        {/* Tender Details */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {tender.title}
                            </div>
                            {tender.referenceNo && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {tender.referenceNo}
                              </Badge>
                            )}
                            {tender.assignmentNotes && (
                              <div className="text-xs text-gray-500 mt-1">
                                Note: {tender.assignmentNotes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Organization */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            {tender.organization}
                          </div>
                        </TableCell>
                        
                        {/* Value */}
                        <TableCell>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(tender.value)}
                          </div>
                        </TableCell>
                        
                        {/* Deadline */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {tender.deadline ? new Date(tender.deadline).toLocaleDateString() : "N/A"}
                          </div>
                        </TableCell>
                        
                        {/* Location */}
                        <TableCell>
                          <div className="text-sm">{tender.location || "N/A"}</div>
                        </TableCell>
                        
                        {/* AI Score */}
                        <TableCell>
                          <Badge 
                            variant={tender.aiScore >= 70 ? "default" : "secondary"}
                            className={tender.aiScore >= 70 ? "bg-green-500 text-white" : ""}
                          >
                            {tender.aiScore}%
                          </Badge>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell>
                          <Badge variant="outline">
                            {tender.status || 'Assigned'}
                          </Badge>
                        </TableCell>
                        
                        {/* Assigned By */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-gray-400" />
                            {tender.assignedBy || 'Admin'}
                          </div>
                        </TableCell>
                        
                        {/* Actions */}
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
    </div>
  );
}