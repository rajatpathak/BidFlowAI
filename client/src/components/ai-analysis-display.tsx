import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, FileText, Phone, Settings, Calculator, Target, AlertTriangle, Clock, Users } from "lucide-react";

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
            <div>
              <p className="font-medium">Match Assessment</p>
              <p className="text-sm text-gray-600">{analysis.matchReason || 'Analysis completed'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Qualification Criteria */}
      {analysis.preQualificationCriteria && analysis.preQualificationCriteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-orange-600" />
              Pre-Qualification Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.preQualificationCriteria.map((criteria: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{criteria.category}</p>
                    <Badge variant={
                      criteria.companyStatus === 'Eligible' ? 'default' :
                      criteria.companyStatus === 'Not Eligible' ? 'destructive' : 'secondary'
                    }>
                      {criteria.companyStatus}
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

      {/* Required Documents */}
      {analysis.requiredDocuments && analysis.requiredDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              Required Documents Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.requiredDocuments.map((doc: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`mt-1 w-3 h-3 rounded-full ${doc.mandatory ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{doc.document}</p>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                    {doc.format && <p className="text-xs text-gray-500 mt-1">Format: {doc.format}</p>}
                  </div>
                  <Badge variant={doc.mandatory ? 'destructive' : 'secondary'}>
                    {doc.mandatory ? 'Mandatory' : 'Optional'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {analysis.contactInformation && analysis.contactInformation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-indigo-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.contactInformation.map((contact: any, index: number) => (
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