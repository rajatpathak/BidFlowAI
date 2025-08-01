import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenderPipeline() {
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["/api/dashboard/pipeline"],
    queryFn: api.getPipelineData,
  });

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pipeline) {
    return (
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Tender Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Failed to load pipeline data</div>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { name: "Prospecting", count: pipeline.prospecting, color: "bg-blue-500" },
    { name: "Proposal", count: pipeline.proposal, color: "bg-yellow-500" },
    { name: "Negotiation", count: pipeline.negotiation, color: "bg-orange-500" },
    { name: "Won", count: pipeline.won, color: "bg-green-500" },
  ];

  const total = pipeline.prospecting + pipeline.proposal + pipeline.negotiation + pipeline.won;

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900">Tender Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {stages.map((stage) => {
            const percentage = total > 0 ? (stage.count / total) * 100 : 0;
            
            return (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                  <span className="text-sm text-gray-500">{stage.count} tenders</span>
                </div>
                <Progress value={percentage} className="h-2">
                  <div
                    className={`h-full rounded-full transition-all ${stage.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </Progress>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              ${(pipeline.totalValue / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-600">Pipeline Value</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{pipeline.avgDays}</p>
            <p className="text-sm text-gray-600">Avg. Days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
