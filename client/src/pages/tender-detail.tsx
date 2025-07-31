import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink, Calendar, Building2, DollarSign, MapPin, FileText, Users, CheckCircle } from "lucide-react";

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
  description: string;
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
  }>;
  link?: string;
}

export default function TenderDetailPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/tender/:id");
  
  const { data: tender, isLoading } = useQuery<TenderDetail>({
    queryKey: [`/api/tenders/${params?.id}`],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/active-tenders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tender Details</h1>
            <p className="text-gray-600">View comprehensive tender information</p>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{tender.title}</CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {tender.organization}
                  </div>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={tender.source === 'gem' ? 'default' : 'secondary'}>
                  {tender.source === 'gem' ? 'GeM' : 'Non-GeM'}
                </Badge>
                <Badge 
                  variant={tender.aiScore >= 70 ? "default" : tender.aiScore >= 50 ? "secondary" : "outline"}
                  className={
                    tender.aiScore >= 70 ? "bg-green-500" : 
                    tender.aiScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }
                >
                  {tender.aiScore}% AI Match
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Tender Value</p>
                  <p className="font-semibold">₹{(tender.value / 100).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-semibold">{new Date(tender.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold">{tender.location || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {tender.link && (
              <div className="pt-4">
                <Button asChild>
                  <a href={tender.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Tender Portal
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tender Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tender Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Reference Number</p>
                <p className="font-medium">{requirements.reference || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">T247 ID</p>
                <p className="font-medium">{requirements.t247_id || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{requirements.department || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{requirements.category || 'Not specified'}</p>
              </div>
              {requirements.turnover && (
                <div>
                  <p className="text-sm text-gray-500">Turnover Requirement</p>
                  <p className="font-medium">{requirements.turnover}</p>
                </div>
              )}
              {requirements.sheet && (
                <div>
                  <p className="text-sm text-gray-500">Source Sheet</p>
                  <p className="font-medium">{requirements.sheet}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GeM Specific Fields */}
          {tender.source === 'gem' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  GeM Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requirements.msmeExemption && (
                  <div>
                    <p className="text-sm text-gray-500">MSME Exemption</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{requirements.msmeExemption}</p>
                      {requirements.msmeExemption.toLowerCase() === 'yes' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                )}
                {requirements.startupExemption && (
                  <div>
                    <p className="text-sm text-gray-500">Startup Exemption</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{requirements.startupExemption}</p>
                      {requirements.startupExemption.toLowerCase() === 'yes' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Eligibility Criteria & Checklist */}
        {(requirements.eligibilityCriteria || requirements.checklist) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requirements.eligibilityCriteria && (
              <Card>
                <CardHeader>
                  <CardTitle>Eligibility Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{requirements.eligibilityCriteria}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {requirements.checklist && (
              <Card>
                <CardHeader>
                  <CardTitle>Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{requirements.checklist}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}