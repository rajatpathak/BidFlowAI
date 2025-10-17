import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, AlertCircle } from "lucide-react";

type EMDStatus = {
  underProcess: { count: number; amount: number };
  paid: { count: number; amount: number };
  refund: { count: number; amount: number };
  forfeited: { count: number; amount: number };
};

export default function EMDStatusCards() {
  const { data: status } = useQuery<EMDStatus>({
    queryKey: ["/api/finance/emd-status"],
  });

  const cards = [
    {
      title: "EMD",
      subtitle: "Under Process",
      paid: status?.underProcess.count || 0,
      paidAmount: status?.underProcess.amount || 0,
      refund: 0,
      refundAmount: 0,
      color: "blue",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200",
    },
    {
      title: "EMD & SD",
      subtitle: "Forfeited",
      paid: status?.forfeited.count || 0,
      paidAmount: status?.forfeited.amount || 0,
      refund: 0,
      refundAmount: 0,
      color: "red",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="emd-status-cards">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`${card.bgColor} ${card.borderColor} border`}
          data-testid={`emd-card-${card.subtitle.toLowerCase().replace(/\s/g, '-')}`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {card.color === "blue" ? (
                <DollarSign className="h-5 w-5 text-blue-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className={`${card.color === "blue" ? "text-blue-900" : "text-red-900"} dark:text-white`}>
                  {card.title}
                </div>
                <div className={`text-sm font-normal ${card.color === "blue" ? "text-blue-600" : "text-red-600"}`}>
                  {card.subtitle}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Paid EMD :</span>
                <span className={`font-semibold ${card.color === "blue" ? "text-blue-900" : "text-red-900"} dark:text-white`} data-testid={`paid-count-${index}`}>
                  {card.paid}({card.paidAmount.toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Refund EMD :</span>
                <span className={`font-semibold ${card.color === "blue" ? "text-blue-900" : "text-red-900"} dark:text-white`} data-testid={`refund-count-${index}`}>
                  {card.refund}({card.refundAmount.toLocaleString()})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
