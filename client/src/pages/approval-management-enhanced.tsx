import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

type ApprovalRequest = {
  id: string;
  tenderId: string;
  approvalFor: string;
  approvalFrom: string;
  inLoop: string;
  requester: string;
  requestDate: string;
  actionDate: string;
  deadlineDate: string;
  status: string;
};

export default function ApprovalManagementEnhanced() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: approvals = [], isLoading } = useQuery<ApprovalRequest[]>({
    queryKey: ["/api/approvals", searchQuery],
  });

  // Fallback data for display
  const displayApprovals: ApprovalRequest[] = approvals.length > 0 ? approvals : [
    {
      id: "1",
      tenderId: "1179",
      approvalFor: "EMD",
      approvalFrom: "Offline",
      inLoop: "10,000",
      requester: "Palak Shah",
      requestDate: "2023-04-15T11:17:00",
      actionDate: "2023-04-15T11:17:00",
      deadlineDate: "2023-04-15T11:17:00",
      status: "Pending",
    },
    {
      id: "2",
      tenderId: "1179",
      approvalFor: "EMD",
      approvalFrom: "Offline",
      inLoop: "10,000",
      requester: "Palak Shah",
      requestDate: "2023-04-15T11:17:00",
      actionDate: "2023-04-15T11:17:00",
      deadlineDate: "2023-04-15T11:17:00",
      status: "Pending",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      "Pending": { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      "Approved": { color: "bg-green-100 text-green-800", label: "Approved" },
      "Rejected": { color: "bg-red-100 text-red-800", label: "Rejected" },
    };
    const config = statusMap[status] || statusMap["Pending"];
    return (
      <Badge className={config.color} data-testid={`approval-status-${status.toLowerCase()}`}>
        {config.label}
      </Badge>
    );
  };

  const actions = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search approvals..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 w-64"
        data-testid="input-search-approvals"
      />
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
        description="Manage approval requests and workflows"
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card data-testid="approval-requests-table">
            <CardHeader className="pb-3">
              <CardTitle>Approval Management</CardTitle>
              <CardDescription>View and manage all approval requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Tender ID</TableHead>
                      <TableHead>Approval For</TableHead>
                      <TableHead>Approval From</TableHead>
                      <TableHead>In Loop</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Action Date</TableHead>
                      <TableHead>Deadline Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          <div className="animate-pulse">Loading approvals...</div>
                        </TableCell>
                      </TableRow>
                    ) : displayApprovals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                          No approval requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayApprovals.map((approval, index) => (
                        <TableRow key={approval.id} data-testid={`approval-row-${index}`}>
                          <TableCell>{String(index + 1).padStart(2, "0")}</TableCell>
                          <TableCell className="font-medium" data-testid={`approval-tender-id-${index}`}>
                            {approval.tenderId}
                          </TableCell>
                          <TableCell>{approval.approvalFor}</TableCell>
                          <TableCell>{approval.approvalFrom}</TableCell>
                          <TableCell>{approval.inLoop}</TableCell>
                          <TableCell>{approval.requester}</TableCell>
                          <TableCell>
                            {new Date(approval.requestDate).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            {new Date(approval.actionDate).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            {new Date(approval.deadlineDate).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>{getStatusBadge(approval.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-approval-${index}`}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
