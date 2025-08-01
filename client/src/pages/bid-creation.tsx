import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Eye,
  Edit3,
  Package,
  Sparkles,
  Brain,
  FileCheck
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'wouter';

interface BidDocumentType {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'custom';
  isRequired: boolean;
  template?: string;
}

interface BidDocument {
  id: string;
  tenderId: string;
  documentTypeId: string;
  title: string;
  content?: string;
  status: 'pending' | 'draft' | 'completed' | 'approved';
  isAutoFilled: boolean;
  aiConfidence?: number;
  documentType: BidDocumentType;
  createdAt: string;
  updatedAt: string;
}

interface RfpDocument {
  id: string;
  tenderId: string;
  originalName: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processedData?: any;
  createdAt: string;
}

interface BidPackage {
  id: string;
  tenderId: string;
  packageName: string;
  status: 'draft' | 'under_review' | 'approved' | 'submitted';
  documents: string[];
  finalPdfPath?: string;
  createdAt: string;
}

export default function BidCreation() {
  const params = useParams();
  const tenderId = params.id;
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
  const [editingDocument, setEditingDocument] = useState<BidDocument | null>(null);
  const [documentContent, setDocumentContent] = useState('');
  const [rfpFile, setRfpFile] = useState<File | null>(null);
  const [packageName, setPackageName] = useState('');

  // Fetch bid document types
  const { data: documentTypes = [] } = useQuery<BidDocumentType[]>({
    queryKey: ['/api/bid-document-types'],
  });

  // Fetch existing bid documents for this tender
  const { data: bidDocuments = [], refetch: refetchBidDocuments } = useQuery<BidDocument[]>({
    queryKey: ['/api/bid-documents', tenderId],
    enabled: !!tenderId,
  });

  // Fetch RFP documents for this tender
  const { data: rfpDocuments = [] } = useQuery<RfpDocument[]>({
    queryKey: ['/api/rfp-documents', tenderId],
    enabled: !!tenderId,
  });

  // Fetch bid packages for this tender
  const { data: bidPackages = [] } = useQuery<BidPackage[]>({
    queryKey: ['/api/bid-packages', tenderId],
    enabled: !!tenderId,
  });

  // Upload RFP mutation
  const uploadRfpMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('rfp', file);
      formData.append('tenderId', tenderId || '');

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/rfp-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'RFP Uploaded',
        description: 'RFP document uploaded and AI processing started.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rfp-documents', tenderId] });
      setRfpFile(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload RFP document',
        variant: 'destructive',
      });
    },
  });

  // Create bid documents mutation
  const createDocumentsMutation = useMutation({
    mutationFn: async (documentTypeIds: string[]) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/bid-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenderId,
          documentTypeIds,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Documents Created',
        description: 'Bid documents created and AI auto-filling started.',
      });
      refetchBidDocuments();
      setSelectedDocumentTypes([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create bid documents',
        variant: 'destructive',
      });
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, title, content, status }: { id: string; title: string; content: string; status: string }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/bid-documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, status }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document Updated',
        description: 'Document saved successfully.',
      });
      refetchBidDocuments();
      setEditingDocument(null);
      setDocumentContent('');
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update document',
        variant: 'destructive',
      });
    },
  });

  // Create bid package mutation
  const createPackageMutation = useMutation({
    mutationFn: async () => {
      const completedDocuments = bidDocuments
        .filter(doc => doc.status === 'completed' || doc.status === 'approved')
        .map(doc => doc.id);

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/bid-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenderId,
          packageName: packageName || `Bid Package - ${new Date().toLocaleDateString()}`,
          documentIds: completedDocuments,
          coverPage: `<h1>Bid Submission</h1><p>Tender ID: ${tenderId}</p>`,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Package Created',
        description: 'Bid package created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bid-packages', tenderId] });
      setPackageName('');
    },
    onError: (error: any) => {
      toast({
        title: 'Package Creation Failed',
        description: error.message || 'Failed to create bid package',
        variant: 'destructive',
      });
    },
  });

  const handleRfpUpload = () => {
    if (rfpFile) {
      uploadRfpMutation.mutate(rfpFile);
    }
  };

  const handleCreateDocuments = () => {
    if (selectedDocumentTypes.length > 0) {
      createDocumentsMutation.mutate(selectedDocumentTypes);
    }
  };

  const handleEditDocument = (document: BidDocument) => {
    setEditingDocument(document);
    setDocumentContent(document.content || '');
    setActiveTab('editor');
  };

  const handleSaveDocument = () => {
    if (editingDocument) {
      updateDocumentMutation.mutate({
        id: editingDocument.id,
        title: editingDocument.title,
        content: documentContent,
        status: 'completed',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const completedDocuments = bidDocuments.filter(doc => 
    doc.status === 'completed' || doc.status === 'approved'
  ).length;
  const totalDocuments = bidDocuments.length;
  const progressPercentage = totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bid Document Creation System</h1>
          <p className="text-muted-foreground">
            AI-powered bid document preparation and management
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Tender ID: {tenderId}
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bid Preparation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Documents Completed</span>
              <span className="text-sm text-muted-foreground">
                {completedDocuments} of {totalDocuments}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{completedDocuments} Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span>{totalDocuments - completedDocuments} Pending</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rfp-upload">RFP Upload</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RFP Documents</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rfpDocuments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {rfpDocuments.filter(doc => doc.processingStatus === 'completed').length} processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bid Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bidDocuments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {bidDocuments.filter(doc => doc.isAutoFilled).length} AI-generated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bid Packages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bidPackages.length}</div>
                <p className="text-xs text-muted-foreground">
                  {bidPackages.filter(pkg => pkg.status === 'approved').length} approved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for bid preparation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setActiveTab('rfp-upload')}
                  className="justify-start"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload RFP Documents
                </Button>
                <Button 
                  onClick={() => setActiveTab('documents')}
                  className="justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Bid Documents
                </Button>
                <Button 
                  onClick={() => setActiveTab('editor')}
                  className="justify-start"
                  variant="outline"
                  disabled={bidDocuments.length === 0}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Documents
                </Button>
                <Button 
                  onClick={() => setActiveTab('packages')}
                  className="justify-start"
                  variant="outline"
                  disabled={completedDocuments === 0}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RFP Upload Tab */}
        <TabsContent value="rfp-upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload RFP Documents
              </CardTitle>
              <CardDescription>
                Upload Request for Proposal documents for AI analysis and processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setRfpFile(e.target.files?.[0] || null)}
                  className="max-w-sm mx-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Supported formats: PDF, DOC, DOCX
                </p>
              </div>
              
              {rfpFile && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{rfpFile.name}</span>
                    <Badge variant="secondary">
                      {(rfpFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Badge>
                  </div>
                  <Button 
                    onClick={handleRfpUpload}
                    disabled={uploadRfpMutation.isPending}
                  >
                    {uploadRfpMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing RFP Documents */}
          {rfpDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded RFP Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rfpDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{doc.originalName}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={doc.processingStatus === 'completed' ? 'default' : 'secondary'}
                        >
                          {doc.processingStatus}
                        </Badge>
                        {doc.processingStatus === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Analysis
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Select Required Documents
              </CardTitle>
              <CardDescription>
                Choose the types of documents needed for your bid submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentTypes.map((type) => (
                  <div key={type.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={type.id}
                      checked={selectedDocumentTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDocumentTypes(prev => [...prev, type.id]);
                        } else {
                          setSelectedDocumentTypes(prev => prev.filter(id => id !== type.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={type.id} className="font-medium cursor-pointer">
                          {type.name}
                        </Label>
                        {type.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {type.category}
                        </Badge>
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedDocumentTypes.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {selectedDocumentTypes.length} document(s) selected
                    </span>
                  </div>
                  <Button 
                    onClick={handleCreateDocuments}
                    disabled={createDocumentsMutation.isPending}
                  >
                    {createDocumentsMutation.isPending ? 'Creating...' : 'Create Documents'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Bid Documents */}
          {bidDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bid Documents</CardTitle>
                <CardDescription>
                  Manage and edit your bid documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bidDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(doc.status)}
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.documentType?.name}
                            </Badge>
                            {doc.isAutoFilled && (
                              <Badge variant="secondary" className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                AI Generated
                              </Badge>
                            )}
                            {doc.aiConfidence && (
                              <Badge variant="outline" className="text-xs">
                                {doc.aiConfidence}% confidence
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditDocument(doc)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          {editingDocument ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Editing: {editingDocument.title}
                </CardTitle>
                <CardDescription>
                  Use the HTML editor to customize your document content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="document-content">Document Content</Label>
                  <Textarea
                    id="document-content"
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    className="min-h-[400px] font-mono"
                    placeholder="Enter your document content here..."
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingDocument.isAutoFilled && (
                      <Badge variant="secondary">
                        <Brain className="h-3 w-3 mr-1" />
                        AI Generated Content
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingDocument(null);
                        setDocumentContent('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveDocument}
                      disabled={updateDocumentMutation.isPending}
                    >
                      {updateDocumentMutation.isPending ? 'Saving...' : 'Save Document'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Edit3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a document from the Documents tab to start editing
                </p>
                <Button onClick={() => setActiveTab('documents')}>
                  Go to Documents
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Create Bid Package
              </CardTitle>
              <CardDescription>
                Compile completed documents into a submission-ready package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="package-name">Package Name</Label>
                <Input
                  id="package-name"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="Enter package name..."
                />
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Documents to Include</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {completedDocuments} completed documents will be included in the package
                </p>
                <div className="space-y-2">
                  {bidDocuments
                    .filter(doc => doc.status === 'completed' || doc.status === 'approved')
                    .map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{doc.title}</span>
                      </div>
                    ))}
                </div>
              </div>

              <Button 
                onClick={() => createPackageMutation.mutate()}
                disabled={completedDocuments === 0 || createPackageMutation.isPending}
                className="w-full"
              >
                {createPackageMutation.isPending ? 'Creating Package...' : 'Create Bid Package'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Packages */}
          {bidPackages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bid Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bidPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{pkg.packageName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{pkg.status}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {pkg.documents.length} documents
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Created {new Date(pkg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {pkg.finalPdfPath && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}