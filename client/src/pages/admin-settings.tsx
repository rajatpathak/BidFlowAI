import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySettingsSchema } from "@shared/schema";
import { z } from "zod";
import { Settings, Upload, FileSpreadsheet, Building2, CheckCircle, XCircle, Clock } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CompanySettings = {
  id: string;
  companyName: string;
  turnoverCriteria: string;
  headquarters: string | null;
  establishedYear: number | null;
  certifications: string[] | null;
  businessSectors: string[] | null;
  projectTypes: string[] | null;
  updatedAt: Date | null;
  updatedBy: string | null;
};

type ExcelUpload = {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: Date | null;
  uploadedBy: string | null;
  sheetsProcessed: number | null;
  tendersImported: number | null;
  status: string;
  errorLog: string | null;
};

const companySettingsFormSchema = insertCompanySettingsSchema.extend({
  certifications: z.string().optional(),
  businessSectors: z.string().optional(),
  projectTypes: z.string().optional(),
});

export default function AdminSettingsPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const { data: companySettings, isLoading: settingsLoading } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  const { data: excelUploads = [], isLoading: uploadsLoading } = useQuery<ExcelUpload[]>({
    queryKey: ["/api/excel-uploads"],
  });

  const settingsForm = useForm<z.infer<typeof companySettingsFormSchema>>({
    resolver: zodResolver(companySettingsFormSchema),
    defaultValues: {
      companyName: companySettings?.companyName || "",
      turnoverCriteria: companySettings?.turnoverCriteria || "",
      headquarters: companySettings?.headquarters || "",
      establishedYear: companySettings?.establishedYear || undefined,
      certifications: companySettings?.certifications?.join(", ") || "",
      businessSectors: companySettings?.businessSectors?.join(", ") || "",
      projectTypes: companySettings?.projectTypes?.join(", ") || "",
    },
  });

  // Update form when data loads
  useState(() => {
    if (companySettings) {
      settingsForm.reset({
        companyName: companySettings.companyName,
        turnoverCriteria: companySettings.turnoverCriteria,
        headquarters: companySettings.headquarters || "",
        establishedYear: companySettings.establishedYear || undefined,
        certifications: companySettings.certifications?.join(", ") || "",
        businessSectors: companySettings.businessSectors?.join(", ") || "",
        projectTypes: companySettings.projectTypes?.join(", ") || "",
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySettingsFormSchema>) => {
      const payload = {
        ...data,
        certifications: data.certifications ? data.certifications.split(",").map(s => s.trim()) : [],
        businessSectors: data.businessSectors ? data.businessSectors.split(",").map(s => s.trim()) : [],
        projectTypes: data.projectTypes ? data.projectTypes.split(",").map(s => s.trim()) : [],
      };
      
      const response = await fetch("/api/company-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({
        title: "Settings updated",
        description: "Company settings have been updated successfully.",
      });
    },
  });

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("excelFile", uploadFile);
    formData.append("uploadedBy", "admin"); // Should come from auth context

    try {
      const response = await fetch("/api/excel-uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/excel-uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      
      toast({
        title: "Upload successful",
        description: `Imported ${result.tendersImported} tenders from ${result.sheetsProcessed} sheets.`,
      });
      
      setUploadFile(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process Excel file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSettingsSubmit = (data: z.infer<typeof companySettingsFormSchema>) => {
    updateSettingsMutation.mutate(data);
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

  if (settingsLoading || uploadsLoading) {
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
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-gray-600">Configure company settings and manage data imports</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company Settings</TabsTrigger>
          <TabsTrigger value="excel">Excel Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <div>
                  <CardTitle>Company Configuration</CardTitle>
                  <CardDescription>
                    Set company criteria for AI matching and tender evaluation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={settingsForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="turnoverCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Turnover Criteria</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 5 cr" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="headquarters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Headquarters</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Mumbai, India" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="establishedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Established Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 2015" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={settingsForm.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ISO 9001, ISO 14001, OHSAS 18001 (comma separated)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="businessSectors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Sectors</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Infrastructure, IT Solutions, Construction (comma separated)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="projectTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Types</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="mobile, web, software, tax collection, infrastructure (comma separated)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending ? "Updating..." : "Update Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <div>
                  <CardTitle>Tender Excel Upload</CardTitle>
                  <CardDescription>
                    Upload Excel files containing active tender data with multiple sheets
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Expected Excel Format for Active Tenders:</h4>
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
                <div className="text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <label htmlFor="excel-file" className="cursor-pointer block">
                      <div className="text-lg font-medium">Choose Excel File</div>
                      <div className="text-sm text-gray-500">Upload .xlsx files with tender data</div>
                      <Input
                        id="excel-file"
                        type="file"
                        accept=".xlsx,.xls"
                        className="mt-2"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {uploadFile && (
                    <div className="mt-4">
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        Selected: {uploadFile.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || isUploading}
                  className="w-full md:w-auto px-8 py-2"
                  size="lg"
                >
                  {isUploading ? "Processing..." : "Upload and Process Tenders"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>View previous Excel upload attempts and results</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Sheets</TableHead>
                    <TableHead>Tenders</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="font-medium">{upload.fileName}</TableCell>
                      <TableCell>
                        {upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>{upload.sheetsProcessed || 0}</TableCell>
                      <TableCell>{upload.tendersImported || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(upload.status)}
                          <Badge
                            variant={
                              upload.status === "completed"
                                ? "default"
                                : upload.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {upload.status}
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