import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, FileText, Phone, Settings, Calculator, Target, AlertTriangle, Clock, Users, CheckSquare, Mail, MapPin, Calendar, MessageSquare, Send, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AIAnalysisDisplayProps {
  analysis: any;
}

export function AIAnalysisDisplay({ analysis }: AIAnalysisDisplayProps) {
  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Company Match Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Company Match Analysis ({analysis.matchPercentage || 0}%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {analysis.matchPercentage || 0}%
            </div>
            <div className="flex-1">
              <p className="font-medium">Match Assessment</p>
              <p className="text-sm text-gray-600">{analysis.matchReason || 'Analysis completed'}</p>
              {analysis.AnalysisSummary && (
                <div className="mt-2 text-xs text-blue-600">
                  Analyzed {analysis.AnalysisSummary.totalDocuments} documents • 
                  Found {analysis.AnalysisSummary.contactsFound} contacts • 
                  {analysis.AnalysisSummary.emailsFound} emails • 
                  {analysis.AnalysisSummary.queriesGenerated} queries generated
                </div>
              )}
            </div>
          </div>
          
          {/* Documents Processed */}
          {analysis.DocumentsProcessed && analysis.DocumentsProcessed.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Documents Analyzed:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysis.DocumentsProcessed.map((doc: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {doc.status === 'Error' ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-green-600" />
                    )}
                    <span className="truncate">{doc.name}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {doc.type}
                      </Badge>
                      <Badge 
                        variant={doc.status === 'Error' ? 'destructive' : 'default'} 
                        className="text-xs"
                      >
                        {doc.status === 'Error' ? 'Error' : doc.size}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      {analysis.TechnicalSpecifications && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-blue-600" />
              Technical Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analysis.TechnicalSpecifications).map(([key, value]) => (
                <div key={key} className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-blue-700 mt-1">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bidding Strategy Recommendations */}
      {analysis.BiddingStrategyRecommendations && analysis.BiddingStrategyRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-green-600" />
              Bidding Strategy Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.BiddingStrategyRecommendations.map((strategy: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-green-800">{strategy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-Qualification Criteria */}
      {analysis.PreQualificationCriteria && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-orange-600" />
              Pre-Qualification Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysis.PreQualificationCriteria).map(([category, details]) => (
                <div key={category} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  {typeof details === 'object' && details !== null ? (
                    <div className="space-y-2">
                      {Object.entries(details as any).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{String(details)}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline and Important Dates */}
      {analysis.TimelineAndImportantDates && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-purple-600" />
              Timeline & Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis.TimelineAndImportantDates).map(([key, value]) => (
                <div key={key} className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-purple-700 mt-1">
                    {value === 'Not specified' ? (
                      <span className="text-gray-500 italic">Not specified</span>
                    ) : (
                      String(value)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commercial Terms */}
      {analysis.CommercialTerms && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-indigo-600" />
              Commercial Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analysis.CommercialTerms).map(([key, value]) => (
                <div key={key} className="p-4 bg-indigo-50 rounded-lg">
                  <p className="font-medium text-indigo-900">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-indigo-700 mt-1">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Criteria */}
      {analysis.EvaluationCriteria && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="h-5 w-5 text-teal-600" />
              Evaluation Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analysis.EvaluationCriteria).map(([key, value]) => (
                <div key={key} className="p-4 bg-teal-50 rounded-lg">
                  <p className="font-medium text-teal-900">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-teal-700 mt-1">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Guarantees */}
      {analysis.PerformanceGuaranteesAndWarranties && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-emerald-600" />
              Performance Guarantees & Warranties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analysis.PerformanceGuaranteesAndWarranties).map(([key, value]) => (
                <div key={key} className="p-4 bg-emerald-50 rounded-lg">
                  <p className="font-medium text-emerald-900">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    {value === 'Not specified' ? (
                      <span className="text-gray-500 italic">Not specified</span>
                    ) : (
                      String(value)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-Qualification Criteria */}
      {(analysis.preQualificationCriteria || analysis.eligibilityCriteria) && (analysis.preQualificationCriteria || analysis.eligibilityCriteria).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-orange-600" />
              Pre-Qualification Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analysis.preQualificationCriteria || analysis.eligibilityCriteria).map((criteria: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{criteria.category || criteria.title}</p>
                    <Badge variant={
                      (criteria.companyStatus || criteria.status) === 'Eligible' ? 'default' :
                      (criteria.companyStatus || criteria.status) === 'Not Eligible' ? 'destructive' : 'secondary'
                    }>
                      {criteria.companyStatus || criteria.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{criteria.requirement}</p>
                  {criteria.gap && criteria.gap !== 'None' && (
                    <p className="text-sm text-red-600 mb-1"><strong>Gap:</strong> {criteria.gap}</p>
                  )}
                  {criteria.action && (
                    <p className="text-sm text-blue-600"><strong>Action:</strong> {criteria.action}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {analysis.ContactInformation && analysis.ContactInformation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Contact Information ({analysis.ContactInformation.length} contacts found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.ContactInformation.map((contact: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">{contact.Name || contact.name}</h4>
                    {contact.Designation && (
                      <p className="text-sm text-gray-600">{contact.Designation}</p>
                    )}
                    {contact.Department && (
                      <p className="text-sm text-blue-600">{contact.Department}</p>
                    )}
                    <div className="space-y-1">
                      {contact.Email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-mono">{contact.Email}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(contact.Email)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {contact.Phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-mono">{contact.Phone}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(contact.Phone)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {contact.Address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                          <span className="text-sm">{contact.Address}</span>
                        </div>
                      )}
                    </div>
                    {contact.Purpose && (
                      <div className="mt-2 pt-2 border-t">
                        <Badge variant="outline" className="text-xs">
                          {contact.Purpose}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Addresses Found */}
      {analysis.EmailAddressesFound && analysis.EmailAddressesFound.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-green-600" />
              Email Addresses Extracted ({analysis.EmailAddressesFound.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.EmailAddressesFound.map((email: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-mono flex-1">{email}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(email)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Numbers Found */}
      {analysis.PhoneNumbersFound && analysis.PhoneNumbersFound.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-purple-600" />
              Phone Numbers Extracted ({analysis.PhoneNumbersFound.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.PhoneNumbersFound.map((phone: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                  <Phone className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-mono flex-1">{phone}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(phone)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-bid Meeting Details */}
      {analysis.PreBidMeetingDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
              Pre-bid Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis.PreBidMeetingDetails).map(([key, value]) => (
                <div key={key} className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-900">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-orange-700 mt-1">
                    {value === 'Not specified' || !value ? (
                      <span className="text-gray-500 italic">Not specified</span>
                    ) : (
                      String(value)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-bid Queries */}
      {analysis.PreBidQueries && analysis.PreBidQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Suggested Pre-bid Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.PreBidQueries.map((query: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-indigo-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-indigo-900 mb-2">
                        Query #{index + 1}
                        {query.Section && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {query.Section}
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-indigo-800 mb-2">{query.Question}</p>
                      {query.Justification && (
                        <p className="text-xs text-indigo-600 italic">{query.Justification}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(query.Question)}
                      className="ml-2"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Email All Queries Button */}
              <div className="pt-4 border-t">
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => {
                    const allQueries = analysis.PreBidQueries.map((q: any, i: number) => 
                      `${i + 1}. ${q.Question} ${q.Section ? `(Section: ${q.Section})` : ''}`
                    ).join('\n\n');
                    
                    const emailSubject = `Pre-bid Queries - ${(analysis as any).tenderTitle || 'Tender'}`;
                    const emailBody = `Dear Sir/Madam,\n\nWe have the following queries regarding the tender:\n\n${allQueries}\n\nKindly clarify at your earliest convenience.\n\nRegards,\n[Your Name]\n[Company Name]`;
                    
                    const emails = analysis.ContactInformation
                      ?.filter((c: any) => c.Email)
                      ?.map((c: any) => c.Email)
                      ?.join(',') || analysis.EmailAddressesFound?.[0] || '';
                    
                    if (emails) {
                      window.open(`mailto:${emails}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
                    } else {
                      // Fallback to copying queries to clipboard if no emails found
                      navigator.clipboard.writeText(`Pre-bid Queries:\n\n${allQueries}`);
                      alert('No email addresses found in documents. Queries copied to clipboard. You can manually send to the tender issuing authority.');
                    }
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Email All Queries
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required Documents */}
      {(analysis.requiredDocuments || analysis.RequiredDocumentsChecklist) && (analysis.requiredDocuments || analysis.RequiredDocumentsChecklist).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              Required Documents Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analysis.requiredDocuments || analysis.RequiredDocumentsChecklist).map((doc: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`mt-1 w-3 h-3 rounded-full ${(doc.mandatory || doc.Mandatory) ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{doc.document || doc.Document}</p>
                    {doc.description && <p className="text-sm text-gray-600">{doc.description}</p>}
                    {doc.format && <p className="text-xs text-gray-500 mt-1">Format: {doc.format}</p>}
                  </div>
                  <Badge variant={(doc.mandatory || doc.Mandatory) ? 'destructive' : 'secondary'}>
                    {(doc.mandatory || doc.Mandatory) ? 'Mandatory' : 'Optional'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {(analysis.contactInformation || analysis.contactInfo) && (analysis.contactInformation || analysis.contactInfo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-indigo-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analysis.contactInformation || analysis.contactInfo).map((contact: any, index: number) => (
                <div key={index} className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{contact.name || 'Contact Person'}</p>
                      <p className="text-sm text-gray-600">{contact.designation || ''}</p>
                      {contact.department && <p className="text-sm text-gray-600">{contact.department}</p>}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Phone:</span>
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium">Address:</span>
                        <span>{contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Criteria (Legacy Support) */}
      {analysis.otherCriteria && analysis.otherCriteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              Other Criteria & Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.otherCriteria.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                  <span className="text-blue-600 mt-1">•</span>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-bid Meeting (Legacy Support) */}
      {analysis.preBidMeeting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              Pre-bid Meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.preBidMeeting.date && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-900">Date</p>
                  <p className="text-sm text-gray-700">{analysis.preBidMeeting.date}</p>
                </div>
              )}
              {analysis.preBidMeeting.time && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-900">Time</p>
                  <p className="text-sm text-gray-700">{analysis.preBidMeeting.time}</p>
                </div>
              )}
              {analysis.preBidMeeting.location && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-900">Location</p>
                  <p className="text-sm text-gray-700">{analysis.preBidMeeting.location}</p>
                </div>
              )}
              {analysis.preBidMeeting.details && (
                <div className="p-3 bg-orange-50 rounded-lg md:col-span-2">
                  <p className="font-medium text-orange-900">Details</p>
                  <p className="text-sm text-gray-700">{analysis.preBidMeeting.details}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotation Analysis (Legacy Support) */}
      {analysis.quotationAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-purple-600" />
              AI Quotation Analysis (L1 Strategy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.quotationAnalysis.estimatedAmount && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="font-medium text-purple-900">Estimated L1 Bid Amount</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{analysis.quotationAnalysis.estimatedAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.quotationAnalysis.strategy && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">Strategy</p>
                    <p className="text-sm text-gray-700">{analysis.quotationAnalysis.strategy}</p>
                  </div>
                )}
                {analysis.quotationAnalysis.riskLevel && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">Risk Level</p>
                    <p className="text-sm text-gray-700">{analysis.quotationAnalysis.riskLevel}</p>
                  </div>
                )}
                {analysis.quotationAnalysis.keyFactors && (
                  <div className="p-3 bg-purple-50 rounded-lg md:col-span-2">
                    <p className="font-medium text-purple-900">Key Factors</p>
                    <p className="text-sm text-gray-700">{analysis.quotationAnalysis.keyFactors.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Specifications */}
      {analysis.technicalSpecifications && analysis.technicalSpecifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-green-600" />
              Technical Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.technicalSpecifications.map((spec: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{spec.item}</p>
                    <Badge variant={
                      spec.complianceStatus === 'Compliant' ? 'default' :
                      spec.complianceStatus === 'Non-Compliant' ? 'destructive' : 'secondary'
                    }>
                      {spec.complianceStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{spec.requirement}</p>
                  {spec.action && (
                    <p className="text-sm text-blue-600"><strong>Action:</strong> {spec.action}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commercial Terms */}
      {analysis.commercialTerms && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-purple-600" />
              Commercial Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.commercialTerms.paymentTerms && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">Payment Terms</p>
                  <p className="text-sm text-gray-700">{analysis.commercialTerms.paymentTerms}</p>
                </div>
              )}
              {analysis.commercialTerms.performanceGuarantee && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">Performance Guarantee</p>
                  <p className="text-sm text-gray-700">{analysis.commercialTerms.performanceGuarantee}</p>
                </div>
              )}
              {analysis.commercialTerms.warrantyPeriod && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">Warranty Period</p>
                  <p className="text-sm text-gray-700">{analysis.commercialTerms.warrantyPeriod}</p>
                </div>
              )}
              {analysis.commercialTerms.advancePayment && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">Advance Payment</p>
                  <p className="text-sm text-gray-700">{analysis.commercialTerms.advancePayment}</p>
                </div>
              )}
              {analysis.commercialTerms.retentionAmount && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">Retention Amount</p>
                  <p className="text-sm text-gray-700">{analysis.commercialTerms.retentionAmount}</p>
                </div>
              )}
              {analysis.commercialTerms.deliveryTerms && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">Delivery Terms</p>
                  <p className="text-sm text-gray-700">{analysis.commercialTerms.deliveryTerms}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {analysis.timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.timeline.bidSubmission && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">Bid Submission</p>
                  <p className="text-sm text-gray-700">{analysis.timeline.bidSubmission}</p>
                </div>
              )}
              {analysis.timeline.preBidMeeting && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">Pre-Bid Meeting</p>
                  <p className="text-sm text-gray-700">{analysis.timeline.preBidMeeting}</p>
                </div>
              )}
              {analysis.timeline.technicalOpening && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">Technical Opening</p>
                  <p className="text-sm text-gray-700">{analysis.timeline.technicalOpening}</p>
                </div>
              )}
              {analysis.timeline.commercialOpening && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">Commercial Opening</p>
                  <p className="text-sm text-gray-700">{analysis.timeline.commercialOpening}</p>
                </div>
              )}
              {analysis.timeline.workCompletion && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">Work Completion</p>
                  <p className="text-sm text-gray-700">{analysis.timeline.workCompletion}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bidding Strategy */}
      {analysis.biddingStrategy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-orange-600" />
              AI Bidding Strategy & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.biddingStrategy.estimatedL1Amount && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="font-medium text-orange-900">Estimated L1 Bid Amount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{analysis.biddingStrategy.estimatedL1Amount.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.biddingStrategy.recommendedApproach && (
                  <div>
                    <p className="font-medium mb-2">Recommended Approach</p>
                    <p className="text-sm text-gray-600">{analysis.biddingStrategy.recommendedApproach}</p>
                  </div>
                )}
                
                {analysis.biddingStrategy.riskLevel && (
                  <div>
                    <p className="font-medium mb-2">Risk Level</p>
                    <Badge variant={
                      analysis.biddingStrategy.riskLevel?.includes('Low') ? 'default' :
                      analysis.biddingStrategy.riskLevel?.includes('Medium') ? 'secondary' : 'destructive'
                    }>
                      {analysis.biddingStrategy.riskLevel}
                    </Badge>
                  </div>
                )}
              </div>
              
              {analysis.biddingStrategy.winProbability && (
                <div>
                  <p className="font-medium mb-2">Win Probability</p>
                  <p className="text-sm text-gray-600">{analysis.biddingStrategy.winProbability}</p>
                </div>
              )}
              
              {analysis.biddingStrategy.keyDifferentiators && analysis.biddingStrategy.keyDifferentiators.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Key Differentiators</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.biddingStrategy.keyDifferentiators.map((item: string, index: number) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Checklist */}
      {analysis.complianceChecklist && analysis.complianceChecklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Compliance Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.complianceChecklist.map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{item.item}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'secondary' : 'outline'}>
                        {item.priority}
                      </Badge>
                      <Badge variant={
                        item.status === 'Compliant' ? 'default' :
                        item.status === 'Non-Compliant' ? 'destructive' : 'secondary'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  {item.action && (
                    <p className="text-sm text-blue-600"><strong>Action:</strong> {item.action}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Criteria */}
      {analysis.evaluationCriteria && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-green-600" />
              Evaluation Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.evaluationCriteria.technicalWeightage && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">Technical Weightage</p>
                  <p className="text-sm text-gray-700">{analysis.evaluationCriteria.technicalWeightage}</p>
                </div>
              )}
              {analysis.evaluationCriteria.commercialWeightage && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">Commercial Weightage</p>
                  <p className="text-sm text-gray-700">{analysis.evaluationCriteria.commercialWeightage}</p>
                </div>
              )}
              {analysis.evaluationCriteria.methodology && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">Methodology</p>
                  <p className="text-sm text-gray-700">{analysis.evaluationCriteria.methodology}</p>
                </div>
              )}
              {analysis.evaluationCriteria.qualifyingMarks && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">Qualifying Marks</p>
                  <p className="text-sm text-gray-700">{analysis.evaluationCriteria.qualifyingMarks}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}