import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileSpreadsheet, 
  Trophy, 
  TrendingDown, 
  XCircle, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Calendar,
  DollarSign
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type EnhancedTenderResult = {
  id: string;
  tenderTitle: string;
  organization: string;
  referenceNo: string | null;
  location: string | null;
  department: string | null;
  tenderValue: number | null; // estimated value
  contractValue: number | null; // actual contract value
  marginalDifference: number | null; // contractValue - tenderValue
  tenderStage: string | null;
  ourBidValue: number | null;
  status: string; // won, lost, rejected, missed_opportunity
  awardedTo: string | null; // winner bidder
  awardedValue: number | null;
  participatorBidders: string[] | null; // list of all participating bidders
  resultDate: Date | null;
  assignedTo: string | null;
  reasonForLoss: string | null;
  missedReason: string | null;
  companyEligible: boolean | null;
  aiMatchScore: number | null;
  notes: string | null;
  createdAt: Date | null;
};

type TenderResultsImport = {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: Date | null;
  uploadedBy: string | null;
  resultsProcessed: number | null;
  status: string;
  errorLog: string | null;
};

export default function TenderResultsPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: results = [], isLoading: resultsLoading } = useQuery<EnhancedTenderResult[]>({
    queryKey: ["/api/enhanced-tender-results"],
  });

  const { data: imports = [], isLoading: importsLoading } = useQuery<TenderResultsImport[]>({
    queryKey: ["/api/tender-results-imports"],
  });

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("resultsFile", uploadFile);
    formData.append("uploadedBy", "admin"); // Should come from auth context

    try {
      const response = await fetch("/api/tender-results-imports", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/tender-results-imports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enhanced-tender-results"] });
      
      toast({
        title: "Upload successful",
        description: `Processed ${result.resultsProcessed} tender results successfully.`,
      });
      
      setUploadFile(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process results file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <Badge className="bg-green-500"><Trophy className="h-3 w-3 mr-1" />Won</Badge>;
      case "lost":
        return <Badge variant="destructive"><TrendingDown className="h-3 w-3 mr-1" />Lost</Badge>;
      case "rejected":
        return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "missed_opportunity":
        return <Badge className="bg-orange-500"><AlertTriangle className="h-3 w-3 mr-1" />Missed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const filteredResults = statusFilter === "all" 
    ? results 
    : results.filter(r => r.status === statusFilter);

  // Calculate statistics
  const stats = {
    total: results.length,
    won: results.filter(r => r.status === "won").length,
    lost: results.filter(r => r.status === "lost").length,
    rejected: results.filter(r => r.status === "rejected").length,
    missed: results.filter(r => r.status === "missed_opportunity").length,
    winRate: results.length > 0 ? ((results.filter(r => r.status === "won").length / results.length) * 100).toFixed(1) : "0",
    totalWonValue: results.filter(r => r.status === "won").reduce((sum, r) => sum + (r.awardedValue || 0), 0),
  };

  if (resultsLoading || importsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tender Results</h1>
          <p className="text-gray-600">Track tender outcomes, wins, losses, and missed opportunities</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.winRate}%</p>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Won</p>
                <p className="text-2xl font-bold text-green-600">{stats.won}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Missed Opportunities</p>
                <p className="text-2xl font-bold text-orange-600">{stats.missed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won Value</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalWonValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Results Analysis</TabsTrigger>
          <TabsTrigger value="upload">Upload Results</TabsTrigger>
          <TabsTrigger value="history">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="status-filter">Filter by Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="missed_opportunity">Missed Opportunities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tender Results ({filteredResults.length})</CardTitle>
              <CardDescription>
                Complete tracking of tender outcomes with detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tender Reference No</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Contract Value</TableHead>
                      <TableHead>Estimated Value</TableHead>
                      <TableHead>Marginal Difference</TableHead>
                      <TableHead>Tender Stage</TableHead>
                      <TableHead>Winner Bidder</TableHead>
                      <TableHead>Participator Bidders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        {/* Tender Reference No */}
                        <TableCell>
                          {result.referenceNo ? (
                            <Badge variant="outline" className="text-xs font-mono">
                              {result.referenceNo}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        
                        {/* Location */}
                        <TableCell>
                          <div className="text-sm">
                            {result.location || "-"}
                          </div>
                        </TableCell>
                        
                        {/* Department */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            {result.department || result.organization || "-"}
                          </div>
                        </TableCell>
                        
                        {/* Contract Value */}
                        <TableCell>
                          <div className="text-sm font-medium text-green-600">
                            {result.contractValue || result.awardedValue ? 
                              formatCurrency(result.contractValue || result.awardedValue) : "-"}
                          </div>
                        </TableCell>
                        
                        {/* Estimated Value */}
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {result.tenderValue ? formatCurrency(result.tenderValue) : "-"}
                          </div>
                        </TableCell>
                        
                        {/* Marginal Difference */}
                        <TableCell>
                          <div className="text-sm">
                            {(() => {
                              const contractVal = result.contractValue || result.awardedValue || 0;
                              const estimatedVal = result.tenderValue || 0;
                              const difference = result.marginalDifference || (contractVal - estimatedVal);
                              
                              if (!contractVal || !estimatedVal) return "-";
                              
                              const percentDiff = estimatedVal > 0 ? 
                                ((difference / estimatedVal) * 100).toFixed(1) : 0;
                              
                              return (
                                <div className={`font-medium ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatCurrency(Math.abs(difference))}
                                  <span className="text-xs ml-1">
                                    ({difference > 0 ? '+' : ''}{percentDiff}%)
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>
                        
                        {/* Tender Stage */}
                        <TableCell>
                          <div className="text-sm">
                            {result.tenderStage ? (
                              <Badge variant={
                                result.tenderStage === "completed" ? "success" :
                                result.tenderStage === "in_progress" ? "secondary" :
                                "outline"
                              }>
                                {result.tenderStage}
                              </Badge>
                            ) : (
                              getStatusBadge(result.status)
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Winner Bidder */}
                        <TableCell>
                          <div className="text-sm font-medium">
                            {result.awardedTo || "-"}
                          </div>
                        </TableCell>
                        
                        {/* Participator Bidders */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {result.participatorBidders && result.participatorBidders.length > 0 ? (
                              result.participatorBidders.map((bidder, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:bg-secondary/80"
                                >
                                  • {bidder}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">No bidders info</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <div>
                  <CardTitle>Upload Tender Results</CardTitle>
                  <CardDescription>
                    Upload Excel files containing tender results and awards
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-medium">Choose Results File</div>
                      <div className="text-sm text-gray-500">Upload .xlsx files with tender results</div>
                    </div>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {uploadFile && (
                    <div className="mt-4">
                      <Badge variant="secondary">{uploadFile.name}</Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Expected Excel Format:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Title</strong>: Tender title or work description</p>
                  <p>• <strong>Organization</strong>: Department or organization name</p>
                  <p>• <strong>Reference No</strong>: Tender reference number</p>
                  <p>• <strong>Awarded To</strong>: Company that won the tender</p>
                  <p>• <strong>Awarded Value</strong>: Final awarded amount</p>
                  <p>• <strong>Result Date</strong>: Date when result was announced</p>
                  <p>• <strong>Our Bid</strong>: Our bid amount (optional)</p>
                  <p>• <strong>Reason</strong>: Reason for loss/rejection (optional)</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || isUploading}
                  className="w-full md:w-auto"
                >
                  {isUploading ? "Processing..." : "Upload and Process Results"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>View previous results upload attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Results Processed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((import_) => (
                    <TableRow key={import_.id}>
                      <TableCell className="font-medium">{import_.fileName}</TableCell>
                      <TableCell>
                        {import_.uploadedAt ? new Date(import_.uploadedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>{import_.resultsProcessed || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(import_.status)}
                          <Badge
                            variant={
                              import_.status === "completed"
                                ? "default"
                                : import_.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {import_.status}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}