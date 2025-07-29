import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Search, Filter, UserPlus, ExternalLink, Calendar, Building2, MapPin } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Tender = {
  id: string;
  title: string;
  organization: string;
  description: string | null;
  value: number;
  deadline: Date;
  status: string;
  aiScore: number | null;
  requirements: unknown;
  createdAt: Date | null;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function EnhancedTendersPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    minMatch: 'any',
    location: '',
    organization: '',
  });
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<string | null>(null);
  const { toast } = useToast();

  // Build query string for filtering
  const buildQueryString = (filterParams: {
    status: string;
    search: string;
    minMatch: string;
    location: string;
    organization: string;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, String(value));
      }
    });
    return params.toString();
  };

  const { data: tenders = [], isLoading: tendersLoading, refetch } = useQuery<Tender[]>({
    queryKey: ["/api/tenders", buildQueryString(filters)],
    queryFn: async () => {
      // Apply client-side filtering since we have the tenders data
      const response = await fetch("/api/tenders");
      if (!response.ok) throw new Error("Failed to fetch tenders");
      let allTenders: Tender[] = await response.json();

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        allTenders = allTenders.filter(t => t.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        allTenders = allTenders.filter(t => 
          t.title.toLowerCase().includes(searchLower) ||
          t.organization.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower))
        );
      }

      if (filters.minMatch && filters.minMatch !== 'any') {
        const minScore = parseInt(filters.minMatch);
        allTenders = allTenders.filter(t => (t.aiScore || 0) >= minScore);
      }

      if (filters.location) {
        allTenders = allTenders.filter(t => {
          const requirements = t.requirements as any;
          return requirements?.location?.toLowerCase().includes(filters.location.toLowerCase());
        });
      }

      if (filters.organization) {
        allTenders = allTenders.filter(t => 
          t.organization.toLowerCase().includes(filters.organization.toLowerCase())
        );
      }

      return allTenders;
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const assignForm = useForm({
    defaultValues: {
      assignedTo: "",
      notes: "",
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { assignedTo: string; notes: string }) => {
      const response = await fetch(`/api/tenders/${selectedTender}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          assignedBy: "admin", // Should come from auth context
        }),
      });
      if (!response.ok) throw new Error("Failed to assign tender");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      setIsAssignDialogOpen(false);
      setSelectedTender(null);
      assignForm.reset();
      toast({
        title: "Tender assigned",
        description: "The tender has been assigned to the bidder successfully.",
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const onAssignSubmit = (data: { assignedTo: string; notes: string }) => {
    assignMutation.mutate(data);
  };

  const openAssignDialog = (tenderId: string) => {
    setSelectedTender(tenderId);
    setIsAssignDialogOpen(true);
  };

  const getAIMatchBadge = (score: number | null) => {
    if (!score) return <Badge variant="secondary">No Score</Badge>;
    
    if (score >= 90) return <Badge className="bg-green-500">Perfect Match {score}%</Badge>;
    if (score >= 80) return <Badge className="bg-blue-500">Good Match {score}%</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Fair Match {score}%</Badge>;
    return <Badge variant="destructive">Manual Review {score}%</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const bidders = users.filter(user => user.role === 'bidder' || user.role === 'manager');

  if (tendersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Active Tenders</h1>
          <p className="text-gray-600">View and manage tenders with AI matching and filtering</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => document.getElementById('tender-upload-input')?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Tender Excel
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {tenders.length} Tenders
          </Badge>
        </div>
      </div>
      
      {/* Hidden file input for tender upload */}
      <input
        id="tender-upload-input"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            toast({
              title: "Uploading tenders...",
              description: "Processing Excel file, please wait.",
            });
            
            const response = await fetch('/api/upload-tenders', {
              method: 'POST',
              body: formData,
            });
            
            if (response.ok) {
              const result = await response.json();
              toast({
                title: "Tenders uploaded successfully",
                description: `Processed ${result.processed} tenders from Excel file.`,
              });
              queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
            } else {
              throw new Error('Upload failed');
            }
          } catch (error) {
            toast({
              title: "Upload failed",
              description: "Failed to process tender file. Please check the format.",
              variant: "destructive",
            });
          }
          
          // Reset the input
          e.target.value = '';
        }}
      />

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenders..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">AI Match %</label>
              <Select value={filters.minMatch} onValueChange={(value) => handleFilterChange('minMatch', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Min Match %" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Match</SelectItem>
                  <SelectItem value="90">90%+ Perfect</SelectItem>
                  <SelectItem value="80">80%+ Good</SelectItem>
                  <SelectItem value="60">60%+ Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="Filter by location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
              <Input
                placeholder="Filter by organization"
                value={filters.organization}
                onChange={(e) => handleFilterChange('organization', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilters({ status: 'all', search: '', minMatch: '', location: '', organization: '' })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tender List</CardTitle>
          <CardDescription>
            AI-matched tenders with eligibility scoring and assignment capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference / Title</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>AI Match</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenders.map((tender) => {
                  const requirements = tender.requirements as any;
                  const refId = requirements?.refId || tender.id.slice(0, 8);
                  
                  return (
                    <TableRow key={tender.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {refId}
                            </Badge>
                          </div>
                          <div className="font-medium">{tender.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {tender.description}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{tender.organization}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatCurrency(tender.value)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(tender.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {requirements?.location || "Not specified"}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getAIMatchBadge(tender.aiScore)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => openAssignDialog(tender.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Tender to Bidder</DialogTitle>
            <DialogDescription>
              Select a bidder to assign this tender for bid preparation
            </DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Bidder</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bidder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bidders.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Notes</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Add notes for the assigned bidder..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? "Assigning..." : "Assign Tender"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}