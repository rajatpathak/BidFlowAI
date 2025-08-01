import { apiRequest } from "./queryClient";
import type { 
  Tender, 
  InsertTender, 
  AIRecommendation, 
  Document,
  DashboardStats,
  PipelineData 
} from "@shared/schema";

export const api = {
  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> => 
    fetch("/api/dashboard/stats").then(res => res.json()),
  
  getPipelineData: (): Promise<PipelineData> => 
    fetch("/api/dashboard/pipeline").then(res => res.json()),

  // Tenders
  getTenders: (): Promise<Tender[]> => 
    fetch("/api/tenders").then(res => res.json()),
  
  getTender: (id: string): Promise<Tender> => 
    fetch(`/api/tenders/${id}`).then(res => res.json()),
  
  createTender: (tender: InsertTender): Promise<Tender> => 
    apiRequest("POST", "/api/tenders", tender).then(res => res.json()),
  
  updateTender: (id: string, updates: Partial<Tender>): Promise<Tender> => 
    apiRequest("PATCH", `/api/tenders/${id}`, updates).then(res => res.json()),
  
  deleteTender: (id: string): Promise<void> => 
    apiRequest("DELETE", `/api/tenders/${id}`).then(() => {}),

  // AI Recommendations
  getRecommendations: (): Promise<AIRecommendation[]> => 
    fetch("/api/recommendations").then(res => res.json()),
  
  generateRecommendations: (): Promise<AIRecommendation[]> => 
    apiRequest("POST", "/api/ai/generate-recommendations").then(res => res.json()),

  // AI Services
  analyzeTender: (data: { tenderDescription: string; companyCapabilities: string[] }) => 
    apiRequest("POST", "/api/ai/analyze-tender", data).then(res => res.json()),
  
  optimizeBid: (data: { currentContent: string; tenderRequirements: string }) => 
    apiRequest("POST", "/api/ai/optimize-bid", data).then(res => res.json()),
  
  getPricingSuggestion: (data: { tenderDescription: string; estimatedCosts: number; marketData?: string }) => 
    apiRequest("POST", "/api/ai/pricing-suggestion", data).then(res => res.json()),
  
  assessRisk: (data: { tenderDescription: string; deadline: string; tenderValue: number }) => 
    apiRequest("POST", "/api/ai/risk-assessment", data).then(res => res.json()),
  
  generateBid: (data: { tenderDescription: string; companyProfile: string; requirements: string[] }) => 
    apiRequest("POST", "/api/ai/generate-bid", data).then(res => res.json()),

  // Documents
  getDocuments: (tenderId?: string): Promise<Document[]> => 
    fetch(`/api/documents${tenderId ? `?tenderId=${tenderId}` : ""}`).then(res => res.json()),
  
  uploadDocument: (file: File, tenderId?: string): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    if (tenderId) formData.append('tenderId', tenderId);
    
    return fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    }).then(res => res.json());
  },
  
  deleteDocument: (id: string): Promise<void> => 
    apiRequest("DELETE", `/api/documents/${id}`).then(() => {}),
};
