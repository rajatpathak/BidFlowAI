import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenderTable } from "@/components/tenders/tender-table";
import { FileSpreadsheet, FileText, Target, Building2, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  requirements?: Array<{
    reference?: string;
    msmeExemption?: string;
    startupExemption?: string;
    eligibilityCriteria?: string;
    checklist?: string;
  }>;
  link?: string;
}

export default function ActiveTendersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTenders, setSelectedTenders] = useState<Set<string>>(new Set());
  const itemsPerPage = 20;

  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  // Filter tenders by source and search
  const getFilteredTenders = (source: string) => {
    return tenders.filter(tender => {
      // Source filter
      if (source === 'gem' && tender.source !== 'gem') return false;
      if (source === 'non_gem' && tender.source !== 'non_gem') return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          tender.title.toLowerCase().includes(query) ||
          tender.organization.toLowerCase().includes(query) ||
          (tender.location && tender.location.toLowerCase().includes(query)) ||
          (tender.requirements?.[0]?.reference && tender.requirements[0].reference.toLowerCase().includes(query))
        );
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  const gemTenders = getFilteredTenders('gem');
  const nonGemTenders = getFilteredTenders('non_gem');

  // Pagination helper
  const getPaginatedTenders = (tendersList: Tender[]) => {
    const totalPages = Math.ceil(tendersList.length / itemsPerPage);
    const paginatedTenders = tendersList.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return { tendersList: paginatedTenders, totalPages };
  };

  const { tendersList: paginatedGemTenders, totalPages: gemTotalPages } = getPaginatedTenders(gemTenders);
  const { tendersList: paginatedNonGemTenders, totalPages: nonGemTotalPages } = getPaginatedTenders(nonGemTenders);

  // Assignment dialog handler
  const openAssignDialog = (tenderId: string) => {
    toast({
      title: "Assignment Feature",
      description: "Assignment functionality will be implemented soon.",
    });
  };

  // Statistics
  const stats = {
    total: tenders.length,
    gem: gemTenders.length,
    nonGem: nonGemTenders.length,
    eligible: tenders.filter(t => t.aiScore >= 70).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Active Tenders</h1>
            <p className="text-gray-600">Manage GeM and Non-GeM tender opportunities</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tenders</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">GeM Tenders</p>
                  <p className="text-2xl font-bold text-green-600">{stats.gem}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Non-GeM Tenders</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.nonGem}</p>
                </div>
                <Building2 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Eligible (≥70%)</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.eligible}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search tenders by title, organization, location, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs for GeM and Non-GeM Tenders */}
        <Tabs defaultValue="gem-tenders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gem-tenders">GeM Tenders ({gemTenders.length})</TabsTrigger>
            <TabsTrigger value="non-gem-tenders">Non-GeM Tenders ({nonGemTenders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="gem-tenders" className="space-y-6">
            <TenderTable
              tenders={paginatedGemTenders}
              totalPages={gemTotalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedTenders={selectedTenders}
              setSelectedTenders={setSelectedTenders}
              openAssignDialog={openAssignDialog}
              user={user}
              source="gem"
            />
          </TabsContent>

          <TabsContent value="non-gem-tenders" className="space-y-6">
            <TenderTable
              tenders={paginatedNonGemTenders}
              totalPages={nonGemTotalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedTenders={selectedTenders}
              setSelectedTenders={setSelectedTenders}
              openAssignDialog={openAssignDialog}
              user={user}
              source="non_gem"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}