import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIRecommendations() {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["/api/recommendations"],
    queryFn: api.getRecommendations,
  });

  const generateMutation = useMutation({
    mutationFn: api.generateRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'match':
        return Lightbulb;
      case 'optimization':
        return TrendingUp;
      case 'risk':
      case 'deadline':
        return AlertTriangle;
      default:
        return Brain;
    }
  };

  const getColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-blue-200 bg-blue-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="h-5 w-5 text-secondary mr-2" />
            AI Recommendations
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Live
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "Generating..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {!recommendations || recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No AI recommendations available</p>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "Generating..." : "Generate Recommendations"}
            </Button>
          </div>
        ) : (
          recommendations.slice(0, 3).map((recommendation) => {
            const Icon = getIcon(recommendation.type);
            const colorClass = getColor(recommendation.priority);
            
            return (
              <div
                key={recommendation.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border ${colorClass}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  recommendation.priority === 'high' ? 'bg-red-500' :
                  recommendation.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                  {recommendation.actionable && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className={`p-0 mt-2 h-auto font-medium ${
                        recommendation.priority === 'high' ? 'text-red-600 hover:text-red-800' :
                        recommendation.priority === 'medium' ? 'text-blue-600 hover:text-blue-800' :
                        'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {recommendation.type === 'match' ? 'View Details' :
                       recommendation.type === 'optimization' ? 'Optimize Bid' :
                       recommendation.type === 'deadline' ? 'Take Action' : 'Learn More'} →
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
