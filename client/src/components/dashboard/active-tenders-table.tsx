import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, Edit, Brain, Trash2, ExternalLink, Grid, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tender } from "@shared/schema";

export default function ActiveTendersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<"all" | "gem" | "non-gem">("all");
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "7days" | "15days" | "30days" | "overdue">("all");
  const itemsPerPage = viewMode === "list" ? 10 : 12;

  const { data: tenders, isLoading } = useQuery({
    queryKey: ["/api/tenders"],
    queryFn: api.getTenders,
  });

  const getDaysLeft = (deadline: Date) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const deleteMutation = useMutation({
    mutationFn: api.deleteTender,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
    },
  });

  const filteredTenders = tenders?.filter(tender => {
    // Search filter
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Source filter (GEM/Non-GEM)
    const requirements = (tender.requirements || {}) as any;
    const isGem = requirements.source === 'gem';
    const matchesSource = sourceFilter === "all" || 
      (sourceFilter === "gem" && isGem) || 
      (sourceFilter === "non-gem" && !isGem);
    
    // Deadline filter
    const daysLeft = getDaysLeft(tender.deadline);
    let matchesDeadline = true;
    if (deadlineFilter === "7days") {
      matchesDeadline = daysLeft > 0 && daysLeft <= 7;
    } else if (deadlineFilter === "15days") {
      matchesDeadline = daysLeft > 0 && daysLeft <= 15;
    } else if (deadlineFilter === "30days") {
      matchesDeadline = daysLeft > 0 && daysLeft <= 30;
    } else if (deadlineFilter === "overdue") {
      matchesDeadline = daysLeft < 0;
    }
    
    return matchesSearch && matchesSource && matchesDeadline;
  }) || [];

  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedTenders = filteredTenders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'won':
        return 'bg-emerald-100 text-emerald-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'submitted':
        return 'Submitted';
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
      default:
        return 'Draft';
    }
  };

  const handleViewDetails = (tender: Tender) => {
    setSelectedTender(tender);
    setDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Active Tenders</CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search tenders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
              />
            </div>
            <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tenders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenders</SelectItem>
                <SelectItem value="gem">GEM Only</SelectItem>
                <SelectItem value="non-gem">Non-GEM Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deadlineFilter} onValueChange={(value: any) => setDeadlineFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Deadlines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deadlines</SelectItem>
                <SelectItem value="7days">Next 7 Days</SelectItem>
                <SelectItem value="15days">Next 15 Days</SelectItem>
                <SelectItem value="30days">Next 30 Days</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="p-1.5 h-7"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="p-1.5 h-7"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!tenders || tenders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tenders found</p>
          </div>
        ) : viewMode === "list" ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Reference No
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      Link
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Deadline
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Location
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      AI Score
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Estimated Cost
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {displayedTenders.map((tender) => {
                    const daysLeft = getDaysLeft(tender.deadline);
                    const requirements = typeof tender.requirements === 'object' && tender.requirements ? tender.requirements : {};
                    const refId = (requirements as any).refId || '';
                    const location = (requirements as any).location || '-';
                    const link = (requirements as any).link || '';
                    const source = (requirements as any).source || 'non_gem';
                    const isGem = source === 'gem';
                    const aiScore = tender.aiScore || 0;
                    
                    return (
                      <TableRow key={tender.id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-4 text-sm w-32">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-900">{refId || '-'}</span>
                            <Badge 
                              className={`text-xs font-medium ${
                                isGem 
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              {isGem ? 'GEM' : 'NON-GEM'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center w-20">
                          {link ? (
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors"
                              title="View Tender Details"
                            >
                              <ExternalLink className="h-4 w-4 text-blue-600" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4 w-28">
                          <div className="text-sm text-gray-900">
                            {format(new Date(tender.deadline), "dd-MM-yyyy")}
                          </div>
                          <div className={`text-xs ${daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {daysLeft > 0 ? `${daysLeft} days` : 
                             daysLeft === 0 ? 'Today' : 
                             'Overdue'}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-gray-700 w-48">
                          {location}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center w-20">
                          <Badge 
                            className={`text-xs font-medium ${
                              aiScore >= 85 
                                ? 'bg-green-100 text-green-700' 
                                : aiScore >= 70
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {aiScore}%
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right w-36">
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{(tender.value / 100).toLocaleString('en-IN')}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center w-32">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1.5 h-8 w-8"
                              onClick={() => handleViewDetails(tender)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // TODO: Implement assign functionality
                                console.log('Assign tender:', tender.id);
                              }}
                            >
                              Assign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="bg-white px-4 py-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTenders.length)} of {filteredTenders.length} results
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {totalPages > 7 ? (
                      <>
                        {currentPage > 3 && (
                          <>
                            <Button
                              variant={currentPage === 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                            >
                              1
                            </Button>
                            {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                          </>
                        )}
                        {[...Array(5)].map((_, i) => {
                          const pageNum = currentPage - 2 + i;
                          if (pageNum < 1 || pageNum > totalPages) return null;
                          if (pageNum === 1 && currentPage <= 3) return null;
                          if (pageNum === totalPages && currentPage >= totalPages - 2) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
                            <Button
                              variant={currentPage === totalPages ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      [...Array(totalPages)].map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Grid View
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedTenders.map((tender) => {
                const requirements = (tender.requirements || {}) as any;
                const refId = requirements.refId || '';
                const location = requirements.location || '';
                const turnover = requirements.turnover || '0';
                const link = requirements.link || '';
                const isGem = requirements.source === 'gem';
                const aiScore = tender.aiScore || 0;
                const daysLeft = getDaysLeft(tender.deadline);

                return (
                  <div key={tender.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                          {tender.title}
                        </h3>
                        <p className="text-xs text-gray-600">{tender.organization}</p>
                      </div>
                      <Badge 
                        className={`text-xs font-medium ml-2 ${
                          isGem 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isGem ? 'GEM' : 'NON-GEM'}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Reference:</span>
                        <span className="text-xs font-medium text-gray-700">{refId || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Deadline:</span>
                        <span className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-700'}`}>
                          {format(new Date(tender.deadline), "dd-MM-yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Location:</span>
                        <span className="text-xs text-gray-700 text-right max-w-[150px] truncate">{location}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Value:</span>
                        <span className="text-xs font-semibold text-gray-900">
                          ₹{(tender.value / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">AI Score:</span>
                        <Badge 
                          className={`text-xs font-medium ${
                            aiScore >= 85 
                              ? 'bg-green-100 text-green-700' 
                              : aiScore >= 70
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {aiScore}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => handleViewDetails(tender)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {link && (
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => console.log('Assign tender:', tender.id)}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white px-4 py-3 mt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTenders.length)} of {filteredTenders.length} results
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

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
                      <p className="text-sm text-gray-500">Brief:</p>
                      <p className="text-sm font-medium">{selectedTender.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Organization:</p>
                      <p className="text-sm font-medium">{selectedTender.organization}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description:</p>
                      <p className="text-sm">{selectedTender.description || 'No description available'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">GEM/Non-GEM:</p>
                      <Badge className={`text-xs font-medium ${
                        (selectedTender.requirements as any)?.source === 'gem'
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {(selectedTender.requirements as any)?.source === 'gem' ? 'GEM' : 'NON-GEM'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dates and Cost */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Important Dates & Cost</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Submission Date:</p>
                      <p className="text-sm font-medium">{format(new Date(selectedTender.deadline), "dd-MM-yyyy HH:mm")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Opening Date:</p>
                      <p className="text-sm font-medium">{format(new Date(selectedTender.deadline), "dd-MM-yyyy HH:mm")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tender Estimated Cost:</p>
                      <p className="text-sm font-medium">₹{(selectedTender.value / 100).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">EMD:</p>
                      <p className="text-sm font-medium">₹{((selectedTender.value / 100) * 0.02).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tender Document Fees:</p>
                      <p className="text-sm font-medium">Refer Document</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* AI Generated Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">AI Generated Tender Summary / Eligibility Criteria</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Tender ID:</p>
                        <p className="text-sm font-medium">{(selectedTender.requirements as any)?.refId || selectedTender.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Organization:</p>
                        <p className="text-sm font-medium">{selectedTender.organization}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ministry/State Name:</p>
                        <p className="text-sm font-medium">Ministry of Power</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Department Name:</p>
                        <p className="text-sm font-medium">Grid Controller Of India Limited</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Quantity:</p>
                        <p className="text-sm font-medium">243</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Item Category:</p>
                        <p className="text-sm font-medium">Database Management System Software (V2) (Q2) ( PAC Only )</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">MSE Exemption:</p>
                        <p className="text-sm font-medium">No</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Startup Exemption:</p>
                        <p className="text-sm font-medium">No</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">AI Analysis:</p>
                      <div className="mt-2 space-y-2">
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-sm font-medium text-blue-900 mb-1">Eligibility Analysis:</p>
                          <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Turnover Requirement: {(selectedTender.requirements as any)?.turnover || 'Not specified'}</li>
                            <li>• Your Turnover: 5 Crores (Company Setting)</li>
                            <li>• Match Score: {selectedTender.aiScore || 0}%</li>
                            {(selectedTender.aiScore || 0) >= 85 ? (
                              <li className="text-green-700 font-medium">✓ Eligible for this tender</li>
                            ) : (selectedTender.aiScore || 0) >= 70 ? (
                              <li className="text-yellow-700 font-medium">⚠ Moderate match - Review requirements</li>
                            ) : (
                              <li className="text-red-700 font-medium">✗ Low match - May not meet criteria</li>
                            )}
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-700 mb-1">Project Type Analysis:</p>
                          <p className="text-xs text-gray-600">
                            This tender appears to be for {(selectedTender.requirements as any)?.source === 'gem' ? 'government procurement' : 'general procurement'}.
                            The AI will analyze project type alignment based on your configured project types in settings.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            PDF Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Excel Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tender Overview */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tender Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">GSIT ID:</p>
                      <p className="text-sm font-medium">{(selectedTender.requirements as any)?.refId || '90005120'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity:</p>
                      <p className="text-sm font-medium">243</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Memo Exemption:</p>
                      <p className="text-sm font-medium">No</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Site Location:</p>
                      <p className="text-sm font-medium">{(selectedTender.requirements as any)?.location || 'New Delhi, Delhi'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Person:</p>
                      <p className="text-sm font-medium">Refer To Documents</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Email:</p>
                      <p className="text-sm font-medium">Refer To Documents</p>
                    </div>
                  </div>
                  {(selectedTender.requirements as any)?.link && (
                    <div className="mt-4">
                      <Button asChild>
                        <a href={(selectedTender.requirements as any).link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Tender on Website
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Tender Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tender Documents</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">NIT</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Download Tender Document 1</Button>
                      <Button size="sm" variant="outline">Download Tender Document 2</Button>
                      <Button size="sm" variant="outline">Download Tender Document 3</Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Download All Documents</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
