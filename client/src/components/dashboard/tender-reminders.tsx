import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Bell, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TenderReminder = {
  id: string;
  tenderName: string;
  deadline: string;
  priority: "high" | "medium" | "low";
};

export default function TenderReminders() {
  const { data: reminders = [] } = useQuery<TenderReminder[]>({
    queryKey: ["/api/dashboard/reminders"],
  });

  // Fallback data for display
  const displayReminders = reminders.length > 0 ? reminders : [
    { id: "1", tenderName: "Name Of Tender", deadline: "2023-03-22", priority: "high" as const },
    { id: "2", tenderName: "Name Of Tender", deadline: "2023-03-22", priority: "medium" as const },
    { id: "3", tenderName: "Name Of Tender", deadline: "2023-03-22", priority: "high" as const },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-orange-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-300";
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="tender-reminders">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          Tender Reminder
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {displayReminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-4 border-l-4 ${getPriorityColor(reminder.priority)} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer`}
              data-testid={`reminder-${reminder.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100" data-testid={`reminder-name-${reminder.id}`}>
                    {reminder.tenderName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400" data-testid={`reminder-date-${reminder.id}`}>
                      {new Date(reminder.deadline).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
