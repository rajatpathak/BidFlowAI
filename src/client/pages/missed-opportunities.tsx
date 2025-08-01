import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CalendarDays, Building2, DollarSign, RefreshCw, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MissedOpportunity {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  created_at: string;
}

export default function MissedOpportunities() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch missed opportunities
  const { data: missedOps, isLoading, refetch } = useQuery<MissedOpportunity[]>({
    queryKey: ['/api/missed-opportunities'],
  });

  // Process missed opportunities mutation
  const processOpportunities = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/process-missed-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to process missed opportunities');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Processing Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/missed-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process missed opportunities",
        variant: "destructive",
      });
    },
  });

  // Filter missed opportunities based on search
  const filteredOps = missedOps?.filter(op => 
    op.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.organization.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate stats
  const totalValue = missedOps?.reduce((sum, op) => sum + (op.value || 0), 0) || 0;
  const avgValue = missedOps?.length ? totalValue / missedOps.length : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            Missed Opportunities
          </h1>
          <p className="text-gray-600 mt-2">
            Tenders that passed their deadline without assignment
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => processOpportunities.mutate()}
            disabled={processOpportunities.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${processOpportunities.isPending ? 'animate-spin' : ''}`} />
            Process Expired
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Missed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {missedOps?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Opportunities lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{(totalValue / 100).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined value lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{(avgValue / 100).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Per opportunity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find specific missed opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missed Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Missed Opportunities ({filteredOps.length})
          </CardTitle>
          <CardDescription>
            {searchQuery && `Filtered results for "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No missed opportunities found</p>
              <p className="text-sm">
                {searchQuery ? 'Try adjusting your search criteria' : 'All tenders are being actively managed'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender Details</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Days Missed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOps.map((opportunity) => {
                    const deadline = new Date(opportunity.deadline);
                    const daysMissed = Math.floor((new Date().getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <TableRow key={opportunity.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <p className="font-medium text-sm leading-tight">
                              {opportunity.title}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              Missed Opportunity
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{opportunity.organization}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm">
                              ₹{((opportunity.value || 0) / 100).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-red-600">
                              {deadline.toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="destructive" 
                            className="text-xs"
                          >
                            {daysMissed} day{daysMissed !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}