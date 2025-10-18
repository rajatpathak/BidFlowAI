import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="calendar-widget">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={previousMonth}
              data-testid="button-previous-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <div
              key={index}
              className={`
                text-center py-2 text-sm rounded-md cursor-pointer
                ${day ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                ${isToday(day) ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}
                ${day && !isToday(day) ? 'text-gray-700 dark:text-gray-300' : ''}
              `}
              data-testid={day ? `calendar-day-${day}` : undefined}
            >
              {day || ""}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
