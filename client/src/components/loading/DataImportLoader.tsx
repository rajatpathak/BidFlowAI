import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Upload, 
  FileSpreadsheet, 
  Database, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  TrendingUp
} from "lucide-react";

interface DataImportLoaderProps {
  stage: 'upload' | 'parse' | 'validate' | 'import' | 'complete' | 'error';
  fileName?: string;
  progress?: number;
  message?: string;
  stats?: {
    totalRows?: number;
    processedRows?: number;
    importedRecords?: number;
    duplicatesSkipped?: number;
    errors?: number;
  };
}

export function DataImportLoader({ 
  stage, 
  fileName, 
  progress = 0, 
  message,
  stats = {}
}: DataImportLoaderProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev < progress) {
          return Math.min(prev + 1, progress);
        }
        return prev;
      });
    }, 50);
    
    return () => clearInterval(timer);
  }, [progress]);

  const getStageIcon = () => {
    switch (stage) {
      case 'upload':
        return <Upload className="h-8 w-8 text-blue-500 animate-bounce" />;
      case 'parse':
        return <FileSpreadsheet className="h-8 w-8 text-yellow-500 animate-pulse" />;
      case 'validate':
        return <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />;
      case 'import':
        return <Database className="h-8 w-8 text-purple-500 animate-pulse" />;
      case 'complete':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <FileSpreadsheet className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStageMessage = () => {
    if (message) return message;
    
    switch (stage) {
      case 'upload':
        return 'Uploading file to server...';
      case 'parse':
        return 'Reading Excel file data...';
      case 'validate':
        return 'Validating data structure...';
      case 'import':
        return 'Importing records to database...';
      case 'complete':
        return 'Import completed successfully!';
      case 'error':
        return 'Import failed. Please try again.';
      default:
        return 'Processing data...';
    }
  };

  const getProgressColor = () => {
    switch (stage) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'import':
        return 'bg-purple-500';
      case 'validate':
        return 'bg-orange-500';
      case 'parse':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto border-2 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          {getStageIcon()}
        </div>
        <CardTitle className="text-lg">{getStageMessage()}</CardTitle>
        {fileName && (
          <p className="text-sm text-gray-600 font-medium">{fileName}</p>
        )}
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{animatedProgress}%</span>
            <span>{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Processing Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge variant={stage === 'complete' ? 'default' : stage === 'error' ? 'destructive' : 'secondary'}>
              {stage === 'complete' && <CheckCircle className="h-3 w-3 mr-1" />}
              {stage === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
              {stage === 'import' && <Database className="h-3 w-3 mr-1" />}
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Statistics */}
        {(stats.totalRows || stats.processedRows || stats.importedRecords) && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              {stats.totalRows !== undefined && (
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.totalRows.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Rows</div>
                </div>
              )}
              {stats.processedRows !== undefined && (
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{stats.processedRows.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Processed</div>
                </div>
              )}
              {stats.importedRecords !== undefined && (
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.importedRecords.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Imported</div>
                </div>
              )}
              {stats.duplicatesSkipped !== undefined && stats.duplicatesSkipped > 0 && (
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.duplicatesSkipped.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Duplicates</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Processing Animation */}
        {(stage === 'import' || stage === 'parse' || stage === 'validate') && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full animate-pulse" />
              <Skeleton className="h-3 flex-1 animate-pulse" style={{ animationDelay: '0.1s' }} />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <Skeleton className="h-3 flex-1 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              <Skeleton className="h-3 w-2/3 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        )}

        {/* Success Message */}
        {stage === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Data imported successfully! You can now view the results.
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">
                Import failed. Please check your file format and try again.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataImportLoader;