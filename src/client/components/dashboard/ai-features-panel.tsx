import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchCode, PenTool, Calculator, Shield } from "lucide-react";

const features = [
  {
    icon: SearchCode,
    title: "Smart Tender Matching",
    description: "Automatically find tenders matching your capabilities",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: PenTool,
    title: "AI Bid Writing",
    description: "Generate optimized proposals with AI assistance",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Calculator,
    title: "Pricing Intelligence",
    description: "Get data-driven pricing recommendations",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Analyze and mitigate tender risks proactively",
    color: "bg-red-100 text-red-600",
  },
];

export default function AIFeaturesPanel() {
  return (
    <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center mr-2">
              <SearchCode className="h-4 w-4 text-white" />
            </div>
            AI-Powered Features
          </CardTitle>
          <Badge className="bg-purple-600 text-white">
            BETA
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          
          return (
            <div
              key={feature.title}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${feature.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                {feature.title}
              </h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </CardContent>
    </div>
  );
}
