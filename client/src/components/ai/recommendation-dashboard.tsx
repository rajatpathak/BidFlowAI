import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Lightbulb, 
  DollarSign,
  Users,
  Clock,
  Award,
  BarChart3,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface TenderRecommendation {
  tenderId: string;
  score: number;
  type: 'high_match' | 'strategic' | 'learning' | 'partnership';
  priority: 'high' | 'medium' | 'low';
  reasons: string[];
  actionItems: string[];
  estimatedWinProbability: number;
  suggestedBidAmount?: number;
  riskFactors: string[];
  competitiveAdvantage: string[];
  requiredResources: string[];
}

interface MarketIntelligence {
  averageBidValue: number;
  competitionLevel: string;
  historicalWinRate: number;
  trendingKeywords: string[];
  emergingOpportunities: string[];
}

export default function RecommendationDashboard() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<TenderRecommendation | null>(null);
  const { toast } = useToast();

  // Fetch market intelligence
  const { data: marketIntelligence, isLoading: marketLoading } = useQuery<MarketIntelligence>({
    queryKey: ["/api/ai/market-intelligence"],
  });

  // Generate recommendations mutation
  const generateRecommendations = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate recommendations');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Recommendations Generated",
        description: `Generated ${data.count} intelligent recommendations based on current market analysis`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      setRecommendations(data.recommendations || []);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI recommendations",
        variant: "destructive",
      });
    }
  });

  const [recommendations, setRecommendations] = useState<TenderRecommendation[]>([]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'high_match': return Target;
      case 'strategic': return TrendingUp;
      case 'learning': return Lightbulb;
      case 'partnership': return Users;
      default: return Brain;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'high_match': return 'bg-green-100 text-green-800 border-green-200';
      case 'strategic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'learning': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'partnership': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Recommendation Engine
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent tender analysis and strategic recommendations powered by AI
          </p>
        </div>
        <Button 
          onClick={() => generateRecommendations.mutate()}
          disabled={generateRecommendations.isPending}
          className="flex items-center gap-2"
        >
          {generateRecommendations.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generateRecommendations.isPending ? 'Analyzing...' : 'Generate Recommendations'}
        </Button>
      </div>

      {/* Market Intelligence Overview */}
      {marketIntelligence && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Tender Value</p>
                  <p className="text-lg font-semibold">₹{(marketIntelligence.averageBidValue / 100000).toFixed(1)} Cr</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Competition Level</p>
                  <p className="text-lg font-semibold capitalize">{marketIntelligence.competitionLevel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Historical Win Rate</p>
                  <p className="text-lg font-semibold">{marketIntelligence.historicalWinRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Trending Keywords</p>
                  <p className="text-lg font-semibold">{marketIntelligence.trendingKeywords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="market">Market Intelligence</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Available</h3>
                <p className="text-gray-600 mb-4">
                  Generate AI-powered tender recommendations to get started with intelligent bid analysis.
                </p>
                <Button 
                  onClick={() => generateRecommendations.mutate()}
                  disabled={generateRecommendations.isPending}
                >
                  {generateRecommendations.isPending ? 'Generating...' : 'Generate Recommendations'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((rec, index) => {
                const TypeIcon = getTypeIcon(rec.type);
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedRecommendation(rec)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-5 w-5 text-purple-600" />
                          <Badge className={getTypeColor(rec.type)}>
                            {rec.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Match Score</span>
                          <span className="text-sm font-semibold">{rec.score}%</span>
                        </div>
                        <Progress value={rec.score} className="h-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Win Probability</span>
                        <span className="font-medium text-green-600">{rec.estimatedWinProbability}%</span>
                      </div>
                      
                      {rec.suggestedBidAmount && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Suggested Bid</span>
                          <span className="font-medium">₹{(rec.suggestedBidAmount / 100000).toFixed(2)} Cr</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Key Reasons:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {rec.reasons.slice(0, 3).map((reason, idx) => (
                            <li key={idx} className="flex items-start space-x-1">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {rec.competitiveAdvantage.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Competitive Advantages:</h4>
                          <div className="flex flex-wrap gap-1">
                            {rec.competitiveAdvantage.slice(0, 3).map((advantage, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {advantage}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          {marketIntelligence && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trending Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {marketIntelligence.trendingKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Emerging Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {marketIntelligence.emergingOpportunities.map((opportunity, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">→</span>
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategic Insights Coming Soon</h3>
              <p className="text-gray-600">
                Advanced analytics and strategic insights will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Recommendation Modal would go here */}
    </div>
  );
}