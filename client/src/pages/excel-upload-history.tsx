import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Download,
  Search,
  Calendar,
  Upload
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ExcelUpload {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: Date | null;
  uploadedBy: string | null;
  entriesAdded: number | null;
  entriesRejected: number | null;
  entriesDuplicate: number | null;
  totalEntries: number | null;
  sheetsProcessed: number | null;
  status: string;
  errorLog: string | null;
  processingTime: number | null;
}

export default function ExcelUploadHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: uploads, isLoading } = useQuery<ExcelUpload[]>({
    queryKey: ["/api/excel-uploads"],
  });

  const filteredUploads = uploads?.filter(upload =>
    upload.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.uploadedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <AlertCircle className="h-4 w-4 text-yellow-600 animate-pulse" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "completed" ? "success" : 
                   status === "failed" ? "destructive" : 
                   "warning";
    return (
      <Badge variant={variant as any} className="gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatProcessingTime = (milliseconds: number | null) => {
    if (!milliseconds) return "-";
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}m`;
  };

  const totalStats = {
    totalUploads: uploads?.length || 0,
    totalAdded: uploads?.reduce((sum, u) => sum + (u.entriesAdded || 0), 0) || 0,
    totalDuplicates: uploads?.reduce((sum, u) => sum + (u.entriesDuplicate || 0), 0) || 0,
    totalRejected: uploads?.reduce((sum, u) => sum + (u.entriesRejected || 0), 0) || 0,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Excel Upload History</h1>
          <p className="text-gray-600 mt-1">Track all Excel file uploads and their processing results</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload New File
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Uploads</CardDescription>
            <CardTitle className="text-2xl">{totalStats.totalUploads}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entries Added</CardDescription>
            <CardTitle className="text-2xl text-green-600">{totalStats.totalAdded}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duplicates Rejected</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{totalStats.totalDuplicates}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed Entries</CardDescription>
            <CardTitle className="text-2xl text-red-600">{totalStats.totalRejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <CardTitle>Upload History</CardTitle>
          </div>
          <CardDescription>View details of all Excel file uploads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by filename or uploader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading upload history...</div>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No upload history found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Entries Added</TableHead>
                    <TableHead className="text-right">Duplicates</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                    <TableHead className="text-right">Total Entries</TableHead>
                    <TableHead className="text-right">Processing Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <div>
                            <div className="text-sm">
                              {upload.uploadedAt 
                                ? new Date(upload.uploadedAt).toLocaleDateString()
                                : "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {upload.uploadedAt 
                                ? formatDistanceToNow(new Date(upload.uploadedAt), { addSuffix: true })
                                : "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{upload.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{upload.uploadedBy || "-"}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(upload.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">
                          {upload.entriesAdded || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          upload.entriesDuplicate && upload.entriesDuplicate > 0 ? "text-yellow-600" : ""
                        )}>
                          {upload.entriesDuplicate || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          upload.entriesRejected && upload.entriesRejected > 0 ? "text-red-600" : ""
                        )}>
                          {upload.entriesRejected || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {upload.totalEntries || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {formatProcessingTime(upload.processingTime)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {upload.errorLog && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              title={upload.errorLog}
                              className="text-red-600"
                            >
                              <AlertCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
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
    </div>
  );
}