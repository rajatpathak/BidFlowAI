import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Calendar,
  Building2,
  DollarSign,
  FileText,
  Search,
  Heart,
  ExternalLink,
  Share2,
  CalendarDays,
  TrendingUp,
  Clock,
  Mail,
  Bell,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Tender = {
  id: string;
  title: string;
  organization: string;
  referenceNumber: string | null;
  value: number;
  deadline: string;
  status: string;
  source: string;
  assignedTo: string | null;
  aiScore: number;
  link: string | null;
  createdAt: string;
};

export default function ActiveTendersEnhanced() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [closingFrom, setClosingFrom] = useState("");
  const [closingTo, setClosingTo] = useState("");
  const [website, setWebsite] = useState("");
  const [quantityOperator, setQuantityOperator] = useState(">=");
  const [quantityValue, setQuantityValue] = useState("");
  const [valueOperator, setValueOperator] = useState("=");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [gemFilter, setGemFilter] = useState("all");
  const [msmeExemption, setMsmeExemption] = useState(false);
  const [aiSummary, setAiSummary] = useState(false);
  const [startupExemption, setStartupExemption] = useState(false);
  const [boqFilter, setBoqFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("fresh");
  const [sortBy, setSortBy] = useState("value");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(true);

  const { user } = useAuth();

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/tenders/stats"],
  });

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set('search', searchQuery);
  if (organizationFilter) queryParams.set('organization', organizationFilter);
  if (gemFilter !== 'all') queryParams.set('source', gemFilter);
  if (minValue) queryParams.set('minValue', minValue);
  if (maxValue) queryParams.set('maxValue', maxValue);
  if (closingFrom) queryParams.set('closingFrom', closingFrom);
  if (closingTo) queryParams.set('closingTo', closingTo);
  if (activeTab !== 'fresh' && activeTab !== 'relevant') {
    // Map tab to status filter
    const statusMap: Record<string, string> = {
      assigned: 'assigned',
      progress: 'in_progress',
      submitted: 'submitted'
    };
    queryParams.set('status', statusMap[activeTab]);
  }
  queryParams.set('sortBy', sortBy);
  queryParams.set('sortOrder', sortOrder);

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: [`/api/tenders?${queryParams.toString()}`],
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setOrganizationFilter("");
    setCategoryFilter("");
    setStateFilter("");
    setCityFilter("");
    setOwnershipFilter("");
    setDepartmentFilter("");
    setClosingFrom("");
    setClosingTo("");
    setWebsite("");
    setQuantityValue("");
    setMinValue("");
    setMaxValue("");
    setGemFilter("all");
    setMsmeExemption(false);
    setAiSummary(false);
    setStartupExemption(false);
    setBoqFilter(false);
  };

  const formatValue = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr.`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="active-tenders-enhanced">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select Mail Date</p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Input type="date" className="w-32 h-8" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{stats?.todayTenders || 0}</p>
                </div>
                <p className="text-sm text-blue-600 mt-2">Today Tenders</p>
                <p className="text-xs text-gray-500">({new Date().toLocaleDateString()})</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{stats?.activeTenders?.toLocaleString() || 0}</p>
                </div>
                <p className="text-sm text-green-600 mt-2">Active Tenders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">{stats?.closedTenders?.toLocaleString() || 0}</p>
                </div>
                <p className="text-sm text-orange-600 mt-2">Closed Tenders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm text-purple-600 mt-2">Get Reminders</p>
                <p className="text-xs text-gray-500">on ✉️ and 📱</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tender Filters */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-4 border-b flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <h3 className="text-lg font-semibold">Tender Filters</h3>
          <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </div>
        
        {showFilters && (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Row 1 */}
              <div>
                <Label>Search By T247 ID / Relevant Word</Label>
                <div className="flex gap-2 mt-1">
                  <Search className="h-4 w-4 mt-3 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-t247"
                  />
                </div>
              </div>

              <div>
                <Label>Organization Tender ID</Label>
                <Input
                  placeholder="Enter Organization"
                  value={organizationFilter}
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                  data-testid="input-organization"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Select Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1" data-testid="select-category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="it">IT & Software</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2 */}
              <div>
                <Label>Select State</Label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="mt-1" data-testid="select-state">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="karnataka">Karnataka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select City</Label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="mt-1" data-testid="select-city">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Ownership</Label>
                <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                  <SelectTrigger className="mt-1" data-testid="select-ownership">
                    <SelectValue placeholder="Select Ownership" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3 */}
              <div>
                <Label>Select Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="mt-1" data-testid="select-department">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Closing From</Label>
                  <Input
                    type="date"
                    value={closingFrom}
                    onChange={(e) => setClosingFrom(e.target.value)}
                    data-testid="input-closing-from"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Closing To</Label>
                  <Input
                    type="date"
                    value={closingTo}
                    onChange={(e) => setClosingTo(e.target.value)}
                    data-testid="input-closing-to"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Website</Label>
                <Input
                  placeholder="Enter website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  data-testid="input-website"
                  className="mt-1"
                />
              </div>

              {/* Row 4 - Advanced Filters */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Quantity</Label>
                  <Select value={quantityOperator} onValueChange={setQuantityOperator}>
                    <SelectTrigger className="mt-1" data-testid="select-quantity-operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">=">&gt;=</SelectItem>
                      <SelectItem value="<=">&lt;=</SelectItem>
                      <SelectItem value="=">=</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Enter Quantity"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  data-testid="input-quantity"
                  className="flex-1"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Tender Value</Label>
                  <Select value={valueOperator} onValueChange={setValueOperator}>
                    <SelectTrigger className="mt-1" data-testid="select-value-operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value="range">Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Value (Lakh)"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  data-testid="input-min-value"
                  className="flex-1"
                />
                {valueOperator === 'range' && (
                  <>
                    <span className="text-sm">To</span>
                    <Input
                      placeholder="Value (Lakh)"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      data-testid="input-max-value"
                      className="flex-1"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Checkboxes and Radio Buttons */}
            <div className="flex flex-wrap items-center gap-6 mt-6">
              <div className="flex items-center gap-4">
                <Label>GeM / Non GeM:</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gem"
                      value="all"
                      checked={gemFilter === 'all'}
                      onChange={(e) => setGemFilter(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">All</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gem"
                      value="gem"
                      checked={gemFilter === 'gem'}
                      onChange={(e) => setGemFilter(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">GeM</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gem"
                      value="non_gem"
                      checked={gemFilter === 'non_gem'}
                      onChange={(e) => setGemFilter(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">Non GeM</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={msmeExemption}
                  onChange={(e) => setMsmeExemption(e.target.checked)}
                  className="cursor-pointer"
                />
                <span className="text-sm">MSME Exemption</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSummary}
                  onChange={(e) => setAiSummary(e.target.checked)}
                  className="cursor-pointer"
                />
                <span className="text-sm">AI Summary</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={startupExemption}
                  onChange={(e) => setStartupExemption(e.target.checked)}
                  className="cursor-pointer"
                />
                <span className="text-sm">Startup Exemption</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={boqFilter}
                  onChange={(e) => setBoqFilter(e.target.checked)}
                  className="cursor-pointer"
                />
                <span className="text-sm">BOQ</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-3">
                <Button data-testid="button-search" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  SEARCH
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  data-testid="button-clear"
                >
                  CLEAR
                </Button>
              </div>
              <Button variant="outline" data-testid="button-advance-search">
                ADVANCE SEARCH
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs and Sorting */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList data-testid="tabs-tender-status">
            <TabsTrigger value="fresh">Fresh ({tenders.filter(t => t.status === 'draft').length})</TabsTrigger>
            <TabsTrigger value="assigned">Assigned ({tenders.filter(t => t.status === 'assigned').length})</TabsTrigger>
            <TabsTrigger value="progress">In Progress ({tenders.filter(t => t.status === 'in_progress').length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({tenders.filter(t => t.status === 'submitted').length})</TabsTrigger>
            <TabsTrigger value="relevant">Most Relevant</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
          const [sb, so] = val.split('-');
          setSortBy(sb);
          setSortOrder(so);
        }}>
          <SelectTrigger className="w-48" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value-desc">PRICE: HIGH TO LOW</SelectItem>
            <SelectItem value="value-asc">PRICE: LOW TO HIGH</SelectItem>
            <SelectItem value="deadline-asc">DEADLINE: SOON TO LATE</SelectItem>
            <SelectItem value="deadline-desc">DEADLINE: LATE TO SOON</SelectItem>
            <SelectItem value="aiScore-desc">AI SCORE: HIGH TO LOW</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenders List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center py-8">Loading tenders...</p>
        ) : tenders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No tenders found. Try adjusting your filters.
            </CardContent>
          </Card>
        ) : (
          tenders.map((tender, index) => {
            const daysLeft = getDaysLeft(tender.deadline);
            const isCorrigendum = tender.title.toLowerCase().includes('corrigendum');

            return (
              <Card key={tender.id} className="hover:shadow-lg transition-shadow" data-testid={`card-tender-${tender.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg">{index + 1}|</span>
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold">Bid Value:</span> {formatValue(tender.value)} | 
                            <span className="ml-2 font-semibold">EMD:</span> {formatValue(tender.value * 0.02)} | 
                            <span className={`ml-2 ${daysLeft < 7 ? 'text-red-600' : 'text-green-600'}`}>
                              {new Date(tender.deadline).toLocaleDateString()} {daysLeft} Days Left
                            </span> | 
                            <span className="ml-2 font-semibold">T247 ID:</span> {tender.referenceNumber || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 mb-2">
                        {isCorrigendum && (
                          <div className="h-3 w-3 rounded-full bg-red-500 mt-1" title="Corrigendum" />
                        )}
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 flex-1">
                          {tender.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="h-4 w-4" />
                        <span>{tender.organization}</span>
                        {tender.source === 'gem' && (
                          <Badge className="bg-green-500 text-white ml-2">GeM</Badge>
                        )}
                      </div>

                      {tender.aiScore > 0 && (
                        <div className="mt-2">
                          <a href="#" className="text-sm text-blue-600 hover:underline">
                            AI Summary / Eligibility Criteria
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" title="Reminders">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Add to favorites">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="External link">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Share">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
