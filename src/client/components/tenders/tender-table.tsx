import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  ExternalLink,
  UserPlus,
  Users,
  Eye,
  Trash2,
} from "lucide-react";
import { TenderAssignmentDialog } from "../tender-assignment-dialog";

interface Tender {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  location: string;
  status: string;
  source: string;
  aiScore: number;
  assignedTo?: string;
  referenceNo?: string;
  requirements?: Array<{
    reference?: string;
    msmeExemption?: string;
    startupExemption?: string;
  }>;
  link?: string;
}

interface TenderTableProps {
  tenders: Tender[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedTenders: Set<string>;
  setSelectedTenders: (tenders: Set<string>) => void;

  onMarkNotRelevant?: (tenderId: string) => void;
  onDelete?: (tenderId: string) => void;
  onSelectAll?: (tenders: Tender[]) => void;
  onGlobalSelectAll?: (source: 'gem' | 'non_gem') => void;
  onDeleteSelected?: () => void;
  user?: { role: string };
  source: 'gem' | 'non_gem';
  allTendersCount?: number;
  allTenders?: Tender[];
  deleteProgress?: { current: number; total: number; isDeleting: boolean };
}

export function TenderTable({
  tenders,
  totalPages,
  currentPage,
  setCurrentPage,
  selectedTenders,
  setSelectedTenders,

  onMarkNotRelevant,
  onDelete,
  onSelectAll,
  onGlobalSelectAll,
  onDeleteSelected,
  user,
  source,
  allTendersCount = 0,
  allTenders = [],
  deleteProgress = { current: 0, total: 0, isDeleting: false }
}: TenderTableProps) {
  
  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(tenders);
    } else {
      if (checked) {
        setSelectedTenders(new Set([...selectedTenders, ...tenders.map(t => t.id)]));
      } else {
        const newSelected = new Set(selectedTenders);
        tenders.forEach(t => newSelected.delete(t.id));
        setSelectedTenders(newSelected);
      }
    }
  };

  const handleSelectTender = (tenderId: string, checked: boolean) => {
    const newSelected = new Set(selectedTenders);
    if (checked) {
      newSelected.add(tenderId);
    } else {
      newSelected.delete(tenderId);
    }
    setSelectedTenders(newSelected);
  };

  const getTableHeaders = () => {
    const baseHeaders = [
      { label: "", key: "select" },
      { label: "Tender Details", key: "details" },
      { label: "Reference No", key: "reference" },
      { label: "Organization", key: "organization" },
      { label: "Value", key: "value" },
      { label: "Deadline", key: "deadline" },
      { label: "Link", key: "link" },
      { label: "AI Score", key: "ai_score" },
      { label: "Status", key: "status" }
    ];

    if (source === 'gem') {
      baseHeaders.splice(7, 0, 
        { label: "MSME", key: "msme" },
        { label: "Startup", key: "startup" }
      );
    }

    baseHeaders.push({ label: "Actions", key: "actions" });
    return baseHeaders;
  };

  const headers = getTableHeaders();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {source === 'gem' ? 'GeM' : 'Non-GeM'} Tenders ({tenders.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {onGlobalSelectAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGlobalSelectAll(source)}
                >
                  {allTendersCount > 0 && Array.from(selectedTenders).filter(id => 
                    allTenders.some(t => t.id === id)
                  ).length === allTendersCount 
                    ? 'Deselect All' 
                    : `Select All (${allTendersCount})`}
                </Button>
              )}
              {selectedTenders.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedTenders.size} selected
                  </span>
                  {user?.role === 'admin' && onDeleteSelected && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onDeleteSelected}
                      disabled={deleteProgress.isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deleteProgress.isDeleting 
                        ? `Deleting... (${deleteProgress.current}/${deleteProgress.total})`
                        : 'Delete Selected'
                      }
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Delete Progress Bar */}
        {deleteProgress.isDeleting && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-800">
                Deleting Tenders...
              </span>
              <span className="text-sm text-red-600">
                {deleteProgress.current} / {deleteProgress.total}
              </span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${deleteProgress.total > 0 ? (deleteProgress.current / deleteProgress.total) * 100 : 0}%` 
                }}
              />
            </div>
            <div className="text-xs text-red-600 mt-1">
              {deleteProgress.total > 0 ? Math.round((deleteProgress.current / deleteProgress.total) * 100) : 0}% complete
            </div>
          </div>
        )}
        {tenders.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No {source === 'gem' ? 'GeM' : 'Non-GeM'} tenders found
            </h3>
            <p className="text-gray-500 mt-1">
              Upload tender data to see available opportunities.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header.key} className={
                      header.key === "select" ? "w-12" :
                      header.key === "details" ? "min-w-96" :
                      header.key === "msme" || header.key === "startup" ? "w-20" :
                      header.key === "ai_score" ? "w-24" :
                      header.key === "actions" ? "w-32" : ""
                    }>
                      {header.key === "select" ? (
                        <Checkbox
                          checked={tenders.length > 0 && tenders.every(t => selectedTenders.has(t.id))}
                          onCheckedChange={handleSelectAll}
                        />
                      ) : (
                        header.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenders.map((tender) => (
                  <TableRow key={tender.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTenders.has(tender.id)}
                        onCheckedChange={(checked) => handleSelectTender(tender.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="max-w-96">
                      <div>
                        <div className="font-medium text-gray-900 line-clamp-2 flex items-start gap-2">
                          <span>{tender.title}</span>
                          {tender.title.toLowerCase().includes('corrigendum') && (
                            <Badge variant="destructive" className="text-xs px-1 py-0 flex-shrink-0">
                              Corrigendum
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {tender.location || 'Location not specified'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {tender.referenceNo || 
                         (tender.requirements && tender.requirements[0] && tender.requirements[0].reference) || 
                         'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {tender.organization}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{(tender.value / 100).toLocaleString('en-IN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(tender.deadline).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tender.link ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={tender.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">No link</span>
                      )}
                    </TableCell>
                    {source === 'gem' && (
                      <>
                        <TableCell>
                          <Badge variant={tender.requirements?.[0]?.msmeExemption?.toLowerCase() === 'yes' ? 'default' : 'outline'}>
                            {tender.requirements?.[0]?.msmeExemption || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tender.requirements?.[0]?.startupExemption?.toLowerCase() === 'yes' ? 'default' : 'outline'}>
                            {tender.requirements?.[0]?.startupExemption || 'N/A'}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge 
                        variant={tender.aiScore >= 70 ? "default" : tender.aiScore >= 50 ? "secondary" : "outline"}
                        className={
                          tender.aiScore >= 70 ? "bg-green-500" : 
                          tender.aiScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }
                      >
                        {tender.aiScore}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tender.assignedTo ? "default" : "outline"}>
                        {tender.assignedTo ? `Assigned to ${(tender as any).assignedToName || tender.assignedTo}` : (tender.status || 'Active')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user?.role === 'admin' && (
                          <TenderAssignmentDialog
                            tenderId={tender.id}
                            tenderTitle={tender.title}
                            currentAssignment={tender.assignedTo ? {
                              bidderName: tender.assignedTo,
                              priority: 'medium' // Default value, would need to fetch from assignments
                            } : undefined}
                            onAssignmentChange={() => {
                              // Refresh tenders after assignment
                              window.location.reload();
                            }}
                          />
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = `/tender/${tender.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onMarkNotRelevant?.(tender.id)}
                        >
                          NR
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onDelete?.(tender.id)}
                          disabled={!user || user.role !== 'admin'}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}