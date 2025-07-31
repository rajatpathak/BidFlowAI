import OpenAI from "openai";
import { db } from '../db.js';
import { tenders, aiRecommendations, users } from '../../shared/schema.js';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface CompanyProfile {
  name: string;
  capabilities: string[];
  pastProjects: string[];
  certifications: string[];
  teamSize: number;
  annualTurnover: number;
  businessSectors: string[];
  geographicPresence: string[];
}

export interface TenderRecommendation {
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

export interface MarketIntelligence {
  averageBidValue: number;
  competitionLevel: string;
  historicalWinRate: number;
  trendingKeywords: string[];
  emergingOpportunities: string[];
}

export class AIRecommendationEngine {
  private companyProfile: CompanyProfile = {
    name: "Appentus Technologies",
    capabilities: [
      "Web Application Development",
      "Mobile App Development", 
      "Enterprise Software Solutions",
      "Database Management Systems",
      "Cloud Infrastructure",
      "API Development",
      "UI/UX Design",
      "Digital Transformation",
      "E-governance Solutions",
      "Payment Gateway Integration"
    ],
    pastProjects: [
      "Municipal Tax Collection System",
      "Healthcare Management Platform",
      "Educational Portal Development",
      "Financial Services Application",
      "Supply Chain Management System"
    ],
    certifications: [
      "ISO 9001:2015",
      "ISO 27001:2013", 
      "CMMI Level 3",
      "Microsoft Gold Partner",
      "AWS Advanced Consulting Partner"
    ],
    teamSize: 50,
    annualTurnover: 5000000, // 5 Cr
    businessSectors: [
      "Information Technology",
      "Software Development",
      "Digital Services",
      "E-governance",
      "Fintech"
    ],
    geographicPresence: [
      "Karnataka",
      "Tamil Nadu", 
      "Andhra Pradesh",
      "Maharashtra",
      "Delhi NCR"
    ]
  };

  async generateTenderRecommendations(userId?: string): Promise<TenderRecommendation[]> {
    try {
      // Get active tenders
      const activeTenders = await db
        .select()
        .from(tenders)
        .where(eq(tenders.status, 'active'))
        .orderBy(desc(tenders.createdAt))
        .limit(50);

      console.log(`Analyzing ${activeTenders.length} active tenders for recommendations`);

      const recommendations: TenderRecommendation[] = [];

      // Process tenders in batches for better performance
      for (const tender of activeTenders.slice(0, 10)) {
        try {
          const recommendation = await this.analyzeSingleTender(tender);
          if (recommendation.score > 30) { // Only include viable recommendations
            recommendations.push(recommendation);
          }
        } catch (error) {
          console.error(`Error analyzing tender ${tender.id}:`, error);
        }
      }

      // Sort by score and priority
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.score - a.score;
      });

      // Store recommendations in database
      await this.storeRecommendations(recommendations);

