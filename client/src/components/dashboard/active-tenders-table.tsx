import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, Edit, Brain, Trash2 } from "lucide-react";
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
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Reference No
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-96">
                    Tender Brief
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Deadline
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Location
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    Estimated Cost
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {displayedTenders.map((tender) => {
                  const daysLeft = getDaysLeft(tender.deadline);
                  const requirements = typeof tender.requirements === 'object' && tender.requirements ? tender.requirements : {};
                  const refId = (requirements as any).refId || '-';
                  const location = (requirements as any).location || '-';
                  
                  return (
                    <TableRow key={tender.id} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-4 text-sm font-medium text-gray-900 w-32">
                        {refId}
                      </TableCell>
                      <TableCell className="px-4 py-4 w-96">
                        <div className="overflow-hidden w-full">
                          <div className="text-sm text-gray-900 animate-marquee whitespace-nowrap hover:animate-none">
                            {tender.title}
                          </div>
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

            <div className="bg-white px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTenders.length)} of {filteredTenders.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
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
