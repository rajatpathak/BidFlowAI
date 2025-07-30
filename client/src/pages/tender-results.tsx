import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, CheckCircle, XCircle, Clock, Users, Trophy, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TenderResult {
  id: string;
  tender_title: string;
  organization: string;
  reference_no?: string;
  location?: string;
  department?: string;
  tender_value?: number;
  contract_value?: number;
  marginal_difference?: number;
  tender_stage?: string;
  awarded_to?: string;
  awarded_value?: number;
  participator_bidders?: string[];
  company_eligible?: boolean;
  ai_match_score?: number;
  notes?: string;
  created_at: string;
}

interface TenderResultsImport {
  id: string;
  filename: string;
  original_name: string;
  results_processed: number;
  duplicates_skipped: number;
  status: string;
  uploaded_at: string;
}

export default function TenderResults() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tender results
  const { data: tenderResults = [], isLoading: resultsLoading } = useQuery<TenderResult[]>({
    queryKey: ["/api/enhanced-tender-results"],
  });

  // Fetch import history
  const { data: importHistory = [], isLoading: historyLoading } = useQuery<TenderResultsImport[]>({
    queryKey: ["/api/tender-results-imports"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'admin');

      const response = await fetch('/api/tender-results-imports', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Processed ${data.resultsProcessed} tender results, skipped ${data.duplicatesSkipped} duplicates`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enhanced-tender-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tender-results-imports"] });
      setSelectedFile(null);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getAppentusHighlight = (result: TenderResult) => {
    const isWinner = result.awarded_to?.toLowerCase().includes('appentus');
    const isParticipant = result.participator_bidders?.some(bidder => 
      bidder.toLowerCase().includes('appentus')
    );

    if (isWinner) {
      return <Badge className="bg-green-500 text-white">WON</Badge>;
    } else if (isParticipant) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">PARTICIPATED</Badge>;
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tender Results</h1>
          <p className="text-muted-foreground">
            Manage and analyze tender results with multi-sheet Excel import support
          </p>
        </div>
      </div>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Results ({tenderResults.length})</TabsTrigger>
          <TabsTrigger value="upload">Upload Results</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tender Results Overview
              </CardTitle>
              <CardDescription>
                Comprehensive view of all tender results with Appentus performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tender Title</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Winner</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Appentus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenderResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="max-w-xs">
                            <div className="font-medium truncate">{result.tender_title}</div>
                            {result.reference_no && (
                              <div className="text-sm text-muted-foreground">{result.reference_no}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{result.organization}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Tender: {formatCurrency(result.tender_value)}</div>
                              {result.contract_value && (
                                <div className="text-muted-foreground">Contract: {formatCurrency(result.contract_value)}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {result.awarded_to ? (
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                <span className="truncate max-w-32">{result.awarded_to}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not awarded</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.participator_bidders && result.participator_bidders.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{result.participator_bidders.length} bidders</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No data</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(result.tender_stage)}
                          </TableCell>
                          <TableCell>
                            {getAppentusHighlight(result)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Tender Results
              </CardTitle>
              <CardDescription>
                Import tender results from Excel files with multi-sheet support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resultsFile">Select Excel File</Label>
                <Input
                  id="resultsFile"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? "Processing..." : "Upload Results"}
              </Button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Expected Excel Format:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>TENDER RESULT BRIEF</strong> - Tender title/description</p>
                  <p>• <strong>TENDER REFERENCE NO</strong> - Reference number</p>
                  <p>• <strong>LOCATION</strong> - Location information</p>
                  <p>• <strong>Department</strong> - Department/organization</p>
                  <p>• <strong>Estimated Value</strong> - Tender value</p>
                  <p>• <strong>Contract Value</strong> - Final contract value</p>
                  <p>• <strong>Winner bidder</strong> - Winning bidder name</p>
                  <p>• <strong>Participator Bidders</strong> - All participating bidders</p>
                  <p>• <strong>Tender Stage</strong> - Current status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Import History
              </CardTitle>
              <CardDescription>
                Track all tender results imports and their processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {importHistory.map((importRecord) => (
                    <div key={importRecord.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="font-medium">{importRecord.original_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(importRecord.uploaded_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {importRecord.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : importRecord.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <Badge 
                            variant={importRecord.status === 'completed' ? 'default' : 
                                   importRecord.status === 'failed' ? 'destructive' : 'secondary'}
                          >
                            {importRecord.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {importRecord.results_processed} processed, {importRecord.duplicates_skipped} duplicates
                        </div>
                      </div>
                    </div>
                  ))}
                  {importHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No import history found. Upload your first Excel file to get started.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}