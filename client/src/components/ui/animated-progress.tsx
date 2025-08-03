import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Upload, FileSpreadsheet } from "lucide-react";

interface ProgressStats {
  processed: number;
  duplicates: number;
  total: number;
  percentage: number;
  gemAdded: number;
  nonGemAdded: number;
  errors: number;
  completed?: boolean;
}

interface AnimatedProgressProps {
  isUploading: boolean;
  progress: ProgressStats;
  fileName?: string;
}

export default function AnimatedProgress({ isUploading, progress, fileName }: AnimatedProgressProps) {
  const [animatedCounts, setAnimatedCounts] = useState<ProgressStats>({
    processed: 0,
    duplicates: 0,
    total: 0,
    percentage: 0,
    gemAdded: 0,
    nonGemAdded: 0,
    errors: 0
  });

  // Animate count changes
  useEffect(() => {
    if (!isUploading) return;

    const interval = setInterval(() => {
      setAnimatedCounts(prev => ({
        processed: Math.min(prev.processed + Math.ceil((progress.processed - prev.processed) / 10), progress.processed),
        duplicates: Math.min(prev.duplicates + Math.ceil((progress.duplicates - prev.duplicates) / 10), progress.duplicates),
        total: progress.total,
        percentage: Math.min(prev.percentage + Math.ceil((progress.percentage - prev.percentage) / 10), progress.percentage),
        gemAdded: Math.min(prev.gemAdded + Math.ceil((progress.gemAdded - prev.gemAdded) / 10), progress.gemAdded),
        nonGemAdded: Math.min(prev.nonGemAdded + Math.ceil((progress.nonGemAdded - prev.nonGemAdded) / 10), progress.nonGemAdded),
        errors: Math.min(prev.errors + Math.ceil((progress.errors - prev.errors) / 10), progress.errors)
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isUploading, progress]);

  if (!isUploading && progress.percentage === 0) return null;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              {isUploading && (
                <Upload className="h-3 w-3 text-blue-500 absolute -top-1 -right-1 animate-bounce" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">Excel Import Progress</h3>
              {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
            </div>
          </div>
          <Badge variant={progress.completed ? "default" : "secondary"} className="animate-pulse">
            {progress.percentage}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={animatedCounts.percentage} 
            className="h-3 bg-slate-200"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processing records...</span>
            <span>{animatedCounts.processed} / {progress.total}</span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* GeM Tenders */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">GeM</span>
            </div>
            <div className="text-lg font-bold text-green-800 transition-all duration-300">
              {animatedCounts.gemAdded}
            </div>
            <div className="text-xs text-green-600">entered</div>
          </div>

          {/* Non-GeM Tenders */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Non-GeM</span>
            </div>
            <div className="text-lg font-bold text-blue-800 transition-all duration-300">
              {animatedCounts.nonGemAdded}
            </div>
            <div className="text-xs text-blue-600">entered</div>
          </div>

          {/* Duplicates */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">Skipped</span>
            </div>
            <div className="text-lg font-bold text-yellow-800 transition-all duration-300">
              {animatedCounts.duplicates}
            </div>
            <div className="text-xs text-yellow-600">duplicates</div>
          </div>

          {/* Errors */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Failed</span>
            </div>
            <div className="text-lg font-bold text-red-800 transition-all duration-300">
              {animatedCounts.errors}
            </div>
            <div className="text-xs text-red-600">errors</div>
          </div>
        </div>

        {/* Summary Message */}
        {progress.completed && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-800">
              Import Complete! {animatedCounts.gemAdded + animatedCounts.nonGemAdded} tenders added
            </p>
            {animatedCounts.duplicates > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {animatedCounts.duplicates} duplicates were automatically skipped
              </p>
            )}
          </div>
        )}

        {/* Real-time Status */}
        {isUploading && !progress.completed && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>
                {animatedCounts.gemAdded > 0 && `${animatedCounts.gemAdded} GeM • `}
                {animatedCounts.nonGemAdded > 0 && `${animatedCounts.nonGemAdded} Non-GeM • `}
                {animatedCounts.duplicates > 0 && `${animatedCounts.duplicates} skipped • `}
                {animatedCounts.errors > 0 && `${animatedCounts.errors} failed • `}
                Processing...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}