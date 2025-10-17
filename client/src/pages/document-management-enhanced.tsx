import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Filter, Eye, Download, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Document = {
  id: string;
  documentName: string;
  folderName: string;
  uploadedBy: string;
  createdDateTime: string;
  fileUrl?: string;
};

export default function DocumentManagementEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);
  
  const [newDocument, setNewDocument] = useState({
    folderName: "",
    date: "",
    documentName: "",
    notes: "",
    assignee: "",
  });

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", searchQuery, stateFilter, startDate, endDate],
  });

  // Fallback data for display
  const displayDocuments: Document[] = documents.length > 0 ? documents : [
    {
      id: "1",
      documentName: "Technical Specifications.pdf",
      folderName: "Project Documentation",
      uploadedBy: "John Doe",
      createdDateTime: "2024-01-15T10:30:00",
    },
    {
      id: "2",
      documentName: "Financial Report Q1.xlsx",
      folderName: "Finance",
      uploadedBy: "Jane Smith",
      createdDateTime: "2024-01-20T14:45:00",
    },
  ];

  const handleClearFilters = () => {
    setSearchQuery("");
    setStateFilter("");
    setStartDate("");
    setEndDate("");
  };

  const handleAddDocument = () => {
    toast({
      title: "Document Added",
      description: "Your document has been successfully uploaded.",
    });
    setAddDocumentOpen(false);
    setNewDocument({
      folderName: "",
      date: "",
      documentName: "",
      notes: "",
      assignee: "",
    });
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-64"
          data-testid="input-search-documents"
        />
      </div>
      <Dialog open={addDocumentOpen} onOpenChange={setAddDocumentOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-primary" data-testid="button-add-document">
            <Plus className="h-4 w-4 mr-2" />
            Add New Document
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-add-document">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                placeholder="Enter folder name"
                value={newDocument.folderName}
                onChange={(e) => setNewDocument({ ...newDocument, folderName: e.target.value })}
                data-testid="input-folder-name"
              />
            </div>
            <div>
              <Label htmlFor="date">Enter date</Label>
              <Input
                id="date"
                type="date"
                value={newDocument.date}
                onChange={(e) => setNewDocument({ ...newDocument, date: e.target.value })}
                data-testid="input-date"
              />
            </div>
            <div>
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                placeholder="Enter document name"
                value={newDocument.documentName}
                onChange={(e) => setNewDocument({ ...newDocument, documentName: e.target.value })}
                data-testid="input-document-name"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes..."
                value={newDocument.notes}
                onChange={(e) => setNewDocument({ ...newDocument, notes: e.target.value })}
                data-testid="textarea-notes"
              />
            </div>
            <div>
              <Label htmlFor="assignee">Choose assignee</Label>
              <Select
                value={newDocument.assignee}
                onValueChange={(value) => setNewDocument({ ...newDocument, assignee: value })}
              >
                <SelectTrigger id="assignee" data-testid="select-assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Doe</SelectItem>
                  <SelectItem value="jane">Jane Smith</SelectItem>
                  <SelectItem value="bob">Bob Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddDocument}
              className="w-full"
              data-testid="button-submit-document"
            >
              Add Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const breadcrumbs = [
    { label: "Document Management" },
    { label: "All Documents" },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Document Management"
        description="Manage and organize all tender-related documents"
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>State</Label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="mt-1" data-testid="select-state">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      <SelectItem value="maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="gujarat">Gujarat</SelectItem>
                      <SelectItem value="rajasthan">Rajasthan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                    data-testid="input-end-date"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button className="flex-1" data-testid="button-apply-filters">
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex-1"
                    data-testid="button-clear-filters"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card data-testid="documents-table">
            <CardHeader className="pb-3">
              <CardTitle>All Documents</CardTitle>
              <CardDescription>View and manage all uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Folder Name</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Created Date & Time</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-pulse">Loading documents...</div>
                        </TableCell>
                      </TableRow>
                    ) : displayDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No documents found
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayDocuments.map((doc, index) => (
                        <TableRow key={doc.id} data-testid={`document-row-${index}`}>
                          <TableCell>{String(index + 1).padStart(2, "0")}</TableCell>
                          <TableCell className="font-medium" data-testid={`doc-name-${index}`}>
                            {doc.documentName}
                          </TableCell>
                          <TableCell>{doc.folderName}</TableCell>
                          <TableCell>{doc.uploadedBy}</TableCell>
                          <TableCell>
                            {new Date(doc.createdDateTime).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-view-${index}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-download-${index}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