      return recommendations.slice(0, 8); // Return top 8 recommendations
    } catch (error) {
      console.error('Error generating tender recommendations:', error);
      return [];
    }
  }

  private async analyzeSingleTender(tender: any): Promise<TenderRecommendation> {
    const prompt = this.buildAnalysisPrompt(tender);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert tender analysis AI for Appentus Technologies. Analyze tenders and provide strategic recommendations in JSON format.
          
          Company Profile:
          - Name: ${this.companyProfile.name}
          - Annual Turnover: ₹${this.companyProfile.annualTurnover / 100000} Cr
          - Team Size: ${this.companyProfile.teamSize} professionals
          - Capabilities: ${this.companyProfile.capabilities.join(', ')}
          - Certifications: ${this.companyProfile.certifications.join(', ')}
          - Business Sectors: ${this.companyProfile.businessSectors.join(', ')}
          - Geographic Presence: ${this.companyProfile.geographicPresence.join(', ')}
          
          Respond with JSON in this exact format:
          {
            "score": number (0-100),
            "type": "high_match" | "strategic" | "learning" | "partnership",
            "priority": "high" | "medium" | "low", 
            "reasons": ["reason1", "reason2", "reason3"],
            "actionItems": ["action1", "action2", "action3"],
            "estimatedWinProbability": number (0-100),
            "suggestedBidAmount": number | null,
            "riskFactors": ["risk1", "risk2"],
            "competitiveAdvantage": ["advantage1", "advantage2"],
            "requiredResources": ["resource1", "resource2"]
          }`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      tenderId: tender.id,
      score: analysis.score || 0,
      type: analysis.type || 'learning',
      priority: analysis.priority || 'medium',
      reasons: analysis.reasons || [],
      actionItems: analysis.actionItems || [],
      estimatedWinProbability: analysis.estimatedWinProbability || 0,
      suggestedBidAmount: analysis.suggestedBidAmount,
      riskFactors: analysis.riskFactors || [],
      competitiveAdvantage: analysis.competitiveAdvantage || [],
      requiredResources: analysis.requiredResources || []
    };
  }

  private buildAnalysisPrompt(tender: any): string {
    const requirements = Array.isArray(tender.requirements) ? tender.requirements : [];
    const location = requirements.find((r: any) => r.location)?.location || 'Not specified';
    const reference = requirements.find((r: any) => r.reference)?.reference || 'Not specified';
    
    return `
TENDER ANALYSIS REQUEST:

Title: ${tender.title}
Organization: ${tender.organization}
Value: ₹${(tender.value / 100000).toFixed(2)} Cr
Deadline: ${new Date(tender.deadline).toLocaleDateString()}
Location: ${location}
Reference: ${reference}
AI Score: ${tender.aiScore}%
Source: ${tender.source}

Description: ${tender.description || 'No description available'}

Requirements: ${JSON.stringify(requirements, null, 2)}

ANALYSIS TASKS:
1. Match Analysis: How well does this tender match our capabilities?
2. Strategic Value: What strategic value does this tender offer?
3. Win Probability: What's our realistic chance of winning?
4. Risk Assessment: What are the potential risks and challenges?
5. Competitive Position: What advantages do we have?
6. Resource Requirements: What resources would we need?
7. Bid Strategy: What should our approach be?
8. Financial Viability: Is this financially attractive?

Consider:
- Our annual turnover (₹5 Cr) vs tender value
- Geographic presence and project location
- Technical capabilities match
- Certification requirements
- Timeline feasibility
- Competition level
- Market opportunity
`;
  }

  private async storeRecommendations(recommendations: TenderRecommendation[]): Promise<void> {
    try {
      // Clear existing recommendations older than 24 hours
      await db.delete(aiRecommendations)
        .where(sql`created_at < NOW() - INTERVAL '24 hours'`);

      // Store new recommendations
      for (const rec of recommendations) {
        await db.insert(aiRecommendations).values({
          tenderId: rec.tenderId,
          type: rec.type,
          title: `${rec.type.toUpperCase()}: ${rec.score}% Match`,
          description: rec.reasons.join('. '),
          priority: rec.priority,
          actionable: true,
          metadata: {
            score: rec.score,
            winProbability: rec.estimatedWinProbability,
            suggestedBidAmount: rec.suggestedBidAmount,
            actionItems: rec.actionItems,
            riskFactors: rec.riskFactors,
            competitiveAdvantage: rec.competitiveAdvantage,
            requiredResources: rec.requiredResources
          }
        }).onConflictDoNothing();
      }
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  }

  async getMarketIntelligence(): Promise<MarketIntelligence> {
    try {
      // Get market data from recent tenders
      const recentTenders = await db
        .select()
        .from(tenders)
        .where(sql`created_at > NOW() - INTERVAL '30 days'`)
        .orderBy(desc(tenders.createdAt));

      const values = recentTenders.map(t => t.value).filter(v => v > 0);
      const averageBidValue = values.length > 0 ? 
        values.reduce((a, b) => a + b, 0) / values.length : 0;

      // Analyze with AI for deeper insights
      const prompt = `
Analyze the following tender market data and provide market intelligence:

Recent Tenders (last 30 days): ${recentTenders.length}
Average Tender Value: ₹${(averageBidValue / 100000).toFixed(2)} Cr
Tender Titles: ${recentTenders.slice(0, 10).map(t => t.title).join('; ')}

Provide market intelligence in JSON format:
{
  "competitionLevel": "low" | "medium" | "high",
  "historicalWinRate": number (0-100),
  "trendingKeywords": ["keyword1", "keyword2", "keyword3"],
  "emergingOpportunities": ["opportunity1", "opportunity2", "opportunity3"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a market intelligence analyst for government tenders in India. Provide strategic market insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const intelligence = JSON.parse(response.choices[0].message.content || '{}');

      return {
        averageBidValue: averageBidValue,
        competitionLevel: intelligence.competitionLevel || 'medium',
        historicalWinRate: intelligence.historicalWinRate || 15,
        trendingKeywords: intelligence.trendingKeywords || [],
        emergingOpportunities: intelligence.emergingOpportunities || []
      };
    } catch (error) {
      console.error('Error getting market intelligence:', error);
      return {
        averageBidValue: 0,
        competitionLevel: 'medium',
        historicalWinRate: 15,
        trendingKeywords: [],
        emergingOpportunities: []
      };
    }
  }

  async generateBidContent(tenderId: string): Promise<string> {
    try {
      const [tender] = await db
        .select()
        .from(tenders)
        .where(eq(tenders.id, tenderId))
        .limit(1);

      if (!tender) {
        throw new Error('Tender not found');
      }

      const prompt = `
Generate a professional bid content for the following tender:

Title: ${tender.title}
Organization: ${tender.organization}
Value: ₹${(tender.value / 100000).toFixed(2)} Cr
Description: ${tender.description}

Company Profile: ${this.companyProfile.name}
Capabilities: ${this.companyProfile.capabilities.join(', ')}
Experience: ${this.companyProfile.pastProjects.join(', ')}

Create a compelling bid proposal that highlights our strengths and addresses the tender requirements.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional bid writer for IT services tenders. Create compelling, detailed bid proposals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating bid content:', error);
      return '';
    }
  }
}

export const aiRecommendationEngine = new AIRecommendationEngine();