import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFinanceRequestSchema } from "@shared/schema";
import { z } from "zod";
import { DollarSign, Clock, AlertTriangle, CheckCircle, Plus, TrendingUp, Building2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FinanceRequest = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  requestDate: Date | null;
  approvalDate: Date | null;
  expiryDate: Date | null;
  tenderId: string | null;
  requesterId: string | null;
  approvedBy: string | null;
  metadata: unknown;
};

type FinanceOverview = {
  totalRequests: number;
  pendingAmount: number;
  approvedAmount: number;
  emdBlocked: number;
  upcomingExpiries: FinanceRequest[];
};

const financeRequestFormSchema = insertFinanceRequestSchema.extend({
  amount: z.number().min(1, "Amount must be greater than 0"),
});

export default function FinancePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: overview, isLoading: overviewLoading } = useQuery<FinanceOverview>({
    queryKey: ["/api/finance-overview"],
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<FinanceRequest[]>({
    queryKey: ["/api/finance-requests"],
  });

  const { data: tenders = [] } = useQuery({
    queryKey: ["/api/tenders"],
  });

  const form = useForm<z.infer<typeof financeRequestFormSchema>>({
    resolver: zodResolver(financeRequestFormSchema),
    defaultValues: {
      type: "emd",
      amount: 0,
      description: "",
      status: "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof financeRequestFormSchema>) => {
      const response = await fetch("/api/finance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: data.amount * 100 }), // Convert to cents
      });
      if (!response.ok) throw new Error("Failed to create finance request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-overview"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Finance request created",
        description: "Your finance request has been submitted for approval.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "processed": return "bg-blue-100 text-blue-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emd": return <Building2 className="h-4 w-4" />;
      case "pbg": return <CheckCircle className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const onSubmit = (data: z.infer<typeof financeRequestFormSchema>) => {
    createMutation.mutate(data);
  };

  if (overviewLoading || requestsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold">Finance Management</h1>
          <p className="text-gray-600">Manage EMD, PBG, and other financial requirements</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Finance Request</DialogTitle>
              <DialogDescription>
                Submit a new finance request for approval
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="emd">EMD (Earnest Money Deposit)</SelectItem>
                          <SelectItem value="pbg">PBG (Performance Bank Guarantee)</SelectItem>
                          <SelectItem value="document_fee">Document Fee</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Tender (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenders.map((tender: any) => (
                            <SelectItem key={tender.id} value={tender.id}>
                              {tender.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter request details"
                          {...field}
                          value={field.value || ""}
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
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalRequests || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview?.pendingAmount?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview?.approvedAmount?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EMD Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview?.emdBlocked?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Finance Requests</CardTitle>
              <CardDescription>All finance requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(request.type)}
                          <span className="font-medium">{request.type.toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        ${(request.amount / 100).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>Requests waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.filter(r => r.status === 'pending').map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(request.type)}
                          <span className="font-medium">{request.type.toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        ${(request.amount / 100).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Soon</CardTitle>
              <CardDescription>Finance requests expiring within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.upcomingExpiries && overview.upcomingExpiries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.upcomingExpiries.map((request) => {
                      const daysLeft = request.expiryDate 
                        ? Math.ceil((new Date(request.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(request.type)}
                              <span className="font-medium">{request.type.toUpperCase()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            ${(request.amount / 100).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {request.expiryDate ? new Date(request.expiryDate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"}>
                              {daysLeft} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">No expiring requests</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}