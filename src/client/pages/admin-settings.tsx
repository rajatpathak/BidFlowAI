import { useState, useEffect, useCallback } from "react";
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
import { Settings, Upload, FileSpreadsheet, Building2, CheckCircle, XCircle, Clock, FileText, Plus, Edit, Trash2, Image, GripVertical, X, Eye } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CompanySettings = {
  id: string;
  companyName: string;
  annualTurnover: number;
  headquarters: string | null;
  establishedYear: number | null;
  certifications: string[] | null;
  businessSectors: string[] | null;
  projectTypes: string[] | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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

type DocumentTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  mandatory: boolean;
  format: string | null;
  images: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    order: number;
    url: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
};

const companySettingsFormSchema = insertCompanySettingsSchema.extend({
  annualTurnover: z.coerce.number().min(1, "Annual turnover is required"),
  certifications: z.string().optional(),
  businessSectors: z.string().optional(),
  projectTypes: z.string().optional(),
}).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

const documentTemplateFormSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  category: z.string().default("participation"),
  mandatory: z.boolean().default(false),
  format: z.string().optional(),
});

type ImageFile = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  order: number;
  url: string;
};

export default function AdminSettingsPage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateImages, setTemplateImages] = useState<ImageFile[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: companySettings, isLoading: settingsLoading } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
  });

  const { data: excelUploads = [], isLoading: uploadsLoading } = useQuery<ExcelUpload[]>({
    queryKey: ["/api/excel-uploads"],
  });

  const { data: documentTemplates = [], isLoading: templatesLoading } = useQuery<DocumentTemplate[]>({
    queryKey: ["/api/document-templates"],
  });

  const settingsForm = useForm<z.infer<typeof companySettingsFormSchema>>({
    resolver: zodResolver(companySettingsFormSchema),
    defaultValues: {
      companyName: companySettings?.companyName || "",
      annualTurnover: companySettings?.annualTurnover || 0,
      headquarters: companySettings?.headquarters || "",
      establishedYear: companySettings?.establishedYear || undefined,
      certifications: companySettings?.certifications?.join(", ") || "",
      businessSectors: companySettings?.businessSectors?.join(", ") || "",
      projectTypes: companySettings?.projectTypes?.join(", ") || "",
    },
  });

  const templateForm = useForm<z.infer<typeof documentTemplateFormSchema>>({
    resolver: zodResolver(documentTemplateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "participation",
      mandatory: false,
      format: "",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (companySettings) {
      settingsForm.reset({
        companyName: companySettings.companyName,
        annualTurnover: companySettings.annualTurnover,
        headquarters: companySettings.headquarters || "",
        establishedYear: companySettings.establishedYear || undefined,
        certifications: companySettings.certifications?.join(", ") || "",
        businessSectors: companySettings.businessSectors?.join(", ") || "",
        projectTypes: companySettings.projectTypes?.join(", ") || "",
      });
    }
  }, [companySettings, settingsForm]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySettingsFormSchema>) => {
      const payload = {
        ...data,
        certifications: data.certifications ? data.certifications.split(",").map(s => s.trim()) : [],
        businessSectors: data.businessSectors ? data.businessSectors.split(",").map(s => s.trim()) : [],
        projectTypes: data.projectTypes ? data.projectTypes.split(",").map(s => s.trim()) : [],
      };
      
      console.log("Submitting company settings:", payload);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/company-settings", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Settings update failed:", response.status, errorText);
        throw new Error(`Failed to update settings: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (result) => {
      console.log("Settings updated successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({
        title: "Settings updated",
        description: "Company settings have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Settings update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update company settings",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof documentTemplateFormSchema>) => {
      const templateData = {
        ...data,
        images: templateImages,
      };
      const response = await fetch("/api/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error("Failed to create template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates"] });
      templateForm.reset();
      setTemplateImages([]);
      setShowTemplateForm(false);
      toast({
        title: "Template created",
        description: "Document template has been created successfully.",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof documentTemplateFormSchema> }) => {
      const templateData = {
        ...data,
        images: templateImages,
      };
      const response = await fetch(`/api/document-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error("Failed to update template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates"] });
      templateForm.reset();
      setTemplateImages([]);
      setEditingTemplate(null);
      setShowTemplateForm(false);
      toast({
        title: "Template updated",
        description: "Document template has been updated successfully.",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/document-templates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates"] });
      toast({
        title: "Template deleted",
        description: "Document template has been deleted successfully.",
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

  const onTemplateSubmit = (data: z.infer<typeof documentTemplateFormSchema>) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setTemplateImages(template.images || []);
    templateForm.reset({
      name: template.name,
      description: template.description || "",
      category: template.category,
      mandatory: template.mandatory,
      format: template.format || "",
    });
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this document template?")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setShowTemplateForm(false);
    setTemplateImages([]);
    templateForm.reset();
  };

  // Image upload handler with preview
  const handleImageUpload = async (files: FileList) => {
    // First create previews immediately
    const filePromises = Array.from(files).map((file, index) => {
      return new Promise<ImageFile>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `temp_${Date.now()}_${index}`,
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            order: templateImages.length + index + 1,
            url: e.target?.result as string, // base64 preview
          });
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const previewImages = await Promise.all(filePromises);
      setTemplateImages(prev => [...prev, ...previewImages]);

      // Now upload to server
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/upload-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const uploadedImages = await response.json();
      
      // Replace preview images with actual uploaded images
      setTemplateImages(prev => {
        const withoutPreviews = prev.filter(img => !img.id.startsWith('temp_'));
        const newImages: ImageFile[] = uploadedImages.map((img: any, index: number) => ({
          id: img.id,
          filename: img.filename,
          originalName: img.originalName,
          mimeType: img.mimeType,
          size: img.size,
          order: withoutPreviews.length + index + 1,
          url: img.url,
        }));
        return [...withoutPreviews, ...newImages];
      });

      toast({
        title: "Images uploaded",
        description: `${uploadedImages.length} images uploaded successfully.`,
      });
    } catch (error) {
      // Remove preview images on error
      setTemplateImages(prev => prev.filter(img => !img.id.startsWith('temp_')));
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null) return;

    const draggedImage = templateImages[draggedImageIndex];
    const updatedImages = [...templateImages];
    
    // Remove dragged image
    updatedImages.splice(draggedImageIndex, 1);
    
    // Insert at new position
    updatedImages.splice(dropIndex, 0, draggedImage);
    
    // Update order numbers
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      order: index + 1,
    }));
    
    setTemplateImages(reorderedImages);
    setDraggedImageIndex(null);
  };

  const removeImage = (imageId: string) => {
    setTemplateImages(prev => 
      prev.filter(img => img.id !== imageId)
        .map((img, index) => ({ ...img, order: index + 1 }))
    );
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

  if (settingsLoading || uploadsLoading || templatesLoading) {
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
          <TabsTrigger value="documents">Document Manager</TabsTrigger>
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
                      name="annualTurnover"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Turnover (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="e.g., 50000000" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold">Document Manager</h2>
              <p className="text-gray-600">Manage document templates and selection criteria</p>
            </div>
          </div>

          <Tabs defaultValue="templates" className="space-y-4">
            <TabsList>
              <TabsTrigger value="templates">Document Templates</TabsTrigger>
              <TabsTrigger value="selector">Document Selector</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Document Templates</CardTitle>
                      <CardDescription>
                        Manage document templates for participation requirements
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowTemplateForm(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
              {showTemplateForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>
                      {editingTemplate ? "Edit Document Template" : "Add New Document Template"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...templateForm}>
                      <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={templateForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Document Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Company Registration Certificate" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={templateForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., participation, technical, financial" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={templateForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Brief description of the document requirement" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={templateForm.control}
                            name="format"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Format</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., PDF, Original, Notarized" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={templateForm.control}
                            name="mandatory"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                                <FormLabel>Mandatory Document</FormLabel>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-4">
                          <Label>Document Images</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center">
                              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <div className="space-y-2">
                                <label htmlFor="template-images" className="cursor-pointer block">
                                  <div className="text-lg font-medium">Upload Images</div>
                                  <div className="text-sm text-gray-500">Select multiple images (PNG, JPG, JPEG, WebP). Max 10MB per file.</div>
                                  <Input
                                    id="template-images"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    multiple
                                    className="mt-2"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        // Validate file sizes
                                        const oversizedFiles = Array.from(e.target.files).filter(file => file.size > 10 * 1024 * 1024);
                                        if (oversizedFiles.length > 0) {
                                          toast({
                                            title: "Files too large",
                                            description: `${oversizedFiles.length} files exceed 10MB limit`,
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        handleImageUpload(e.target.files);
                                        // Clear the input
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Uploaded Images with Drag & Drop */}
                          {templateImages.length > 0 && (
                            <div className="space-y-3">
                              <Label>Uploaded Images ({templateImages.length}) - Drag to reorder</Label>
                              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                                {templateImages
                                  .sort((a, b) => a.order - b.order)
                                  .map((image, index) => (
                                    <div
                                      key={image.id}
                                      draggable={!image.id.startsWith('temp_')}
                                      onDragStart={() => handleDragStart(index)}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, index)}
                                      className={`
                                        flex items-center gap-4 p-4 border-2 rounded-lg transition-all duration-200
                                        ${draggedImageIndex === index ? 'opacity-50 border-blue-400' : 'border-gray-200'}
                                        ${image.id.startsWith('temp_') ? 'cursor-wait' : 'cursor-move hover:border-gray-300'}
                                        hover:bg-gray-50
                                      `}
                                    >
                                      <GripVertical className={`h-5 w-5 ${image.id.startsWith('temp_') ? 'text-gray-300' : 'text-gray-400'}`} />
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="relative group">
                                          <img
                                            src={image.url}
                                            alt={image.originalName}
                                            className="w-20 h-20 object-cover rounded border-2 border-gray-200 group-hover:border-gray-300 transition-colors"
                                          />
                                          {image.id.startsWith('temp_') && (
                                            <div className="absolute inset-0 bg-black bg-opacity-60 rounded flex items-center justify-center">
                                              <div className="text-white text-xs font-medium">Uploading...</div>
                                            </div>
                                          )}
                                          {/* Preview on hover */}
                                          <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 text-white text-xs p-2 rounded bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap z-10">
                                            Click to preview full size
                                          </div>
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium text-sm truncate max-w-xs">{image.originalName}</div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {(image.size / 1024).toFixed(1)} KB • {image.mimeType} • Order: {image.order}
                                          </div>
                                          {image.id.startsWith('temp_') && (
                                            <div className="text-xs text-orange-600 mt-1">Processing...</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            // Preview image in new tab
                                            window.open(image.url, '_blank');
                                          }}
                                          className="text-blue-600 hover:text-blue-800"
                                          disabled={image.id.startsWith('temp_')}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeImage(image.id)}
                                          className="text-red-600 hover:text-red-800"
                                          disabled={image.id.startsWith('temp_')}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                          >
                            {editingTemplate ? "Update Template" : "Create Template"}
                          </Button>
                          <Button type="button" variant="outline" onClick={resetTemplateForm}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{template.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {template.description || "-"}
                      </TableCell>
                      <TableCell>{template.format || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{template.images?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.mandatory ? "destructive" : "default"}>
                          {template.mandatory ? "Mandatory" : "Optional"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documentTemplates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No document templates found. Add your first template to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="selector" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Selector</CardTitle>
                  <CardDescription>
                    Select and configure documents for specific tenders or categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="document-search">Search Documents</Label>
                        <Input
                          id="document-search"
                          placeholder="Search by document name..."
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Available Documents</Label>
                        <div className="mt-2 border rounded-lg p-4 h-80 overflow-y-auto">
                          {documentTemplates.map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600"
                                />
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {template.description}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  {template.category}
                                </Badge>
                                {template.mandatory && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {documentTemplates.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              No document templates available. Create templates first.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="selection-name">Selection Name</Label>
                        <Input
                          id="selection-name"
                          placeholder="e.g., Standard Participation Documents"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="selection-description">Description</Label>
                        <Textarea
                          id="selection-description"
                          placeholder="Describe this document selection..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Selected Documents</Label>
                        <div className="mt-2 border rounded-lg p-4 h-60 overflow-y-auto">
                          <div className="text-center py-8 text-gray-500">
                            Select documents from the left panel to build your selection.
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">
                          Save Selection
                        </Button>
                        <Button variant="outline">
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Saved Document Selections</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="border-dashed border-gray-300">
                        <CardContent className="p-4 text-center">
                          <div className="text-gray-500 text-sm">
                            No saved selections yet. Create your first document selection above.
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}