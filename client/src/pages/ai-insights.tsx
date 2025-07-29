import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Brain, Search, PenTool, Calculator, Shield, Lightbulb } from "lucide-react";

export default function AIInsights() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [riskResult, setRiskResult] = useState<any>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: api.analyzeTender,
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis Complete",
        description: `Match score: ${data.score}%`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze tender",
        variant: "destructive",
      });
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: api.optimizeBid,
    onSuccess: (data) => {
      setOptimizationResult(data);
      toast({
        title: "Optimization Complete",
        description: `Confidence score: ${data.confidenceScore}%`,
      });
    },
  });

  const pricingMutation = useMutation({
    mutationFn: api.getPricingSuggestion,
    onSuccess: (data) => {
      setPricingResult(data);
      toast({
        title: "Pricing Analysis Complete",
        description: `Win probability: ${data.winProbability}%`,
      });
    },
  });

  const riskMutation = useMutation({
    mutationFn: api.assessRisk,
    onSuccess: (data) => {
      setRiskResult(data);
      toast({
        title: "Risk Assessment Complete",
        description: `Risk level: ${data.riskLevel}`,
      });
    },
  });

  const handleAnalysis = (formData: FormData) => {
    const tenderDescription = formData.get("tenderDescription") as string;
    if (!tenderDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide tender description",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate({
      tenderDescription,
      companyCapabilities: ["Software Development", "Cloud Computing", "Project Management", "Cybersecurity"],
    });
  };

  const handleOptimization = (formData: FormData) => {
    const currentContent = formData.get("currentContent") as string;
    const requirements = formData.get("requirements") as string;
    
    if (!currentContent.trim() || !requirements.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both current content and requirements",
        variant: "destructive",
      });
      return;
    }

    optimizeMutation.mutate({
      currentContent,
      tenderRequirements: requirements,
    });
  };

  const handlePricing = (formData: FormData) => {
    const tenderDescription = formData.get("tenderDescription") as string;
    const estimatedCosts = parseFloat(formData.get("estimatedCosts") as string);
    
    if (!tenderDescription.trim() || !estimatedCosts) {
      toast({
        title: "Missing Information",
        description: "Please provide tender description and estimated costs",
        variant: "destructive",
      });
      return;
    }

    pricingMutation.mutate({
      tenderDescription,
      estimatedCosts,
      marketData: formData.get("marketData") as string || undefined,
    });
  };

  const handleRiskAssessment = (formData: FormData) => {
    const tenderDescription = formData.get("tenderDescription") as string;
    const deadline = formData.get("deadline") as string;
    const tenderValue = parseFloat(formData.get("tenderValue") as string);
    
    if (!tenderDescription.trim() || !deadline || !tenderValue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    riskMutation.mutate({
      tenderDescription,
      deadline,
      tenderValue,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Brain className="h-6 w-6 mr-2 text-purple-600" />
                AI Insights
              </h1>
              <p className="text-gray-600">Leverage AI-powered tools to optimize your bidding process</p>
            </div>
            <Badge className="bg-purple-600 text-white">
              BETA
            </Badge>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Tender Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center space-x-2">
              <PenTool className="h-4 w-4" />
              <span>Bid Optimization</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Pricing Intelligence</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Risk Assessment</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2 text-blue-600" />
                    Smart Tender Matching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleAnalysis(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tender Description
                      </label>
                      <Textarea
                        name="tenderDescription"
                        placeholder="Paste the tender description here..."
                        className="min-h-[150px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={analyzeMutation.isPending}
                    >
                      {analyzeMutation.isPending ? "Analyzing..." : "Analyze Compatibility"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${
                          analysisResult.score >= 80 ? 'text-green-600' :
                          analysisResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analysisResult.score}%
                        </div>
                        <p className="text-gray-600">Compatibility Score</p>
                      </div>

                      {analysisResult.reasons.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Strengths:</h4>
                          <ul className="space-y-1">
                            {analysisResult.reasons.map((reason: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <Lightbulb className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisResult.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                          <ul className="space-y-1">
                            {analysisResult.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <Brain className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="optimization">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PenTool className="h-5 w-5 mr-2 text-green-600" />
                    AI Bid Writing Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleOptimization(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Bid Content
                      </label>
                      <Textarea
                        name="currentContent"
                        placeholder="Paste your current bid content here..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tender Requirements
                      </label>
                      <Textarea
                        name="requirements"
                        placeholder="List the tender requirements..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={optimizeMutation.isPending}
                    >
                      {optimizeMutation.isPending ? "Optimizing..." : "Optimize Bid Content"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {optimizationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-900">Optimized Content</h4>
                          <Badge className="bg-green-100 text-green-800">
                            {optimizationResult.confidenceScore}% Confidence
                          </Badge>
                        </div>
                        <div className="text-sm text-green-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {optimizationResult.optimizedContent}
                        </div>
                      </div>

                      {optimizationResult.improvements.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Improvements:</h4>
                          <ul className="space-y-1">
                            {optimizationResult.improvements.map((improvement: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <PenTool className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-yellow-600" />
                    Pricing Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handlePricing(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tender Description
                      </label>
                      <Textarea
                        name="tenderDescription"
                        placeholder="Brief description of the tender..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Costs ($)
                      </label>
                      <Input
                        name="estimatedCosts"
                        type="number"
                        placeholder="100000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Market Data (Optional)
                      </label>
                      <Textarea
                        name="marketData"
                        placeholder="Any competitive or market information..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={pricingMutation.isPending}
                    >
                      {pricingMutation.isPending ? "Analyzing..." : "Get Pricing Suggestion"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {pricingResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">Suggested Price</h4>
                        <div className="text-2xl font-bold text-yellow-800">
                          ${pricingResult.suggestedPrice.toLocaleString()}
                        </div>
                        <div className="flex items-center mt-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {pricingResult.winProbability}% Win Probability
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Reasoning:</h4>
                        <p className="text-sm text-gray-600">{pricingResult.reasoning}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Competitive Analysis:</h4>
                        <p className="text-sm text-gray-600">{pricingResult.competitiveAnalysis}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="risk">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleRiskAssessment(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tender Description
                      </label>
                      <Textarea
                        name="tenderDescription"
                        placeholder="Brief description of the tender..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deadline
                      </label>
                      <Input
                        name="deadline"
                        type="date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tender Value ($)
                      </label>
                      <Input
                        name="tenderValue"
                        type="number"
                        placeholder="500000"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={riskMutation.isPending}
                    >
                      {riskMutation.isPending ? "Assessing..." : "Assess Risk"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {riskResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className={`border rounded-lg p-4 ${
                        riskResult.riskLevel === 'low' ? 'bg-green-50 border-green-200' :
                        riskResult.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium ${
                            riskResult.riskLevel === 'low' ? 'text-green-900' :
                            riskResult.riskLevel === 'medium' ? 'text-yellow-900' :
                            'text-red-900'
                          }`}>
                            Risk Level: {riskResult.riskLevel.toUpperCase()}
                          </h4>
                          <Badge className={
                            riskResult.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                            riskResult.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            Score: {riskResult.riskScore}/100
                          </Badge>
                        </div>
                      </div>

                      {riskResult.riskFactors.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Risk Factors:</h4>
                          <ul className="space-y-1">
                            {riskResult.riskFactors.map((factor: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <Shield className="h-4 w-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {riskResult.mitigationStrategies.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Mitigation Strategies:</h4>
                          <ul className="space-y-1">
                            {riskResult.mitigationStrategies.map((strategy: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <Lightbulb className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                                {strategy}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
