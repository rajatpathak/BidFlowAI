import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ExternalLink, 
  Building2, 
  DollarSign, 
  Calendar, 
  MapPin, 
  FileText, 
  Target, 
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

interface TenderDetail {
  id: string;
  title: string;
  organization: string;
  value: number;
  deadline: string;
  location: string;
  status: string;
  source: string;
  aiScore: number;
  requirements: Array<{
    location: string;
    reference: string;
    department: string;
    category: string;
    sheet: string;
    t247_id: string;
    turnover: string;
    msmeExemption?: string;
    startupExemption?: string;
    eligibilityCriteria?: string;
    checklist?: string;
    documentFees?: string;
    emd?: string;
    quantity?: string;
  }>;
  link?: string;
}

export default function TenderDetailEnhancedPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/tender/:id");
  
  const { data: tender, isLoading } = useQuery<TenderDetail>({
    queryKey: [`/api/tenders/${params?.id}`],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/active-tenders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Tender Not Found</h1>
            <p className="text-gray-600 mt-2">The requested tender could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const requirements = tender.requirements[0] || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/active-tenders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tender Details</h1>
            <p className="text-gray-600">Complete tender information and requirements</p>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl pr-4">{tender.title}</CardTitle>
                <CardDescription className="mt-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-lg">{tender.organization}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant={tender.source === 'gem' ? 'default' : 'secondary'} className="text-sm">
                  {tender.source === 'gem' ? 'GeM Portal' : 'Non-GeM Portal'}
                </Badge>
                <Badge 
                  variant={tender.aiScore >= 70 ? "default" : tender.aiScore >= 50 ? "secondary" : "outline"}
                  className={`text-sm ${
                    tender.aiScore >= 70 ? "bg-green-500 hover:bg-green-600" : 
                    tender.aiScore >= 50 ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {tender.aiScore}% AI Match
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Tender Value</p>
                  <p className="text-xl font-bold text-green-900">₹{(tender.value / 100).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Deadline</p>
                  <p className="text-xl font-bold text-blue-900">{new Date(tender.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <MapPin className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-700 font-medium">Location</p>
                  <p className="text-lg font-bold text-orange-900">{requirements.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Target className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700 font-medium">Source</p>
                  <p className="text-lg font-bold text-purple-900">{requirements.sheet || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Link Action */}
            {tender.link && (
              <div className="mb-6">
                <Button size="lg" asChild>
                  <a href={tender.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    View on Tender Portal
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comprehensive Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reference Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reference Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Reference Number</p>
                <p className="text-lg font-semibold text-gray-900">{requirements.reference || 'Not available'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 font-medium">T247 ID</p>
                <p className="text-lg font-semibold text-gray-900">{requirements.t247_id || 'Not available'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 font-medium">Department</p>
                <p className="font-medium">{requirements.department || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Category</p>
                <p className="font-medium">{requirements.category || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Turnover Requirement</p>
                <p className="text-lg font-semibold text-green-700">{requirements.turnover || 'Not specified'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 font-medium">Document Fees</p>
                <p className="font-medium">{requirements.documentFees || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">EMD (Earnest Money Deposit)</p>
                <p className="font-medium">{requirements.emd || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Quantity</p>
                <p className="font-medium">{requirements.quantity || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GeM Specific Information (if applicable) */}
        {tender.source === 'gem' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  MSME & Startup Exemptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">MSME Exemption</span>
                  <div className="flex items-center gap-2">
                    {requirements.msmeExemption === 'Yes' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={requirements.msmeExemption === 'Yes' ? 'default' : 'outline'}>
                      {requirements.msmeExemption || 'No'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Startup Exemption</span>
                  <div className="flex items-center gap-2">
                    {requirements.startupExemption === 'Yes' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={requirements.startupExemption === 'Yes' ? 'default' : 'outline'}>
                      {requirements.startupExemption || 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Additional Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Status</p>
                  <Badge variant="outline" className="mt-1">
                    {tender.status || 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Processing Sheet</p>
                  <p className="font-medium">{requirements.sheet || 'Unknown'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Eligibility Criteria & Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Eligibility Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {requirements.eligibilityCriteria || 'No specific eligibility criteria provided.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {requirements.checklist || 'No checklist items specified.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}