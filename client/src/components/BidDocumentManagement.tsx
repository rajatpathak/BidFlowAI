import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  Upload,
  File,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BidDocument {
  id: string;
  tenderId: string;
  documentType: string;
  title: string;
  content: string;
  status: 'draft' | 'in-review' | 'approved' | 'rejected';
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  reviewedBy?: string;
  comments?: string;
}

interface BidDocumentManagementProps {
  tenderId: string;
}

const BidDocumentManagement: React.FC<BidDocumentManagementProps> = ({ tenderId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BidDocument | null>(null);
  const [newDocument, setNewDocument] = useState({
    documentType: '',
    title: '',
    content: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bid documents
  const { data: bidDocuments = [], isLoading } = useQuery({
    queryKey: [`/api/tenders/${tenderId}/bid-documents`],
    queryFn: async () => {
      const response = await fetch(`/api/tenders/${tenderId}/bid-documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bid documents');
      return response.json();
    }
  });

  // Fetch document types
  const { data: documentTypes = [] } = useQuery({
    queryKey: ['/api/bid-document-types'],
    queryFn: async () => {
      const response = await fetch('/api/bid-document-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch document types');
      return response.json();
    }
  });

  // Create bid document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      const response = await fetch(`/api/tenders/${tenderId}/bid-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(documentData)
      });
      if (!response.ok) throw new Error('Failed to create bid document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bid document created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}/bid-documents`] });
      setShowCreateDialog(false);
      setNewDocument({ documentType: '', title: '', content: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bid document",
        variant: "destructive"
      });
    }
  });

  // Update bid document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ documentId, documentData }: { documentId: string; documentData: any }) => {
      const response = await fetch(`/api/bid-documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(documentData)
      });
      if (!response.ok) throw new Error('Failed to update bid document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bid document updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}/bid-documents`] });
      setShowEditDialog(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bid document",
        variant: "destructive"
      });
    }
  });

  // Delete bid document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/bid-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete bid document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bid document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}/bid-documents`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bid document",
        variant: "destructive"
      });
    }
  });

  const handleCreateDocument = () => {
    if (!newDocument.documentType || !newDocument.title || !newDocument.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createDocumentMutation.mutate({
      ...newDocument,
      tenderId,
      status: 'draft'
    });
  };

  const handleEditDocument = () => {
    if (!selectedDocument) return;

    updateDocumentMutation.mutate({
      documentId: selectedDocument.id,
      documentData: {
        documentType: selectedDocument.documentType,
        title: selectedDocument.title,
        content: selectedDocument.content
      }
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this bid document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'outline' as const, color: 'text-gray-600' },
      'in-review': { variant: 'secondary' as const, color: 'text-blue-600' },
      approved: { variant: 'default' as const, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-review':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bid Document Management
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Bid Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Select 
                      value={newDocument.documentType} 
                      onValueChange={(value) => setNewDocument({...newDocument, documentType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type: any) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter document title"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Document Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter document content"
                      value={newDocument.content}
                      onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                      rows={10}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateDocument}
                    disabled={createDocumentMutation.isPending}
                  >
                    {createDocumentMutation.isPending ? "Creating..." : "Create Document"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Create, manage, and track all bid documents for this tender. Documents go through draft → review → approval workflow.
          </p>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bid Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {bidDocuments.length > 0 ? (
            <div className="space-y-4">
              {bidDocuments.map((doc: BidDocument) => (
                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(doc.status)}
                        <h3 className="font-medium">{doc.title}</h3>
                        {getStatusBadge(doc.status)}
                        <Badge variant="outline" className="text-xs">
                          v{doc.version}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Type: {doc.documentType}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(doc.createdAt).toLocaleDateString()} • 
                        Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                      {doc.comments && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Comments: {doc.comments}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bid documents created yet</p>
              <p className="text-sm">Create your first bid document to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bid Document</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-document-type">Document Type</Label>
                <Select 
                  value={selectedDocument.documentType} 
                  onValueChange={(value) => setSelectedDocument({...selectedDocument, documentType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Document Title</Label>
                <Input
                  id="edit-title"
                  value={selectedDocument.title}
                  onChange={(e) => setSelectedDocument({...selectedDocument, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Document Content</Label>
                <Textarea
                  id="edit-content"
                  value={selectedDocument.content}
                  onChange={(e) => setSelectedDocument({...selectedDocument, content: e.target.value})}
                  rows={10}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setSelectedDocument(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditDocument}
              disabled={updateDocumentMutation.isPending}
            >
              {updateDocumentMutation.isPending ? "Updating..." : "Update Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BidDocumentManagement;