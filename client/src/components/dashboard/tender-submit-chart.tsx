import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type SubmitData = {
  name: string;
  value: number;
};

export default function TenderSubmitChart() {
  const { data: chartData = [] } = useQuery<SubmitData[]>({
    queryKey: ["/api/dashboard/submit-status"],
  });

  // Fallback data for display
  const displayData = chartData.length > 0 ? chartData : [
    { name: "Tarun", value: 64366.77 },
    { name: "Tarun", value: 45000 },
    { name: "Tarun", value: 52000 },
    { name: "Tarun", value: 48000 },
    { name: "Tarun", value: 61000 },
    { name: "Tarun", value: 55000 },
    { name: "Tarun", value: 59000 },
    { name: "Tarun", value: 62000 },
    { name: "Tarun", value: 47000 },
    { name: "Tarun", value: 51000 },
    { name: "Tarun", value: 58000 },
    { name: "Tarun", value: 63000 },
  ];

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="tender-submit-chart">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold">Tender Submit Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
            />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
