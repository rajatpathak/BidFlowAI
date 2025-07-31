import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Calendar,
  Building2,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NotRelevantRequest {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  not_relevant_reason: string;
  not_relevant_requested_at: string;
  requested_by_name: string;
  requested_by_username: string;
  location: string;
  source: string;
}

export default function AdminNotRelevantRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<NotRelevantRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState("");

  // Fetch pending not relevant requests
  const { data: requests = [], isLoading, refetch } = useQuery<NotRelevantRequest[]>({
    queryKey: ["/api/admin/not-relevant-requests"],
    queryFn: () => fetch("/api/admin/not-relevant-requests", {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(res => res.json()),
    enabled: user?.role === 'admin',
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async (data: { tenderId: string; action: 'approve' | 'reject'; comments?: string }) => {
      const response = await fetch(`/api/tenders/${data.tenderId}/not-relevant/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action: data.action, comments: data.comments })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process request');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Request ${variables.action}d successfully`,
      });
      setShowApprovalDialog(false);
      setComments("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive"
      });
    }
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

  const handleApproval = (request: NotRelevantRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const handleApprovalSubmit = () => {
    if (!selectedRequest) return;

    approvalMutation.mutate({
      tenderId: selectedRequest.id,
      action: approvalAction,
      comments: comments.trim() || undefined
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500">Only administrators can view not relevant requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Not Relevant Requests</h1>
          <p className="text-gray-600 mt-1">Review and approve requests to mark tenders as not relevant</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <Badge variant="secondary">
            {requests.length} pending requests
          </Badge>
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Not Relevant Requests ({requests.length})</CardTitle>
          <CardDescription>
            Review requests from bidders to mark tenders as not relevant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Pending Requests</h3>
              <p className="text-gray-500 mt-1">
                All not relevant requests have been processed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender Details</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      {/* Tender Details */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm leading-tight">
                            {request.title.length > 60 
                              ? `${request.title.substring(0, 60)}...` 
                              : request.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={
                              request.source === 'gem' 
                                ? "border-green-500 text-green-700"
                                : "border-blue-500 text-blue-700"
                            }>
                              {request.source === 'gem' ? 'GeM' : 'Non-GeM'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {request.location}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Organization */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {request.organization.length > 25 
                              ? `${request.organization.substring(0, 25)}...` 
                              : request.organization}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Value */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {formatCurrency(request.value)}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Requested By */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">{request.requested_by_name}</div>
                            <div className="text-xs text-gray-500">@{request.requested_by_username}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Reason */}
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {request.not_relevant_reason}
                          </p>
                        </div>
                      </TableCell>
                      
                      {/* Request Date */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(request.not_relevant_requested_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleApproval(request, 'approve')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleApproval(request, 'reject')}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Not Relevant Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900 mb-2">
                {selectedRequest?.title}
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-xs text-gray-500 mb-1">Bidder's Reason:</div>
                <div className="text-sm">{selectedRequest?.not_relevant_reason}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comments">
                {approvalAction === 'approve' ? 'Approval Comments (optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  approvalAction === 'approve' 
                    ? "Add any comments about this approval..."
                    : "Explain why this request is being rejected..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApprovalDialog(false);
                setComments("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprovalSubmit}
              disabled={approvalMutation.isPending}
              className={
                approvalAction === 'approve' 
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {approvalMutation.isPending 
                ? `${approvalAction === 'approve' ? 'Approving' : 'Rejecting'}...` 
                : `${approvalAction === 'approve' ? 'Approve' : 'Reject'} Request`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}