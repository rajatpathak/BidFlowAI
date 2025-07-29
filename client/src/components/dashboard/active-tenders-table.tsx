import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, Edit, Brain, Trash2, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { Tender } from "@shared/schema";

export default function ActiveTendersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: tenders, isLoading } = useQuery({
    queryKey: ["/api/tenders"],
    queryFn: api.getTenders,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTender,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
    },
  });

  const filteredTenders = tenders?.filter(tender =>
    tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tender.organization.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  const getDaysLeft = (deadline: Date) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!tenders || tenders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tenders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Reference No
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                      Tender Brief
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Deadline
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Location
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      Estimated Cost
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
                    const source = (requirements as any).source || tender.source || 'non_gem';
                    const isGem = source === 'gem' || (tender.description && tender.description.toLowerCase().includes('gem'));
                    
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
                        <TableCell className="px-4 py-4 w-96">
                          <div className="flex items-center gap-1 overflow-hidden w-full group">
                            {link ? (
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 overflow-hidden w-full hover:text-blue-600"
                              >
                                <span className="text-sm text-gray-900 flex-shrink-0 group-hover:text-blue-600">
                                  {tender.title.split(' ').slice(0, 2).join(' ')}
                                </span>
                                {tender.title.split(' ').length > 2 && (
                                  <div className="overflow-hidden flex-1">
                                    <div className="text-sm text-gray-900 animate-marquee whitespace-nowrap hover:animate-none group-hover:text-blue-600">
                                      {tender.title.split(' ').slice(2).join(' ')}
                                    </div>
                                  </div>
                                )}
                                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ) : (
                              <>
                                <span className="text-sm text-gray-900 flex-shrink-0">
                                  {tender.title.split(' ').slice(0, 2).join(' ')}
                                </span>
                                {tender.title.split(' ').length > 2 && (
                                  <div className="overflow-hidden flex-1">
                                    <div className="text-sm text-gray-900 animate-marquee whitespace-nowrap hover:animate-none">
                                      {tender.title.split(' ').slice(2).join(' ')}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
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
                        <TableCell className="px-4 py-4 text-right w-36">
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{(tender.value / 100).toLocaleString('en-IN')}
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
        )}
      </CardContent>
    </Card>
  );
}
