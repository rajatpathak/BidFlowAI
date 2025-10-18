import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Eye, Plus, Search } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import EMDStatusCards from "@/components/finance/emd-status-cards";

type FinanceRequest = {
  id: string;
  tenderId: string;
  tenderTitle?: string;
  requirement: string;
  paymentMode: string;
  amount: number;
  requesterName: string;
  financeExecutive?: string;
  requestedDate: string;
  deadlineDate: string;
  approvalStatus: string;
  tenderBrief?: string;
  tenderAuthority?: string;
  referenceNumber?: string;
  tenderStatus?: string;
};

export default function FinanceEnhanced() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new-request");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<FinanceRequest | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery<FinanceRequest[]>({
    queryKey: ["/api/finance/requests", activeTab, searchQuery],
  });

  // Fallback data for display
  const displayRequests: FinanceRequest[] = requests.length > 0 ? requests : [
    {
      id: "1",
      tenderId: "1179",
      requirement: "EMD",
      paymentMode: "Offline",
      amount: 10000,
      requesterName: "Palak Shah",
      financeExecutive: "Virishin Patel",
      requestedDate: "2023-04-15T11:17:00",
      deadlineDate: "2023-04-15T11:17:00",
      approvalStatus: "Pending",
      tenderBrief: "Lorem ipsum dolor sit amet consectetur. A eleifend viverra quis cras nisl ....",
      tenderAuthority: "ajmer vidyut vitran nigam limited",
      referenceNumber: "2024_AVVNL_382210_10",
      tenderStatus: "Assigned To Abhinav",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      "Pending": { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      "Approved": { color: "bg-green-100 text-green-800", label: "Approved" },
      "Denied": { color: "bg-red-100 text-red-800", label: "Denied" },
      "Completed": { color: "bg-blue-100 text-blue-800", label: "Completed" },
    };
    const config = statusMap[status] || statusMap["Pending"];
    return (
      <Badge className={config.color} data-testid={`status-badge-${status.toLowerCase()}`}>
        {config.label}
      </Badge>
    );
  };

  const handleViewDetails = (request: FinanceRequest) => {
    setSelectedRequest(request);
    setViewDetailsOpen(true);
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-64"
          data-testid="input-search-finance"
        />
      </div>
      <Button className="bg-gradient-primary" data-testid="button-add-finance">
        <Plus className="h-4 w-4 mr-2" />
        Add New Request
      </Button>
    </div>
  );

  const breadcrumbs = [
    { label: "Financial Management" },
    { label: "Finance Request" },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Financial Management"
        description="Manage EMD, PBG, SD requests and approvals"
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* EMD Status Cards */}
          <EMDStatusCards />

          {/* Finance Requests Table */}
          <Card data-testid="finance-requests-table">
            <CardHeader className="pb-3">
              <CardTitle>Finance Requests</CardTitle>
              <CardDescription>View and manage all finance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="new-request" data-testid="tab-new-request">
                    New Request
                  </TabsTrigger>
                  <TabsTrigger value="approve-request" data-testid="tab-approve-request">
                    Approve Request
                  </TabsTrigger>
                  <TabsTrigger value="denied-request" data-testid="tab-denied-request">
                    Denied Request
                  </TabsTrigger>
                  <TabsTrigger value="completed-request" data-testid="tab-completed-request">
                    Completed Request
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Tender ID</TableHead>
                          <TableHead>Requirement</TableHead>
                          <TableHead>Payment Mode</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Requester Name</TableHead>
                          <TableHead>Finance Executive</TableHead>
                          <TableHead>Requested Date</TableHead>
                          <TableHead>Deadline Date</TableHead>
                          <TableHead>Approval Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-8">
                              <div className="animate-pulse">Loading...</div>
                            </TableCell>
                          </TableRow>
                        ) : displayRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                              No requests found
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayRequests.map((request, index) => (
                            <TableRow key={request.id} data-testid={`finance-request-row-${index}`}>
                              <TableCell>{String(index + 1).padStart(2, "0")}</TableCell>
                              <TableCell className="font-medium" data-testid={`tender-id-${index}`}>
                                {request.tenderId}
                              </TableCell>
                              <TableCell>{request.requirement}</TableCell>
                              <TableCell>{request.paymentMode}</TableCell>
                              <TableCell className="font-semibold">
                                ₹{request.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>{request.requesterName}</TableCell>
                              <TableCell>{request.financeExecutive || "-"}</TableCell>
                              <TableCell>
                                {new Date(request.requestedDate).toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell>
                                {new Date(request.deadlineDate).toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell>{getStatusBadge(request.approvalStatus)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(request)}
                                  data-testid={`button-view-details-${index}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-view-details">
          <DialogHeader>
            <DialogTitle>View Request Finance Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tender ID</label>
                  <p className="text-base font-semibold" data-testid="detail-tender-id">
                    {selectedRequest.tenderId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Request Reference Number</label>
                  <p className="text-base font-semibold" data-testid="detail-reference-number">
                    {selectedRequest.referenceNumber || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Tender Brief</label>
                <p className="text-sm mt-1" data-testid="detail-tender-brief">
                  {selectedRequest.tenderBrief || "No brief available"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Tender Authority</label>
                <p className="text-base font-semibold" data-testid="detail-tender-authority">
                  {selectedRequest.tenderAuthority || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Tender Status</label>
                <p className="text-base font-semibold" data-testid="detail-tender-status">
                  {selectedRequest.tenderStatus || "N/A"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
