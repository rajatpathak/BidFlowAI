import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Sparkles, 
  PenTool, 
  Target, 
  DollarSign,
  Shield,
  Clock,
  TrendingUp,
  Copy,
  Download
} from "lucide-react";

interface BidAssistantProps {
  tenderId: string;
  tenderTitle: string;
  tenderDescription: string;
  tenderValue: number;
  organization: string;
}

export default function BidAssistant({ 
  tenderId, 
  tenderTitle, 
  tenderDescription, 
  tenderValue, 
  organization 
}: BidAssistantProps) {
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [pricingSuggestion, setPricingSuggestion] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const { toast } = useToast();

  // Generate bid content
  const generateBidMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/generate-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId })
      });
      if (!response.ok) throw new Error('Failed to generate bid content');
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.bidContent);
      toast({
        title: "Bid Content Generated",
        description: "AI has generated professional bid content for this tender",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate bid content",
        variant: "destructive",
      });
    }
  });

  // Analyze tender compatibility
  const analyzeTenderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/analyze-tender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenderDescription,
          companyCapabilities: [
            "Web Application Development",
            "Mobile App Development",
            "Enterprise Software Solutions",
            "Database Management Systems",
            "Cloud Infrastructure"
          ]
        })
      });
      if (!response.ok) throw new Error('Failed to analyze tender');
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis Complete",
        description: `Compatibility score: ${data.score}%`,
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze tender compatibility",
        variant: "destructive",
      });
    }
  });

  // Get pricing suggestion
  const pricingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/pricing-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenderDescription,
          estimatedCosts: tenderValue * 0.7, // Estimate 70% of tender value as costs
          marketData: `Organization: ${organization}, Value: ₹${(tenderValue / 100000).toFixed(2)} Cr`
        })
      });
      if (!response.ok) throw new Error('Failed to get pricing suggestion');
      return response.json();
    },
    onSuccess: (data) => {
      setPricingSuggestion(data);
      toast({
        title: "Pricing Analysis Complete",
        description: `Suggested bid: ₹${(data.suggestedPrice / 100000).toFixed(2)} Cr`,
      });
    },
    onError: () => {
      toast({
        title: "Pricing Analysis Failed",
        description: "Failed to generate pricing suggestion",
        variant: "destructive",
      });
    }
  });

  // Risk assessment
  const riskMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenderDescription,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          tenderValue
        })
      });
      if (!response.ok) throw new Error('Failed to assess risks');
      return response.json();
    },
    onSuccess: (data) => {
      setRiskAssessment(data);
      toast({
        title: "Risk Assessment Complete",
        description: `Risk level: ${data.riskLevel}`,
      });
    },
    onError: () => {
      toast({
        title: "Risk Assessment Failed",
        description: "Failed to assess tender risks",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  const downloadBidContent = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bid-${tenderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Bid content has been downloaded",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-900">
            <Brain className="h-6 w-6" />
            AI Bid Assistant
            <Badge className="bg-purple-600 text-white">POWERED BY GPT-4</Badge>
          </CardTitle>
          <p className="text-purple-700">
            Get AI-powered insights, analysis, and bid content generation for {tenderTitle}
          </p>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={() => generateBidMutation.mutate()}
          disabled={generateBidMutation.isPending}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <PenTool className="h-4 w-4" />
          {generateBidMutation.isPending ? "Generating..." : "Generate Bid"}
        </Button>

        <Button
          onClick={() => analyzeTenderMutation.mutate()}
          disabled={analyzeTenderMutation.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Target className="h-4 w-4" />
          {analyzeTenderMutation.isPending ? "Analyzing..." : "Analyze Match"}
        </Button>

        <Button
          onClick={() => pricingMutation.mutate()}
          disabled={pricingMutation.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {pricingMutation.isPending ? "Calculating..." : "Price Analysis"}
        </Button>

        <Button
          onClick={() => riskMutation.mutate()}
          disabled={riskMutation.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          {riskMutation.isPending ? "Assessing..." : "Risk Analysis"}
        </Button>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tender Analysis */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Compatibility Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Match Score</span>
                <Badge className={analysisResult.score >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {analysisResult.score}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Key Strengths:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysisResult.strengths?.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {analysisResult.gaps && analysisResult.gaps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Areas to Address:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysisResult.gaps.map((gap: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Suggestion */}
        {pricingSuggestion && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Pricing Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tender Value</span>
                  <span className="font-medium">₹{(tenderValue / 100000).toFixed(2)} Cr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Suggested Bid</span>
                  <span className="font-semibold text-blue-600">₹{(pricingSuggestion.suggestedPrice / 100000).toFixed(2)} Cr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Win Probability</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {pricingSuggestion.winProbability}%
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Pricing Strategy:</h4>
                <p className="text-sm text-gray-600">{pricingSuggestion.strategy}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Assessment */}
        {riskAssessment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Risk Level</span>
                <Badge className={
                  riskAssessment.riskLevel === 'Low' ? "bg-green-100 text-green-800" :
                  riskAssessment.riskLevel === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }>
                  {riskAssessment.riskLevel}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Risk Factors:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {riskAssessment.risks?.map((risk: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Mitigation Strategies:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {riskAssessment.mitigations?.map((mitigation: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {mitigation}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Generated Bid Content */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Generated Bid Content
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedContent)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadBidContent}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="AI-generated bid content will appear here..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}