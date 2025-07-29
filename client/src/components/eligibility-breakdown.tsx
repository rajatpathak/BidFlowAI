import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EligibilityBreakdown {
  overallScore: number;
  breakdown: {
    criterion: string;
    requirement: string;
    companyCapability: string;
    met: boolean;
    score: number;
    reason?: string;
  }[];
}

interface EligibilityBreakdownProps {
  breakdown: EligibilityBreakdown;
  referenceId?: string;
}

export function EligibilityBreakdown({ breakdown, referenceId }: EligibilityBreakdownProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getIcon = (met: boolean, score: number) => {
    if (met) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (score > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Eligibility Criteria Analysis
            {referenceId && <span className="text-sm text-gray-500 ml-2">({referenceId})</span>}
          </CardTitle>
          <Badge className={`text-lg px-3 py-1 ${getScoreBgColor(breakdown.overallScore)} ${getScoreColor(breakdown.overallScore)}`}>
            AI Score: {breakdown.overallScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Eligibility</span>
            <span className={`text-sm font-bold ${getScoreColor(breakdown.overallScore)}`}>
              {breakdown.overallScore}%
            </span>
          </div>
          <Progress value={breakdown.overallScore} className="h-2" />
        </div>

        {/* Breakdown Details */}
        <div className="space-y-4">
          {breakdown.breakdown.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(item.met, item.score)}
                  <h4 className="font-semibold">{item.criterion}</h4>
                </div>
                <Badge className={`${getScoreBgColor(item.score)} ${getScoreColor(item.score)}`}>
                  {item.score}%
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Requirement:</p>
                  <p className="font-medium">{item.requirement}</p>
                </div>
                <div>
                  <p className="text-gray-500">Your Company:</p>
                  <p className="font-medium">{item.companyCapability}</p>
                </div>
              </div>
              
              {item.reason && (
                <div className={`text-sm p-2 rounded ${
                  item.met ? 'bg-green-50 text-green-700' : 
                  item.score > 0 ? 'bg-yellow-50 text-yellow-700' : 
                  'bg-red-50 text-red-700'
                }`}>
                  {item.reason}
                </div>
              )}
              
              {/* Special case for turnover not eligible */}
              {item.criterion === 'Annual Turnover' && item.score === 0 && (
                <div className="bg-red-100 border border-red-200 rounded p-3 text-red-800 font-medium">
                  ⚠️ Turnover not eligible - This tender requires {item.requirement} while your company has {item.companyCapability}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Summary</h4>
          <div className="text-sm space-y-1">
            <p>✓ Criteria Met: {breakdown.breakdown.filter(b => b.met).length} of {breakdown.breakdown.length}</p>
            <p>⚠️ Criteria Partially Met: {breakdown.breakdown.filter(b => !b.met && b.score > 50).length}</p>
            <p>✗ Criteria Not Met: {breakdown.breakdown.filter(b => b.score <= 50).length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}