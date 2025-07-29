import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Clock,
  Calendar,
  History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface UploadHistory {
  id: string;
  fileName: string;
  timestamp: Date;
  tendersImported: number;
  duplicatesSkipped: number;
  status: 'success' | 'failed';
}

export default function UploadDemoPage() {
  const [tenderFile, setTenderFile] = useState<File | null>(null);
  const [resultsFile, setResultsFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const { toast } = useToast();

  // Load upload history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('excelUploadHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      // Convert timestamps back to Date objects
      const parsedHistory = history.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setUploadHistory(parsedHistory);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (history: UploadHistory[]) => {
    localStorage.setItem('excelUploadHistory', JSON.stringify(history));
    setUploadHistory(history);
  };

  const handleTenderUpload = async () => {
    if (!tenderFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("excelFile", tenderFile);
    formData.append("uploadedBy", "admin");

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch("/api/excel-uploads", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      
      // Add to history
      const newHistoryItem: UploadHistory = {
        id: Date.now().toString(),
        fileName: tenderFile.name,
        timestamp: new Date(),
        tendersImported: result.tendersImported || 0,
        duplicatesSkipped: result.duplicatesSkipped || 0,
        status: 'success'
      };
      
      const newHistory = [newHistoryItem, ...uploadHistory].slice(0, 10); // Keep last 10
      saveHistory(newHistory);

      toast({
        title: "Success!",
        description: result.message || `Imported ${result.tendersImported} tenders, skipped ${result.duplicatesSkipped} duplicates.`,
      });
      
      setTenderFile(null);
    } catch (error) {
      clearInterval(progressInterval);
      
      // Add failed entry to history
      const newHistoryItem: UploadHistory = {
        id: Date.now().toString(),
        fileName: tenderFile.name,
        timestamp: new Date(),
        tendersImported: 0,
        duplicatesSkipped: 0,
        status: 'failed'
      };
      
      const newHistory = [newHistoryItem, ...uploadHistory].slice(0, 10);
      saveHistory(newHistory);

      toast({
        title: "Upload failed",
        description: "Failed to process tender file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleResultsUpload = async () => {
    if (!resultsFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("resultsFile", resultsFile);
    formData.append("uploadedBy", "admin");

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch("/api/tender-results-imports", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      toast({
        title: "Success!",
        description: `Processed ${result.resultsProcessed || 0} tender results successfully.`,
      });
      
      setResultsFile(null);
      // Refresh the page to show new results
      setTimeout(() => window.location.href = '/tender-results', 1500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Results upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process results file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Excel Upload Demo</h1>
        <p className="text-gray-600">Upload and process tender data and results</p>
      </div>

      <Tabs defaultValue="active-tenders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active-tenders">Active Tenders Upload</TabsTrigger>
          <TabsTrigger value="results">Results Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="active-tenders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                <div>
                  <CardTitle>Upload Active Tenders</CardTitle>
                  <CardDescription>
                    Upload Excel files containing active tender data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Expected Excel Format:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Title</strong>: Tender title or work description</p>
                  <p>• <strong>Organization</strong>: Department or organization name</p>
                  <p>• <strong>Value</strong>: Tender value or EMD amount</p>
                  <p>• <strong>Deadline</strong>: Last date for submission</p>
                  <p>• <strong>Turnover</strong>: Eligibility turnover requirement</p>
                  <p>• <strong>Location</strong>: Place or location of work</p>
                  <p>• <strong>Reference No</strong>: Tender reference number</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <div className="text-lg font-medium">Choose Active Tenders File</div>
                    <div className="text-sm text-gray-500">Upload .xlsx files with tender data</div>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setTenderFile(e.target.files?.[0] || null)}
                    className="max-w-md mx-auto"
                  />
                  {tenderFile && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Selected: {tenderFile.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={handleTenderUpload}
                    disabled={!tenderFile || isUploading}
                    className="px-8 py-2"
                    size="lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Processing..." : "Upload Active Tenders"}
                  </Button>
                </div>
                
                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading and processing...</span>
                      <span className="font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload History */}
          {uploadHistory.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <div>
                    <CardTitle>Recent Uploads</CardTitle>
                    <CardDescription>
                      Your Excel upload history
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Upload Time</TableHead>
                      <TableHead>Tenders Imported</TableHead>
                      <TableHead>Duplicates Skipped</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                            {item.fileName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {item.tendersImported}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-yellow-600">
                            {item.duplicatesSkipped}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.status === 'success' ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <div>
                  <CardTitle>Upload Tender Results</CardTitle>
                  <CardDescription>
                    Upload Excel files containing tender results and awards
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Expected Excel Format:</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• <strong>Title</strong>: Tender title or work description</p>
                  <p>• <strong>Organization</strong>: Department or organization name</p>
                  <p>• <strong>Reference No</strong>: Tender reference number</p>
                  <p>• <strong>Awarded To</strong>: Company that won the tender</p>
                  <p>• <strong>Awarded Value</strong>: Final awarded amount</p>
                  <p>• <strong>Result Date</strong>: Date when result was announced</p>
                  <p>• <strong>Our Bid</strong>: Our bid amount (optional)</p>
                  <p>• <strong>Status</strong>: Result status (won/lost/rejected)</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <div className="text-lg font-medium">Choose Results File</div>
                    <div className="text-sm text-gray-500">Upload .xlsx files with tender results</div>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setResultsFile(e.target.files?.[0] || null)}
                    className="max-w-md mx-auto"
                  />
                  {resultsFile && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Selected: {resultsFile.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={handleResultsUpload}
                    disabled={!resultsFile || isUploading}
                    className="px-8 py-2"
                    size="lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Processing..." : "Upload Tender Results"}
                  </Button>
                </div>
                
                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading and processing results...</span>
                      <span className="font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to other pages after uploading</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => window.location.href = '/enhanced-tenders'}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              View Enhanced Tenders
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/tender-results'}>
              <Trophy className="h-4 w-4 mr-2" />
              View Results Analysis
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin-settings'}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Company Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}