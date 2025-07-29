import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface TenderMatchResult {
  score: number;
  reasons: string[];
  recommendations: string[];
}

export interface BidOptimizationResult {
  optimizedContent: string;
  improvements: string[];
  confidenceScore: number;
}

export interface PricingSuggestion {
  suggestedPrice: number;
  reasoning: string;
  competitiveAnalysis: string;
  winProbability: number;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
  riskScore: number;
}

export class OpenAIService {
  async analyzeTenderMatch(
    tenderDescription: string,
    companyCapabilities: string[]
  ): Promise<TenderMatchResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a tender analysis expert. Analyze how well a tender matches company capabilities and provide a score from 0-100 with detailed reasoning. Respond with JSON in this format: { 'score': number, 'reasons': string[], 'recommendations': string[] }",
          },
          {
            role: "user",
            content: `Tender: ${tenderDescription}\n\nCompany Capabilities: ${companyCapabilities.join(", ")}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        score: Math.max(0, Math.min(100, result.score || 0)),
        reasons: result.reasons || [],
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      throw new Error("Failed to analyze tender match: " + (error as Error).message);
    }
  }

  async optimizeBidContent(
    currentContent: string,
    tenderRequirements: string
  ): Promise<BidOptimizationResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a bid writing expert. Optimize the given bid content to better match tender requirements. Provide improved content and specific improvements made. Respond with JSON in this format: { 'optimizedContent': string, 'improvements': string[], 'confidenceScore': number }",
          },
          {
            role: "user",
            content: `Current Bid Content: ${currentContent}\n\nTender Requirements: ${tenderRequirements}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        optimizedContent: result.optimizedContent || currentContent,
        improvements: result.improvements || [],
        confidenceScore: Math.max(0, Math.min(100, result.confidenceScore || 0)),
      };
    } catch (error) {
      throw new Error("Failed to optimize bid content: " + (error as Error).message);
    }
  }

  async suggestPricing(
    tenderDescription: string,
    estimatedCosts: number,
    marketData?: string
  ): Promise<PricingSuggestion> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a pricing strategy expert. Analyze the tender and suggest optimal pricing. Consider market conditions and competitive positioning. Respond with JSON in this format: { 'suggestedPrice': number, 'reasoning': string, 'competitiveAnalysis': string, 'winProbability': number }",
          },
          {
            role: "user",
            content: `Tender: ${tenderDescription}\n\nEstimated Costs: $${estimatedCosts}\n\nMarket Data: ${marketData || "Not available"}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        suggestedPrice: result.suggestedPrice || estimatedCosts * 1.2,
        reasoning: result.reasoning || "Standard markup applied",
        competitiveAnalysis: result.competitiveAnalysis || "No competitive data available",
        winProbability: Math.max(0, Math.min(100, result.winProbability || 50)),
      };
    } catch (error) {
      throw new Error("Failed to suggest pricing: " + (error as Error).message);
    }
  }

  async assessRisk(
    tenderDescription: string,
    deadline: Date,
    tenderValue: number
  ): Promise<RiskAssessment> {
    try {
      const daysUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a risk assessment expert for tenders and bids. Analyze potential risks and provide mitigation strategies. Risk level should be 'low', 'medium', or 'high'. Respond with JSON in this format: { 'riskLevel': string, 'riskFactors': string[], 'mitigationStrategies': string[], 'riskScore': number }",
          },
          {
            role: "user",
            content: `Tender: ${tenderDescription}\n\nDays until deadline: ${daysUntilDeadline}\n\nTender value: $${tenderValue}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        riskLevel: ['low', 'medium', 'high'].includes(result.riskLevel) ? result.riskLevel : 'medium',
        riskFactors: result.riskFactors || [],
        mitigationStrategies: result.mitigationStrategies || [],
        riskScore: Math.max(0, Math.min(100, result.riskScore || 50)),
      };
    } catch (error) {
      throw new Error("Failed to assess risk: " + (error as Error).message);
    }
  }

  async generateBidContent(
    tenderDescription: string,
    companyProfile: string,
    requirements: string[]
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional bid writer. Create comprehensive bid content that addresses all tender requirements and showcases company capabilities effectively.",
          },
          {
            role: "user",
            content: `Create a professional bid proposal for the following tender:\n\nTender: ${tenderDescription}\n\nCompany Profile: ${companyProfile}\n\nRequirements to address: ${requirements.join(", ")}`,
          },
        ],
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      throw new Error("Failed to generate bid content: " + (error as Error).message);
    }
  }
}

export const openaiService = new OpenAIService();
