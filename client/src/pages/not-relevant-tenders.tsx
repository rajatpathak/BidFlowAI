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
import { Label } from "@/components/ui/label";
import { 
  XCircle, 
  Calendar,
  Building2,
  DollarSign,
  ExternalLink,
  User,
  Search,
  CheckCircle
} from "lucide-react";

interface NotRelevantTender {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  not_relevant_reason: string;
  not_relevant_approved_at: string;
  requested_by_name: string;
  requested_by_username: string;
  approved_by_name: string;
  approved_by_username: string;
  location: string;
  source: string;
}

export default function NotRelevantTenders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 20;

  // Fetch not relevant tenders
  const { data: tenders = [], isLoading } = useQuery<NotRelevantTender[]>({
    queryKey: ["/api/tenders/not-relevant"],
    queryFn: () => fetch("/api/tenders/not-relevant").then(res => res.json()),
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

  // Filter tenders based on search
  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch = !searchQuery || 
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.not_relevant_reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Not Relevant Tenders</h1>
          <p className="text-gray-600 mt-1">Tenders that have been marked as not relevant and approved by admin</p>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <Badge variant="secondary">
            {filteredTenders.length} not relevant
          </Badge>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title, organization, location, or reason..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Not Relevant Tenders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Not Relevant Tenders ({filteredTenders.length})</CardTitle>
          <CardDescription>
            Archive of tenders that have been marked as not relevant and approved by administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-500">Loading not relevant tenders...</p>
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No tenders found</h3>
                  <p className="text-gray-500 mt-1">
                    No not relevant tenders match your search criteria.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No not relevant tenders</h3>
                  <p className="text-gray-500 mt-1">
                    No tenders have been marked as not relevant yet.
                  </p>
                </>
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
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Approved Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTenders.map((tender) => (
                      <TableRow key={tender.id}>
                        {/* Tender Details */}
                        <TableCell>
                          <div className="space-y-2">
                            <div className="font-medium text-sm leading-tight">
                              {tender.title.length > 60 
                                ? `${tender.title.substring(0, 60)}...` 
                                : tender.title}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={
                                tender.source === 'gem' 
                                  ? "border-green-500 text-green-700"
                                  : "border-blue-500 text-blue-700"
                              }>
                                {tender.source === 'gem' ? 'GeM' : 'Non-GeM'}
                              </Badge>
                              <Badge variant="destructive" className="bg-red-100 text-red-800">
                                Not Relevant
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Organization */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {tender.organization.length > 25 
                                ? `${tender.organization.substring(0, 25)}...` 
                                : tender.organization}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Value */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {formatCurrency(tender.value)}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Reason */}
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 line-clamp-2" title={tender.not_relevant_reason}>
                              {tender.not_relevant_reason.length > 50 
                                ? `${tender.not_relevant_reason.substring(0, 50)}...`
                                : tender.not_relevant_reason}
                            </p>
                          </div>
                        </TableCell>
                        
                        {/* Requested By */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium">{tender.requested_by_name}</div>
                              <div className="text-xs text-gray-500">@{tender.requested_by_username}</div>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Approved By */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <div>
                              <div className="text-sm font-medium">{tender.approved_by_name}</div>
                              <div className="text-xs text-gray-500">@{tender.approved_by_username}</div>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Approved Date */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {new Date(tender.not_relevant_approved_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/tender/${tender.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Button>
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